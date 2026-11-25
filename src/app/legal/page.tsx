"use client";

import { useEffect, useState } from "react";
import { supabase, LegalDocument } from "@/lib/supabase";
import { useLang } from "@/lib/i18n";
import { Scale, Download } from "lucide-react";

export default function LegalPage() {
  const { lang, t } = useLang();
  const [docs, setDocs] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("legal_documents")
        .select("*")
        .eq("status", "published")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      setDocs((data as LegalDocument[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-stone-900">
          {lang === "ky"
            ? "Ченемдик-укуктук документтер"
            : "Нормативно-правовые документы"}
        </h1>
      </div>

      {loading ? (
        <div className="academic-card p-12 text-center text-sm text-stone-500">
          Загрузка...
        </div>
      ) : docs.length === 0 ? (
        <div className="academic-card p-12 text-center space-y-3">
          <Scale className="w-10 h-10 text-birch-300 mx-auto" />
          <p className="text-stone-600 max-w-lg mx-auto text-sm leading-relaxed">
            {t.emptyLegal}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="academic-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="text-xs text-birch-700 font-medium">
                  {doc.category} {doc.doc_number && `• № ${doc.doc_number}`}{" "}
                  {doc.doc_date && `• ${doc.doc_date}`}
                </div>
                <h2 className="text-lg font-semibold text-stone-900">
                  {lang === "ky" ? doc.title_ky : doc.title_ru}
                </h2>
                {(lang === "ky" ? doc.description_ky : doc.description_ru) && (
                  <p className="text-sm text-stone-600">
                    {lang === "ky" ? doc.description_ky : doc.description_ru}
                  </p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                {doc.file_pdf_url && (
                  <a
                    href={doc.file_pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary text-xs py-2"
                  >
                    <Download className="w-3.5 h-3.5" /> PDF
                  </a>
                )}
                {doc.file_docx_url && (
                  <a
                    href={doc.file_docx_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary text-xs py-2"
                  >
                    <Download className="w-3.5 h-3.5" /> DOCX
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
