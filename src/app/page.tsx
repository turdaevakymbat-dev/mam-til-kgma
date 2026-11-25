"use client";

import { useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n";
import { supabase, DocumentTemplate, MedicalTerm, LegalDocument } from "@/lib/supabase";
import {
  FileText,
  BookOpen,
  Scale,
  Languages,
  Search,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function HomePage() {
  const { lang, t } = useLang();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<{
    templates: DocumentTemplate[];
    terms: MedicalTerm[];
    legal: LegalDocument[];
  }>({ templates: [], terms: [], legal: [] });

  async function handleGlobalSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearched(true);

    const pattern = `%${q}%`;
    const [tplRes, termRes, legRes] = await Promise.all([
      supabase
        .from("document_templates")
        .select("*")
        .eq("status", "published")
        .or(`title_ru.ilike.${pattern},title_ky.ilike.${pattern},description_ru.ilike.${pattern}`)
        .limit(8),
      supabase
        .from("medical_terms")
        .select("*")
        .eq("is_published", true)
        .eq("verification_status", "verified")
        .or(`term_ru.ilike.${pattern},term_ky.ilike.${pattern},term_la.ilike.${pattern}`)
        .limit(8),
      supabase
        .from("legal_documents")
        .select("*")
        .eq("status", "published")
        .or(`title_ru.ilike.${pattern},title_ky.ilike.${pattern}`)
        .limit(8),
    ]);

    setResults({
      templates: (tplRes.data as DocumentTemplate[]) || [],
      terms: (termRes.data as MedicalTerm[]) || [],
      legal: (legRes.data as LegalDocument[]) || [],
    });
    setSearching(false);
  }

  const cards = [
    {
      href: "/templates",
      icon: FileText,
      title: lang === "ky" ? "«Үлгүлөр» китепканасы" : "Библиотека «Үлгүлөр»",
      desc:
        lang === "ky"
          ? "Иш кагаздарынын расмий үлгүлөрү, онлайн көрүү жана DOCX / PDF жүктөө."
          : "Готовые образцы официальных документов с предпросмотром и скачиванием DOCX / PDF.",
    },
    {
      href: "/dictionary",
      icon: BookOpen,
      title: lang === "ky" ? "Медициналык сөздүк" : "Медицинский словарь",
      desc:
        lang === "ky"
          ? "Кыргызча, орусча жана латынча текшерилген медициналык терминдер."
          : "Проверенные кыргызские, русские и латинские медицинские термины с определениями.",
    },
    {
      href: "/translator",
      icon: Languages,
      title: lang === "ky" ? "ЖИ-котормочу" : "ИИ-переводчик",
      desc:
        lang === "ky"
          ? "Расмий жана медициналык стилди сактоо менен KY ↔ RU котормо."
          : "Перевод KY ↔ RU с сохранением официального и медицинского стиля.",
    },
    {
      href: "/legal",
      icon: Scale,
      title:
        lang === "ky"
          ? "Ченемдик-укуктук актылар"
          : "Нормативно-правовые документы",
      desc:
        lang === "ky"
          ? "Мамлекеттик тил боюнча мыйзамдар, буйруктар жана жоболор."
          : "Законы, приказы и положения по развитию государственного языка.",
    },
  ];

  const totalFound =
    results.templates.length + results.terms.length + results.legal.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <section className="academic-card p-8 sm:p-12 bg-gradient-to-br from-white via-birch-50 to-pine-50/40">
        <div className="max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pine-50 border border-pine-100 text-pine-800 text-xs font-semibold">
            {t.siteSubtitle}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
            {t.heroTitle}
          </h1>
          <p className="text-base text-stone-600 leading-relaxed">
            {t.heroDesc}
          </p>

          <form
            onSubmit={handleGlobalSearch}
            className="flex flex-col sm:flex-row gap-2.5 pt-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="input-field pl-10"
              />
            </div>
            <button type="submit" disabled={searching} className="btn-primary">
              {searching ? "..." : t.searchBtn}
            </button>
          </form>
        </div>
      </section>

      {searched && (
        <section className="academic-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-stone-900">
              {lang === "ky" ? "Издөө натыйжалары" : "Результаты поиска"} ({totalFound})
            </h2>
            <button
              type="button"
              onClick={() => {
                setSearched(false);
                setQuery("");
              }}
              className="text-xs text-pine-700 hover:underline"
            >
              {t.close}
            </button>
          </div>
          {totalFound === 0 ? (
            <p className="text-sm text-stone-500">
              {lang === "ky"
                ? "Эч нерсе табылган жок."
                : "По вашему запросу пока ничего не найдено."}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {results.templates.map((item) => (
                <Link
                  key={item.id}
                  href="/templates"
                  className="p-3.5 rounded-lg border border-birch-200 hover:border-pine-600 bg-birch-50/40"
                >
                  <span className="text-[11px] font-semibold uppercase text-pine-700">
                    Үлгүлөр
                  </span>
                  <div className="font-medium text-stone-900">
                    {lang === "ky" ? item.title_ky : item.title_ru}
                  </div>
                </Link>
              ))}
              {results.terms.map((term) => (
                <Link
                  key={term.id}
                  href="/dictionary"
                  className="p-3.5 rounded-lg border border-birch-200 hover:border-pine-600 bg-birch-50/40"
                >
                  <span className="text-[11px] font-semibold uppercase text-birch-700">
                    {lang === "ky" ? "Сөздүк" : "Словарь"}
                  </span>
                  <div className="font-medium text-stone-900">
                    {term.term_ky} — {term.term_ru}{" "}
                    {term.term_la && (
                      <span className="italic text-stone-500">({term.term_la})</span>
                    )}
                  </div>
                </Link>
              ))}
              {results.legal.map((doc) => (
                <Link
                  key={doc.id}
                  href="/legal"
                  className="p-3.5 rounded-lg border border-birch-200 hover:border-pine-600 bg-birch-50/40"
                >
                  <span className="text-[11px] font-semibold uppercase text-stone-600">
                    НПА
                  </span>
                  <div className="font-medium text-stone-900">
                    {lang === "ky" ? doc.title_ky : doc.title_ru}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="grid gap-6 sm:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="academic-card p-6 hover:border-pine-600 hover:shadow-md transition group flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-pine-50 text-pine-700 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-semibold text-stone-900 group-hover:text-pine-800">
                  {card.title}
                </h2>
                <p className="text-sm text-stone-600 leading-relaxed">
                  {card.desc}
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 text-sm font-medium text-pine-700">
                {lang === "ky" ? "Бөлүмгө өтүү" : "Открыть раздел"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </Link>
          );
        })}
      </section>

      <section className="academic-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-birch-100/50">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-pine-700 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-stone-900">
              {lang === "ky"
                ? "Администраторлор үчүн башкаруу панели"
                : "Панель управления для администратора"}
            </h3>
            <p className="text-sm text-stone-600">
              {lang === "ky"
                ? "Документтерди жана медициналык терминдерди кошуу, текшерүү жана жарыялоо."
                : "Самостоятельное добавление, редактирование, проверка и публикация всех материалов портала."}
            </p>
          </div>
        </div>
        <Link href="/admin" className="btn-primary shrink-0">
          {t.navAdmin}
        </Link>
      </section>
    </div>
  );
}
