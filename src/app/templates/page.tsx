"use client";

import { useEffect, useState } from "react";
import { supabase, DocumentTemplate } from "@/lib/supabase";
import { useLang } from "@/lib/i18n";
import { FileText, Search, Eye, Download, X } from "lucide-react";

export default function TemplatesPage() {
  const { lang, t } = useLang();
  const [items, setItems] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [previewItem, setPreviewItem] = useState<DocumentTemplate | null>(null);
  const [previewLang, setPreviewLang] = useState<"ky" | "ru">("ky");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("document_templates")
        .select("*")
        .eq("status", "published")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      setItems((data as DocumentTemplate[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  const categories = Array.from(new Set(items.map((i) => i.category))).filter(Boolean);

  const filtered = items.filter((item) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.title_ky.toLowerCase().includes(q) ||
      item.title_ru.toLowerCase().includes(q) ||
      item.description_ky.toLowerCase().includes(q) ||
      item.description_ru.toLowerCase().includes(q);
    const matchesCat = category === "all" || item.category === category;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-stone-900">
          {lang === "ky" ? "«Үлгүлөр» китепканасы" : "Библиотека «Үлгүлөр»"}
        </h1>
        <p className="text-sm text-stone-600">
          {lang === "ky"
            ? "Иш кагаздарынын расмий үлгүлөрү (кыргыз жана орус тилдеринде)."
            : "Официальные образцы документов и договоров на кыргызском и русском языках."}
        </p>
      </div>

      <div className="academic-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              lang === "ky" ? "Документтин аталышы боюнча издөө..." : "Поиск по названию или описанию..."
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

      {loading ? (
        <div className="academic-card p-12 text-center text-sm text-stone-500">
          Загрузка...
        </div>
      ) : filtered.length === 0 ? (
        <div className="academic-card p-12 text-center space-y-3">
          <FileText className="w-10 h-10 text-birch-300 mx-auto" />
          <p className="text-stone-600 max-w-lg mx-auto text-sm leading-relaxed">
            {items.length === 0
              ? t.emptyTemplates
              : lang === "ky"
              ? "Издөө боюнча документтер табылган жок."
              : "По заданным фильтрам документы не найдены."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((item) => (
            <div key={item.id} className="academic-card p-5 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-pine-50 text-pine-800">
                    {item.category}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-stone-900">
                  {lang === "ky" ? item.title_ky : item.title_ru}
                </h2>
                <p className="text-xs text-birch-700">
                  {lang === "ky" ? item.title_ru : item.title_ky}
                </p>
                {(lang === "ky" ? item.description_ky : item.description_ru) && (
                  <p className="text-sm text-stone-600">
                    {lang === "ky" ? item.description_ky : item.description_ru}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-birch-100">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewItem(item);
                    setPreviewLang(lang);
                  }}
                  className="btn-secondary text-xs py-2"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {t.preview}
                </button>
                {item.file_docx_ky_url && (
                  <a
                    href={item.file_docx_ky_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary text-xs py-2"
                  >
                    <Download className="w-3.5 h-3.5" /> DOCX (KY)
                  </a>
                )}
                {item.file_pdf_ky_url && (
                  <a
                    href={item.file_pdf_ky_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary text-xs py-2"
                  >
                    <Download className="w-3.5 h-3.5" /> PDF (KY)
                  </a>
                )}
                {item.file_docx_ru_url && (
                  <a
                    href={item.file_docx_ru_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary text-xs py-2"
                  >
                    <Download className="w-3.5 h-3.5" /> DOCX (RU)
                  </a>
                )}
                {item.file_pdf_ru_url && (
                  <a
                    href={item.file_pdf_ru_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary text-xs py-2"
                  >
                    <Download className="w-3.5 h-3.5" /> PDF (RU)
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-birch-200 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  {previewLang === "ky" ? previewItem.title_ky : previewItem.title_ru}
                </h3>
                <p className="text-xs text-stone-500">{previewItem.category}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewLang("ky")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    previewLang === "ky"
                      ? "bg-pine-700 text-white"
                      : "bg-birch-100 text-stone-700"
                  }`}
                >
                  Кыргызча
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewLang("ru")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    previewLang === "ru"
                      ? "bg-pine-700 text-white"
                      : "bg-birch-100 text-stone-700"
                  }`}
                >
                  Русский
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="p-2 rounded-lg hover:bg-birch-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {(previewLang === "ky"
                ? previewItem.content_ky
                : previewItem.content_ru) && (
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-stone-800 bg-birch-50 p-5 rounded-xl border border-birch-200 font-serif">
                  {previewLang === "ky"
                    ? previewItem.content_ky
                    : previewItem.content_ru}
                </div>
              )}

              {(previewLang === "ky"
                ? previewItem.file_pdf_ky_url
                : previewItem.file_pdf_ru_url) && (
                <iframe
                  src={
                    (previewLang === "ky"
                      ? previewItem.file_pdf_ky_url
                      : previewItem.file_pdf_ru_url) || ""
                  }
                  className="w-full h-[500px] rounded-xl border border-birch-200"
                  title="PDF Preview"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
