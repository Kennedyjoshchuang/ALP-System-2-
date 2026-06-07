import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Truck, Camera, CheckCircle2, Package, History, PlayCircle, X, Search, FileSpreadsheet, Plus, FileText, Printer, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToExcel } from '../utils/exportUtils';
import { ButtonWithLoading } from '../components/ButtonWithLoading';

const toDatetimeLocal = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
};

const toISOString = (datetimeLocalString) => {
  if (!datetimeLocalString) return null;
  const date = new Date(datetimeLocalString);
  return isNaN(date.getTime()) ? null : date.toISOString();
};

const formatDuration = (dispatchedAt, completedAt, t, language) => {
  if (!dispatchedAt) return '-';
  const start = new Date(dispatchedAt);
  const end = completedAt ? new Date(completedAt) : new Date();
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return '-';
  
  const diffMs = end - start;
  if (diffMs < 0) return '0m';
  
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  const isID = language === 'id';
  
  if (diffDays > 0) {
    const remainingHours = diffHours % 24;
    return isID 
      ? `${diffDays} hari ${remainingHours} jam` 
      : `${diffDays}d ${remainingHours}h`;
  }
  if (diffHours > 0) {
    const remainingMins = diffMins % 60;
    return isID 
      ? `${diffHours} jam ${remainingMins} menit` 
      : `${diffHours}h ${remainingMins}m`;
  }
  return isID ? `${diffMins} menit` : `${diffMins}m`;
};

const Executor = () => {
  const { jobOrders, updateJOStatus, completeJO, deleteJO, t, language } = useApp();
  const isID = language === 'id';
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'records'
  const fileInputRef = useRef(null);
  const [uploadingForId, setUploadingForId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [joToDelete, setJoToDelete] = useState(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [localData, setLocalData] = useState({}); // { [joId]: { containerNo: [], vehicleNo: [], driverName: [], activityStatus: '' } }

  const [tick, setTick] = useState(0);
  React.useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const filterByDate = (itemDate) => {
    if (!itemDate) return true;
    const date = new Date(itemDate);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (start && date < start) return false;
    if (end) {
      const endOfDay = new Date(end);
      endOfDay.setHours(23, 59, 59, 999);
      if (date > endOfDay) return false;
    }
    return true;
  };

  const filteredJOs = jobOrders.filter(jo => {
    const tabMatch = activeTab === 'active' ? jo.status === 'dispatched' : jo.status === 'done';
    const searchMatch = (jo.id || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                      (jo.customerName || '').toLowerCase().includes(searchTerm.toLowerCase());
    return tabMatch && searchMatch && filterByDate(jo.date);
  });

  const handleExport = () => {
    const dataToExport = filteredJOs.map(jo => ({
      JO_ID: jo.id,
      Date: jo.date,
      Customer: jo.customerName,
      Instruction: jo.jobDescription,
      Container: jo.containerNo || '-',
      Vehicle: jo.vehicleNo || '-',
      Final_Status: jo.activityStatus || '-',
      Status: jo.status
    }));

    if (dataToExport.length === 0) {
      alert(isID ? "Tidak ada data operasional untuk di-export pada rentang tanggal ini." : "No operational data to export for this date range.");
      return;
    }

    const fileName = activeTab === 'active' ? "Field_Operations_Aktif" : "Field_Operations_Records";
    exportToExcel(dataToExport, fileName);
  };

  const handleLocalUpdate = (joId, field, value) => {
    setLocalData(prev => ({
      ...prev,
      [joId]: {
        ...(prev[joId] || {}),
        [field]: value
      }
    }));
  };

  const handleLocalListItemUpdate = (joId, field, index, value) => {
    setLocalData(prev => {
      const current = prev[joId]?.[field] || [];
      const updated = [...current];
      updated[index] = value;
      return {
        ...prev,
        [joId]: {
          ...(prev[joId] || {}),
          [field]: updated
        }
      };
    });
  };

  const addLocalListItem = (joId, field) => {
    setLocalData(prev => {
      const current = prev[joId]?.[field] || [''];
      return {
        ...prev,
        [joId]: {
          ...(prev[joId] || {}),
          [field]: [...current, '']
        }
      };
    });
  };

  const removeLocalListItem = (joId, field, index) => {
    setLocalData(prev => {
      const current = prev[joId]?.[field] || [];
      const updated = current.filter((_, i) => i !== index);
      return {
        ...prev,
        [joId]: {
          ...(prev[joId] || {}),
          [field]: updated
        }
      };
    });
  };

  const toggleRow = (jo) => {
    if (uploadingForId === jo.id) {
      setUploadingForId(null);
    } else {
      setUploadingForId(jo.id);
      // Initialize local data from current JO state
      setLocalData(prev => ({
        ...prev,
        [jo.id]: {
          containerNo: Array.isArray(jo.containerNo) && jo.containerNo.length > 0 ? [...jo.containerNo] : [jo.containerNo || ''],
          vehicleNo: Array.isArray(jo.vehicleNo) && jo.vehicleNo.length > 0 ? [...jo.vehicleNo] : [jo.vehicleNo || ''],
          driverName: Array.isArray(jo.driverName) && jo.driverName.length > 0 ? [...jo.driverName] : [jo.driverName || ''],
          activityStatus: jo.activityStatus || '',
          dispatchedAtLocal: toDatetimeLocal(jo.dispatchedAt),
          completedAtLocal: toDatetimeLocal(jo.completedAt)
        }
      }));
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = e.target.files;
    if (!files || !uploadingForId) return;

    const jo = jobOrders.find(j => j.id === uploadingForId);
    if (!jo) return;

    const currentPhotos = Array.isArray(jo.photos) ? jo.photos : [];
    
    // Use Promise.all to read all files in parallel before uploading
    const readFilesPromises = Array.from(files).map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
    });

    try {
      const newPhotoUrls = await Promise.all(readFilesPromises);
      // Update database once with all new photos
      await updateJOStatus(uploadingForId, { photos: [...currentPhotos, ...newPhotoUrls] });
    } catch (err) {
      console.error("Photo upload error:", err);
      alert(isID ? "Gagal mengunggah foto. Pastikan ukuran file tidak terlalu besar." : "Failed to upload photo. Make sure the file size is not too large.");
    } finally {
      // Reset input value to allow re-uploading same files if needed
      e.target.value = '';
    }
  };

  const removePhoto = (joId, photoIndex) => {
    const jo = jobOrders.find(j => j.id === joId);
    const newPhotos = jo.photos.filter((_, i) => i !== photoIndex);
    updateJOStatus(joId, { photos: newPhotos });
  };

  const handleDone = async (jo) => {
    const rawData = localData[jo.id] || {
      containerNo: jo.containerNo,
      vehicleNo: jo.vehicleNo,
      driverName: jo.driverName,
      activityStatus: jo.activityStatus,
      dispatchedAtLocal: toDatetimeLocal(jo.dispatchedAt),
      completedAtLocal: toDatetimeLocal(jo.completedAt)
    };
    
    const data = { ...rawData };
    data.dispatchedAt = toISOString(data.dispatchedAtLocal);
    data.completedAt = toISOString(data.completedAtLocal);
    delete data.dispatchedAtLocal;
    delete data.completedAtLocal;
    
    // Basic validation for required fields
    const hasContainer = Array.isArray(data.containerNo) ? data.containerNo.some(c => c && c.trim()) : (data.containerNo && data.containerNo.trim());
    const hasVehicle = Array.isArray(data.vehicleNo) ? data.vehicleNo.some(v => v && v.trim()) : (data.vehicleNo && data.vehicleNo.trim());
    const hasDriver = Array.isArray(data.driverName) ? data.driverName.some(d => d && d.trim()) : (data.driverName && data.driverName.trim());

    if (!hasContainer || !hasVehicle || !hasDriver || !data.activityStatus) {
      alert(isID ? 'Semua data wajib diisi: Container, Vehicle, Driver, dan Activity Status!' : 'All fields are required: Container, Vehicle, Driver, and Activity Status!');
      return;
    }

    // Sync to server before completing
    await updateJOStatus(jo.id, data);
    await completeJO(jo.id);
    alert(isID ? `Job ${jo.id} selesai dan dipindahkan ke Records!` : `Job ${jo.id} completed and moved to Records!`);
    setUploadingForId(null);
  };

  const handleSaveChanges = async (jo) => {
    const rawData = localData[jo.id] || {
      containerNo: jo.containerNo,
      vehicleNo: jo.vehicleNo,
      driverName: jo.driverName,
      activityStatus: jo.activityStatus,
      dispatchedAtLocal: toDatetimeLocal(jo.dispatchedAt),
      completedAtLocal: toDatetimeLocal(jo.completedAt)
    };
    
    const data = { ...rawData };
    data.dispatchedAt = toISOString(data.dispatchedAtLocal);
    data.completedAt = toISOString(data.completedAtLocal);
    delete data.dispatchedAtLocal;
    delete data.completedAtLocal;

    try {
      await updateJOStatus(jo.id, data);
      alert(isID ? 'Perubahan berhasil disimpan!' : 'Changes saved successfully!');
    } catch (err) {
      console.error(err);
      alert(isID ? 'Gagal menyimpan perubahan.' : 'Failed to save changes.');
    }
  };

  return (
    <div className="executor-container" style={{ display: 'grid', gap: '30px' }}>
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        multiple 
        accept="image/*" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handlePhotoUpload} 
      />

      {/* Delete JO Verification Modal */}
      <AnimatePresence>
        {joToDelete && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
              zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
            }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
              className="glass-card"
              style={{ padding: '40px', maxWidth: '480px', width: '100%', textAlign: 'center' }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🗑️</div>
              <h3 style={{ color: '#ef4444', marginBottom: '8px' }}>{isID ? 'Hapus Job Order?' : 'Delete Job Order?'}</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '6px' }}>
                <strong style={{ color: 'var(--text)' }}>{joToDelete.id}</strong> — {joToDelete.customerName}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                {isID ? 'Data JO ini akan dihapus secara permanen dan tidak dapat dikembalikan.' : 'This JO data will be permanently deleted and cannot be recovered.'}
              </p>
              <div className="input-group" style={{ textAlign: 'left', marginBottom: '8px' }}>
                <label style={{ color: 'var(--secondary)', fontWeight: '700' }}>
                  {isID ? 'Ketik ' : 'Type '}<strong style={{ color: '#ef4444' }}>{joToDelete.id}</strong> {isID ? 'untuk konfirmasi:' : 'to confirm:'}
                </label>
                <input
                  type="text"
                  value={verifyCode}
                  onChange={e => { setVerifyCode(e.target.value); setVerifyError(''); }}
                  placeholder={isID ? `Ketik ${joToDelete.id} di sini...` : `Type ${joToDelete.id} here...`}
                  style={{ background: 'var(--input-bg)', border: `1px solid ${verifyError ? '#ef4444' : 'var(--border)'}`, borderRadius: '10px', color: 'var(--text)', padding: '12px', width: '100%' }}
                />
                {verifyError && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{verifyError}</p>}
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  className="btn"
                  style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'var(--text)', border: '1px solid var(--border)' }}
                  onClick={() => { setJoToDelete(null); setVerifyCode(''); setVerifyError(''); }}
                  disabled={isDeleting}
                >
                  {isID ? 'Batal' : 'Cancel'}
                </button>
                <ButtonWithLoading
                  className="btn"
                  style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none' }}
                  onClick={async () => {
                    if (verifyCode !== joToDelete.id) {
                      setVerifyError(isID ? 'Kode verifikasi tidak sesuai!' : 'Verification code does not match!');
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      await deleteJO(joToDelete.id);
                      setJoToDelete(null);
                      setVerifyCode('');
                    } catch (err) {
                      setVerifyError(isID ? 'Gagal menghapus, coba lagi.' : 'Failed to delete, try again.');
                    }
                    setIsDeleting(false);
                  }}
                >
                  {isID ? 'Ya, Hapus' : 'Yes, Delete'}
                </ButtonWithLoading>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
        <div>
          <h3 className="shimmer-text" style={{ fontSize: '1.8rem', margin: 0 }}>{isID ? 'Operasi Lapangan' : 'Field Operations'}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{isID ? 'Eksekusi pekerjaan real-time dan pelacakan status.' : 'Real-time job execution and status tracking.'}</p>
        </div>
        
        <div style={{ display: 'flex', gap: '20px' }}>
          <button 
            onClick={() => setActiveTab('active')}
            style={{
              background: 'none', border: 'none', padding: '10px 0',
              color: activeTab === 'active' ? 'var(--secondary)' : 'var(--text-muted)',
              fontSize: '1rem', fontWeight: '600', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <PlayCircle size={18} />
            {isID ? 'Pekerjaan Aktif' : 'Active Jobs'}
            {activeTab === 'active' && <motion.div layoutId="execTab" style={{ position: 'absolute', bottom: -1, left: 0, right: 0, background: 'var(--secondary)', height: '2px' }} />}
          </button>
          <button 
            onClick={() => setActiveTab('records')}
            style={{
              background: 'none', border: 'none', padding: '10px 0',
              color: activeTab === 'records' ? 'var(--secondary)' : 'var(--text-muted)',
              fontSize: '1rem', fontWeight: '600', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <History size={18} />
            {isID ? 'Catatan JO' : 'JO Records'}
            {activeTab === 'records' && <motion.div layoutId="execTab" style={{ position: 'absolute', bottom: -1, left: 0, right: 0, background: 'var(--secondary)', height: '2px' }} />}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '20px 25px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', background: 'rgba(255,255,255,0.03)' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
          <input type="text" placeholder={isID ? "Cari Pekerjaan atau Pelanggan..." : "Search Jobs or Customers..."} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '10px 15px 10px 40px', borderRadius: '10px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>{isID ? 'Filter Tanggal:' : 'Date Filter:'}</span>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.85rem' }} />
          <span style={{ color: 'var(--text-muted)' }}>{isID ? 's/d' : 'to'}</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.85rem' }} />
          {(startDate || endDate || searchTerm) && (
            <button onClick={() => { setStartDate(''); setEndDate(''); setSearchTerm(''); }} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600' }}>{isID ? 'Atur Ulang' : 'Reset'}</button>
          )}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-gold" onClick={handleExport} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <FileSpreadsheet size={18} /> {isID ? 'Ekspor Excel' : 'Export Excel'}
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '25px', overflowX: 'auto' }}>
        <div className="table-container"><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--secondary)' }}>
              <th style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>JO ID</th>
              <th style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>{isID ? 'Pelanggan' : 'Customer'}</th>
              <th style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>{isID ? 'Instruksi' : 'Instruction'}</th>
              <th style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>{isID ? 'Kontainer & Unit' : 'Container & Unit'}</th>
              <th style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>{isID ? 'Durasi Pengiriman' : 'Dispatched Duration'}</th>
              <th style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>{isID ? 'Status Operasional' : 'Operational Status'}</th>
              <th style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'center' }}>{isID ? 'Dokumentasi' : 'Documentation'}</th>
              <th style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'center' }}>{isID ? 'Aksi' : 'Action'}</th>
            </tr>
          </thead>
          <tbody>
            {filteredJOs.map(jo => (
              <React.Fragment key={jo.id}>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', cursor: 'pointer' }} className="table-row-hover" onClick={() => toggleRow(jo)}>
                  <td style={{ padding: '15px', fontWeight: '800', color: 'var(--secondary)' }}>{jo.id}</td>
                  <td style={{ padding: '15px' }}>
                    <div style={{ fontWeight: '600' }}>{jo.customerName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{isID ? 'Jumlah:' : 'Qty:'} {jo.quantity}</div>
                  </td>
                  <td style={{ padding: '15px', fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {jo.jobDescription}
                  </td>
                  <td style={{ padding: '15px' }}>
                    <div style={{ fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{isID ? 'K:' : 'C:'}</span> {Array.isArray(jo.containerNo) ? jo.containerNo.join(', ') : jo.containerNo || '-'}
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{isID ? 'Knd:' : 'V:'}</span> {Array.isArray(jo.vehicleNo) ? jo.vehicleNo.join(', ') : jo.vehicleNo || '-'}
                    </div>
                  </td>
                  <td style={{ padding: '15px', fontSize: '0.9rem', fontWeight: '500' }}>
                    {formatDuration(jo.dispatchedAt, jo.completedAt, t, language)}
                  </td>
                  <td style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeTab === 'active' ? '#f59e0b' : '#10b981' }} />
                      <span style={{ fontWeight: '600', color: activeTab === 'active' ? '#f59e0b' : '#10b981', fontSize: '0.9rem' }}>
                        {jo.activityStatus || (activeTab === 'active' ? (isID ? 'Menunggu Pembaruan...' : 'Pending Update...') : (isID ? 'Selesai' : 'Done'))}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', color: 'var(--text-muted)' }}>
                      <Camera size={16} />
                      <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{jo.photos?.length || 0}</span>
                    </div>
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      {activeTab === 'active' ? (
                        <ButtonWithLoading 
                          className="btn btn-gold" 
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          onClick={(e) => { e.stopPropagation(); return handleDone(jo); }}
                        >
                          {isID ? 'Selesai' : 'Done'}
                        </ButtonWithLoading>
                      ) : (
                        <span className="badge badge-done" style={{ fontSize: '0.7rem' }}>{isID ? 'Diarsipkan' : 'Archived'}</span>
                      )}
                      <button 
                        className="btn-icon" 
                        style={{ width: '38px', height: '38px', color: 'var(--secondary)', background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.3)' }}
                        onClick={(e) => { e.stopPropagation(); navigate(`/executor/surat-jalan/${jo.id}`); }}
                        title={isID ? "Lihat Surat Jalan" : "View Delivery Order"}
                      >
                        <FileText size={20} />
                      </button>
                      <button 
                        className="btn-icon" 
                        style={{ width: '38px', height: '38px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                        onClick={(e) => { e.stopPropagation(); navigate(`/executor/surat-jalan/${jo.id}?print=true`); }}
                        title={isID ? "Cetak Surat Jalan" : "Print Delivery Order"}
                      >
                        <Printer size={20} />
                      </button>
                      {activeTab === 'records' && (
                        <button 
                          className="btn-icon" 
                          style={{ width: '38px', height: '38px', color: 'var(--gold-metallic)', background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.3)' }}
                          onClick={(e) => { e.stopPropagation(); toggleRow(jo); }}
                          title={isID ? "Ubah Catatan Data" : "Edit Records Data"}
                        >
                          <FileText size={20} />
                        </button>
                      )}
                      {activeTab === 'records' && (
                        <button
                          className="btn-icon"
                          style={{ width: '38px', height: '38px', color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
                          onClick={(e) => { e.stopPropagation(); setJoToDelete(jo); setVerifyCode(''); setVerifyError(''); }}
                          title={isID ? "Hapus Catatan JO" : "Delete JO Record"}
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                
                {/* Expandable Row for Editing (only for active or when clicked) */}
                <AnimatePresence>
                  {uploadingForId === jo.id && (
                    <tr>
                      <td colSpan="8" style={{ padding: 0 }}>
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: 'auto', opacity: 1 }} 
                          exit={{ height: 0, opacity: 0 }} 
                          style={{ overflow: 'hidden', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--secondary)' }}
                        >
                          <div className="grid-responsive-2" style={{ padding: '25px' }}>
                            <div style={{ display: 'grid', gap: '20px' }}>
                              <div className="grid-responsive-3">
                                {/* Multi Container */}
                                <div className="input-group">
                                  <label>{isID ? 'Nomor Kontainer' : 'Container Number'} <span style={{ color: '#ef4444' }}>*</span></label>
                                  {(localData[jo.id]?.containerNo || []).map((c, i, arr) => (
                                    <div key={i} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                                      <input type="text" value={c} onChange={e => handleLocalListItemUpdate(jo.id, 'containerNo', i, e.target.value)} placeholder="CONT-123456" />
                                      {arr.length > 1 && (
                                        <button className="btn-icon" onClick={() => removeLocalListItem(jo.id, 'containerNo', i)} style={{ padding: '5px', height: 'auto', opacity: 0.5 }} title={isID ? "Hapus" : "Delete"}>
                                          <X size={12} />
                                        </button>
                                      )}
                                      <button className="btn-icon" onClick={() => addLocalListItem(jo.id, 'containerNo')} style={{ padding: '5px', height: 'auto', color: '#10b981', background: 'rgba(16,185,129,0.1)' }} title={isID ? "Tambah Kontainer" : "Add Container"}>
                                        <Plus size={12} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                                
                                {/* Multi Vehicle */}
                                <div className="input-group">
                                  <label>{isID ? 'Nomor Kendaraan' : 'Vehicle Number'} <span style={{ color: '#ef4444' }}>*</span></label>
                                  {(localData[jo.id]?.vehicleNo || []).map((v, i, arr) => (
                                    <div key={i} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                                      <input type="text" value={v} onChange={e => handleLocalListItemUpdate(jo.id, 'vehicleNo', i, e.target.value)} placeholder="B 1234 ABC" />
                                      {arr.length > 1 && (
                                        <button className="btn-icon" onClick={() => removeLocalListItem(jo.id, 'vehicleNo', i)} style={{ padding: '5px', height: 'auto', opacity: 0.5 }} title={isID ? "Hapus" : "Delete"}>
                                          <X size={12} />
                                        </button>
                                      )}
                                      <button className="btn-icon" onClick={() => addLocalListItem(jo.id, 'vehicleNo')} style={{ padding: '5px', height: 'auto', color: '#10b981', background: 'rgba(16,185,129,0.1)' }} title={isID ? "Tambah Kendaraan" : "Add Vehicle"}>
                                        <Plus size={12} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
 
                                {/* Multi Driver */}
                                <div className="input-group">
                                  <label>{isID ? 'Nama Sopir' : 'Driver Name'} <span style={{ color: '#ef4444' }}>*</span></label>
                                  {(localData[jo.id]?.driverName || []).map((d, i, arr) => (
                                    <div key={i} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                                      <input type="text" value={d} onChange={e => handleLocalListItemUpdate(jo.id, 'driverName', i, e.target.value)} placeholder={isID ? "Nama Sopir" : "Driver Name"} />
                                      {arr.length > 1 && (
                                        <button className="btn-icon" onClick={() => removeLocalListItem(jo.id, 'driverName', i)} style={{ padding: '5px', height: 'auto', opacity: 0.5 }} title={isID ? "Hapus" : "Delete"}>
                                          <X size={12} />
                                        </button>
                                      )}
                                      <button className="btn-icon" onClick={() => addLocalListItem(jo.id, 'driverName')} style={{ padding: '5px', height: 'auto', color: '#10b981', background: 'rgba(16,185,129,0.1)' }} title={isID ? "Tambah Sopir" : "Add Driver"}>
                                        <Plus size={12} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="input-group">
                                <label>{isID ? 'Status Aktivitas' : 'Activity Status'} <span style={{ color: '#ef4444' }}>*</span></label>
                                <input 
                                  type="text" 
                                  value={localData[jo.id]?.activityStatus || ''} 
                                  onChange={e => handleLocalUpdate(jo.id, 'activityStatus', e.target.value)} 
                                  placeholder={isID ? "Perbarui status operasional terakhir..." : "Update last operational status..."} 
                                />
                              </div>

                              {/* Date Pickers Grid */}
                              <div className="grid-responsive-2">
                                <div className="input-group">
                                  <label>{isID ? 'Waktu Pengiriman (Dispatched)' : 'Dispatched Date & Time'}</label>
                                  <input 
                                    type="datetime-local" 
                                    value={localData[jo.id]?.dispatchedAtLocal || ''} 
                                    onChange={e => handleLocalUpdate(jo.id, 'dispatchedAtLocal', e.target.value)}
                                    style={{
                                      background: 'var(--input-bg)',
                                      border: '1px solid var(--border)',
                                      borderRadius: '10px',
                                      color: 'var(--text)',
                                      padding: '12px',
                                      width: '100%'
                                    }}
                                  />
                                </div>
                                {activeTab === 'records' && (
                                  <div className="input-group">
                                    <label>{isID ? 'Waktu Selesai (Completed)' : 'Completed Date & Time'}</label>
                                    <input 
                                      type="datetime-local" 
                                      value={localData[jo.id]?.completedAtLocal || ''} 
                                      onChange={e => handleLocalUpdate(jo.id, 'completedAtLocal', e.target.value)}
                                      style={{
                                        background: 'var(--input-bg)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '10px',
                                        color: 'var(--text)',
                                        padding: '12px',
                                        width: '100%'
                                      }}
                                    />
                                  </div>
                                )}
                              </div>

                              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '8px' }}>
                                <strong style={{ color: 'var(--text)' }}>{isID ? 'Instruksi Lengkap:' : 'Full Instruction:'}</strong> {jo.jobDescription}
                              </div>

                              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                                <ButtonWithLoading
                                  className="btn btn-gold"
                                  style={{ padding: '10px 20px', fontSize: '0.85rem' }}
                                  onClick={() => handleSaveChanges(jo)}
                                >
                                  {isID ? 'Simpan Perubahan' : 'Save Changes'}
                                </ButtonWithLoading>
                                {activeTab === 'active' && (
                                  <ButtonWithLoading
                                    className="btn btn-done"
                                    style={{ padding: '10px 20px', fontSize: '0.85rem', background: '#10b981', color: 'white', border: 'none' }}
                                    onClick={() => handleDone(jo)}
                                  >
                                    {isID ? 'Selesaikan Pekerjaan' : 'Complete Job'}
                                  </ButtonWithLoading>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.85rem', fontWeight: '600' }}>{isID ? 'Dokumentasi Lapangan' : 'Field Documentation'}</label>
                              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
                                {jo.photos?.map((photo, idx) => (
                                  <div key={idx} style={{ position: 'relative', width: '70px', height: '70px' }}>
                                    <img src={photo} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }} />
                                    {activeTab === 'active' && (
                                      <button onClick={() => removePhoto(jo.id, idx)} style={{ position: 'absolute', top: -5, right: -5, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', fontSize: '10px' }}>×</button>
                                    )}
                                  </div>
                                ))}
                                {activeTab === 'active' && (
                                  <div 
                                    onClick={() => fileInputRef.current.click()}
                                    style={{ width: '70px', height: '70px', border: '2px dashed var(--glass-border)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
                                  >
                                    <Plus size={20} />
                                  </div>
                                )}
                              </div>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{isID ? 'Klik tombol "+" untuk mengunggah foto bukti operasional.' : 'Click the "+" button to upload operational proof photo.'}</p>
                            </div>
                          </div>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </React.Fragment>
            ))}
          </tbody>
        </table></div>

        {/* Surat Jalan Modal */}
        {filteredJOs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '100px 20px' }}>
            <Package size={64} color="rgba(255,255,255,0.05)" style={{ marginBottom: '20px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
              {activeTab === 'active' ? (isID ? 'Tidak ada operasi aktif yang ditugaskan.' : 'No active operations assigned.') : (isID ? 'Tidak ada catatan selesai yang ditemukan.' : 'No completed records found.')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Executor;

