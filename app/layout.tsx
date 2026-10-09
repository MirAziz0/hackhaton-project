import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { getLocale, getT } from "@/lib/i18n/server";
import "./globals.css";

// latin-ext is required for Azerbaijani letters such as "ə".
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

// Display serif for the sign-in headlines.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "latin-ext"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: "Growenta",
    description: t("Growenta — süni intellektli biznes tərəfdaşınız: ideyadan işlək biznesə qədər"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
