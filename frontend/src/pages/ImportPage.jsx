import { useState } from 'react';
import { toast } from 'react-toastify';
import { previewExcelImport, uploadExcelImport } from '../services/importService';

const SHEET_OPTIONS = [
  { key: 'Sales', label: '📈 Sales', desc: 'Sales sheet from Excel' },
  { key: 'Purchase', label: '🛒 Purchase', desc: 'Purchase sheet from Excel' },
];

const ImportPage = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedSheets, setSelectedSheets] = useState(['Purchase', 'Sales']);

  const toggleSheet = (key) => {
    setSelectedSheets((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  };

  const handlePreview = async () => {
    if (!file) { toast.error('Please select an Excel file first'); return; }
    if (!selectedSheets.length) { toast.error('Select at least one sheet to import'); return; }
    setPreviewLoading(true);
    try {
      const data = await previewExcelImport(file, selectedSheets);
      setPreview(data);
      toast.info('🔍 Preview generated');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Preview failed');
    } finally {
      setPreviewLoading(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!file) { toast.error('Please select an Excel file first'); return; }
    if (!selectedSheets.length) { toast.error('Select at least one sheet to import'); return; }
    setLoading(true);
    try {
      const data = await uploadExcelImport(file, selectedSheets);
      setResult(data);
      setPreview(null);
      toast.success('✅ Import completed successfully');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) {
      setFile(f);
      setPreview(null);
      setResult(null);
      toast.info(`📎 ${f.name} selected`);
    } else {
      toast.error('Please drop a valid .xlsx or .xls file');
    }
  };

  return (
    <div className="space-y" style={{ maxWidth: 720 }}>
      <div className="card">
        <div className="card-header">
          <span className="card-title">📥 Import Purchase / Sales Excel</span>
        </div>
        <div className="card-body">
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 13 }}>
            Upload files like <strong>Purchase Sales - BS Int 82-83.xlsx</strong>. Choose which sheets to import.
          </p>

          <div className="sheet-select-grid" style={{ marginBottom: 16 }}>
            {SHEET_OPTIONS.map(({ key, label, desc }) => (
              <label key={key} className={`sheet-select-card ${selectedSheets.includes(key) ? 'selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={selectedSheets.includes(key)}
                  onChange={() => toggleSheet(key)}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</div>
                </div>
              </label>
            ))}
          </div>

          <form onSubmit={submit} className="space-y">
            <div
              className="file-drop"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById('file-input').click()}
            >
              <div className="file-drop-icon">📊</div>
              {file ? (
                <>
                  <p style={{ color: 'var(--accent-light)', fontWeight: 600 }}>📎 {file.name}</p>
                  <span>{(file.size / 1024).toFixed(1)} KB</span>
                </>
              ) : (
                <>
                  <p>Drop your Excel file here, or <span style={{ color: 'var(--accent-light)', fontWeight: 600 }}>click to browse</span></p>
                  <span>Supports .xlsx and .xls · Purchase &amp; Sales sheets</span>
                </>
              )}
            </div>

            <input
              id="file-input"
              type="file"
              accept=".xls,.xlsx"
              style={{ display: 'none' }}
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setPreview(null);
                setResult(null);
              }}
            />

            <div className="flex gap-2">
              <button type="button" className="btn btn-secondary" onClick={handlePreview} disabled={previewLoading || loading || !file}>
                {previewLoading ? '⏳ Previewing...' : '🔍 Preview Dry-Run'}
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading || previewLoading || !file}>
                {loading ? '⏳ Importing...' : `📤 Import ${selectedSheets.join(' + ')}`}
              </button>
              {file && (
                <button type="button" className="btn btn-ghost" onClick={() => { setFile(null); setPreview(null); setResult(null); }}>
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {(preview || result) && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">{preview ? '🔍 Import Preview' : '📊 Import Results'}</span>
          </div>
          <div className="card-body">
            {(() => {
              const data = preview || result;
              return (
                <>
                  <div className="import-result">
                    <div className="import-result-row">
                      <span>{preview ? 'New Bills to Create' : 'New Bills Created'}</span>
                      <span style={{ color: 'var(--success)', fontWeight: 700 }}>{data.totalImported}</span>
                    </div>
                    <div className="import-result-row">
                      <span>{preview ? 'Existing Bills to Update' : 'Existing Bills Updated'}</span>
                      <span style={{ color: 'var(--accent-light)', fontWeight: 700 }}>{data.totalUpdated}</span>
                    </div>
                    <div className="import-result-row">
                      <span>Skipped</span>
                      <span style={{ color: 'var(--warning)', fontWeight: 700 }}>{data.totalSkipped}</span>
                    </div>
                  </div>
                  {data.details?.map((d) => (
                    <div key={d.sheet} style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid var(--border)', marginTop: 12 }}>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>
                        {d.sheet === 'Sales' ? '📈' : '🛒'} {d.sheet}
                      </div>
                      <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
                        <span style={{ color: 'var(--success)' }}>✅ New: {d.imported}</span>
                        <span style={{ color: 'var(--accent-light)' }}>🔄 Update: {d.updated}</span>
                        <span style={{ color: 'var(--warning)' }}>⚠️ Skip: {d.skipped}</span>
                      </div>
                      {d.message && <p style={{ marginTop: 4, color: 'var(--text-secondary)', fontSize: 12 }}>{d.message}</p>}
                    </div>
                  ))}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportPage;
