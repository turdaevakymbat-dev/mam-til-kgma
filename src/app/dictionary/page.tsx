"use client";

import { useEffect, useState } from "react";
import { supabase, MedicalTerm } from "@/lib/supabase";
import { useLang } from "@/lib/i18n";
import { BookOpen, Search, CheckCircle2 } from "lucide-react";

const ALPHABET = "АБВГДЕЁЖЗИЙКЛМНҢОӨПРССТУҮФХЦЧШЩЫЭЮЯ".split("");

export default function DictionaryPage() {
  const { lang, t } = useLang();
  const [terms, setTerms] = useState<MedicalTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [letter, setLetter] = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("medical_terms")
        .select("*")
        .eq("is_published", true)
        .eq("verification_status", "verified")
        .order("term_ky", { ascending: true });
      setTerms((data as MedicalTerm[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  const categories = Array.from(new Set(terms.map((x) => x.category))).filter(Boolean);

  const filtered = terms.filter((item) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.term_ky.toLowerCase().includes(q) ||
      item.term_ru.toLowerCase().includes(q) ||
      item.term_la.toLowerCase().includes(q) ||
      item.definition.toLowerCase().includes(q) ||
      item.synonyms.toLowerCase().includes(q);
    const matchesCat = category === "all" || item.category === category;
    const targetWord = (lang === "ky" ? item.term_ky : item.term_ru).toUpperCase();
    const matchesLetter = !letter || targetWord.startsWith(letter);
    return matchesSearch && matchesCat && matchesLetter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-stone-900">
          {lang === "ky" ? "Медициналык сөздүк" : "Медицинский словарь"}
        </h1>
        <p className="text-sm text-stone-600">
          {lang === "ky"
            ? "Кыргызча, орусча жана латынча текшерилген медициналык терминдер."
            : "Проверенные кыргызские, русские и латинские медицинские термины."}
        </p>
      </div>

      <div className="academic-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                lang === "ky"
                  ? "Кыргызча, орусча же латынча термин издөө..."
                  : "Поиск по кыргызскому, русскому или латинскому термину..."
              }
              className="input-field pl-10"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-field sm:w-64"
          >
            <option value="all">{t.allCategories}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-1 pt-1">
          <button
            type="button"
            onClick={() => setLetter("")}
            className={`px-2.5 py-1 rounded text-xs font-medium ${
              !letter ? "bg-pine-700 text-white" : "bg-birch-100 text-stone-700 hover:bg-birch-200"
            }`}
          >
            {lang === "ky" ? "Баары" : "Все"}
          </button>
          {Array.from(new Set(ALPHABET)).map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => setLetter(letter === ch ? "" : ch)}
              className={`w-7 h-7 rounded text-xs font-medium ${
                letter === ch
                  ? "bg-pine-700 text-white"
                  : "bg-birch-100 text-stone-700 hover:bg-birch-200"
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="academic-card p-12 text-center text-sm text-stone-500">
          Загрузка...
        </div>
      ) : filtered.length === 0 ? (
        <div className="academic-card p-12 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-birch-300 mx-auto" />
          <p className="text-stone-600 max-w-lg mx-auto text-sm leading-relaxed">
            {terms.length === 0
              ? t.emptyDictionary
              : lang === "ky"
              ? "Мындай термин табылган жок."
              : "По заданному запросу термины не найдены."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((item) => (
            <article key={item.id} className="academic-card p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="text-lg font-bold text-pine-800">{item.term_ky}</h2>
                  <span className="text-stone-400">•</span>
                  <span className="text-base font-semibold text-stone-900">{item.term_ru}</span>
                  {item.term_la && (
                    <>
                      <span className="text-stone-400">•</span>
                      <span className="text-sm italic text-birch-700">{item.term_la}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs bg-birch-100 text-stone-700">
                    {item.category}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {lang === "ky" ? "Текшерилген" : "Проверено"}
                  </span>
                </div>
              </div>

              {item.definition && (
                <p className="text-sm text-stone-800 leading-relaxed">{item.definition}</p>
              )}
              {item.professional_explanation && (
                <div className="text-sm text-stone-700 bg-birch-50 p-3.5 rounded-lg border border-birch-200">
                  <span className="font-semibold text-stone-900">
                    {lang === "ky" ? "Кесиптик түшүндүрмө: " : "Профессиональное объяснение: "}
                  </span>
                  {item.professional_explanation}
                </div>
              )}

              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-stone-500 pt-1">
                {item.synonyms && (
                  <span>
                    <strong className="text-stone-700">Синонимы:</strong> {item.synonyms}
                  </span>
                )}
                {item.source && (
                  <span>
                    <strong className="text-stone-700">Источник:</strong> {item.source}
                  </span>
                )}
                {item.notes && (
                  <span>
                    <strong className="text-stone-700">Примечания:</strong> {item.notes}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
