import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker to use CDN matching pdfjs-dist version
if (typeof window !== 'undefined' && pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.mjs`;
}

const ExtraDocsUploader = ({ extraDocuments = [], onChange, compact = false }) => {
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const processImageFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve([e.target.result]);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const processPdfFile = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const pageImages = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      setLoadingText(`Memproses PDF: Halaman ${i} dari ${pdf.numPages}…`);
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 }); // 2.0 scale for sharp print quality
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: context, viewport }).promise;
      pageImages.push(canvas.toDataURL('image/png'));
    }

    return pageImages;
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files || files.length === 0) return;

    setLoading(true);
    setErrorMsg('');
    const newDocs = [];

    try {
      for (let fileIdx = 0; fileIdx < files.length; fileIdx++) {
        const file = files[fileIdx];
        setLoadingText(`Membaca file (${fileIdx + 1}/${files.length}): ${file.name}…`);

        let pages = [];
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          pages = await processPdfFile(file);
        } else if (file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name)) {
          pages = await processImageFile(file);
        } else {
          throw new Error(`Format file "${file.name}" tidak didukung. Harap upload PDF atau gambar.`);
        }

        newDocs.push({
          id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          type: file.type || 'application/pdf',
          pages,
          createdAt: new Date().toISOString()
        });
      }

      const updated = [...(extraDocuments || []), ...newDocs];
      if (onChange) onChange(updated);
    } catch (err) {
      console.error('Error processing file upload:', err);
      setErrorMsg(err.message || 'Gagal memproses dokumen.');
    } finally {
      setLoading(false);
      setLoadingText('');
      e.target.value = '';
    }
  };

  // Helper to convert extraDocuments structure into flat page items for easy reordering/deletion
  const getFlatPages = () => {
    const flat = [];
    (extraDocuments || []).forEach((doc, docIdx) => {
      if (Array.isArray(doc.pages)) {
        doc.pages.forEach((pageDataUrl, pageIdx) => {
          flat.push({
            docIdx,
            pageIdx,
            docName: doc.name,
            docId: doc.id || docIdx,
            docType: doc.type,
            totalPagesInDoc: doc.pages.length,
            dataUrl: pageDataUrl
          });
        });
      }
    });
    return flat;
  };

  const updateFromFlatPages = (flatPages) => {
    // Re-group flat pages back into document structure
    const docMap = new Map();
    flatPages.forEach((p) => {
      if (!docMap.has(p.docId)) {
        docMap.set(p.docId, {
          id: p.docId,
          name: p.docName,
          type: p.docType,
          pages: []
        });
      }
      docMap.get(p.docId).pages.push(p.dataUrl);
    });

    const newExtraDocs = Array.from(docMap.values()).filter(d => d.pages.length > 0);
    if (onChange) onChange(newExtraDocs);
  };

  const handleMovePage = (globalIndex, direction) => {
    const flat = getFlatPages();
    const targetIndex = globalIndex + direction;
    if (targetIndex < 0 || targetIndex >= flat.length) return;

    const temp = flat[globalIndex];
    flat[globalIndex] = flat[targetIndex];
    flat[targetIndex] = temp;

    updateFromFlatPages(flat);
  };

  const handleDeletePage = (globalIndex) => {
    const flat = getFlatPages();
    flat.splice(globalIndex, 1);
    updateFromFlatPages(flat);
  };

  const handleDeleteDoc = (docIndexToRemove) => {
    const updated = (extraDocuments || []).filter((_, idx) => idx !== docIndexToRemove);
    if (onChange) onChange(updated);
  };

  const flatPages = getFlatPages();
  const totalPages = flatPages.length;

  if (compact) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <label
          style={{
            background: loading ? '#94a3b8' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '0.85rem',
            fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)'
          }}
        >
          {loading ? '⏳ Memproses...' : `📄 + Upload Dokumen (${totalPages} Hal)`}
          <input
            type="file"
            accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
            multiple
            onChange={handleFileUpload}
            disabled={loading}
            style={{ display: 'none' }}
          />
        </label>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '10px', padding: '16px', marginTop: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800', color: '#1e293b' }}>
            📄 Dokumen Halaman Tambahan (Extra Pages)
          </h4>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>
            Upload file PDF atau Gambar. Anda dapat mengatur urutan halaman atau menghapus halaman tertentu.
          </p>
        </div>
        <label
          style={{
            background: loading ? '#94a3b8' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 14px',
            fontSize: '0.78rem',
            fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {loading ? '⏳ Memproses...' : '+ Upload Document (PDF/Image)'}
          <input
            type="file"
            accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
            multiple
            onChange={handleFileUpload}
            disabled={loading}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {loading && (
        <div style={{ padding: '10px', background: '#eff6ff', borderRadius: '6px', color: '#1d4ed8', fontSize: '0.8rem', fontWeight: '600', marginBottom: '10px' }}>
          {loadingText || 'Sedang mengunggah dan memproses halaman dokumen…'}
        </div>
      )}

      {errorMsg && (
        <div style={{ padding: '10px', background: '#fef2f2', borderRadius: '6px', color: '#dc2626', fontSize: '0.8rem', fontWeight: '600', marginBottom: '10px' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {flatPages.length > 0 ? (
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#475569', marginBottom: '8px' }}>
            Daftar Halaman ({flatPages.length} Halaman Total):
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
            {flatPages.map((page, idx) => (
              <div
                key={`flat-page-${idx}`}
                style={{
                  background: 'white',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#1e293b' }}>
                    Hal {idx + 1}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }} title={page.docName}>
                    {page.docName}
                  </span>
                </div>

                <div style={{ height: '140px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={page.dataUrl}
                    alt={`Preview Hal ${idx + 1}`}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMovePage(idx, -1)}
                      style={{
                        padding: '3px 8px',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        background: idx === 0 ? '#f1f5f9' : '#ffffff',
                        cursor: idx === 0 ? 'not-allowed' : 'pointer'
                      }}
                      title="Geser Ke Atas/Kiri"
                    >
                      ⬆️
                    </button>
                    <button
                      type="button"
                      disabled={idx === flatPages.length - 1}
                      onClick={() => handleMovePage(idx, 1)}
                      style={{
                        padding: '3px 8px',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        background: idx === flatPages.length - 1 ? '#f1f5f9' : '#ffffff',
                        cursor: idx === flatPages.length - 1 ? 'not-allowed' : 'pointer'
                      }}
                      title="Geser Ke Bawah/Kanan"
                    >
                      ⬇️
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeletePage(idx)}
                    style={{
                      padding: '3px 8px',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      border: 'none',
                      borderRadius: '4px',
                      background: '#fee2e2',
                      color: '#991b1b',
                      cursor: 'pointer'
                    }}
                    title="Hapus Halaman Ini"
                  >
                    🗑️ Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '0.8rem', fontWeight: '600' }}>
          Belum ada dokumen tambahan yang diunggah.
        </div>
      )}
    </div>
  );
};

export default ExtraDocsUploader;
