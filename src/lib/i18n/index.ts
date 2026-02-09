import { fr, type TranslationKey } from './translations/fr';
import { en } from './translations/en';

export type Locale = 'fr' | 'en';
export type { TranslationKey };

const translations: Record<Locale, Record<TranslationKey, string>> = { fr, en };

export function getTranslation(locale: Locale, key: TranslationKey, params?: Record<string, string | number>): string {
	let text = translations[locale]?.[key] ?? translations.fr[key] ?? key;
	if (params) {
		for (const [k, v] of Object.entries(params)) {
			text = text.replaceAll(`{${k}}`, String(v));
		}
	}
	return text;
}
