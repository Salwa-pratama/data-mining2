"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────
interface CatDogResult {
  label: "Cat" | "Dog";
  confidence: number;
  probabilities: { cat: number; dog: number };
  filename: string;
}

interface ModelStatus {
  online: boolean;
  modelLoaded: boolean;
  inputShape: number[] | null;
}

// ── Animated Confidence Bar ────────────────────────────────────────
function ConfidenceBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs font-semibold uppercase tracking-wider">
        <span className="text-slate-800">{label}</span>
        <span className="text-slate-900 font-mono">{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="h-4 bg-white border-2 border-black rounded-full overflow-hidden shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out border-r-2 border-black ${color}`}
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function CatDogPage() {
  const [backendUrl] = useState("http://127.0.0.1:8000");
  const [status, setStatus] = useState<ModelStatus>({
    online: false,
    modelLoaded: false,
    inputShape: null,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CatDogResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showResult, setShowResult] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Backend status polling ─────────────────────────────────────
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/catdog/status`);
        if (res.ok) {
          const data = await res.json();
          setStatus({
            online: true,
            modelLoaded: data.model_loaded,
            inputShape: data.input_shape,
          });
        } else {
          throw new Error("offline");
        }
      } catch {
        setStatus({ online: false, modelLoaded: false, inputShape: null });
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [backendUrl]);

  // ── File handling ───────────────────────────────────────────────
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("File harus berupa gambar (JPEG, PNG, WebP, dll.)");
      return;
    }
    setImageFile(file);
    setResult(null);
    setShowResult(false);
    setErrorMsg("");

    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  // ── Predict ─────────────────────────────────────────────────────
  const handlePredict = async () => {
    if (!imageFile) return;
    setIsLoading(true);
    setErrorMsg("");
    setResult(null);
    setShowResult(false);

    try {
      const formData = new FormData();
      formData.append("file", imageFile);

      const res = await fetch(`${backendUrl}/api/catdog/predict`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Prediksi gagal.");
      }

      const data = await res.json();
      setResult(data);
      setTimeout(() => setShowResult(true), 50);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
    setShowResult(false);
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isCat = result?.label === "Cat";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-200 pb-12">
      {/* ── Main ── */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 flex flex-col gap-8">
        {/* ── Hero Text ── */}
        <div className="text-center bg-teal-100 border-4 border-black p-6 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold uppercase tracking-wider text-black">
            Kucing atau Anjing?
          </h2>
          <p className="text-slate-800 text-sm font-medium uppercase tracking-wide mt-2">
            Upload foto kucing atau anjing, dan model CNN akan mengklasifikasikan gambar secara otomatis.
          </p>
        </div>

        {/* Status indicator bar */}
        <div className="flex justify-end">
          <div className="flex items-center gap-2 bg-white border-2 border-black rounded-lg px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div
              className={`h-2.5 w-2.5 rounded-full border border-black ${
                status.online && status.modelLoaded
                  ? "bg-emerald-500 animate-pulse"
                  : status.online
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`}
            />
            <span className="text-black text-xs font-bold">
              {!status.online
                ? "Backend Offline"
                : !status.modelLoaded
                ? "Model Belum Loaded"
                : "Model Siap"}
            </span>
          </div>
        </div>

        {/* ── Backend Offline Banner ── */}
        {!status.online && (
          <div className="bg-rose-100 border-4 border-black rounded-xl p-4 flex items-start gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <svg
              className="h-5 w-5 text-rose-700 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-rose-800">
                Backend tidak dapat dihubungi
              </p>
              <p className="text-xs font-semibold text-slate-800 mt-1 uppercase tracking-wide">
                Jalankan backend dengan:{" "}
                <code className="text-rose-900 font-mono bg-rose-200 border-2 border-black px-1.5 py-0.5 rounded font-bold">
                  uvicorn app:app --reload
                </code>{" "}
                di folder{" "}
                <code className="text-rose-900 font-mono bg-rose-200 border-2 border-black px-1.5 py-0.5 rounded font-bold">
                  frontend/backend
                </code>
              </p>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {errorMsg && (
          <div className="bg-rose-100 border-4 border-black rounded-xl p-4 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-rose-850 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <span>{errorMsg}</span>
            <button
              onClick={() => setErrorMsg("")}
              className="text-black hover:bg-slate-50 font-bold h-6 w-6 border-2 border-black bg-white flex items-center justify-center hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-0 active:translate-y-0"
            >
              ✕
            </button>
          </div>
        )}

        {/* ── Upload + Result layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── LEFT: Upload Card ── */}
          <div className="bg-purple-50 border-4 border-black rounded-2xl p-6 flex flex-col gap-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-black">Upload Gambar</h3>
              <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mt-1">
                Format: JPEG, PNG, WebP, GIF · Maks 10MB
              </p>
            </div>

            {/* Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-4 border-dashed rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col items-center justify-center text-center
                ${isDragging ? "border-indigo-600 bg-indigo-100 scale-[1.01] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" : "border-black bg-white hover:border-indigo-600 hover:bg-indigo-50/50"}
                ${imagePreview ? "h-72" : "h-56 p-8"}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                id="catdog-image-input"
              />

              {imagePreview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Preview gambar"
                    className="w-full h-full object-contain"
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-white">
                      Klik untuk ganti gambar
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className={`h-14 w-14 rounded-xl flex items-center justify-center mb-4 transition-all border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                    ${isDragging ? "bg-indigo-300 scale-110" : "bg-slate-100"}`}
                  >
                    <svg
                      className={`h-7 w-7 transition-colors ${isDragging ? "text-black" : "text-slate-400"}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    {isDragging ? "Lepaskan gambar di sini" : "Seret gambar ke sini"}
                  </p>
                  <p className="text-xs font-semibold text-slate-600 mt-1.5 uppercase tracking-wide">atau klik untuk memilih file</p>
                </>
              )}
            </div>

            {/* Image info */}
            {imageFile && (
              <div className="flex items-center gap-3 bg-white border-2 border-black rounded-xl px-4 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="h-8 w-8 rounded bg-indigo-100 border-2 border-black flex items-center justify-center text-sm shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  🖼️
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-black truncate">
                    {imageFile.name}
                  </p>
                  <p className="text-xs font-medium text-slate-600 uppercase tracking-wide font-mono mt-0.5">
                    {(imageFile.size / 1024).toFixed(1)} KB ·{" "}
                    {imageFile.type}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                  }}
                  className="text-slate-500 hover:text-rose-600 transition-colors p-1"
                  title="Hapus gambar"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handlePredict}
                disabled={!imageFile || isLoading || !status.online || !status.modelLoaded}
                id="catdog-predict-btn"
                className="flex-1 bg-indigo-300 text-black font-bold uppercase tracking-wider text-sm py-3.5 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-350 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    <span>Menganalisis...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Klasifikasi Gambar</span>
                  </>
                )}
              </button>
              {imageFile && (
                <button
                  onClick={handleReset}
                  className="px-4 py-3 bg-white hover:bg-slate-50 border-4 border-black text-black rounded-xl text-sm font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Model info */}
            {status.inputShape && (
              <div className="text-xs font-bold text-slate-700 text-center uppercase tracking-wider">
                Input model:{" "}
                <span className="text-slate-800 font-mono">
                  {status.inputShape.join(" × ")}
                </span>
              </div>
            )}
          </div>

          {/* ── RIGHT: Result Card ── */}
          <div className="bg-pink-50 border-4 border-black rounded-2xl p-6 flex flex-col shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            {result && showResult ? (
              <div className="flex flex-col gap-5 h-full">
                {/* Main result */}
                <div
                  className={`relative rounded-2xl p-6 flex flex-col items-center text-center overflow-hidden transition-all duration-500 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                    ${isCat
                      ? "bg-white text-orange-600"
                      : "bg-white text-blue-800"
                    }`}
                >
                  {/* Big emoji */}
                  <div className="text-7xl mb-3 drop-shadow-lg animate-bounce-slow">
                    {isCat ? "🐱" : "🐶"}
                  </div>

                  <div
                    className={`text-4xl font-bold mb-1 uppercase tracking-wider ${
                      isCat ? "text-orange-600" : "text-blue-800"
                    }`}
                  >
                    {result.label === "Cat" ? "Kucing" : "Anjing"}
                  </div>

                  <div
                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] bg-amber-100 text-black"
                  >
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Confidence: {(result.confidence * 100).toFixed(1)}%
                  </div>
                </div>

                {/* Probability Bars */}
                <div className="bg-white border-4 border-black rounded-xl p-5 flex flex-col gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Probabilitas Prediksi
                  </h4>

                  <ConfidenceBar
                    label="🐱 Kucing (Cat)"
                    value={result.probabilities.cat}
                    color="bg-orange-300"
                  />
                  <ConfidenceBar
                    label="🐶 Anjing (Dog)"
                    value={result.probabilities.dog}
                    color="bg-blue-300"
                  />
                </div>

                {/* File info */}
                <div className="text-xs font-bold text-slate-700 text-center uppercase tracking-wider mt-auto">
                  File:{" "}
                  <span className="text-slate-800 font-mono">{result.filename}</span>
                </div>
              </div>
            ) : (
              /* Empty state */
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-8 bg-white border-4 border-dashed border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="relative">
                  <div className="text-6xl opacity-30">🐾</div>
                  <div className="absolute -top-1 -right-1 text-3xl opacity-20">❓</div>
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-slate-850">
                    Hasil Prediksi
                  </p>
                  <p className="text-xs font-medium text-slate-600 mt-2 max-w-[200px] mx-auto uppercase tracking-wide leading-relaxed">
                    Upload gambar dan klik &quot;Klasifikasi Gambar&quot; untuk mendapatkan hasil prediksi.
                  </p>
                </div>

                {/* Example icons */}
                <div className="flex gap-3 mt-2">
                  {["🐱", "🐶", "🐈", "🐕"].map((emoji, i) => (
                    <div
                      key={i}
                      className="h-10 w-10 rounded-lg bg-amber-100 border-2 border-black flex items-center justify-center text-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Info Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: "🧠",
              title: "Model CNN",
              desc: "Convolutional Neural Network (cat_vs_dog_v2.keras) dilatih untuk klasifikasi biner kucing dan anjing.",
            },
            {
              icon: "⚡",
              title: "Inferensi Cepat",
              desc: "Gambar diproses langsung oleh backend Python dengan TensorFlow/Keras secara real-time.",
            },
            {
              icon: "📊",
              title: "Output Probabilitas",
              desc: "Model mengembalikan probabilitas untuk setiap kelas sehingga kamu bisa melihat seberapa yakin modelnya.",
            },
          ].map((card, i) => (
            <div
              key={i}
              className="bg-white border-4 border-black rounded-xl p-4 flex gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="text-2xl flex-shrink-0">{card.icon}</div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-900">{card.title}</p>
                <p className="text-xs font-medium text-slate-700 mt-1 uppercase tracking-wide leading-relaxed">
                  {card.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t-4 border-black bg-white py-6 text-center text-xs font-bold uppercase tracking-wider text-slate-700 relative z-10">
        <p>UAS Data Mining Project</p>
      </footer>

      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
