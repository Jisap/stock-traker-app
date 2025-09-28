// d:/React-Utilidades/next15-stocktracker/types/country-flag-emoji.d.ts

declare module 'country-flag-emoji' {
  export default function getUnicodeFlagIcon(countryCode: string): string;
  interface Country {
    code: string;
    unicode: string;
    name: string;
    emoji: string;
  }

  const countryFlagEmoji: {
    data: { [countryCode: string]: Country };
    list: Country[];
    countryCodes: string[];
    get(countryCode: string): Country | undefined;
  };

  export default countryFlagEmoji;
}
