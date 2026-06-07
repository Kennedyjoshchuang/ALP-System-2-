import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Send, CheckCircle, Plus, X, FileText, ShoppingCart, Trash2, FileCheck, Search, FileSpreadsheet, ChevronDown, ChevronUp, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToExcel } from '../utils/exportUtils';
import { ButtonWithLoading } from '../components/ButtonWithLoading';

const AdminHub = () => {
  const context = useApp();
  
  const [quantities, setQuantities] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState('');
  const [selectedActivityIndex, setSelectedActivityIndex] = useState(0);
  const [issueQuantity, setIssueQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [poSearchTerm, setPoSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showPOModal, setShowPOModal] = useState(false);
  const [poJoId, setPoJoId] = useState('');
  const [poVendorId, setPoVendorId] = useState('');
  const [poItems, setPoItems] = useState([{ serviceIdx: '', qty: 1 }]);
  const [poJoSearch, setPoJoSearch] = useState('');
  const [poVendorSearch, setPoVendorSearch] = useState('');
  const [quoteSearchTerm, setQuoteSearchTerm] = useState('');

  const [isPOListMinimized, setIsPOListMinimized] = useState(false);
  const [deleteJOConfirm, setDeleteJOConfirm] = useState(null);
  const [deletePOConfirm, setDeletePOConfirm] = useState(null);
  const [editingPOId, setEditingPOId] = useState(null);
  const [printPO, setPrintPO] = useState(null);
  const [poNotes, setPoNotes] = useState('');

  if (!context) return null;
  const { quotations = [], jobOrders = [], createJO, dispatchJO, vendors = [], purchaseOrders = [], createPurchaseOrder, updatePurchaseOrder, issuePurchaseOrder, deletePurchaseOrder, user, t, loading, language } = context;
  const isID = language === 'id';
  
  if (loading) {
    return <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--secondary)' }}>{isID ? 'Memuat Dasbor Admin...' : 'Loading Admin Hub...'}</div>;
  }

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

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const vendorList = vendors || [];
  const issuedJOs = jobOrders.filter(jo => jo.status === 'dispatched' || jo.status === 'done');
  const poVendor = vendorList.find(v => v.id === poVendorId);

  const addPOItem = () => setPoItems(p => [...p, { serviceIdx: '', qty: 1 }]);
  const removePOItem = (i) => setPoItems(p => p.filter((_, idx) => idx !== i));
  const updatePOItem = (i, field, val) => setPoItems(p => { const n=[...p]; n[i]={...n[i],[field]:val}; return n; });

  const handleExport = () => {
    let dataToExport = [];
    let fileName = "";

    // For JOs for Dispatch (Pending)
    const filteredPendingJOs = jobOrders
      .filter(jo => jo.status === 'pending')
      .filter(jo => filterByDate(jo.date))
      .filter(jo => {
        const id = jo.id || '';
        const name = jo.customerName || '';
        const term = searchTerm.toLowerCase();
        return id.toLowerCase().includes(term) || name.toLowerCase().includes(term);
      });

    // For Purchase Orders
    const filteredPOs = (purchaseOrders || [])
      .filter(po => filterByDate(po.date))
      .filter(po => {
        const id = po.id || '';
        const joId = po.joId || '';
        const vendorName = po.vendorName || '';
        const customerName = po.customerName || '';
        const term = poSearchTerm.toLowerCase();
        return id.toLowerCase().includes(term) ||
               joId.toLowerCase().includes(term) ||
               vendorName.toLowerCase().includes(term) ||
               customerName.toLowerCase().includes(term);
      });

    // This component renders both on the same page, but usually export PO is more common.
    // I'll export BOTH if available or detect context if possible.
    // For now, I'll export POs as primary since JOs are just pending.
    
    dataToExport = filteredPOs.map(po => ({
      PO_ID: po.id,
      JO_ID: po.joId,
      Date: po.date,
      Vendor: po.vendorName,
      Customer: po.customerName,
      Total: po.grandTotal,
      Status: po.status
    }));
    fileName = "Purchase_Order_Records";

    if (dataToExport.length === 0) {
      alert(isID ? "Tidak ada data PO untuk di-export pada rentang tanggal ini." : "No PO data to export for this date range.");
      return;
    }

    exportToExcel(dataToExport, fileName);
  };

  const buildPOPayload = () => {
    const jo = jobOrders.find(j => String(j.id) === String(poJoId));
    if (!jo) { alert(isID ? 'Job Order tidak ditemukan.' : 'Job Order not found.'); return null; }
    if (!poVendor) { alert(isID ? 'Vendor tidak ditemukan.' : 'Vendor not found.'); return null; }

    const items = poItems
      .filter(it => it.serviceIdx !== '')
      .map(it => {
        const svc = poVendor.services[parseInt(it.serviceIdx)];
        const qty = parseFloat(it.qty) || 1;
        return {
          serviceDescription: svc.description,
          unitPrice: parseFloat(svc.price || 0),
          qty,
          total: parseFloat(svc.price || 0) * qty
        };
      });

    if (items.length === 0) { alert(isID ? 'Pilih minimal satu layanan vendor.' : 'Select at least one vendor service.'); return null; }

    return {
      joId: jo.id,
      customerName: jo.customerName,
      jobInstruction: jo.jobDescription || jo.instruction || '-',
      vendorId: poVendor.id,
      vendorName: poVendor.name,
      items,
      grandTotal: items.reduce((s, it) => s + it.total, 0),
      status: 'draft', // Default
      date: new Date().toISOString().split('T')[0],
      notes: poNotes
    };
  };

  const resetPOForm = () => {
    setShowPOModal(false);
    setEditingPOId(null);
    setPoJoId('');
    setPoVendorId('');
    setPoItems([{ serviceIdx: '', qty: 1 }]);
    setPoJoSearch('');
    setPoVendorSearch('');
    setPoNotes('');
  };

  const handleEditPO = (po) => {
    setEditingPOId(po.id);
    setPoJoId(po.joId);
    setPoVendorId(po.vendorId);
    setPoNotes(po.notes || '');

    const vendor = vendorList.find(v => v.id === po.vendorId);
    if (vendor && po.items) {
      const mappedItems = po.items.map(poItem => {
        const idx = vendor.services.findIndex(s => s.description === poItem.serviceDescription);
        return {
          serviceIdx: idx !== -1 ? String(idx) : '',
          qty: poItem.qty
        };
      });
      setPoItems(mappedItems.length > 0 ? mappedItems : [{ serviceIdx: '', qty: 1 }]);
    } else {
      setPoItems([{ serviceIdx: '', qty: 1 }]);
    }

    setShowPOModal(true);
  };

  // Button: Simpan Draft
  const handleSaveDraft = async () => {
    try {
      const payload = buildPOPayload();
      if (!payload) return;
      if (editingPOId) {
        await updatePurchaseOrder(editingPOId, { ...payload, status: 'draft' });
      } else {
        await createPurchaseOrder({ ...payload, status: 'draft' });
      }
      resetPOForm();
    } catch (err) {
      console.error('Error saving draft PO:', err);
      alert((isID ? 'Gagal menyimpan draft: ' : 'Failed to save draft: ') + err.message);
    }
  };

  // Button: Langsung Terbitkan
  const handleIssueDirectly = async () => {
    try {
      const payload = buildPOPayload();
      if (!payload) return;
      
      const poToCreate = { ...payload, status: 'issued' };
      let createdPO;
      if (editingPOId) {
        await updatePurchaseOrder(editingPOId, poToCreate);
        createdPO = { id: editingPOId, ...poToCreate };
      } else {
        createdPO = await createPurchaseOrder(poToCreate);
      }
      
      if (createdPO) {
        resetPOForm();
        setPrintPO(createdPO);
        setIsPOListMinimized(false);
      }
    } catch (err) {
      console.error('Error issuing PO directly:', err);
      alert((isID ? 'Gagal menerbitkan Purchase Order: ' : 'Failed to issue Purchase Order: ') + err.message);
    }
  };



  const approvedQuotes = quotations.filter(q => q.status === 'approved');

  const handleCreateJO = (quote) => {
    // If the quote has items array, use the selected one
    const hasItems = quote.items && quote.items.length > 0;
    const activityDetail = hasItems ? quote.items[selectedActivityIndex].description : quote.jobDescription;
    const rateDetail = hasItems ? parseFloat(quote.items[selectedActivityIndex].rate) : quote.rate;

    createJO({
      quotationId: quote.id,
      customerName: quote.customerName,
      jobDescription: activityDetail,
      phone: quote.phone || 'N/A',
      email: quote.email || 'N/A',
      rate: rateDetail,
      quantity: issueQuantity // Set quantity at creation
    });
    setShowModal(false);
    setSelectedQuoteId('');
    setSelectedActivityIndex(0);
    setIssueQuantity(1);
  };

  const handleModalSubmit = (e) => {
    e.preventDefault();
    const quote = approvedQuotes.find(q => q.id === selectedQuoteId);
    if (quote) {
      handleCreateJO(quote);
    }
  };

  const handleDispatch = async (joId) => {
    const jo = jobOrders.find(j => j.id === joId);
    const qty = quantities[joId] || jo.quantity || 1;
    await dispatchJO(joId, parseInt(qty));
    alert(isID ? 'Job Order berhasil dikirim ke Pelaksana!' : 'Job Order dispatched to Executor!');
  };

  return (
    <div className="admin-container" style={{ display: 'grid', gap: '30px' }}>

      {/* Delete PO Confirm */}
      {/* Print PO View */}
      <AnimatePresence>
        {printPO && (
          <div style={{position:'fixed',inset:0,background:'white',zIndex:10000,padding:'40px',color:'black',overflowY:'auto'}}>
            <div className="no-print" style={{position:'absolute',top:'20px',right:'20px',display: 'flex', flexWrap: 'wrap',gap:'10px'}}>
              <button className="btn" style={{background:'#eee',color:'#333'}} onClick={()=>setPrintPO(null)}>{isID ? 'Tutup' : 'Close'}</button>
              <button className="btn btn-primary" onClick={()=>window.print()}>{isID ? 'Cetak PO' : 'Print PO'}</button>
            </div>
            
            <div id="po-print" className="quotation-modal-content" style={{maxWidth:'210mm',margin:'0 auto',border:'1px solid #ddd',padding:'40px',fontFamily:'Arial'}}>
              <div style={{display: 'flex', flexWrap: 'wrap',justifyContent:'space-between',borderBottom:'3px solid #333',paddingBottom:'20px',marginBottom:'30px'}}>
                <div>
                  <h1 style={{margin:0,fontSize:'2rem',color:'#333'}}>PURCHASE ORDER</h1>
                  <div style={{color:'#666',marginTop:'5px'}}>Ref: {printPO.id}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontWeight:'bold'}}>PT. Alpha Logistics Prakarsa</div>
                  <div>Jakarta, Indonesia</div>
                  <div style={{marginTop:'5px',fontSize:'0.8rem'}}>{isID ? 'Tanggal:' : 'Date:'} {formatDate(printPO.date)}</div>
                </div>
              </div>

              <div className="grid-responsive-2" style={{ marginBottom: '30px' }}>
                <div>
                  <div style={{textTransform:'uppercase',fontSize:'0.75rem',color:'#888',marginBottom:'5px'}}>{isID ? 'Vendor:' : 'Vendor:'}</div>
                  <div style={{fontWeight:'bold',fontSize:'1.1rem'}}>{printPO.vendorName}</div>
                </div>
                <div>
                  <div style={{textTransform:'uppercase',fontSize:'0.75rem',color:'var(--secondary)',marginBottom:'5px'}}>{isID ? 'Referensi JO:' : 'JO Reference:'}</div>
                  <div style={{fontWeight:'bold'}}>{printPO.joId}</div>
                  <div style={{marginTop:'10px'}}>
                    <span style={{textTransform:'uppercase',fontSize:'0.75rem',color:'var(--secondary)',marginBottom:'5px'}}>{isID ? 'Pelanggan:' : 'Customer:'}</span>
                    <div style={{fontSize:'0.9rem'}}>{printPO.customerName}</div>
                  </div>
                </div>
              </div>

              <div className="table-container"><div className="table-responsive-wrapper" style={{ overflowX: 'auto', width: '100%' }}>
<table style={{width:'100%',borderCollapse:'collapse',marginBottom:'30px'}}>
                <thead>
                  <tr style={{background:'#f5f5f5',borderBottom:'2px solid #333'}}>
                    <th style={{padding:'10px',textAlign:'left'}}>{isID ? 'Deskripsi Layanan' : 'Service Description'}</th>
                    <th style={{padding:'10px',textAlign:'center'}}>{isID ? 'Jumlah' : 'Qty'}</th>
                    <th style={{padding:'10px',textAlign:'right'}}>{isID ? 'Harga Satuan' : 'Unit Price'}</th>
                    <th style={{padding:'10px',textAlign:'right'}}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(printPO.items || []).map((it,idx)=>(
                    <tr key={idx} style={{borderBottom:'1px solid #eee'}}>
                      <td style={{padding:'12px'}}>{it.serviceDescription}</td>
                      <td style={{padding:'12px',textAlign:'center'}}>{it.qty}</td>
                      <td style={{padding:'12px',textAlign:'right'}}>Rp {it.unitPrice.toLocaleString('id-ID')}</td>
                      <td style={{padding:'12px',textAlign:'right'}}>Rp {it.total.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" style={{padding:'15px',textAlign:'right',fontWeight:'bold',fontSize:'1.1rem'}}>GRAND TOTAL</td>
                    <td style={{padding:'15px',textAlign:'right',fontWeight:'bold',fontSize:'1.2rem',color:'#d97706'}}>Rp {(printPO.grandTotal||0).toLocaleString('id-ID')}</td>
                  </tr>
                </tfoot>
              </table>
</div></div>

              {printPO.notes && (
                <div style={{ marginBottom: '40px', padding: '15px', background: '#f8fafc', borderLeft: '4px solid #d97706', borderRadius: '4px' }}>
                  <div style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b', fontWeight: '800', marginBottom: '5px', letterSpacing: '1px' }}>{isID ? 'Catatan / Instruksi Khusus:' : 'Notes / Special Instructions:'}</div>
                  <div style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: '600', whiteSpace: 'pre-wrap' }}>{printPO.notes}</div>
                </div>
              )}

              <div className="grid-responsive-2" style={{ marginTop: '60px', textAlign: 'center' }}>
                <div>
                  <div style={{borderBottom:'1px solid #333',height:'80px'}}/>
                  <div style={{marginTop:'10px',fontSize:'0.8rem'}}>{isID ? 'Tanda Tangan Vendor' : 'Vendor Signature'}</div>
                </div>
                <div>
                  <div style={{borderBottom:'1px solid #333',height:'80px'}}/>
                  <div style={{marginTop:'10px',fontSize:'0.8rem'}}>{isID ? 'Tanda Tangan Authorized' : 'Authorized Signature'}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletePOConfirm && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:9999,display: 'flex', flexWrap: 'wrap',alignItems:'center',justifyContent:'center',padding:'20px'}}>
            <motion.div initial={{scale:0.85}} animate={{scale:1}} exit={{scale:0.85}} className="glass-card" style={{padding:'35px',maxWidth:'420px',width:'100%',textAlign:'center' , overflowX: 'auto' }}>
              <div style={{fontSize:'2.5rem',marginBottom:'12px'}}>🗑️</div>
              <h3 style={{color:'#ef4444',marginBottom:'8px'}}>{isID ? 'Hapus Purchase Order?' : 'Delete Purchase Order?'}</h3>
              <p style={{color:'var(--text-muted)',marginBottom:'25px'}}>{isID ? 'PO ' : 'PO '}<strong style={{color:'var(--text)'}}>{deletePOConfirm.id}</strong>{isID ? ' akan dihapus permanen.' : ' will be permanently deleted.'}</p>
              <div style={{display: 'flex', flexWrap: 'wrap',gap:'12px'}}>
                <button className="btn" style={{flex:1,background:'rgba(255,255,255,0.05)',border:'1px solid var(--border)',color:'var(--text)'}} onClick={()=>setDeletePOConfirm(null)}>{isID ? 'Batal' : 'Cancel'}</button>
                <ButtonWithLoading className="btn" style={{flex:1,background:'#ef4444',color:'white',border:'none'}} onClick={async()=>{await deletePurchaseOrder(deletePOConfirm.id);setDeletePOConfirm(null);}}>{isID ? 'Hapus' : 'Delete'}</ButtonWithLoading>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteJOConfirm && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:9999,display: 'flex', flexWrap: 'wrap',alignItems:'center',justifyContent:'center',padding:'20px'}}>
            <motion.div initial={{scale:0.85}} animate={{scale:1}} exit={{scale:0.85}} className="glass-card" style={{padding:'35px',maxWidth:'420px',width:'100%',textAlign:'center' , overflowX: 'auto' }}>
              <div style={{fontSize:'2.5rem',marginBottom:'12px'}}>🗑️</div>
              <h3 style={{color:'#ef4444',marginBottom:'8px'}}>{isID ? 'Batalkan / Hapus Job Order?' : 'Cancel / Delete Job Order?'}</h3>
              <p style={{color:'var(--text-muted)',marginBottom:'25px'}}>{isID ? 'Job Order draft ' : 'Draft Job Order '}<strong style={{color:'var(--text)'}}>{deleteJOConfirm.id}</strong> ({deleteJOConfirm.customerName}){isID ? ' akan dihapus permanen.' : ' will be permanently deleted.'}</p>
              <div style={{display: 'flex', flexWrap: 'wrap',gap:'12px'}}>
                <button className="btn" style={{flex:1,background:'rgba(255,255,255,0.05)',border:'1px solid var(--border)',color:'var(--text)'}} onClick={()=>setDeleteJOConfirm(null)}>{isID ? 'Batal' : 'Cancel'}</button>
                <ButtonWithLoading className="btn" style={{flex:1,background:'#ef4444',color:'white',border:'none'}} onClick={async()=>{await context.deleteJO(deleteJOConfirm.id);setDeleteJOConfirm(null);}}>{isID ? 'Hapus Draft' : 'Delete Draft'}</ButtonWithLoading>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create PO Modal */}
      <AnimatePresence>
        {showPOModal && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:1000,display: 'flex', flexWrap: 'wrap',alignItems:'center',justifyContent:'center',padding:'20px'}}>
            <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}}
              className="glass-card" style={{width:'100%',maxWidth:'720px',padding:'40px',maxHeight:'90vh',overflowY:'auto',position:'relative' , overflowX: 'auto' }}>
              <button onClick={()=>setShowPOModal(false)} style={{position:'absolute',top:'15px',right:'15px',background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer'}}><X size={20}/></button>
              <h3 style={{color:'var(--secondary)',marginBottom:'25px',display: 'flex', flexWrap: 'wrap',alignItems:'center',gap:'10px'}}>
                <ShoppingCart size={22}/> {isID ? (editingPOId ? `Ubah Purchase Order (${editingPOId})` : 'Buat Purchase Order') : (editingPOId ? `Edit Purchase Order (${editingPOId})` : 'Create Purchase Order')}
              </h3>
              <form onSubmit={e => e.preventDefault()}>
                {/* Step 1: Select JO */}
                <div className="input-group" style={{marginBottom:'20px'}}>
                  <label style={{color:'var(--secondary)',fontWeight:'600'}}>
                    {isID ? '1. Pilih Job Order ' : '1. Select Job Order '}
                    <span style={{color:'var(--text-muted)',fontWeight:'400'}}>{isID ? '(pilih JO yang akan dibuatkan PO-nya)' : '(select JO to create its PO)'}</span>
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input 
                        type="text" 
                        placeholder={isID ? "Cari nomor JO..." : "Search JO number..."} 
                        value={poJoSearch} 
                        onChange={e => setPoJoSearch(e.target.value)} 
                        style={{ width: '100%', padding: '10px 15px 10px 40px', borderRadius: '10px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} 
                      />
                      <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                  <select 
                    required 
                    value={poJoId} 
                    onChange={e => setPoJoId(e.target.value)} 
                    style={{width:'100%',padding:'12px',background:'var(--input-bg)',border:'1px solid var(--border)',borderRadius:'10px',color:'var(--secondary)',fontWeight:'700'}}
                  >
                    <option value="" style={{color:'var(--text-muted)', background: 'var(--bg)'}}>-- {poJoSearch ? (isID ? 'Hasil Pencarian' : 'Search Results') : (isID ? 'Pilih JO' : 'Select JO')} --</option>
                    {jobOrders
                      .filter(jo => jo.status !== 'cancelled')
                      .filter(jo => jo.id.toLowerCase().includes(poJoSearch.toLowerCase()) || jo.customerName.toLowerCase().includes(poJoSearch.toLowerCase()))
                      .map(jo => (
                        <option key={jo.id} value={jo.id} style={{color:'var(--text)',background:'var(--bg)'}}>
                          {jo.id} — {jo.customerName} ({t(jo.status)})
                        </option>
                      ))
                    }
                  </select>
                </div>

                {poJoId && (() => {
                  const jo = jobOrders.find(j=>j.id===poJoId);
                  return jo ? (
                    <div style={{padding:'15px',background:'rgba(212,175,55,0.06)',border:'1px solid rgba(212,175,55,0.2)',borderRadius:'10px',marginBottom:'20px',fontSize:'0.875rem'}}>
                      <div className="grid-responsive-2">
                        <div><span style={{color:'var(--text-muted)'}}>{isID ? 'Pelanggan:' : 'Customer:'}</span><div style={{fontWeight:'700'}}>{jo.customerName}</div></div>
                        <div><span style={{color:'var(--text-muted)'}}>{isID ? 'Instruksi Kerja:' : 'Work Instruction:'}</span><div style={{fontWeight:'700'}}>{jo.jobDescription||jo.instruction||'-'}</div></div>
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Step 2: Select Vendor */}
                <div className="input-group" style={{marginBottom:'20px'}}>
                  <label style={{color:'var(--secondary)',fontWeight:'600'}}>{isID ? '2. Pilih Vendor' : '2. Select Vendor'}</label>
                  <div style={{ position: 'relative', marginBottom: '10px' }}>
                    <input 
                      type="text" 
                      placeholder={isID ? "Cari nama vendor..." : "Search vendor name..."} 
                      value={poVendorSearch} 
                      onChange={e => setPoVendorSearch(e.target.value)} 
                      style={{ width: '100%', padding: '10px 15px 10px 40px', borderRadius: '10px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} 
                    />
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  </div>
                  <select 
                    required 
                    value={poVendorId} 
                    onChange={e=>{setPoVendorId(e.target.value);setPoItems([{serviceIdx:'',qty:1}]);}} 
                    style={{width:'100%',padding:'12px',background:'var(--input-bg)',border:'1px solid var(--border)',borderRadius:'10px',color:'var(--secondary)',fontWeight:'700'}}
                  >
                    <option value="" style={{color:'var(--text-muted)', background: 'var(--bg)'}}>-- {isID ? 'Pilih Vendor' : 'Select Vendor'} --</option>
                    {vendorList
                      .filter(v => v.name.toLowerCase().includes(poVendorSearch.toLowerCase()))
                      .map(v=><option key={v.id} value={v.id} style={{color:'var(--text)',background:'var(--bg)'}}>{v.name}</option>)
                    }
                  </select>
                </div>

                {/* Step 3: Select Services */}
                {poVendor && (
                  <div style={{marginBottom:'20px'}}>
                    <label style={{color:'var(--secondary)',fontWeight:'600',display:'block',marginBottom:'10px'}}>{isID ? '3. Pilih Layanan Vendor' : '3. Select Vendor Services'}</label>
                    <div className="grid-vendor-services desktop-only" style={{ marginBottom: '8px', fontSize: '0.72rem', color: 'var(--text-muted)', paddingLeft: '4px' }}>
                      <div/><div>{isID ? 'Layanan' : 'Service'}</div><div style={{textAlign:'center'}}>{isID ? 'Jumlah' : 'Qty'}</div><div style={{textAlign:'right'}}>Subtotal</div><div/>
                    </div>
                    {poItems.map((item,i)=>{
                      const svc = poVendor.services[parseInt(item.serviceIdx)];
                      const sub = svc ? parseFloat(svc.price||0)*parseFloat(item.qty||1) : 0;
                      return (
                        <div key={i} className="grid-vendor-services" style={{ marginBottom: '10px' }}>
                          <div style={{width:'6px',height:'6px',borderRadius:'50%',background:'var(--secondary)'}}/>
                          <select required value={item.serviceIdx} onChange={e=>updatePOItem(i,'serviceIdx',e.target.value)} style={{padding:'9px',background:'var(--input-bg)',border:'1px solid var(--border)',borderRadius:'8px',color:'var(--secondary)',fontWeight:'600',fontSize:'0.85rem'}}>
                            <option value="" style={{color:'var(--text-muted)', background: 'var(--bg)'}}>-- {isID ? 'Pilih Layanan' : 'Select Service'} --</option>
                            {poVendor.services.map((s,si)=><option key={si} value={si} style={{color:'var(--text)', background:'var(--bg)'}}>{s.description} — Rp {parseFloat(s.price||0).toLocaleString('id-ID')}</option>)}
                          </select>
                          <input type="number" min="1" value={item.qty} onChange={e=>updatePOItem(i,'qty',e.target.value)} style={{padding:'9px',background:'var(--input-bg)',border:'1px solid var(--border)',borderRadius:'8px',color:'var(--text)',fontSize:'0.85rem',textAlign:'center'}}/>
                          <div style={{padding:'9px',background:'rgba(255,255,255,0.03)',border:'1px solid var(--glass-border)',borderRadius:'8px',fontSize:'0.85rem',fontWeight:'700',color:'var(--secondary)',textAlign:'right'}}>{svc?`Rp ${sub.toLocaleString('id-ID')}`:'Rp 0'}</div>
                          <button type="button" onClick={()=>removePOItem(i)} disabled={poItems.length===1} style={{background:'rgba(239,68,68,0.1)',color:'#ef4444',border:'none',borderRadius:'8px',height:'36px',cursor:'pointer',display: 'flex', flexWrap: 'wrap',alignItems:'center',justifyContent:'center'}}><X size={13}/></button>
                        </div>
                      );
                    })}
                    <button type="button" onClick={addPOItem} style={{width:'100%',padding:'8px',background:'rgba(212,175,55,0.08)',color:'var(--secondary)',border:'1px dashed var(--secondary)',borderRadius:'8px',cursor:'pointer',fontSize:'0.85rem',marginBottom:'15px'}}>+ {isID ? 'Tambah Baris Layanan' : 'Add Service Row'}</button>
                    <div style={{textAlign:'right',padding:'12px 15px',background:'rgba(255,255,255,0.03)',borderRadius:'10px',border:'1px solid var(--glass-border)'}}>
                      <span style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>{isID ? 'Grand Total PO: ' : 'PO Grand Total: '}</span>
                      <span style={{color:'var(--secondary)',fontWeight:'800',fontSize:'1.1rem'}}>Rp {poItems.filter(it=>it.serviceIdx!=='').reduce((s,it)=>{const svc=poVendor.services[parseInt(it.serviceIdx)];return s+(svc?parseFloat(svc.price||0)*parseFloat(it.qty||1):0);},0).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                )}

                <div className="input-group" style={{marginBottom:'20px'}}>
                  <label style={{color:'var(--secondary)',fontWeight:'600'}}>{isID ? '4. Catatan (Notes)' : '4. Notes (Optional)'}</label>
                  <textarea 
                    value={poNotes} 
                    onChange={e => setPoNotes(e.target.value)} 
                    placeholder={isID ? "Tambahkan instruksi khusus untuk vendor (opsional)..." : "Add special instructions for vendor (optional)..."}
                    style={{width:'100%',padding:'12px',background:'var(--input-bg)',border:'1px solid var(--border)',borderRadius:'10px',color:'var(--text)',minHeight:'80px',fontSize:'0.9rem'}}
                  />
                </div>

                <div style={{display: 'flex', flexWrap: 'wrap',gap:'12px',marginTop:'20px'}}>
                  <button type="button" onClick={()=>setShowPOModal(false)} className="btn" style={{flex:1,background:'rgba(255,255,255,0.05)',border:'1px solid var(--border)',color:'var(--text)'}}>{isID ? 'Batal' : 'Cancel'}</button>
                  <ButtonWithLoading
                    type="button"
                    onClick={handleSaveDraft}
                    className="btn"
                    style={{flex:1.5,background:'rgba(212,175,55,0.1)',color:'var(--secondary)',border:'1px solid var(--secondary)'}}
                    disabled={!poJoId||!poVendorId}
                  >
                    💾 {isID ? (editingPOId ? 'Perbarui Draft' : 'Simpan Draft') : (editingPOId ? 'Update Draft' : 'Save Draft')}
                  </ButtonWithLoading>
                  <ButtonWithLoading
                    type="button"
                    onClick={handleIssueDirectly}
                    className="btn btn-gold"
                    style={{flex:2}}
                    disabled={!poJoId||!poVendorId}
                  >
                    <CheckCircle size={16}/> {isID ? (editingPOId ? 'Perbarui & Terbitkan' : 'Langsung Terbitkan') : (editingPOId ? 'Update & Issue' : 'Issue Directly')}
                  </ButtonWithLoading>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-responsive-row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h3 className="shimmer-text" style={{ fontSize: '1.8rem', margin: 0 }}>{isID ? 'Hub Instruksi Operasional' : 'Operational Instruction Hub'}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{isID ? 'Kirim pekerjaan ke pelaksana berdasarkan kontrak marketing yang disetujui.' : 'Dispatch jobs to executors based on approved marketing contracts.'}</p>
        </div>
        <div style={{display: 'flex', flexWrap: 'wrap',gap:'10px'}}>
          <button 
            className="btn btn-gold" 
            style={{ padding: '10px 22px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', borderRadius: '12px', fontWeight: '700', boxShadow: '0 4px 15px rgba(212,175,55,0.2)' }} 
            onClick={() => {
              setShowPOModal(true);
            }}
          >
            <ShoppingCart size={18}/> {isID ? 'Buat Purchase Order' : 'Create Purchase Order'}
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} />
            {isID ? 'Buat Job Order' : 'Create Job Order'}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ overflowX: "auto" }}  className="flex-responsive-row" style={{ padding: "20px 25px", alignItems: "flex-start", background: "rgba(255,255,255,0.03)", justifyContent: "space-between" }}>
        <div style={{ position: 'relative', flex: 1, whiteSpace: "nowrap", flex: '1 1 100%' }}>
          <input type="text" placeholder={isID ? "Cari PO atau JO..." : "Search PO or JO..."} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '10px 15px 10px 40px', borderRadius: '10px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>{isID ? 'Filter Tanggal:' : 'Date Filter:'}</span>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.85rem' }} />
          <span style={{ color: 'var(--text-muted)' }}>{isID ? 's/d' : 'to'}</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.85rem' }} />
          {(startDate || endDate || searchTerm) && (
            <button onClick={() => { setStartDate(''); setEndDate(''); setSearchTerm(''); }} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600' }}>Reset</button>
          )}
        </div>
        <div>
          <button className="btn btn-gold" onClick={handleExport} style={{ padding: '8px 16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <FileSpreadsheet size={18} /> {isID ? 'Ekspor PO' : 'Export PO'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 1000,
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
          }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card" style={{ width: '100%', maxWidth: '600px', padding: '40px', position: 'relative'  , overflowX: 'auto' }}
            >
              <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>

              <h3 style={{ marginBottom: '25px', color: 'var(--secondary)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                <FileText size={24} />
                {isID ? 'Instruksi Operasional Baru' : 'New Operational Instruction'}
              </h3>

              <form onSubmit={handleModalSubmit}>
                <div className="input-group" style={{ marginBottom: '25px' }}>
                  <label>{isID ? 'Pilih Aktivitas yang Disetujui' : 'Select Approved Activity'}</label>
                  <div style={{ position: 'relative', marginBottom: '10px' }}>
                    <input 
                      type="text" 
                      placeholder={isID ? "Cari Penawaran (ID, Pelanggan, atau Deskripsi)..." : "Search Quotation (ID, Customer, or Description)..."} 
                      value={quoteSearchTerm} 
                      onChange={e => setQuoteSearchTerm(e.target.value)} 
                      style={{ 
                        width: '100%', 
                        padding: '10px 15px 10px 40px', 
                        borderRadius: '10px', 
                        background: 'var(--input-bg)', 
                        border: '1px solid var(--border)', 
                        color: 'var(--text)',
                        fontSize: '0.9rem'
                      }} 
                    />
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  </div>
                  <select
                    required
                    value={selectedQuoteId}
                    onChange={e => {
                      const qId = e.target.value;
                      setSelectedQuoteId(qId);
                      setSelectedActivityIndex(0);

                      // Pre-fill quantity from quote if available
                      const quote = approvedQuotes.find(q => q.id === qId);
                      if (quote) {
                        const defaultQty = quote.items && quote.items.length > 0 ? quote.items[0].quantity : (quote.quantity || 1);
                        setIssueQuantity(parseInt(defaultQty));
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      color: 'var(--text)',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>-- {isID ? 'Pilih Penawaran yang Disetujui' : 'Choose Approved Quotation'} --</option>
                    {quotations
                      .filter(q => q.status === 'approved')
                      .filter(q => 
                        q.id.toLowerCase().includes(quoteSearchTerm.toLowerCase()) ||
                        q.customerName.toLowerCase().includes(quoteSearchTerm.toLowerCase()) ||
                        (q.items?.[0]?.description || q.jobDescription || '').toLowerCase().includes(quoteSearchTerm.toLowerCase())
                      )
                      .map(quote => {
                        const label = Array.isArray(quote.items) && quote.items.length > 0
                          ? quote.items[0].description
                          : (quote.jobDescription || 'No description');
                        return (
                          <option key={quote.id} value={quote.id} style={{ background: 'var(--bg)', color: 'var(--text)' }}>
                            {quote.id} - {quote.customerName} ({label.substring(0, 30)}...)
                          </option>
                        );
                      })}
                  </select>
                </div>

                {selectedQuoteId && (() => {
                  const q = approvedQuotes.find(quote => quote.id === selectedQuoteId);
                  const hasMultipleItems = q.items && q.items.length > 1;

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    >
                      {hasMultipleItems && (
                        <div className="input-group" style={{ marginBottom: '25px' }}>
                          <label>{isID ? 'Pilih Item Aktivitas Spesifik' : 'Select Specific Activity Item'}</label>
                          <select
                            required
                            value={selectedActivityIndex}
                            onChange={e => {
                              const idx = parseInt(e.target.value);
                              setSelectedActivityIndex(idx);
                              setIssueQuantity(parseInt(q.items[idx].quantity));
                            }}
                            style={{
                              width: '100%',
                              padding: '12px 15px',
                              background: 'var(--input-bg)',
                              border: '1px solid var(--border)',
                              borderRadius: '12px',
                              color: 'var(--text)',
                              fontSize: '1rem'
                            }}
                          >
                            {q.items.map((item, idx) => (
                              <option key={idx} value={idx} style={{ background: 'var(--bg)', color: 'var(--text)' }}>
                                {item.description} (Qty: {item.quantity})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="input-group" style={{ marginBottom: '25px' }}>
                        <label style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                          <span>{isID ? 'Jumlah yang Dikeluarkan' : 'Quantity to Issue'}</span>
                          <span style={{ color: 'var(--secondary)', fontSize: '0.75rem' }}>
                            {isID ? 'Maks Kontrak: ' : 'Contract Max: '}{hasMultipleItems ? q.items[selectedActivityIndex].quantity : (q.quantity || 1)}
                          </span>
                        </label>
                        <input
                          required
                          type="number"
                          min="1"
                          value={issueQuantity}
                          onChange={e => setIssueQuantity(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '12px 15px',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            color: 'var(--text)',
                            fontSize: '1.2rem',
                            fontWeight: '700'
                          }}
                        />
                      </div>

                      <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '30px', border: '1px dashed var(--border)' }}>
                        <div style={{ marginBottom: '10px' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{isID ? 'Pelanggan:' : 'Customer:'}</span>
                          <div style={{ fontWeight: '600' }}>{q.customerName}</div>
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{isID ? 'Detail Aktivitas Terpilih:' : 'Selected Activity Detail:'}</span>
                          <div style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                            {hasMultipleItems
                              ? q.items[selectedActivityIndex].description
                              : (q.items?.[0]?.description || q.jobDescription || '-')}
                          </div>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{isID ? 'Harga Kontrak:' : 'Contract Rate:'}</span>
                          <div style={{ fontWeight: '700', color: 'var(--secondary)' }}>
                            Rp {hasMultipleItems
                              ? parseFloat(q.items[selectedActivityIndex].rate || 0).toLocaleString()
                              : parseFloat(q.items?.[0]?.rate || q.rate || 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                    {isID ? 'Batal' : 'Cancel'}
                  </button>
                  <ButtonWithLoading type="submit" className="btn btn-gold" style={{ flex: 1 }} disabled={!selectedQuoteId} onClick={handleModalSubmit}>
                    {isID ? 'Buat Form JO' : 'Generate JO Form'}
                  </ButtonWithLoading>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Purchase Orders Section */}
      <div className="glass-card" style={{ padding: '25px', marginTop: '30px'  , overflowX: 'auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: isPOListMinimized ? '0' : '25px' }}>
          <h4 style={{ margin: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}><ShoppingCart size={20} style={{color:'var(--secondary)'}}/> {isID ? 'Catatan Purchase Order' : 'Purchase Order Records'}</h4>
          <div style={{display: 'flex', flexWrap: 'wrap',alignItems:'center',gap:'20px'}}>
            {!isPOListMinimized && (
              <div style={{ position: 'relative', width: '250px' }}>
                <input 
                  type="text" 
                  placeholder={isID ? "Cari PO, Vendor, Pelanggan..." : "Search PO, Vendor, Customer..."} 
                  value={poSearchTerm} 
                  onChange={e => setPoSearchTerm(e.target.value)} 
                  style={{ width: '100%', padding: '6px 10px 6px 30px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.75rem' }} 
                />
                <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            )}
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{(purchaseOrders || []).length} {isID ? 'PO Dibuat' : 'PO Created'}</span>
            <button 
              onClick={() => setIsPOListMinimized(!isPOListMinimized)} 
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '5px', fontSize: '0.8rem', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--secondary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              {isPOListMinimized ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              {isPOListMinimized ? (isID ? 'Buka' : 'Expand') : (isID ? 'Tutup' : 'Minimize')}
            </button>
          </div>
        </div>
        
        <AnimatePresence>
          {!isPOListMinimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden' }}
            >
          <div className="table-container"><div className="table-responsive-wrapper" style={{ overflowX: 'auto', width: '100%' }}>
<table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: "nowrap" }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--gold-metallic)' }}>
                <th style={{ padding: '12px' }}>{isID ? 'Ref PO' : 'PO Ref'}</th>
                <th style={{ padding: '12px' }}>{isID ? 'Tanggal' : 'Date'}</th>
                <th style={{ padding: '12px' }}>{isID ? 'JO Terkait' : 'Linked JO'}</th>
                <th style={{ padding: '12px' }}>Vendor</th>
                <th style={{ padding: '12px' }}>{isID ? 'Pelanggan' : 'Customer'}</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Grand Total</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>{isID ? 'Aksi' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {(purchaseOrders || [])
                .filter(po => filterByDate(po.date))
                .filter(po => {
                  const id = po.id || '';
                  const joId = po.joId || '';
                  const vendorName = po.vendorName || '';
                  const customerName = po.customerName || '';
                  const term = poSearchTerm.toLowerCase();
                  return id.toLowerCase().includes(term) ||
                         joId.toLowerCase().includes(term) ||
                         vendorName.toLowerCase().includes(term) ||
                         customerName.toLowerCase().includes(term);
                })
                .map(po => (
                <tr key={po.id} style={{ borderBottom: '1px solid var(--glass-border)' }} className="table-row-hover">
                  <td style={{ padding: '12px', fontWeight: '700', color: 'var(--secondary)', fontSize: '0.85rem' }}>{po.id}</td>
                  <td style={{ padding: '12px', fontSize: '0.85rem' }}>{formatDate(po.date)}</td>
                  <td style={{ padding: '12px', fontWeight: '600', fontSize: '0.85rem' }}>{po.joId}</td>
                  <td style={{ padding: '12px', fontSize: '0.85rem' }}>{po.vendorName}</td>
                  <td style={{ padding: '12px', fontSize: '0.85rem' }}>{po.customerName}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: 'var(--secondary)' }}>Rp {(po.grandTotal || 0).toLocaleString('id-ID')}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span className={`badge badge-${po.status || 'draft'}`} style={{ fontSize: '0.7rem' }}>
                      {po.status === 'issued' ? (isID ? 'Diterbitkan' : 'Issued') : 'Draft'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                      <button className="btn-icon" onClick={() => handleEditPO(po)} title={isID ? "Ubah PO" : "Edit PO"} style={{ color: '#3b82f6', background: 'rgba(59,130,246,0.1)' }}>
                        <Edit size={15} />
                      </button>
                      <button className="btn-icon" onClick={() => setPrintPO(po)} title={isID ? "Cetak PO" : "Print PO"} style={{ color: 'var(--secondary)', background: 'rgba(212,175,55,0.1)' }}>
                        <FileText size={15} />
                      </button>
                      {po.status !== 'issued' && (
                        <ButtonWithLoading className="btn-icon" onClick={() => issuePurchaseOrder(po.id)} title={isID ? "Terbitkan PO" : "Issue PO"} style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)' }}>
                          <CheckCircle size={15} />
                        </ButtonWithLoading>
                      )}
                      <button className="btn-icon" onClick={() => setDeletePOConfirm(po)} title={isID ? "Hapus PO" : "Delete PO"} style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(purchaseOrders || []).length === 0 && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{isID ? 'Tidak ada Purchase Order tercatat.' : 'No Purchase Orders recorded.'}</td>
                </tr>
              )}
            </tbody>
          </table>
</div></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="glass-card" style={{ padding: '25px', marginTop: '30px'  , overflowX: 'auto' }}>
        <h4 style={{ marginBottom: '25px' }}>{isID ? 'Job Order untuk Dikirim' : 'Job Orders for Dispatch'}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))', gap: '25px' }}>
          {jobOrders
            .filter(jo => jo.status === 'pending')
            .filter(jo => filterByDate(jo.date))
            .filter(jo => {
              const id = jo.id || '';
              const name = jo.customerName || '';
              const term = searchTerm.toLowerCase();
              return id.toLowerCase().includes(term) || name.toLowerCase().includes(term);
            })
            .map(jo => (
            <div key={jo.id} className="glass-card table-row-hover" style={{ padding: '25px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: '15px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>{jo.id}</span>
                  <span className="badge badge-pending" style={{ fontSize: '0.7rem' }}>Draft</span>
                </div>
                <button 
                  className="btn-icon" 
                  style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', width: '32px', height: '32px' }} 
                  onClick={() => setDeleteJOConfirm(jo)}
                  title={isID ? "Batalkan / Hapus JO Draft" : "Cancel / Delete JO Draft"}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <p style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '5px' }}>{jo.customerName}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px', minHeight: '40px' }}>{jo.jobDescription}</p>

              <div className="input-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.8rem' }}>{isID ? 'Jumlah Pekerjaan (Unit)' : 'Work Quantity (Units)'}</label>
                <input
                  type="number"
                  min="1"
                  value={quantities[jo.id] || jo.quantity || ''}
                  onChange={e => setQuantities({ ...quantities, [jo.id]: e.target.value })}
                  placeholder={isID ? "Masukkan jumlah..." : "Enter quantity..."}
                  style={{ borderRadius: '10px', padding: '10px' }}
                />
              </div>

              <ButtonWithLoading className="btn btn-gold" style={{ width: '100%' }} onClick={() => handleDispatch(jo.id)}>
                <Send size={18} />
                {isID ? 'Kirim ke Pelaksana' : 'Dispatch to Executor'}
              </ButtonWithLoading>
            </div>
          ))}
          {jobOrders.filter(jo => jo.status === 'pending').length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              {isID ? 'Belum ada form JO draft.' : 'No JO forms drafted yet.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminHub;

