import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		alias: {
			$components: 'src/lib/components'
		},
		// CSRF origin check is enabled by default (secure)
		// Set DISABLE_CSRF=true to disable (auto-set when ORIGIN is not configured)
		csrf: {
			checkOrigin: process.env.DISABLE_CSRF !== 'true'
		}
	}
};

export default config;
