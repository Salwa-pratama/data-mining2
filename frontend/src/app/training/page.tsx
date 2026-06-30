"use client";

import { useEffect, useState } from "react";

export default function TrainingAnalysis() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/catdog/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", flexDirection: "column" }}>
        <div className="spinner" style={{ width: "24px", height: "24px", marginBottom: "16px" }}></div>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>Loading statistics...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="animate-fade-in">
        <h1 className="title">Training Analysis</h1>
        <p className="subtitle" style={{ color: "var(--error)" }}>Failed to fetch data from backend.</p>
      </div>
    );
  }

  const splits = ["train", "valid", "test"];
  const splitLabels: any = { train: "Training", valid: "Validation", test: "Testing" };

  return (
    <div className="animate-fade-in">
      <h1 className="title">Training Dataset Analysis</h1>
      <p className="subtitle">Statistics and distribution of the image dataset used to train the model.</p>

      <div className="vercel-card" style={{ marginBottom: "32px" }}>
        <span className="label">Dataset Volume</span>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", marginTop: "16px", marginBottom: "32px" }}>
          {splits.map((split) => {
            const data = stats.stats[split];
            return (
              <div key={split} style={{ border: "1px solid var(--border)", borderRadius: "6px", padding: "24px", textAlign: "left" }}>
                <span className="label" style={{ marginBottom: "16px" }}>{splitLabels[split]}</span>
                <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1 }}>
                  {data?.total?.toLocaleString()}
                </div>
                <p style={{ color: "var(--muted)", fontSize: "0.75rem", marginTop: "8px" }}>Total Images</p>
              </div>
            );
          })}
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="label" style={{ margin: 0 }}>Total Dataset Size</span>
          <strong style={{ color: "#fff", fontSize: "1.25rem", fontWeight: 600 }}>{stats.grand_total?.toLocaleString()} items</strong>
        </div>
      </div>

      <div className="vercel-card">
        <span className="label">Class Distribution</span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px", marginTop: "16px" }}>
          {splits.map((split) => {
            const counts = stats.stats[split]?.counts || {};
            const total = stats.stats[split]?.total || 1;
            const catPct = ((counts["Cat"] || 0) / total) * 100;
            const dogPct = ((counts["Dog"] || 0) / total) * 100;
            
            return (
              <div key={split} style={{ border: "1px solid var(--border)", padding: "20px", borderRadius: "6px" }}>
                <span className="label" style={{ marginBottom: "24px" }}>{splitLabels[split]}</span>
                
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.875rem" }}>
                    <span style={{ color: "#fff" }}>Cat <span style={{ color: "var(--muted)" }}>({counts["Cat"] || 0})</span></span>
                    <span style={{ color: "var(--muted)" }}>{catPct.toFixed(1)}%</span>
                  </div>
                  <div style={{ width: "100%", height: "4px", background: "var(--border)", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ width: `${catPct}%`, height: "100%", background: "#fff" }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.875rem" }}>
                    <span style={{ color: "#fff" }}>Dog <span style={{ color: "var(--muted)" }}>({counts["Dog"] || 0})</span></span>
                    <span style={{ color: "var(--muted)" }}>{dogPct.toFixed(1)}%</span>
                  </div>
                  <div style={{ width: "100%", height: "4px", background: "var(--border)", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ width: `${dogPct}%`, height: "100%", background: "#888" }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
