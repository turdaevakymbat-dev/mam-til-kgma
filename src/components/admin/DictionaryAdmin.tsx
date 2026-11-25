"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import {
  supabase,
  MedicalTerm,
  VerificationStatus,
  logAudit,
} from "@/lib/supabase";
import { ToastMessage } from "@/components/Toast";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  CheckCircle2,
  Upload,
  Download,
  X,
  BookOpen,
  ShieldAlert,
} from "lucide-react";

const TERM_CATEGORIES = [
  "Анатомия",
  "Терапия",
  "Хирургия",
  "Педиатрия",
  "Фармакология",
  "Акушерство и гинекология",
  "Неврология",
  "Кардиология",
  "Общая медицина",
];

const TERM_DRAFT_KEY = "mamtil_term_draft_v1";

type TermForm = {
  id?: string;
  term_ky: string;
  term_ru: string;
  term_la: string;
  definition: string;
  professional_explanation: string;
  category: string;
  synonyms: string;
  notes: string;
  source: string;
  verification_status: VerificationStatus;
  is_published: boolean;
};

const emptyTerm = (): TermForm => ({
  term_ky: "",
  term_ru: "",
  term_la: "",
  definition: "",
  professional_explanation: "",
  category: TERM_CATEGORIES[0],
  synonyms: "",
  notes: "",
  source: "",
  verification_status: "draft",
  is_published: false,
});

export function DictionaryAdmin({
  notify,
}: {
  notify: (msg: ToastMessage) => void;
}) {
  const [terms, setTerms] = useState<MedicalTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | VerificationStatus>("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<TermForm>(emptyTerm());
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MedicalTerm | null>(null);

  async function loadTerms() {
    setLoading(true);
    const { data, error } = await supabase
      .from("medical_terms")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      notify({ type: "error", text: `Ошибка загрузки словаря: ${error.message}` });
    } else {
      setTerms((data as MedicalTerm[]) || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadTerms();
  }, []);

  useEffect(() => {
    if (showForm && !form.id) {
      try {
        localStorage.setItem(TERM_DRAFT_KEY, JSON.stringify(form));
      } catch {
        // ignore
      }
    }
  }, [form, showForm]);

  function openNewTerm() {
    let initial = emptyTerm();
    try {
      const saved = localStorage.getItem(TERM_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.term_ky || parsed.term_ru) {
          initial = { ...initial, ...parsed };
        }
      }
    } catch {
      // ignore
    }
    setForm(initial);
    setShowForm(true);
  }

  function openEditTerm(t: MedicalTerm) {
    setForm({
      id: t.id,
      term_ky: t.term_ky,
      term_ru: t.term_ru,
      term_la: t.term_la || "",
      definition: t.definition || "",
      professional_explanation: t.professional_explanation || "",
      category: t.category || "Общая медицина",
      synonyms: t.synonyms || "",
      notes: t.notes || "",
      source: t.source || "",
      verification_status: t.verification_status,
      is_published: t.is_published,
    });
    setShowForm(true);
  }

  async function handleSave(publishNow: boolean) {
    if (!form.term_ky.trim() || !form.term_ru.trim()) {
      notify({
        type: "error",
        text: "Укажите как минимум кыргызский и русский термин.",
      });
      return;
    }

    if (publishNow && form.verification_status !== "verified") {
      notify({
        type: "error",
        text: "Опубликовать можно только проверенный термин. Сначала выберите статус проверки «Проверено».",
      });
      return;
    }

    setSaving(true);
    const payload = {
      term_ky: form.term_ky.trim(),
      term_ru: form.term_ru.trim(),
      term_la: form.term_la.trim(),
      definition: form.definition.trim(),
      professional_explanation: form.professional_explanation.trim(),
      category: form.category.trim() || "Общая медицина",
      synonyms: form.synonyms.trim(),
      notes: form.notes.trim(),
      source: form.source.trim(),
      verification_status: form.verification_status,
      is_published: form.verification_status === "verified" ? publishNow : false,
    };

    if (form.id) {
      const prev = terms.find((x) => x.id === form.id) || null;
      const { error } = await supabase
        .from("medical_terms")
        .update(payload)
        .eq("id", form.id);
      if (error) {
        notify({ type: "error", text: `Ошибка сохранения: ${error.message}` });
      } else {
        await logAudit({
          entity_type: "medical_term",
          entity_id: form.id,
          action: payload.is_published ? "publish" : "update",
          previous_data: prev as unknown as Record<string, unknown>,
          new_data: payload,
        });
        notify({ type: "success", text: "Термин успешно обновлён." });
        setShowForm(false);
        loadTerms();
      }
    } else {
      const { data, error } = await supabase
        .from("medical_terms")
        .insert(payload)
        .select()
        .single();
      if (error) {
        notify({ type: "error", text: `Ошибка добавления: ${error.message}` });
      } else {
        if (data?.id) {
          await logAudit({
            entity_type: "medical_term",
            entity_id: data.id,
            action: "create",
            new_data: payload,
          });
        }
        try {
          localStorage.removeItem(TERM_DRAFT_KEY);
        } catch {
          // ignore
        }
        notify({
          type: "success",
          text: payload.is_published
            ? "Проверенный термин опубликован в словаре."
            : "Запись сохранена в словаре (не опубликована).",
        });
        setShowForm(false);
        loadTerms();
      }
    }
    setSaving(false);
  }

  async function quickVerifyAndPublish(term: MedicalTerm) {
    const { error } = await supabase
      .from("medical_terms")
      .update({ verification_status: "verified", is_published: true })
      .eq("id", term.id);
    if (error) {
      notify({ type: "error", text: `Ошибка: ${error.message}` });
    } else {
      await logAudit({
        entity_type: "medical_term",
        entity_id: term.id,
        action: "verify",
        previous_data: term as unknown as Record<string, unknown>,
        new_data: { ...term, verification_status: "verified", is_published: true } as unknown as Record<string, unknown>,
      });
      notify({ type: "success", text: `Термин «${term.term_ky}» проверен и опубликован.` });
      loadTerms();
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from("medical_terms")
      .delete()
      .eq("id", deleteTarget.id);
    if (error) {
      notify({ type: "error", text: `Ошибка удаления: ${error.message}` });
    } else {
      await logAudit({
        entity_type: "medical_term",
        entity_id: deleteTarget.id,
        action: "delete",
        previous_data: deleteTarget as unknown as Record<string, unknown>,
      });
      notify({ type: "success", text: "Термин удалён из словаря." });
      setDeleteTarget(null);
      loadTerms();
    }
  }

  // Экспорт в Excel (.xlsx) или CSV
  function handleExport(format: "xlsx" | "csv") {
    const rows = terms.map((t) => ({
      "Кыргызский термин": t.term_ky,
      "Русский термин": t.term_ru,
      "Латинский термин": t.term_la,
      Определение: t.definition,
      "Профессиональное объяснение": t.professional_explanation,
      Категория: t.category,
      Синонимы: t.synonyms,
      Примечания: t.notes,
      Источник: t.source,
      "Статус проверки": t.verification_status,
      Опубликован: t.is_published ? "Да" : "Нет",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Медицинский словарь");
    const filename = `mamtil-medical-dictionary.${format}`;
    XLSX.writeFile(wb, filename, { bookType: format });
    notify({ type: "success", text: `Словарь экспортирован в файл ${filename}.` });
  }

  // Скачать пустой шаблон Excel для удобного импорта
  function downloadImportTemplate() {
    const ws = XLSX.utils.json_to_sheet([
      {
        "Кыргызский термин": "",
        "Русский термин": "",
        "Латинский термин": "",
        Определение: "",
        "Профессиональное объяснение": "",
        Категория: "",
        Синонимы: "",
        Примечания: "",
        Источник: "",
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Шаблон");
    XLSX.writeFile(wb, "shablon-med-slovar.xlsx");
  }

  // Импорт из Excel или CSV (импортируются как "На проверке", чтобы администратор проверил перед публикацией)
  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

      const pick = (row: Record<string, unknown>, keys: string[]) => {
        for (const k of keys) {
          if (row[k] !== undefined && String(row[k]).trim() !== "") {
            return String(row[k]).trim();
          }
        }
        return "";
      };

      const rowsToInsert = rawRows
        .map((row) => ({
          term_ky: pick(row, ["Кыргызский термин", "term_ky", "Кыргызча"]),
          term_ru: pick(row, ["Русский термин", "term_ru", "Русский"]),
          term_la: pick(row, ["Латинский термин", "term_la", "Латинский"]),
          definition: pick(row, ["Определение", "definition"]),
          professional_explanation: pick(row, [
            "Профессиональное объяснение",
            "professional_explanation",
          ]),
          category: pick(row, ["Категория", "category"]) || "Общая медицина",
          synonyms: pick(row, ["Синонимы", "synonyms"]),
          notes: pick(row, ["Примечания", "notes"]),
          source: pick(row, ["Источник", "Источник термина", "source"]),
          verification_status: "unverified" as VerificationStatus,
          is_published: false,
        }))
        .filter((r) => r.term_ky && r.term_ru);

      if (rowsToInsert.length === 0) {
        notify({
          type: "error",
          text: "В файле не найдено строк с заполненными колонками «Кыргызский термин» и «Русский термин».",
        });
      } else {
        const { error } = await supabase.from("medical_terms").insert(rowsToInsert);
        if (error) {
          notify({ type: "error", text: `Ошибка импорта: ${error.message}` });
        } else {
          notify({
            type: "success",
            text: `Импортировано терминов: ${rowsToInsert.length}. Они добавлены со статусом «На проверке» — проверьте и опубликуйте их.`,
          });
          loadTerms();
        }
      }
    } catch {
      notify({ type: "error", text: "Не удалось прочитать файл Excel/CSV." });
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  const filtered = terms.filter((t) => {
    const q = search.trim().toLowerCase();
    const matchText =
      !q ||
      t.term_ky.toLowerCase().includes(q) ||
      t.term_ru.toLowerCase().includes(q) ||
      t.term_la.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || t.verification_status === statusFilter;
    return matchText && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Медицинский словарь</h2>
          <p className="text-sm text-stone-600">
            На публичный сайт попадают только термины со статусом «Проверено» и отметкой публикации.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={downloadImportTemplate} className="btn-secondary text-xs py-2">
            Шаблон Excel
          </button>
          <label className="btn-secondary text-xs py-2 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            {importing ? "Импорт..." : "Импорт Excel / CSV"}
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleImport}
            />
          </label>
          <button
            type="button"
            onClick={() => handleExport("xlsx")}
            disabled={terms.length === 0}
            className="btn-secondary text-xs py-2"
          >
            <Download className="w-3.5 h-3.5" /> Экспорт Excel
          </button>
          <button
            type="button"
            onClick={() => handleExport("csv")}
            disabled={terms.length === 0}
            className="btn-secondary text-xs py-2"
          >
            CSV
          </button>
          <button type="button" onClick={openNewTerm} className="btn-primary text-xs py-2">
            <Plus className="w-4 h-4" /> Добавить термин
          </button>
        </div>
      </div>

      {showForm && (
        <div className="academic-card p-6 space-y-4 border-2 border-pine-600/30">
          <div className="flex items-center justify-between border-b border-birch-200 pb-3">
            <h3 className="text-lg font-bold text-stone-900">
              {form.id ? "Редактирование термина" : "Новый медицинский термин"}
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="p-1.5 rounded-lg hover:bg-birch-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-semibold text-stone-800 mb-1">
                Кыргызский термин *
              </label>
              <input
                type="text"
                value={form.term_ky}
                onChange={(e) => setForm({ ...form, term_ky: e.target.value })}
                placeholder="Термин на кыргызском"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-800 mb-1">
                Русский термин *
              </label>
              <input
                type="text"
                value={form.term_ru}
                onChange={(e) => setForm({ ...form, term_ru: e.target.value })}
                placeholder="Термин на русском"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-800 mb-1">
                Латинский термин
              </label>
              <input
                type="text"
                value={form.term_la}
                onChange={(e) => setForm({ ...form, term_la: e.target.value })}
                placeholder="Terminus latinus"
                className="input-field italic"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-stone-800 mb-1">
                Определение
              </label>
              <textarea
                rows={3}
                value={form.definition}
                onChange={(e) => setForm({ ...form, definition: e.target.value })}
                placeholder="Точное краткое определение термина"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-800 mb-1">
                Профессиональное объяснение
              </label>
              <textarea
                rows={3}
                value={form.professional_explanation}
                onChange={(e) =>
                  setForm({ ...form, professional_explanation: e.target.value })
                }
                placeholder="Развёрнутое клиническое или академическое пояснение"
                className="input-field"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-semibold text-stone-800 mb-1">
                Категория
              </label>
              <input
                list="term-categories"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="input-field"
              />
              <datalist id="term-categories">
                {TERM_CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-800 mb-1">
                Синонимы
              </label>
              <input
                type="text"
                value={form.synonyms}
                onChange={(e) => setForm({ ...form, synonyms: e.target.value })}
                placeholder="Через запятую"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-800 mb-1">
                Источник термина
              </label>
              <input
                type="text"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder="Учебник, словарь, МКБ-10, ГОСТ..."
                className="input-field"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-stone-800 mb-1">
                Примечания
              </label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Дополнительные пометки редактора"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-800 mb-1">
                Статус проверки *
              </label>
              <select
                value={form.verification_status}
                onChange={(e) => {
                  const v = e.target.value as VerificationStatus;
                  setForm({
                    ...form,
                    verification_status: v,
                    is_published: v === "verified" ? form.is_published : false,
                  });
                }}
                className="input-field"
              >
                <option value="draft">Черновик</option>
                <option value="unverified">Требует проверки</option>
                <option value="verified">Проверено (можно публиковать)</option>
              </select>
            </div>
          </div>

          {form.verification_status !== "verified" && (
            <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 p-3 rounded-lg">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              Кнопка публикации станет активной только после выбора статуса «Проверено».
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-birch-200">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(false)}
              className="btn-secondary text-sm"
            >
              Сохранить без публикации
            </button>
            <button
              type="button"
              disabled={saving || form.verification_status !== "verified"}
              onClick={() => handleSave(true)}
              className="btn-primary text-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              {saving ? "Сохранение..." : "Опубликовать проверенный термин"}
            </button>
          </div>
        </div>
      )}

      <div className="academic-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по кыргызскому, русскому или латинскому термину..."
            className="input-field pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "all" | VerificationStatus)
          }
          className="input-field sm:w-56"
        >
          <option value="all">Все статусы проверки</option>
          <option value="verified">Проверенные</option>
          <option value="unverified">Требуют проверки</option>
          <option value="draft">Черновики</option>
        </select>
      </div>

      {loading ? (
        <div className="academic-card p-10 text-center text-sm text-stone-500">Загрузка...</div>
      ) : filtered.length === 0 ? (
        <div className="academic-card p-10 text-center space-y-2">
          <BookOpen className="w-9 h-9 text-birch-300 mx-auto" />
          <p className="text-sm text-stone-600">
            {terms.length === 0
              ? "Медицинский словарь пока пуст. Добавьте первый термин вручную или загрузите таблицу Excel / CSV."
              : "По заданному фильтру термины не найдены."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((term) => (
            <div
              key={term.id}
              className="academic-card p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  {term.is_published && term.verification_status === "verified" ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                      Проверен и опубликован
                    </span>
                  ) : term.verification_status === "verified" ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      Проверен (не опубликован)
                    </span>
                  ) : term.verification_status === "unverified" ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800">
                      Требует проверки
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700">
                      Черновик
                    </span>
                  )}
                  <span className="text-xs text-birch-700">{term.category}</span>
                </div>
                <div className="font-semibold text-stone-900">
                  {term.term_ky} — {term.term_ru}{" "}
                  {term.term_la && (
                    <span className="italic text-stone-500 font-normal">({term.term_la})</span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {!(term.is_published && term.verification_status === "verified") && (
                  <button
                    type="button"
                    onClick={() => quickVerifyAndPublish(term)}
                    className="btn-primary text-xs py-1.5 px-3"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Проверить и опубликовать
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openEditTerm(term)}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  <Pencil className="w-3.5 h-3.5" /> Изменить
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(term)}
                  className="p-2 rounded-lg text-red-600 border border-red-200 hover:bg-red-50"
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-stone-900">Подтвердите удаление</h3>
            <p className="text-sm text-stone-600">
              Удалить медицинский термин <strong>«{deleteTarget.term_ky} — {deleteTarget.term_ru}»</strong>?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="btn-secondary text-sm"
              >
                Отмена
              </button>
              <button type="button" onClick={confirmDelete} className="btn-danger text-sm">
                Да, удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
