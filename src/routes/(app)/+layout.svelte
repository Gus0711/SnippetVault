<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import CreateCollectionModal from '$lib/components/CreateCollectionModal.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { Settings, LogOut, ChevronDown } from 'lucide-svelte';

	let { data, children } = $props();

	let sidebarCollapsed = $state(false);
	let createModalOpen = $state(false);
	let userMenuOpen = $state(false);

	// Initialize theme from server preference
	onMount(() => {
		themeStore.init(data.user.themePreference);
	});

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

	const handleLogout = async () => {
		try {
			await fetch('/api/auth/logout', {
				method: 'POST'
			});
		} catch (e) {
			// Ignore errors
		}
		// Force full page reload to login
		window.location.href = '/auth/login';
	};
</script>

<svelte:window onclick={closeUserMenu} />

<div class="h-screen flex bg-background overflow-hidden">
	<!-- Sidebar -->
	<Sidebar
		collections={data.collections}
		sharedCollections={data.sharedCollections}
		favoriteSnippets={data.favoriteSnippets}
		collapsed={sidebarCollapsed}
		onToggle={() => (sidebarCollapsed = !sidebarCollapsed)}
		onCreateCollection={() => (createModalOpen = true)}
	/>

	<!-- Main content -->
	<div class="flex-1 flex flex-col min-w-0">
		<!-- Header -->
		<header class="h-9 border-b border-border flex items-center justify-end px-2 gap-1 shrink-0">
			<!-- Theme toggle -->
			<ThemeToggle />

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
					<span class="text-foreground hidden sm:inline text-[11px]">{data.user.name}</span>
					<ChevronDown size={10} class="text-muted" />
				</button>

				{#if userMenuOpen}
					<div
						class="absolute right-0 top-full mt-1 w-40 bg-background border border-border rounded shadow-lg py-0.5 z-50"
					>
						<div class="px-2 py-1.5 border-b border-border">
							<p class="text-[11px] font-medium text-foreground">{data.user.name}</p>
							<p class="text-[9px] text-muted truncate">{data.user.email}</p>
						</div>
						<a
							href="/settings"
							class="flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-foreground hover:bg-surface transition-colors"
						>
							<Settings size={11} strokeWidth={1.5} />
							Parametres
						</a>
						<button
							onclick={handleLogout}
							class="flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-foreground hover:bg-surface transition-colors w-full text-left"
						>
							<LogOut size={11} strokeWidth={1.5} />
							Deconnexion
						</button>
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
