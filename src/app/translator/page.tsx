"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { ArrowLeftRight, Copy, Check } from "lucide-react";

const STYLES = [
  "Официально-деловой",
  "Медицинский / клинический",
  "Научно-академический",
  "Нормативно-правовой",
  "Общедоступный / учебный",
];

export default function TranslatorPage() {
  const { lang } = useLang();
  const [direction, setDirection] = useState<"ru-ky" | "ky-ru">("ru-ky");
  const [style, setStyle] = useState(STYLES[0]);
  const [source, setSource] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleTranslate() {
    if (!source.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: source, direction, style }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка перевода");
      } else {
        setResult(data.translated);
      }
    } catch {
      setError("Не удалось выполнить запрос к серверу.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-stone-900">
          {lang === "ky" ? "Академиялык ЖИ-котормочу" : "Академический ИИ-переводчик"}
        </h1>
        <p className="text-sm text-stone-600">
          Перевод между кыргызским и русским языками с сохранением структуры и официального стиля КГМА.
        </p>
      </div>

      <div className="academic-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setDirection(direction === "ru-ky" ? "ky-ru" : "ru-ky")}
            className="btn-secondary text-sm"
          >
            <span>{direction === "ru-ky" ? "Русский → Кыргызский" : "Кыргызский → Русский"}</span>
            <ArrowLeftRight className="w-4 h-4" />
          </button>

          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="input-field w-full sm:w-72"
          >
            {STYLES.map((s) => (
              <option key={s} value={s}>
                Стиль: {s}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <textarea
            rows={10}
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Введите или вставьте текст документа..."
            className="input-field resize-y"
          />
          <div className="relative">
            <textarea
              rows={10}
              readOnly
              value={result}
              placeholder="Здесь появится готовый перевод..."
              className="input-field resize-y bg-birch-50/60"
            />
            {result && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(result);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1800);
                }}
                className="absolute top-2.5 right-2.5 p-2 rounded-lg bg-white border border-birch-300 text-stone-700 hover:bg-birch-100"
                title="Копировать"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleTranslate}
            disabled={loading || !source.trim()}
            className="btn-primary"
          >
            {loading ? "Переводим..." : "Перевести"}
          </button>
        </div>
      </div>
    </div>
  );
}
