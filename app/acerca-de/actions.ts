"use server";

import { Resend } from "resend";

export type ContactFormState = {
  status: "idle" | "success" | "error";
  name?: string;
  error?: string;
};

export async function sendContactMessage(
  prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const msg = String(formData.get("msg") ?? "").trim();

  if (!name || !email || !msg) {
    return { status: "error", error: "FALTAN CAMPOS REQUERIDOS" };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: "Arcade Vault <onboarding@resend.dev>",
    to: "alejo.dev97@gmail.com",
    subject: "Nuevo mensaje — Arcade Vault",
    replyTo: email,
    text: `De: ${name} <${email}>\n\n${msg}`,
  });

  if (error) {
    return { status: "error", error: error.message };
  }

  return { status: "success", name };
}
