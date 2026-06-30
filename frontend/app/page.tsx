"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";

// ── Simple CSV Parser ─────────────────────────────────────────────
const parseCSV = (text: string) => {
  const lines = text.split(/\r?\n/);
  if (lines.length === 0) return { headers: [], rows: [] };
  
  const headers = lines[0].split(',').map(h => h.trim());
  const rows: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(',');
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = (values[index] || '').trim().replace(/^"|"$/g, '');
    });
    rows.push(obj);
  }
  
  return { headers, rows };
};

// ── Types ─────────────────────────────────────────────────────────
interface PredictionResult {
  index: number;
  predicted_class: number;
  severity: number;
  confidence: number;
  probabilities: Record<string, number>;
  originalRow?: Record<string, string>;
}

interface BackendStatus {
  online: boolean;
  modelLoaded: boolean;
  scalerLoaded: boolean;
  featuresExpected: number;
  featureNames: string[];
}

export default function PredictionDashboard() {
  // ── State variables ─────────────────────────────────────────────
  const [backendUrl, setBackendUrl] = useState("http://127.0.0.1:8000");
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<"csv" | "manual">("csv");
  const [status, setStatus] = useState<BackendStatus>({
    online: false,
    modelLoaded: false,
    scalerLoaded: false,
    featuresExpected: 113,
    featureNames: []
  });
  const [isParsingCsv, setIsParsingCsv] = useState(false);
  
  // CSV Predict States
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [rowLimit, setRowLimit] = useState<number>(500);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Manual Predict States
  const [manualInputs, setManualInputs] = useState<Record<string, string>>({
    Start_Lat: "38.5229",
    Start_Lng: "-90.39564",
    End_Lat: "38.52885",
    End_Lng: "-90.40332",
    "Distance(mi)": "0.584",
    "Temperature(F)": "55.0",
    "Humidity(%)": "60.0",
    "Pressure(in)": "29.92",
    "Visibility(mi)": "10.0",
    "Wind_Speed(mph)": "8.0",
    "Precipitation(in)": "0.0",
    Street: "2.49",
    City: "2.58",
    County: "2.57",
    Zipcode: "2.52",
    Airport_Code: "2.60",
    Weather_Condition: "2.49",
    Start_Hour: "8",
    Start_Month: "1",
    Day_Of_Week: "1",
    Duration_Minutes: "120"
  });
  const [manualBooleans, setManualBooleans] = useState<Record<string, boolean>>({
    Crossing: false,
    Junction: true,
    Traffic_Signal: false,
    Stop: false,
    Railway: false,
    Amenity: false,
    Bump: false,
    Give_Way: false,
    No_Exit: false,
    Roundabout: false,
    Station: false,
    Traffic_Calming: false,
    Turning_Loop: false
  });
  const [singlePrediction, setSinglePrediction] = useState<{
    severity: number;
    confidence: number;
    probabilities: Record<string, number>;
  } | null>(null);
  const [isPredictingSingle, setIsPredictingSingle] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Effect: Backend status monitoring ───────────────────────────
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/status`);
        if (res.ok) {
          const data = await res.json();
          setStatus({
            online: true,
            modelLoaded: data.model.loaded,
            scalerLoaded: data.scaler.loaded,
            featuresExpected: data.scaler.features_expected,
            featureNames: data.scaler.feature_names
          });
        } else {
          throw new Error("HTTP error");
        }
      } catch (err) {
        setStatus(prev => ({ ...prev, online: false }));
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [backendUrl]);

  // ── Handler: File selection ─────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCsvFile(file);
      setErrorMsg("");
      setPredictions([]);
      setProcessingTime(null);
      setParsedRows([]);
      setIsParsingCsv(true);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        try {
          const { headers: parsedHeaders, rows: parsed } = parseCSV(text);
          setHeaders(parsedHeaders);
          setParsedRows(parsed);
        } catch (err) {
          setErrorMsg("Gagal memproses file CSV. Format tidak didukung.");
        } finally {
          setIsParsingCsv(false);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith(".csv")) {
        setCsvFile(file);
        setErrorMsg("");
        setPredictions([]);
        setProcessingTime(null);
        setParsedRows([]);
        setIsParsingCsv(true);
        
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          try {
            const { headers: parsedHeaders, rows: parsed } = parseCSV(text);
            setHeaders(parsedHeaders);
            setParsedRows(parsed);
          } catch (err) {
            setErrorMsg("Gagal memproses file CSV. Format tidak didukung.");
          } finally {
            setIsParsingCsv(false);
          }
        };
        reader.readAsText(file);
      } else {
        setErrorMsg("Silakan unggah file dengan ekstensi .csv");
      }
    }
  };

  // ── Handler: Batch Predictions ──────────────────────────────────
  const runBatchPredictions = async () => {
    if (parsedRows.length === 0) {
      setErrorMsg("Tidak ada data CSV untuk diprediksi.");
      return;
    }
    
    setIsProcessing(true);
    setProgress(0);
    setErrorMsg("");
    setPredictions([]);
    
    const rowsToProcess = rowLimit > 0 ? parsedRows.slice(0, rowLimit) : parsedRows;
    const batchSize = 100;
    const totalBatches = Math.ceil(rowsToProcess.length / batchSize);
    const results: PredictionResult[] = [];
    const startTime = performance.now();

    try {
      for (let i = 0; i < totalBatches; i++) {
        const startIdx = i * batchSize;
        const endIdx = Math.min(startIdx + batchSize, rowsToProcess.length);
        const chunk = rowsToProcess.slice(startIdx, endIdx);

        // Map frontend row to backend scaler names
        const formattedBatch = chunk.map(row => {
          const formatted: Record<string, any> = {};
          
          // Map all headers that we parsed
          Object.keys(row).forEach(key => {
            const val = row[key];
            if (val === "True" || val === "true") {
              formatted[key] = true;
            } else if (val === "False" || val === "false") {
              formatted[key] = false;
            } else {
              const num = Number(val);
              formatted[key] = isNaN(num) || val === "" ? null : num;
            }
          });

          // Ensure any expected model feature not in CSV is set to default
          status.featureNames.forEach(featName => {
            if (formatted[featName] === undefined) {
              formatted[featName] = 0.0;
            }
          });

          return formatted;
        });

        // Send to backend
        const response = await fetch(`${backendUrl}/api/predict/batch`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ batch: formattedBatch }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || `Server error di batch ke-${i + 1}`);
        }

        const data = await response.json();
        const predictionsWithRows = data.results.map((pred: any, index: number) => ({
          ...pred,
          originalRow: chunk[index],
        }));

        results.push(...predictionsWithRows);
        setProgress(Math.round(((i + 1) / totalBatches) * 100));
      }

      setPredictions(results);
      setProcessingTime(Math.round(performance.now() - startTime));
      setCurrentPage(1);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat memanggil API model.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Handler: Single Prediction ──────────────────────────────────
  const runSinglePrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPredictingSingle(true);
    setSinglePrediction(null);
    setErrorMsg("");

    try {
      // Reconstruct features
      const features: Record<string, any> = {};
      
      // Load inputs
      Object.keys(manualInputs).forEach(key => {
        features[key] = parseFloat(manualInputs[key]) || 0.0;
      });

      // Load booleans
      Object.keys(manualBooleans).forEach(key => {
        features[key] = manualBooleans[key];
      });

      // Map other expected state features as false if not manually included
      status.featureNames.forEach(feat => {
        if (features[feat] === undefined) {
          features[feat] = feat.startsWith("State_") || feat.includes("Timezone_") || feat.includes("Wind_Direction_")
            ? false
            : 0.0;
        }
      });

      // API request
      const response = await fetch(`${backendUrl}/api/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ features }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Server error.");
      }

      const data = await response.json();
      setSinglePrediction({
        severity: data.severity,
        confidence: data.confidence,
        probabilities: data.probabilities,
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal melakukan prediksi.");
    } finally {
      setIsPredictingSingle(false);
    }
  };

  // ── Calculations: Analytics ──────────────────────────────────────
  const stats = useMemo(() => {
    if (predictions.length === 0) return null;

    let total = predictions.length;
    let sumConf = 0;
    let distribution = { "1": 0, "2": 0, "3": 0, "4": 0 };
    let correct = 0;
    let hasActual = false;

    // Check if the first row has Severity_Asli
    if (predictions[0]?.originalRow && "Severity_Asli" in predictions[0].originalRow) {
      hasActual = true;
    }

    predictions.forEach(p => {
      sumConf += p.confidence;
      const sevKey = p.severity.toString() as keyof typeof distribution;
      if (distribution[sevKey] !== undefined) {
        distribution[sevKey]++;
      }
      
      if (hasActual && p.originalRow) {
        const actual = parseInt(p.originalRow.Severity_Asli);
        if (actual === p.severity) {
          correct++;
        }
      }
    });

    // Compute confusion matrix if actual is present
    const confMatrix = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ];
    
    if (hasActual) {
      predictions.forEach(p => {
        const actual = parseInt(p.originalRow?.Severity_Asli || "1");
        const pred = p.severity;
        if (actual >= 1 && actual <= 4 && pred >= 1 && pred <= 4) {
          confMatrix[actual - 1][pred - 1]++;
        }
      });
    }

    return {
      total,
      avgConfidence: sumConf / total,
      distribution,
      hasActual,
      accuracy: correct / total,
      confusionMatrix: confMatrix
    };
  }, [predictions]);

  // ── Filtering and Pagination ────────────────────────────────────
  const filteredPredictions = useMemo(() => {
    if (!searchQuery) return predictions;
    const query = searchQuery.toLowerCase();
    return predictions.filter(p => {
      const city = p.originalRow?.City?.toLowerCase() || "";
      const county = p.originalRow?.County?.toLowerCase() || "";
      const street = p.originalRow?.Street?.toLowerCase() || "";
      return city.includes(query) || county.includes(query) || street.includes(query);
    });
  }, [predictions, searchQuery]);

  const pageCount = Math.ceil(filteredPredictions.length / itemsPerPage);
  
  const paginatedPredictions = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredPredictions.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredPredictions, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pageCount) {
      setCurrentPage(page);
    }
  };

  // Helper to format float values nicely
  const fmtFloat = (val: any) => {
    if (val === undefined || val === null || val === "") return "-";
    const num = parseFloat(val);
    if (isNaN(num)) return val.toString();
    return num.toFixed(4);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col antialiased selection:bg-indigo-200 selection:text-black">
      {/* ── Background decoration ── */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-indigo-50/50 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-20 right-[10%] w-[300px] h-[300px] bg-indigo-200/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-60 left-[5%] w-[250px] h-[250px] bg-violet-200/20 blur-[100px] rounded-full pointer-events-none" />

      {/* ── Page Header ── */}
      <header className="relative z-10 border-4 border-black bg-white px-6 py-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between mt-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 border-2 border-black bg-amber-300 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg">
            <svg className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-wider uppercase text-black">
              Parameter Kecelakaan
            </h1>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Monitoring & Analisis Insiden</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Connection Status Pill */}
          <div className={`flex items-center gap-2 bg-white border-2 border-black rounded-lg px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
            <div className={`h-2 w-2 rounded-full ${status.online ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
            <span className="text-black">
              {status.online ? "Backend Online" : "Backend Offline"}
            </span>
            {status.online && (
              <span className="text-slate-500 border-l-2 border-slate-300 pl-2">
                {status.featuresExpected} Fitur
              </span>
            )}
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg bg-white border-2 border-black hover:bg-slate-50 text-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
            title="Konfigurasi URL Backend"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Settings Panel ── */}
      {showSettings && (
        <div className="relative z-20 max-w-7xl mx-auto w-full px-6 mt-4">
          <div className="bg-amber-100 border-4 border-black rounded-xl p-5 flex flex-col md:flex-row items-center gap-4 justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex-1 w-full">
              <label className="block text-sm font-semibold uppercase tracking-wider text-slate-700 mb-1.5">FastAPI Backend Endpoint URL</label>
              <input
                type="text"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                className="w-full bg-white border-2 border-black rounded-lg px-3 py-2.5 text-sm font-bold text-black focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:ring-0"
                placeholder="http://localhost:8000"
              />
            </div>
            <div className="flex gap-3 w-full md:w-auto mt-2 md:mt-0">
              <button
                onClick={() => setBackendUrl("http://localhost:8000")}
                className="w-full md:w-auto px-4 py-2.5 text-sm font-bold uppercase tracking-wider bg-white hover:bg-slate-50 border-2 border-black rounded-lg transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
              >
                Reset Default
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="w-full md:w-auto px-4 py-2.5 text-sm font-bold uppercase tracking-wider bg-indigo-300 hover:bg-indigo-400 border-2 border-black text-black rounded-lg transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Layout ── */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full p-6 flex flex-col gap-6">
        {/* Connection Offline Warning Banner */}
        {!status.online && (
          <div className="bg-rose-100 border-4 border-black rounded-xl p-5 flex items-start gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <svg className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-red-700">Koneksi Backend Terputus</h3>
              <p className="text-sm text-red-900 mt-1 leading-relaxed">
                Aplikasi tidak dapat berkomunikasi dengan API Python di <code className="text-red-700 font-bold">{backendUrl}</code>. Pastikan backend uvicorn server berjalan dengan perintah <code className="text-red-700 font-bold bg-white px-1 py-0.5 border-2 border-black rounded">python3 app.py</code> di folder backend Anda.
              </p>
            </div>
          </div>
        )}

        {/* Tab navigation */}
        <div className="flex gap-4 border-b-4 border-black pb-4 mt-2">
          <button
            onClick={() => { setActiveTab("csv"); setErrorMsg(""); }}
            className={`px-4 py-2.5 text-sm font-bold uppercase tracking-wider rounded-lg transition-all border-2 ${
              activeTab === "csv"
                ? "bg-indigo-300 text-black border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]"
                : "border-black text-slate-700 bg-white hover:text-black hover:bg-slate-50 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
            }`}
          >
            Unggah CSV & Batch Prediction
          </button>
          <button
            onClick={() => { setActiveTab("manual"); setErrorMsg(""); }}
            className={`px-4 py-2.5 text-sm font-bold uppercase tracking-wider rounded-lg transition-all border-2 ${
              activeTab === "manual"
                ? "bg-indigo-300 text-black border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]"
                : "border-black text-slate-700 bg-white hover:text-black hover:bg-slate-50 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
            }`}
          >
            Form Input Manual (Single Predict)
          </button>
        </div>

        {/* Display Error Message if any */}
        {errorMsg && (
          <div className="bg-rose-100 border-2 border-black rounded-xl p-4 text-sm font-bold uppercase tracking-wider text-rose-800 flex items-center justify-between shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg("")} className="text-rose-800 hover:text-rose-900 font-bold">✕</button>
          </div>
        )}

        {/* ── TAB 1: CSV IMPORT ── */}
        {activeTab === "csv" && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Panel: Upload CSV Card */}
              <div className="bg-teal-50 border-4 border-black rounded-2xl p-6 flex flex-col gap-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900">Upload Data CSV</h3>
                  <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mt-1">Unggah dataset lalu prediksi tingkat keparahan (severity) secara massal.</p>
                </div>

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-4 border-dashed border-black rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-white transition-all group shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="h-12 w-12 border-2 border-black bg-slate-50 flex items-center justify-center group-hover:scale-105 transition-transform mb-3 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <svg className="h-6 w-6 text-slate-700 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  {isParsingCsv ? (
                    <div>
                      <p className="text-sm font-bold uppercase text-slate-900">Membaca file...</p>
                      <p className="text-xs text-slate-500 mt-1 animate-pulse">Memproses baris CSV ke memori...</p>
                    </div>
                  ) : csvFile ? (
                    <div>
                      <p className="text-sm font-semibold uppercase text-indigo-600">{csvFile.name}</p>
                      <p className="text-xs text-slate-600 mt-1">{(csvFile.size / 1024).toFixed(1)} KB · {parsedRows.length.toLocaleString()} baris terdeteksi</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-bold uppercase text-slate-800">Pilih file CSV</p>
                      <p className="text-xs text-slate-500 mt-1">Seret & lepas berkas ke sini atau klik untuk mencari</p>
                    </div>
                  )}
                </div>

                {/* Row limit selector */}
                <div>
                  <label className="block text-sm font-semibold uppercase tracking-wider text-slate-700 mb-2">Batas Baris yang Diproses</label>
                  <select
                    value={rowLimit}
                    onChange={(e) => setRowLimit(parseInt(e.target.value))}
                    disabled={isProcessing || isParsingCsv}
                    className="w-full bg-white border-2 border-black rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-indigo-500 disabled:opacity-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
                  >
                    <option value={100}>100 Baris Pertama</option>
                    <option value={500}>500 Baris Pertama</option>
                    <option value={1000}>1.000 Baris Pertama</option>
                    <option value={5000}>5.000 Baris Pertama</option>
                    <option value={0}>Semua Baris ({parsedRows.length.toLocaleString()})</option>
                  </select>
                </div>

                {/* Submit button */}
                <button
                  onClick={runBatchPredictions}
                  disabled={!csvFile || isParsingCsv || parsedRows.length === 0 || isProcessing || !status.online}
                  className="w-full bg-indigo-300 hover:bg-indigo-400 disabled:bg-slate-100 disabled:text-slate-405 disabled:border-slate-300 disabled:cursor-not-allowed border-4 border-black text-black font-bold uppercase tracking-wider rounded-xl py-3.5 text-sm transition-all hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      <span>Memproses ({progress}%)</span>
                    </>
                  ) : isParsingCsv ? (
                    <>
                      <div className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      <span>Membaca CSV...</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Jalankan Prediksi Severity</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right Panel: Analytics Dashboard Summary */}
              <div className="lg:col-span-2 bg-purple-50 border-4 border-black rounded-2xl p-6 flex flex-col justify-between shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900">Ringkasan Analisis Batch</h3>
                  <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mt-1">Statistik hasil prediksi model XGBoost setelah CSV diimpor.</p>
                </div>

                {stats ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
                    <div className="bg-white border-2 border-black rounded-xl p-4 text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Total Prediksi</p>
                      <h4 className="text-2xl font-bold text-black mt-1">{stats.total.toLocaleString()}</h4>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Baris Data</p>
                    </div>

                    <div className="bg-white border-2 border-black rounded-xl p-4 text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Confidence</p>
                      <h4 className="text-2xl font-bold text-indigo-650 mt-1">{(stats.avgConfidence * 100).toFixed(1)}%</h4>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Rata-rata</p>
                    </div>

                    <div className="bg-white border-2 border-black rounded-xl p-4 text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Akurasi (vs Asli)</p>
                      <h4 className={`text-2xl font-bold mt-1 ${stats.hasActual ? "text-emerald-600" : "text-slate-500"}`}>
                        {stats.hasActual ? `${(stats.accuracy * 100).toFixed(1)}%` : "N/A"}
                      </h4>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{stats.hasActual ? "Kesesuaian" : "Target Kosong"}</p>
                    </div>

                    <div className="bg-white border-2 border-black rounded-xl p-4 text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Waktu Proses</p>
                      <h4 className="text-2xl font-bold text-violet-750 mt-1">{processingTime} ms</h4>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Inferensi API</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 my-4 bg-white border-4 border-dashed border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <svg className="h-10 w-10 text-slate-700 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-sm font-bold uppercase text-slate-800">Belum Ada Data</p>
                    <p className="text-xs font-medium text-slate-500 max-w-[200px] uppercase tracking-wide mt-1.5 leading-relaxed">Pilih file CSV lalu klik tombol jalankan prediksi di sebelah kiri.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Grid 2: Charts & Visualizations */}
            {predictions.length > 0 && stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Chart 1: Predicted Severity Distribution */}
                <div className="bg-amber-50 border-4 border-black rounded-2xl p-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-slate-900 mb-4">Distribusi Hasil Prediksi Severity</h4>
                  <div className="flex flex-col gap-4">
                    {Object.keys(stats.distribution).map(key => {
                      const count = stats.distribution[key as keyof typeof stats.distribution];
                      const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                      
                      // Flat high-contrast neobrutalist colors depending on Severity
                      const colors = [
                        "bg-blue-300 text-blue-800 border-2 border-black",
                        "bg-emerald-300 text-emerald-800 border-2 border-black",
                        "bg-amber-300 text-amber-800 border-2 border-black",
                        "bg-rose-300 text-rose-800 border-2 border-black"
                      ];
                      const themeIdx = parseInt(key) - 1;

                      return (
                        <div key={key} className="flex items-center gap-3">
                          <span className={`w-28 text-sm font-semibold ${colors[themeIdx].split(" ")[1]}`}>
                            Severity Level {key}
                          </span>
                          <div className="flex-1 h-6 bg-white border-2 border-black rounded-md overflow-hidden relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <div
                              style={{ width: `${pct}%` }}
                              className={`h-full ${colors[themeIdx].split(" ")[0]} border-r-2 border-black`}
                            />
                            <span className="absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-black">
                              {pct.toFixed(1)}%
                            </span>
                          </div>
                          <span className="w-16 text-right text-sm font-semibold text-slate-700">
                            {count.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chart 2: Confusion Matrix */}
                <div className="bg-rose-50 border-4 border-black rounded-2xl p-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-slate-900 mb-4">Confusion Matrix (Actual vs Predicted)</h4>
                  {stats.hasActual ? (
                    <div className="flex flex-col items-center">
                      <div className="grid grid-cols-5 gap-1.5 w-full max-w-[340px]">
                        {/* Header corner */}
                        <div className="flex items-center justify-center text-[11px] text-slate-700 font-bold uppercase">Act \ Pred</div>
                        
                        {/* Predicted headers */}
                        {[1, 2, 3, 4].map(num => (
                          <div key={num} className="text-center text-xs text-indigo-800 font-bold py-1">P{num}</div>
                        ))}
 
                        {/* Matrix Rows */}
                        {[1, 2, 3, 4].map((actualNum, rIdx) => (
                          <React.Fragment key={actualNum}>
                            {/* Actual headers */}
                            <div className="flex items-center justify-end text-xs text-indigo-800 font-bold pr-2">A{actualNum}</div>
                            
                            {/* Matrix cells */}
                            {[1, 2, 3, 4].map((predNum, cIdx) => {
                              const cellValue = stats.confusionMatrix[rIdx][cIdx];
                              const maxValInRow = Math.max(...stats.confusionMatrix[rIdx], 1);
                              const opacity = cellValue / maxValInRow;
                              
                              // Background depending on correct vs incorrect
                              const isDiagonal = rIdx === cIdx;
                              const bgClass = isDiagonal 
                                ? `bg-indigo-300 text-black` 
                                : `bg-rose-300 text-black`;

                              return (
                                <div
                                  key={predNum}
                                  style={{ opacity: cellValue > 0 ? 0.4 + 0.6 * opacity : 0.15 }}
                                  className={`rounded-lg flex flex-col items-center justify-center aspect-square text-xs font-bold relative group border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all ${bgClass}`}
                                  title={`Actual Severity ${actualNum}, Predicted ${predNum}: ${cellValue} kasus`}
                                >
                                  {cellValue}
                                  
                                  {/* Tooltip detail */}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-white text-xs font-bold text-black border-2 border-black rounded px-2 py-1 whitespace-nowrap z-30 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] pointer-events-none">
                                    A{actualNum} & P{predNum}: {cellValue} kasus
                                  </div>
                                </div>
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-700 mt-4 text-center">
                        <span className="inline-block h-2 w-2 bg-indigo-300 border border-black rounded mr-1" /> Diagonal Biru = Benar · <span className="inline-block h-2.5 w-2.5 bg-rose-300 border border-black rounded mr-1" /> Merah = Salah
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white border-4 border-dashed border-black rounded-xl">
                      <p className="text-sm font-bold uppercase text-slate-500">Tidak Ada Kolom Severity Asli</p>
                      <p className="text-xs font-medium text-slate-500 max-w-[200px] uppercase tracking-wide mt-1">Dataset tidak memiliki kolom "Severity_Asli" untuk menghitung matriks kesesuaian.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Grid 3: Detailed Prediction List Table */}
            {predictions.length > 0 && (
              <div className="bg-white border-4 border-black rounded-2xl p-6 flex flex-col gap-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900">Daftar Hasil Prediksi Detil</h3>
                    <p className="text-xs font-medium text-slate-550 uppercase tracking-wide mt-0.5">Total hasil penyaringan: {filteredPredictions.length.toLocaleString()} dari {predictions.length.toLocaleString()} baris</p>
                  </div>
                  
                  {/* Search Bar */}
                  <div className="relative w-full md:w-80">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Cari Kota, Kabupaten, atau Jalan..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      className="w-full bg-white border-2 border-black rounded-lg pl-9 pr-4 py-2 text-sm font-semibold text-black placeholder-slate-400 focus:outline-none focus:ring-0 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    />
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border-4 border-black rounded-xl bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-indigo-100 border-b-4 border-black text-black uppercase font-bold tracking-wider text-xs">
                        <th className="py-3.5 px-4 border-r-2 border-black">No</th>
                        <th className="py-3.5 px-4 border-r-2 border-black">Lokasi (Lat, Lng)</th>
                        <th className="py-3.5 px-4 border-r-2 border-black">Jalan / Kota</th>
                        <th className="py-3.5 px-4 border-r-2 border-black">Suhu (F)</th>
                        <th className="py-3.5 px-4 border-r-2 border-black">Kelembaban (%)</th>
                        <th className="py-3.5 px-4 border-r-2 border-black">Kondisi Cuaca</th>
                        {stats?.hasActual && <th className="py-3.5 px-4 text-center border-r-2 border-black">Asli</th>}
                        <th className="py-3.5 px-4 text-center border-r-2 border-black">Prediksi</th>
                        <th className="py-3.5 px-4 text-center border-r-2 border-black">Confidence</th>
                        {stats?.hasActual && <th className="py-3.5 px-4 text-center">Status</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-black">
                      {paginatedPredictions.map((p, idx) => {
                        const actualVal = stats?.hasActual ? parseInt(p.originalRow?.Severity_Asli || "0") : null;
                        const isIncorrect = actualVal !== null && actualVal !== p.severity;
                        const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                        
                        const sevColors = [
                          "bg-blue-100 text-blue-800 border-2 border-black",
                          "bg-emerald-100 text-emerald-800 border-2 border-black",
                          "bg-amber-100 text-amber-800 border-2 border-black",
                          "bg-rose-100 text-rose-800 border-2 border-black"
                        ];

                        return (
                          <tr
                            key={p.index}
                            className={`hover:bg-slate-50 transition-colors ${isIncorrect ? "bg-red-50 hover:bg-red-100/70" : ""}`}
                          >
                            <td className="py-3 px-4 font-semibold text-slate-500 border-r-2 border-black">{rowNumber}</td>
                            <td className="py-3 px-4 font-semibold text-slate-800 border-r-2 border-black">
                              <span className="block font-mono text-[11px] text-slate-700 font-semibold">
                                {fmtFloat(p.originalRow?.Start_Lat)}, {fmtFloat(p.originalRow?.Start_Lng)}
                              </span>
                            </td>
                            <td className="py-3 px-4 max-w-[200px] truncate text-slate-900 font-semibold border-r-2 border-black" title={p.originalRow?.Street || ""}>
                              {p.originalRow?.Street ? `${p.originalRow?.Street}, ` : ""}
                              <span className="text-slate-600 font-normal">{p.originalRow?.City || "-"}</span>
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-800 font-mono border-r-2 border-black">{p.originalRow?.["Temperature(F)"] || "-"}</td>
                            <td className="py-3 px-4 text-slate-800 font-mono border-r-2 border-black">{p.originalRow?.["Humidity(%)"] || "-"}</td>
                            <td className="py-3 px-4 max-w-[120px] truncate text-slate-700 font-semibold border-r-2 border-black">{p.originalRow?.Weather_Condition || "-"}</td>
                            
                            {/* Actual Severity Badge */}
                            {actualVal !== null && (
                              <td className="py-3 px-4 text-center border-r-2 border-black">
                                <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]`}>
                                  {actualVal}
                                </span>
                              </td>
                            )}

                            {/* Predicted Severity Badge */}
                            <td className="py-3 px-4 text-center border-r-2 border-black">
                                <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${sevColors[p.severity - 1]} shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]`}>
                                  {p.severity}
                                </span>
                            </td>

                            <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 border-r-2 border-black">
                              {(p.confidence * 100).toFixed(1)}%
                            </td>

                            {/* Match/Mismatch Indicator */}
                            {actualVal !== null && (
                              <td className="py-3 px-4 text-center">
                                {isIncorrect ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-rose-100 text-rose-800 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                    Salah
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-indigo-100 text-indigo-800 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                    Sesuai
                                  </span>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                 {/* Pagination Controls */}
                {pageCount > 1 && (
                  <div className="flex items-center justify-between border-t-4 border-black pt-4 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <span>
                      Menampilkan <strong className="text-black">{((currentPage - 1) * itemsPerPage + 1).toLocaleString()}</strong> - <strong className="text-black">{Math.min(currentPage * itemsPerPage, filteredPredictions.length).toLocaleString()}</strong> dari <strong className="text-black">{filteredPredictions.length.toLocaleString()}</strong> data
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg border-2 border-black hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all text-black"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      
                      {/* Page numbers limit display */}
                      {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
                        let pageNum = currentPage;
                        if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= pageCount - 2) {
                          pageNum = pageCount - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        if (pageNum < 1 || pageNum > pageCount) return null;

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`h-8 w-8 rounded-lg text-sm font-bold transition-all border-2 ${
                              currentPage === pageNum
                                ? "bg-indigo-300 text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]"
                                : "border-black hover:bg-slate-50 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] text-slate-700 hover:text-black active:translate-x-0 active:translate-y-0 active:shadow-none"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === pageCount}
                        className="p-1.5 rounded-lg border-2 border-black hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all text-black"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: MANUAL PREDICTION ── */}
        {activeTab === "manual" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left/Middle Column: Inputs Form */}
            <form onSubmit={runSinglePrediction} className="lg:col-span-2 bg-purple-50 border-4 border-black rounded-2xl p-6 flex flex-col gap-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900">Input Parameter Kecelakaan</h3>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mt-1">Masukkan parameter di bawah ini secara manual untuk diumpankan ke model.</p>
              </div>

              {/* Grid Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Lat Lng */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">Start Latitude</label>
                  <input
                    type="text"
                    value={manualInputs.Start_Lat}
                    onChange={(e) => setManualInputs({ ...manualInputs, Start_Lat: e.target.value })}
                    className="w-full bg-white border-2 border-black rounded-lg px-3 py-2 text-sm font-bold text-black placeholder-slate-400 focus:outline-none focus:ring-0 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">Start Longitude</label>
                  <input
                    type="text"
                    value={manualInputs.Start_Lng}
                    onChange={(e) => setManualInputs({ ...manualInputs, Start_Lng: e.target.value })}
                    className="w-full bg-white border-2 border-black rounded-lg px-3 py-2 text-sm font-bold text-black placeholder-slate-400 focus:outline-none focus:ring-0 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                  />
                </div>

                {/* Temp & Humidity */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">Suhu (°F)</label>
                  <input
                    type="text"
                    value={manualInputs["Temperature(F)"]}
                    onChange={(e) => setManualInputs({ ...manualInputs, "Temperature(F)": e.target.value })}
                    className="w-full bg-white border-2 border-black rounded-lg px-3 py-2 text-sm font-bold text-black placeholder-slate-400 focus:outline-none focus:ring-0 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">Kelembaban (%)</label>
                  <input
                    type="text"
                    value={manualInputs["Humidity(%)"]}
                    onChange={(e) => setManualInputs({ ...manualInputs, "Humidity(%)": e.target.value })}
                    className="w-full bg-white border-2 border-black rounded-lg px-3 py-2 text-sm font-bold text-black placeholder-slate-400 focus:outline-none focus:ring-0 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                  />
                </div>

                {/* Pressure & Visibility */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">Tekanan Udara (in)</label>
                  <input
                    type="text"
                    value={manualInputs["Pressure(in)"]}
                    onChange={(e) => setManualInputs({ ...manualInputs, "Pressure(in)": e.target.value })}
                    className="w-full bg-white border-2 border-black rounded-lg px-3 py-2 text-sm font-bold text-black placeholder-slate-400 focus:outline-none focus:ring-0 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">Jarak Pandang (mi)</label>
                  <input
                    type="text"
                    value={manualInputs["Visibility(mi)"]}
                    onChange={(e) => setManualInputs({ ...manualInputs, "Visibility(mi)": e.target.value })}
                    className="w-full bg-white border-2 border-black rounded-lg px-3 py-2 text-sm font-bold text-black placeholder-slate-400 focus:outline-none focus:ring-0 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">Jarak Dampak (mi)</label>
                  <input
                    type="text"
                    value={manualInputs["Distance(mi)"]}
                    onChange={(e) => setManualInputs({ ...manualInputs, "Distance(mi)": e.target.value })}
                    className="w-full bg-white border-2 border-black rounded-lg px-3 py-2 text-sm font-bold text-black placeholder-slate-400 focus:outline-none focus:ring-0 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                  />
                </div>

                {/* Target encoded helpers */}
                <div className="md:col-span-2 border-t-2 border-black pt-4 mt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-800">Target Encoded / Mean Categorical values</h4>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">Kondisi Cuaca (Encoded)</label>
                  <input
                    type="text"
                    value={manualInputs.Weather_Condition}
                    onChange={(e) => setManualInputs({ ...manualInputs, Weather_Condition: e.target.value })}
                    className="w-full bg-white border-2 border-black rounded-lg px-3 py-2 text-sm font-bold text-black placeholder-slate-400 focus:outline-none focus:ring-0 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">Kota (Encoded)</label>
                  <input
                    type="text"
                    value={manualInputs.City}
                    onChange={(e) => setManualInputs({ ...manualInputs, City: e.target.value })}
                    className="w-full bg-white border-2 border-black rounded-lg px-3 py-2 text-sm font-bold text-black placeholder-slate-400 focus:outline-none focus:ring-0 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                  />
                </div>

                {/* Time values */}
                <div className="md:col-span-2 border-t-2 border-black pt-4 mt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-800">Waktu Kejadian</h4>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">Jam Mulai (0-23)</label>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={manualInputs.Start_Hour}
                    onChange={(e) => setManualInputs({ ...manualInputs, Start_Hour: e.target.value })}
                    className="w-full bg-white border-2 border-black rounded-lg px-3 py-2 text-sm font-bold text-black placeholder-slate-400 focus:outline-none focus:ring-0 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">Bulan Mulai (1-12)</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={manualInputs.Start_Month}
                    onChange={(e) => setManualInputs({ ...manualInputs, Start_Month: e.target.value })}
                    className="w-full bg-white border-2 border-black rounded-lg px-3 py-2 text-sm font-bold text-black placeholder-slate-400 focus:outline-none focus:ring-0 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                  />
                </div>
              </div>

              {/* Point of Interest checkboxes */}
              <div className="border-t-2 border-black pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-800 mb-3">Point of Interest (POI) Flags</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.keys(manualBooleans).map(key => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer select-none py-1.5">
                      <input
                        type="checkbox"
                        checked={manualBooleans[key]}
                        onChange={(e) => setManualBooleans({ ...manualBooleans, [key]: e.target.checked })}
                        className="rounded border-2 border-black text-indigo-600 bg-white focus:ring-0 focus:ring-offset-0 focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] h-4.5 w-4.5 cursor-pointer"
                      />
                      <span className="text-xs text-slate-800 font-medium uppercase tracking-wide">{key.replace("_", " ")}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isPredictingSingle || !status.online}
                className="bg-indigo-300 text-black font-bold uppercase tracking-wider text-sm py-4 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isPredictingSingle ? (
                  <>
                    <div className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Prediksi Severity</span>
                  </>
                )}
              </button>
            </form>

            {/* Right Column: Prediction Result Display */}
            <div className="bg-pink-50 border-4 border-black rounded-2xl p-6 flex flex-col gap-6 sticky top-24 min-h-[400px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900">Hasil Prediksi Model</h3>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mt-1">Status dan probabilitas output klasifikasi XGBoost.</p>
              </div>

              {singlePrediction ? (
                <div className="flex flex-col gap-5 flex-1 justify-between">
                  {/* Big indicator */}
                  <div className="bg-white border-4 border-black rounded-2xl p-6 text-center relative overflow-hidden group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-indigo-300 border-b-2 border-black" />
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Prediksi Severity</p>
                    <h2 className="text-7xl font-bold text-black mt-4 tracking-tight">
                      {singlePrediction.severity}
                    </h2>
                    <span className="inline-block mt-3 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-indigo-100 border-2 border-black text-indigo-850 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                      Keyakinan: {(singlePrediction.confidence * 100).toFixed(1)}%
                    </span>
                  </div>

                  {/* Probabilities Distribution */}
                  <div className="flex flex-col gap-3">
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Distribusi Probabilitas Kelas:</p>
                    {Object.keys(singlePrediction.probabilities).map(key => {
                      const prob = singlePrediction.probabilities[key];
                      const pct = prob * 100;
                      const colors = [
                        "bg-blue-300 text-blue-800 border-2 border-black",
                        "bg-emerald-300 text-emerald-800 border-2 border-black",
                        "bg-amber-300 text-amber-855 border-2 border-black",
                        "bg-rose-300 text-rose-855 border-2 border-black"
                      ];
                      const themeIdx = parseInt(key) - 1;
                      const isPredicted = parseInt(key) === singlePrediction.severity;

                      return (
                        <div key={key} className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
                            <span className={isPredicted ? colors[themeIdx].split(" ")[1] : "text-slate-600"}>
                              Severity Level {key} {isPredicted && "✓"}
                            </span>
                            <span className="text-slate-800 font-mono">{(pct).toFixed(1)}%</span>
                          </div>
                          <div className="h-4 bg-white border-2 border-black rounded-full overflow-hidden shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                            <div
                              style={{ width: `${pct}%` }}
                              className={`h-full rounded-full ${colors[themeIdx].split(" ")[0]} ${isPredicted ? "opacity-100" : "opacity-40"}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Severity Context explanations */}
                  <div className="text-xs text-slate-800 border-t-2 border-black pt-4 font-semibold">
                    <p className="font-bold text-slate-900 uppercase tracking-wider mb-1">Informasi Tingkat Keparahan:</p>
                    {singlePrediction.severity === 1 && "Level 1: Dampak minimal terhadap lalu lintas, durasi singkat."}
                    {singlePrediction.severity === 2 && "Level 2: Dampak sedang, penutupan sebagian lajur."}
                    {singlePrediction.severity === 3 && "Level 3: Dampak tinggi, lajur utama terblokir cukup lama."}
                    {singlePrediction.severity === 4 && "Level 4: Dampak parah, penutupan jalan total dalam waktu lama."}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white border-4 border-dashed border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <svg className="h-12 w-12 text-slate-700 mb-3 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
                  </svg>
                  <p className="text-sm font-bold uppercase tracking-wider text-slate-800">Siap Melakukan Prediksi</p>
                  <p className="text-xs font-medium text-slate-500 max-w-[200px] uppercase tracking-wide mt-1.5 leading-relaxed">Lengkapi parameter form di sebelah kiri lalu klik tombol prediksi.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t-4 border-black bg-white py-6 text-center text-xs font-bold uppercase tracking-wider text-slate-700 relative z-10">
        <p>UAS Data Mining Project</p>
      </footer>
    </div>
  );
}
