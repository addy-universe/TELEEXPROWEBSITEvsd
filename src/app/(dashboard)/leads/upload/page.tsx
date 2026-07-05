'use client';

import { useState, useRef } from 'react';

export default function UploadLeadsPage() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ count: number; batchId: string } | null>(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/leads/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setResult({ count: data.count, batchId: data.batchId });
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch {
      setError('Network error');
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Upload Leads</h1>
          <p className="page-subtitle">Import customer data from Excel/CSV</p>
        </div>
      </div>

      <div className="page-body">
        <div className="card" style={{ maxWidth: '640px' }}>
          <div
            className={`upload-zone ${dragOver ? 'dragover' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📤</div>
            <h3 style={{ marginBottom: '8px', color: 'var(--text-heading)' }}>
              {uploading ? 'Uploading...' : 'Drop your file here'}
            </h3>
            <p className="text-sm text-muted">
              Accepts .xlsx and .csv files
            </p>
            <p className="text-sm text-muted mt-8">
              Required columns: <strong>Customer Name</strong>, <strong>Phone Number</strong>, <strong>State/City</strong>, <strong>Product Variant</strong>
            </p>
            {uploading && <div className="loader" style={{ marginTop: '16px' }} />}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.csv,.xls"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />

          {error && (
            <div className="login-error" style={{ marginTop: '16px' }}>
              {error}
            </div>
          )}

          {result && (
            <div style={{
              marginTop: '16px',
              padding: '20px',
              background: 'var(--accent-green-glow)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
            }}>
              <h3 style={{ color: 'var(--accent-green)', marginBottom: '8px' }}>✅ Upload Successful!</h3>
              <p style={{ fontSize: '14px' }}>
                <strong>{result.count}</strong> leads imported successfully.
              </p>
              <p className="text-sm text-muted mt-8">Batch ID: {result.batchId}</p>
              <div className="flex gap-12 mt-16">
                <a href="/leads" className="btn btn-primary">View Leads →</a>
                <button className="btn btn-ghost" onClick={() => { setResult(null); }}>
                  Upload More
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
