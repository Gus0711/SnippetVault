<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { localeStore } from '$lib/stores/locale.svelte';

	let { form } = $props();
	let loading = $state(false);
</script>

<div class="min-h-screen flex items-center justify-center bg-background">
	<div class="w-full max-w-sm">
		<div class="flex flex-col items-center mb-8">
			<img src="/images/logo-full.png" alt="SnippetVault" class="h-16 mb-4" />
		</div>

		<!-- Language toggle -->
		<div class="flex justify-end mb-4 gap-1">
			<button
				onclick={() => { localeStore.locale = 'fr'; }}
				class="px-2 py-0.5 text-[11px] rounded transition-colors {localeStore.locale === 'fr' ? 'bg-accent/10 text-accent font-medium' : 'text-muted hover:text-foreground'}"
			>FR</button>
			<button
				onclick={() => { localeStore.locale = 'en'; }}
				class="px-2 py-0.5 text-[11px] rounded transition-colors {localeStore.locale === 'en' ? 'bg-accent/10 text-accent font-medium' : 'text-muted hover:text-foreground'}"
			>EN</button>
		</div>

		<h1 class="text-xl font-semibold text-foreground mb-6">{localeStore.t('auth.login.title')}</h1>

		<form
			method="POST"
			use:enhance={() => {
				loading = true;
				return async ({ result, update }) => {
					loading = false;
					if (result.type === 'redirect') {
						goto(result.location);
					} else {
						await update();
					}
				};
			}}
			class="space-y-4"
		>
			<div>
				<label for="email" class="block text-sm font-medium text-foreground mb-1">{localeStore.t('auth.login.email')}</label>
				<input
					type="email"
					id="email"
					name="email"
					required
					autocomplete="email"
					class="w-full px-3 py-2 bg-surface border border-border rounded-md text-foreground
						   placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
					placeholder={localeStore.t('auth.login.emailPlaceholder')}
				/>
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-foreground mb-1"
					>{localeStore.t('auth.login.password')}</label
				>
				<input
					type="password"
					id="password"
					name="password"
					required
					autocomplete="current-password"
					class="w-full px-3 py-2 bg-surface border border-border rounded-md text-foreground
						   placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
				/>
			</div>

			{#if form?.error}
				<p class="text-sm text-red-500">{localeStore.t(form.error)}</p>
			{/if}

			<button
				type="submit"
				disabled={loading}
				class="w-full py-2 px-4 bg-accent text-white rounded-md font-medium
					   hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
					   disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{loading ? localeStore.t('auth.login.loading') : localeStore.t('auth.login.submit')}
			</button>
		</form>
	</div>
</div>
