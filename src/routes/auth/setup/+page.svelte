<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	let { form } = $props();
	let loading = $state(false);
</script>

<div class="min-h-screen flex items-center justify-center bg-background">
	<div class="w-full max-w-sm">
		<div class="flex flex-col items-center mb-8">
			<img src="/images/logo-full.png" alt="SnippetVault" class="h-16 mb-4" />
		</div>
		<h1 class="text-xl font-semibold text-foreground mb-2">Configuration initiale</h1>
		<p class="text-sm text-muted mb-6">Créez le premier compte administrateur</p>

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
				<label for="name" class="block text-sm font-medium text-foreground mb-1">Nom</label>
				<input
					type="text"
					id="name"
					name="name"
					required
					autocomplete="name"
					class="w-full px-3 py-2 bg-surface border border-border rounded-md text-foreground
						   placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
					placeholder="Votre nom"
				/>
			</div>

			<div>
				<label for="email" class="block text-sm font-medium text-foreground mb-1">Email</label>
				<input
					type="email"
					id="email"
					name="email"
					required
					autocomplete="email"
					class="w-full px-3 py-2 bg-surface border border-border rounded-md text-foreground
						   placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
					placeholder="admin@example.com"
				/>
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-foreground mb-1"
					>Mot de passe</label
				>
				<input
					type="password"
					id="password"
					name="password"
					required
					minlength="8"
					autocomplete="new-password"
					class="w-full px-3 py-2 bg-surface border border-border rounded-md text-foreground
						   placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
					placeholder="Minimum 8 caractères"
				/>
			</div>

			<div>
				<label for="confirmPassword" class="block text-sm font-medium text-foreground mb-1"
					>Confirmer le mot de passe</label
				>
				<input
					type="password"
					id="confirmPassword"
					name="confirmPassword"
					required
					autocomplete="new-password"
					class="w-full px-3 py-2 bg-surface border border-border rounded-md text-foreground
						   placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
				/>
			</div>

			{#if form?.error}
				<p class="text-sm text-red-500">{form.error}</p>
			{/if}

			<button
				type="submit"
				disabled={loading}
				class="w-full py-2 px-4 bg-accent text-white rounded-md font-medium
					   hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
					   disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{loading ? 'Création...' : 'Créer le compte admin'}
			</button>
		</form>
	</div>
</div>
