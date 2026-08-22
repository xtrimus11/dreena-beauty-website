"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

// Full-screen selfie capture with a circular face guide in the upper-middle
// region — everything outside the circle is fully covered (not just
// darkened), so the customer can only see the guide itself. The final
// photo is cropped to that same guide region, so it comes out zoomed in on
// just the face rather than the whole frame.
export default function CameraCapture({
  onCapture,
  onClose,
}: {
  /** croppedDataUrl: tight, zoomed-on-face crop for the on-page preview.
   *  fullDataUrl: the whole camera frame, uncropped — this is what should
   *  actually be saved/analysed, since the tight crop can lose context
   *  (jawline, hairline, neck) a therapist would want to see. */
  onCapture: (croppedDataUrl: string, fullDataUrl: string) => void;
  onClose: () => void;
}) {
  const t = useTranslations("skinAnalysis.camera");
  const videoRef = useRef<HTMLVideoElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          // Ask for a large frame so the tight crop around the face guide
          // still has good detail once we zoom into it.
          video: { facingMode: "user", width: { ideal: 1920 }, height: { ideal: 1920 } },
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
        setError(true);
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
    const circle = circleRef.current;
    if (!video || !video.videoWidth || !circle) return;

    // The video is rendered with object-cover, so it's scaled up and
    // symmetrically cropped to fill its box — work out that scale/offset
    // to map screen coordinates back to native video pixel coordinates.
    const videoRect = video.getBoundingClientRect();
    const circleRect = circle.getBoundingClientRect();
    const scale = Math.max(videoRect.width / video.videoWidth, videoRect.height / video.videoHeight);
    const renderedW = video.videoWidth * scale;
    const renderedH = video.videoHeight * scale;
    const offsetX = (renderedW - videoRect.width) / 2;
    const offsetY = (renderedH - videoRect.height) / 2;

    // Circle center, relative to the video box, in CSS px.
    const centerXInBox = circleRect.left + circleRect.width / 2 - videoRect.left;
    const centerYInBox = circleRect.top + circleRect.height / 2 - videoRect.top;
    const radiusInBox = circleRect.width / 2;

    // The video is mirrored on screen (scaleX(-1)) but drawImage always
    // samples the raw, unmirrored frame — so flip the X coordinate back
    // to find where the guide actually sits in that raw frame.
    const mirroredCenterXInBox = videoRect.width - centerXInBox;

    const centerXNative = (mirroredCenterXInBox + offsetX) / scale;
    const centerYNative = (centerYInBox + offsetY) / scale;
    const radiusNative = radiusInBox / scale;

    // Crop a square around the guide circle with a little breathing room,
    // clamped so it never reads outside the actual frame.
    const padding = 1.15;
    const cropSize = Math.min(radiusNative * 2 * padding, video.videoWidth, video.videoHeight);
    const cropX = Math.min(Math.max(centerXNative - cropSize / 2, 0), video.videoWidth - cropSize);
    const cropY = Math.min(Math.max(centerYNative - cropSize / 2, 0), video.videoHeight - cropSize);

    // Cropped, zoomed-on-face version — used for the on-page preview only.
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = cropSize;
    cropCanvas.height = cropSize;
    const cropCtx = cropCanvas.getContext("2d");
    if (!cropCtx) return;
    cropCtx.translate(cropCanvas.width, 0);
    cropCtx.scale(-1, 1);
    cropCtx.drawImage(video, cropX, cropY, cropSize, cropSize, 0, 0, cropSize, cropSize);
    const croppedDataUrl = cropCanvas.toDataURL("image/jpeg", 0.92);

    // Full, uncropped frame — this is what actually gets saved for the
    // analysis, so nothing outside the tight guide circle is lost.
    const fullCanvas = document.createElement("canvas");
    fullCanvas.width = video.videoWidth;
    fullCanvas.height = video.videoHeight;
    const fullCtx = fullCanvas.getContext("2d");
    if (!fullCtx) return;
    fullCtx.translate(fullCanvas.width, 0);
    fullCtx.scale(-1, 1);
    fullCtx.drawImage(video, 0, 0, fullCanvas.width, fullCanvas.height);
    const fullDataUrl = fullCanvas.toDataURL("image/jpeg", 0.92);

    stopStream();
    onCapture(croppedDataUrl, fullDataUrl);
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
        aria-label={t("closeCamera")}
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
              {t("instruction")}
            </p>
            {/* The huge box-shadow spread fully covers everything in this
               overflow-hidden container except the circle itself — solid,
               not see-through. */}
            <div
              ref={circleRef}
              className="pointer-events-none absolute left-1/2 top-[16%] aspect-square w-[68vmin] max-w-[320px] -translate-x-1/2 rounded-full border-2 border-white/80"
              style={{ boxShadow: "0 0 0 9999px #000" }}
            />
          </>
        )}

        {error && (
          <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 rounded-sm bg-cream p-6 text-center">
            <p className="text-sm text-foreground/85">{t("error")}</p>
            <button
              type="button"
              onClick={close}
              className="mt-4 rounded-full bg-taupe-dark px-6 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-cream"
            >
              {t("close")}
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
            aria-label={t("takePhoto")}
            className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20 disabled:opacity-40"
          >
            <span className="h-12 w-12 rounded-full bg-white" />
          </button>
        </div>
      )}
    </div>
  );
}
