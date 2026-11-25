"use client";

import { CheckCircle2, AlertCircle, X } from "lucide-react";

export interface ToastMessage {
  type: "success" | "error";
  text: string;
}

export function Toast({
  toast,
  onClose,
}: {
  toast: ToastMessage | null;
  onClose: () => void;
}) {
  if (!toast) return null;

  const isSuccess = toast.type === "success";
  return (
    <div
      className={`fixed bottom-5 right-5 z-50 max-w-md flex items-start gap-3 px-4 py-3.5 rounded-xl shadow-lg border ${
        isSuccess
          ? "bg-emerald-50 border-emerald-300 text-emerald-900"
          : "bg-red-50 border-red-300 text-red-900"
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
      ) : (
        <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
      )}
      <p className="text-sm font-medium leading-snug">{toast.text}</p>
      <button
        type="button"
        onClick={onClose}
        className="ml-2 opacity-60 hover:opacity-100"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
