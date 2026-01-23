<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
	let loading = $state(false);
</script>

<div class="min-h-screen flex items-center justify-center bg-background">
	<div class="w-full max-w-sm">
		<h1 class="text-xl font-semibold text-foreground mb-6">Connexion</h1>

		<form
			method="POST"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
			class="space-y-4"
		>
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
					placeholder="vous@exemple.com"
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
					autocomplete="current-password"
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
				{loading ? 'Connexion...' : 'Se connecter'}
			</button>
		</form>
	</div>
</div>
