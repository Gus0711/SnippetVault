<script lang="ts">
	import { X, UserPlus, Trash2, Eye, Pencil } from 'lucide-svelte';

	interface Member {
		userId: string;
		userName: string;
		userEmail: string;
		permission: 'read' | 'write';
		invitedAt: Date;
	}

	interface Props {
		open: boolean;
		collectionId: string;
		collectionName: string;
		members: Member[];
		onClose: () => void;
		onUpdate: () => void;
	}

	let { open, collectionId, collectionName, members, onClose, onUpdate }: Props = $props();

	let email = $state('');
	let permission = $state<'read' | 'write'>('read');
	let isAdding = $state(false);
	let error = $state<string | null>(null);
	let updatingUserId = $state<string | null>(null);

	async function addMember() {
		if (!email.trim()) return;

		isAdding = true;
		error = null;

		try {
			const response = await fetch(`/api/collections/${collectionId}/members`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: email.trim(), permission })
			});

			const data = await response.json();

			if (!response.ok) {
				error = data.error || 'Erreur lors de l\'ajout';
				return;
			}

			email = '';
			permission = 'read';
			onUpdate();
		} catch (e) {
			console.error('Error adding member:', e);
			error = 'Erreur lors de l\'ajout';
		} finally {
			isAdding = false;
		}
	}

	async function updatePermission(userId: string, newPermission: 'read' | 'write') {
		updatingUserId = userId;

		try {
			const response = await fetch(`/api/collections/${collectionId}/members/${userId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ permission: newPermission })
			});

			if (response.ok) {
				onUpdate();
			}
		} catch (e) {
			console.error('Error updating permission:', e);
		} finally {
			updatingUserId = null;
		}
	}

	async function removeMember(userId: string) {
		try {
			const response = await fetch(`/api/collections/${collectionId}/members/${userId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				onUpdate();
			}
		} catch (e) {
			console.error('Error removing member:', e);
		}
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
	<div class="fixed inset-0 bg-black/50 z-40" onclick={onClose}></div>
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div
			class="bg-background border border-border rounded-lg shadow-lg w-full max-w-md"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
		>
			<div class="flex items-center justify-between px-4 py-3 border-b border-border">
				<h2 class="font-medium text-foreground">Partager "{collectionName}"</h2>
				<button
					onclick={onClose}
					class="p-1 rounded hover:bg-surface text-muted hover:text-foreground transition-colors"
				>
					<X size={18} />
				</button>
			</div>

			<div class="p-4">
				<!-- Add member form -->
				<div class="mb-4">
					<label class="block text-sm font-medium text-foreground mb-2">
						Ajouter un membre
					</label>
					<div class="flex gap-2">
						<input
							type="email"
							bind:value={email}
							placeholder="email@example.com"
							class="flex-1 px-3 py-2 bg-surface border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
						/>
						<select
							bind:value={permission}
							class="px-3 py-2 bg-surface border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
						>
							<option value="read">Lecture</option>
							<option value="write">Ecriture</option>
						</select>
						<button
							onclick={addMember}
							disabled={isAdding || !email.trim()}
							class="flex items-center gap-1.5 px-3 py-2 bg-accent text-white text-sm rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
						>
							<UserPlus size={16} />
						</button>
					</div>
					{#if error}
						<p class="text-sm text-red-500 mt-2">{error}</p>
					{/if}
				</div>

				<!-- Members list -->
				<div>
					<h3 class="text-sm font-medium text-muted mb-2">
						Membres ({members.length})
					</h3>
					{#if members.length === 0}
						<p class="text-sm text-muted py-4 text-center">
							Aucun membre. Ajoutez des utilisateurs pour partager cette collection.
						</p>
					{:else}
						<div class="space-y-2 max-h-60 overflow-y-auto">
							{#each members as member (member.userId)}
								<div
									class="flex items-center justify-between p-2 bg-surface rounded-md"
								>
									<div class="flex-1 min-w-0">
										<p class="text-sm text-foreground truncate">{member.userName}</p>
										<p class="text-xs text-muted truncate">{member.userEmail}</p>
									</div>
									<div class="flex items-center gap-2 ml-2">
										<select
											value={member.permission}
											onchange={(e) => updatePermission(member.userId, e.currentTarget.value as 'read' | 'write')}
											disabled={updatingUserId === member.userId}
											class="px-2 py-1 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50"
										>
											<option value="read">Lecture</option>
											<option value="write">Ecriture</option>
										</select>
										<button
											onclick={() => removeMember(member.userId)}
											class="p-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
											title="Retirer"
										>
											<Trash2 size={14} />
										</button>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Legend -->
				<div class="mt-4 pt-4 border-t border-border">
					<p class="text-xs text-muted mb-2">Niveaux d'acces :</p>
					<div class="flex gap-4 text-xs text-muted">
						<span class="flex items-center gap-1">
							<Eye size={12} />
							Lecture : voir les snippets
						</span>
						<span class="flex items-center gap-1">
							<Pencil size={12} />
							Ecriture : creer et modifier
						</span>
					</div>
				</div>
			</div>

			<div class="flex justify-end px-4 py-3 border-t border-border">
				<button
					onclick={onClose}
					class="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
				>
					Fermer
				</button>
			</div>
		</div>
	</div>
{/if}
