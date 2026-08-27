import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useConfirm } from '../context/ConfirmContext';
import { Send, CheckCircle, Plus, X, FileText, ShoppingCart, Trash2, FileCheck, Search, FileSpreadsheet, ChevronDown, ChevronUp, Edit, ChevronRight, Folder, FolderOpen, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToExcel } from '../utils/exportUtils';
import { ButtonWithLoading } from '../components/ButtonWithLoading';
import FormattedNumberInput from '../components/FormattedNumberInput';
import toast from 'react-hot-toast';


const AdminHub = () => {
  const context = useApp();
  const confirm = useConfirm();
  
  const [quantities, setQuantities] = useState({});
  const [selectedDispatchItems, setSelectedDispatchItems] = useState({});
  const [dispatchQuantities, setDispatchQuantities] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showDirectJOModal, setShowDirectJOModal] = useState(false);
  const [directJOForm, setDirectJOForm] = useState({
    customerId: '',
    customerName: '',
    phone: '',
    email: '',
    companyAddress: '',
    jobDescription: '',
    items: [{ description: '', rate: '', quantity: 1 }],
    extraCharges: []
  });
  const [selectedQuoteId, setSelectedQuoteId] = useState('');
  const [quoteJOExtraCharges, setQuoteJOExtraCharges] = useState([]);
  const [selectedActivityIndex, setSelectedActivityIndex] = useState(0);
  const [selectedActivities, setSelectedActivities] = useState({});
  const [issueQuantity, setIssueQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_desc');
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

  const [showConverterModal, setShowConverterModal] = useState(false);
  const [selectedConvertGroup, setSelectedConvertGroup] = useState(null);
  const [converting, setConverting] = useState(false);
  const [batchConverting, setBatchConverting] = useState(false);
  const [batchProgress, setBatchProgress] = useState('');
  const [selectedGroupKeys, setSelectedGroupKeys] = useState(new Set());

  if (!context) return null;
  const { quotations = [], jobOrders = [], createJO, dispatchJO, vendors = [], purchaseOrders = [], invoices = [], createPurchaseOrder, updatePurchaseOrder, issuePurchaseOrder, deletePurchaseOrder, user, t, loading, language, hasAccess, convertLegacyJOs, convertBatchLegacyJOs, customers = [], theme } = context;
  
  const legacyGroups = React.useMemo(() => {
    const groups = {};
    jobOrders.forEach(jo => {
      const isLegacy = !jo.items || jo.items.length === 0;
      if (isLegacy) {
        if (jo.quotationId) {
          if (!groups[jo.quotationId]) {
            groups[jo.quotationId] = [];
          }
          groups[jo.quotationId].push(jo);
        } else {
          groups['direct-' + jo.id] = [jo];
        }
      }
    });

    const groupsList = [];
    Object.keys(groups).forEach(groupId => {
      const jos = groups[groupId];
      const isDirect = groupId.startsWith('direct-');
      groupsList.push({
        quotationId: isDirect ? 'Direct JO' : groupId,
        isDirect: isDirect,
        groupId: groupId,
        customerName: jos[0].customerName || 'Unknown Customer',
        date: jos[0].date || '',
        jobOrders: jos
      });
    });
    return groupsList;
  }, [jobOrders]);

  const compileLegacyGroupItems = (group) => {
    const compiledItems = [];
    group.jobOrders.forEach(jo => {
      if (Array.isArray(jo.items) && jo.items.length > 0) {
        jo.items.forEach(it => {
          compiledItems.push({
            description: it.description || jo.instruction || jo.jobDescription || 'Freight Forwarding Services',
            qty: parseInt(it.issueQuantity || it.quantity || jo.issueQuantity || jo.quantity || 1, 10),
            rate: parseFloat(it.rate || jo.rate || 0),
            status: it.status || jo.status || 'pending',
            containerNo: Array.isArray(it.containerNo) ? it.containerNo : (jo.containerNo ? [jo.containerNo] : []),
            vehicleNo: Array.isArray(it.vehicleNo) ? it.vehicleNo : (jo.vehicleNo ? [jo.vehicleNo] : []),
            driverName: Array.isArray(it.driverName) ? it.driverName : (jo.driverName ? [jo.driverName] : [])
          });
        });
      } else {
        compiledItems.push({
          description: jo.instruction || jo.jobDescription || 'Freight Forwarding Services',
          qty: parseInt(jo.issueQuantity || jo.quantity || 1, 10),
          rate: parseFloat(jo.rate || 0),
          status: jo.status || 'pending',
          containerNo: Array.isArray(jo.containerNo) ? jo.containerNo : (jo.containerNo ? [jo.containerNo] : []),
          vehicleNo: Array.isArray(jo.vehicleNo) ? jo.vehicleNo : (jo.vehicleNo ? [jo.vehicleNo] : []),
          driverName: Array.isArray(jo.driverName) ? jo.driverName : (jo.driverName ? [jo.driverName] : [])
        });
      }
    });
    return compiledItems;
  };

  const handleBatchConvert = async () => {
    if (selectedGroupKeys.size === 0) return;
    setBatchConverting(true);
    
    const batches = [];
    selectedGroupKeys.forEach(gKey => {
      const group = legacyGroups.find(g => g.groupId === gKey);
      if (group) {
        batches.push({
          primaryJoId: group.jobOrders[0].id,
          joIdsToDelete: group.jobOrders.slice(1).map(j => j.id),
          items: compileLegacyGroupItems(group),
          quotationId: group.quotationId
        });
      }
    });

    try {
      await convertBatchLegacyJOs(batches, (currentIndex, total, id) => {
        setBatchProgress(isID 
          ? `Mengonversi ${currentIndex + 1} dari ${total} (${id === 'Direct JO' ? 'Pekerjaan Langsung' : id})...`
          : `Converting ${currentIndex + 1} of ${total} (${id})...`
        );
      });
      toast.success(isID 
        ? `Berhasil mengonversi ${batches.length} data legacy!` 
        : `Successfully converted ${batches.length} legacy records!`
      );
      setSelectedGroupKeys(new Set());
    } catch (err) {
      console.error(err);
      toast.error(isID ? 'Gagal melakukan konversi batch.' : 'Failed to run batch conversion.');
    } finally {
      setBatchConverting(false);
      setBatchProgress('');
    }
  };

  const toggleGroupSelection = (groupId) => {
    const next = new Set(selectedGroupKeys);
    if (next.has(groupId)) {
      next.delete(groupId);
    } else {
      next.add(groupId);
    }
    setSelectedGroupKeys(next);
  };

  const toggleAllGroups = () => {
    if (selectedGroupKeys.size === legacyGroups.length) {
      setSelectedGroupKeys(new Set());
    } else {
      setSelectedGroupKeys(new Set(legacyGroups.map(g => g.groupId)));
    }
  };

  const isID = language === 'id';
  const canWrite = hasAccess ? hasAccess('admin', true) : false;
  
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
      toast(isID ? "Tidak ada data PO untuk di-export pada rentang tanggal ini." : "No PO data to export for this date range.");
      return;
    }

    exportToExcel(dataToExport, fileName);
  };

  const buildPOPayload = () => {
    const jo = jobOrders.find(j => String(j.id) === String(poJoId));
    if (!jo) { toast.error(isID ? 'Job Order tidak ditemukan.' : 'Job Order not found.'); return null; }
    if (!poVendor) { toast.error(isID ? 'Vendor tidak ditemukan.' : 'Vendor not found.'); return null; }

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

    if (items.length === 0) { toast(isID ? 'Pilih minimal satu layanan vendor.' : 'Select at least one vendor service.'); return null; }

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
    if (!canWrite) return;
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
      toast.error((isID ? 'Gagal menyimpan draft: ' : 'Failed to save draft: ') + err.message);
    }
  };

  // Button: Langsung Terbitkan
  const handleIssueDirectly = async () => {
    if (!canWrite) return;
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
      toast.error((isID ? 'Gagal menerbitkan Purchase Order: ' : 'Failed to issue Purchase Order: ') + err.message);
    }
  };



  const approvedQuotes = quotations.filter(q => q.status === 'approved');

  const getAvailableItems = (quote, jobOrdersList = []) => {
    const relatedJOs = jobOrdersList.filter(jo => String(jo.quotationId) === String(quote.id));
    const items = quote.items && quote.items.length > 0 ? quote.items : [];
    
    if (items.length > 0) {
      // Match JOs with non-empty instructions to items, keeping track of original index
      const unmatchedItems = items.map((item, idx) => ({ ...item, originalIndex: idx }));
      const unmatchedJOs = [];
      
      relatedJOs.forEach(jo => {
        const joDesc = (jo.instruction || '').trim().toLowerCase();
        if (joDesc) {
          const matchIndex = unmatchedItems.findIndex(item => 
            (item.description || '').trim().toLowerCase() === joDesc
          );
          if (matchIndex !== -1) {
            unmatchedItems.splice(matchIndex, 1);
          } else {
            unmatchedJOs.push(jo);
          }
        } else {
          unmatchedJOs.push(jo);
        }
      });
      
      const finalUnmatchedItems = [...unmatchedItems];
      unmatchedJOs.forEach(() => {
        if (finalUnmatchedItems.length > 0) {
          finalUnmatchedItems.shift();
        }
      });
      
      return finalUnmatchedItems;
    } else {
      const hasJO = relatedJOs.length > 0;
      return hasJO ? [] : [{ description: quote.jobDescription || 'No description', rate: quote.rate, quantity: quote.quantity || 1, originalIndex: -1 }];
    }
  };

  const handleCreateJO = async (quote) => {
    if (!canWrite) return;
    const hasItems = quote.items && quote.items.length > 0;

    if (hasItems) {
      const selectedIndexes = Object.keys(selectedActivities).filter(idx => selectedActivities[idx]?.selected);
      if (selectedIndexes.length === 0) {
        toast(isID ? 'Pilih setidaknya satu aktivitas!' : 'Select at least one activity!');
        return;
      }

      const joItems = selectedIndexes.map(idxStr => {
        const idx = parseInt(idxStr, 10);
        const item = quote.items[idx];
        const qty = selectedActivities[idx]?.quantity || item.quantity || 1;
        return {
          description: item.description,
          rate: parseFloat(item.rate || 0),
          quantity: parseInt(qty, 10),
          issueQuantity: 0,
          status: 'pending'
        };
      });

      await createJO({
        quotationId: quote.id,
        customerName: quote.customerName,
        phone: quote.phone || 'N/A',
        email: quote.email || 'N/A',
        quoteValidity: quote.validTo || 'N/A',
        items: joItems,
        extra_charges: quoteJOExtraCharges
      });
    } else {
      await createJO({
        quotationId: quote.id,
        customerName: quote.customerName,
        jobDescription: quote.jobDescription || 'No description',
        phone: quote.phone || 'N/A',
        email: quote.email || 'N/A',
        rate: parseFloat(quote.rate || 0),
        quantity: parseInt(issueQuantity, 10),
        extra_charges: quoteJOExtraCharges
      });
    }

    setShowModal(false);
    setSelectedQuoteId('');
    setSelectedActivities({});
    setSelectedActivityIndex(0);
    setIssueQuantity(1);
    setQuoteJOExtraCharges([]);
  };

  const handleModalSubmit = (e) => {
    e.preventDefault();
    const quote = approvedQuotes.find(q => q.id === selectedQuoteId);
    if (quote) {
      handleCreateJO(quote);
    }
  };

  const handleDirectJOSubmit = async (e) => {
    e.preventDefault();
    if (!canWrite) return;

    if (!directJOForm.customerName.trim()) {
      toast.error(isID ? 'Nama pelanggan harus diisi!' : 'Customer name is required!');
      return;
    }
    if (!directJOForm.jobDescription.trim()) {
      toast.error(isID ? 'Deskripsi pekerjaan harus diisi!' : 'Job description is required!');
      return;
    }

    const joItems = directJOForm.items.map(item => ({
      description: item.description,
      rate: parseFloat(item.rate) || 0,
      quantity: parseInt(item.quantity) || 1,
      issueQuantity: 0,
      status: 'pending'
    }));

    const totalQty = joItems.reduce((acc, it) => acc + it.quantity, 0);
    const primaryRate = joItems[0]?.rate || 0;

    try {
      await createJO({
        quotationId: null,
        customerName: directJOForm.customerName,
        jobDescription: directJOForm.jobDescription,
        phone: directJOForm.phone || 'N/A',
        email: directJOForm.email || 'N/A',
        rate: primaryRate,
        quantity: totalQty,
        quoteValidity: 'N/A',
        items: joItems,
        extra_charges: directJOForm.extraCharges || []
      });
      toast.success(isID ? 'Job Order berhasil dibuat!' : 'Job Order successfully created!');
      setShowDirectJOModal(false);
      setDirectJOForm({
        customerId: '',
        customerName: '',
        phone: '',
        email: '',
        companyAddress: '',
        jobDescription: '',
        items: [{ description: '', rate: '', quantity: 1 }],
        extraCharges: []
      });
    } catch (err) {
      console.error(err);
      toast.error(isID ? 'Gagal membuat Job Order.' : 'Failed to create Job Order.');
    }
  };

  const handleDispatch = async (joId) => {
    if (!canWrite) return;
    const jo = jobOrders.find(j => j.id === joId);
    if (!jo) return;

    if (Array.isArray(jo.items) && jo.items.length > 0) {
      const selectedMap = selectedDispatchItems[joId] || {};
      const selectedIndices = jo.items.map((item, idx) => {
        const isItemPending = item.status === 'pending' || !item.status;
        const isChecked = selectedMap[idx] ?? isItemPending;
        return isChecked && isItemPending ? idx : null;
      }).filter(v => v !== null);

      if (selectedIndices.length === 0) {
        toast.error(isID ? 'Pilih setidaknya satu aktivitas!' : 'Select at least one activity!');
        return;
      }

      const updatedItems = jo.items.map((item, idx) => {
        const isItemPending = item.status === 'pending' || !item.status;
        const isChecked = selectedMap[idx] ?? isItemPending;
        if (isChecked && isItemPending) {
          const qty = dispatchQuantities[joId]?.[idx] || item.quantity || 1;
          return {
            ...item,
            issueQuantity: parseInt(qty, 10),
            status: 'dispatched'
          };
        }
        return item;
      });

      await dispatchJO(joId, null, updatedItems);
    } else {
      const qty = quantities[joId] || jo.quantity || 1;
      await dispatchJO(joId, parseInt(qty, 10));
    }

    toast.success(isID ? 'Job Order berhasil dikirim ke Pelaksana!' : 'Job Order dispatched to Executor!');
  };

  const handleDispatchAll = async (group) => {
    if (!canWrite) return;
    confirm.show({
      message: isID 
        ? `Kirim semua ${group.jobOrders.length} JO untuk ${group.customerName}?` 
        : `Dispatch all ${group.jobOrders.length} JOs for ${group.customerName}?`,
      title: isID ? "Kirim Semua JO" : "Dispatch All JOs",
      confirmText: isID ? "Kirim" : "Dispatch",
      onConfirm: async () => {
        for (const jo of group.jobOrders) {
          if (Array.isArray(jo.items) && jo.items.length > 0) {
            const updatedItems = jo.items.map(item => {
              if (item.status === 'pending' || !item.status) {
                return {
                  ...item,
                  issueQuantity: item.quantity || 1,
                  status: 'dispatched'
                };
              }
              return item;
            });
            await dispatchJO(jo.id, null, updatedItems);
          } else {
            const qty = quantities[jo.id] || jo.quantity || 1;
            await dispatchJO(jo.id, parseInt(qty));
          }
        }
        toast.success(isID ? 'Semua Job Order berhasil dikirim ke Pelaksana!' : 'All Job Orders dispatched to Executor!');
      }
    });
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
              <h3 style={{color:'var(--danger)',marginBottom:'8px'}}>{isID ? 'Hapus Purchase Order?' : 'Delete Purchase Order?'}</h3>
              <p style={{color:'var(--text-muted)',marginBottom:'25px'}}>{isID ? 'PO ' : 'PO '}<strong style={{color:'var(--text)'}}>{deletePOConfirm.id}</strong>{isID ? ' akan dihapus permanen.' : ' will be permanently deleted.'}</p>
              <div style={{display: 'flex', flexWrap: 'wrap',gap:'12px'}}>
                <button className="btn" style={{flex:1,background:'rgba(255,255,255,0.05)',border:'1px solid var(--border)',color:'var(--text)'}} onClick={()=>setDeletePOConfirm(null)}>{isID ? 'Batal' : 'Cancel'}</button>
                <ButtonWithLoading className="btn" style={{flex:1,background:'var(--danger)',color:'white',border:'none'}} onClick={async()=>{if (!canWrite) return; await deletePurchaseOrder(deletePOConfirm.id);setDeletePOConfirm(null);}}>{isID ? 'Hapus' : 'Delete'}</ButtonWithLoading>
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
              <h3 style={{color:'var(--danger)',marginBottom:'8px'}}>{isID ? 'Batalkan / Hapus Job Order?' : 'Cancel / Delete Job Order?'}</h3>
              <p style={{color:'var(--text-muted)',marginBottom:'25px'}}>{isID ? 'Job Order draft ' : 'Draft Job Order '}<strong style={{color:'var(--text)'}}>{deleteJOConfirm.id}</strong> ({deleteJOConfirm.customerName}){isID ? ' akan dihapus permanen.' : ' will be permanently deleted.'}</p>
              <div style={{display: 'flex', flexWrap: 'wrap',gap:'12px'}}>
                <button className="btn" style={{flex:1,background:'rgba(255,255,255,0.05)',border:'1px solid var(--border)',color:'var(--text)'}} onClick={()=>setDeleteJOConfirm(null)}>{isID ? 'Batal' : 'Cancel'}</button>
                <ButtonWithLoading className="btn" style={{flex:1,background:'var(--danger)',color:'white',border:'none'}} onClick={async()=>{if (!canWrite) return; await context.deleteJO(deleteJOConfirm.id);setDeleteJOConfirm(null);}}>{isID ? 'Hapus Draft' : 'Delete Draft'}</ButtonWithLoading>
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
                    <div style={{padding:'15px',background:'rgba(212,175,55,0.06)',border:'1px solid var(--secondary-border)',borderRadius:'10px',marginBottom:'20px',fontSize:'0.875rem'}}>
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
                          <FormattedNumberInput value={item.qty} onChange={e=>updatePOItem(i,'qty',e.target.value)} style={{padding:'9px',background:'var(--input-bg)',border:'1px solid var(--border)',borderRadius:'8px',color:'var(--text)',fontSize:'0.85rem',textAlign:'center'}}/>
                          <div style={{padding:'9px',background:'rgba(255,255,255,0.03)',border:'1px solid var(--glass-border)',borderRadius:'8px',fontSize:'0.85rem',fontWeight:'700',color:'var(--secondary)',textAlign:'right'}}>{svc?`Rp ${sub.toLocaleString('id-ID')}`:'Rp 0'}</div>
                          <button type="button" onClick={()=>removePOItem(i)} disabled={poItems.length===1} style={{background:'var(--danger-bg)',color:'var(--danger)',border:'none',borderRadius:'8px',height:'36px',cursor:'pointer',display: 'flex', flexWrap: 'wrap',alignItems:'center',justifyContent:'center'}}><X size={13}/></button>
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
                    style={{flex:1.5,background:'var(--secondary-bg)',color:'var(--secondary)',border:'1px solid var(--secondary)'}}
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
        {canWrite && (
          <div style={{display: 'flex', flexWrap: 'wrap',gap:'10px'}}>
            <button 
              className="btn btn-gold" 
              style={{ padding: '10px 22px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', borderRadius: '12px', fontWeight: '700', boxShadow: '0 4px 15px var(--secondary-border)' }} 
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
            <button 
              className="btn" 
              style={{ 
                background: theme === 'light' ? 'rgba(6, 95, 70, 0.08)' : 'rgba(255, 255, 255, 0.05)', 
                color: 'var(--text)', 
                border: theme === 'light' ? '1px solid rgba(6, 95, 70, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)', 
                padding: '10px 22px', 
                display: 'flex', 
                flexWrap: 'wrap', 
                alignItems: 'center', 
                gap: '8px', 
                borderRadius: '12px', 
                fontWeight: '700' 
              }} 
              onClick={() => {
                setShowDirectJOModal(true);
              }}
            >
              <Plus size={18} />
              {isID ? 'JO Tanpa Penawaran' : 'JO (No Quotation)'}
            </button>
            <button 
              className="btn btn-danger" 
              style={{ padding: '10px 22px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', borderRadius: '12px', fontWeight: '700' }}
              onClick={() => {
                setShowConverterModal(true);
              }}
            >
              <RefreshCw size={18} /> {isID ? 'Konverter Legacy' : 'Legacy Converter'}
            </button>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="glass-card flex-responsive-row" style={{ padding: "20px 25px", alignItems: "center", background: "rgba(255,255,255,0.03)", justifyContent: "space-between", gap: "15px", overflowX: "auto" }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <input type="text" placeholder={isID ? "Cari PO atau JO..." : "Search PO or JO..."} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '10px 15px 10px 40px', borderRadius: '10px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{isID ? 'Urutkan:' : 'Sort:'}</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
          >
            <option value="created_desc">{isID ? 'Tanggal Pembuatan (Terbaru)' : 'Creation Date (Newest)'}</option>
            <option value="created_asc">{isID ? 'Tanggal Pembuatan (Terlama)' : 'Creation Date (Oldest)'}</option>
            <option value="company_asc">{isID ? 'Nama Perusahaan (A-Z)' : 'Company Name (A-Z)'}</option>
            <option value="company_desc">{isID ? 'Nama Perusahaan (Z-A)' : 'Company Name (Z-A)'}</option>
            <option value="id_asc">{isID ? 'JO ID (Asc)' : 'JO ID (Asc)'}</option>
            <option value="id_desc">{isID ? 'JO ID (Desc)' : 'JO ID (Desc)'}</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>{isID ? 'Filter Tanggal:' : 'Date Filter:'}</span>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.85rem' }} />
          <span style={{ color: 'var(--text-muted)' }}>{isID ? 's/d' : 'to'}</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.85rem' }} />
          {(startDate || endDate || searchTerm) && (
            <button onClick={() => { setStartDate(''); setEndDate(''); setSearchTerm(''); }} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600' }}>Reset</button>
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
              className="glass-card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '40px', position: 'relative'  , overflowX: 'auto' }}
            >
              <button onClick={() => { setShowModal(false); setQuoteJOExtraCharges([]); }} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
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

                      const quote = approvedQuotes.find(q => q.id === qId);
                      if (quote) {
                        const availableItems = getAvailableItems(quote, jobOrders);
                        const defaultQty = availableItems.length > 0 ? (availableItems[0].quantity || 1) : (quote.quantity || 1);
                        setIssueQuantity(parseInt(defaultQty));
                        
                        // Initialize selected activities
                        const initialSelected = {};
                        availableItems.forEach((item) => {
                          if (item.originalIndex !== -1) {
                            initialSelected[item.originalIndex] = { selected: true, quantity: parseInt(item.quantity || 1) };
                          }
                        });
                        setSelectedActivities(initialSelected);
                      } else {
                        setSelectedActivities({});
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
                      .filter(q => getAvailableItems(q, jobOrders).length > 0)
                      .filter(q => {
                        const availableItems = getAvailableItems(q, jobOrders);
                        const matchTerm = quoteSearchTerm.toLowerCase();
                        const idMatch = q.id.toLowerCase().includes(matchTerm);
                        const customerMatch = q.customerName.toLowerCase().includes(matchTerm);
                        const descriptionMatch = availableItems.some(item => 
                          (item.description || '').toLowerCase().includes(matchTerm)
                        ) || (q.jobDescription || '').toLowerCase().includes(matchTerm);
                        return idMatch || customerMatch || descriptionMatch;
                      })
                      .map(quote => {
                        const availableItems = getAvailableItems(quote, jobOrders);
                        const label = availableItems.length > 0
                          ? availableItems[0].description
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
                  if (!q) return null;
                  const availableItems = getAvailableItems(q, jobOrders);
                  const hasItems = q.items && q.items.length > 0;

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    >
                      {hasItems ? (
                        <div style={{ marginBottom: '25px' }}>
                          <label style={{ marginBottom: '12px', display: 'block', fontWeight: '600' }}>
                            {isID ? 'Pilih Aktivitas untuk Di-issue' : 'Select Activities to Issue'}
                          </label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {availableItems.map((item) => {
                              const idx = item.originalIndex;
                              const isChecked = !!selectedActivities[idx]?.selected;
                              const currentQty = selectedActivities[idx]?.quantity || item.quantity || 1;
                              return (
                                <div key={idx} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '15px', padding: '15px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      setSelectedActivities(prev => ({
                                        ...prev,
                                        [idx]: {
                                          ...prev[idx],
                                          selected: e.target.checked
                                        }
                                      }));
                                    }}
                                    style={{ width: '20px', height: '20px', accentColor: 'var(--secondary)', cursor: 'pointer' }}
                                  />
                                  <div style={{ flex: 1, minWidth: '150px' }}>
                                    <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{item.description}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                      {isID ? 'Kontrak:' : 'Contract:'} {item.quantity} {item.unit || 'unit'} | Rp {parseFloat(item.rate || 0).toLocaleString()}
                                    </div>
                                  </div>
                                  <div style={{ width: '120px' }}>
                                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                      {isID ? 'Jumlah Issue:' : 'Issue Qty:'}
                                    </label>
                                    <FormattedNumberInput value={currentQty} disabled={!isChecked}
                                      onChange={(e) => {
                                        setSelectedActivities(prev => ({
                                          ...prev,
                                          [idx]: {
                                            ...prev[idx],
                                            quantity: parseInt(e.target.value) || 1
                                          }
                                        }));
                                      }}
                                      style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.9rem', fontWeight: '700' }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="input-group" style={{ marginBottom: '25px' }}>
                          <label style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                            <span>{isID ? 'Jumlah yang Dikeluarkan' : 'Quantity to Issue'}</span>
                            <span style={{ color: 'var(--secondary)', fontSize: '0.75rem' }}>
                              {isID ? 'Maks Kontrak: ' : 'Contract Max: '}{q.quantity || 1}
                            </span>
                          </label>
                          <FormattedNumberInput required value={issueQuantity} onChange={e => setIssueQuantity(e.target.value)}
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
                      )}

                      <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '30px', border: '1px dashed var(--border)' }}>
                        <div style={{ marginBottom: '10px' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{isID ? 'Pelanggan:' : 'Customer:'}</span>
                          <div style={{ fontWeight: '600' }}>{q.customerName}</div>
                        </div>
                        {q.companyAddress && (
                          <div style={{ marginBottom: '10px' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{isID ? 'Alamat Perusahaan:' : 'Company Address:'}</span>
                            <div style={{ fontSize: '0.9rem' }}>{q.companyAddress}</div>
                          </div>
                        )}
                        {!hasItems && (
                          <div style={{ marginBottom: '10px' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{isID ? 'Deskripsi:' : 'Description:'}</span>
                            <div style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{q.jobDescription}</div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })()}

                <div style={{ marginBottom: '25px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <label style={{ fontWeight: 'bold', margin: 0 }}>{isID ? 'Biaya Tambahan (Extra Charges)' : 'Extra Charges'}</label>
                    <button 
                      type="button"
                      onClick={() => setQuoteJOExtraCharges(prev => [...prev, { description: '', rate: '', quantity: 1 }])}
                      className="btn"
                      style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--secondary-bg)', color: 'var(--secondary)', border: '1px solid var(--secondary)' }}
                    >
                      + {isID ? 'Tambah Biaya' : 'Add Cost'}
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {quoteJOExtraCharges.map((ec, idx) => (
                      <div key={idx} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <div style={{ flex: 2, minWidth: '150px' }}>
                          <input
                            type="text"
                            required
                            placeholder={isID ? "Deskripsi Biaya" : "Description"}
                            value={ec.description}
                            onChange={e => {
                              const next = [...quoteJOExtraCharges];
                              next[idx].description = e.target.value;
                              setQuoteJOExtraCharges(next);
                            }}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: '100px' }}>
                          <FormattedNumberInput required placeholder={isID ? "Harga Satuan" : "Unit Rate"} value={ec.rate}
                            onChange={e => {
                              const next = [...quoteJOExtraCharges];
                              next[idx].rate = e.target.value;
                              setQuoteJOExtraCharges(next);
                            }}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div style={{ width: '80px' }}>
                          <FormattedNumberInput required placeholder={isID ? "Jumlah" : "Qty"} value={ec.quantity}
                            onChange={e => {
                              const next = [...quoteJOExtraCharges];
                              next[idx].quantity = parseInt(e.target.value) || 1;
                              setQuoteJOExtraCharges(next);
                            }}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.85rem' }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setQuoteJOExtraCharges(quoteJOExtraCharges.filter((_, i) => i !== idx));
                          }}
                          style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {quoteJOExtraCharges.length === 0 && (
                      <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '10px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', margin: 0 }}>
                        {isID ? 'Tidak ada biaya tambahan' : 'No extra charges'}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                  <button type="button" onClick={() => { setShowModal(false); setQuoteJOExtraCharges([]); }} className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'var(--text)', border: '1px solid var(--border)' }}>
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

        {showDirectJOModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 1000,
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
          }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '40px', position: 'relative', overflowX: 'auto' }}
            >
              <button onClick={() => { setShowDirectJOModal(false); setDirectJOForm({ customerId: '', customerName: '', phone: '', email: '', companyAddress: '', jobDescription: '', items: [{ description: '', rate: '', quantity: 1 }], extraCharges: [] }); }} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>

              <h3 style={{ marginBottom: '25px', color: 'var(--secondary)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                <FileText size={24} />
                {isID ? 'Job Order Baru (Tanpa Penawaran)' : 'New Job Order (No Quotation)'}
              </h3>

              <form onSubmit={handleDirectJOSubmit}>
                <div className="input-group" style={{ marginBottom: '20px' }}>
                  <label>{isID ? 'Pilih Pelanggan' : 'Select Customer'}</label>
                  <select
                    value={directJOForm.customerId}
                    onChange={e => {
                      const custId = e.target.value;
                      if (custId === '') {
                        setDirectJOForm(prev => ({
                          ...prev,
                          customerId: '',
                          customerName: '',
                          phone: '',
                          email: '',
                          companyAddress: ''
                        }));
                      } else {
                        const selectedCust = customers.find(c => c.id === custId);
                        if (selectedCust) {
                          setDirectJOForm(prev => ({
                            ...prev,
                            customerId: custId,
                            customerName: selectedCust.name || '',
                            phone: selectedCust.phone || '',
                            email: selectedCust.email || '',
                            companyAddress: selectedCust.address || ''
                          }));
                        }
                      }
                    }}
                    style={{ 
                      width: '100%', 
                      padding: '10px 15px', 
                      borderRadius: '10px', 
                      background: 'var(--input-bg)', 
                      border: '1px solid var(--border)', 
                      color: 'var(--text)',
                      fontSize: '0.9rem',
                      marginBottom: '15px'
                    }}
                  >
                    <option value="">-- {isID ? 'Pilih Pelanggan Terdaftar / Input Manual' : 'Select Registered Customer / Manual Input'} --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group" style={{ marginBottom: '20px' }}>
                  <label>{isID ? 'Nama Pelanggan' : 'Customer Name'} *</label>
                  <input
                    type="text"
                    required
                    value={directJOForm.customerName}
                    onChange={e => setDirectJOForm(prev => ({ ...prev, customerName: e.target.value }))}
                    style={{ width: '100%', padding: '10px 15px', borderRadius: '10px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.9rem' }}
                  />
                </div>

                <div className="grid-responsive-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                  <div className="input-group">
                    <label>{isID ? 'Telepon' : 'Phone'}</label>
                    <input
                      type="text"
                      value={directJOForm.phone}
                      onChange={e => setDirectJOForm(prev => ({ ...prev, phone: e.target.value }))}
                      style={{ width: '100%', padding: '10px 15px', borderRadius: '10px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div className="input-group">
                    <label>{isID ? 'Email' : 'Email'}</label>
                    <input
                      type="email"
                      value={directJOForm.email}
                      onChange={e => setDirectJOForm(prev => ({ ...prev, email: e.target.value }))}
                      style={{ width: '100%', padding: '10px 15px', borderRadius: '10px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                <div className="input-group" style={{ marginBottom: '20px' }}>
                  <label>{isID ? 'Alamat Perusahaan' : 'Company Address'}</label>
                  <textarea
                    value={directJOForm.companyAddress}
                    onChange={e => setDirectJOForm(prev => ({ ...prev, companyAddress: e.target.value }))}
                    rows="2"
                    style={{ width: '100%', padding: '10px 15px', borderRadius: '10px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.9rem', resize: 'vertical' }}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: '20px' }}>
                  <label>{isID ? 'Instruksi Pekerjaan / Deskripsi' : 'Job Instruction / Description'} *</label>
                  <textarea
                    required
                    value={directJOForm.jobDescription}
                    onChange={e => setDirectJOForm(prev => ({ ...prev, jobDescription: e.target.value }))}
                    rows="3"
                    style={{ width: '100%', padding: '10px 15px', borderRadius: '10px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.9rem', resize: 'vertical' }}
                    placeholder={isID ? "Masukkan rincian pekerjaan..." : "Enter job details..."}
                  />
                </div>

                <div style={{ marginBottom: '25px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>{isID ? 'Item Pekerjaan' : 'Job Items'}</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {directJOForm.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <div style={{ flex: 2, minWidth: '150px' }}>
                          <input
                            type="text"
                            required
                            placeholder={isID ? "Deskripsi Item" : "Item Description"}
                            value={item.description}
                            onChange={e => {
                              const newItems = [...directJOForm.items];
                              newItems[idx].description = e.target.value;
                              setDirectJOForm(prev => ({ ...prev, items: newItems }));
                            }}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: '100px' }}>
                          <FormattedNumberInput required placeholder={isID ? "Harga Satuan" : "Unit Rate"} value={item.rate}
                            onChange={e => {
                              const newItems = [...directJOForm.items];
                              newItems[idx].rate = e.target.value;
                              setDirectJOForm(prev => ({ ...prev, items: newItems }));
                            }}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div style={{ width: '80px' }}>
                          <FormattedNumberInput required placeholder={isID ? "Jumlah" : "Qty"} value={item.quantity}
                            onChange={e => {
                              const newItems = [...directJOForm.items];
                              newItems[idx].quantity = parseInt(e.target.value) || 1;
                              setDirectJOForm(prev => ({ ...prev, items: newItems }));
                            }}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.85rem' }}
                          />
                        </div>
                        {directJOForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newItems = directJOForm.items.filter((_, i) => i !== idx);
                              setDirectJOForm(prev => ({ ...prev, items: newItems }));
                            }}
                            style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDirectJOForm(prev => ({
                        ...prev,
                        items: [...prev.items, { description: '', rate: '', quantity: 1 }]
                      }));
                    }}
                    className="btn"
                    style={{ marginTop: '10px', background: 'rgba(255,255,255,0.05)', border: '1px dashed var(--border)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', width: '100%', justifyContent: 'center', padding: '8px' }}
                  >
                    <Plus size={16} /> {isID ? 'Tambah Item' : 'Add Item'}
                  </button>
                </div>

                <div style={{ marginBottom: '25px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <label style={{ fontWeight: 'bold', margin: 0 }}>{isID ? 'Biaya Tambahan (Extra Charges)' : 'Extra Charges'}</label>
                    <button 
                      type="button"
                      onClick={() => setDirectJOForm(prev => ({ ...prev, extraCharges: [...(prev.extraCharges || []), { description: '', rate: '', quantity: 1 }] }))}
                      className="btn"
                      style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--secondary-bg)', color: 'var(--secondary)', border: '1px solid var(--secondary)' }}
                    >
                      + {isID ? 'Tambah Biaya' : 'Add Cost'}
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(directJOForm.extraCharges || []).map((ec, idx) => (
                      <div key={idx} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <div style={{ flex: 2, minWidth: '150px' }}>
                          <input
                            type="text"
                            required
                            placeholder={isID ? "Deskripsi Biaya" : "Description"}
                            value={ec.description}
                            onChange={e => {
                              const next = [...directJOForm.extraCharges];
                              next[idx].description = e.target.value;
                              setDirectJOForm(prev => ({ ...prev, extraCharges: next }));
                            }}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: '100px' }}>
                          <FormattedNumberInput required placeholder={isID ? "Harga Satuan" : "Unit Rate"} value={ec.rate}
                            onChange={e => {
                              const next = [...directJOForm.extraCharges];
                              next[idx].rate = e.target.value;
                              setDirectJOForm(prev => ({ ...prev, extraCharges: next }));
                            }}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div style={{ width: '80px' }}>
                          <FormattedNumberInput required placeholder={isID ? "Jumlah" : "Qty"} value={ec.quantity}
                            onChange={e => {
                              const next = [...directJOForm.extraCharges];
                              next[idx].quantity = parseInt(e.target.value) || 1;
                              setDirectJOForm(prev => ({ ...prev, extraCharges: next }));
                            }}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.85rem' }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const next = directJOForm.extraCharges.filter((_, i) => i !== idx);
                            setDirectJOForm(prev => ({ ...prev, extraCharges: next }));
                          }}
                          style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {(directJOForm.extraCharges || []).length === 0 && (
                      <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '10px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', margin: 0 }}>
                        {isID ? 'Tidak ada biaya tambahan' : 'No extra charges'}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                  <button type="button" onClick={() => { setShowDirectJOModal(false); setDirectJOForm({ customerId: '', customerName: '', phone: '', email: '', companyAddress: '', jobDescription: '', items: [{ description: '', rate: '', quantity: 1 }], extraCharges: [] }); }} className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                    {isID ? 'Batal' : 'Cancel'}
                  </button>
                  <ButtonWithLoading type="submit" className="btn btn-gold" style={{ flex: 1 }}>
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
                      {canWrite && (
                        <button className="btn-icon" onClick={() => handleEditPO(po)} title={isID ? "Ubah PO" : "Edit PO"} style={{ color: 'var(--info)', background: 'var(--info-bg)' }}>
                          <Edit size={15} />
                        </button>
                      )}
                      <button className="btn-icon" onClick={() => setPrintPO(po)} title={isID ? "Cetak PO" : "Print PO"} style={{ color: 'var(--secondary)', background: 'var(--secondary-bg)' }}>
                        <FileText size={15} />
                      </button>
                      {canWrite && po.status !== 'issued' && (
                        <ButtonWithLoading className="btn-icon" onClick={() => issuePurchaseOrder(po.id)} title={isID ? "Terbitkan PO" : "Issue PO"} style={{ color: 'var(--success)', background: 'var(--success-bg)' }}>
                          <CheckCircle size={15} />
                        </ButtonWithLoading>
                      )}
                      {canWrite && (
                        <button className="btn-icon" onClick={() => setDeletePOConfirm(po)} title={isID ? "Hapus PO" : "Delete PO"} style={{ color: 'var(--danger)', background: 'var(--danger-bg)' }}>
                          <Trash2 size={15} />
                        </button>
                      )}
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

      <div className="glass-card" style={{ padding: '25px', marginTop: '30px', overflowX: 'auto' }}>
        <h4 style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Folder size={20} style={{ color: 'var(--secondary)' }} />
          {isID ? 'Job Order Draft (Grup Penawaran)' : 'Job Order Drafts (Grouped by Quotation)'}
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
          {(() => {
            const filteredPendingJOs = jobOrders
              .filter(jo => jo.status === 'pending')
              .filter(jo => filterByDate(jo.date))
              .filter(jo => {
                const id = jo.id || '';
                const name = jo.customerName || '';
                const term = searchTerm.toLowerCase();
                return id.toLowerCase().includes(term) || name.toLowerCase().includes(term);
              });

            const joGroups = {};
            filteredPendingJOs.forEach(jo => {
              const qId = jo.quotationId || 'no-quotation';
              if (!joGroups[qId]) {
                const quote = quotations.find(q => q.id === qId);
                joGroups[qId] = {
                  quotationId: qId,
                  customerName: quote ? quote.customerName : jo.customerName,
                  date: quote ? quote.date : jo.date,
                  jobOrders: []
                };
              }
              joGroups[qId].jobOrders.push(jo);
            });

            const joGroupsArray = Object.values(joGroups).sort((a, b) => {
              const timeA = a.date ? new Date(a.date).getTime() : 0;
              const timeB = b.date ? new Date(b.date).getTime() : 0;
              return timeB - timeA;
            });

            if (joGroupsArray.length === 0) {
              return (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                  {isID ? 'Belum ada form JO draft.' : 'No JO forms drafted yet.'}
                </div>
              );
            }

            return joGroupsArray.map(group => (
              <div key={group.quotationId} className="glass-card" style={{ padding: '25px', border: '1px solid var(--secondary)', background: 'rgba(6, 95, 70, 0.03)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px', marginBottom: '20px', gap: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FolderOpen size={24} style={{ color: 'var(--secondary)' }} />
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                        {isID ? 'RUJUKAN PENAWARAN' : 'QUOTATION REFERENCE'}
                      </span>
                      <strong style={{ color: 'var(--secondary)', fontSize: '1rem' }}>{group.quotationId}</strong>
                      <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>|</span>
                      <strong style={{ fontSize: '1rem' }}>{group.customerName}</strong>
                    </div>
                  </div>
                  {canWrite && (
                    <ButtonWithLoading 
                      className="btn btn-gold" 
                      style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                      onClick={() => handleDispatchAll(group)}
                    >
                      <Send size={15} />
                      {isID ? 'Kirim Semua JO' : 'Dispatch All JOs'} ({group.jobOrders.length})
                    </ButtonWithLoading>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '20px' }}>
                  {group.jobOrders.map(jo => (
                    <div key={jo.id} style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontWeight: '700', color: 'var(--secondary)', fontSize: '0.85rem' }}>{jo.id}</span>
                          {canWrite && (
                            <button 
                              className="btn-icon" 
                              style={{ color: 'var(--danger)', background: 'var(--danger-bg)', width: '28px', height: '28px' }} 
                              onClick={() => setDeleteJOConfirm(jo)}
                              title={isID ? "Hapus Draft JO" : "Delete Draft JO"}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                        
                        {Array.isArray(jo.items) && jo.items.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '15px' }}>
                            {jo.items.map((item, idx) => {
                              const isItemPending = item.status === 'pending' || !item.status;
                              const isChecked = selectedDispatchItems[jo.id]?.[idx] ?? isItemPending;
                              const qtyVal = dispatchQuantities[jo.id]?.[idx] ?? item.quantity ?? 1;

                              return (
                                <div key={idx} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {isItemPending ? (
                                      <input 
                                        type="checkbox" 
                                        checked={isChecked}
                                        disabled={!canWrite}
                                        onChange={(e) => {
                                          const currentJoMap = selectedDispatchItems[jo.id] || {};
                                          setSelectedDispatchItems({
                                            ...selectedDispatchItems,
                                            [jo.id]: {
                                              ...currentJoMap,
                                              [idx]: e.target.checked
                                            }
                                          });
                                        }}
                                      />
                                    ) : (
                                      <span style={{ fontSize: '0.7rem' }} className={`badge badge-${item.status}`}>
                                        {item.status}
                                      </span>
                                    )}
                                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: isItemPending ? 'var(--text)' : 'var(--text-muted)' }}>
                                      {item.description}
                                    </span>
                                  </div>

                                  {isItemPending && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '22px' }}>
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {isID ? `Kontrak: ${item.quantity} Unit` : `Contract: ${item.quantity} Units`}
                                      </span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{isID ? 'Kirim:' : 'Dispatch:'}</span>
                                        <FormattedNumberInput disabled={!canWrite} value={qtyVal}
                                          onChange={(e) => {
                                            const currentQtyMap = dispatchQuantities[jo.id] || {};
                                            setDispatchQuantities({
                                              ...dispatchQuantities,
                                              [jo.id]: {
                                                ...currentQtyMap,
                                                [idx]: e.target.value
                                              }
                                            });
                                          }}
                                          style={{ width: '60px', padding: '3px 6px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)' }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '15px', minHeight: '35px', fontWeight: '500' }}>
                            {jo.jobDescription}
                          </p>
                        )}
                      </div>

                      <div>
                        {(!jo.items || jo.items.length === 0) && (
                          <div className="input-group" style={{ marginBottom: '15px' }}>
                            <label style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'block' }}>{isID ? 'Jumlah Pekerjaan (Unit)' : 'Work Quantity (Units)'}</label>
                            <FormattedNumberInput disabled={!canWrite} value={quantities[jo.id] || jo.quantity || ''}
                              onChange={e => setQuantities({ ...quantities, [jo.id]: e.target.value })}
                              placeholder={isID ? "Masukkan jumlah..." : "Enter quantity..."}
                              style={{ borderRadius: '8px', padding: '6px 12px', fontSize: '0.9rem' }}
                            />
                          </div>
                        )}
                        {canWrite && (
                          <ButtonWithLoading 
                            className="btn btn-gold" 
                            style={{ width: '100%', padding: '8px 12px', fontSize: '0.8rem' }} 
                            onClick={() => handleDispatch(jo.id)}
                          >
                            <Send size={14} />
                            {isID ? 'Kirim ke Pelaksana' : 'Dispatch'}
                          </ButtonWithLoading>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Legacy Converter List Modal */}
      {showConverterModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '900px', padding: '30px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '15px' }}>
              <h3 style={{ color: 'var(--secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><RefreshCw size={20} /> {isID ? 'Konverter Legacy Job Order' : 'Legacy Job Order Converter'}</h3>
              <button onClick={() => setShowConverterModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
              {isID ? 'Daftar di bawah menunjukkan Quotation yang memiliki beberapa Job Order terpisah. Anda dapat menggabungkannya menjadi satu Job Order multi-item baru untuk menyederhanakan tracking operasional, costing, dan invoicing.' : 'The list below displays Quotations that have multiple separate legacy Job Orders. You can merge them into a single consolidated multi-item Job Order to simplify operational, costing, and billing tracking.'}
            </p>

            {batchProgress && (
              <div style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid var(--secondary)', color: 'var(--secondary)', padding: '12px 20px', borderRadius: '8px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                <span className="spinner-border spinner-border-sm" style={{ border: '2px solid', borderTopColor: 'transparent', borderRadius: '50%', width: '16px', height: '16px', display: 'inline-block', animation: 'spin 1s linear infinite' }}></span>
                {batchProgress}
              </div>
            )}

            {selectedGroupKeys.size > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.2)', padding: '12px 20px', borderRadius: '10px', marginBottom: '15px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>
                  {isID 
                    ? `Terpilih ${selectedGroupKeys.size} item untuk dikonversi` 
                    : `Selected ${selectedGroupKeys.size} items to convert`}
                </span>
                <button 
                  className="btn btn-danger" 
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  onClick={handleBatchConvert}
                  disabled={batchConverting}
                >
                  {batchConverting 
                    ? (batchProgress || (isID ? 'Memproses...' : 'Processing...'))
                    : (isID ? `Konversi Sekaligus (${selectedGroupKeys.size})` : `Batch Convert (${selectedGroupKeys.size})`)}
                </button>
              </div>
            )}

            {legacyGroups.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                🎉 {isID ? 'Semua data Job Order sudah menggunakan format baru!' : 'All Job Order data is already in the new format!'}
              </div>
            ) : (
              <div className="table-container">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '12px', width: '40px', textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedGroupKeys.size > 0 && selectedGroupKeys.size === legacyGroups.length}
                          onChange={toggleAllGroups}
                          disabled={batchConverting}
                        />
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)' }}>QUO ID</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{isID ? 'PELANGGAN' : 'CUSTOMER'}</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{isID ? 'JUMLAH JO SEPARASI' : 'SEPARATED JO COUNT'}</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{isID ? 'AKSI' : 'ACTION'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {legacyGroups.map((group, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={selectedGroupKeys.has(group.groupId)}
                            onChange={() => toggleGroupSelection(group.groupId)}
                            disabled={batchConverting}
                          />
                        </td>
                        <td style={{ padding: '12px', fontWeight: '700' }}>{group.quotationId}</td>
                        <td style={{ padding: '12px' }}>{group.customerName}</td>
                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: '800', color: 'var(--warning)' }}>{group.jobOrders.length}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            onClick={() => setSelectedConvertGroup(group)}
                            disabled={batchConverting}
                          >
                            {isID ? 'Gabungkan & Konversi' : 'Merge & Convert'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legacy Converter Details Modal */}
      {selectedConvertGroup && (() => {
        const jos = selectedConvertGroup.jobOrders;
        const primaryJo = jos[0];
        const joIdsToDelete = jos.slice(1).map(j => j.id);
        
        const compiledItems = [];
        jos.forEach(jo => {
          if (Array.isArray(jo.items) && jo.items.length > 0) {
            jo.items.forEach(it => {
              compiledItems.push({
                description: it.description || jo.instruction || jo.jobDescription || 'Freight Forwarding Services',
                qty: parseInt(it.issueQuantity || it.quantity || jo.issueQuantity || jo.quantity || 1, 10),
                rate: parseFloat(it.rate || jo.rate || 0),
                status: it.status || jo.status || 'pending',
                containerNo: Array.isArray(it.containerNo) ? it.containerNo : (jo.containerNo ? [jo.containerNo] : []),
                vehicleNo: Array.isArray(it.vehicleNo) ? it.vehicleNo : (jo.vehicleNo ? [jo.vehicleNo] : []),
                driverName: Array.isArray(it.driverName) ? it.driverName : (jo.driverName ? [jo.driverName] : [])
              });
            });
          } else {
            compiledItems.push({
              description: jo.instruction || jo.jobDescription || 'Freight Forwarding Services',
              qty: parseInt(jo.issueQuantity || jo.quantity || 1, 10),
              rate: parseFloat(jo.rate || 0),
              status: jo.status || 'pending',
              containerNo: Array.isArray(jo.containerNo) ? jo.containerNo : (jo.containerNo ? [jo.containerNo] : []),
              vehicleNo: Array.isArray(jo.vehicleNo) ? jo.vehicleNo : (jo.vehicleNo ? [jo.vehicleNo] : []),
              driverName: Array.isArray(jo.driverName) ? jo.driverName : (jo.driverName ? [jo.driverName] : [])
            });
          }
        });

        const linkedInvoices = invoices.filter(inv => String(inv.joId) === String(primaryJo.id) || joIdsToDelete.includes(inv.joId));
        const linkedPOs = purchaseOrders.filter(po => String(po.joId) === String(primaryJo.id) || joIdsToDelete.includes(po.joId));
        const manualCostsCount = jos.reduce((acc, j) => acc + (Array.isArray(j.costs) ? j.costs.length : 0), 0);
        const photosCount = jos.reduce((acc, j) => acc + (Array.isArray(j.photos) ? j.photos.length : 0), 0);

        const handleConfirmMerge = async () => {
          setConverting(true);
          try {
            await convertLegacyJOs(primaryJo.id, joIdsToDelete, compiledItems);
            toast.success(isID ? 'Job Order berhasil digabungkan!' : 'Job Orders merged successfully!');
            setSelectedConvertGroup(null);
          } catch (err) {
            console.error(err);
            toast.error(isID ? 'Gagal menggabungkan Job Order.' : 'Failed to merge Job Orders.');
          } finally {
            setConverting(false);
          }
        };

        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 10002, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: '850px', padding: '30px', maxHeight: '95vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '15px' }}>
                <h3 style={{ color: 'var(--secondary)', margin: 0 }}>📋 {isID ? 'Detail Penggabungan & Konversi' : 'Merge & Convert Details'}</h3>
                <button onClick={() => setSelectedConvertGroup(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>{isID ? 'Quotation Asal' : 'Quotation Origin'}</p>
                  <p style={{ margin: 0, fontWeight: '800', fontSize: '1.1rem' }}>{selectedConvertGroup.quotationId}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>{isID ? 'Nama Pelanggan' : 'Customer Name'}</p>
                  <p style={{ margin: 0, fontWeight: '800', fontSize: '1.1rem' }}>{selectedConvertGroup.customerName}</p>
                </div>
              </div>

              {/* Legacy JOs to delete */}
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ color: 'var(--danger)', fontSize: '0.9rem', marginBottom: '10px', textTransform: 'uppercase', fontWeight: '800' }}>
                  🚨 {isID ? (jos.length > 1 ? 'Job Order yang Akan Digabungkan' : 'Job Order yang Akan Dikonversi') : (jos.length > 1 ? 'Job Orders to be Merged' : 'Job Order to be Converted')}
                </h4>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '10px', padding: '15px' }}>
                  {jos.map((j, i) => (
                    <div key={j.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < jos.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <div>
                        <span style={{ fontWeight: '700', marginRight: '10px', color: i === 0 ? 'var(--secondary)' : 'var(--text)' }}>{j.id}</span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>({j.instruction || j.jobDescription})</span>
                      </div>
                      <div style={{ display: 'flex', gap: '15px' }}>
                        <span style={{ fontSize: '0.85rem' }}>Qty: <strong>{j.quantity}</strong></span>
                        <span style={{ fontSize: '0.85rem' }}>Status: <strong style={{ color: j.status === 'done' ? 'var(--success)' : 'var(--warning)' }}>{j.status}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Linked Invoices to Remap */}
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ color: 'var(--secondary)', fontSize: '0.9rem', marginBottom: '10px', textTransform: 'uppercase', fontWeight: '800' }}>📄 {isID ? 'Invoice Terkait (Akan Di-remap)' : 'Linked Invoices to be Remapped'}</h4>
                {linkedInvoices.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, paddingLeft: '5px' }}>{isID ? 'Tidak ada invoice terkait.' : 'No associated invoices.'}</p>
                ) : (
                  <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '10px', padding: '15px' }}>
                    {linkedInvoices.map((inv, idx) => (
                      <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: idx < linkedInvoices.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                        <div>
                          <strong style={{ color: 'var(--secondary)', marginRight: '10px' }}>{inv.id}</strong>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>({isID ? 'Asal JO:' : 'Origin JO:'} {inv.joId})</span>
                        </div>
                        <div style={{ display: 'flex', gap: '15px' }}>
                          <span style={{ fontSize: '0.85rem' }}>{isID ? 'Tanggal:' : 'Date:'} {inv.date || '-'}</span>
                          <span style={{ fontSize: '0.85rem' }}>Total: <strong>Rp {parseFloat(inv.amount || inv.subtotal || 0).toLocaleString()}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Linked Purchase Orders to Remap */}
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ color: 'var(--secondary)', fontSize: '0.9rem', marginBottom: '10px', textTransform: 'uppercase', fontWeight: '800' }}>🛒 {isID ? 'Purchase Order Terkait (Akan Di-remap)' : 'Linked Purchase Orders to be Remapped'}</h4>
                {linkedPOs.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, paddingLeft: '5px' }}>{isID ? 'Tidak ada Purchase Order terkait.' : 'No associated Purchase Orders.'}</p>
                ) : (
                  <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '10px', padding: '15px' }}>
                    {linkedPOs.map((po, idx) => (
                      <div key={po.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: idx < linkedPOs.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                        <div>
                          <strong style={{ color: 'var(--secondary)', marginRight: '10px' }}>{po.id}</strong>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>({isID ? 'Asal JO:' : 'Origin JO:'} {po.joId})</span>
                        </div>
                        <div style={{ display: 'flex', gap: '15px' }}>
                          <span style={{ fontSize: '0.85rem' }}>Vendor: <strong>{po.vendorName}</strong></span>
                          <span style={{ fontSize: '0.85rem' }}>Total: <strong>Rp {parseFloat(po.grandTotal || 0).toLocaleString()}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Photos and Manual Costings to aggregate */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '10px', padding: '15px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>💵 {isID ? 'Biaya Manual yang Digabungkan:' : 'Aggregated Manual Costs:'}</span>
                  <strong style={{ fontSize: '1rem', color: 'var(--secondary)' }}>{manualCostsCount} {isID ? 'Biaya' : 'Entries'}</strong>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '10px', padding: '15px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>🖼️ {isID ? 'Foto Operasional yang Digabungkan:' : 'Aggregated Operational Photos:'}</span>
                  <strong style={{ fontSize: '1rem', color: 'var(--secondary)' }}>{photosCount} {isID ? 'Foto' : 'Photos'}</strong>
                </div>
              </div>

              {/* Preview consolidated JO */}
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ color: 'var(--success)', fontSize: '0.9rem', marginBottom: '10px', textTransform: 'uppercase', fontWeight: '800' }}>✨ {isID ? 'Pratinjau Hasil Konsolidasi JO' : 'Consolidated JO Preview'}</h4>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '10px', padding: '15px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{isID ? 'ID Master Job Order (Dipertahankan):' : 'Master Job Order ID (Kept):'} </span>
                    <strong style={{ color: 'var(--secondary)', fontSize: '1rem' }}>{primaryJo.id}</strong>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: '700' }}>{isID ? 'ITEM CONSOLS:' : 'CONSOLIDATED ITEMS:'}</div>
                  {compiledItems.map((item, idx) => (
                    <div key={idx} style={{ padding: '8px', background: 'rgba(255,255,255,0.01)', borderRadius: '5px', marginBottom: '8px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                        <span>{item.description}</span>
                        <span>Qty: {item.qty} | Rate: Rp {item.rate.toLocaleString('id-ID')}</span>
                      </div>
                      {(item.containerNo.length > 0 || item.vehicleNo.length > 0) && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {item.containerNo.length > 0 && `Containers: ${item.containerNo.join(', ')}`}
                          {item.vehicleNo.length > 0 && ` | Vehicles: ${item.vehicleNo.join(', ')}`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                <button className="btn" onClick={() => setSelectedConvertGroup(null)} disabled={converting}>
                  {isID ? 'Batal' : 'Cancel'}
                </button>
                <button className="btn btn-primary" onClick={handleConfirmMerge} disabled={converting}>
                  {converting ? (isID ? 'Memproses...' : 'Processing...') : (isID ? 'Konfirmasi & Gabungkan' : 'Confirm & Merge')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default AdminHub;

