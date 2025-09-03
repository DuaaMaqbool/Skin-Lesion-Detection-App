import React, { useState } from "react";
import axios from "axios";
import "../stylesheets/Upload.css"

const Upload = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      setError("Please select an image file");
      return;
    }
    
    setError(null);
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setResult(null); // clear previous result
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://127.0.0.1:5000/predict", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000 // 30 second timeout
      });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError("Prediction failed. Please check your connection and try again.");
    }
    setLoading(false);
  };

  const getRiskLevel = (confidence, className) => {
    if (className.toLowerCase().includes('benign')) return 'low';
    if (className.toLowerCase().includes('malignant')) return 'high';
    
    // Fallback based on confidence for other classes
    return confidence > 0.7 ? 'medium' : 'low';
  };

  return (
    <div className="upload-container">
      <header className="app-header">
        <div className="header-content">
          <h1><i className="fas fa-microscope"></i> DermAI Analyzer</h1>
          <p>Skin lesion detection powered by AI</p>
        </div>
      </header>

      <main className="main-content">
        <div className="upload-card">
          <div className="card-header">
            <h2>Upload Lesion Image</h2>
            <p>Supported formats: JPG, PNG, JPEG</p>
          </div>

          <div className="upload-area">
            <input 
              type="file" 
              id="file-upload" 
              accept="image/*" 
              onChange={handleFileChange} 
              className="file-input" 
            />
            <label htmlFor="file-upload" className="upload-label">
              <div className="upload-content">
                <i className="fas fa-cloud-upload-alt"></i>
                <p>Click to browse or drag and drop</p>
                <span>Max file size: 5MB</span>
              </div>
            </label>
          </div>

          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}

          {preview && (
            <div className="preview-section">
              <h3>Image Preview</h3>
              <div className="image-container">
                <img src={preview} alt="preview" />
              </div>
            </div>
          )}

          <button 
            onClick={handleSubmit} 
            disabled={loading || !file}
            className={`predict-button ${loading ? 'loading' : ''}`}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Analyzing...
              </>
            ) : (
              <>
                <i className="fas fa-search"></i>
                Analyze Image
              </>
            )}
          </button>
        </div>

        {result && (
          <div className="results-card">
            <div className="card-header">
              <h2>Analysis Results</h2>
              <div className={`risk-badge ${getRiskLevel(result.confidence, result.predicted_class_name)}`}>
                {getRiskLevel(result.confidence, result.predicted_class_name).toUpperCase()} RISK
              </div>
            </div>

            <div className="result-content">
              <div className="primary-result">
                <h3>Prediction</h3>
                <div className="prediction-display">
                  <span className="class-name">{result.predicted_class_name}</span>
                  <span className="confidence">{(result.confidence * 100).toFixed(2)}% confidence</span>
                </div>
              </div>

              {result.top3 && (
                <div className="secondary-results">
                  <h4>Other possibilities</h4>
                  <div className="probability-bars">
                    {result.top3.map((r, index) => (
                      <div key={r.index} className="probability-item">
                        <div className="prob-info">
                          <span className="prob-name">{r.name}</span>
                          <span className="prob-percentage">{(r.probability * 100).toFixed(2)}%</span>
                        </div>
                        <div className="prob-bar">
                          <div 
                            className="prob-fill" 
                            style={{ width: `${r.probability * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="results-footer">
                <p>
                  <i className="fas fa-info-circle"></i>
                  This analysis is provided for informational purposes only. Please consult a healthcare professional for medical diagnosis.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>DermAI Analyzer &copy; {new Date().getFullYear()} | For research purposes only</p>
      </footer>
    </div>
  );
};

export default Upload;
