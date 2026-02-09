import { browser } from '$app/environment';
import { getTranslation, type Locale, type TranslationKey } from '$lib/i18n';

class LocaleStore {
	private _locale = $state<Locale>('fr');

	constructor() {
		if (browser) {
			const stored = localStorage.getItem('locale') as Locale | null;
			if (stored && (stored === 'fr' || stored === 'en')) {
				this._locale = stored;
			} else {
				// Detect browser language for unauthenticated visitors
				const browserLang = navigator.language.slice(0, 2);
				this._locale = browserLang === 'en' ? 'en' : 'fr';
			}
			this.applyLang();
		}
	}

	get locale(): Locale {
		return this._locale;
	}

	set locale(value: Locale) {
		this._locale = value;
		if (browser) {
			localStorage.setItem('locale', value);
			this.applyLang();
		}
	}

	private applyLang() {
		if (!browser) return;
		document.documentElement.lang = this._locale === 'en' ? 'en' : 'fr';
	}

	t(key: TranslationKey, params?: Record<string, string | number>): string {
		return getTranslation(this._locale, key, params);
	}

	async saveToServer() {
		if (!browser) return;
		try {
			await fetch('/api/user/language', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ language: this._locale })
			});
		} catch (e) {
			console.error('Failed to save language preference:', e);
		}
	}

	init(serverLanguage: Locale | undefined) {
		if (browser) {
			const localLocale = localStorage.getItem('locale') as Locale | null;
			if (!localLocale && serverLanguage) {
				this.locale = serverLanguage;
			}
		}
	}
}

export const localeStore = new LocaleStore();
