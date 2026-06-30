const fs = require('fs');

const content = `"use client";

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

interface AnalysisData {
  architecture: {
    Layer: string;
    Tipe: string;
    OutputShape: string;
    Parameter: number;
  }[];
  total_params: number;
  distribution: {
    [key: string]: {
      counts: { [key: string]: number };
      total: number;
    }
  };
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
          className={\`h-full rounded-full transition-all duration-700 ease-out border-r-2 border-black \${color}\`}
          style={{ width: \`\${value * 100}%\` }}
        />
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function CatDogPage() {
  const [activeTab, setActiveTab] = useState<"predict" | "analysis">("predict");
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

  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Backend status polling ─────────────────────────────────────
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(\`\${backendUrl}/api/catdog/status\`);
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

  // ── Fetch Analysis Data ───────────────────────────────────────
  useEffect(() => {
    if (activeTab === "analysis" && !analysisData && status.online) {
      const fetchAnalysis = async () => {
        setIsLoadingAnalysis(true);
        try {
          const res = await fetch(\`\${backendUrl}/api/catdog/analysis\`);
          if (res.ok) {
            const data = await res.json();
            setAnalysisData(data);
          }
        } catch (err) {
          console.error("Failed to fetch analysis data", err);
        } finally {
          setIsLoadingAnalysis(false);
        }
      };
      fetchAnalysis();
    }
  }, [activeTab, analysisData, backendUrl, status.online]);

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

      const res = await fetch(\`\${backendUrl}/api/catdog/predict\`, {
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
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans antialiased selection:bg-indigo-200 pb-12">
      {/* ── Main ── */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 flex flex-col gap-8">
        
        {/* ── Header ── */}
        <div className="text-center bg-cyan-400 border-4 border-black p-6 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-2xl mx-auto w-full">
          <h2 className="text-2xl font-bold uppercase tracking-wider text-black">
            Kucing atau Anjing?
          </h2>
          <p className="text-slate-800 text-sm font-medium uppercase tracking-wide mt-2">
            Upload foto kucing atau anjing, dan model CNN akan mengklasifikasikan gambar secara otomatis.
          </p>
        </div>

        {/* ── Top Bar (Tabs & Status) ── */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Tabs */}
          <div className="flex gap-4 border-b-4 border-black pb-4 w-full md:w-auto">
            <button
              onClick={() => setActiveTab("predict")}
              className={\`px-6 py-3 text-sm font-bold uppercase tracking-wider rounded-xl transition-all border-4 \${
                activeTab === "predict"
                  ? "bg-yellow-400 text-black border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]"
                  : "border-black text-slate-700 bg-white hover:text-black hover:bg-slate-100 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
              }\`}
            >
              🔮 Prediksi
            </button>
            <button
              onClick={() => setActiveTab("analysis")}
              className={\`px-6 py-3 text-sm font-bold uppercase tracking-wider rounded-xl transition-all border-4 \${
                activeTab === "analysis"
                  ? "bg-fuchsia-400 text-black border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]"
                  : "border-black text-slate-700 bg-white hover:text-black hover:bg-slate-100 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
              }\`}
            >
              📊 Analisis Data
            </button>
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2 bg-white border-4 border-black rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full md:w-auto justify-center">
            <div
              className={\`h-3 w-3 rounded-full border-2 border-black \${
                status.online && status.modelLoaded
                  ? "bg-emerald-500 animate-pulse"
                  : status.online
                  ? "bg-amber-500"
                  : "bg-red-500"
              }\`}
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
          <div className="bg-pink-400 border-4 border-black rounded-xl p-4 flex items-start gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <svg
              className="h-5 w-5 text-rose-800 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-black">
                Backend tidak dapat dihubungi
              </p>
              <p className="text-xs font-semibold text-slate-800 mt-1 uppercase tracking-wide">
                Pastikan menjalankan <b>python app.py</b> di folder frontend/backend.
              </p>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 1: PREDICT */}
        {/* ================================================================= */}
        {activeTab === "predict" && (
          <div className="flex flex-col gap-6">
            {/* ── Error ── */}
            {errorMsg && (
              <div className="bg-pink-400 border-4 border-black rounded-xl p-4 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <span>{errorMsg}</span>
                <button
                  onClick={() => setErrorMsg("")}
                  className="text-black hover:bg-slate-100 font-bold h-6 w-6 border-2 border-black bg-white flex items-center justify-center hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-0 active:translate-y-0"
                >
                  ✕
                </button>
              </div>
            )}

            {/* ── Upload + Result layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* ── LEFT: Upload Card ── */}
              <div className="bg-fuchsia-400 border-4 border-black rounded-2xl p-6 flex flex-col gap-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wider text-black">Upload Gambar</h3>
                  <p className="text-xs font-medium text-slate-800 uppercase tracking-wide mt-1">
                    Format: JPEG, PNG, WebP, GIF · Maks 10MB
                  </p>
                </div>

                {/* Drop Zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={\`relative border-4 border-dashed rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col items-center justify-center text-center
                    \${isDragging ? "border-indigo-600 bg-indigo-400 scale-[1.01] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" : "border-black bg-white hover:border-indigo-600 hover:bg-indigo-300"}
                    \${imagePreview ? "h-72" : "h-56 p-8"}
                  \`}
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
                        className={\`h-14 w-14 rounded-xl flex items-center justify-center mb-4 transition-all border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                        \${isDragging ? "bg-indigo-400 scale-110" : "bg-yellow-400"}\`}
                      >
                        <svg
                          className={\`h-7 w-7 transition-colors \${isDragging ? "text-black" : "text-black"}\`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-xs font-bold uppercase tracking-wider text-black">
                        {isDragging ? "Lepaskan gambar di sini" : "Seret gambar ke sini"}
                      </p>
                      <p className="text-xs font-semibold text-slate-800 mt-1.5 uppercase tracking-wide">atau klik untuk memilih file</p>
                    </>
                  )}
                </div>

                {/* Image info */}
                {imageFile && (
                  <div className="flex items-center gap-3 bg-white border-4 border-black rounded-xl px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="h-8 w-8 rounded bg-indigo-400 border-2 border-black flex items-center justify-center text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      🖼️
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-black truncate">
                        {imageFile.name}
                      </p>
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide font-mono mt-0.5">
                        {(imageFile.size / 1024).toFixed(1)} KB · {imageFile.type}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReset();
                      }}
                      className="h-8 w-8 rounded-lg border-2 border-black bg-rose-400 hover:bg-rose-500 flex items-center justify-center transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
                      title="Hapus gambar"
                    >
                      <svg className="h-4 w-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
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
                    className="flex-1 bg-indigo-400 text-black font-bold uppercase tracking-wider text-sm py-3.5 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none disabled:bg-slate-200 disabled:text-slate-500 disabled:border-slate-400 disabled:hover:translate-x-[0px] disabled:hover:translate-y-[0px] disabled:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 border-4 border-black/30 border-t-black rounded-full animate-spin" />
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
                      className="px-4 py-3 bg-white hover:bg-slate-100 border-4 border-black text-black rounded-xl text-sm font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Model info */}
                {status.inputShape && (
                  <div className="text-xs font-bold text-black text-center uppercase tracking-wider bg-white border-2 border-black rounded-lg py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] w-full">
                    Input model: <span className="text-indigo-700 font-mono text-sm">{status.inputShape.join(" × ")}</span>
                  </div>
                )}
              </div>

              {/* ── RIGHT: Result Card ── */}
              <div className="bg-rose-400 border-4 border-black rounded-2xl p-6 flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                {result && showResult ? (
                  <div className="flex flex-col gap-5 h-full">
                    {/* Main result */}
                    <div
                      className={\`relative rounded-2xl p-6 flex flex-col items-center text-center overflow-hidden transition-all duration-500 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                        \${isCat
                          ? "bg-orange-400 text-black"
                          : "bg-blue-400 text-black"
                        }\`}
                    >
                      {/* Big emoji */}
                      <div className="text-7xl mb-3 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] animate-bounce-slow">
                        {isCat ? "🐱" : "🐶"}
                      </div>

                      <div
                        className={\`text-4xl font-black mb-1 uppercase tracking-wider text-black\`}
                      >
                        {result.label === "Cat" ? "Kucing" : "Anjing"}
                      </div>

                      <div
                        className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-yellow-400 text-black mt-2"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Confidence: {(result.confidence * 100).toFixed(1)}%
                      </div>
                    </div>

                    {/* Probability Bars */}
                    <div className="bg-white border-4 border-black rounded-xl p-5 flex flex-col gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <h4 className="text-xs font-black text-black uppercase tracking-wider border-b-2 border-black pb-2">
                        Probabilitas Prediksi
                      </h4>

                      <ConfidenceBar
                        label="🐱 Kucing (Cat)"
                        value={result.probabilities.cat}
                        color="bg-orange-400"
                      />
                      <ConfidenceBar
                        label="🐶 Anjing (Dog)"
                        value={result.probabilities.dog}
                        color="bg-blue-400"
                      />
                    </div>

                    {/* File info */}
                    <div className="text-[10px] font-bold text-black text-center uppercase tracking-wider mt-auto bg-white border-2 border-black py-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      File: <span className="font-mono text-xs ml-1">{result.filename}</span>
                    </div>
                  </div>
                ) : (
                  /* Empty state */
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-8 bg-white border-4 border-dashed border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="relative">
                      <div className="text-6xl opacity-40 grayscale">🐾</div>
                      <div className="absolute -top-2 -right-2 text-4xl">❓</div>
                    </div>
                    <div>
                      <p className="text-base font-black uppercase tracking-wider text-black">
                        Hasil Prediksi
                      </p>
                      <p className="text-xs font-bold text-slate-600 mt-2 max-w-[200px] mx-auto uppercase tracking-wide leading-relaxed">
                        Upload gambar dan klik &quot;Klasifikasi Gambar&quot; untuk mendapatkan hasil prediksi.
                      </p>
                    </div>

                    {/* Example icons */}
                    <div className="flex gap-3 mt-4">
                      {["🐱", "🐶"].map((emoji, i) => (
                        <div
                          key={i}
                          className="h-12 w-12 rounded-xl bg-yellow-400 border-4 border-black flex items-center justify-center text-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black transform rotate-[-5deg] hover:rotate-[5deg] transition-all"
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: "🧠",
                  title: "Model CNN",
                  desc: "Convolutional Neural Network (cat_vs_dog_v2.keras) dilatih untuk klasifikasi biner kucing dan anjing.",
                  color: "bg-cyan-400"
                },
                {
                  icon: "⚡",
                  title: "Inferensi Cepat",
                  desc: "Gambar diproses langsung oleh backend Python dengan TensorFlow/Keras secara real-time.",
                  color: "bg-emerald-400"
                },
                {
                  icon: "📊",
                  title: "Output Probabilitas",
                  desc: "Model mengembalikan probabilitas untuk setiap kelas sehingga kamu bisa melihat seberapa yakin modelnya.",
                  color: "bg-yellow-400"
                },
              ].map((card, i) => (
                <div
                  key={i}
                  className={\`\${card.color} border-4 border-black rounded-2xl p-5 flex flex-col gap-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all\`}
                >
                  <div className="h-12 w-12 rounded-xl bg-white border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-2xl flex-shrink-0">
                    {card.icon}
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-wider text-black">{card.title}</p>
                    <p className="text-xs font-bold text-slate-800 mt-2 uppercase tracking-wide leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: ANALYSIS */}
        {/* ================================================================= */}
        {activeTab === "analysis" && (
          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {!analysisData ? (
              <div className="bg-white border-4 border-black rounded-2xl p-12 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                {isLoadingAnalysis ? (
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="h-12 w-12 border-8 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-lg font-black uppercase tracking-wider text-black">Mengambil Data Analisis...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4">
                    <span className="text-6xl">❓</span>
                    <p className="text-lg font-black uppercase tracking-wider text-black">Data tidak tersedia</p>
                    <button 
                      onClick={() => setActiveTab("predict")}
                      className="px-6 py-3 bg-yellow-400 border-4 border-black rounded-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                      Kembali ke Prediksi
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* ── Distribusi Data ── */}
                <div className="bg-cyan-400 border-4 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <h3 className="text-xl font-black uppercase tracking-wider text-black mb-6 border-b-4 border-black pb-4 inline-block">
                    📊 Distribusi Dataset
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {["train", "valid", "test"].map((split, i) => {
                      const data = analysisData.distribution[split];
                      if (!data) return null;
                      
                      const title = split === "train" ? "Training" : split === "valid" ? "Validasi" : "Testing";
                      const colors = ["bg-blue-400", "bg-emerald-400", "bg-yellow-400"];
                      const cardColor = colors[i % colors.length];
                      
                      return (
                        <div key={split} className={\`bg-white border-4 border-black rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4\`}>
                          <div className={\`\${cardColor} border-4 border-black rounded-xl p-3 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]\`}>
                            <h4 className="text-sm font-black uppercase tracking-wider text-black">{title} Set</h4>
                            <p className="text-2xl font-black text-black mt-1">{data.total.toLocaleString()}</p>
                            <p className="text-[10px] font-bold text-black uppercase">Total Gambar</p>
                          </div>
                          
                          <div className="flex flex-col gap-3 mt-2">
                            {Object.entries(data.counts).map(([cls, count]) => {
                              const pct = data.total > 0 ? (count / data.total) * 100 : 0;
                              const barColor = cls === "Cat" ? "bg-orange-400" : "bg-blue-400";
                              const emoji = cls === "Cat" ? "🐱" : "🐶";
                              
                              return (
                                <div key={cls} className="flex flex-col gap-1">
                                  <div className="flex justify-between items-end">
                                    <span className="text-xs font-black uppercase text-black">{emoji} {cls}</span>
                                    <span className="text-xs font-bold text-slate-800">{count.toLocaleString()} ({pct.toFixed(1)}%)</span>
                                  </div>
                                  <div className="h-4 bg-slate-200 border-2 border-black rounded-full overflow-hidden shadow-[inset_0px_2px_0px_0px_rgba(0,0,0,0.1)]">
                                    <div 
                                      className={\`h-full \${barColor} border-r-2 border-black\`}
                                      style={{ width: \`\${pct}%\` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Arsitektur Model ── */}
                <div className="bg-pink-400 border-4 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b-4 border-black pb-4">
                    <h3 className="text-xl font-black uppercase tracking-wider text-black">
                      🏗️ Arsitektur Model CNN
                    </h3>
                    <div className="bg-white border-4 border-black rounded-xl px-4 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <span className="text-xs font-bold uppercase text-slate-800 mr-2">Total Parameter:</span>
                      <span className="text-lg font-black text-black">{analysisData.total_params.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto bg-white border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-yellow-400 border-b-4 border-black text-xs font-black uppercase tracking-wider text-black">
                          <th className="p-4 border-r-4 border-black">Layer Name</th>
                          <th className="p-4 border-r-4 border-black">Type</th>
                          <th className="p-4 border-r-4 border-black">Output Shape</th>
                          <th className="p-4 text-right">Parameters</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysisData.architecture.map((layer, idx) => (
                          <tr key={idx} className="border-b-2 border-slate-300 last:border-0 hover:bg-slate-100 transition-colors text-xs font-bold text-black">
                            <td className="p-4 border-r-4 border-black font-mono">{layer.Layer}</td>
                            <td className="p-4 border-r-4 border-black">
                              <span className="inline-block px-2 py-1 bg-indigo-200 border-2 border-black rounded uppercase text-[10px]">
                                {layer.Tipe}
                              </span>
                            </td>
                            <td className="p-4 border-r-4 border-black font-mono">{layer.OutputShape}</td>
                            <td className="p-4 text-right font-mono">{layer.Parameter.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t-4 border-black bg-white py-6 text-center text-xs font-bold uppercase tracking-wider text-slate-700 relative z-10">
        <p>UAS Data Mining Project</p>
      </footer>

      <style jsx global>{\`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      \`}</style>
    </div>
  );
}
`;

fs.writeFileSync('app/catdog/page.tsx', content);
console.log('Successfully updated catdog page.tsx');
