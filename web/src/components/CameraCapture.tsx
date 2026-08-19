"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

// Full-screen selfie capture with a circular face guide in the upper-middle
// region — everything outside the circle is darkened out, so the customer
// can only really see (and frame their face within) the guide itself.
export default function CameraCapture({
  onCapture,
  onClose,
}: {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setReady(true);
      } catch (e) {
        console.error("[dreena] camera access failed", e);
        setError("Couldn't access your camera — you can upload a photo instead.");
      }
    }

    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Mirror horizontally so the saved photo matches what the customer saw
    // in the selfie preview.
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    stopStream();
    onCapture(dataUrl);
  }

  function close() {
    stopStream();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <button
        type="button"
        onClick={close}
        aria-label="Close camera"
        className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white"
      >
        <X size={20} />
      </button>

      <div className="relative flex-1 overflow-hidden bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover [transform:scaleX(-1)]"
        />

        {!error && (
          <>
            <p className="pointer-events-none absolute inset-x-0 top-[8%] text-center text-sm font-medium text-white/90">
              Center your face in the circle
            </p>
            {/* The huge box-shadow spread paints over everything in this
               overflow-hidden container except the circle itself. */}
            <div
              className="pointer-events-none absolute left-1/2 top-[16%] aspect-square w-[68vmin] max-w-[320px] -translate-x-1/2 rounded-full border-2 border-white/80"
              style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.72)" }}
            />
          </>
        )}

        {error && (
          <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 rounded-sm bg-cream p-6 text-center">
            <p className="text-sm text-foreground/85">{error}</p>
            <button
              type="button"
              onClick={close}
              className="mt-4 rounded-full bg-taupe-dark px-6 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-cream"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {!error && (
        <div className="flex items-center justify-center bg-black py-8">
          <button
            type="button"
            onClick={capture}
            disabled={!ready}
            aria-label="Take photo"
            className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20 disabled:opacity-40"
          >
            <span className="h-12 w-12 rounded-full bg-white" />
          </button>
        </div>
      )}
    </div>
  );
}
