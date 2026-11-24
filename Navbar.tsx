"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/lib/i18n";
import { BookOpen, FileText, Languages, Scale, ShieldCheck, Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: t.navHome, icon: null },
    { href: "/templates", label: t.navTemplates, icon: FileText },
    { href: "/dictionary", label: t.navDictionary, icon: BookOpen },
    { href: "/legal", label: t.navLegal, icon: Scale },
    { href: "/translator", label: t.navTranslator, icon: Languages },
  ];

  return (
    <header className="sticky top-0 z-40 bg-birch-50/95 backdrop-blur border-b border-birch-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-pine-800">
              {t.siteTitle}
            </span>
            <span className="text-[11px] text-birch-700 hidden sm:block leading-tight">
              {t.siteSubtitle}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {links.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    active
                      ? "bg-pine-50 text-pine-800"
                      : "text-stone-700 hover:bg-birch-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-birch-300 bg-white p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setLang("ky")}
                className={`px-2.5 py-1 rounded-md transition ${
                  lang === "ky"
                    ? "bg-pine-700 text-white"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                KY
              </button>
              <button
                type="button"
                onClick={() => setLang("ru")}
                className={`px-2.5 py-1 rounded-md transition ${
                  lang === "ru"
                    ? "bg-pine-700 text-white"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                RU
              </button>
            </div>

            <Link
              href="/admin"
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                pathname.startsWith("/admin")
                  ? "bg-pine-700 text-white border-pine-700"
                  : "bg-white text-pine-800 border-pine-200 hover:bg-pine-50"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              {t.navAdmin}
            </Link>

            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="md:hidden p-2 rounded-lg text-stone-700 hover:bg-birch-100"
              aria-label="Menu"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden pb-4 pt-2 border-t border-birch-200 flex flex-col gap-1">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  pathname === item.href
                    ? "bg-pine-50 text-pine-800"
                    : "text-stone-700 hover:bg-birch-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-pine-800 bg-pine-50"
            >
              {t.navAdmin}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
