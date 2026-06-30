"use client";

import React, { useState, useEffect, Fragment } from "react";

export default function USAccidents() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [edaData, setEdaData] = useState<any>(null);
  const [edaLoading, setEdaLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/us-accidents/eda")
      .then(res => res.json())
      .then(data => {
        if (!data.error) setEdaData(data);
        setEdaLoading(false);
      })
      .catch(err => {
        console.error(err);
        setEdaLoading(false);
      });
  }, []);

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:8000/api/us-accidents/train");
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  };

  const dataDictionary = [
    {
      category: "📍 A. Informasi Dasar & Lokasi",
      items: [
        { name: "ID", desc: "ID unik untuk setiap catatan kecelakaan." },
        { name: "Source", desc: "API/Sumber yang melaporkan data tersebut." },
        { name: "Severity", desc: "Skala (1-4) seberapa parah dampak kecelakaan (Label/Target)." },
        { name: "Start_Time & End_Time", desc: "Waktu dimulainya dan berakhirnya dampak lalu lintas kecelakaan." },
        { name: "Start_Lat & Start_Lng", desc: "Koordinat GPS (Latitude/Longitude) awal kejadian." },
        { name: "End_Lat & End_Lng", desc: "Koordinat GPS akhir terdampak kecelakaan." },
        { name: "Distance(mi)", desc: "Panjang jalan raya yang mengalami kemacetan (dalam mil)." },
        { name: "Description", desc: "Deskripsi teks laporan singkat kecelakaan tersebut." },
        { name: "Street, City, State, Zipcode", desc: "Detail alamat lokasi kecelakaan." },
        { name: "Timezone & Airport_Code", desc: "Zona waktu & kode stasiun cuaca terdekat." },
      ]
    },
    {
      category: "🌦️ B. Kondisi Cuaca Saat Kejadian",
      items: [
        { name: "Weather_Timestamp", desc: "Waktu kapan data cuaca ini diambil." },
        { name: "Temperature(F)", desc: "Suhu udara dalam Fahrenheit." },
        { name: "Wind_Chill(F)", desc: "Suhu yang terasa pada tubuh manusia." },
        { name: "Humidity(%)", desc: "Kelembaban udara (dalam persen)." },
        { name: "Pressure(in)", desc: "Tekanan udara." },
        { name: "Visibility(mi)", desc: "Jarak pandang pengemudi (dalam mil)." },
        { name: "Wind_Direction & Speed", desc: "Arah hembusan dan kecepatan angin (mph)." },
        { name: "Precipitation(in)", desc: "Tingkat curah hujan (dalam inci)." },
        { name: "Weather_Condition", desc: "Deskripsi teks kondisi cuaca (Clear, Rain, dll)." },
      ]
    },
    {
      category: "🛣️ C. Infrastruktur Jalan (Nilai Boolean True/False)",
      items: [
        { name: "Amenity", desc: "Dekat fasilitas umum." },
        { name: "Bump", desc: "Dekat polisi tidur." },
        { name: "Crossing", desc: "Dekat zebra cross." },
        { name: "Give_Way", desc: "Dekat rambu beri jalan." },
        { name: "Junction", desc: "Dekat persimpangan." },
        { name: "No_Exit", desc: "Dekat area jalan buntu." },
        { name: "Railway", desc: "Dekat rel kereta api." },
        { name: "Roundabout", desc: "Terjadi di bundaran." },
        { name: "Station", desc: "Dekat stasiun bus/kereta." },
        { name: "Stop", desc: "Dekat rambu stop." },
        { name: "Traffic_Calming", desc: "Zona perlambatan lalu lintas." },
        { name: "Traffic_Signal", desc: "Dekat lampu lalu lintas merah-kuning-hijau." },
        { name: "Turning_Loop", desc: "Putaran balik arah." },
      ]
    },
    {
      category: "🌙 D. Pencahayaan / Posisi Matahari",
      items: [
        { name: "Sunrise_Sunset", desc: "Waktu terbit/terbenam matahari secara umum (Day/Night)." },
        { name: "Civil, Nautical, Astronomical Twilight", desc: "Fase senja/fajar dilihat dari sudut kemiringan matahari." },
      ]
    }
  ];

  return (
    <div className="animate-fade-in">
      <h1 className="title">US Accidents Analysis</h1>
      <p className="subtitle">Real-time simulation of traffic severity prediction using Random Forest.</p>

      {/* Data Dictionary Section */}
      <div className="vercel-card" style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <span className="label">Dataset Documentation</span>
            <h3 style={{ fontSize: "1.1rem", color: "#fff", fontWeight: 600, margin: 0 }}>Data Dictionary (Penjelasan Atribut & Fitur)</h3>
          </div>
          <div style={{ background: "rgba(233,69,96,0.1)", border: "1px solid rgba(233,69,96,0.3)", color: "#e94560", padding: "4px 12px", borderRadius: "20px", fontSize: "0.875rem", fontWeight: 600 }}>
            46 Total Kolom
          </div>
        </div>
        
        <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: "8px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
                <th style={{ padding: "12px 16px", color: "var(--muted)", fontWeight: 500, width: "30%" }}>Kolom / Atribut</th>
                <th style={{ padding: "12px 16px", color: "var(--muted)", fontWeight: 500 }}>Deskripsi</th>
              </tr>
            </thead>
            <tbody>
              {dataDictionary.map((section, idx) => (
                <React.Fragment key={idx}>
                  <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                    <td colSpan={2} style={{ padding: "12px 16px", color: "#fff", fontWeight: 600, borderBottom: "1px solid var(--border)" }}>
                      {section.category}
                    </td>
                  </tr>
                  {section.items.map((item, itemIdx) => (
                    <tr key={itemIdx} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "12px 16px", color: "#fff", fontFamily: "monospace" }}>{item.name}</td>
                      <td style={{ padding: "12px 16px", color: "var(--muted)" }}>{item.desc}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDA Section */}
      {edaLoading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "40px", flexDirection: "column" }}>
          <div className="spinner"></div>
          <p style={{ marginTop: "16px", color: "var(--muted)", fontSize: "0.875rem" }}>Loading dataset analysis...</p>
        </div>
      ) : edaData ? (
        <>
          <div className="vercel-card" style={{ marginBottom: "32px", overflowX: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span className="label" style={{ margin: 0 }}>Dataset Preview (First 5 Rows)</span>
              <span style={{ fontSize: "0.75rem", color: "var(--muted)", background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: "4px" }}>
                Total: {edaData.columns.length} Kolom
              </span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>
                  {edaData.columns.slice(0, 15).map((col: string) => (
                    <th key={col} style={{ padding: "8px", textAlign: "left", fontWeight: 500 }}>{col}</th>
                  ))}
                  {edaData.columns.length > 15 && <th style={{ padding: "8px", textAlign: "left", fontWeight: 500 }}>...</th>}
                </tr>
              </thead>
              <tbody>
                {edaData.head_data.map((row: any, i: number) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    {edaData.columns.slice(0, 15).map((col: string) => (
                      <td key={col} style={{ padding: "8px", color: "#fff" }}>{String(row[col]).substring(0, 20)}</td>
                    ))}
                    {edaData.columns.length > 15 && <td style={{ padding: "8px", color: "#fff" }}>...</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid-2" style={{ marginBottom: "32px" }}>
            {edaData.charts.missing_values && (
              <div className="vercel-card">
                <span className="label">1. Missing Values (Top 10)</span>
                <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "16px" }}>Columns with &gt;50% missing are dropped automatically.</p>
                <img src={`data:image/png;base64,${edaData.charts.missing_values}`} alt="Missing Values Chart" style={{ width: "100%", height: "auto" }} />
              </div>
            )}
            
            <div className="vercel-card">
              <span className="label">2. Data Distribution & Outliers</span>
              <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "16px" }}>Severity distribution and Temperature boxplot.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {edaData.charts.severity && <img src={`data:image/png;base64,${edaData.charts.severity}`} alt="Severity Chart" style={{ width: "100%", height: "auto" }} />}
                {edaData.charts.temperature && <img src={`data:image/png;base64,${edaData.charts.temperature}`} alt="Temperature Boxplot" style={{ width: "100%", height: "auto" }} />}
              </div>
            </div>
          </div>
        </>
      ) : null}

      <div className="vercel-card" style={{ marginBottom: "32px", padding: "40px 32px" }}>
        <div style={{ maxWidth: "600px" }}>
          <span className="label">Model Execution</span>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#fff", marginBottom: "16px", letterSpacing: "-0.02em" }}>Random Forest Classifier</h2>
          <p style={{ color: "var(--muted)", marginBottom: "32px", fontSize: "0.875rem", lineHeight: 1.6 }}>
            Initiate the feature extraction and model training process using a 50,000-row sample from the US Accidents dataset. This process runs securely on the backend.
          </p>
          
          <button onClick={handlePredict} className="btn-primary" disabled={loading}>
            {loading ? (
              <><div className="spinner"></div> Executing Model...</>
            ) : (
              "Initialize Training Run"
            )}
          </button>
          {error && <div style={{ color: "var(--error)", marginTop: "16px", fontSize: "0.875rem" }}>Error: {error}</div>}
        </div>
      </div>

      {result && (
        <div className="animate-fade-in">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--success)" }}></div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#fff", letterSpacing: "-0.01em", margin: 0 }}>Execution Results</h2>
          </div>
          
          <div className="grid-2" style={{ marginBottom: "24px" }}>
            <div className="vercel-card" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <span className="label">Test Accuracy</span>
              <div style={{ fontSize: "3.5rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.04em", margin: "16px 0" }}>
                {(result.accuracy * 100).toFixed(2)}%
              </div>
              <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: 0 }}>Evaluated on {result.test_size.toLocaleString()} test samples.</p>
            </div>
            
            <div className="vercel-card">
              <span className="label" style={{ marginBottom: "24px" }}>Top Feature Importance</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {result.top_features.slice(0, 5).map((f: any, idx: number) => {
                  const maxImp = result.top_features[0].importance;
                  const pct = (f.importance / maxImp) * 100;
                  return (
                    <div key={idx}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "6px" }}>
                        <span style={{ color: "#fff" }}>{f.feature}</span>
                        <span style={{ color: "var(--muted)", fontFamily: "monospace" }}>{f.importance.toFixed(4)}</span>
                      </div>
                      <div style={{ width: "100%", height: "4px", background: "var(--border)", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "#fff" }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="vercel-card">
            <span className="label" style={{ marginBottom: "24px" }}>Classification Report</span>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <th style={{ padding: "12px 16px", color: "var(--muted)", fontWeight: 500 }}>Class / Severity</th>
                    <th style={{ padding: "12px 16px", color: "var(--muted)", fontWeight: 500 }}>Precision</th>
                    <th style={{ padding: "12px 16px", color: "var(--muted)", fontWeight: 500 }}>Recall</th>
                    <th style={{ padding: "12px 16px", color: "var(--muted)", fontWeight: 500 }}>F1-Score</th>
                    <th style={{ padding: "12px 16px", color: "var(--muted)", fontWeight: 500 }}>Support</th>
                  </tr>
                </thead>
                <tbody>
                  {["1", "2", "3", "4"].map((cls) => {
                    const row = result.classification_report[cls];
                    if (!row) return null;
                    return (
                      <tr key={cls} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <td style={{ padding: "12px 16px", color: "#fff", fontWeight: 500 }}>Severity {cls}</td>
                        <td style={{ padding: "12px 16px", color: "var(--muted)", fontFamily: "monospace" }}>{row.precision.toFixed(4)}</td>
                        <td style={{ padding: "12px 16px", color: "var(--muted)", fontFamily: "monospace" }}>{row.recall.toFixed(4)}</td>
                        <td style={{ padding: "12px 16px", color: "var(--muted)", fontFamily: "monospace" }}>{row["f1-score"].toFixed(4)}</td>
                        <td style={{ padding: "12px 16px", color: "var(--muted)", fontFamily: "monospace" }}>{row.support.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
