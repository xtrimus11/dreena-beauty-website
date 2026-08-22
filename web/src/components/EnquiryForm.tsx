"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { WHATSAPP_URL } from "@/lib/site";

// No backend on this app yet, so "submitting" this form builds a
// pre-filled WhatsApp message from what was entered and opens a chat —
// real and functional, rather than a form that silently goes nowhere.
export default function EnquiryForm() {
  const t = useTranslations("contact.form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = [
      t("whatsappGreeting"),
      name && `${t("whatsappName")}: ${name}`,
      phone && `${t("whatsappPhone")}: ${phone}`,
      interest && `${t("whatsappInterest")}: ${interest}`,
      message && `${t("whatsappMessage")}: ${message}`,
    ].filter(Boolean);
    const url = `${WHATSAPP_URL}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-sm bg-background-secondary p-8">
      <div className="flex flex-col gap-2">
        <label htmlFor="c-name" className="text-xs font-medium uppercase tracking-[0.1em] text-muted">
          {t("name")}
        </label>
        <input
          id="c-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("namePlaceholder")}
          className="rounded-sm border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-taupe-dark"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="c-phone" className="text-xs font-medium uppercase tracking-[0.1em] text-muted">
          {t("phone")}
        </label>
        <input
          id="c-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t("phonePlaceholder")}
          className="rounded-sm border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-taupe-dark"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="c-treat" className="text-xs font-medium uppercase tracking-[0.1em] text-muted">
          {t("interest")}
        </label>
        <input
          id="c-treat"
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          placeholder={t("interestPlaceholder")}
          className="rounded-sm border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-taupe-dark"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="c-msg" className="text-xs font-medium uppercase tracking-[0.1em] text-muted">
          {t("message")}
        </label>
        <textarea
          id="c-msg"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder={t("messagePlaceholder")}
          className="resize-none rounded-sm border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-taupe-dark"
        />
      </div>

      <button
        type="submit"
        className="mt-2 rounded-full bg-taupe-dark px-6 py-3.5 text-sm font-medium uppercase tracking-[0.12em] text-cream transition-opacity hover:opacity-90"
      >
        {t("submit")}
      </button>
    </form>
  );
}
