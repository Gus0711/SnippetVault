<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import CreateCollectionModal from '$lib/components/CreateCollectionModal.svelte';
	import { Search, User, LogOut, ChevronDown } from 'lucide-svelte';

	let { data, children } = $props();

	let sidebarCollapsed = $state(false);
	let createModalOpen = $state(false);
	let userMenuOpen = $state(false);

	const handleCreateCollection = async (collectionData: {
		name: string;
		icon?: string;
		parentId?: string | null;
	}) => {
		const response = await fetch('/api/collections', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(collectionData)
		});

		if (response.ok) {
			createModalOpen = false;
			invalidateAll();
		}
	};

	const closeUserMenu = () => {
		userMenuOpen = false;
	};
</script>

<svelte:window onclick={closeUserMenu} />

<div class="h-screen flex bg-background overflow-hidden">
	<!-- Sidebar -->
	<Sidebar
		collections={data.collections}
		collapsed={sidebarCollapsed}
		onToggle={() => (sidebarCollapsed = !sidebarCollapsed)}
		onCreateCollection={() => (createModalOpen = true)}
	/>

	<!-- Main content -->
	<div class="flex-1 flex flex-col min-w-0">
		<!-- Header -->
		<header class="h-10 border-b border-border flex items-center justify-between px-3 shrink-0">
			<!-- Search -->
			<div class="flex-1 max-w-sm">
				<div class="relative">
					<Search
						size={14}
						class="absolute left-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
					/>
					<input
						type="text"
						placeholder="Rechercher... (Ctrl+K)"
						class="w-full pl-7 pr-3 py-1 bg-surface border border-border rounded text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-transparent"
					/>
				</div>
			</div>

			<!-- User menu -->
			<div class="relative">
				<button
					onclick={(e) => {
						e.stopPropagation();
						userMenuOpen = !userMenuOpen;
					}}
					class="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-surface text-xs transition-colors"
				>
					<div
						class="w-5 h-5 rounded bg-accent/10 text-accent flex items-center justify-center text-[10px] font-medium"
					>
						{data.user.name.charAt(0).toUpperCase()}
					</div>
					<span class="text-foreground hidden sm:inline">{data.user.name}</span>
					<ChevronDown size={12} class="text-muted" />
				</button>

				{#if userMenuOpen}
					<div
						class="absolute right-0 top-full mt-1 w-44 bg-background border border-border rounded shadow-lg py-0.5 z-50"
					>
						<div class="px-2.5 py-1.5 border-b border-border">
							<p class="text-xs font-medium text-foreground">{data.user.name}</p>
							<p class="text-[10px] text-muted">{data.user.email}</p>
						</div>
						<a
							href="/settings"
							class="flex items-center gap-2 px-2.5 py-1.5 text-xs text-foreground hover:bg-surface transition-colors"
						>
							<User size={12} />
							Paramètres
						</a>
						<form method="POST" action="/auth/logout" use:enhance>
							<button
								type="submit"
								class="flex items-center gap-2 px-2.5 py-1.5 text-xs text-foreground hover:bg-surface transition-colors w-full text-left"
							>
								<LogOut size={12} />
								Déconnexion
							</button>
						</form>
					</div>
				{/if}
			</div>
		</header>

		<!-- Page content -->
		<main class="flex-1 overflow-auto">
			{@render children()}
		</main>
	</div>
</div>

<!-- Create collection modal -->
<CreateCollectionModal
	open={createModalOpen}
	collections={data.collections}
	onClose={() => (createModalOpen = false)}
	onSubmit={handleCreateCollection}
/>
