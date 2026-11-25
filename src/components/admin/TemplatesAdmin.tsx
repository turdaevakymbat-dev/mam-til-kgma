"use client";

import { useEffect, useState } from "react";
import {
  supabase,
  DocumentTemplate,
  DocStatus,
  uploadPortalFile,
  logAudit,
} from "@/lib/supabase";
import { ToastMessage } from "@/components/Toast";
import {
  Plus,
  Search,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  X,
  CheckCircle2,
  FileText,
} from "lucide-react";

const PRESET_CATEGORIES = [
  "Заявления / Арыздар",
  "Приказы / Буйруктар",
  "Договоры / Келишимдер",
  "Справки / Маалымкаттар",
  "Служебные записки / Кызматтык каттар",
  "Протоколы / Протоколдор",
  "Общие / Жалпы",
];

const DRAFT_STORAGE_KEY = "mamtil_template_draft_v1";

type TemplateForm = {
  id?: string;
  title_ky: string;
  title_ru: string;
  description_ky: string;
  description_ru: string;
  category: string;
  content_ky: string;
  content_ru: string;
  file_docx_ky_url: string | null;
  file_pdf_ky_url: string | null;
  file_docx_ru_url: string | null;
  file_pdf_ru_url: string | null;
  status: DocStatus;
  display_order: number;
};

const emptyForm = (nextOrder: number): TemplateForm => ({
  title_ky: "",
  title_ru: "",
  description_ky: "",
  description_ru: "",
  category: PRESET_CATEGORIES[0],
  content_ky: "",
  content_ru: "",
  file_docx_ky_url: null,
  file_pdf_ky_url: null,
  file_docx_ru_url: null,
  file_pdf_ru_url: null,
  status: "draft",
  display_order: nextOrder,
});

export function TemplatesAdmin({
  notify,
}: {
  notify: (msg: ToastMessage) => void;
}) {
  const [items, setItems] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | DocStatus>("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<TemplateForm>(emptyForm(1));
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLang, setPreviewLang] = useState<"ky" | "ru">("ky");
  const [deleteTarget, setDeleteTarget] = useState<DocumentTemplate | null>(null);

  async function loadItems() {
    setLoading(true);
    const { data, error } = await supabase
      .from("document_templates")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) {
      notify({ type: "error", text: `Ошибка загрузки: ${error.message}` });
    } else {
      setItems((data as DocumentTemplate[]) || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadItems();
  }, []);

  // Автосохранение черновика формы в браузере
  useEffect(() => {
    if (showForm && !form.id) {
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form));
      } catch {
        // ignore storage quota errors
      }
    }
  }, [form, showForm]);

  function openNewForm() {
    const nextOrder = items.length > 0 ? Math.max(...items.map((i) => i.display_order)) + 1 : 1;
    let initial = emptyForm(nextOrder);
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.title_ky || parsed.title_ru || parsed.content_ky || parsed.content_ru) {
          initial = { ...initial, ...parsed };
        }
      }
    } catch {
      // ignore
    }
    setForm(initial);
    setShowForm(true);
  }

  function openEditForm(item: DocumentTemplate) {
    setForm({
      id: item.id,
      title_ky: item.title_ky,
      title_ru: item.title_ru,
      description_ky: item.description_ky || "",
      description_ru: item.description_ru || "",
      category: item.category || PRESET_CATEGORIES[0],
      content_ky: item.content_ky || "",
      content_ru: item.content_ru || "",
      file_docx_ky_url: item.file_docx_ky_url,
      file_pdf_ky_url: item.file_pdf_ky_url,
      file_docx_ru_url: item.file_docx_ru_url,
      file_pdf_ru_url: item.file_pdf_ru_url,
      status: item.status,
      display_order: item.display_order,
    });
    setShowForm(true);
  }

  async function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    field:
      | "file_docx_ky_url"
      | "file_pdf_ky_url"
      | "file_docx_ru_url"
      | "file_pdf_ru_url"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingField(field);
    const { url, error } = await uploadPortalFile(file, "templates");
    setUploadingField(null);
    if (error || !url) {
      notify({ type: "error", text: `Не удалось загрузить файл: ${error}` });
      return;
    }
    setForm((prev) => ({ ...prev, [field]: url }));
    notify({ type: "success", text: `Файл «${file.name}» успешно загружен.` });
  }

  async function handleSave(targetStatus: DocStatus) {
    if (!form.title_ky.trim() || !form.title_ru.trim()) {
      notify({
        type: "error",
        text: "Заполните название документа на обоих языках (кыргызском и русском).",
      });
      return;
    }

    setSaving(true);
    const payload = {
      title_ky: form.title_ky.trim(),
      title_ru: form.title_ru.trim(),
      description_ky: form.description_ky.trim(),
      description_ru: form.description_ru.trim(),
      category: form.category.trim() || "Общие",
      content_ky: form.content_ky,
      content_ru: form.content_ru,
      file_docx_ky_url: form.file_docx_ky_url,
      file_pdf_ky_url: form.file_pdf_ky_url,
      file_docx_ru_url: form.file_docx_ru_url,
      file_pdf_ru_url: form.file_pdf_ru_url,
      status: targetStatus,
      display_order: Number(form.display_order) || 0,
    };

    if (form.id) {
      const prev = items.find((i) => i.id === form.id) || null;
      const { error } = await supabase
        .from("document_templates")
        .update(payload)
        .eq("id", form.id);
      if (error) {
        notify({ type: "error", text: `Ошибка сохранения: ${error.message}` });
      } else {
        await logAudit({
          entity_type: "document_template",
          entity_id: form.id,
          action: targetStatus === "published" ? "publish" : targetStatus === "hidden" ? "hide" : "update",
          previous_data: prev as unknown as Record<string, unknown>,
          new_data: payload,
        });
        notify({ type: "success", text: "Изменения документа успешно сохранены." });
        setShowForm(false);
        await loadItems();
      }
    } else {
      const { data, error } = await supabase
        .from("document_templates")
        .insert(payload)
        .select()
        .single();
      if (error) {
        notify({ type: "error", text: `Ошибка добавления: ${error.message}` });
      } else {
        if (data?.id) {
          await logAudit({
            entity_type: "document_template",
            entity_id: data.id,
            action: "create",
            new_data: payload,
          });
        }
        try {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch {
          // ignore
        }
        notify({
          type: "success",
          text:
            targetStatus === "published"
              ? "Документ опубликован в библиотеке «Үлгүлөр»."
              : "Черновик документа успешно сохранён.",
        });
        setShowForm(false);
        await loadItems();
      }
    }
    setSaving(false);
  }

  async function toggleStatus(item: DocumentTemplate, nextStatus: DocStatus) {
    const { error } = await supabase
      .from("document_templates")
      .update({ status: nextStatus })
      .eq("id", item.id);
    if (error) {
      notify({ type: "error", text: `Ошибка: ${error.message}` });
    } else {
      await logAudit({
        entity_type: "document_template",
        entity_id: item.id,
        action: nextStatus === "published" ? "publish" : "hide",
        previous_data: item as unknown as Record<string, unknown>,
        new_data: { ...item, status: nextStatus } as unknown as Record<string, unknown>,
      });
      notify({
        type: "success",
        text:
          nextStatus === "published"
            ? "Документ опубликован на сайте."
            : "Документ скрыт с сайта без удаления.",
      });
      loadItems();
    }
  }

  async function moveOrder(index: number, direction: -1 | 1) {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const current = items[index];
    const neighbor = items[targetIdx];

    await Promise.all([
      supabase
        .from("document_templates")
        .update({ display_order: neighbor.display_order === current.display_order ? neighbor.display_order + direction : neighbor.display_order })
        .eq("id", current.id),
      supabase
        .from("document_templates")
        .update({ display_order: current.display_order })
        .eq("id", neighbor.id),
    ]);
    notify({ type: "success", text: "Порядок отображения обновлён." });
    loadItems();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from("document_templates")
      .delete()
      .eq("id", deleteTarget.id);
    if (error) {
      notify({ type: "error", text: `Ошибка удаления: ${error.message}` });
    } else {
      await logAudit({
        entity_type: "document_template",
        entity_id: deleteTarget.id,
        action: "delete",
        previous_data: deleteTarget as unknown as Record<string, unknown>,
      });
      notify({ type: "success", text: "Документ удалён." });
      setDeleteTarget(null);
      loadItems();
    }
  }

  const filtered = items.filter((i) => {
    const q = search.trim().toLowerCase();
    const matchText =
      !q ||
      i.title_ky.toLowerCase().includes(q) ||
      i.title_ru.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || i.status === statusFilter;
    return matchText && matchStatus;
  });

  const statusBadge = (s: DocStatus) => {
    if (s === "published")
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">Опубликован</span>;
    if (s === "hidden")
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800">Скрыт</span>;
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700">Черновик</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Библиотека «Үлгүлөр»</h2>
          <p className="text-sm text-stone-600">
            Добавляйте образцы документов на кыргызском и русском языках, загружайте DOCX/PDF и управляйте публикацией.
          </p>
        </div>
        <button type="button" onClick={openNewForm} className="btn-primary shrink-0">
          <Plus className="w-4 h-4" /> Добавить документ
        </button>
      </div>

      {showForm && (
        <div className="academic-card p-6 space-y-5 border-2 border-pine-600/30">
          <div className="flex items-center justify-between border-b border-birch-200 pb-3">
            <h3 className="text-lg font-bold text-stone-900">
              {form.id ? "Редактирование документа" : "Новый образец документа"}
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="p-1.5 rounded-lg hover:bg-birch-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-stone-800 mb-1">
                Название на кыргызском *
              </label>
              <input
                type="text"
                value={form.title_ky}
                onChange={(e) => setForm({ ...form, title_ky: e.target.value })}
                placeholder="Например: Жумушка кабыл алуу жөнүндө арыз"
                className="input-field"
              />
              <p className="text-xs text-stone-500 mt-1">Обязательное поле — отображается в кыргызской версии.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-800 mb-1">
                Название на русском *
              </label>
              <input
                type="text"
                value={form.title_ru}
                onChange={(e) => setForm({ ...form, title_ru: e.target.value })}
                placeholder="Например: Заявление о приёме на работу"
                className="input-field"
              />
              <p className="text-xs text-stone-500 mt-1">Обязательное поле — отображается в русской версии.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-stone-800 mb-1">
                Категория
              </label>
              <input
                list="template-categories"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Выберите из списка или введите свою"
                className="input-field"
              />
              <datalist id="template-categories">
                {PRESET_CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-800 mb-1">
                Порядок отображения
              </label>
              <input
                type="number"
                value={form.display_order}
                onChange={(e) =>
                  setForm({ ...form, display_order: Number(e.target.value) })
                }
                className="input-field"
              />
              <p className="text-xs text-stone-500 mt-1">Меньшее число отображается выше в списке.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-stone-800 mb-1">
                Краткое описание (KY)
              </label>
              <textarea
                rows={2}
                value={form.description_ky}
                onChange={(e) => setForm({ ...form, description_ky: e.target.value })}
                placeholder="Кратко поясните, для каких случаев нужен этот образец"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-800 mb-1">
                Краткое описание (RU)
              </label>
              <textarea
                rows={2}
                value={form.description_ru}
                onChange={(e) => setForm({ ...form, description_ru: e.target.value })}
                placeholder="Кратко поясните, когда применяется документ"
                className="input-field"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-stone-800 mb-1">
                Текст документа (кыргызская версия)
              </label>
              <textarea
                rows={6}
                value={form.content_ky}
                onChange={(e) => setForm({ ...form, content_ky: e.target.value })}
                placeholder="Вставьте текст документа на кыргызском языке для быстрого просмотра на сайте..."
                className="input-field font-serif"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-800 mb-1">
                Текст документа (русская версия)
              </label>
              <textarea
                rows={6}
                value={form.content_ru}
                onChange={(e) => setForm({ ...form, content_ru: e.target.value })}
                placeholder="Вставьте текст документа на русском языке..."
                className="input-field font-serif"
              />
            </div>
          </div>

          <div className="bg-birch-50 p-4 rounded-xl border border-birch-200 space-y-3">
            <h4 className="text-sm font-bold text-stone-900">
              Загрузка готовых файлов (DOCX и PDF)
            </h4>
            <p className="text-xs text-stone-600">
              Нажмите на нужную кнопку и выберите файл на компьютере — он автоматически сохранится в облачном хранилище.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  ["file_docx_ky_url", "DOCX (Кыргызский)", ".doc,.docx"],
                  ["file_pdf_ky_url", "PDF (Кыргызский)", ".pdf"],
                  ["file_docx_ru_url", "DOCX (Русский)", ".doc,.docx"],
                  ["file_pdf_ru_url", "PDF (Русский)", ".pdf"],
                ] as const
              ).map(([field, label, accept]) => (
                <div key={field} className="bg-white p-3 rounded-lg border border-birch-200 space-y-2">
                  <div className="text-xs font-semibold text-stone-800">{label}</div>
                  {form[field] ? (
                    <div className="flex items-center justify-between gap-2 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded">
                      <a
                        href={form[field] || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="underline truncate"
                      >
                        Файл загружен
                      </a>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, [field]: null })}
                        className="text-red-600 hover:underline shrink-0"
                      >
                        Убрать
                      </button>
                    </div>
                  ) : (
                    <label className="btn-secondary w-full text-xs py-2 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      {uploadingField === field ? "Загрузка..." : "Выбрать файл"}
                      <input
                        type="file"
                        accept={accept}
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, field)}
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-birch-200">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="btn-secondary text-sm"
            >
              <Eye className="w-4 h-4" /> Предпросмотр перед публикацией
            </button>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave("draft")}
                className="btn-secondary text-sm"
              >
                Сохранить как черновик
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave("hidden")}
                className="btn-secondary text-sm"
              >
                Сохранить скрытым
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave("published")}
                className="btn-primary text-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                {saving ? "Сохранение..." : "Опубликовать"}
              </button>
            </div>
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
            placeholder="Поиск по вашим документам..."
            className="input-field pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | DocStatus)}
          className="input-field sm:w-52"
        >
          <option value="all">Все статусы</option>
          <option value="published">Опубликованные</option>
          <option value="draft">Черновики</option>
          <option value="hidden">Скрытые</option>
        </select>
      </div>

      {loading ? (
        <div className="academic-card p-10 text-center text-sm text-stone-500">Загрузка...</div>
      ) : filtered.length === 0 ? (
        <div className="academic-card p-10 text-center space-y-2">
          <FileText className="w-9 h-9 text-birch-300 mx-auto" />
          <p className="text-sm text-stone-600">
            {items.length === 0
              ? "Библиотека пока пустая. Нажмите «Добавить документ», чтобы создать первый образец."
              : "По заданному фильтру документы не найдены."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, idx) => (
            <div
              key={item.id}
              className="academic-card p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  {statusBadge(item.status)}
                  <span className="text-xs text-birch-700 font-medium">{item.category}</span>
                  <span className="text-xs text-stone-400">№ {item.display_order}</span>
                </div>
                <div className="font-semibold text-stone-900">
                  {item.title_ky} / {item.title_ru}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => moveOrder(idx, -1)}
                  disabled={idx === 0}
                  className="p-2 rounded-lg border border-birch-200 hover:bg-birch-100 disabled:opacity-30"
                  title="Поднять выше"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveOrder(idx, 1)}
                  disabled={idx === filtered.length - 1}
                  className="p-2 rounded-lg border border-birch-200 hover:bg-birch-100 disabled:opacity-30"
                  title="Опустить ниже"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                {item.status === "published" ? (
                  <button
                    type="button"
                    onClick={() => toggleStatus(item, "hidden")}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    <EyeOff className="w-3.5 h-3.5" /> Скрыть
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleStatus(item, "published")}
                    className="btn-primary text-xs py-1.5 px-3"
                  >
                    <Eye className="w-3.5 h-3.5" /> Опубликовать
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openEditForm(item)}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  <Pencil className="w-3.5 h-3.5" /> Изменить
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(item)}
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

      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-birch-200 flex items-center justify-between">
              <div className="font-bold text-stone-900">Предварительный просмотр</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewLang("ky")}
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    previewLang === "ky" ? "bg-pine-700 text-white" : "bg-birch-100"
                  }`}
                >
                  Кыргызча
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewLang("ru")}
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    previewLang === "ru" ? "bg-pine-700 text-white" : "bg-birch-100"
                  }`}
                >
                  Русский
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-birch-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <h3 className="text-xl font-bold text-stone-900">
                {previewLang === "ky" ? form.title_ky || "(Без названия KY)" : form.title_ru || "(Без названия RU)"}
              </h3>
              <p className="text-sm text-stone-600">
                {previewLang === "ky" ? form.description_ky : form.description_ru}
              </p>
              <div className="whitespace-pre-wrap bg-birch-50 p-4 rounded-xl border border-birch-200 text-sm font-serif">
                {(previewLang === "ky" ? form.content_ky : form.content_ru) ||
                  "Текст документа пока не заполнен."}
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-stone-900">Подтвердите удаление</h3>
            <p className="text-sm text-stone-600">
              Вы действительно хотите удалить документ <strong>«{deleteTarget.title_ru}»</strong>?
              Если вы просто хотите убрать его с сайта, лучше использовать кнопку «Скрыть».
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
