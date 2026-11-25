"use client";

import React, { createContext, useContext, useState } from "react";

export type Lang = "ru" | "ky";

const dict = {
  ru: {
    siteTitle: "MAMTIL.KMMA",
    siteSubtitle:
      "Сектор развития государственного языка КГМА им. И. К. Ахунбаева",
    navHome: "Главная",
    navTemplates: "Үлгүлөр",
    navDictionary: "Мед. словарь",
    navLegal: "НПА",
    navTranslator: "ИИ-переводчик",
    navAdmin: "Админ-панель",
    heroTitle: "Портал развития государственного языка КГМА",
    heroDesc:
      "Официальные образцы документов, проверенный медицинский словарь, нормативно-правовая база и академический ИИ-переводчик.",
    searchPlaceholder: "Поиск по документам, терминам и НПА...",
    searchBtn: "Найти",
    emptyTemplates:
      "Библиотека «Үлгүлөр» наполняется. Опубликованные образцы документов появятся здесь сразу после добавления администратором.",
    emptyDictionary:
      "Медицинский словарь наполняется проверенными терминами. Здесь публикуются только записи со статусом «Проверено».",
    emptyLegal:
      "Раздел нормативно-правовых документов наполняется. Опубликованные документы появятся здесь позже.",
    preview: "Просмотр",
    downloadDocx: "Скачать DOCX",
    downloadPdf: "Скачать PDF",
    allCategories: "Все категории",
    close: "Закрыть",
    footerText:
      "© КГМА им. И. К. Ахунбаева — Сектор развития государственного языка (MAMTIL.KMMA)",
  },
  ky: {
    siteTitle: "MAMTIL.KMMA",
    siteSubtitle:
      "И. К. Ахунбаев атындагы КММАнын Мамлекеттик тилди өнүктүрүү сектору",
    navHome: "Башкы бет",
    navTemplates: "Үлгүлөр",
    navDictionary: "Мед. сөздүк",
    navLegal: "ЧУА",
    navTranslator: "ЖИ-котормочу",
    navAdmin: "Админ-панель",
    heroTitle: "КММАнын мамлекеттик тилди өнүктүрүү порталы",
    heroDesc:
      "Иш кагаздарынын расмий үлгүлөрү, текшерилген медициналык сөздүк, ченемдик-укуктук актылар жана академиялык ЖИ-котормочу.",
    searchPlaceholder: "Документтер, терминдер жана ЧУА боюнча издөө...",
    searchBtn: "Издөө",
    emptyTemplates:
      "«Үлгүлөр» китепканасы толтурулууда. Жарыяланган иш кагаздарынын үлгүлөрү администратор кошкондон кийин ушул жерде чыгат.",
    emptyDictionary:
      "Медициналык сөздүк текшерилген терминдер менен толтурулууда. Бул жерде «Текшерилген» статусу бар жазуулар гана жарыяланат.",
    emptyLegal:
      "Ченемдик-укуктук документтер бөлүмү толтурулууда. Жарыяланган документтер кийинчерээк чыгат.",
    preview: "Көрүү",
    downloadDocx: "DOCX жүктөө",
    downloadPdf: "PDF жүктөө",
    allCategories: "Бардык категориялар",
    close: "Жабуу",
    footerText:
      "© И. К. Ахунбаев атындагы КММА — Мамлекеттик тилди өнүктүрүү сектору (MAMTIL.KMMA)",
  },
};

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (typeof dict)["ru"];
}

const LanguageContext = createContext<LangContextValue>({
  lang: "ru",
  setLang: () => {},
  t: dict.ru,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("ru");
  return (
    <LanguageContext.Provider value={{ lang, setLang, t: dict[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
