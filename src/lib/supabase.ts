import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type DocStatus = "draft" | "published" | "hidden";
export type VerificationStatus = "draft" | "unverified" | "verified";

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: "admin" | "editor" | "viewer";
}

export interface DocumentTemplate {
  id: string;
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
  views_count: number;
  downloads_count: number;
  created_at: string;
  updated_at: string;
}

export interface MedicalTerm {
  id: string;
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
  created_at: string;
  updated_at: string;
}

export interface LegalDocument {
  id: string;
  title_ky: string;
  title_ru: string;
  doc_number: string;
  doc_date: string | null;
  description_ky: string;
  description_ru: string;
  category: string;
  file_pdf_url: string | null;
  file_docx_url: string | null;
  status: DocStatus;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface AuditEntry {
  id: string;
  entity_type: "document_template" | "medical_term" | "legal_document";
  entity_id: string;
  action: "create" | "update" | "delete" | "publish" | "hide" | "verify";
  previous_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}

export async function uploadPortalFile(
  file: File,
  folder: string
): Promise<{ url: string | null; error: string | null }> {
  const safeExt = file.name.split(".").pop()?.toLowerCase() || "bin";
  const uniqueName = `${folder}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${safeExt}`;

  const { error: uploadError } = await supabase.storage
    .from("portal-files")
    .upload(uniqueName, file, { upsert: true });

  if (uploadError) {
    return { url: null, error: uploadError.message };
  }

  const { data } = supabase.storage.from("portal-files").getPublicUrl(uniqueName);
  return { url: data.publicUrl, error: null };
}

export async function logAudit(params: {
  entity_type: AuditEntry["entity_type"];
  entity_id: string;
  action: AuditEntry["action"];
  previous_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("audit_history").insert({
    entity_type: params.entity_type,
    entity_id: params.entity_id,
    action: params.action,
    previous_data: params.previous_data ?? null,
    new_data: params.new_data ?? null,
    changed_by: user?.id ?? null,
  });
}
