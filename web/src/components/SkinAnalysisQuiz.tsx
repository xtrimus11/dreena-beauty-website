"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Camera, ImagePlus } from "lucide-react";
import { QUESTIONS, computeResult } from "@/data/skinAnalysis";
import { recommendFor } from "@/data/allTreatments";
import { WHATSAPP_URL, waLink } from "@/lib/site";
import { submitAnalysis } from "@/lib/supabase";
import { saveSubmissionLocally } from "@/lib/analysisStore";
import CameraCapture from "./CameraCapture";

const TOTAL = QUESTIONS.length;

// Only offer the in-page camera capture on phones/tablets (touch as the
// primary pointer) that actually have a camera API — desktop keeps the
// plain file upload. This is a browser-only capability check, so it's read
// via useSyncExternalStore rather than an effect: the value can never
// change during the component's lifetime, so subscribe is a no-op, and
// getServerSnapshot keeps SSR/hydration consistent (always false there).
function subscribeNoop() {
  return () => {};
}
function getCanUseCameraSnapshot() {
  const isCoarsePointer = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  const hasTouch = navigator.maxTouchPoints > 0;
  const hasCamera = Boolean(navigator.mediaDevices?.getUserMedia);
  return isCoarsePointer && hasTouch && hasCamera;
}
function getCanUseCameraServerSnapshot() {
  return false;
}

export default function SkinAnalysisQuiz() {
  const t = useTranslations("skinAnalysis.intro");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  // The image actually saved to Supabase/local storage. For a file upload
  // this is the same as `photo`; for a camera capture, `photo` is the
  // tight, zoomed-on-face crop (just for the on-page preview) while this
  // is the full, uncropped frame — so nothing outside the guide circle is
  // lost from the actual analysis.
  const [analysisPhoto, setAnalysisPhoto] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const canUseCamera = useSyncExternalStore(
    subscribeNoop,
    getCanUseCameraSnapshot,
    getCanUseCameraServerSnapshot
  );
  const submittedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isIntro = step === 0;
  const isQuestion = step >= 1 && step <= TOTAL;
  const isResult = step === TOTAL + 1;

  function handleFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPhoto(dataUrl);
      setAnalysisPhoto(dataUrl);
    };
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
    saveSubmissionLocally({ ...payload, photo: analysisPhoto });
    try {
      await submitAnalysis({ ...payload, photoDataUrl: analysisPhoto });
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
            {t("kicker")}
          </span>
          <h1 className="mt-3 text-balance text-3xl font-medium leading-[1.1] tracking-tight md:text-4xl">
            {t("heading")}
          </h1>
          <p className="mx-auto mt-4 max-w-[46ch] text-sm leading-relaxed text-muted">
            {t("body")}
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
            onClick={() => (canUseCamera ? setShowCamera(true) : fileInputRef.current?.click())}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFile(e.dataTransfer.files?.[0]);
            }}
            className="relative mx-auto mt-6 flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border border-dashed border-border-strong bg-background text-center transition-colors hover:border-taupe-dark"
          >
            {photo ? (
              <Image src={photo} alt="Your uploaded photo" fill className="object-cover" />
            ) : canUseCamera ? (
              <span className="flex flex-col items-center gap-2 px-4 text-xs text-muted">
                <Camera size={20} />
                {t("takePhoto")}
              </span>
            ) : (
              <span className="flex flex-col items-center gap-2 px-4 text-xs text-muted">
                <ImagePlus size={20} />
                {t("dropSelfie")}
              </span>
            )}
          </button>

          {canUseCamera && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mx-auto mt-3 flex items-center justify-center gap-1.5 text-xs font-medium uppercase tracking-[0.1em] text-taupe-dark"
            >
              <ImagePlus size={14} />
              {t("dropSelfie")}
            </button>
          )}

          {showCamera && (
            <CameraCapture
              onCapture={(croppedDataUrl, fullDataUrl) => {
                setPhoto(croppedDataUrl);
                setAnalysisPhoto(fullDataUrl);
                setShowCamera(false);
              }}
              onClose={() => setShowCamera(false)}
            />
          )}

          <div className="mx-auto mt-7 flex max-w-[360px] flex-col gap-4 text-left">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="a-name" className="text-xs font-medium uppercase tracking-[0.1em] text-muted">
                {t("nameLabel")}
              </label>
              <input
                id="a-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={t("namePlaceholder")}
                className="rounded-sm border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-taupe-dark"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="a-contact"
                className="text-xs font-medium uppercase tracking-[0.1em] text-muted"
              >
                {t("contactLabel")}
              </label>
              <input
                id="a-contact"
                value={customerContact}
                onChange={(e) => setCustomerContact(e.target.value)}
                placeholder={t("contactPlaceholder")}
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
            {t("start")}
          </button>

          <p className="mx-auto mt-5 max-w-[44ch] text-xs leading-relaxed text-muted/80">
            {t("consent")}
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

      {isResult && <ResultCard answers={answers} photo={photo} onRestart={restart} />}
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
  const t = useTranslations("skinAnalysis");
  const question = QUESTIONS[step - 1];
  const selectedValue = answers[question.key];
  const progress = Math.round((step / (total + 1)) * 100);

  return (
    <div className="rounded-sm bg-background-secondary p-8 md:p-12">
      <p className="text-xs font-medium uppercase tracking-[0.1em] text-taupe-dark">
        {t("question.progress", { step, total })}
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-champagne">
        <div
          className="h-full rounded-full bg-taupe-dark transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <h2 className="mt-6 text-balance text-2xl font-medium leading-snug tracking-tight text-foreground">
        {t(`questions.${question.key}.title`)}
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
              <span className="text-sm text-foreground">
                {t(`questions.${question.key}.options.${opt.value}`)}
              </span>
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
          {t("question.back")}
        </button>
        <button
          type="button"
          disabled={!selectedValue}
          onClick={onNext}
          className="rounded-full bg-taupe-dark px-8 py-3.5 text-sm font-medium uppercase tracking-[0.12em] text-cream transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {step === total ? t("question.seeResults") : t("question.next")}
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
  const t = useTranslations("skinAnalysis.results");
  const result = computeResult(answers);
  const recommended = recommendFor(result.concerns);

  return (
    <div className="rounded-sm bg-background-secondary p-8 md:p-12">
      <span className="text-xs font-medium uppercase tracking-[0.25em] text-taupe-dark">
        {t("kicker")}
      </span>
      <div className="mt-4 inline-block rounded-full bg-champagne px-4 py-2 text-sm font-medium text-taupe-dark">
        {t("skinTypeLabel", { type: t(`skinTypes.${result.skinType}`) })}
      </div>
      <p className="mt-4 text-base leading-relaxed text-foreground/85">
        {t(`blurbs.${result.skinType}`)}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {result.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-border-strong px-3.5 py-1.5 text-xs font-medium text-foreground/70"
          >
            {t(`tags.${tag}`)}
          </span>
        ))}
      </div>

      <h3 className="mt-8 text-lg font-medium tracking-tight text-foreground">
        {t("recommendedHeading")}
      </h3>
      <div className="mt-4 flex flex-col gap-3">
        {recommended.map((rt) => (
          <div
            key={rt.slug}
            className="flex items-center justify-between gap-4 rounded-sm bg-background px-5 py-4"
          >
            <div>
              <div className="text-base font-medium tracking-tight text-foreground">{rt.name}</div>
              <p className="mt-1 max-w-[40ch] text-xs leading-relaxed text-muted">{rt.summary}</p>
            </div>
            <Link
              href={`/treatments/${rt.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-full border border-foreground/20 px-4 py-2 text-xs font-medium uppercase tracking-[0.1em] text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              {t("view")}
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col justify-between rounded-sm bg-champagne p-6">
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.15em] text-taupe-dark">
              {t("goDeeperKicker")}
            </span>
            <h3 className="mt-2 text-lg font-medium tracking-tight text-foreground">
              {t("goDeeperHeading")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">{t("goDeeperBody")}</p>
          </div>
          <a
            href={waLink(t("goDeeperWhatsapp"))}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-block w-fit rounded-full bg-taupe-dark px-5 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-cream transition-opacity hover:opacity-90"
          >
            {t("goDeeperButton")}
          </a>
        </div>

        <div className="flex flex-col justify-between rounded-sm bg-taupe-dark p-6 text-cream">
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.15em] text-cream/70">
              {t("offerKicker")}
            </span>
            <h3 className="mt-2 text-lg font-medium tracking-tight">{t("offerHeading")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-cream/80">{t("offerBody")}</p>
          </div>
          <a
            href={waLink(t("offerWhatsapp"))}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-block w-fit rounded-full bg-cream px-5 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-taupe-dark transition-opacity hover:opacity-90"
          >
            {t("offerButton")}
          </a>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onRestart}
          className="text-sm font-medium uppercase tracking-[0.1em] text-muted transition-colors hover:text-foreground"
        >
          {t("retake")}
        </button>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-taupe-dark px-8 py-3.5 text-sm font-medium uppercase tracking-[0.12em] text-cream transition-opacity hover:opacity-90"
        >
          {t("bookWhatsapp")}
        </a>
      </div>

      <p className="mt-6 text-xs text-muted/70">{t("disclaimer")}</p>
    </div>
  );
}
