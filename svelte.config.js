import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		alias: {
			$components: 'src/lib/components'
		},
		// Disable CSRF origin check for self-hosted deployments
		// In self-hosted scenarios, the origin is not known in advance
		// (users may access via localhost, IP, or custom domain)
		csrf: {
			checkOrigin: false
		}
	}
};

export default config;
