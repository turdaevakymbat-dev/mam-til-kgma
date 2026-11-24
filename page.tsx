"use client";

import { useEffect, useState } from "react";
import { supabase, UserProfile, isSupabaseConfigured } from "@/lib/supabase";
import { TemplatesAdmin } from "@/components/admin/TemplatesAdmin";
import { DictionaryAdmin } from "@/components/admin/DictionaryAdmin";
import { LegalAdmin, AuditAdmin } from "@/components/admin/LegalAndAuditAdmin";
import { Toast, ToastMessage } from "@/components/Toast";
import {
  FileText,
  BookOpen,
  Scale,
  History,
  LogOut,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

type AdminTab = "templates" | "dictionary" | "legal" | "audit";

export default function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [tab, setTab] = useState<AdminTab>("templates");
  const [toast, setToast] = useState<ToastMessage | null>(null);

  function notify(msg: ToastMessage) {
    setToast(msg);
    setTimeout(() => setToast(null), 5000);
  }

  async function checkSession() {
    setChecking(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setProfile(null);
      setChecking(false);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile((data as UserProfile) || null);
    setChecking(false);
  }

  useEffect(() => {
    checkSession();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setLoggingIn(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoggingIn(false);
    if (error) {
      setAuthError("Неверный email или пароль. Проверьте данные и попробуйте снова.");
      return;
    }
    await checkSession();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="academic-card p-6 space-y-3 border-amber-300 bg-amber-50">
          <div className="flex items-center gap-2 text-amber-900 font-bold">
            <AlertTriangle className="w-5 h-5" />
            Подключите ключи Supabase в настройках Vercel
          </div>
          <p className="text-sm text-amber-900/90">
            Добавьте переменные <code>NEXT_PUBLIC_SUPABASE_URL</code> и{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> в Environment Variables на Vercel и
            нажмите Redeploy.
          </p>
        </div>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-stone-500">
        Проверка доступа...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <form onSubmit={handleLogin} className="academic-card p-8 space-y-5">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-pine-50 text-pine-700 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-stone-900">Вход в админ-панель</h1>
            <p className="text-xs text-stone-500">
              Используйте email и пароль администратора, созданные в Supabase.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-stone-800 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ksma.kg"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-800 mb-1">Пароль</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
              />
            </div>
          </div>

          {authError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
              {authError}
            </div>
          )}

          <button type="submit" disabled={loggingIn} className="btn-primary w-full">
            {loggingIn ? "Вход..." : "Войти"}
          </button>
        </form>
      </div>
    );
  }

  if (profile.role !== "admin" && profile.role !== "editor") {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="academic-card p-6 space-y-3">
          <h1 className="text-lg font-bold text-stone-900">Недостаточно прав</h1>
          <p className="text-sm text-stone-600">
            Ваш аккаунт ({profile.email}) имеет роль <strong>{profile.role}</strong>. Для доступа к
            админ-панели нужна роль <strong>admin</strong> или <strong>editor</strong> в таблице{" "}
            <code>profiles</code>.
          </p>
          <button type="button" onClick={handleLogout} className="btn-secondary">
            Выйти
          </button>
        </div>
      </div>
    );
  }

  const tabs: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "templates", label: "Библиотека «Үлгүлөр»", icon: FileText },
    { id: "dictionary", label: "Медицинский словарь", icon: BookOpen },
    { id: "legal", label: "НПА", icon: Scale },
    { id: "audit", label: "История изменений", icon: History },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="academic-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-white to-pine-50/40">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            Административная панель MAMTIL.KMMA
          </h1>
          <p className="text-xs text-stone-600">
            Вы вошли как <strong>{profile.email}</strong> (роль: {profile.role})
          </p>
        </div>
        <button type="button" onClick={handleLogout} className="btn-secondary text-xs py-2 self-start sm:self-auto">
          <LogOut className="w-4 h-4" /> Выйти
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition ${
                active
                  ? "bg-pine-700 text-white border-pine-700 shadow-sm"
                  : "bg-white text-stone-700 border-birch-200 hover:bg-birch-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === "templates" && <TemplatesAdmin notify={notify} />}
      {tab === "dictionary" && <DictionaryAdmin notify={notify} />}
      {tab === "legal" && <LegalAdmin notify={notify} />}
      {tab === "audit" && <AuditAdmin notify={notify} />}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
