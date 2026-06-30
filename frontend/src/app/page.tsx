"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [modelStatus, setModelStatus] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/api/catdog/status")
      .then((res) => res.json())
      .then((data) => setModelStatus(data))
      .catch((err) => console.error(err));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setPrediction(null);
    }
  };

  const handlePredict = async () => {
    if (!selectedFile) return;
    setLoading(true);
    
    const formData = new FormData();
    formData.append("file", selectedFile);
    
    try {
      const res = await fetch("http://localhost:8000/api/catdog/predict", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setPrediction(data);
    } catch (err) {
      console.error(err);
      alert("Error connecting to backend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="title">Image Prediction</h1>
      <p className="subtitle">Upload an image to classify as Cat or Dog.</p>
      
      {/* Status Panel */}
      <div className="vercel-card" style={{ marginBottom: "32px", display: "flex", gap: "24px", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <span className="label">System Status</span>
          {modelStatus ? (
            modelStatus.exists ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--success)" }}></div>
                <span style={{ fontSize: "0.875rem" }}>Model Online ({modelStatus.size_mb} MB)</span>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--error)" }}></div>
                <span style={{ fontSize: "0.875rem", color: "var(--error)" }}>Model Offline</span>
              </div>
            )
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--muted)" }}>
              <div className="spinner spinner-light" style={{ width: "12px", height: "12px", borderWidth: "1px" }}></div>
              <span style={{ fontSize: "0.875rem" }}>Connecting...</span>
            </div>
          )}
        </div>
        
        <div style={{ width: "1px", height: "40px", background: "var(--border)" }}></div>
        
        <div style={{ flex: 1 }}>
          <span className="label">Configuration</span>
          <div style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
            Input: <span style={{ color: "#fff" }}>160×160</span> &bull; Arch: <span style={{ color: "#fff" }}>CNN</span>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Upload Section */}
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "16px", color: "#fff", letterSpacing: "-0.01em" }}>Upload</h2>
          <div className="vercel-card" style={{ textAlign: "center", padding: "40px 24px", minHeight: "320px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              style={{ display: "none" }} 
              id="file-upload" 
            />
            
            {previewUrl ? (
              <div>
                <div style={{ border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden", marginBottom: "16px", display: "inline-block" }}>
                  <img src={previewUrl} alt="Preview" style={{ maxWidth: "100%", maxHeight: "200px", display: "block" }} />
                </div>
                <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "24px" }}>{selectedFile?.name}</p>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                  <label htmlFor="file-upload" className="btn-secondary">Change</label>
                  <button onClick={handlePredict} className="btn-primary" disabled={loading || (modelStatus && !modelStatus.exists)}>
                    {loading ? <div className="spinner"></div> : "Run Prediction"}
                  </button>
                </div>
              </div>
            ) : (
              <label htmlFor="file-upload" style={{ cursor: "pointer", display: "block", border: "1px dashed var(--border)", borderRadius: "6px", padding: "40px 20px", transition: "border-color 0.2s" }} className="upload-zone">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 16px auto", color: "var(--muted)" }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <h3 style={{ fontSize: "1rem", fontWeight: 500, marginBottom: "4px" }}>Select Image</h3>
                <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>JPG, PNG, or WEBP</p>
              </label>
            )}
          </div>
        </div>

        {/* Result Section */}
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "16px", color: "#fff", letterSpacing: "-0.01em" }}>Result</h2>
          <div className="vercel-card" style={{ minHeight: "320px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            {prediction ? (
              prediction.error ? (
                <div style={{ color: "var(--error)", textAlign: "center", fontSize: "0.875rem" }}>{prediction.error}</div>
              ) : (
                <div className="animate-fade-in" style={{ padding: "0 16px" }}>
                  <span className="label" style={{ textAlign: "center" }}>Classification</span>
                  <h2 style={{ fontSize: "3.5rem", color: "#fff", marginBottom: "32px", fontWeight: 800, textAlign: "center", letterSpacing: "-0.04em" }}>
                    {prediction.class}
                  </h2>
                  
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: "24px" }}>
                    <span className="label" style={{ marginBottom: "16px" }}>Confidence Scores</span>
                    
                    <div style={{ marginBottom: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "8px" }}>
                        <span>Cat</span>
                        <span style={{ color: "var(--muted)" }}>{((1 - prediction.raw_score) * 100).toFixed(2)}%</span>
                      </div>
                      <div style={{ width: "100%", height: "4px", background: "var(--border)", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ width: `${(1 - prediction.raw_score) * 100}%`, height: "100%", background: "#fff" }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "8px" }}>
                        <span>Dog</span>
                        <span style={{ color: "var(--muted)" }}>{(prediction.raw_score * 100).toFixed(2)}%</span>
                      </div>
                      <div style={{ width: "100%", height: "4px", background: "var(--border)", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ width: `${prediction.raw_score * 100}%`, height: "100%", background: "#fff" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div style={{ textAlign: "center", color: "var(--muted)" }}>
                <p style={{ fontSize: "0.875rem" }}>Awaiting image upload.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .upload-zone:hover {
          border-color: #555 !important;
        }
      `}} />
    </div>
  );
}
