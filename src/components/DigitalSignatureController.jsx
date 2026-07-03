import React, { useState, useEffect, useRef } from 'react';
import { Settings, PenTool, Type, Upload, Trash2, Check, RefreshCw } from 'lucide-react';

const DigitalSignatureController = ({ onConfigChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState('none'); // 'none' | 'type' | 'draw' | 'upload'
  const [showStamp, setShowStamp] = useState(true);
  const [text, setText] = useState('Finance Dept');
  const [font, setFont] = useState('Playball'); // 'Playball' | 'Caveat' | 'Alex Brush'
  const [drawData, setDrawData] = useState('');
  const [uploadData, setUploadData] = useState('');
  const [sigColor, setSigColor] = useState('#1e3a8a'); // deep blue signature ink

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedType = localStorage.getItem('alp_sig_type');
    const savedShowStamp = localStorage.getItem('alp_sig_show_stamp');
    const savedText = localStorage.getItem('alp_sig_text');
    const savedFont = localStorage.getItem('alp_sig_font');
    const savedDrawData = localStorage.getItem('alp_sig_draw_data');
    const savedUploadData = localStorage.getItem('alp_sig_upload_data');
    const savedColor = localStorage.getItem('alp_sig_color');

    if (savedType) setType(savedType);
    if (savedShowStamp) setShowStamp(savedShowStamp === 'true');
    if (savedText) setText(savedText);
    if (savedFont) setFont(savedFont);
    if (savedDrawData) setDrawData(savedDrawData);
    if (savedUploadData) setUploadData(savedUploadData);
    if (savedColor) setSigColor(savedColor);
  }, []);

  // Update parent whenever configuration changes
  useEffect(() => {
    if (onConfigChange) {
      onConfigChange({
        type,
        showStamp,
        text,
        font,
        drawData,
        uploadData,
        sigColor
      });
    }
  }, [type, showStamp, text, font, drawData, uploadData, sigColor, onConfigChange]);

  // Persist values to localStorage
  const saveConfig = (newType, newShowStamp, newText, newFont, newDraw, newUpload, newColor) => {
    localStorage.setItem('alp_sig_type', newType);
    localStorage.setItem('alp_sig_show_stamp', String(newShowStamp));
    localStorage.setItem('alp_sig_text', newText);
    localStorage.setItem('alp_sig_font', newFont);
    if (newDraw) localStorage.setItem('alp_sig_draw_data', newDraw);
    if (newUpload) localStorage.setItem('alp_sig_upload_data', newUpload);
    localStorage.setItem('alp_sig_color', newColor);
  };

  // Handle canvas drawing
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = sigColor;

    const rect = canvas.getBoundingClientRect();
    // Support mouse and touch events
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    if (clientX === undefined || clientY === undefined) return;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    e.preventDefault();
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    if (clientX === undefined || clientY === undefined) return;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    e.preventDefault();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      setDrawData(dataUrl);
      saveConfig(type, showStamp, text, font, dataUrl, uploadData, sigColor);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setDrawData('');
      localStorage.removeItem('alp_sig_draw_data');
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      setUploadData(base64);
      saveConfig(type, showStamp, text, font, drawData, base64, sigColor);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="no-print" style={{ fontFamily: 'Inter, sans-serif', position: 'relative' }}>
      {/* Styles for signatures & interactive controls */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playball&family=Caveat:wght@600&family=Alex+Brush&display=swap');
        
        .alp-sig-panel-toggle {
          background: #eff6ff;
          color: #1e40af;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }
        .alp-sig-panel-toggle:hover {
          background: #dbeafe;
        }
        .alp-sig-dropdown-drawer {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 320px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          padding: 20px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .alp-sig-mode-tab {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 8px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          cursor: pointer;
          font-size: 0.72rem;
          font-weight: 700;
          color: #64748b;
          transition: all 0.15s ease;
        }
        .alp-sig-mode-tab.active {
          border-color: #3b82f6;
          background: #eff6ff;
          color: #1d4ed8;
        }
        .alp-sig-canvas-container {
          border: 1px dashed #cbd5e1;
          border-radius: 8px;
          position: relative;
          background: #f8fafc;
          overflow: hidden;
        }
        .alp-sig-canvas-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 6px;
        }
        .alp-sig-btn-mini {
          padding: 4px 8px;
          font-size: 0.7rem;
          font-weight: 700;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          color: #64748b;
        }
        .alp-sig-btn-mini:hover {
          background: #f1f5f9;
          color: #334155;
        }
        .alp-sig-font-option {
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          font-size: 0.85rem;
          text-align: center;
        }
        .alp-sig-font-option.active {
          border-color: #3b82f6;
          background: #eff6ff;
          font-weight: 700;
        }
      `}</style>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="alp-sig-panel-toggle"
      >
        <PenTool size={16} />
        🖊️ Tanda Tangan Digital
      </button>

      {isOpen && (
        <div className="alp-sig-dropdown-drawer">
          <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
            <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Settings size={16} style={{ color: '#64748b' }} /> Setup Tanda Tangan
            </span>
            <button 
              onClick={() => setIsOpen(false)} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#94a3b8', fontWeight: '800' }}
            >
              ×
            </button>
          </div>

          {/* Stamp toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', color: '#475569' }} onClick={() => {
            const nextStamp = !showStamp;
            setShowStamp(nextStamp);
            saveConfig(type, nextStamp, text, font, drawData, uploadData, sigColor);
          }}>
            <input 
              type="checkbox" 
              checked={showStamp} 
              onChange={() => {}} 
              style={{ cursor: 'pointer' }}
            />
            Tampilkan Logo/Stempel Perusahaan
          </div>

          {/* Color Selector */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '600', color: '#475569' }}>
            <span>Warna Tinta:</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { name: 'Biru Ink', val: '#1e3a8a' },
                { name: 'Hitam', val: '#0f172a' },
                { name: 'Merah Stamp', val: '#dc2626' }
              ].map(c => (
                <button
                  key={c.val}
                  onClick={() => {
                    setSigColor(c.val);
                    saveConfig(type, showStamp, text, font, drawData, uploadData, c.val);
                  }}
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    border: sigColor === c.val ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    borderRadius: '4px',
                    background: 'white',
                    color: sigColor === c.val ? '#2563eb' : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tabs for signature modes */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'none', label: 'Tanpa TTD', icon: Trash2 },
              { id: 'type', label: 'Ketik', icon: Type },
              { id: 'draw', label: 'Gambar', icon: PenTool },
              { id: 'upload', label: 'Unggah', icon: Upload }
            ].map(tab => (
              <div 
                key={tab.id}
                onClick={() => {
                  setType(tab.id);
                  saveConfig(tab.id, showStamp, text, font, drawData, uploadData, sigColor);
                }}
                className={`alp-sig-mode-tab ${type === tab.id ? 'active' : ''}`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </div>
            ))}
          </div>

          {/* Mode contents */}
          {type === 'type' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input 
                type="text" 
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  saveConfig(type, showStamp, e.target.value, font, drawData, uploadData, sigColor);
                }}
                placeholder="Ketik nama ttd..."
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
              />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                {['Playball', 'Caveat', 'Alex Brush'].map(f => (
                  <div 
                    key={f}
                    onClick={() => {
                      setFont(f);
                      saveConfig(type, showStamp, text, f, drawData, uploadData, sigColor);
                    }}
                    className={`alp-sig-font-option ${font === f ? 'active' : ''}`}
                    style={{ fontFamily: f }}
                  >
                    {f}
                  </div>
                ))}
              </div>
            </div>
          )}

          {type === 'draw' && (
            <div>
              <div className="alp-sig-canvas-container">
                <canvas 
                  ref={canvasRef}
                  width={278}
                  height={120}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  style={{ display: 'block', cursor: 'crosshair', touchAction: 'none' }}
                />
              </div>
              <div className="alp-sig-canvas-buttons">
                <button onClick={clearCanvas} className="alp-sig-btn-mini">Clear</button>
              </div>
            </div>
          )}

          {type === 'upload' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                style={{ fontSize: '0.8rem' }}
              />
              {uploadData && (
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px', textAlign: 'center', background: '#f8fafc' }}>
                  <img src={uploadData} alt="Uploaded preview" style={{ maxHeight: '60px', maxWidth: '100%', objectFit: 'contain' }} />
                </div>
              )}
            </div>
          )}

          <button 
            onClick={() => setIsOpen(false)}
            style={{ 
              background: '#0f172a', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              padding: '8px 16px', 
              fontWeight: '700', 
              fontSize: '0.8rem', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Check size={14} /> Terapkan &amp; Tutup
          </button>
        </div>
      )}
    </div>
  );
};

export default DigitalSignatureController;
