import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Ключ GEMINI_API_KEY ещё не добавлен в настройки Vercel. Добавьте его в Environment Variables для запуска ИИ-переводчика.",
      },
      { status: 503 }
    );
  }

  try {
    const { text, direction, style } = await request.json();
    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Введите текст для перевода." }, { status: 400 });
    }

    const dirText =
      direction === "ky-ru"
        ? "с кыргызского языка на русский язык"
        : "с русского языка на кыргызский язык";

    const prompt = `Ты профессиональный академический переводчик Кыргызской государственной медицинской академии им. И. К. Ахунбаева.
Переведи следующий текст ${dirText}.
Стиль перевода: ${style || "Официально-деловой"}.
Сохраняй точную медицинскую и официальную терминологию, структуру абзацев и деловой тон. Верни только готовый перевод без лишних комментариев.

Текст:
${text}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await res.json();
    const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!translated) {
      return NextResponse.json(
        { error: data?.error?.message || "Не удалось получить перевод." },
        { status: 500 }
      );
    }

    return NextResponse.json({ translated });
  } catch {
    return NextResponse.json(
      { error: "Ошибка соединения с сервисом перевода." },
      { status: 500 }
    );
  }
}
