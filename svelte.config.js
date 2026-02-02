import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		alias: {
			$components: 'src/lib/components'
		},
		// CSRF origin check disabled for self-hosted flexibility
		// Security relies on: HttpOnly cookies, SameSite=Lax, API tokens
		// See README.md for security documentation
		csrf: {
			checkOrigin: false
		}
	}
};

export default config;
