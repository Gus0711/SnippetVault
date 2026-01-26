import { browser } from '$app/environment';

export type Theme = 'light' | 'dark' | 'system';

class ThemeStore {
	private _theme = $state<Theme>('system');

	constructor() {
		if (browser) {
			const stored = localStorage.getItem('theme') as Theme | null;
			this._theme = stored || 'system';
			this.applyTheme();

			// Listen for system preference changes
			window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
				if (this._theme === 'system') {
					this.applyTheme();
				}
			});
		}
	}

	get theme() {
		return this._theme;
	}

	set theme(value: Theme) {
		this._theme = value;
		if (browser) {
			localStorage.setItem('theme', value);
			this.applyTheme();
		}
	}

	private applyTheme() {
		if (!browser) return;

		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		const isDark = this._theme === 'dark' || (this._theme === 'system' && prefersDark);

		if (isDark) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}

	get isDark() {
		if (!browser) return false;
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		return this._theme === 'dark' || (this._theme === 'system' && prefersDark);
	}

	async saveToServer() {
		if (!browser) return;
		try {
			await fetch('/api/user/theme', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ theme: this._theme })
			});
		} catch (e) {
			console.error('Failed to save theme preference:', e);
		}
	}

	init(serverTheme: Theme) {
		// Server theme takes precedence if different from localStorage
		if (browser) {
			const localTheme = localStorage.getItem('theme') as Theme | null;
			if (!localTheme && serverTheme) {
				this.theme = serverTheme;
			}
		}
	}
}

export const themeStore = new ThemeStore();
