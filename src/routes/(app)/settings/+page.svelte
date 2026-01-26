<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		Key,
		Copy,
		RefreshCw,
		Check,
		AlertTriangle,
		Download,
		Archive,
		Shield,
		Mail,
		Users,
		Trash2,
		X,
		Link,
		Tag,
		Plus,
		Pencil
	} from 'lucide-svelte';
	import { tagColors, getRandomTagColor } from '$lib/utils/colors';

	interface TagData {
		id: string;
		name: string;
		color: string | null;
		usageCount: number;
	}

	interface Props {
		data: {
			apiKey: string;
			isAdmin: boolean;
			pendingInvitations: Array<{
				id: string;
				email: string;
				token: string;
				expiresAt: Date;
				inviterName: string | null;
			}>;
			allUsers: Array<{
				id: string;
				email: string;
				name: string;
				role: string;
				createdAt: Date;
			}>;
			currentUserId: string;
			tags: TagData[];
		};
		form: {
			success?: boolean;
			apiKey?: string;
			error?: string;
			invitationError?: string;
			invitationSuccess?: boolean;
			revokeSuccess?: boolean;
			userError?: string;
			deleteUserSuccess?: boolean;
			tagError?: string;
			tagSuccess?: boolean;
			tagDeleteSuccess?: boolean;
		} | null;
	}

	let { data, form }: Props = $props();

	let apiKey = $state(data.apiKey);
	let copied = $state(false);
	let showConfirm = $state(false);
	let isRegenerating = $state(false);
	let isExporting = $state(false);
	let exportError = $state<string | null>(null);

	// Admin states
	let showInviteModal = $state(false);
	let inviteEmail = $state('');
	let isCreatingInvitation = $state(false);
	let copiedInvitationId = $state<string | null>(null);
	let showDeleteUserModal = $state(false);
	let userToDelete = $state<{ id: string; name: string; email: string } | null>(null);
	let showRevokeModal = $state(false);
	let invitationToRevoke = $state<{ id: string; email: string } | null>(null);

	// Tag management states
	let showCreateTagModal = $state(false);
	let showEditTagModal = $state(false);
	let showDeleteTagModal = $state(false);
	let newTagName = $state('');
	let newTagColor = $state(getRandomTagColor());
	let editingTag = $state<TagData | null>(null);
	let tagToDelete = $state<TagData | null>(null);

	// Update apiKey when form returns a new one
	$effect(() => {
		if (form?.success && form?.apiKey) {
			apiKey = form.apiKey;
		}
	});

	// Close modals on success
	$effect(() => {
		if (form?.invitationSuccess) {
			showInviteModal = false;
			inviteEmail = '';
		}
		if (form?.deleteUserSuccess) {
			showDeleteUserModal = false;
			userToDelete = null;
		}
		if (form?.revokeSuccess) {
			showRevokeModal = false;
			invitationToRevoke = null;
		}
		if (form?.tagSuccess) {
			showCreateTagModal = false;
			showEditTagModal = false;
			newTagName = '';
			newTagColor = '#6366f1';
			editingTag = null;
		}
		if (form?.tagDeleteSuccess) {
			showDeleteTagModal = false;
			tagToDelete = null;
		}
	});

	function copyToClipboard() {
		navigator.clipboard.writeText(apiKey);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function maskApiKey(key: string): string {
		if (key.length <= 8) return key;
		return key.slice(0, 8) + '...' + key.slice(-4);
	}

	function copyInvitationLink(token: string, invitationId: string) {
		const link = `${window.location.origin}/auth/register/${token}`;
		navigator.clipboard.writeText(link);
		copiedInvitationId = invitationId;
		setTimeout(() => (copiedInvitationId = null), 2000);
	}

	function formatDate(date: Date): string {
		return new Date(date).toLocaleDateString('fr-FR', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	async function exportData() {
		isExporting = true;
		exportError = null;

		try {
			const response = await fetch('/api/export');

			if (!response.ok) {
				throw new Error('Export failed');
			}

			// Get filename from Content-Disposition header or use default
			const contentDisposition = response.headers.get('Content-Disposition');
			let filename = 'snippetvault-backup.zip';
			if (contentDisposition) {
				const match = contentDisposition.match(/filename="(.+)"/);
				if (match) {
					filename = match[1];
				}
			}

			// Download the file
			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Export error:', error);
			exportError = "Erreur lors de l'export des donnees";
		} finally {
			isExporting = false;
		}
	}

	function openDeleteUser(user: { id: string; name: string; email: string }) {
		userToDelete = user;
		showDeleteUserModal = true;
	}

	function openRevokeInvitation(invitation: { id: string; email: string }) {
		invitationToRevoke = invitation;
		showRevokeModal = true;
	}

	function openEditTag(tag: TagData) {
		editingTag = tag;
		newTagName = tag.name;
		newTagColor = tag.color || '#6366f1';
		showEditTagModal = true;
	}

	function openDeleteTag(tag: TagData) {
		tagToDelete = tag;
		showDeleteTagModal = true;
	}
</script>

<svelte:head>
	<title>Parametres - SnippetVault</title>
</svelte:head>

<div class="max-w-2xl mx-auto px-4 py-8">
	<h1 class="text-2xl font-semibold text-foreground mb-8">Parametres</h1>

	<!-- API Key Section -->
	<section class="bg-surface border border-border rounded-lg p-6">
		<div class="flex items-center gap-3 mb-4">
			<Key size={20} class="text-muted" />
			<h2 class="text-lg font-medium text-foreground">Cle API</h2>
		</div>

		<p class="text-sm text-muted mb-4">
			Utilisez cette cle pour acceder a l'API REST depuis des scripts ou des outils externes.
			Gardez-la secrete.
		</p>

		<!-- API Key Display -->
		<div class="flex items-center gap-2 mb-4">
			<code
				class="flex-1 bg-background border border-border rounded px-3 py-2 text-sm font-mono text-foreground"
			>
				{maskApiKey(apiKey)}
			</code>
			<button
				type="button"
				onclick={copyToClipboard}
				class="p-2 border border-border rounded hover:bg-surface transition-colors"
				title="Copier la cle complete"
			>
				{#if copied}
					<Check size={18} class="text-green-500" />
				{:else}
					<Copy size={18} class="text-muted" />
				{/if}
			</button>
		</div>

		<!-- Regenerate Section -->
		{#if showConfirm}
			<div class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
				<div class="flex items-start gap-3">
					<AlertTriangle size={20} class="text-yellow-500 shrink-0 mt-0.5" />
					<div>
						<p class="text-sm text-foreground font-medium mb-2">
							Etes-vous sur de vouloir regenerer la cle ?
						</p>
						<p class="text-sm text-muted mb-3">
							L'ancienne cle sera immediatement invalidee. Tous les scripts et integrations
							utilisant l'ancienne cle cesseront de fonctionner.
						</p>
						<div class="flex items-center gap-2">
							<form
								method="POST"
								action="?/regenerateApiKey"
								use:enhance={() => {
									isRegenerating = true;
									return async ({ update }) => {
										await update();
										isRegenerating = false;
										showConfirm = false;
									};
								}}
							>
								<button
									type="submit"
									disabled={isRegenerating}
									class="px-3 py-1.5 bg-yellow-500 text-black text-sm font-medium rounded hover:bg-yellow-400 transition-colors disabled:opacity-50"
								>
									{#if isRegenerating}
										<RefreshCw size={14} class="inline animate-spin mr-1" />
										Regeneration...
									{:else}
										Confirmer
									{/if}
								</button>
							</form>
							<button
								type="button"
								onclick={() => (showConfirm = false)}
								class="px-3 py-1.5 text-sm text-muted hover:text-foreground transition-colors"
							>
								Annuler
							</button>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<button
				type="button"
				onclick={() => (showConfirm = true)}
				class="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
			>
				<RefreshCw size={14} />
				Regenerer la cle API
			</button>
		{/if}

		{#if form?.error}
			<p class="text-sm text-red-500 mt-4">{form.error}</p>
		{/if}

		{#if form?.success}
			<p class="text-sm text-green-500 mt-4">Cle API regeneree avec succes.</p>
		{/if}
	</section>

	<!-- Export Section -->
	<section class="bg-surface border border-border rounded-lg p-6 mt-6">
		<div class="flex items-center gap-3 mb-4">
			<Archive size={20} class="text-muted" />
			<h2 class="text-lg font-medium text-foreground">Sauvegarde</h2>
		</div>

		<p class="text-sm text-muted mb-4">
			Exportez toutes vos donnees dans un fichier ZIP contenant vos snippets, collections, tags et
			fichiers uploades. Ce fichier peut etre utilise pour une sauvegarde ou une migration.
		</p>

		<div class="flex items-center gap-4">
			<button
				type="button"
				onclick={exportData}
				disabled={isExporting}
				class="flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded hover:bg-accent/90 transition-colors disabled:opacity-50"
			>
				{#if isExporting}
					<RefreshCw size={16} class="animate-spin" />
					Export en cours...
				{:else}
					<Download size={16} />
					Exporter mes donnees
				{/if}
			</button>
		</div>

		{#if exportError}
			<p class="text-sm text-red-500 mt-4">{exportError}</p>
		{/if}

		<div class="mt-4 text-xs text-muted">
			<p class="font-medium text-foreground mb-1">Contenu du fichier ZIP :</p>
			<ul class="list-disc list-inside space-y-0.5">
				<li>snippets.json - Tous vos snippets avec leurs blocs et tags</li>
				<li>collections.json - Arborescence de vos collections</li>
				<li>tags.json - Liste de vos tags</li>
				<li>metadata.json - Informations sur l'export</li>
				<li>uploads/ - Vos fichiers uploades (images, etc.)</li>
			</ul>
		</div>
	</section>

	<!-- Tags Section -->
	<section class="bg-surface border border-border rounded-lg p-6 mt-6">
		<div class="flex items-center justify-between mb-4">
			<div class="flex items-center gap-3">
				<Tag size={20} class="text-muted" />
				<h2 class="text-lg font-medium text-foreground">Tags</h2>
			</div>
			<button
				type="button"
				onclick={() => {
					newTagName = '';
					newTagColor = getRandomTagColor();
					showCreateTagModal = true;
				}}
				class="flex items-center gap-2 px-3 py-1.5 bg-accent text-white text-sm font-medium rounded hover:bg-accent/90 transition-colors"
			>
				<Plus size={14} />
				Nouveau tag
			</button>
		</div>

		<p class="text-sm text-muted mb-4">
			Gerez vos tags pour organiser vos snippets. Les tags non utilises peuvent etre supprimes.
		</p>

		{#if data.tags.length === 0}
			<p class="text-sm text-muted py-4 text-center">Aucun tag</p>
		{:else}
			<div class="space-y-2">
				{#each data.tags as tag (tag.id)}
					<div class="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
						<div class="flex items-center gap-3">
							<span
								class="w-4 h-4 rounded-full shrink-0"
								style="background-color: {tag.color || '#6b7280'}"
							></span>
							<span class="font-medium text-foreground">{tag.name}</span>
							<span class="text-xs text-muted">
								{tag.usageCount} snippet{tag.usageCount !== 1 ? 's' : ''}
							</span>
						</div>
						<div class="flex items-center gap-1">
							<button
								type="button"
								onclick={() => openEditTag(tag)}
								class="p-1.5 text-muted hover:text-foreground transition-colors rounded hover:bg-surface"
								title="Modifier"
							>
								<Pencil size={14} />
							</button>
							<button
								type="button"
								onclick={() => openDeleteTag(tag)}
								class="p-1.5 text-red-500 hover:text-red-400 transition-colors rounded hover:bg-surface"
								title="Supprimer"
							>
								<Trash2 size={14} />
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		{#if form?.tagError}
			<p class="text-sm text-red-500 mt-4">{form.tagError}</p>
		{/if}
	</section>

	<!-- API Documentation Section -->
	<section class="bg-surface border border-border rounded-lg p-6 mt-6">
		<h2 class="text-lg font-medium text-foreground mb-4">Documentation API</h2>

		<div class="space-y-4 text-sm">
			<div>
				<h3 class="font-medium text-foreground mb-1">Authentification</h3>
				<p class="text-muted mb-2">Ajoutez l'en-tete Authorization a chaque requete :</p>
				<code class="block bg-background border border-border rounded px-3 py-2 font-mono text-xs">
					Authorization: Bearer {maskApiKey(apiKey)}
				</code>
			</div>

			<div>
				<h3 class="font-medium text-foreground mb-2">Endpoints disponibles</h3>
				<div class="space-y-2">
					<div class="flex items-start gap-2">
						<span class="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs font-mono rounded">
							GET
						</span>
						<div>
							<code class="font-mono text-xs text-foreground">/api/v1/snippets</code>
							<span class="text-muted ml-2">- Liste des snippets</span>
						</div>
					</div>
					<div class="flex items-start gap-2">
						<span class="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-mono rounded">
							POST
						</span>
						<div>
							<code class="font-mono text-xs text-foreground">/api/v1/snippets</code>
							<span class="text-muted ml-2">- Creer un snippet</span>
						</div>
					</div>
					<div class="flex items-start gap-2">
						<span class="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs font-mono rounded">
							GET
						</span>
						<div>
							<code class="font-mono text-xs text-foreground">/api/v1/snippets/:id</code>
							<span class="text-muted ml-2">- Details d'un snippet</span>
						</div>
					</div>
					<div class="flex items-start gap-2">
						<span class="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-mono rounded">
							PUT
						</span>
						<div>
							<code class="font-mono text-xs text-foreground">/api/v1/snippets/:id</code>
							<span class="text-muted ml-2">- Modifier un snippet</span>
						</div>
					</div>
					<div class="flex items-start gap-2">
						<span class="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs font-mono rounded">
							DELETE
						</span>
						<div>
							<code class="font-mono text-xs text-foreground">/api/v1/snippets/:id</code>
							<span class="text-muted ml-2">- Supprimer un snippet</span>
						</div>
					</div>
					<div class="flex items-start gap-2">
						<span class="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs font-mono rounded">
							GET
						</span>
						<div>
							<code class="font-mono text-xs text-foreground">/api/v1/collections</code>
							<span class="text-muted ml-2">- Liste des collections</span>
						</div>
					</div>
					<div class="flex items-start gap-2">
						<span class="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs font-mono rounded">
							GET
						</span>
						<div>
							<code class="font-mono text-xs text-foreground">/api/v1/tags</code>
							<span class="text-muted ml-2">- Liste des tags</span>
						</div>
					</div>
					<div class="flex items-start gap-2">
						<span class="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs font-mono rounded">
							GET
						</span>
						<div>
							<code class="font-mono text-xs text-foreground">/api/v1/search?q=query</code>
							<span class="text-muted ml-2">- Recherche full-text</span>
						</div>
					</div>
				</div>
			</div>

			<div>
				<h3 class="font-medium text-foreground mb-1">Format de reponse</h3>
				<p class="text-muted">Succes : <code class="font-mono text-xs">{'{ data: ... }'}</code></p>
				<p class="text-muted">
					Erreur : <code class="font-mono text-xs">{'{ error: "message" }'}</code>
				</p>
			</div>
		</div>
	</section>

	<!-- Admin Section -->
	{#if data.isAdmin}
		<div class="mt-8 pt-8 border-t border-border">
			<div class="flex items-center gap-3 mb-6">
				<Shield size={24} class="text-accent" />
				<h2 class="text-xl font-semibold text-foreground">Administration</h2>
			</div>

			<!-- Invitations Section -->
			<section class="bg-surface border border-border rounded-lg p-6 mb-6">
				<div class="flex items-center justify-between mb-4">
					<div class="flex items-center gap-3">
						<Mail size={20} class="text-muted" />
						<h3 class="text-lg font-medium text-foreground">Invitations</h3>
					</div>
					<button
						type="button"
						onclick={() => (showInviteModal = true)}
						class="flex items-center gap-2 px-3 py-1.5 bg-accent text-white text-sm font-medium rounded hover:bg-accent/90 transition-colors"
					>
						Creer une invitation
					</button>
				</div>

				{#if data.pendingInvitations.length === 0}
					<p class="text-sm text-muted">Aucune invitation en attente</p>
				{:else}
					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b border-border">
									<th class="text-left py-2 text-muted font-medium">Email</th>
									<th class="text-left py-2 text-muted font-medium">Invite par</th>
									<th class="text-left py-2 text-muted font-medium">Expire le</th>
									<th class="text-right py-2 text-muted font-medium">Actions</th>
								</tr>
							</thead>
							<tbody>
								{#each data.pendingInvitations as invitation (invitation.id)}
									<tr class="border-b border-border/50 last:border-b-0">
										<td class="py-2 text-foreground">{invitation.email}</td>
										<td class="py-2 text-muted">{invitation.inviterName || '-'}</td>
										<td class="py-2 text-muted">{formatDate(invitation.expiresAt)}</td>
										<td class="py-2 text-right">
											<div class="flex items-center justify-end gap-2">
												<button
													type="button"
													onclick={() => copyInvitationLink(invitation.token, invitation.id)}
													class="p-1.5 text-muted hover:text-foreground transition-colors"
													title="Copier le lien"
												>
													{#if copiedInvitationId === invitation.id}
														<Check size={16} class="text-green-500" />
													{:else}
														<Link size={16} />
													{/if}
												</button>
												<button
													type="button"
													onclick={() => openRevokeInvitation(invitation)}
													class="p-1.5 text-red-500 hover:text-red-400 transition-colors"
													title="Revoquer"
												>
													<Trash2 size={16} />
												</button>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}

				{#if form?.invitationError}
					<p class="text-sm text-red-500 mt-4">{form.invitationError}</p>
				{/if}
			</section>

			<!-- Users Section -->
			<section class="bg-surface border border-border rounded-lg p-6">
				<div class="flex items-center gap-3 mb-4">
					<Users size={20} class="text-muted" />
					<h3 class="text-lg font-medium text-foreground">Utilisateurs</h3>
				</div>

				{#if data.allUsers.length === 0}
					<p class="text-sm text-muted">Aucun utilisateur</p>
				{:else}
					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b border-border">
									<th class="text-left py-2 text-muted font-medium">Nom</th>
									<th class="text-left py-2 text-muted font-medium">Email</th>
									<th class="text-left py-2 text-muted font-medium">Role</th>
									<th class="text-left py-2 text-muted font-medium">Inscription</th>
									<th class="text-right py-2 text-muted font-medium">Actions</th>
								</tr>
							</thead>
							<tbody>
								{#each data.allUsers as user (user.id)}
									<tr class="border-b border-border/50 last:border-b-0">
										<td class="py-2 text-foreground">{user.name}</td>
										<td class="py-2 text-muted">{user.email}</td>
										<td class="py-2">
											<span
												class="px-2 py-0.5 text-xs rounded {user.role === 'admin'
													? 'bg-accent/20 text-accent'
													: 'bg-surface text-muted'}"
											>
												{user.role}
											</span>
										</td>
										<td class="py-2 text-muted">{formatDate(user.createdAt)}</td>
										<td class="py-2 text-right">
											{#if user.id !== data.currentUserId}
												<button
													type="button"
													onclick={() => openDeleteUser(user)}
													class="p-1.5 text-red-500 hover:text-red-400 transition-colors"
													title="Supprimer"
												>
													<Trash2 size={16} />
												</button>
											{:else}
												<span class="text-xs text-muted">(vous)</span>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}

				{#if form?.userError}
					<p class="text-sm text-red-500 mt-4">{form.userError}</p>
				{/if}
			</section>
		</div>
	{/if}
</div>

<!-- Create Invitation Modal -->
{#if showInviteModal}
	<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
	<div class="fixed inset-0 bg-black/50 z-40" onclick={() => (showInviteModal = false)}></div>
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div
			class="bg-background border border-border rounded-lg shadow-lg w-full max-w-sm"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
		>
			<div class="flex items-center justify-between px-4 py-3 border-b border-border">
				<h2 class="font-medium text-foreground">Creer une invitation</h2>
				<button
					onclick={() => (showInviteModal = false)}
					class="p-1 rounded hover:bg-surface text-muted hover:text-foreground transition-colors"
				>
					<X size={18} />
				</button>
			</div>
			<form
				method="POST"
				action="?/createInvitation"
				use:enhance={() => {
					isCreatingInvitation = true;
					return async ({ update }) => {
						await update();
						isCreatingInvitation = false;
					};
				}}
				class="p-4"
			>
				<label class="block text-sm font-medium text-foreground mb-2"> Email </label>
				<input
					type="email"
					name="email"
					bind:value={inviteEmail}
					required
					placeholder="utilisateur@example.com"
					class="w-full px-3 py-2 bg-surface border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
				/>
				<p class="text-xs text-muted mt-2">
					Un lien d'inscription sera genere, valide pendant 7 jours.
				</p>
				<div class="flex justify-end gap-2 mt-4">
					<button
						type="button"
						onclick={() => (showInviteModal = false)}
						class="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
					>
						Annuler
					</button>
					<button
						type="submit"
						disabled={isCreatingInvitation}
						class="px-4 py-2 text-sm bg-accent text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
					>
						{#if isCreatingInvitation}
							Creation...
						{:else}
							Creer
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Revoke Invitation Confirmation Modal -->
{#if showRevokeModal && invitationToRevoke}
	<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
	<div class="fixed inset-0 bg-black/50 z-40" onclick={() => (showRevokeModal = false)}></div>
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div
			class="bg-background border border-border rounded-lg shadow-lg w-full max-w-sm"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
		>
			<div class="flex items-center justify-between px-4 py-3 border-b border-border">
				<h2 class="font-medium text-foreground">Revoquer l'invitation</h2>
				<button
					onclick={() => (showRevokeModal = false)}
					class="p-1 rounded hover:bg-surface text-muted hover:text-foreground transition-colors"
				>
					<X size={18} />
				</button>
			</div>
			<div class="p-4">
				<p class="text-sm text-muted mb-4">
					Voulez-vous vraiment revoquer l'invitation pour
					<span class="text-foreground font-medium">{invitationToRevoke.email}</span> ?
				</p>
				<form method="POST" action="?/revokeInvitation" use:enhance>
					<input type="hidden" name="invitationId" value={invitationToRevoke.id} />
					<div class="flex justify-end gap-2">
						<button
							type="button"
							onclick={() => (showRevokeModal = false)}
							class="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
						>
							Annuler
						</button>
						<button
							type="submit"
							class="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:opacity-90 transition-opacity"
						>
							Revoquer
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}

<!-- Delete User Confirmation Modal -->
{#if showDeleteUserModal && userToDelete}
	<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
	<div class="fixed inset-0 bg-black/50 z-40" onclick={() => (showDeleteUserModal = false)}></div>
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div
			class="bg-background border border-border rounded-lg shadow-lg w-full max-w-sm"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
		>
			<div class="flex items-center justify-between px-4 py-3 border-b border-border">
				<h2 class="font-medium text-foreground">Supprimer l'utilisateur</h2>
				<button
					onclick={() => (showDeleteUserModal = false)}
					class="p-1 rounded hover:bg-surface text-muted hover:text-foreground transition-colors"
				>
					<X size={18} />
				</button>
			</div>
			<div class="p-4">
				<p class="text-sm text-muted mb-2">
					Voulez-vous vraiment supprimer l'utilisateur
					<span class="text-foreground font-medium">{userToDelete.name}</span> ?
				</p>
				<p class="text-sm text-red-500 mb-4">
					Toutes ses donnees (snippets, collections, tags) seront definitivement supprimees.
				</p>
				<form method="POST" action="?/deleteUser" use:enhance>
					<input type="hidden" name="userId" value={userToDelete.id} />
					<div class="flex justify-end gap-2">
						<button
							type="button"
							onclick={() => (showDeleteUserModal = false)}
							class="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
						>
							Annuler
						</button>
						<button
							type="submit"
							class="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:opacity-90 transition-opacity"
						>
							Supprimer
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}

<!-- Create Tag Modal -->
{#if showCreateTagModal}
	<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
	<div class="fixed inset-0 bg-black/50 z-40" onclick={() => (showCreateTagModal = false)}></div>
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div
			class="bg-background border border-border rounded-lg shadow-lg w-full max-w-sm"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
		>
			<div class="flex items-center justify-between px-4 py-3 border-b border-border">
				<h2 class="font-medium text-foreground">Nouveau tag</h2>
				<button
					onclick={() => (showCreateTagModal = false)}
					class="p-1 rounded hover:bg-surface text-muted hover:text-foreground transition-colors"
				>
					<X size={18} />
				</button>
			</div>
			<form method="POST" action="?/createTag" use:enhance class="p-4">
				<label class="block text-sm font-medium text-foreground mb-2">Nom</label>
				<input
					type="text"
					name="name"
					bind:value={newTagName}
					required
					placeholder="Mon tag"
					class="w-full px-3 py-2 bg-surface border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent mb-4"
				/>

				<label class="block text-sm font-medium text-foreground mb-2">Couleur</label>
				<input type="hidden" name="color" value={newTagColor} />
				<div class="flex flex-wrap gap-2 mb-4">
					{#each tagColors as color}
						<button
							type="button"
							onclick={() => (newTagColor = color)}
							class="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 {newTagColor === color ? 'border-foreground scale-110' : 'border-transparent'}"
							style="background-color: {color}"
						></button>
					{/each}
				</div>

				<div class="flex items-center gap-2 mb-4">
					<span class="text-sm text-muted">Apercu:</span>
					<span
						class="px-2 py-1 rounded text-sm font-medium"
						style="background-color: {newTagColor}20; color: {newTagColor}"
					>
						{newTagName || 'Mon tag'}
					</span>
				</div>

				<div class="flex justify-end gap-2">
					<button
						type="button"
						onclick={() => (showCreateTagModal = false)}
						class="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
					>
						Annuler
					</button>
					<button
						type="submit"
						class="px-4 py-2 text-sm bg-accent text-white rounded-md hover:opacity-90 transition-opacity"
					>
						Creer
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Edit Tag Modal -->
{#if showEditTagModal && editingTag}
	<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
	<div class="fixed inset-0 bg-black/50 z-40" onclick={() => (showEditTagModal = false)}></div>
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div
			class="bg-background border border-border rounded-lg shadow-lg w-full max-w-sm"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
		>
			<div class="flex items-center justify-between px-4 py-3 border-b border-border">
				<h2 class="font-medium text-foreground">Modifier le tag</h2>
				<button
					onclick={() => (showEditTagModal = false)}
					class="p-1 rounded hover:bg-surface text-muted hover:text-foreground transition-colors"
				>
					<X size={18} />
				</button>
			</div>
			<form method="POST" action="?/updateTag" use:enhance class="p-4">
				<input type="hidden" name="tagId" value={editingTag.id} />

				<label class="block text-sm font-medium text-foreground mb-2">Nom</label>
				<input
					type="text"
					name="name"
					bind:value={newTagName}
					required
					class="w-full px-3 py-2 bg-surface border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent mb-4"
				/>

				<label class="block text-sm font-medium text-foreground mb-2">Couleur</label>
				<input type="hidden" name="color" value={newTagColor} />
				<div class="flex flex-wrap gap-2 mb-4">
					{#each tagColors as color}
						<button
							type="button"
							onclick={() => (newTagColor = color)}
							class="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 {newTagColor === color ? 'border-foreground scale-110' : 'border-transparent'}"
							style="background-color: {color}"
						></button>
					{/each}
				</div>

				<div class="flex items-center gap-2 mb-4">
					<span class="text-sm text-muted">Apercu:</span>
					<span
						class="px-2 py-1 rounded text-sm font-medium"
						style="background-color: {newTagColor}20; color: {newTagColor}"
					>
						{newTagName || 'Mon tag'}
					</span>
				</div>

				<div class="flex justify-end gap-2">
					<button
						type="button"
						onclick={() => (showEditTagModal = false)}
						class="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
					>
						Annuler
					</button>
					<button
						type="submit"
						class="px-4 py-2 text-sm bg-accent text-white rounded-md hover:opacity-90 transition-opacity"
					>
						Enregistrer
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Delete Tag Confirmation Modal -->
{#if showDeleteTagModal && tagToDelete}
	<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
	<div class="fixed inset-0 bg-black/50 z-40" onclick={() => (showDeleteTagModal = false)}></div>
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div
			class="bg-background border border-border rounded-lg shadow-lg w-full max-w-sm"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
		>
			<div class="flex items-center justify-between px-4 py-3 border-b border-border">
				<h2 class="font-medium text-foreground">Supprimer le tag</h2>
				<button
					onclick={() => (showDeleteTagModal = false)}
					class="p-1 rounded hover:bg-surface text-muted hover:text-foreground transition-colors"
				>
					<X size={18} />
				</button>
			</div>
			<div class="p-4">
				<p class="text-sm text-muted mb-2">
					Voulez-vous vraiment supprimer le tag
					<span
						class="px-1.5 py-0.5 rounded text-sm font-medium"
						style="background-color: {tagToDelete.color || '#6b7280'}20; color: {tagToDelete.color || '#6b7280'}"
					>{tagToDelete.name}</span> ?
				</p>
				{#if tagToDelete.usageCount > 0}
					<p class="text-sm text-yellow-500 mb-4">
						Ce tag est utilise par {tagToDelete.usageCount} snippet{tagToDelete.usageCount > 1 ? 's' : ''}. Il sera retire de ces snippets.
					</p>
				{/if}
				<form method="POST" action="?/deleteTag" use:enhance>
					<input type="hidden" name="tagId" value={tagToDelete.id} />
					<div class="flex justify-end gap-2">
						<button
							type="button"
							onclick={() => (showDeleteTagModal = false)}
							class="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
						>
							Annuler
						</button>
						<button
							type="submit"
							class="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:opacity-90 transition-opacity"
						>
							Supprimer
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
