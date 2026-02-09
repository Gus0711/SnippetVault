<script lang="ts">
	import { Sun, Moon, Monitor } from 'lucide-svelte';
	import { themeStore, type Theme } from '$lib/stores/theme.svelte';
	import { localeStore } from '$lib/stores/locale.svelte';
	import type { TranslationKey } from '$lib/i18n';

	let open = $state(false);

	const themes: { value: Theme; labelKey: TranslationKey; icon: typeof Sun }[] = [
		{ value: 'light', labelKey: 'theme.light', icon: Sun },
		{ value: 'dark', labelKey: 'theme.dark', icon: Moon },
		{ value: 'system', labelKey: 'theme.system', icon: Monitor }
	];

	const currentTheme = $derived(themes.find((t) => t.value === themeStore.theme) || themes[2]);

	function selectTheme(theme: Theme) {
		themeStore.theme = theme;
		themeStore.saveToServer();
		open = false;
	}

	function closeMenu() {
		open = false;
	}
</script>

<svelte:window onclick={closeMenu} />

<div class="relative">
	<button
		onclick={(e) => {
			e.stopPropagation();
			open = !open;
		}}
		class="p-1 rounded hover:bg-surface text-muted hover:text-foreground transition-colors"
		title="Theme: {localeStore.t(currentTheme.labelKey)}"
	>
		<svelte:component this={currentTheme.icon} size={14} strokeWidth={1.5} />
	</button>

	{#if open}
		<div
			class="absolute right-0 top-full mt-1 w-28 bg-background border border-border rounded shadow-lg py-0.5 z-50"
			onclick={(e) => e.stopPropagation()}
			role="menu"
		>
			{#each themes as theme (theme.value)}
				<button
					onclick={() => selectTheme(theme.value)}
					class="flex items-center gap-2 w-full px-2 py-1.5 text-[11px] transition-colors {themeStore.theme === theme.value
						? 'text-accent bg-accent/5'
						: 'text-foreground hover:bg-surface'}"
					role="menuitem"
				>
					<svelte:component this={theme.icon} size={12} strokeWidth={1.5} />
					{localeStore.t(theme.labelKey)}
				</button>
			{/each}
		</div>
	{/if}
</div>
