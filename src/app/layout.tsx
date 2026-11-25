import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "MAMTIL.KMMA — Портал государственного языка КГМА",
  description:
    "Библиотека образцов документов «Үлгүлөр», проверенный медицинский словарь, НПА и ИИ-переводчик КГМА им. И. К. Ахунбаева.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="min-h-screen flex flex-col bg-birch-50 text-stone-900">
        <LanguageProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-birch-200 bg-birch-100/60 py-6 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-birch-700">
              © {new Date().getFullYear()} КГМА им. И. К. Ахунбаева — Сектор
              развития государственного языка (MAMTIL.KMMA)
            </div>
          </footer>
        </LanguageProvider>
      </body>
    </html>
  );
}
