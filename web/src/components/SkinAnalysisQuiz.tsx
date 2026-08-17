"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus } from "lucide-react";
import { QUESTIONS, computeResult } from "@/data/skinAnalysis";
import { recommendFor } from "@/data/allTreatments";
import { LIVE_LINKS, WHATSAPP_URL } from "@/lib/site";
import { submitAnalysis } from "@/lib/supabase";
import { saveSubmissionLocally } from "@/lib/analysisStore";

const TOTAL = QUESTIONS.length;

export default function SkinAnalysisQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const submittedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isIntro = step === 0;
  const isQuestion = step >= 1 && step <= TOTAL;
  const isResult = step === TOTAL + 1;

  function handleFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  }

  function select(key: string, value: string) {
    setAnswers((a) => ({ ...a, [key]: value }));
  }

  function start() {
    if (customerName.trim()) setStep(1);
  }

  async function submit() {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const result = computeResult(answers);
    const payload = {
      customerName: customerName.trim(),
      customerContact: customerContact.trim(),
      answers,
      skinType: result.skinType,
      concerns: result.concerns,
      tags: result.tags,
    };
    saveSubmissionLocally({ ...payload, photo });
    try {
      await submitAnalysis({ ...payload, photoDataUrl: photo });
    } catch (e) {
      console.error("[dreena] could not save analysis to Supabase — kept locally only", e);
    }
  }

  function next() {
    const nextStep = Math.min(step + 1, TOTAL + 1);
    setStep(nextStep);
    if (nextStep === TOTAL + 1) submit();
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function restart() {
    submittedRef.current = false;
    setStep(0);
    setAnswers({});
  }

  return (
    <div className="mx-auto max-w-[640px] px-6 pb-20 pt-32 md:pt-40">
      {isIntro && (
        <div className="rounded-sm bg-background-secondary p-8 text-center md:p-12">
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-taupe-dark">
            Skin Analysis
          </span>
          <h1 className="mt-3 text-balance text-3xl font-medium leading-[1.1] tracking-tight md:text-4xl">
            Find your skin type &amp; treatment
          </h1>
          <p className="mx-auto mt-4 max-w-[46ch] text-sm leading-relaxed text-muted">
            Upload a clear, makeup-free photo (optional) and answer 6 quick questions. We&apos;ll
            give you a simple skin summary and our top treatment picks.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFile(e.dataTransfer.files?.[0]);
            }}
            className="relative mx-auto mt-6 flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border border-dashed border-border-strong bg-background text-center transition-colors hover:border-taupe-dark"
          >
            {photo ? (
              <Image src={photo} alt="Your uploaded photo" fill className="object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-2 px-4 text-xs text-muted">
                <ImagePlus size={20} />
                Drop a selfie
                <br />
                (optional)
              </span>
            )}
          </button>

          <div className="mx-auto mt-7 flex max-w-[360px] flex-col gap-4 text-left">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="a-name" className="text-xs font-medium uppercase tracking-[0.1em] text-muted">
                Your name
              </label>
              <input
                id="a-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Mei Ling"
                className="rounded-sm border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-taupe-dark"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="a-contact"
                className="text-xs font-medium uppercase tracking-[0.1em] text-muted"
              >
                Phone / WhatsApp (optional)
              </label>
              <input
                id="a-contact"
                value={customerContact}
                onChange={(e) => setCustomerContact(e.target.value)}
                placeholder="e.g. 012-345 6789"
                className="rounded-sm border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-taupe-dark"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={!customerName.trim()}
            onClick={start}
            className="mt-7 rounded-full bg-taupe-dark px-8 py-3.5 text-sm font-medium uppercase tracking-[0.12em] text-cream transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start the Analysis
          </button>

          <p className="mx-auto mt-5 max-w-[44ch] text-xs leading-relaxed text-muted/80">
            By continuing, you agree d&apos;reena beauty may keep your photo, name and answers on
            file to give you this recommendation and follow up about your visit.
          </p>
        </div>
      )}

      {isQuestion && (
        <QuestionCard
          step={step}
          total={TOTAL}
          answers={answers}
          onSelect={select}
          onBack={back}
          onNext={next}
        />
      )}

      {isResult && (
        <ResultCard
          answers={answers}
          photo={photo}
          onRestart={restart}
        />
      )}
    </div>
  );
}

function QuestionCard({
  step,
  total,
  answers,
  onSelect,
  onBack,
  onNext,
}: {
  step: number;
  total: number;
  answers: Record<string, string>;
  onSelect: (key: string, value: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const question = QUESTIONS[step - 1];
  const selectedValue = answers[question.key];
  const progress = Math.round((step / (total + 1)) * 100);

  return (
    <div className="rounded-sm bg-background-secondary p-8 md:p-12">
      <p className="text-xs font-medium uppercase tracking-[0.1em] text-taupe-dark">
        Question {step} of {total}
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-champagne">
        <div
          className="h-full rounded-full bg-taupe-dark transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <h2 className="mt-6 text-balance text-2xl font-medium leading-snug tracking-tight text-foreground">
        {question.title}
      </h2>

      <div className="mt-6 flex flex-col gap-2.5">
        {question.options.map((opt) => {
          const selected = selectedValue === opt.value;
          return (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-center gap-3 rounded-sm border px-4 py-3.5 transition-colors ${
                selected
                  ? "border-taupe-dark bg-champagne"
                  : "border-transparent bg-background hover:border-border-strong"
              }`}
            >
              <input
                type="radio"
                name={question.key}
                checked={selected}
                onChange={() => onSelect(question.key, opt.value)}
                className="accent-[var(--taupe-dark)]"
              />
              <span className="text-sm text-foreground">{opt.label}</span>
            </label>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium uppercase tracking-[0.1em] text-muted transition-colors hover:text-foreground"
        >
          Back
        </button>
        <button
          type="button"
          disabled={!selectedValue}
          onClick={onNext}
          className="rounded-full bg-taupe-dark px-8 py-3.5 text-sm font-medium uppercase tracking-[0.12em] text-cream transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {step === total ? "See My Results" : "Next"}
        </button>
      </div>
    </div>
  );
}

function ResultCard({
  answers,
  onRestart,
}: {
  answers: Record<string, string>;
  photo: string | null;
  onRestart: () => void;
}) {
  const result = computeResult(answers);
  const recommended = recommendFor(result.concerns);

  return (
    <div className="rounded-sm bg-background-secondary p-8 md:p-12">
      <span className="text-xs font-medium uppercase tracking-[0.25em] text-taupe-dark">
        Your Skin Summary
      </span>
      <div className="mt-4 inline-block rounded-full bg-champagne px-4 py-2 text-sm font-medium text-taupe-dark">
        {result.skinType} Skin
      </div>
      <p className="mt-4 text-base leading-relaxed text-foreground/85">{result.blurb}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {result.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-border-strong px-3.5 py-1.5 text-xs font-medium text-foreground/70"
          >
            {tag}
          </span>
        ))}
      </div>

      <h3 className="mt-8 text-lg font-medium tracking-tight text-foreground">
        Recommended treatments for you
      </h3>
      <div className="mt-4 flex flex-col gap-3">
        {recommended.map((t) => (
          <div
            key={t.slug}
            className="flex items-center justify-between gap-4 rounded-sm bg-background px-5 py-4"
          >
            <div>
              <div className="text-base font-medium tracking-tight text-foreground">{t.name}</div>
              <p className="mt-1 max-w-[40ch] text-xs leading-relaxed text-muted">{t.summary}</p>
            </div>
            <a
              href={LIVE_LINKS.treatment(t.slug)}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-full border border-foreground/20 px-4 py-2 text-xs font-medium uppercase tracking-[0.1em] text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              View
            </a>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onRestart}
          className="text-sm font-medium uppercase tracking-[0.1em] text-muted transition-colors hover:text-foreground"
        >
          Retake Analysis
        </button>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-taupe-dark px-8 py-3.5 text-sm font-medium uppercase tracking-[0.12em] text-cream transition-opacity hover:opacity-90"
        >
          Book on WhatsApp
        </a>
      </div>

      <p className="mt-6 text-xs text-muted/70">
        This is a simple guide based on your answers, not a medical diagnosis. Your therapist
        will confirm the best plan at consultation.
      </p>
    </div>
  );
}
