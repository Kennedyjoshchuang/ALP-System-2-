import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Truck, Camera, CheckCircle2, Package, History, PlayCircle, X, Search, FileSpreadsheet, Plus, FileText, Printer, Trash2, Folder, FolderOpen, ChevronDown, ChevronRight, RefreshCw, Receipt, ChevronUp, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToExcel } from '../utils/exportUtils';
import { ButtonWithLoading } from '../components/ButtonWithLoading';
import toast from 'react-hot-toast';

;

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
  const { jobOrders, invoices = [], quotations = [], createInvoice, createCustomInvoice, deleteInvoice, updateJOStatus, completeJO, deleteJO, companyBankAccounts = [], t, language, hasAccess } = useApp();
  const isID = language === 'id';
  const canWrite = hasAccess ? hasAccess('executor', true) : false;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'records' or 'pending_invoices'
  const fileInputRef = useRef(null);
  const [uploadingForId, setUploadingForId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [joToDelete, setJoToDelete] = useState(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [localData, setLocalData] = useState({}); // { [joId]: { containerNo: [], vehicleNo: [], driverName: [], activityStatus: '' } }
  const [expandedGroups, setExpandedGroups] = useState({});
  const [expandedCompletedGroups, setExpandedCompletedGroups] = useState({});
  const [shipmentEdits, setShipmentEdits] = useState({});
  const [savingShipment, setSavingShipment] = useState({});
  const [photoViewer, setPhotoViewer] = useState(null);
  const [issuingInvoiceJoId, setIssuingInvoiceJoId] = useState(null);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [invoiceConfirmData, setInvoiceConfirmData] = useState(null);

  const handleHeaderClick = (columnType) => {
    if (columnType === 'id') {
      setSortBy(prev => prev === 'id_asc' ? 'id_desc' : 'id_asc');
    } else if (columnType === 'company') {
      setSortBy(prev => prev === 'company_asc' ? 'company_desc' : 'company_asc');
    } else if (columnType === 'created') {
      setSortBy(prev => prev === 'created_desc' ? 'created_asc' : 'created_desc');
    }
  };

  const renderSortIndicator = (columnType) => {
    if (columnType === 'id') {
      if (sortBy === 'id_asc') return ' ▲';
      if (sortBy === 'id_desc') return ' ▼';
    } else if (columnType === 'company') {
      if (sortBy === 'company_asc') return ' ▲';
      if (sortBy === 'company_desc') return ' ▼';
    } else if (columnType === 'created') {
      if (sortBy === 'created_asc') return ' ▲';
      if (sortBy === 'created_desc') return ' ▼';
    }
    return '';
  };

  const [tick, setTick] = useState(0);
  React.useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getAssociatedJOs = (invoice) => {
    if (!invoice) return [];
    const primaryJo = jobOrders.find(j => String(j.id) === String(invoice.joId));
    const consolidated = invoice.consolidatedJOs || [];
    if (consolidated.length > 0) {
      return jobOrders.filter(j => consolidated.includes(j.id));
    }
    return primaryJo ? [primaryJo] : [];
  };

  const handleShipmentChange = (joId, field, value) => {
    setShipmentEdits(prev => ({
      ...prev,
      [joId]: {
        ...prev[joId],
        [field]: value
      }
    }));
  };

  const hasShipmentChanges = (joId) => {
    const edit = shipmentEdits[joId];
    if (!edit) return false;
    const jo = jobOrders.find(j => j.id === joId);
    if (!jo) return false;
    return edit.shipmentStatus !== (jo.shipmentStatus || '') ||
      edit.etd !== (jo.etd || '') ||
      edit.eta !== (jo.eta || '');
  };

  const handleSaveShipment = async (joId) => {
    const edit = shipmentEdits[joId];
    if (!edit) return;
    setSavingShipment(prev => ({ ...prev, [joId]: true }));
    try {
      await updateJOStatus(joId, {
        shipmentStatus: edit.shipmentStatus || null,
        etd: edit.etd || null,
        eta: edit.eta || null
      });
      toast.success(isID ? 'Status pengiriman berhasil diperbarui' : 'Shipment status updated successfully');
      setShipmentEdits(prev => {
        const next = { ...prev };
        delete next[joId];
        return next;
      });
    } catch (err) {
      console.error(err);
      toast.error(isID ? 'Gagal memperbarui status pengiriman' : 'Failed to update shipment status');
    } finally {
      setSavingShipment(prev => ({ ...prev, [joId]: false }));
    }
  };

  const handleIssueInvoice = async (joId, bankAccount, notes) => {
    try {
      if (!bankAccount) {
        setIssuingInvoiceJoId(joId);
        setInvoiceNotes('');
        if (companyBankAccounts.length > 0) {
          setSelectedBankId(companyBankAccounts[0].id);
        }
        return;
      }

      const linkedJO = jobOrders.find(j => String(j.id) === String(joId));
      if (!linkedJO) {
        toast.error('Job Order tidak ditemukan.');
        return;
      }

      const linkedQuo = linkedJO.quotationId
        ? quotations.find(q => String(q.id) === String(linkedJO.quotationId))
        : null;

      let targetJOs = [linkedJO];
      if (linkedJO.quotationId) {
        targetJOs = jobOrders.filter(j =>
          String(j.quotationId) === String(linkedJO.quotationId) &&
          (j.status === 'done' || String(j.id) === String(joId)) &&
          j.customerName === linkedJO.customerName
        );
      }

      const cleanNum = (val) => {
        if (typeof val === 'number') return isNaN(val) ? 0 : val;
        if (!val) return 0;
        if (/^\d+(\.\d+)?$/.test(String(val))) return parseFloat(val);
        let str = String(val).replace(/[^\d.,-]/g, '');
        if (str.includes(',') && str.includes('.')) str = str.replace(/\./g, '').replace(/,/g, '.');
        else if (str.includes(',')) str = str.replace(/,/g, '.');
        const parsed = parseFloat(str);
        return isNaN(parsed) ? 0 : parsed;
      };

      const items = [];
      targetJOs.forEach(targetJo => {
        if (Array.isArray(targetJo.items) && targetJo.items.length > 0) {
          // Filter to items that are either done, dispatched or primary JO
          const activeItems = targetJo.items.filter(item => item.status === 'done' || item.status === 'dispatched' || String(targetJo.id) === String(joId));
          activeItems.forEach(item => {
            const qty = cleanNum(item.issueQuantity || item.quantity || 1);
            const rate = cleanNum(item.rate);
            items.push({
              description: item.description || 'Freight Forwarding Services',
              qty,
              rate,
              containerNo: item.containerNo,
              vehicleNo: item.vehicleNo,
              driverName: item.driverName,
            });
          });
        } else {
          // Fallback to legacy single-item Job Order mapping
          let quoItems = [];
          const quo = targetJo.quotationId
            ? quotations.find(q => String(q.id) === String(targetJo.quotationId))
            : null;
          if (quo && quo.items) {
            try { quoItems = typeof quo.items === 'string' ? JSON.parse(quo.items) : quo.items; } catch(e) { quoItems = []; }
          }
          if (!Array.isArray(quoItems)) quoItems = [];
          const targetDesc = (targetJo.instruction || targetJo.jobDescription || '').trim().toLowerCase();
          const matchedItem = quoItems.find(i => (i.description || '').trim().toLowerCase() === targetDesc);
          const rate = matchedItem ? cleanNum(matchedItem.rate) : cleanNum(targetJo.rate);
          const qty = cleanNum(targetJo.issueQuantity || targetJo.quantity || 1);
          items.push({
            description: targetJo.instruction || targetJo.jobDescription || 'Freight Forwarding Services',
            qty,
            rate,
            containerNo: targetJo.containerNo,
            vehicleNo: targetJo.vehicleNo,
            driverName: targetJo.driverName,
          });
        }
      });

      const newInvoiceId = `INV-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

      setInvoiceConfirmData({
        joId,
        bankAccount,
        consolidatedJOIds: targetJOs.map(j => j.id),
        linkedJOs: targetJOs,
        form: {
          id: newInvoiceId,
          customerName: linkedJO.customerName || '',
          customerAddress: linkedQuo?.companyAddress || linkedJO?.address || '',
          customerPic: linkedQuo?.pic || '',
          customerPhone: linkedQuo?.phone || '',
          customerEmail: linkedQuo?.email || '',
          date: new Date().toISOString().substring(0, 10),
          items,
          extraCharges: [],
          taxPercent: 0,
          bankAccountId: bankAccount.id,
          notes: notes || '',
        },
      });

    } catch (err) {
      console.error('Issue Invoice error:', err);
      toast.error('Error saat menerbitkan invoice: ' + (err.message || 'Unknown error'));
    }
  };

  const handleConfirmAndIssueInvoice = async () => {
    if (!invoiceConfirmData) return;
    const { joId, consolidatedJOIds, linkedJOs } = invoiceConfirmData;
    const f = invoiceConfirmData.form;
    try {
      const bank = companyBankAccounts.find(b => b.id === f.bankAccountId) || invoiceConfirmData.bankAccount;

      let subtotal = 0;
      const items = (f.items || []).map(line => {
        const qty = parseFloat(line.qty) || 1;
        const rate = parseFloat(line.rate) || 0;
        const amount = qty * rate;
        subtotal += amount;
        return { 
          description: line.description, 
          qty, 
          rate, 
          amount,
          containerNo: line.containerNo,
          vehicleNo: line.vehicleNo,
          driverName: line.driverName,
        };
      });

      const extra_charges = (f.extraCharges || []).map(line => {
        const qty = parseFloat(line.qty) || 1;
        const rate = parseFloat(line.rate) || 0;
        const amount = qty * rate;
        subtotal += amount;
        return { description: line.description, qty, rate, amount };
      });

      const tax = subtotal * ((parseFloat(f.taxPercent) || 0) / 100);
      const grandTotal = subtotal + tax;

      const invoiceData = {
        id: f.id.trim() || undefined,
        joId,
        consolidatedJOs: consolidatedJOIds,
        customerName: f.customerName,
        customerAddress: f.customerAddress,
        customerPic: f.customerPic,
        customerPhone: f.customerPhone,
        customerEmail: f.customerEmail,
        date: f.date,
        amount: grandTotal,
        subtotal,
        tax,
        items,
        extra_charges,
        notes: f.notes || null,
      };

      const newInv = await createCustomInvoice(invoiceData);
      if (!newInv) throw new Error('Gagal menerbitkan invoice.');

      const linkedJO = jobOrders.find(j => String(j.id) === String(joId));
      const linkedQuo = linkedJO?.quotationId
        ? quotations.find(q => String(q.id) === String(linkedJO.quotationId))
        : null;
      const printData = {
        invoice: newInv,
        jo: linkedJO || null,
        consolidatedJOs: linkedJOs || [],
        quotation: linkedQuo || null,
        bankAccount: bank,
      };
      localStorage.setItem('print_invoice_data_' + newInv.id, JSON.stringify(printData));

      setInvoiceConfirmData(null);
      setIssuingInvoiceJoId(null);
      window.open('/print/invoice?id=' + newInv.id, '_blank');

    } catch (err) {
      console.error('Confirm Issue Invoice error:', err);
      toast.error('Error: ' + (err.message || 'Gagal menerbitkan invoice.'));
    }
  };

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

  const getJoTimestamp = (jo) => {
    if (jo.id && jo.id.startsWith('JO-')) {
      const tsStr = jo.id.substring(3);
      const ts = parseInt(tsStr, 10);
      if (!isNaN(ts) && ts > 1000000000000) {
        return ts;
      }
    }
    if (jo.date) {
      const d = new Date(jo.date).getTime();
      if (!isNaN(d)) return d;
    }
    return 0;
  };

  const filteredJOs = jobOrders
    .filter(jo => {
      const tabMatch = activeTab === 'active' ? jo.status === 'dispatched' : (jo.status === 'done' || jo.status === 'invoiced');
      const searchMatch = (jo.id || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (jo.customerName || '').toLowerCase().includes(searchTerm.toLowerCase());
      return tabMatch && searchMatch && filterByDate(jo.date);
    })
    .sort((a, b) => {
      if (sortBy === 'created_desc') {
        return getJoTimestamp(b) - getJoTimestamp(a) || (b.id || '').localeCompare(a.id || '');
      }
      if (sortBy === 'created_asc') {
        return getJoTimestamp(a) - getJoTimestamp(b) || (a.id || '').localeCompare(b.id || '');
      }
      if (sortBy === 'company_asc') {
        return (a.customerName || '').localeCompare(b.customerName || '');
      }
      if (sortBy === 'company_desc') {
        return (b.customerName || '').localeCompare(a.customerName || '');
      }
      if (sortBy === 'id_asc') {
        return (a.id || '').localeCompare(b.id || '');
      }
      if (sortBy === 'id_desc') {
        return (b.id || '').localeCompare(a.id || '');
      }
      return 0;
    });

  const completedJOs = jobOrders
    .filter(jo => jo.status === 'done')
    .filter(jo => filterByDate(jo.date))
    .filter(jo => {
      const id = jo.id || '';
      const name = jo.customerName || '';
      const term = searchTerm.toLowerCase();
      return id.toLowerCase().includes(term) || name.toLowerCase().includes(term);
    })
    .sort((a, b) => {
      if (sortBy === 'created_desc') {
        return getJoTimestamp(b) - getJoTimestamp(a) || (b.id || '').localeCompare(a.id || '');
      }
      if (sortBy === 'created_asc') {
        return getJoTimestamp(a) - getJoTimestamp(b) || (a.id || '').localeCompare(b.id || '');
      }
      if (sortBy === 'company_asc') {
        return (a.customerName || '').localeCompare(b.customerName || '');
      }
      if (sortBy === 'company_desc') {
        return (b.customerName || '').localeCompare(a.customerName || '');
      }
      if (sortBy === 'id_asc') {
        return (a.id || '').localeCompare(b.id || '');
      }
      if (sortBy === 'id_desc') {
        return (b.id || '').localeCompare(a.id || '');
      }
      return 0;
    });

  const handleExport = () => {
    const dataToExport = filteredJOs.map(jo => ({
      JO_ID: jo.id,
      Date: jo.date,
      Customer: jo.customerName,
      Instruction: jo.jobDescription || jo.instruction || '-',
      Container: jo.containerNo || '-',
      Vehicle: jo.vehicleNo || '-',
      Final_Status: jo.activityStatus || '-',
      Status: jo.status
    }));

    if (dataToExport.length === 0) {
      toast(isID ? "Tidak ada data operasional untuk di-export pada rentang tanggal ini." : "No operational data to export for this date range.");
      return;
    }

    const fileName = activeTab === 'active' ? "Field_Operations_Aktif" : "Field_Operations_Records";
    exportToExcel(dataToExport, fileName);
  };

  const handleRecreateInvoice = async (jo) => {
    try {
      const existingInvoice = invoices.find(inv => 
        String(inv.joId) === String(jo.id) || 
        (inv.consolidatedJOs && inv.consolidatedJOs.map(String).includes(String(jo.id)))
      );
      
      const confirmMsg = existingInvoice
        ? (isID 
            ? `Invoice lama (${existingInvoice.id}) akan dihapus dan dibuat ulang. Lanjutkan?` 
            : `The old invoice (${existingInvoice.id}) will be deleted and recreated. Continue?`)
        : (isID 
            ? `Buat invoice untuk JO ${jo.id}?` 
            : `Create invoice for JO ${jo.id}?`);
            
      if (!window.confirm(confirmMsg)) return;

      if (existingInvoice) {
        await deleteInvoice(existingInvoice.id);
      }
      
      await createInvoice(jo.id);
      toast.success(isID ? "Invoice berhasil dibuat ulang!" : "Invoice successfully recreated!");
    } catch (err) {
      console.error(err);
      toast.error(isID ? `Gagal membuat ulang invoice: ${err.message}` : `Failed to recreate invoice: ${err.message}`);
    }
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

  const handleLocalItemListItemUpdate = (joId, itemIdx, field, index, value) => {
    setLocalData(prev => {
      const items = [...(prev[joId]?.items || [])];
      const item = { ...items[itemIdx] };
      const current = item[field] || [];
      const updated = [...current];
      updated[index] = value;
      item[field] = updated;
      items[itemIdx] = item;
      return {
        ...prev,
        [joId]: {
          ...(prev[joId] || {}),
          items
        }
      };
    });
  };

  const addLocalItemListItem = (joId, itemIdx, field) => {
    setLocalData(prev => {
      const items = [...(prev[joId]?.items || [])];
      const item = { ...items[itemIdx] };
      const current = item[field] || [''];
      item[field] = [...current, ''];
      items[itemIdx] = item;
      return {
        ...prev,
        [joId]: {
          ...(prev[joId] || {}),
          items
        }
      };
    });
  };

  const removeLocalItemListItem = (joId, itemIdx, field, index) => {
    setLocalData(prev => {
      const items = [...(prev[joId]?.items || [])];
      const item = { ...items[itemIdx] };
      const current = item[field] || [];
      item[field] = current.filter((_, i) => i !== index);
      items[itemIdx] = item;
      return {
        ...prev,
        [joId]: {
          ...(prev[joId] || {}),
          items
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
          items: Array.isArray(jo.items) ? jo.items.map(item => ({
            ...item,
            containerNo: Array.isArray(item.containerNo) && item.containerNo.length > 0 ? [...item.containerNo] : [item.containerNo || ''],
            vehicleNo: Array.isArray(item.vehicleNo) && item.vehicleNo.length > 0 ? [...item.vehicleNo] : [item.vehicleNo || ''],
            driverName: Array.isArray(item.driverName) && item.driverName.length > 0 ? [...item.driverName] : [item.driverName || ''],
          })) : [],
          activityStatus: jo.activityStatus || '',
          vesselName: jo.vesselName || '',
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
      toast.error(isID ? "Gagal mengunggah foto. Pastikan ukuran file tidak terlalu besar." : "Failed to upload photo. Make sure the file size is not too large.");
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
      items: Array.isArray(jo.items) ? jo.items.map(item => ({
        ...item,
        containerNo: Array.isArray(item.containerNo) && item.containerNo.length > 0 ? [...item.containerNo] : [item.containerNo || ''],
        vehicleNo: Array.isArray(item.vehicleNo) && item.vehicleNo.length > 0 ? [...item.vehicleNo] : [item.vehicleNo || ''],
        driverName: Array.isArray(item.driverName) && item.driverName.length > 0 ? [...item.driverName] : [item.driverName || ''],
      })) : [],
      activityStatus: jo.activityStatus,
      vesselName: jo.vesselName,
      dispatchedAtLocal: toDatetimeLocal(jo.dispatchedAt),
      completedAtLocal: toDatetimeLocal(jo.completedAt)
    };
    
    const data = { ...rawData };
    data.dispatchedAt = toISOString(data.dispatchedAtLocal);
    data.completedAt = toISOString(data.completedAtLocal);
    delete data.dispatchedAtLocal;
    delete data.completedAtLocal;

    if (!data.activityStatus) {
      toast.error(isID ? 'Status Aktivitas wajib diisi!' : 'Activity Status is required!');
      return;
    }

    const hasItems = Array.isArray(jo.items) && jo.items.length > 0;
    let updatedItems = data.items || [];

    if (hasItems) {
      // Validate that all dispatched items have containers, vehicles, drivers
      const activeItems = updatedItems.filter(item => item.status === 'dispatched' || item.status === 'done');
      for (const item of activeItems) {
        const itemHasContainer = Array.isArray(item.containerNo) ? item.containerNo.some(c => c && c.trim()) : (item.containerNo && item.containerNo.trim());
        const itemHasVehicle = Array.isArray(item.vehicleNo) ? item.vehicleNo.some(v => v && v.trim()) : (item.vehicleNo && item.vehicleNo.trim());
        const itemHasDriver = Array.isArray(item.driverName) ? item.driverName.some(d => d && d.trim()) : (item.driverName && item.driverName.trim());
        if (!itemHasContainer || !itemHasVehicle || !itemHasDriver) {
          toast.error(isID 
            ? `Item "${item.description}" wajib diisi: Container, Vehicle, dan Driver!` 
            : `Item "${item.description}" is required to have Container, Vehicle, and Driver!`
          );
          return;
        }
      }

      updatedItems = updatedItems.map(item => {
        if (item.status === 'dispatched') {
          return { ...item, status: 'done' };
        }
        return item;
      });
      data.items = updatedItems;

      // Concatenate all to root level for backward compatibility
      data.containerNo = [...new Set(updatedItems.flatMap(item => Array.isArray(item.containerNo) ? item.containerNo : [item.containerNo || '']))].filter(Boolean);
      data.vehicleNo = [...new Set(updatedItems.flatMap(item => Array.isArray(item.vehicleNo) ? item.vehicleNo : [item.vehicleNo || '']))].filter(Boolean);
      data.driverName = [...new Set(updatedItems.flatMap(item => Array.isArray(item.driverName) ? item.driverName : [item.driverName || '']))].filter(Boolean);
    } else {
      // Legacy JO validation
      const hasContainer = Array.isArray(data.containerNo) ? data.containerNo.some(c => c && c.trim()) : (data.containerNo && data.containerNo.trim());
      const hasVehicle = Array.isArray(data.vehicleNo) ? data.vehicleNo.some(v => v && v.trim()) : (data.vehicleNo && data.vehicleNo.trim());
      const hasDriver = Array.isArray(data.driverName) ? data.driverName.some(d => d && d.trim()) : (data.driverName && data.driverName.trim());

      if (!hasContainer || !hasVehicle || !hasDriver) {
        toast.error(isID ? 'Semua data wajib diisi: Container, Vehicle, dan Driver!' : 'All fields are required: Container, Vehicle, and Driver!');
        return;
      }
    }

    // Sync to server before completing
    await updateJOStatus(jo.id, data);
    await completeJO(jo.id);
    toast.success(isID ? `Job ${jo.id} selesai dan dipindahkan ke Records!` : `Job ${jo.id} completed and moved to Records!`);
    setUploadingForId(null);
  };

  const handleSaveChanges = async (jo) => {
    const rawData = localData[jo.id] || {
      containerNo: jo.containerNo,
      vehicleNo: jo.vehicleNo,
      driverName: jo.driverName,
      items: Array.isArray(jo.items) ? jo.items.map(item => ({
        ...item,
        containerNo: Array.isArray(item.containerNo) && item.containerNo.length > 0 ? [...item.containerNo] : [item.containerNo || ''],
        vehicleNo: Array.isArray(item.vehicleNo) && item.vehicleNo.length > 0 ? [...item.vehicleNo] : [item.vehicleNo || ''],
        driverName: Array.isArray(item.driverName) && item.driverName.length > 0 ? [...item.driverName] : [item.driverName || ''],
      })) : [],
      activityStatus: jo.activityStatus,
      vesselName: jo.vesselName,
      dispatchedAtLocal: toDatetimeLocal(jo.dispatchedAt),
      completedAtLocal: toDatetimeLocal(jo.completedAt)
    };
    
    const data = { ...rawData };
    data.dispatchedAt = toISOString(data.dispatchedAtLocal);
    data.completedAt = toISOString(data.completedAtLocal);
    delete data.dispatchedAtLocal;
    delete data.completedAtLocal;

    const hasItems = Array.isArray(jo.items) && jo.items.length > 0;
    if (hasItems) {
      const items = data.items || [];
      data.containerNo = [...new Set(items.flatMap(item => Array.isArray(item.containerNo) ? item.containerNo : [item.containerNo || '']))].filter(Boolean);
      data.vehicleNo = [...new Set(items.flatMap(item => Array.isArray(item.vehicleNo) ? item.vehicleNo : [item.vehicleNo || '']))].filter(Boolean);
      data.driverName = [...new Set(items.flatMap(item => Array.isArray(item.driverName) ? item.driverName : [item.driverName || '']))].filter(Boolean);
    }

    try {
      await updateJOStatus(jo.id, data);
      toast.success(isID ? 'Perubahan berhasil disimpan!' : 'Changes saved successfully!');
    } catch (err) {
      console.error(err);
      toast.error(isID ? 'Gagal menyimpan perubahan.' : 'Failed to save changes.');
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
              <h3 style={{ color: 'var(--danger)', marginBottom: '8px' }}>{isID ? 'Hapus Job Order?' : 'Delete Job Order?'}</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '6px' }}>
                <strong style={{ color: 'var(--text)' }}>{joToDelete.id}</strong> — {joToDelete.customerName}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                {isID ? 'Data JO ini akan dihapus secara permanen dan tidak dapat dikembalikan.' : 'This JO data will be permanently deleted and cannot be recovered.'}
              </p>
              <div className="input-group" style={{ textAlign: 'left', marginBottom: '8px' }}>
                <label style={{ color: 'var(--secondary)', fontWeight: '700' }}>
                  {isID ? 'Ketik ' : 'Type '}<strong style={{ color: 'var(--danger)' }}>{joToDelete.id}</strong> {isID ? 'untuk konfirmasi:' : 'to confirm:'}
                </label>
                <input
                  type="text"
                  value={verifyCode}
                  onChange={e => { setVerifyCode(e.target.value); setVerifyError(''); }}
                  placeholder={isID ? `Ketik ${joToDelete.id} di sini...` : `Type ${joToDelete.id} here...`}
                  style={{ background: 'var(--input-bg)', border: `1px solid ${verifyError ? 'var(--danger)' : 'var(--border)'}`, borderRadius: '10px', color: 'var(--text)', padding: '12px', width: '100%' }}
                />
                {verifyError && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px' }}>{verifyError}</p>}
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
                  style={{ flex: 1, background: 'var(--danger)', color: 'white', border: 'none' }}
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
          <button 
            onClick={() => setActiveTab('pending_invoices')}
            style={{
              background: 'none', border: 'none', padding: '10px 0',
              color: activeTab === 'pending_invoices' ? 'var(--secondary)' : 'var(--text-muted)',
              fontSize: '1rem', fontWeight: '600', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Receipt size={18} />
            {isID ? 'Invoice Tertunda' : 'Pending Invoices'}
            {activeTab === 'pending_invoices' && <motion.div layoutId="execTab" style={{ position: 'absolute', bottom: -1, left: 0, right: 0, background: 'var(--secondary)', height: '2px' }} />}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '20px 25px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', background: 'rgba(255,255,255,0.03)' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <input type="text" placeholder={isID ? "Cari Pekerjaan atau Pelanggan..." : "Search Jobs or Customers..."} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '10px 15px 10px 40px', borderRadius: '10px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>{isID ? 'Filter Tanggal:' : 'Date Filter:'}</span>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.85rem' }} />
          <span style={{ color: 'var(--text-muted)' }}>{isID ? 's/d' : 'to'}</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.85rem' }} />
          {(startDate || endDate || searchTerm) && (
            <button onClick={() => { setStartDate(''); setEndDate(''); setSearchTerm(''); }} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600' }}>{isID ? 'Atur Ulang' : 'Reset'}</button>
          )}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-gold" onClick={handleExport} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <FileSpreadsheet size={18} /> {isID ? 'Ekspor Excel' : 'Export Excel'}
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '25px', overflowX: 'auto' }}>
        {activeTab === 'pending_invoices' ? (
          <div className="table-container"><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--secondary)' }}>
                <th 
                  style={{ padding: '15px', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleHeaderClick('id')}
                >
                  JO Ref{renderSortIndicator('id')}
                </th>
                <th 
                  style={{ padding: '15px', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleHeaderClick('company')}
                >
                  {isID ? 'Pelanggan' : 'Customer'}{renderSortIndicator('company')}
                </th>
                <th style={{ padding: '15px' }}>{isID ? 'Status' : 'Status'}</th>
                <th 
                  style={{ padding: '15px', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleHeaderClick('created')}
                >
                  {isID ? 'Pengiriman' : 'Shipment'}{renderSortIndicator('created')}
                </th>
                <th style={{ padding: '15px', textAlign: 'center' }}>{isID ? 'Foto' : 'Photos'}</th>
                <th style={{ padding: '15px' }}>{isID ? 'Aksi' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const groups = {};
                completedJOs.forEach(jo => {
                  const qId = jo.quotationId || 'direct';
                  // If it's a direct job, only include it if it hasn't been invoiced yet!
                  if (!jo.quotationId) {
                    const hasInvoice = invoices.some(inv => String(inv.joId) === String(jo.id) || (Array.isArray(inv.consolidatedJOs) && inv.consolidatedJOs.includes(jo.id)));
                    if (hasInvoice) return;
                  }
                  if (!groups[qId]) {
                    groups[qId] = {
                      quotationId: qId,
                      customerName: jo.customerName || 'Direct Customer',
                      jobOrders: []
                    };
                  }
                  groups[qId].jobOrders.push(jo);
                });

                // Filter out quotation groups where ALL completed job orders have already been invoiced
                const pendingGroups = Object.values(groups).filter(group => {
                  if (group.quotationId === 'direct') {
                    return group.jobOrders.length > 0;
                  }
                  // Check if any job order in this quotation group is NOT invoiced yet
                  const hasUninvoicedJO = group.jobOrders.some(jo => {
                    const hasInvoice = invoices.some(inv => String(inv.joId) === String(jo.id) || (Array.isArray(inv.consolidatedJOs) && inv.consolidatedJOs.includes(jo.id)));
                    return !hasInvoice;
                  });
                  return hasUninvoicedJO;
                });

                if (pendingGroups.length === 0) {
                  return (
                    <tr>
                      <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        {isID ? 'Tidak ada invoice tertunda.' : 'No pending invoices found.'}
                      </td>
                    </tr>
                  );
                }

                return pendingGroups.map(group => {
                  const isGroupExpanded = expandedCompletedGroups[group.quotationId] !== false;
                  const uninvoicedJOs = group.jobOrders.filter(jo => !invoices.some(inv => String(inv.joId) === String(jo.id) || (Array.isArray(inv.consolidatedJOs) && inv.consolidatedJOs.includes(jo.id))));
                  const allInvoiced = uninvoicedJOs.length === 0;

                  return (
                    <React.Fragment key={group.quotationId}>
                      <tr 
                        style={{ 
                          background: 'var(--secondary-bg)', 
                          borderBottom: '2px solid var(--secondary)',
                          cursor: 'pointer'
                        }}
                        onClick={() => setExpandedCompletedGroups({ ...expandedCompletedGroups, [group.quotationId]: !isGroupExpanded })}
                      >
                        <td colSpan="6" style={{ padding: '12px 15px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '1.2rem' }}>📁</span>
                              <span style={{ fontWeight: '800', color: 'var(--secondary)' }}>
                                {group.quotationId === 'direct' ? (isID ? 'Pekerjaan Langsung' : 'Direct Jobs') : group.quotationId}
                              </span>
                              <span style={{ color: 'var(--text)', fontWeight: '700', marginLeft: '5px' }}>
                                🏢 {group.customerName}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                              {!allInvoiced && canWrite && (
                                <ButtonWithLoading 
                                  className="btn btn-gold" 
                                  style={{ padding: '6px 14px', fontSize: '0.75rem', gap: '6px' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleIssueInvoice(uninvoicedJOs[0].id);
                                  }}
                                >
                                  {isID ? 'Terbitkan Invoice Gabungan' : 'Issue Combined Invoice'}
                                </ButtonWithLoading>
                              )}
                              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                {group.jobOrders.length} {isID ? 'Pekerjaan' : 'Jobs'}
                              </span>
                              {isGroupExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </div>
                        </td>
                      </tr>

                      {isGroupExpanded && group.jobOrders.map(jo => {
                        const hasInvoice = invoices.some(inv => String(inv.joId) === String(jo.id));
                        return (
                          <tr key={jo.id} style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.01)' }}>
                            <td style={{ padding: '15px', paddingLeft: '30px', fontWeight: 'bold', color: 'var(--secondary)' }}>
                              <span style={{ color: 'var(--text-muted)', marginRight: '5px' }}>📄</span> {jo.id}
                            </td>
                            <td style={{ padding: '15px' }}>
                              <div style={{ fontWeight: '600' }}>{jo.customerName}</div>
                               <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                 {Array.isArray(jo.items) && jo.items.length > 0 ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {jo.items.map((item, idx) => (
                                      <div key={idx} style={{ marginTop: '4px' }}>
                                        • {item.description} ({isID ? 'Jumlah:' : 'Qty:'} {item.issueQuantity || item.quantity || 1} | {isID ? 'Tarif:' : 'Rate:'} Rp {parseFloat(item.rate || 0).toLocaleString(isID ? 'id-ID' : 'en-US')}) 
                                        {item.status && <span style={{ fontSize: '0.65rem', marginLeft: '6px' }} className={`badge badge-${item.status}`}>{item.status}</span>}
                                        {item.containerNo?.some?.(Boolean) && (
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px', paddingLeft: '10px' }}>
                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>
                                              {isID ? 'Kontainer:' : 'Containers:'}
                                            </span>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                              {item.containerNo.filter(Boolean).map((num, cIdx) => (
                                                <span key={cIdx} style={{ 
                                                  fontFamily: 'monospace', 
                                                  fontSize: '0.7rem', 
                                                  background: 'rgba(212, 175, 55, 0.1)', 
                                                  color: 'var(--secondary)', 
                                                  border: '1px solid rgba(212, 175, 55, 0.25)', 
                                                  padding: '1px 5px', 
                                                  borderRadius: '4px',
                                                  whiteSpace: 'nowrap'
                                                }}>
                                                  {num}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        {item.vehicleNo?.some?.(Boolean) && (
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px', paddingLeft: '10px' }}>
                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>
                                              {isID ? 'Armada:' : 'Vehicles:'}
                                            </span>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                              {item.vehicleNo.filter(Boolean).map((num, vIdx) => (
                                                <span key={vIdx} style={{ 
                                                  fontFamily: 'monospace', 
                                                  fontSize: '0.7rem', 
                                                  background: 'rgba(59, 130, 246, 0.1)', 
                                                  color: '#3b82f6', 
                                                  border: '1px solid rgba(59, 130, 246, 0.25)', 
                                                  padding: '1px 5px', 
                                                  borderRadius: '4px',
                                                  whiteSpace: 'nowrap'
                                                }}>
                                                  {num}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        {item.driverName?.some?.(Boolean) && (
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px', paddingLeft: '10px' }}>
                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>
                                              {isID ? 'Supir:' : 'Drivers:'}
                                            </span>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                              {item.driverName.filter(Boolean).map((num, dIdx) => (
                                                <span key={dIdx} style={{ 
                                                  fontFamily: 'monospace', 
                                                  fontSize: '0.7rem', 
                                                  background: 'rgba(16, 185, 129, 0.1)', 
                                                  color: '#10b981', 
                                                  border: '1px solid rgba(16, 185, 129, 0.25)', 
                                                  padding: '1px 5px', 
                                                  borderRadius: '4px',
                                                  whiteSpace: 'nowrap'
                                                }}>
                                                  {num}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <>
                                    <div>{jo.instruction || jo.jobDescription}</div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                      {isID ? 'Jumlah:' : 'Qty:'} {jo.quantity}
                                    </div>
                                  </>
                                )}
                              </div>
                              {(!jo.items || jo.items.length === 0) && jo.containerNo && (() => {
                                const cNo = jo.containerNo;
                                let filtered = [];
                                if (Array.isArray(cNo)) {
                                  filtered = cNo.filter(Boolean);
                                } else if (cNo && String(cNo).trim()) {
                                  filtered = [String(cNo).trim()];
                                }
                                if (filtered.length === 0) return null;
                                return (
                                  <div style={{ marginTop: '6px' }}>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>
                                      {isID ? 'Kontainer:' : 'Containers:'}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '4px' }}>
                                      {filtered.map((num, idx) => (
                                        <span key={idx} style={{ 
                                          fontFamily: 'monospace', 
                                          fontSize: '0.7rem', 
                                          background: 'rgba(212, 175, 55, 0.1)', 
                                          color: 'var(--secondary)', 
                                          border: '1px solid rgba(212, 175, 55, 0.25)', 
                                          padding: '2px 6px', 
                                          borderRadius: '4px',
                                          width: 'fit-content',
                                          whiteSpace: 'nowrap'
                                        }}>
                                          {num}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}
                            </td>
                            <td style={{ padding: '15px' }}>
                              <span className="badge badge-done">{isID ? 'Selesai' : 'Completed'}</span>
                            </td>
                            <td style={{ padding: '15px' }}>
                              {canWrite ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '160px', maxWidth: '200px' }}>
                                  <select 
                                    value={shipmentEdits[jo.id]?.shipmentStatus ?? jo.shipmentStatus ?? ''} 
                                    onChange={(e) => handleShipmentChange(jo.id, 'shipmentStatus', e.target.value)}
                                    style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--text)', border: '1px solid var(--glass-border)', borderRadius: '4px', padding: '4px', fontSize: '0.75rem' }}
                                  >
                                    <option value="">{isID ? '-- Pilih Status --' : '-- Select Status --'}</option>
                                    <option value="in_progress">{isID ? 'Dalam Proses' : 'In Progress'}</option>
                                    <option value="done">{isID ? 'Selesai' : 'Done'}</option>
                                  </select>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', width: '35px' }}>ETD:</span>
                                    <input 
                                      type="date" 
                                      value={shipmentEdits[jo.id]?.etd ?? jo.etd ?? ''} 
                                      onChange={(e) => handleShipmentChange(jo.id, 'etd', e.target.value)}
                                      style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--text)', border: '1px solid var(--glass-border)', borderRadius: '4px', padding: '2px 4px', fontSize: '0.75rem', flex: 1, colorScheme: 'dark' }}
                                    />
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', width: '35px' }}>ETA:</span>
                                    <input 
                                      type="date" 
                                      value={shipmentEdits[jo.id]?.eta ?? jo.eta ?? ''} 
                                      onChange={(e) => handleShipmentChange(jo.id, 'eta', e.target.value)}
                                      style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--text)', border: '1px solid var(--glass-border)', borderRadius: '4px', padding: '2px 4px', fontSize: '0.75rem', flex: 1, colorScheme: 'dark' }}
                                    />
                                  </div>
                                  {hasShipmentChanges(jo.id) && (
                                    <ButtonWithLoading 
                                      onClick={() => handleSaveShipment(jo.id)}
                                      loading={savingShipment[jo.id]}
                                      className="btn btn-gold"
                                      style={{ padding: '4px 8px', fontSize: '0.7rem', marginTop: '2px', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}
                                    >
                                      {isID ? 'Simpan Pengiriman' : 'Save Shipment'}
                                    </ButtonWithLoading>
                                  )}
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem' }}>
                                  {jo.shipmentStatus && (
                                    <div>
                                      <span className={`badge ${jo.shipmentStatus === 'done' ? 'badge-done' : 'badge-dispatched'}`}>
                                        {jo.shipmentStatus === 'done' ? (isID ? 'Selesai' : 'Done') : (isID ? 'Dalam Proses' : 'In Progress')}
                                      </span>
                                    </div>
                                  )}
                                  {jo.etd && <div><span style={{ color: 'var(--text-muted)' }}>ETD:</span> {formatDate(jo.etd)}</div>}
                                  {jo.eta && <div><span style={{ color: 'var(--text-muted)' }}>ETA:</span> {formatDate(jo.eta)}</div>}
                                  {!jo.shipmentStatus && !jo.etd && !jo.eta && (
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>-</span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '15px', textAlign: 'center' }}>
                              {jo.photos && jo.photos.length > 0 ? (
                                <button 
                                  onClick={() => setPhotoViewer({ joId: jo.id, photos: jo.photos })}
                                  style={{ background: 'var(--secondary-bg)', border: '1px solid var(--secondary)', borderRadius: '6px', padding: '5px 10px', color: 'var(--secondary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem' }}
                                >
                                  <Image size={14} /> {jo.photos.length} {isID ? 'Foto' : 'Photos'}
                                </button>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{isID ? 'Tidak Ada Foto' : 'No Photos'}</span>
                              )}
                            </td>
                            <td style={{ padding: '15px' }}>
                              <div style={{ display: 'flex', gap: '10px' }}>
                                {!hasInvoice && canWrite ? (
                                  <ButtonWithLoading className="btn btn-gold" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => handleIssueInvoice(jo.id)}>
                                    {isID ? 'Terbitkan Invoice' : 'Issue Invoice'}
                                  </ButtonWithLoading>
                                ) : (
                                  <span style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                    {isID ? 'Sudah Ditagih' : 'Invoiced'}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                });
              })()}
            </tbody>
          </table></div>
        ) : (
          <div className="table-container"><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--secondary)' }}>
                <th 
                  style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleHeaderClick('id')}
                >
                  JO ID{renderSortIndicator('id')}
                </th>
                <th 
                  style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleHeaderClick('company')}
                >
                  {isID ? 'Pelanggan' : 'Customer'}{renderSortIndicator('company')}
                </th>
                <th style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>{isID ? 'Instruksi' : 'Instruction'}</th>
                <th style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>{isID ? 'Kontainer & Unit' : 'Container & Unit'}</th>
                <th 
                  style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleHeaderClick('created')}
                >
                  {isID ? 'Durasi Pengiriman' : 'Dispatched Duration'}{renderSortIndicator('created')}
                </th>
                <th style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>{isID ? 'Status Operasional' : 'Operational Status'}</th>
                <th style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'center' }}>{isID ? 'Dokumentasi' : 'Documentation'}</th>
                <th style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'center' }}>{isID ? 'Aksi' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
            {(() => {
              // Group filteredJOs by quotationId
              const groups = {};
              filteredJOs.forEach(jo => {
                const qId = jo.quotationId || 'no-quotation';
                if (!groups[qId]) {
                  groups[qId] = {
                    quotationId: qId,
                    customerName: jo.customerName,
                    date: jo.date,
                    jobOrders: []
                  };
                }
                groups[qId].jobOrders.push(jo);
              });

              const groupedArray = Object.values(groups).sort((a, b) => {
                const timeA = a.date ? new Date(a.date).getTime() : 0;
                const timeB = b.date ? new Date(b.date).getTime() : 0;
                return timeB - timeA;
              });

              if (groupedArray.length === 0) {
                return null;
              }

              return groupedArray.map(group => {
                const isGroupExpanded = !!expandedGroups[group.quotationId];
                return (
                  <React.Fragment key={group.quotationId}>
                    {/* Folder Header Row */}
                    <tr 
                      style={{ borderBottom: '1px solid var(--glass-border)', background: 'var(--secondary-bg)', cursor: 'pointer' }} 
                      className="table-row-hover" 
                      onClick={() => setExpandedGroups(prev => ({ ...prev, [group.quotationId]: !prev[group.quotationId] }))}
                    >
                      <td colSpan="8" style={{ padding: '15px', fontWeight: '800' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {isGroupExpanded ? <ChevronDown size={16} style={{ color: 'var(--secondary)' }} /> : <ChevronRight size={16} style={{ color: 'var(--secondary)' }} />}
                            {isGroupExpanded ? <FolderOpen size={20} style={{ color: 'var(--secondary)' }} /> : <Folder size={20} style={{ color: 'var(--secondary)' }} />}
                            <span style={{ color: 'var(--secondary)' }}>{group.quotationId}</span>
                            <span style={{ color: 'var(--text-muted)' }}>|</span>
                            <span>{group.customerName}</span>
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal', background: 'rgba(255,255,255,0.05)', padding: '2px 10px', borderRadius: '20px' }}>
                            {group.jobOrders.length} {isID ? 'Aktivitas' : 'Activities'}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Child Job Order Rows */}
                    {isGroupExpanded && group.jobOrders.map(jo => (
                      <React.Fragment key={jo.id}>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', background: 'rgba(255,255,255,0.01)' }} className="table-row-hover" onClick={() => toggleRow(jo)}>
                          <td style={{ padding: '15px 15px 15px 35px', fontWeight: '800', color: 'var(--secondary)', borderLeft: '3px solid var(--secondary)' }}>{jo.id}</td>
                          <td style={{ padding: '15px' }}>
                            <div style={{ fontWeight: '600' }}>{jo.customerName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{isID ? 'Jumlah:' : 'Qty:'} {jo.quantity}</div>
                          </td>
                          <td style={{ padding: '15px', fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '250px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                            {Array.isArray(jo.items) && jo.items.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {jo.items.map((item, idx) => (
                                  <div key={idx} style={{ borderBottom: '1px dashed rgba(255,255,255,0.03)', paddingBottom: '4px', marginTop: '4px' }}>
                                    • {item.description} ({isID ? 'Jumlah:' : 'Qty:'} {item.issueQuantity || item.quantity || 1})
                                    {item.containerNo?.some?.(Boolean) && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px', paddingLeft: '8px' }}>
                                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>
                                            {isID ? 'Kontainer:' : 'Containers:'}
                                          </span>
                                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            {item.containerNo.filter(Boolean).map((num, cIdx) => (
                                              <span key={cIdx} style={{ 
                                                fontFamily: 'monospace', 
                                                fontSize: '0.7rem', 
                                                background: 'rgba(212, 175, 55, 0.1)', 
                                                color: 'var(--secondary)', 
                                                border: '1px solid rgba(212, 175, 55, 0.25)', 
                                                padding: '1px 5px', 
                                                borderRadius: '4px',
                                                whiteSpace: 'nowrap'
                                              }}>
                                                {num}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {item.vehicleNo?.some?.(Boolean) && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px', paddingLeft: '8px' }}>
                                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>
                                            {isID ? 'Armada:' : 'Vehicles:'}
                                          </span>
                                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            {item.vehicleNo.filter(Boolean).map((num, vIdx) => (
                                              <span key={vIdx} style={{ 
                                                fontFamily: 'monospace', 
                                                fontSize: '0.7rem', 
                                                background: 'rgba(59, 130, 246, 0.1)', 
                                                color: '#3b82f6', 
                                                border: '1px solid rgba(59, 130, 246, 0.25)', 
                                                padding: '1px 5px', 
                                                borderRadius: '4px',
                                                whiteSpace: 'nowrap'
                                              }}>
                                                {num}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {item.driverName?.some?.(Boolean) && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px', paddingLeft: '8px' }}>
                                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>
                                            {isID ? 'Supir:' : 'Drivers:'}
                                          </span>
                                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            {item.driverName.filter(Boolean).map((num, dIdx) => (
                                              <span key={dIdx} style={{ 
                                                fontFamily: 'monospace', 
                                                fontSize: '0.7rem', 
                                                background: 'rgba(16, 185, 129, 0.1)', 
                                                color: '#10b981', 
                                                border: '1px solid rgba(16, 185, 129, 0.25)', 
                                                padding: '1px 5px', 
                                                borderRadius: '4px',
                                                whiteSpace: 'nowrap'
                                              }}>
                                                {num}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              jo.jobDescription || jo.instruction || '-'
                            )}
                          </td>
                          <td style={{ padding: '15px' }}>
                            <div style={{ fontSize: '0.85rem' }}>
                              <span style={{ color: 'var(--text-muted)' }}>{isID ? 'K:' : 'C:'}</span> {Array.isArray(jo.containerNo) ? jo.containerNo.join(', ') : jo.containerNo || '-'}
                            </div>
                            <div style={{ fontSize: '0.85rem' }}>
                              <span style={{ color: 'var(--text-muted)' }}>{isID ? 'Knd:' : 'V:'}</span> {Array.isArray(jo.vehicleNo) ? jo.vehicleNo.join(', ') : jo.vehicleNo || '-'}
                            </div>
                            {jo.vesselName && (
                              <div style={{ fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>{isID ? 'Kapal:' : 'Vessel:'}</span> {jo.vesselName}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '15px', fontSize: '0.9rem', fontWeight: '500' }}>
                            {formatDuration(jo.dispatchedAt, jo.completedAt, t, language)}
                          </td>
                          <td style={{ padding: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeTab === 'active' ? 'var(--warning)' : 'var(--success)' }} />
                              <span style={{ fontWeight: '600', color: activeTab === 'active' ? 'var(--warning)' : 'var(--success)', fontSize: '0.9rem' }}>
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
                                canWrite ? (
                                  <ButtonWithLoading 
                                    className="btn btn-gold" 
                                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                    onClick={(e) => { e.stopPropagation(); return handleDone(jo); }}
                                  >
                                    {isID ? 'Selesai' : 'Done'}
                                  </ButtonWithLoading>
                                ) : (
                                  <span className="badge badge-pending" style={{ fontSize: '0.7rem' }}>{isID ? 'Aktif' : 'Active'}</span>
                                )
                              ) : (
                                <span className="badge badge-done" style={{ fontSize: '0.7rem' }}>{isID ? 'Diarsipkan' : 'Archived'}</span>
                              )}
                              <button 
                                className="btn-icon" 
                                style={{ width: '38px', height: '38px', color: 'var(--secondary)', background: 'var(--secondary-bg)', border: '1px solid var(--secondary-border)' }}
                                onClick={(e) => { e.stopPropagation(); navigate(`/executor/surat-jalan/${jo.id}`); }}
                                title={isID ? "Lihat Surat Jalan" : "View Delivery Order"}
                              >
                                <FileText size={20} />
                              </button>
                              <button 
                                className="btn-icon" 
                                style={{ width: '38px', height: '38px', color: 'var(--success)', background: 'var(--success-bg)', border: '1px solid var(--success-border)' }}
                                onClick={(e) => { e.stopPropagation(); navigate(`/executor/surat-jalan/${jo.id}?print=true`); }}
                                title={isID ? "Cetak Surat Jalan" : "Print Delivery Order"}
                              >
                                <Printer size={20} />
                              </button>
                              {activeTab === 'records' && (() => {
                                const existingInvoice = invoices.find(inv => 
                                  String(inv.joId) === String(jo.id) || 
                                  (inv.consolidatedJOs && inv.consolidatedJOs.map(String).includes(String(jo.id)))
                                );
                                if (!existingInvoice) return null;
                                return (
                                  <button 
                                    className="btn-icon" 
                                    style={{ width: '38px', height: '38px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      const linkedJO = jobOrders.find(j => String(j.id) === String(existingInvoice.joId));
                                      const linkedQuo = linkedJO ? quotations.find(q => String(q.id) === String(linkedJO.quotationId)) : null;
                                      const consolidatedJOs = existingInvoice.consolidatedJOs 
                                        ? jobOrders.filter(j => existingInvoice.consolidatedJOs.includes(j.id))
                                        : linkedJO ? [linkedJO] : [];
                                      
                                      localStorage.setItem('print_invoice_data', JSON.stringify({ 
                                        invoice: existingInvoice, 
                                        jo: linkedJO, 
                                        consolidatedJOs: consolidatedJOs,
                                        quotation: linkedQuo 
                                      }));
                                      window.open('/print/invoice', '_blank');
                                    }}
                                    title={isID ? "Lihat Invoice" : "View Invoice"}
                                  >
                                    <Receipt size={18} />
                                  </button>
                                );
                              })()}
                              {activeTab === 'records' && canWrite && (
                                <button 
                                  className="btn-icon" 
                                  style={{ width: '38px', height: '38px', color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}
                                  onClick={(e) => { e.stopPropagation(); handleRecreateInvoice(jo); }}
                                  title={isID ? "Buat Ulang Invoice" : "Recreate Invoice"}
                                >
                                  <RefreshCw size={18} />
                                </button>
                              )}
                              {activeTab === 'records' && canWrite && (
                                <button 
                                  className="btn-icon" 
                                  style={{ width: '38px', height: '38px', color: 'var(--gold-metallic)', background: 'var(--secondary-bg)', border: '1px solid var(--secondary-border)' }}
                                  onClick={(e) => { e.stopPropagation(); toggleRow(jo); }}
                                  title={isID ? "Ubah Catatan Data" : "Edit Records Data"}
                                >
                                  <FileText size={20} />
                                </button>
                              )}
                              {activeTab === 'records' && canWrite && (
                                <button 
                                  className="btn-icon" 
                                  style={{ width: '38px', height: '38px', color: 'var(--danger)', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)' }}
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
                            <tr key={`${jo.id}-edit`}>
                              <td colSpan="8" style={{ padding: 0 }}>
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }} 
                                  animate={{ height: 'auto', opacity: 1 }} 
                                  exit={{ height: 0, opacity: 0 }} 
                                  style={{ overflow: 'hidden', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--secondary)' }}
                                >
                                  <div className="grid-responsive-2" style={{ padding: '25px' }}>
                                    <div style={{ display: 'grid', gap: '25px' }}>
                                      {Array.isArray(jo.items) && jo.items.length > 0 ? (
                                        <div style={{ display: 'grid', gap: '25px' }}>
                                          {jo.items.filter(item => item.status === 'dispatched' || item.status === 'done').map((item, itemIdx) => {
                                            // Find the index of this item in the original jo.items array (since we filtered)
                                            const origIdx = jo.items.findIndex(i => i.description === item.description && i.quantity === item.quantity);
                                            if (origIdx === -1) return null;
                                            
                                            const itemLocal = localData[jo.id]?.items?.[origIdx] || { containerNo: [''], vehicleNo: [''], driverName: [''] };
                                            
                                            return (
                                              <div key={origIdx} style={{ padding: '15px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '10px' }}>
                                                <div style={{ fontWeight: '700', color: 'var(--secondary)', marginBottom: '15px', fontSize: '0.9rem', borderBottom: '1px dashed var(--glass-border)', paddingBottom: '8px' }}>
                                                  {item.description} ({isID ? 'Jumlah Terkirim:' : 'Dispatched Qty:'} {item.issueQuantity || item.quantity || 1})
                                                </div>
                                                <div className="grid-responsive-3">
                                                  {/* Item Multi Container */}
                                                  <div className="input-group">
                                                    <label>{isID ? 'Nomor Kontainer' : 'Container Number'} <span style={{ color: 'var(--danger)' }}>*</span></label>
                                                    {(itemLocal.containerNo || []).map((c, i, arr) => (
                                                      <div key={i} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                                                        <input disabled={!canWrite} type="text" value={c} onChange={e => handleLocalItemListItemUpdate(jo.id, origIdx, 'containerNo', i, e.target.value)} placeholder="CONT-123456" />
                                                        {arr.length > 1 && canWrite && (
                                                          <button className="btn-icon" onClick={() => removeLocalItemListItem(jo.id, origIdx, 'containerNo', i)} style={{ padding: '5px', height: 'auto', opacity: 0.5 }} title={isID ? "Hapus" : "Delete"}>
                                                            <X size={12} />
                                                          </button>
                                                        )}
                                                        {canWrite && (
                                                          <button className="btn-icon" onClick={() => addLocalItemListItem(jo.id, origIdx, 'containerNo')} style={{ padding: '5px', height: 'auto', color: 'var(--success)', background: 'var(--success-bg)' }} title={isID ? "Tambah Kontainer" : "Add Container"}>
                                                            <Plus size={12} />
                                                          </button>
                                                        )}
                                                      </div>
                                                    ))}
                                                  </div>

                                                  {/* Item Multi Vehicle */}
                                                  <div className="input-group">
                                                    <label>{isID ? 'Nomor Kendaraan' : 'Vehicle Number'} <span style={{ color: 'var(--danger)' }}>*</span></label>
                                                    {(itemLocal.vehicleNo || []).map((v, i, arr) => (
                                                      <div key={i} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                                                        <input disabled={!canWrite} type="text" value={v} onChange={e => handleLocalItemListItemUpdate(jo.id, origIdx, 'vehicleNo', i, e.target.value)} placeholder="B 1234 ABC" />
                                                        {arr.length > 1 && canWrite && (
                                                          <button className="btn-icon" onClick={() => removeLocalItemListItem(jo.id, origIdx, 'vehicleNo', i)} style={{ padding: '5px', height: 'auto', opacity: 0.5 }} title={isID ? "Hapus" : "Delete"}>
                                                            <X size={12} />
                                                          </button>
                                                        )}
                                                        {canWrite && (
                                                          <button className="btn-icon" onClick={() => addLocalItemListItem(jo.id, origIdx, 'vehicleNo')} style={{ padding: '5px', height: 'auto', color: 'var(--success)', background: 'var(--success-bg)' }} title={isID ? "Tambah Kendaraan" : "Add Vehicle"}>
                                                            <Plus size={12} />
                                                          </button>
                                                        )}
                                                      </div>
                                                    ))}
                                                  </div>

                                                  {/* Item Multi Driver */}
                                                  <div className="input-group">
                                                    <label>{isID ? 'Nama Sopir' : 'Driver Name'} <span style={{ color: 'var(--danger)' }}>*</span></label>
                                                    {(itemLocal.driverName || []).map((d, i, arr) => (
                                                      <div key={i} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                                                        <input disabled={!canWrite} type="text" value={d} onChange={e => handleLocalItemListItemUpdate(jo.id, origIdx, 'driverName', i, e.target.value)} placeholder={isID ? "Nama Sopir" : "Driver Name"} />
                                                        {arr.length > 1 && canWrite && (
                                                          <button className="btn-icon" onClick={() => removeLocalItemListItem(jo.id, origIdx, 'driverName', i)} style={{ padding: '5px', height: 'auto', opacity: 0.5 }} title={isID ? "Hapus" : "Delete"}>
                                                            <X size={12} />
                                                          </button>
                                                        )}
                                                        {canWrite && (
                                                          <button className="btn-icon" onClick={() => addLocalItemListItem(jo.id, origIdx, 'driverName')} style={{ padding: '5px', height: 'auto', color: 'var(--success)', background: 'var(--success-bg)' }} title={isID ? "Tambah Sopir" : "Add Driver"}>
                                                            <Plus size={12} />
                                                          </button>
                                                        )}
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <div className="grid-responsive-3">
                                          {/* Multi Container */}
                                          <div className="input-group">
                                            <label>{isID ? 'Nomor Kontainer' : 'Container Number'} <span style={{ color: 'var(--danger)' }}>*</span></label>
                                            {(localData[jo.id]?.containerNo || []).map((c, i, arr) => (
                                              <div key={i} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                                                <input disabled={!canWrite} type="text" value={c} onChange={e => handleLocalListItemUpdate(jo.id, 'containerNo', i, e.target.value)} placeholder="CONT-123456" />
                                                {arr.length > 1 && canWrite && (
                                                  <button className="btn-icon" onClick={() => removeLocalListItem(jo.id, 'containerNo', i)} style={{ padding: '5px', height: 'auto', opacity: 0.5 }} title={isID ? "Hapus" : "Delete"}>
                                                    <X size={12} />
                                                  </button>
                                                )}
                                                {canWrite && (
                                                  <button className="btn-icon" onClick={() => addLocalListItem(jo.id, 'containerNo')} style={{ padding: '5px', height: 'auto', color: 'var(--success)', background: 'var(--success-bg)' }} title={isID ? "Tambah Kontainer" : "Add Container"}>
                                                    <Plus size={12} />
                                                  </button>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                          
                                          {/* Multi Vehicle */}
                                          <div className="input-group">
                                            <label>{isID ? 'Nomor Kendaraan' : 'Vehicle Number'} <span style={{ color: 'var(--danger)' }}>*</span></label>
                                            {(localData[jo.id]?.vehicleNo || []).map((v, i, arr) => (
                                              <div key={i} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                                                <input disabled={!canWrite} type="text" value={v} onChange={e => handleLocalListItemUpdate(jo.id, 'vehicleNo', i, e.target.value)} placeholder="B 1234 ABC" />
                                                {arr.length > 1 && canWrite && (
                                                  <button className="btn-icon" onClick={() => removeLocalListItem(jo.id, 'vehicleNo', i)} style={{ padding: '5px', height: 'auto', opacity: 0.5 }} title={isID ? "Hapus" : "Delete"}>
                                                    <X size={12} />
                                                  </button>
                                                )}
                                                {canWrite && (
                                                  <button className="btn-icon" onClick={() => addLocalListItem(jo.id, 'vehicleNo')} style={{ padding: '5px', height: 'auto', color: 'var(--success)', background: 'var(--success-bg)' }} title={isID ? "Tambah Kendaraan" : "Add Vehicle"}>
                                                    <Plus size={12} />
                                                  </button>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                          
                                          {/* Multi Driver */}
                                          <div className="input-group">
                                            <label>{isID ? 'Nama Sopir' : 'Driver Name'} <span style={{ color: 'var(--danger)' }}>*</span></label>
                                            {(localData[jo.id]?.driverName || []).map((d, i, arr) => (
                                              <div key={i} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                                                <input disabled={!canWrite} type="text" value={d} onChange={e => handleLocalListItemUpdate(jo.id, 'driverName', i, e.target.value)} placeholder={isID ? "Nama Sopir" : "Driver Name"} />
                                                {arr.length > 1 && canWrite && (
                                                  <button className="btn-icon" onClick={() => removeLocalListItem(jo.id, 'driverName', i)} style={{ padding: '5px', height: 'auto', opacity: 0.5 }} title={isID ? "Hapus" : "Delete"}>
                                                    <X size={12} />
                                                  </button>
                                                )}
                                                {canWrite && (
                                                  <button className="btn-icon" onClick={() => addLocalListItem(jo.id, 'driverName')} style={{ padding: '5px', height: 'auto', color: 'var(--success)', background: 'var(--success-bg)' }} title={isID ? "Tambah Sopir" : "Add Driver"}>
                                                    <Plus size={12} />
                                                  </button>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      <div className="input-group">
                                        <label>{isID ? 'Status Aktivitas' : 'Activity Status'} <span style={{ color: 'var(--danger)' }}>*</span></label>
                                        <input 
                                          disabled={!canWrite}
                                          type="text" 
                                          value={localData[jo.id]?.activityStatus || ''} 
                                          onChange={e => handleLocalUpdate(jo.id, 'activityStatus', e.target.value)} 
                                          placeholder={isID ? "Perbarui status operasional terakhir..." : "Update last operational status..."} 
                                        />
                                      </div>
                                      
                                      <div className="input-group">
                                        <label>{isID ? 'Nama Kapal (Vessel)' : 'Vessel Name'}</label>
                                        <input 
                                          disabled={!canWrite}
                                          type="text" 
                                          value={localData[jo.id]?.vesselName || ''} 
                                          onChange={e => handleLocalUpdate(jo.id, 'vesselName', e.target.value)} 
                                          placeholder={isID ? "Masukkan nama kapal..." : "Enter vessel name..."} 
                                        />
                                      </div>
                                      
                                      {/* Date Pickers Grid */}
                                      <div className="grid-responsive-2">
                                        <div className="input-group">
                                          <label>{isID ? 'Waktu Pengiriman (Dispatched)' : 'Dispatched Date & Time'}</label>
                                          <input 
                                            disabled={!canWrite}
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
                                              disabled={!canWrite}
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
                                        {Array.isArray(jo.items) && jo.items.length > 0 ? (
                                          <div>
                                            <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '8px' }}>
                                              {isID ? 'Daftar Aktivitas:' : 'Activities List:'}
                                            </strong>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                              {jo.items.map((item, idx) => (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                                                  <span>• {item.description}</span>
                                                  <span style={{ fontWeight: '700', color: 'var(--secondary)' }}>
                                                    {isID ? 'Jumlah:' : 'Qty:'} {item.issueQuantity || item.quantity || 1}
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        ) : (
                                          <>
                                            <strong style={{ color: 'var(--text)' }}>{isID ? 'Instruksi Lengkap:' : 'Full Instruction:'}</strong> {jo.jobDescription || jo.instruction || '-'}
                                          </>
                                        )}
                                      </div>
                                      
                                      {canWrite && (
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
                                              style={{ padding: '10px 20px', fontSize: '0.85rem', background: 'var(--success)', color: 'white', border: 'none' }}
                                              onClick={() => handleDone(jo)}
                                            >
                                              {isID ? 'Selesaikan Pekerjaan' : 'Complete Job'}
                                            </ButtonWithLoading>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div>
                                      <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.85rem', fontWeight: '600' }}>{isID ? 'Dokumentasi Lapangan' : 'Field Documentation'}</label>
                                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
                                        {jo.photos?.map((photo, idx) => (
                                          <div key={idx} style={{ position: 'relative', width: '70px', height: '70px' }}>
                                            <img src={photo} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }} />
                                            {canWrite && (
                                              <button onClick={() => removePhoto(jo.id, idx)} style={{ position: 'absolute', top: -5, right: -5, background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', fontSize: '10px' }}>×</button>
                                            )}
                                          </div>
                                        ))}
                                        {canWrite && (
                                          <div 
                                            onClick={() => { setUploadingForId(jo.id); fileInputRef.current.click(); }}
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
                  </React.Fragment>
                );
              });
            })()}
          </tbody>
        </table></div>)}

        {/* Surat Jalan Modal */}
        {activeTab !== 'pending_invoices' && filteredJOs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '100px 20px' }}>
            <Package size={64} color="rgba(255,255,255,0.05)" style={{ marginBottom: '20px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
              {activeTab === 'active' ? (isID ? 'Tidak ada operasi aktif yang ditugaskan.' : 'No active operations assigned.') : (isID ? 'Tidak ada catatan selesai yang ditemukan.' : 'No completed records found.')}
            </p>
          </div>
        )}
      </div>

      {/* Bank Selection Modal for Invoice Issuance */}
      {issuingInvoiceJoId && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:10001, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
          <div className="glass-card" style={{ width:'100%', maxWidth:'500px', padding:'35px', textAlign:'center' }}>
            <h3 style={{ color:'var(--secondary)', marginBottom:'20px' }}>{isID ? 'Pilih Rekening untuk Invoice' : 'Select Bank Account for Invoice'}</h3>
            <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', marginBottom:'25px' }}>
              {isID ? 'Silakan pilih rekening bank yang akan dicantumkan pada Invoice untuk Job Order:' : 'Please select the bank account to be printed on the Invoice for Job Order:'} <strong>{issuingInvoiceJoId}</strong>
            </p>
            
            <div style={{ marginBottom:'30px' }}>
              <select 
                value={selectedBankId} 
                onChange={(e) => setSelectedBankId(e.target.value)}
                style={{ width:'100%', padding:'12px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'10px', color:'var(--text)', fontSize:'1rem' }}
              >
                {companyBankAccounts.map(bank => (
                  <option key={bank.id} value={bank.id} style={{ background: 'var(--bg)', color: 'var(--text)' }}>
                    {bank.bankName} - {bank.accountNumber} ({bank.accountName})
                  </option>
                ))}
                {companyBankAccounts.length === 0 && <option value="" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>{isID ? 'Belum ada rekening terdaftar' : 'No registered bank accounts'}</option>}
              </select>
              {companyBankAccounts.length === 0 && (
                <p style={{ color:'var(--danger)', fontSize:'0.75rem', marginTop:'10px' }}>
                  {isID ? 'Mohon tambahkan rekening perusahaan di menu Pengaturan Rekening Bank terlebih dahulu.' : 'Please add a company bank account in the Settings menu first.'}
                </p>
              )}
            </div>

            <div style={{ marginBottom:'30px', textAlign:'left' }}>
              <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>
                {isID ? 'Keterangan (Opsional)' : 'Description (Optional)'}
              </label>
              <textarea 
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                placeholder={isID ? "Masukkan keterangan tambahan untuk invoice..." : "Enter additional description for the invoice..."}
                style={{ width:'100%', minHeight:'80px', padding:'12px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'10px', color:'var(--text)', fontSize:'0.9rem', resize:'vertical' }}
              />
            </div>

            <div style={{ display:'flex', gap:'12px', justifyContent:'center' }}>
              <button 
                onClick={() => setIssuingInvoiceJoId(null)} 
                className="btn" 
                style={{ flex:1, padding:'12px', background:'rgba(255,255,255,0.05)', color:'var(--text)' }}
              >
                {isID ? 'Batal' : 'Cancel'}
              </button>
              <button 
                onClick={() => {
                  const bank = companyBankAccounts.find(b => b.id === selectedBankId);
                  if (bank) {
                    handleIssueInvoice(issuingInvoiceJoId, bank, invoiceNotes);
                  } else {
                    toast.error(isID ? "Silakan pilih rekening bank yang valid." : "Please select a valid bank account.");
                  }
                }} 
                className="btn btn-gold" 
                style={{ flex:2, padding:'12px', fontWeight:'700' }}
                disabled={companyBankAccounts.length === 0}
              >
                {isID ? 'Konfirmasi & Terbitkan' : 'Confirm & Issue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Confirmation & Edit Modal */}
      {invoiceConfirmData && (() => {
        const f = invoiceConfirmData.form;
        const setF = (patch) => setInvoiceConfirmData(prev => ({ ...prev, form: { ...prev.form, ...patch } }));

        const updateItem = (idx, field, val) => {
          const next = [...f.items];
          next[idx] = { ...next[idx], [field]: val };
          setF({ items: next });
        };
        const addItem = () => setF({ items: [...f.items, { description: '', qty: 1, rate: 0 }] });
        const removeItem = (idx) => setF({ items: f.items.filter((_, i) => i !== idx) });

        const updateExtra = (idx, field, val) => {
          const next = [...f.extraCharges];
          next[idx] = { ...next[idx], [field]: val };
          setF({ extraCharges: next });
        };
        const addExtra = () => setF({ extraCharges: [...f.extraCharges, { description: '', qty: 1, rate: 0 }] });
        const removeExtra = (idx) => setF({ extraCharges: f.extraCharges.filter((_, i) => i !== idx) });

        const subtotal = [...f.items, ...f.extraCharges].reduce((s, l) => s + (parseFloat(l.qty) || 1) * (parseFloat(l.rate) || 0), 0);
        const taxAmt = subtotal * ((parseFloat(f.taxPercent) || 0) / 100);
        const grandTotal = subtotal + taxAmt;

        const fmtRp = (n) => `Rp ${n.toLocaleString('id-ID')}`;

        const inputStyle = { width: '100%', padding: '8px 11px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '0.88rem' };
        const labelStyle = { fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '5px', display: 'block' };

        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 10002, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: '780px', padding: '32px', marginTop: '10px', marginBottom: '30px' }}>

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '18px' }}>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '900', color: 'var(--secondary)' }}>🧾 {isID ? 'Konfirmasi & Edit Invoice' : 'Confirm & Edit Invoice'}</h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {isID ? 'Periksa dan edit semua data sebelum invoice diterbitkan.' : 'Review and edit all data before the invoice is issued.'}
                </p>
              </div>

              {/* Form Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <label style={labelStyle}>{isID ? 'No. Invoice' : 'Invoice No.'}</label>
                  <input type="text" value={f.id} onChange={(e) => setF({ id: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>{isID ? 'Tanggal Invoice' : 'Invoice Date'}</label>
                  <input type="date" value={f.date} onChange={(e) => setF({ date: e.target.value })} style={{ ...inputStyle, colorScheme: 'dark' }} />
                </div>
              </div>

              {/* Customer Info */}
              <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', background: 'rgba(255,255,255,0.015)' }}>
                <p style={{ ...labelStyle, fontSize: '0.72rem', color: 'var(--secondary)', marginBottom: '14px' }}>📋 {isID ? 'Info Pelanggan' : 'Customer Info'}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label style={labelStyle}>{isID ? 'Nama Customer' : 'Customer Name'}</label>
                    <input type="text" value={f.customerName} onChange={(e) => setF({ customerName: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>{isID ? 'Alamat' : 'Address'}</label>
                    <input 
                      type="text" 
                      value={f.customerAddress} 
                      onChange={(e) => setF({ customerAddress: e.target.value })} 
                      style={inputStyle} 
                      placeholder={isID ? 'Alamat perusahaan customer...' : 'Customer company address...'}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                  <div>
                    <label style={labelStyle}>PIC</label>
                    <input type="text" value={f.customerPic} onChange={(e) => setF({ customerPic: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>{isID ? 'Telepon' : 'Phone'}</label>
                    <input type="text" value={f.customerPhone} onChange={(e) => setF({ customerPhone: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input type="text" value={f.customerEmail} onChange={(e) => setF({ customerEmail: e.target.value })} style={inputStyle} />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>{isID ? 'Keterangan (Opsional)' : 'Description (Optional)'}</label>
                <textarea 
                  value={f.notes} 
                  onChange={(e) => setF({ notes: e.target.value })} 
                  style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} 
                  placeholder={isID ? 'Masukkan keterangan tambahan untuk invoice...' : 'Enter additional description for the invoice...'}
                />
              </div>

              {/* Service Items */}
              <div style={{ marginBottom: '24px' }}>
                <p style={{ ...labelStyle, fontSize: '0.72rem', color: 'var(--text)', marginBottom: '10px' }}>📦 {isID ? 'Item Layanan' : 'Service Items'}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {f.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input type="text" placeholder={isID ? "Deskripsi layanan..." : "Service description..."} value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} style={{ ...inputStyle, flex: 3 }} />
                      <input type="number" placeholder="Qty" value={item.qty} onChange={(e) => updateItem(idx, 'qty', e.target.value)} style={{ ...inputStyle, flex: 0.8 }} />
                      <input type="number" placeholder="Rate" value={item.rate} onChange={(e) => updateItem(idx, 'rate', e.target.value)} style={{ ...inputStyle, flex: 1.5 }} />
                      <button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '5px' }}><Trash2 size={16} /></button>
                    </div>
                  ))}
                  <button className="btn" onClick={addItem} style={{ alignSelf: 'flex-start', padding: '6px 12px', fontSize: '0.78rem', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <Plus size={14} /> {isID ? 'Tambah Item' : 'Add Item'}
                  </button>
                </div>
              </div>

              {/* Extra Charges */}
              <div style={{ marginBottom: '32px' }}>
                <p style={{ ...labelStyle, fontSize: '0.72rem', color: 'var(--text)', marginBottom: '10px' }}>➕ {isID ? 'Biaya Tambahan' : 'Extra Charges'}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {f.extraCharges.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input type="text" placeholder={isID ? "Deskripsi biaya tambahan..." : "Extra charge description..."} value={item.description} onChange={(e) => updateExtra(idx, 'description', e.target.value)} style={{ ...inputStyle, flex: 3 }} />
                      <input type="number" placeholder="Qty" value={item.qty} onChange={(e) => updateExtra(idx, 'qty', e.target.value)} style={{ ...inputStyle, flex: 0.8 }} />
                      <input type="number" placeholder="Rate" value={item.rate} onChange={(e) => updateExtra(idx, 'rate', e.target.value)} style={{ ...inputStyle, flex: 1.5 }} />
                      <button onClick={() => removeExtra(idx)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '5px' }}><Trash2 size={16} /></button>
                    </div>
                  ))}
                  <button className="btn" onClick={addExtra} style={{ alignSelf: 'flex-start', padding: '6px 12px', fontSize: '0.78rem', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <Plus size={14} /> {isID ? 'Tambah Biaya Tambahan' : 'Add Extra Charge'}
                  </button>
                </div>
              </div>

              {/* Bottom Details (Tax and Summary) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '30px', borderTop: '1px solid var(--glass-border)', paddingTop: '24px' }}>
                <div>
                  <label style={labelStyle}>{isID ? 'Pajak (%)' : 'Tax (%)'}</label>
                  <input type="number" value={f.taxPercent} onChange={(e) => setF({ taxPercent: e.target.value })} style={{ ...inputStyle, maxWidth: '120px' }} />
                  <div style={{ marginTop: '20px' }}>
                    <label style={labelStyle}>{isID ? 'Rekening Bank' : 'Bank Account'}</label>
                    <select value={f.bankAccountId} onChange={(e) => setF({ bankAccountId: e.target.value })} style={inputStyle}>
                      {companyBankAccounts.map(bank => (
                        <option key={bank.id} value={bank.id} style={{ background: 'var(--bg)', color: 'var(--text)' }}>
                          {bank.bankName} - {bank.accountNumber} ({bank.accountName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '20px' }}>
                  <p style={{ ...labelStyle, color: 'var(--secondary)', marginBottom: '12px' }}>{isID ? 'Ringkasan' : 'Summary'}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
                    {[
                      [isID ? 'Subtotal' : 'Subtotal', fmtRp(subtotal)],
                      [isID ? `Pajak (${f.taxPercent}%)` : `Tax (${f.taxPercent}%)`, fmtRp(taxAmt)],
                      [isID ? 'Total Tagihan' : 'Grand Total', fmtRp(grandTotal), true]
                    ].map(([label, val, highlight], idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontWeight: highlight ? '900' : 'normal', borderTop: highlight ? '1px dashed var(--glass-border)' : 'none', paddingTop: highlight ? '10px' : '0', color: highlight ? 'var(--secondary)' : 'var(--text)' }}>
                        <span>{label}</span>
                        <span>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '35px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
                <button className="btn" onClick={() => setInvoiceConfirmData(null)} style={{ padding: '10px 24px', background: 'rgba(255,255,255,0.05)' }}>
                  ← {isID ? 'Kembali' : 'Back'}
                </button>
                <button className="btn btn-gold" onClick={handleConfirmAndIssueInvoice} style={{ padding: '10px 30px', fontWeight: '800' }}>
                  ✓ {isID ? 'Konfirmasi & Terbitkan' : 'Confirm & Issue'}
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Fullscreen Photo Viewer Modal */}
      {photoViewer && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.95)', zIndex:10005, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px' }}>
          <button onClick={() => setPhotoViewer(null)} style={{ position:'absolute', top:'20px', right:'20px', background:'none', border:'none', color:'white', cursor:'pointer' }}><X size={30} /></button>
          <div style={{ maxWidth:'90%', maxHeight:'80%', overflow:'auto', display:'flex', gap:'20px', flexWrap:'wrap', justifyContent:'center' }}>
            {photoViewer.photos.map((url, i) => (
              <img key={i} src={url} alt={`Proof ${i}`} style={{ maxWidth:'400px', maxHeight:'400px', objectFit:'contain', borderRadius:'8px', border:'2px solid rgba(255,255,255,0.1)' }} />
            ))}
          </div>
          <div style={{ marginTop:'20px', color:'var(--text-muted)' }}>JO Reference: {photoViewer.joId}</div>
        </div>
      )}
    </div>
  );
};

export default Executor;

