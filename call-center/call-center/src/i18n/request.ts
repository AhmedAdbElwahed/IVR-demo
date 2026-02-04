import {getRequestConfig} from 'next-intl/server';
import { Formats } from "next-intl";
import { cookies } from "next/headers";

export const LOCALES = ["en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

export const getNextIntlFormats = (Locale: Locale): Formats => {
  // Varibales
  const CURRENCY = "EGP";
  const numberingSystem = Locale === "ar" ? "arab" : "latn";

  return {
    number: {
      digit: {
        numberingSystem: numberingSystem,
      },
      "currency-base": {
        numberingSystem: numberingSystem,
        currency: CURRENCY,
        style: "currency",
        maximumFractionDigits: 2,
      },
      "currency-base-no-fractions": {
        numberingSystem: numberingSystem,
        currency: CURRENCY,
        style: "currency",
        maximumFractionDigits: 0,
      },
      "currency-full": {
        numberingSystem: numberingSystem,
        currencyDisplay: Locale === "ar" ? "name" : "code",
        currency: CURRENCY,
        style: "currency",
        maximumFractionDigits: 0,
        currencySign: "standard",
      },
      percentage: {
        numberingSystem: numberingSystem,
        style: "percent",
        maximumFractionDigits: 0,
      },
      "percentage-no-fractions": {
        numberingSystem: numberingSystem,
        style: "percent",
        maximumFractionDigits: 0,
      },
    },
    dateTime: {
      "date-short": {
        numberingSystem: numberingSystem,
        dateStyle: "short",
      },
      "date-long": {
        numberingSystem: numberingSystem,
        dateStyle: "long",
      },
      "date-full": {
        numberingSystem: numberingSystem,
        dateStyle: "full",
      },
      "date-max": {
        numberingSystem: numberingSystem,
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        weekday: "short",
      },
      "date-month-only": {
        month: "numeric",
      },
      "date-day-only": {
        day: "numeric",
      },
      "date-time-only": {
        hour: "numeric",
        minute: "numeric",
      },
    },
  };
};



export default getRequestConfig(async () => {
  let locale = "en";

  try {
    const rawLocale = (await cookies()).get("locale")?.value;
    if (rawLocale && typeof rawLocale === "string") {
      // نحاول نفك التشفير بأمان
      locale = decodeURIComponent(rawLocale);
    }
  } catch (error) {
    console.warn("⚠️ Invalid locale cookie, fallback to 'ar'");
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
    formats: getNextIntlFormats(locale as any),
  };
});