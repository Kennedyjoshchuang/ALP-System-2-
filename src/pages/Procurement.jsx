import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Trash2, Edit2, Check, X, Package, ChevronDown, ChevronUp, Truck, Search, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToExcel } from '../utils/exportUtils';
import { ButtonWithLoading } from '../components/ButtonWithLoading';

const emptyVendor = { name: '', phone: '', email: '', address: '', bankName: '', bankAccount: '', services: [{ description: '', price: '' }], assets: [''] };

const Procurement = () => {
  const { vendors: vendorsRaw, addVendor, updateVendor, deleteVendor, user, language } = useApp();
  const isID = language === 'id';
  const vendors = vendorsRaw || [];
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyVendor);
  const [expandedId, setExpandedId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isListMinimized, setIsListMinimized] = useState(false);

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

  const handleExport = () => {
    const dataToExport = vendors
      .filter(v => filterByDate(v.date))
      .filter(v => 
        (v.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (v.phone && v.phone.includes(searchTerm)) || 
        (v.id && v.id.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .map(v => ({
        Vendor_ID: v.id,
        Name: v.name,
        Phone: v.phone,
        Email: v.email,
        Address: v.address,
        Date_Registered: v.date
      }));

    if (dataToExport.length === 0) {
      alert(isID ? "Tidak ada data vendor untuk di-export pada rentang tanggal ini." : "No vendor data to export within this date range.");
      return;
    }

    exportToExcel(dataToExport, "Daftar_Vendor_Terdaftar");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanedServices = form.services.filter(s => s.description.trim());
    const cleanedAssets = form.assets.filter(a => a.trim());
    if (editingId) {
      await updateVendor(editingId, { ...form, services: cleanedServices, assets: cleanedAssets });
      setEditingId(null);
    } else {
      await addVendor({ ...form, services: cleanedServices, assets: cleanedAssets });
    }
    setForm(emptyVendor);
    setShowForm(false);
  };

  const startEdit = (v) => {
    setForm({ name: v.name, phone: v.phone || '', email: v.email || '', address: v.address || '', bankName: v.bankName || '', bankAccount: v.bankAccount || '', services: v.services.length ? v.services : [{ description: '', price: '' }], assets: v.assets.length ? v.assets : [''] });
    setEditingId(v.id);
    setShowForm(true);
    setExpandedId(null);
  };

  const addService = () => setForm(f => ({ ...f, services: [...f.services, { description: '', price: '' }] }));
  const removeService = (i) => setForm(f => ({ ...f, services: f.services.filter((_, idx) => idx !== i) }));
  const updateService = (i, field, val) => setForm(f => { const s = [...f.services]; s[i] = { ...s[i], [field]: val }; return { ...f, services: s }; });

  const addAsset = () => setForm(f => ({ ...f, assets: [...f.assets, ''] }));
  const removeAsset = (i) => setForm(f => ({ ...f, assets: f.assets.filter((_, idx) => idx !== i) }));
  const updateAsset = (i, val) => setForm(f => { const a = [...f.assets]; a[i] = val; return { ...f, assets: a }; });

  return (
    <div style={{ display: 'grid', gap: '25px' }}>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }} className="glass-card" style={{ padding: '40px', maxWidth: '440px', width: '100%', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🗑️</div>
              <h3 style={{ color: '#ef4444', marginBottom: '8px' }}>{isID ? 'Hapus Vendor?' : 'Delete Vendor?'}</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '28px' }}>
                {isID ? 'Data vendor ' : 'Vendor data for '}
                <strong style={{ color: 'var(--text)' }}>{deleteConfirm.name}</strong>
                {isID ? ' akan dihapus permanen.' : ' will be permanently deleted.'}
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text)' }} onClick={() => setDeleteConfirm(null)}>{isID ? 'Batal' : 'Cancel'}</button>
                <ButtonWithLoading className="btn" style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none' }} onClick={async () => { await deleteVendor(deleteConfirm.id); setDeleteConfirm(null); }}>{isID ? 'Hapus' : 'Delete'}</ButtonWithLoading>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 className="shimmer-text" style={{ fontSize: '1.8rem', margin: 0 }}>{isID ? 'Pengadaan & Tarif Vendor' : 'Procurement & Vendor Rates'}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>{isID ? 'Kelola daftar vendor, harga layanan, dan aset operasional.' : 'Manage vendor lists, service rates, and operational assets.'}</p>
        </div>
        <button className="btn btn-gold" onClick={() => { setForm(emptyVendor); setEditingId(null); setShowForm(!showForm); }}>
          <Plus size={18} /> {showForm && !editingId ? (isID ? 'Batal' : 'Cancel') : (isID ? 'Tambah Vendor' : 'Add Vendor')}
        </button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="glass-card" style={{ padding: '35px', overflow: 'hidden' }}>
            <h4 style={{ color: 'var(--secondary)', marginBottom: '25px' }}>{editingId ? (isID ? 'Edit Vendor' : 'Edit Vendor') : (isID ? 'Tambah Vendor Baru' : 'Add New Vendor')}</h4>
            <form onSubmit={handleSubmit}>
              {/* Basic Info */}
              <div className="grid-responsive-2" style={{ marginBottom: '25px' }}>
                {[
                  ['name', isID ? 'Nama Vendor *' : 'Vendor Name *', true, 'text'],
                  ['phone', isID ? 'No. Telepon' : 'Phone Number', false, 'text'],
                  ['email', 'Email', false, 'email'],
                  ['address', isID ? 'Alamat' : 'Address', false, 'text'],
                  ['bankName', isID ? 'Nama Bank' : 'Bank Name', false, 'text'],
                  ['bankAccount', isID ? 'Nomor Rekening' : 'Bank Account Number', false, 'text']
                ].map(([field, label, req, type]) => (
                  <div key={field} className="input-group">
                    <label>{label}</label>
                    <input required={req} type={type} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} />
                  </div>
                ))}
              </div>

              {/* Services */}
              <div style={{ marginBottom: '25px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ color: 'var(--secondary)', fontWeight: '600' }}>{isID ? 'Daftar Layanan & Harga' : 'Services & Rates List'}</label>
                  <button type="button" className="btn" style={{ padding: '5px 12px', fontSize: '0.8rem', background: 'rgba(212,175,55,0.1)', color: 'var(--secondary)', border: '1px dashed var(--secondary)' }} onClick={addService}>{isID ? '+ Tambah Layanan' : '+ Add Service'}</button>
                </div>
                <div className="grid-vendor-services desktop-only" style={{ marginBottom: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '4px' }}>
                  <div/><div>{isID ? 'Deskripsi Pekerjaan' : 'Job Description'}</div><div>{isID ? 'Harga (IDR)' : 'Rate (IDR)'}</div><div/>
                </div>
                {form.services.map((s, i) => (
                  <div key={i} className="grid-vendor-services" style={{ marginBottom: '10px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--secondary)' }} />
                    <input required type="text" value={s.description} onChange={e => updateService(i, 'description', e.target.value)} placeholder={isID ? "Contoh: Trucking 20ft Tanjung Priok" : "Example: Trucking 20ft Tanjung Priok"} style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', padding: '9px 12px' }} />
                    <input required type="number" value={s.price} onChange={e => updateService(i, 'price', e.target.value)} placeholder={isID ? "Harga" : "Price"} style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', padding: '9px 12px' }} />
                    <button type="button" onClick={() => removeService(i)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
                  </div>
                ))}
              </div>

              {/* Assets */}
              <div style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ color: 'var(--secondary)', fontWeight: '600' }}>{isID ? 'Aset Operasional' : 'Operational Assets'}</label>
                  <button type="button" className="btn" style={{ padding: '5px 12px', fontSize: '0.8rem', background: 'rgba(212,175,55,0.1)', color: 'var(--secondary)', border: '1px dashed var(--secondary)' }} onClick={addAsset}>{isID ? '+ Tambah Aset' : '+ Add Asset'}</button>
                </div>
                {form.assets.map((a, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 40px', gap: '8px', marginBottom: '10px' }}>
                    <input type="text" value={a} onChange={e => updateAsset(i, e.target.value)} placeholder={isID ? "Contoh: Truk Fuso B 1234 ABC" : "Example: Fuso Truck B 1234 ABC"} style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', padding: '9px 12px' }} />
                    <button type="button" onClick={() => removeAsset(i)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text)' }} onClick={() => { setShowForm(false); setEditingId(null); }}>{isID ? 'Batal' : 'Cancel'}</button>
                <ButtonWithLoading type="submit" className="btn btn-gold" style={{ flex: 2 }} onClick={handleSubmit}><Check size={16} /> {editingId ? (isID ? 'Simpan Perubahan' : 'Save Changes') : (isID ? 'Daftarkan Vendor' : 'Register Vendor')}</ButtonWithLoading>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid-responsive-3">
        {[
          { label: isID ? 'Total Vendor' : 'Total Vendors', value: vendors.length, color: '#d4af37', icon: '🏢' },
          { label: isID ? 'Total Layanan' : 'Total Services', value: vendors.reduce((s, v) => s + (v.services?.length || 0), 0), color: '#10b981', icon: '📋' },
          { label: isID ? 'Total Aset' : 'Total Assets', value: vendors.reduce((s, v) => s + (v.assets?.filter(a=>a).length || 0), 0), color: '#3b82f6', icon: '🚛' },
        ].map(stat => (
          <div key={stat.label} className="glass-card" style={{ padding: '25px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ fontSize: '2rem' }}>{stat.icon}</div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Vendor List */}
      <div className="glass-card" style={{ padding: '25px' }}>
        <h4 style={{ marginBottom: isListMinimized ? '0' : '20px', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Truck size={20} style={{ color: 'var(--secondary)' }} /> {isID ? 'Daftar Vendor Terdaftar' : 'Registered Vendor List'}
          </div>
          <button 
            onClick={() => setIsListMinimized(!isListMinimized)} 
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--secondary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            {isListMinimized ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            {isListMinimized ? 'Expand' : (isID ? 'Kecilkan' : 'Minimize')}
          </button>
        </h4>

        <AnimatePresence>
          {!isListMinimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden' }}
            >

        {/* Filter Bar */}
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <input type="text" placeholder={isID ? "Cari nama, ID, atau telp..." : "Search name, ID, or phone..."} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '8px 12px 8px 35px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.85rem' }} />
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '7px 10px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.8rem' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>-</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '7px 10px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.8rem' }} />
          </div>
          {(startDate || endDate || searchTerm) && (
            <button onClick={() => { setStartDate(''); setEndDate(''); setSearchTerm(''); }} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600' }}>Reset</button>
          )}
          <div style={{ marginLeft: 'auto' }}>
            <button className="btn btn-gold" onClick={handleExport} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
              <FileSpreadsheet size={18} /> Export Excel
            </button>
          </div>
        </div>

        {vendors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <Package size={48} style={{ opacity: 0.2, display: 'block', margin: '0 auto 15px' }} />
            <p style={{ fontWeight: '600', marginBottom: '6px' }}>{isID ? 'Belum ada vendor' : 'No vendors registered'}</p>
            <p style={{ fontSize: '0.85rem' }}>{isID ? 'Klik "Tambah Vendor" untuk mendaftarkan vendor pertama.' : 'Click "Add Vendor" to register your first vendor.'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {vendors
              .filter(v => filterByDate(v.date))
              .filter(v => 
                v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                (v.phone && v.phone.includes(searchTerm)) || 
                (v.id && v.id.toLowerCase().includes(searchTerm.toLowerCase()))
              )
              .map(v => (
              <motion.div key={v.id} layout className="glass-card" style={{ padding: '20px 25px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                {/* Vendor Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={() => setExpandedId(expandedId === v.id ? null : v.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--secondary)', display: 'flex' }}>
                      {expandedId === v.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '1rem' }}>{v.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.id} · {v.phone || (isID ? 'Tidak ada telp' : 'No Phone')} · {v.services?.length || 0} {isID ? 'layanan' : 'services'} · {v.assets?.filter(a=>a).length || 0} {isID ? 'aset' : 'assets'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-icon" onClick={() => startEdit(v)} title="Edit"><Edit2 size={15} /></button>
                    {user?.role === 'owner' && (
                      <button className="btn-icon" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }} onClick={() => setDeleteConfirm(v)} title={isID ? 'Hapus' : 'Delete'}><Trash2 size={15} /></button>
                    )}
                  </div>
                </div>

                {/* Expanded Detail */}
                <AnimatePresence>
                  {expandedId === v.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                      <div className="grid-responsive-2" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--glass-border)' }}>
                        {/* Services Table */}
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>{isID ? '📋 Layanan & Harga' : '📋 Services & Rates'}</div>
                          {v.services?.length > 0 ? (
                            <div className="table-container"><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                  <th style={{ padding: '8px 0', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '500' }}>{isID ? 'Deskripsi' : 'Description'}</th>
                                  <th style={{ padding: '8px 0', textAlign: 'right', color: 'var(--text-muted)', fontWeight: '500' }}>{isID ? 'Harga' : 'Price'}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {v.services.map((s, i) => (
                                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <td style={{ padding: '8px 0', color: 'var(--text)' }}>{s.description}</td>
                                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '700', color: 'var(--secondary)' }}>Rp {parseFloat(s.price || 0).toLocaleString('id-ID')}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table></div>
                          ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{isID ? 'Tidak ada layanan.' : 'No services registered.'}</p>}
                        </div>
                        {/* Assets */}
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>{isID ? '🚛 Aset Operasional' : '🚛 Operational Assets'}</div>
                          {v.assets?.filter(a => a).length > 0 ? (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                              {v.assets.filter(a => a).map((a, i) => (
                                <li key={i} style={{ padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ color: '#3b82f6', fontSize: '0.6rem' }}>●</span> {a}
                                </li>
                              ))}
                            </ul>
                          ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{isID ? 'Tidak ada aset.' : 'No assets registered.'}</p>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '20px', marginTop: '15px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                        {v.bankName && (
                          <div style={{ fontSize: '0.8rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>{isID ? 'Bank: ' : 'Bank: '}</span>
                            <span style={{ fontWeight: '700', color: 'var(--secondary)' }}>{v.bankName}</span>
                          </div>
                        )}
                        {v.bankAccount && (
                          <div style={{ fontSize: '0.8rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>{isID ? 'No. Rek: ' : 'Bank Account: '}</span>
                            <span style={{ fontWeight: '700', color: 'var(--secondary)' }}>{v.bankAccount}</span>
                          </div>
                        )}
                        {v.address && (
                          <div style={{ fontSize: '0.8rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>📍 </span>
                            <span>{v.address}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Procurement;

