import { getNextIntlFormats } from "@/i18n/request"
import {
  NextIntlClientProvider,
  useLocale,
  useMessages,
  useNow,
  useTimeZone,
} from "next-intl";

type NextIntlClientProviderProps = {
  children: React.ReactNode;
};

export default function NextIntlProvider({
  children,
}: NextIntlClientProviderProps) {
  // Varibales
  const messages = useMessages();
  const locale = useLocale() || "ar"; // Default to 'en' if locale is not set
  const now = useNow();
  const timezone = useTimeZone();

  return (
    <NextIntlClientProvider
      messages={messages}
      locale={locale}
      now={now}
      timeZone={timezone}
      formats={getNextIntlFormats(locale as "ar" | "en")} // Ensure the locale is one of the defined types
    >
      {children}
    </NextIntlClientProvider>
  );
}
