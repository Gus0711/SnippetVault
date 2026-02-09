import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db, users, invitations, tags, snippetTags } from '$lib/server/db';
import { eq, isNull, gt, and, sql } from 'drizzle-orm';
import { verifyPassword, hashPassword } from '$lib/server/auth/password';
import { invalidateAllUserSessions } from '$lib/server/auth';
import { encrypt } from '$lib/server/crypto';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/auth/login');
	}

	// Get user with API key
	const user = await db
		.select()
		.from(users)
		.where(eq(users.id, locals.user.id))
		.get();

	if (!user) {
		redirect(302, '/auth/login');
	}

	const isAdmin = user.role === 'admin';

	// Admin data
	let pendingInvitations: Array<{
		id: string;
		email: string;
		token: string;
		expiresAt: Date;
		inviterName: string | null;
	}> = [];
	let allUsers: Array<{
		id: string;
		email: string;
		name: string;
		role: string;
		createdAt: Date;
	}> = [];

	if (isAdmin) {
		// Get pending invitations
		const invitationsResult = await db
			.select({
				id: invitations.id,
				email: invitations.email,
				token: invitations.token,
				expiresAt: invitations.expiresAt,
				invitedBy: invitations.invitedBy,
				inviterName: users.name
			})
			.from(invitations)
			.leftJoin(users, eq(invitations.invitedBy, users.id))
			.where(and(isNull(invitations.usedAt), gt(invitations.expiresAt, new Date())))
			.all();

		pendingInvitations = invitationsResult.map((inv) => ({
			id: inv.id,
			email: inv.email,
			token: inv.token,
			expiresAt: inv.expiresAt,
			inviterName: inv.inviterName
		}));

		// Get all users
		allUsers = await db
			.select({
				id: users.id,
				email: users.email,
				name: users.name,
				role: users.role,
				createdAt: users.createdAt
			})
			.from(users)
			.all();
	}

	// Get user's tags with usage count
	const userTags = await db
		.select({
			id: tags.id,
			name: tags.name,
			color: tags.color
		})
		.from(tags)
		.where(eq(tags.userId, locals.user.id))
		.all();

	// Get usage count for each tag
	const tagUsageCounts = await db
		.select({
			tagId: snippetTags.tagId,
			count: sql<number>`count(*)`.as('count')
		})
		.from(snippetTags)
		.groupBy(snippetTags.tagId)
		.all();

	const usageMap = new Map(tagUsageCounts.map(t => [t.tagId, t.count]));

	const tagsWithUsage = userTags.map(tag => ({
		...tag,
		usageCount: usageMap.get(tag.id) || 0
	}));

	return {
		apiKey: user.apiKey,
		isAdmin,
		pendingInvitations,
		allUsers,
		currentUserId: user.id,
		tags: tagsWithUsage,
		hasGithubToken: !!user.githubToken
	};
};

export const actions: Actions = {
	changePassword: async ({ locals, request }) => {
		if (!locals.user) {
			return fail(401, { passwordError: 'settings.error.notAuthenticated' });
		}

		const formData = await request.formData();
		const currentPassword = formData.get('currentPassword')?.toString();
		const newPassword = formData.get('newPassword')?.toString();
		const confirmPassword = formData.get('confirmPassword')?.toString();

		if (!currentPassword || !newPassword || !confirmPassword) {
			return fail(400, { passwordError: 'settings.error.allFieldsRequired' });
		}

		if (newPassword.length < 8) {
			return fail(400, { passwordError: 'settings.error.passwordTooShort' });
		}

		if (newPassword !== confirmPassword) {
			return fail(400, { passwordError: 'settings.error.passwordMismatch' });
		}

		// Get user with password hash
		const user = await db
			.select()
			.from(users)
			.where(eq(users.id, locals.user.id))
			.get();

		if (!user) {
			return fail(404, { passwordError: 'settings.error.userNotFound' });
		}

		// Verify current password
		if (!verifyPassword(currentPassword, user.passwordHash)) {
			return fail(400, { passwordError: 'settings.error.wrongPassword' });
		}

		try {
			// Update password
			const newPasswordHash = hashPassword(newPassword);
			await db
				.update(users)
				.set({
					passwordHash: newPasswordHash,
					updatedAt: new Date()
				})
				.where(eq(users.id, locals.user.id));

			// Optionally invalidate all other sessions (keep current one)
			// await invalidateAllUserSessions(locals.user.id);

			return { passwordSuccess: true };
		} catch (error) {
			console.error('Error changing password:', error);
			return fail(500, { passwordError: 'settings.error.passwordChangeError' });
		}
	},

	regenerateApiKey: async ({ locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'settings.error.notAuthenticated' });
		}

		try {
			// Generate new API key (64 chars hex)
			const newApiKey = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');

			await db
				.update(users)
				.set({
					apiKey: newApiKey,
					updatedAt: new Date()
				})
				.where(eq(users.id, locals.user.id));

			return { success: true, apiKey: newApiKey };
		} catch (error) {
			console.error('Error regenerating API key:', error);
			return fail(500, { error: 'settings.error.apiKeyRegenError' });
		}
	},

	createInvitation: async ({ locals, request }) => {
		if (!locals.user) {
			return fail(401, { error: 'settings.error.notAuthenticated' });
		}

		if (locals.user.role !== 'admin') {
			return fail(403, { error: 'settings.error.accessDenied' });
		}

		const formData = await request.formData();
		const email = formData.get('email')?.toString().toLowerCase().trim();

		if (!email || !email.includes('@')) {
			return fail(400, { invitationError: 'settings.error.validEmailRequired' });
		}

		// Check if email already exists as a user
		const existingUser = await db.select().from(users).where(eq(users.email, email)).get();
		if (existingUser) {
			return fail(400, { invitationError: 'settings.error.userEmailExists' });
		}

		// Check if there's already a pending invitation
		const existingInvitation = await db
			.select()
			.from(invitations)
			.where(
				and(eq(invitations.email, email), isNull(invitations.usedAt), gt(invitations.expiresAt, new Date()))
			)
			.get();

		if (existingInvitation) {
			return fail(400, { invitationError: 'settings.error.invitationPending' });
		}

		try {
			const token = crypto.randomUUID();
			const expiresAt = new Date();
			expiresAt.setDate(expiresAt.getDate() + 7);

			await db.insert(invitations).values({
				id: crypto.randomUUID(),
				email,
				token,
				invitedBy: locals.user.id,
				expiresAt
			});

			return { invitationSuccess: true };
		} catch (error) {
			console.error('Error creating invitation:', error);
			return fail(500, { invitationError: 'settings.error.invitationCreateError' });
		}
	},

	revokeInvitation: async ({ locals, request }) => {
		if (!locals.user) {
			return fail(401, { error: 'settings.error.notAuthenticated' });
		}

		if (locals.user.role !== 'admin') {
			return fail(403, { error: 'settings.error.accessDenied' });
		}

		const formData = await request.formData();
		const invitationId = formData.get('invitationId')?.toString();

		if (!invitationId) {
			return fail(400, { error: 'settings.error.invitationIdRequired' });
		}

		try {
			await db.delete(invitations).where(eq(invitations.id, invitationId));
			return { revokeSuccess: true };
		} catch (error) {
			console.error('Error revoking invitation:', error);
			return fail(500, { error: 'settings.error.revokeError' });
		}
	},

	deleteUser: async ({ locals, request }) => {
		if (!locals.user) {
			return fail(401, { error: 'settings.error.notAuthenticated' });
		}

		if (locals.user.role !== 'admin') {
			return fail(403, { error: 'settings.error.accessDenied' });
		}

		const formData = await request.formData();
		const userId = formData.get('userId')?.toString();

		if (!userId) {
			return fail(400, { userError: 'settings.error.userIdRequired' });
		}

		if (userId === locals.user.id) {
			return fail(400, { userError: 'settings.error.cannotDeleteSelf' });
		}

		try {
			await db.delete(users).where(eq(users.id, userId));
			return { deleteUserSuccess: true };
		} catch (error) {
			console.error('Error deleting user:', error);
			return fail(500, { userError: 'settings.error.deleteUserError' });
		}
	},

	createTag: async ({ locals, request }) => {
		if (!locals.user) {
			return fail(401, { tagError: 'settings.error.notAuthenticated' });
		}

		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim();
		const color = formData.get('color')?.toString() || null;

		if (!name) {
			return fail(400, { tagError: 'settings.error.tagNameRequired' });
		}

		// Check if tag already exists
		const existing = await db
			.select()
			.from(tags)
			.where(and(eq(tags.userId, locals.user.id), eq(tags.name, name)))
			.get();

		if (existing) {
			return fail(400, { tagError: 'settings.error.tagNameExists' });
		}

		try {
			await db.insert(tags).values({
				id: crypto.randomUUID(),
				name,
				color,
				userId: locals.user.id
			});
			return { tagSuccess: true };
		} catch (error) {
			console.error('Error creating tag:', error);
			return fail(500, { tagError: 'settings.error.tagCreateError' });
		}
	},

	updateTag: async ({ locals, request }) => {
		if (!locals.user) {
			return fail(401, { tagError: 'settings.error.notAuthenticated' });
		}

		const formData = await request.formData();
		const tagId = formData.get('tagId')?.toString();
		const name = formData.get('name')?.toString().trim();
		const color = formData.get('color')?.toString() || null;

		if (!tagId || !name) {
			return fail(400, { tagError: 'settings.error.missingData' });
		}

		// Check ownership
		const tag = await db
			.select()
			.from(tags)
			.where(and(eq(tags.id, tagId), eq(tags.userId, locals.user.id)))
			.get();

		if (!tag) {
			return fail(404, { tagError: 'settings.error.tagNotFound' });
		}

		// Check for duplicate name
		const duplicate = await db
			.select()
			.from(tags)
			.where(and(eq(tags.userId, locals.user.id), eq(tags.name, name)))
			.get();

		if (duplicate && duplicate.id !== tagId) {
			return fail(400, { tagError: 'settings.error.tagNameExists' });
		}

		try {
			await db
				.update(tags)
				.set({ name, color })
				.where(eq(tags.id, tagId));
			return { tagSuccess: true };
		} catch (error) {
			console.error('Error updating tag:', error);
			return fail(500, { tagError: 'settings.error.tagUpdateError' });
		}
	},

	deleteTag: async ({ locals, request }) => {
		if (!locals.user) {
			return fail(401, { tagError: 'settings.error.notAuthenticated' });
		}

		const formData = await request.formData();
		const tagId = formData.get('tagId')?.toString();

		if (!tagId) {
			return fail(400, { tagError: 'settings.error.tagIdRequired' });
		}

		// Check ownership
		const tag = await db
			.select()
			.from(tags)
			.where(and(eq(tags.id, tagId), eq(tags.userId, locals.user.id)))
			.get();

		if (!tag) {
			return fail(404, { tagError: 'settings.error.tagNotFound' });
		}

		try {
			// Delete tag relations first
			await db.delete(snippetTags).where(eq(snippetTags.tagId, tagId));
			// Delete the tag
			await db.delete(tags).where(eq(tags.id, tagId));
			return { tagDeleteSuccess: true };
		} catch (error) {
			console.error('Error deleting tag:', error);
			return fail(500, { tagError: 'settings.error.tagDeleteError' });
		}
	},

	saveGithubToken: async ({ locals, request }) => {
		if (!locals.user) {
			return fail(401, { githubError: 'settings.error.notAuthenticated' });
		}

		const formData = await request.formData();
		const token = formData.get('githubToken')?.toString().trim();

		if (!token) {
			return fail(400, { githubError: 'settings.error.tokenRequired' });
		}

		// Validate token format (GitHub PAT starts with ghp_ or github_pat_)
		if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
			return fail(400, { githubError: 'settings.error.invalidTokenFormat' });
		}

		try {
			// Verify the token works by making a test API call
			let testResponse;
			try {
				testResponse = await fetch('https://api.github.com/user', {
					headers: {
						'Authorization': `Bearer ${token}`,
						'Accept': 'application/vnd.github+json',
						'X-GitHub-Api-Version': '2022-11-28'
					}
				});
			} catch (fetchError) {
				console.error('GitHub API fetch error:', fetchError);
				return fail(500, { githubError: 'settings.error.githubApiError' });
			}

			if (!testResponse.ok) {
				const errorBody = await testResponse.text().catch(() => '');
				console.error('GitHub API error:', testResponse.status, errorBody);
				return fail(400, { githubError: 'settings.error.invalidToken' });
			}

			// Encrypt and save the token
			let encryptedToken;
			try {
				encryptedToken = encrypt(token);
			} catch (encryptError) {
				console.error('Encryption error:', encryptError);
				return fail(500, { githubError: 'settings.error.encryptionError' });
			}

			await db
				.update(users)
				.set({
					githubToken: encryptedToken,
					updatedAt: new Date()
				})
				.where(eq(users.id, locals.user.id));

			return { githubSuccess: true };
		} catch (error) {
			console.error('Error saving GitHub token:', error);
			return fail(500, { githubError: 'settings.error.saveError' });
		}
	},

	removeGithubToken: async ({ locals }) => {
		if (!locals.user) {
			return fail(401, { githubError: 'settings.error.notAuthenticated' });
		}

		try {
			await db
				.update(users)
				.set({
					githubToken: null,
					updatedAt: new Date()
				})
				.where(eq(users.id, locals.user.id));

			return { githubRemoveSuccess: true };
		} catch (error) {
			console.error('Error removing GitHub token:', error);
			return fail(500, { githubError: 'settings.error.tokenDeleteError' });
		}
	}
};
