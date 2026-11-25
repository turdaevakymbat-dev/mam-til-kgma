"use client";

import { useEffect, useState } from "react";
import {
  supabase,
  LegalDocument,
  AuditEntry,
  DocStatus,
  uploadPortalFile,
  logAudit,
} from "@/lib/supabase";
import { ToastMessage } from "@/components/Toast";
import { Plus, Trash2, Upload, History, RotateCcw, X, Scale } from "lucide-react";

export function LegalAdmin({ notify }: { notify: (m: ToastMessage) => void }) {
  const [docs, setDocs] = useState<LegalDocument[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [titleKy, setTitleKy] = useState("");
  const [titleRu, setTitleRu] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [docDate, setDocDate] = useState("");
  const [category, setCategory] = useState("НПА");
  const [filePdf, setFilePdf] = useState<string | null>(null);
  const [fileDocx, setFileDocx] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("legal_documents")
      .select("*")
      .order("created_at", { ascending: false });
    setDocs((data as LegalDocument[]) || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(status: DocStatus) {
    if (!titleKy.trim() || !titleRu.trim()) {
      notify({ type: "error", text: "Введите название НПА на кыргызском и русском языках." });
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("legal_documents")
      .insert({
        title_ky: titleKy.trim(),
        title_ru: titleRu.trim(),
        doc_number: docNumber.trim(),
        doc_date: docDate || null,
        category: category.trim() || "НПА",
        file_pdf_url: filePdf,
        file_docx_url: fileDocx,
        status,
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      notify({ type: "error", text: `Ошибка сохранения: ${error.message}` });
    } else {
      if (data?.id) {
        await logAudit({
          entity_type: "legal_document",
          entity_id: data.id,
          action: "create",
          new_data: data,
        });
      }
      notify({ type: "success", text: "Нормативно-правовой документ сохранён." });
      setTitleKy("");
      setTitleRu("");
      setDocNumber("");
      setDocDate("");
      setFilePdf(null);
      setFileDocx(null);
      setShowForm(false);
      load();
    }
  }

  async function handleDelete(doc: LegalDocument) {
    if (!window.confirm(`Удалить документ «${doc.title_ru}»?`)) return;
    const { error } = await supabase.from("legal_documents").delete().eq("id", doc.id);
    if (error) {
      notify({ type: "error", text: error.message });
    } else {
      notify({ type: "success", text: "Документ удалён." });
      load();
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Нормативно-правовые документы</h2>
          <p className="text-sm text-stone-600">Законы, приказы и положения по государственному языку.</p>
        </div>
        <button type="button" onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> Добавить НПА
        </button>
      </div>

      {showForm && (
        <div className="academic-card p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-stone-900">Новый документ НПА</h3>
            <button type="button" onClick={() => setShowForm(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={titleKy}
              onChange={(e) => setTitleKy(e.target.value)}
              placeholder="Название на кыргызском *"
              className="input-field"
            />
            <input
              value={titleRu}
              onChange={(e) => setTitleRu(e.target.value)}
              placeholder="Название на русском *"
              className="input-field"
            />
            <input
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              placeholder="Номер документа (например, № 124)"
              className="input-field"
            />
            <input
              type="date"
              value={docDate}
              onChange={(e) => setDocDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="btn-secondary text-xs cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> {filePdf ? "PDF загружен ✓" : "Загрузить PDF"}
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const { url } = await uploadPortalFile(f, "legal");
                  if (url) setFilePdf(url);
                }}
              />
            </label>
            <label className="btn-secondary text-xs cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> {fileDocx ? "DOCX загружен ✓" : "Загрузить DOCX"}
              <input
                type="file"
                accept=".doc,.docx"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const { url } = await uploadPortalFile(f, "legal");
                  if (url) setFileDocx(url);
                }}
              />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" disabled={saving} onClick={() => handleSave("draft")} className="btn-secondary text-sm">
              Черновик
            </button>
            <button type="button" disabled={saving} onClick={() => handleSave("published")} className="btn-primary text-sm">
              Опубликовать
            </button>
          </div>
        </div>
      )}

      {docs.length === 0 ? (
        <div className="academic-card p-10 text-center space-y-2">
          <Scale className="w-9 h-9 text-birch-300 mx-auto" />
          <p className="text-sm text-stone-600">Раздел НПА пока пуст.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div key={doc.id} className="academic-card p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-stone-900">{doc.title_ru}</div>
                <div className="text-xs text-stone-500">
                  {doc.status} {doc.doc_number && `• № ${doc.doc_number}`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(doc)}
                className="p-2 rounded-lg text-red-600 border border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AuditAdmin({ notify }: { notify: (m: ToastMessage) => void }) {
  const [logs, setLogs] = useState<AuditEntry[]>([]);

  async function load() {
    const { data } = await supabase
      .from("audit_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setLogs((data as AuditEntry[]) || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function restoreVersion(entry: AuditEntry) {
    if (!entry.previous_data) return;
    const table =
      entry.entity_type === "document_template"
        ? "document_templates"
        : entry.entity_type === "medical_term"
        ? "medical_terms"
        : "legal_documents";

    const { error } = await supabase
      .from(table)
      .upsert(entry.previous_data, { onConflict: "id" });

    if (error) {
      notify({ type: "error", text: `Не удалось восстановить: ${error.message}` });
    } else {
      notify({ type: "success", text: "Предыдущая версия успешно восстановлена." });
      load();
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-stone-900">История изменений</h2>
      {logs.length === 0 ? (
        <div className="academic-card p-10 text-center space-y-2">
          <History className="w-9 h-9 text-birch-300 mx-auto" />
          <p className="text-sm text-stone-600">История изменений пока пуста.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((entry) => (
            <div key={entry.id} className="academic-card p-4 flex items-center justify-between gap-4">
              <div className="text-sm">
                <span className="font-semibold text-stone-900">{entry.entity_type}</span>{" "}
                — <span className="text-pine-700 font-medium">{entry.action}</span>
                <div className="text-xs text-stone-500">
                  {new Date(entry.created_at).toLocaleString("ru-RU")}
                </div>
              </div>
              {entry.previous_data && (
                <button
                  type="button"
                  onClick={() => restoreVersion(entry)}
                  className="btn-secondary text-xs py-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Восстановить
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
