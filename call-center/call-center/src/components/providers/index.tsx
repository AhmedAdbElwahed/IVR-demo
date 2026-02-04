import { NextIntlClientProvider, useMessages } from "next-intl";
import { Check, Info, X } from "lucide-react";
import NextAuthProvider from "./components/next-auth-providers";
import NextIntlProvider from "./components/next-intl-provider";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import ReactQueryProvider from "./components/react-query-provider";


export default function Providers({ children }: { children: React.ReactNode }) {
  // Translation
  const messages = useMessages();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <NextIntlClientProvider messages={messages}>
        <NextAuthProvider>
          <NextIntlProvider>
            <ReactQueryProvider>
                        {children}
                        {/* Toaster */}
                        <Toaster
                          icons={{
                            info: (
                              <Info size={16} className="text-foreground" />
                            ),
                            success: (
                              <Check size={16} className="text-success" />
                            ),
                            error: <X size={16} className="text-error" />,
                          }}
                        />
              </ReactQueryProvider>
          </NextIntlProvider>
        </NextAuthProvider>
      </NextIntlClientProvider>
    </ThemeProvider>

  );
}
