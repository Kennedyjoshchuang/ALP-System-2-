import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Download, CheckCircle, XCircle, FileText, UserPlus, Search, Trash2, FileSpreadsheet, Edit, Users, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToExcel } from '../utils/exportUtils';
import { ButtonWithLoading } from '../components/ButtonWithLoading';
import toast from 'react-hot-toast';

;

const Marketing = () => {
  const context = useApp();
  
  const [activeTab, setActiveTab] = useState('jobOrders');
  const [showProspectForm, setShowProspectForm] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [quoteSearchTerm, setQuoteSearchTerm] = useState('');
  const [jobOrderSearchTerm, setJobOrderSearchTerm] = useState('');
  const [fullQuoteSearchTerm, setFullQuoteSearchTerm] = useState('');
  const [jobOrderSortBy, setJobOrderSortBy] = useState('created_desc');
  const [quotationSortBy, setQuotationSortBy] = useState('created_desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedQuoteJOs, setExpandedQuoteJOs] = useState({});
  const [activeProspectForQuote, setActiveProspectForQuote] = useState(null);
  const [activeProspectForEdit, setActiveProspectForEdit] = useState(null);
  const [editProspectData, setEditProspectData] = useState({
    name: '', address: '', phone: '', email: '', pic: '', notes: '', description: '', marketingName: '', marketingPhone: '', marketingEmail: '', companyAddress: ''
  });
  const [quoteGeneralNotes, setQuoteGeneralNotes] = useState('');
  const [quotePic, setQuotePic] = useState('');
  const [quoteItems, setQuoteItems] = useState([
    { description: '', rate: '', quantity: '1', unit: '' }
  ]);
  const [quoteValidFrom, setQuoteValidFrom] = useState('');
  const [quoteValidTo, setQuoteValidTo] = useState('');
  const [quoteMarketingName, setQuoteMarketingName] = useState('');
  const [quoteMarketingPhone, setQuoteMarketingPhone] = useState('');
  const [quoteMarketingEmail, setQuoteMarketingEmail] = useState('');
  const [prospectData, setProspectData] = useState({
    name: '', address: '', phone: '', email: '', pic: '', notes: '', description: '', marketingName: '', marketingPhone: '', marketingEmail: '', companyAddress: ''
  });

  const [activeCustomerForEdit, setActiveCustomerForEdit] = useState(null);
  const [editCustomerData, setEditCustomerData] = useState({ name: '', phone: '', email: '', address: '' });
  const [editCustomerCustomFields, setEditCustomerCustomFields] = useState([{ key: '', value: '' }]);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ name: '', phone: '', email: '', address: '' });
  const [newCustomerCustomFields, setNewCustomerCustomFields] = useState([{ key: '', value: '' }]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [prospectCustomFields, setProspectCustomFields] = useState([{ key: '', value: '' }]);
  const [editProspectCustomFields, setEditProspectCustomFields] = useState([{ key: '', value: '' }]);

  const [activeQuotationForEdit, setActiveQuotationForEdit] = useState(null);
  const [editQuotePic, setEditQuotePic] = useState('');
  const [editQuoteValidFrom, setEditQuoteValidFrom] = useState('');
  const [editQuoteValidTo, setEditQuoteValidTo] = useState('');
  const [editQuoteItems, setEditQuoteItems] = useState([{ description: '', rate: '', quantity: '1', unit: '' }]);
  const [editQuoteGeneralNotes, setEditQuoteGeneralNotes] = useState('');
  const [editQuoteCompanyAddress, setEditQuoteCompanyAddress] = useState('');
  const [editQuoteMarketingName, setEditQuoteMarketingName] = useState('');
  const [editQuoteMarketingPhone, setEditQuoteMarketingPhone] = useState('');
  const [editQuoteMarketingEmail, setEditQuoteMarketingEmail] = useState('');

  // Pre-fill PIC and Description when modal opens
  React.useEffect(() => {
    if (activeProspectForQuote) {
      setQuotePic(activeProspectForQuote.pic || '');
      setQuoteGeneralNotes(activeProspectForQuote.notes || '');
      setQuoteMarketingName(activeProspectForQuote.marketingName || '');
      setQuoteMarketingPhone(activeProspectForQuote.marketingPhone || '');
      setQuoteMarketingEmail(activeProspectForQuote.marketingEmail || '');
      // Use prospect's job description as default first item if empty
      if (activeProspectForQuote.description && quoteItems.length === 1 && !quoteItems[0].description) {
        setQuoteItems([{ description: activeProspectForQuote.description, rate: '', quantity: '1', unit: '' }]);
      }
    }
  }, [activeProspectForQuote]);

  // Removed auto-print useEffect to allow viewing draft without interruption

  if (!context) return null;
  const {
    customers = [], addCustomer, updateCustomer, deleteCustomer,
    prospects = [], addProspect, updateProspect, updateProspectStatus, deleteProspect,
    prospectDrafts = [], generateProspectDraft,
    quotations = [], createQuotation, updateQuotation, approveQuotation, unapproveQuotation, deleteQuotation,
    jobOrders = [],
    employees = [],
    user,
    hasAccess,
    t,
    loading,
    language
  } = context;

  const canWrite = hasAccess ? hasAccess('marketing', true) : false;
  const isID = language === 'id';

  const getQuotationTime = (q) => {
    if (!q.date) return 0;
    const d = new Date(q.date).getTime();
    return isNaN(d) ? 0 : d;
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--secondary)' }}>Loading Marketing Portal...</div>;
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


  const addQuoteItem = () => {
    setQuoteItems([...quoteItems, { description: '', rate: '', quantity: '1', unit: '' }]);
  };

  const removeQuoteItem = (index) => {
    if (quoteItems.length > 1) {
      setQuoteItems(quoteItems.filter((_, i) => i !== index));
    }
  };

  const updateQuoteItem = (index, field, value) => {
    const newItems = [...quoteItems];
    newItems[index][field] = value;
    setQuoteItems(newItems);
  };

  const handleOpenEditProspectModal = (prospect) => {
    setActiveProspectForEdit(prospect);
    setEditProspectData({
      name: prospect.name || '',
      address: prospect.address || '',
      phone: prospect.phone || '',
      email: prospect.email || '',
      pic: prospect.pic || '',
      notes: prospect.notes || '',
      description: prospect.description || '',
      marketingName: prospect.marketingName || '',
      marketingPhone: prospect.marketingPhone || '',
      marketingEmail: prospect.marketingEmail || '',
      companyAddress: prospect.companyAddress || ''
    });

    let fields = [];
    try {
      const parsed = typeof prospect.customData === 'string' 
        ? JSON.parse(prospect.customData || '{}') 
        : (prospect.customData || {});
      fields = Object.entries(parsed).map(([k, v]) => ({ key: k, value: String(v) }));
    } catch (e) {
      console.error("Error parsing prospect customData:", e);
    }
    if (fields.length === 0) {
      fields = [{ key: '', value: '' }];
    }
    setEditProspectCustomFields(fields);
  };

  const handleProspectEditSubmit = async (e) => {
    if (e) e.preventDefault();
    const customDataObj = {};
    editProspectCustomFields.forEach(f => {
      if (f.key.trim()) {
        customDataObj[f.key.trim()] = f.value;
      }
    });

    try {
      await updateProspect(activeProspectForEdit.id, {
        ...editProspectData,
        customData: customDataObj
      });
      setActiveProspectForEdit(null);
    } catch (error) {
      console.error("Gagal update prospek:", error);
      toast.error("Gagal memperbarui data calon pelanggan.");
    }
  };

  const handleProspectSubmit = (e) => {
    e.preventDefault();
    const customDataObj = {};
    prospectCustomFields.forEach(f => {
      if (f.key.trim()) {
        customDataObj[f.key.trim()] = f.value;
      }
    });

    addProspect({
      ...prospectData,
      customData: customDataObj
    });
    setProspectData({ name: '', address: '', phone: '', email: '', pic: '', notes: '', description: '', marketingName: '', marketingPhone: '', marketingEmail: '', companyAddress: '' });
    setProspectCustomFields([{ key: '', value: '' }]);
    setShowProspectForm(false);
  };



  const handleCreateProspectQuotation = async (e) => {
    if (e) e.preventDefault();
    if (!activeProspectForQuote) return;

    // Validate items
    if (quoteItems.length === 0 || quoteItems.some(item => !item.description || !item.rate || !item.quantity)) {
      toast("Please fill in all item details (Description, Rate, and Quantity).");
      return;
    }

    const totalAmount = quoteItems.reduce((sum, item) => {
      const r = parseFloat(item.rate) || 0;
      const q = parseFloat(item.quantity) || 0;
      return sum + (r * q);
    }, 0);

    const combinedDescription = quoteItems.map(item =>
      `${item.description} (Qty: ${item.quantity} ${item.unit || ''} @ Rp ${parseFloat(item.rate).toLocaleString()})`
    ).join('\n');

    try {
      const newQuote = await createQuotation({
        customerId: activeProspectForQuote.id,
        customerName: activeProspectForQuote.name,
        pic: quotePic,
        phone: activeProspectForQuote.phone,
        email: activeProspectForQuote.email,
        address: activeProspectForQuote.address,
        jobDescription: combinedDescription,
        items: quoteItems,
        generalNotes: quoteGeneralNotes,
        total: totalAmount,
        rate: totalAmount,
        quantity: 1,
        marketingName: quoteMarketingName,
        marketingPhone: quoteMarketingPhone,
        marketingEmail: quoteMarketingEmail,
        validFrom: quoteValidFrom,
        validTo: quoteValidTo,
        companyAddress: activeProspectForQuote.companyAddress
      });

      const printData = {
        id: newQuote.id,
        customerName: activeProspectForQuote.name,
        pic: quotePic,
        address: activeProspectForQuote.address,
        companyAddress: activeProspectForQuote.companyAddress,
        items: quoteItems,
        generalNotes: quoteGeneralNotes,
        validTo: quoteValidTo,
        date: new Date(),
        rate: totalAmount,
        marketingName: quoteMarketingName,
        marketingEmail: quoteMarketingEmail,
      };
      localStorage.setItem('print_quotation_data', JSON.stringify(printData));
      window.open('/print/quotation', '_blank');

      setActiveProspectForQuote(null);
      setQuoteGeneralNotes('');
      setQuotePic('');
      setQuoteValidFrom('');
      setQuoteValidTo('');
      setQuoteMarketingName('');
      setQuoteMarketingPhone('');
      setQuoteMarketingEmail('');
      setQuoteItems([{ description: '', rate: '', quantity: '1', unit: '' }]);
    } catch (error) {
      console.error("Quotation creation failed:", error);
      throw error; // Re-throw so ButtonWithLoading can handle it
    }
  };

  const handleOpenEditQuotationModal = (quote) => {
    setActiveQuotationForEdit(quote);
    setEditQuotePic(quote.pic || '');
    setEditQuoteValidFrom(quote.validFrom || '');
    setEditQuoteValidTo(quote.validTo || '');
    setEditQuoteItems(Array.isArray(quote.items) ? quote.items.map(item => ({
      description: item.description || '',
      rate: item.rate || '',
      quantity: item.quantity || '1',
      unit: item.unit || ''
    })) : [{ description: '', rate: '', quantity: '1', unit: '' }]);
    setEditQuoteGeneralNotes(quote.generalNotes || '');
    setEditQuoteCompanyAddress(quote.companyAddress || '');
    setEditQuoteMarketingName(quote.marketingName || '');
    setEditQuoteMarketingPhone(quote.marketingPhone || '');
    setEditQuoteMarketingEmail(quote.marketingEmail || '');
  };

  const handleSaveQuotationEdit = async (e) => {
    if (e) e.preventDefault();
    if (!activeQuotationForEdit) return;

    if (editQuoteItems.length === 0 || editQuoteItems.some(item => !item.description || !item.rate || !item.quantity)) {
      toast("Please fill in all item details (Description, Rate, and Quantity).");
      return;
    }

    const totalAmount = editQuoteItems.reduce((sum, item) => {
      const r = parseFloat(item.rate) || 0;
      const q = parseFloat(item.quantity) || 0;
      return sum + (r * q);
    }, 0);

    const combinedDescription = editQuoteItems.map(item =>
      `${item.description} (Qty: ${item.quantity} ${item.unit || ''} @ Rp ${parseFloat(item.rate).toLocaleString()})`
    ).join('\n');

    try {
      await updateQuotation(activeQuotationForEdit.id, {
        pic: editQuotePic,
        jobDescription: combinedDescription,
        items: editQuoteItems,
        generalNotes: editQuoteGeneralNotes,
        total: totalAmount,
        rate: totalAmount,
        validFrom: editQuoteValidFrom,
        validTo: editQuoteValidTo,
        companyAddress: editQuoteCompanyAddress,
        marketingName: editQuoteMarketingName,
        marketingPhone: editQuoteMarketingPhone,
        marketingEmail: editQuoteMarketingEmail
      });
      setActiveQuotationForEdit(null);
    } catch (error) {
      console.error("Quotation edit failed:", error);
      toast.error("Gagal menyimpan perubahan penawaran.");
    }
  };

  const addEditQuoteItem = () => {
    setEditQuoteItems([...editQuoteItems, { description: '', rate: '', quantity: '1', unit: '' }]);
  };

  const removeEditQuoteItem = (index) => {
    if (editQuoteItems.length > 1) {
      setEditQuoteItems(editQuoteItems.filter((_, i) => i !== index));
    }
  };

  const updateEditQuoteItem = (index, field, value) => {
    const newItems = [...editQuoteItems];
    newItems[index][field] = value;
    setEditQuoteItems(newItems);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      if (deleteConfirm.type === 'prospect') {
        await deleteProspect(deleteConfirm.id);
      } else if (deleteConfirm.type === 'customer') {
        await deleteCustomer(deleteConfirm.id);
      } else {
        await deleteQuotation(deleteConfirm.id);
      }
    } catch (err) {
      console.error("Deletion failed:", err);
    }
    setIsDeleting(false);
    setDeleteConfirm(null);
  };

  const filteredProspects = prospects
    .filter(p => filterByDate(p.date))
    .filter(p => {
      const name = p.name || '';
      const email = p.email || '';
      const phone = p.phone || '';
      const id = p.id || '';
      const pic = p.pic || '';
      const term = searchTerm.toLowerCase();
      return name.toLowerCase().includes(term) ||
             email.toLowerCase().includes(term) ||
             phone.toLowerCase().includes(term) ||
             id.toLowerCase().includes(term) ||
             pic.toLowerCase().includes(term);
    })
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  const filteredCustomers = customers
    .filter(c => {
      const name = c.name || c.customerName || '';
      const email = c.email || '';
      const phone = c.phone || '';
      const id = c.id || '';
      const address = c.address || '';
      const term = customerSearchTerm.toLowerCase();
      
      let customMatch = false;
      try {
        const customObj = typeof c.customData === 'string' ? JSON.parse(c.customData || '{}') : (c.customData || {});
        customMatch = Object.entries(customObj).some(([key, val]) => 
          key.toLowerCase().includes(term) || String(val).toLowerCase().includes(term)
        );
      } catch (e) {
        // ignore
      }

      return name.toLowerCase().includes(term) ||
             email.toLowerCase().includes(term) ||
             phone.toLowerCase().includes(term) ||
             id.toLowerCase().includes(term) ||
             address.toLowerCase().includes(term) ||
             customMatch;
    })
    .sort((a, b) => (a.name || a.customerName || '').localeCompare(b.name || b.customerName || ''));

  const handleCustomerSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!newCustomerData.name) {
      toast.error("Nama pelanggan harus diisi.");
      return;
    }

    const customDataObj = {};
    newCustomerCustomFields.forEach(f => {
      if (f.key.trim()) {
        customDataObj[f.key.trim()] = f.value;
      }
    });

    try {
      await addCustomer({
        ...newCustomerData,
        customData: customDataObj
      });
      toast.success(isID ? 'Pelanggan berhasil ditambahkan!' : 'Customer successfully added!');
      setNewCustomerData({ name: '', phone: '', email: '', address: '' });
      setNewCustomerCustomFields([{ key: '', value: '' }]);
      setShowCustomerForm(false);
    } catch (error) {
      console.error("Add customer failed:", error);
      toast.error(isID ? 'Gagal menambahkan pelanggan' : 'Failed to add customer');
    }
  };

  const handleCustomerEditSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!activeCustomerForEdit) return;

    const customDataObj = {};
    editCustomerCustomFields.forEach(f => {
      if (f.key.trim()) {
        customDataObj[f.key.trim()] = f.value;
      }
    });

    try {
      await updateCustomer(activeCustomerForEdit.id, {
        ...editCustomerData,
        customData: customDataObj
      });
      toast.success(isID ? 'Pelanggan berhasil diperbarui!' : 'Customer successfully updated!');
      setActiveCustomerForEdit(null);
    } catch (error) {
      console.error("Edit customer failed:", error);
      toast.error(isID ? 'Gagal memperbarui pelanggan' : 'Failed to update customer');
    }
  };

  const handleOpenEditCustomerModal = (customer) => {
    setActiveCustomerForEdit(customer);
    setEditCustomerData({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
    });
    
    let fields = [];
    try {
      const parsed = typeof customer.customData === 'string' 
        ? JSON.parse(customer.customData || '{}') 
        : (customer.customData || {});
      fields = Object.entries(parsed).map(([k, v]) => ({ key: k, value: String(v) }));
    } catch (e) {
      console.error("Error parsing customer customData:", e);
    }
    
    if (fields.length === 0) {
      fields = [{ key: '', value: '' }];
    }
    setEditCustomerCustomFields(fields);
  };

  const handleDownload = (quote) => {
    const relatedProspect = prospects.find(p => p.id === quote.customerId);
    const relatedCustomer = customers.find(c => c.id === quote.customerId);
    const address = quote.address || relatedProspect?.address || relatedCustomer?.address || 'Alamat tidak tersedia';

    const printData = {
      id: quote.id,
      customerName: quote.customerName,
      pic: quote.pic,
      address: address,
      companyAddress: quote.companyAddress || relatedProspect?.companyAddress,
      items: quote.items || [],
      generalNotes: quote.generalNotes || '',
      date: quote.date,
      rate: quote.total || quote.rate || 0,
      validTo: quote.validTo || '',
      marketingName: quote.marketingName,
      marketingEmail: quote.marketingEmail,
    };
    localStorage.setItem('print_quotation_data', JSON.stringify(printData));
    window.open('/print/quotation', '_blank');
  };

  const handleExport = () => {
    let dataToExport = [];
    let fileName = "";

    if (activeTab === 'jobOrders') {
      dataToExport = quotations
        .filter(q => q.status === 'approved' && filterByDate(q.date))
        .map(q => ({
          ID: q.id,
          Date: q.date,
          Customer: q.customerName,
          PIC: q.pic,
          Status: q.status
        }));
      fileName = "Job_Orders_Aktif";
    } else if (activeTab === 'quotationList') {
      dataToExport = quotations
        .filter(q => filterByDate(q.date))
        .map(q => ({
          ID: q.id,
          Date: q.date,
          Customer: q.customerName,
          PIC: q.pic,
          Total: q.total || q.rate,
          Status: q.status
        }));
      fileName = "Daftar_Penawaran";
    } else if (activeTab === 'prospects') {
      dataToExport = filteredProspects.map(p => ({
        Name: p.name,
        Email: p.email,
        Phone: p.phone,
        Address: p.address,
        Status: p.status,
        Date: p.date
      }));
      fileName = "Daftar_Calon_Pelanggan";
    }

    if (dataToExport.length === 0) {
      toast("Tidak ada data untuk di-export pada rentang tanggal ini.");
      return;
    }

    exportToExcel(dataToExport, fileName);
  };

  return (
    <div className="marketing-container" style={{ display: 'flex', flexDirection: 'column', gap: '25px', minWidth: 0, width: '100%' }}>




      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.85)', zIndex: 9999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '20px'
            }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
              className="glass-card" style={{ padding: '40px', maxWidth: '480px', width: '100%', textAlign: 'center' , overflowX: 'auto' }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🗑️</div>
              <h3 style={{ marginBottom: '10px', color: 'var(--danger)' }}>
                {deleteConfirm.type === 'prospect' 
                  ? 'Hapus Prospek?' 
                  : deleteConfirm.type === 'customer' 
                    ? 'Hapus Pelanggan Tersimpan?' 
                    : 'Hapus Penawaran?'}
              </h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>
                <strong style={{ color: 'var(--text)' }}>{deleteConfirm.id}</strong> — {deleteConfirm.name}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '30px' }}>
                {deleteConfirm.type === 'prospect'
                  ? 'Data prospek ini akan dihapus secara permanen.'
                  : deleteConfirm.type === 'customer'
                    ? (t('confirmDeleteCustomer') || 'Apakah Anda yakin ingin menghapus pelanggan ini? Ini tidak akan menghapus data job order atau faktur mereka.')
                    : 'Semua data Job Order dan Invoice terkait juga akan dihapus secara permanen.'}
                Tindakan ini tidak dapat dibatalkan.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  className="btn"
                  style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'var(--text)', border: '1px solid var(--border)' }}
                  onClick={() => setDeleteConfirm(null)}
                  disabled={isDeleting}
                >
                  Batal
                </button>
                <ButtonWithLoading
                  className="btn"
                  style={{ flex: 1, background: 'var(--danger)', color: 'white', border: 'none' }}
                  onClick={handleDeleteConfirm}
                >
                  Ya, Hapus
                </ButtonWithLoading>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prospect Quotation Form Modal */}
      <AnimatePresence>
        {activeProspectForQuote && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
          }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card" style={{ width: '100%', maxWidth: '900px', padding: '40px', maxHeight: '90vh', overflowY: 'auto' , overflowX: 'auto' }}
            >
              <h3 style={{ marginBottom: '25px', color: 'var(--secondary)' }}>{t('createQuotation')} - {activeProspectForQuote.name}</h3>
              <form onSubmit={handleCreateProspectQuotation}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                  <div className="input-group">
                    <label style={{ color: 'var(--secondary)', fontWeight: '600' }}>Attn: PIC Name</label>
                    <input
                      required
                      type="text"
                      value={quotePic}
                      onChange={e => setQuotePic(e.target.value)}
                      placeholder="Nama PIC..."
                      style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px', width:'100%' }}
                    />
                  </div>
                  <div className="input-group">
                    <label style={{ color: 'var(--secondary)', fontWeight: '600' }}>Berlaku Dari</label>
                    <input
                      required
                      type="date"
                      value={quoteValidFrom}
                      onChange={e => setQuoteValidFrom(e.target.value)}
                      style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px', width:'100%' }}
                    />
                  </div>
                  <div className="input-group">
                    <label style={{ color: 'var(--secondary)', fontWeight: '600' }}>Berlaku Sampai</label>
                    <input
                      required
                      type="date"
                      value={quoteValidTo}
                      onChange={e => setQuoteValidTo(e.target.value)}
                      style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px', width:'100%' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                  <div className="input-group">
                    <label style={{ color: 'var(--secondary)', fontWeight: '600' }}>Nama Marketing</label>
                    <select 
                      required 
                      value={quoteMarketingName} 
                      onChange={e => {
                        const emp = employees.find(emp => emp.name === e.target.value);
                        setQuoteMarketingName(e.target.value);
                        setQuoteMarketingPhone(emp?.phone || '');
                        setQuoteMarketingEmail(emp?.email || '');
                      }}
                      style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px', width: '100%', fontWeight: '600' }}
                    >
                      <option value="" style={{ background: 'var(--bg)', color: 'var(--text)' }}>-- Pilih Marketing --</option>
                      {employees.filter(e => e.position?.toLowerCase().includes('marketing')).map(e => (
                        <option key={e.id} value={e.name} style={{ background: 'var(--bg)', color: 'var(--text)' }}>{e.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label style={{ color: 'var(--secondary)', fontWeight: '600' }}>Nomor Telpon Marketing</label>
                    <input 
                      required 
                      type="text" 
                      value={quoteMarketingPhone} 
                      onChange={e => setQuoteMarketingPhone(e.target.value)} 
                      placeholder="+62 812..." 
                      style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px', width:'100%' }} 
                    />
                  </div>
                  <div className="input-group">
                    <label style={{ color: 'var(--secondary)', fontWeight: '600' }}>Email Marketing</label>
                    <input 
                      required 
                      type="email" 
                      value={quoteMarketingEmail} 
                      onChange={e => setQuoteMarketingEmail(e.target.value)} 
                      placeholder="marketing@alpfreight.co.id" 
                      style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px', width:'100%' }} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px 50px', minWidth: "700px", gap: '15px', marginBottom: '10px', fontWeight: '600', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <div>{t('activity')}</div>
                  <div>{t('ratePerTrip')}</div>
                  <div>{t('quantity')}</div>
                  <div>Satuan</div>
                  <div></div>
                </div>

                {quoteItems.map((item, index) => (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px 50px', minWidth: "700px", gap: '15px', marginBottom: '15px' }}>
                    <input required type="text" value={item.description} onChange={e => updateQuoteItem(index, 'description', e.target.value)} placeholder="Service description..." style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', padding: '10px' }} />
                    <input required type="number" value={item.rate} onChange={e => updateQuoteItem(index, 'rate', e.target.value)} style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', padding: '10px' }} />
                    <input required type="number" value={item.quantity} onChange={e => updateQuoteItem(index, 'quantity', e.target.value)} style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', padding: '10px' }} />
                    <input type="text" value={item.unit} onChange={e => updateQuoteItem(index, 'unit', e.target.value)} placeholder="Trip/Kg/..." style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', padding: '10px' }} />
                    <button type="button" onClick={() => removeQuoteItem(index)} style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>
                ))}

                <button type="button" onClick={addQuoteItem} className="btn" style={{ marginBottom: '20px', background: 'var(--secondary-bg)', color: 'var(--secondary)', border: '1px dashed var(--secondary)', width: '100%' }}>
                  + Add Item
                </button>

                <div className="input-group" style={{ marginBottom: '20px' }}>
                  <label style={{ color: 'var(--secondary)', fontWeight: '600' }}>Catatan Penawaran (Tampil di bagian bawah)</label>
                  <textarea
                    rows="3"
                    value={quoteGeneralNotes}
                    onChange={e => setQuoteGeneralNotes(e.target.value)}
                    placeholder="Masukkan syarat & ketentuan atau catatan tambahan di sini..."
                    style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '15px', width: '100%', fontFamily: 'inherit' }}
                  />
                </div>


                <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                  <button type="button" onClick={() => setActiveProspectForQuote(null)} className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'var(--text)', border: '1px solid var(--border)' }}>Close Form</button>
                  <ButtonWithLoading type="submit" className="btn btn-gold" style={{ flex: 1, background: 'var(--secondary)', color: 'white' }} onClick={handleCreateProspectQuotation}>
                    {t('createQuotation')}
                  </ButtonWithLoading>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Quotation Form Modal */}
      <AnimatePresence>
        {activeQuotationForEdit && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
          }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card" style={{ width: '100%', maxWidth: '900px', padding: '40px', maxHeight: '90vh', overflowY: 'auto', overflowX: 'auto' }}
            >
              <h3 style={{ marginBottom: '25px', color: 'var(--secondary)' }}>Edit Penawaran (Quotation) - {activeQuotationForEdit.id}</h3>
              <h5 style={{ marginTop: '-15px', marginBottom: '25px', color: 'var(--text-muted)' }}>Pelanggan: {activeQuotationForEdit.customerName}</h5>
              <form onSubmit={handleSaveQuotationEdit}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                  <div className="input-group">
                    <label style={{ color: 'var(--secondary)', fontWeight: '600' }}>Attn: PIC Name</label>
                    <input
                      required
                      type="text"
                      value={editQuotePic}
                      onChange={e => setEditQuotePic(e.target.value)}
                      placeholder="Nama PIC..."
                      style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px', width:'100%' }}
                    />
                  </div>
                  <div className="input-group">
                    <label style={{ color: 'var(--secondary)', fontWeight: '600' }}>Berlaku Dari</label>
                    <input
                      required
                      type="date"
                      value={editQuoteValidFrom}
                      onChange={e => setEditQuoteValidFrom(e.target.value)}
                      style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px', width:'100%' }}
                    />
                  </div>
                  <div className="input-group">
                    <label style={{ color: 'var(--secondary)', fontWeight: '600' }}>Berlaku Sampai</label>
                    <input
                      required
                      type="date"
                      value={editQuoteValidTo}
                      onChange={e => setEditQuoteValidTo(e.target.value)}
                      style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px', width:'100%' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                  <div className="input-group">
                    <label style={{ color: 'var(--secondary)', fontWeight: '600' }}>Nama Marketing</label>
                    <select 
                      required 
                      value={editQuoteMarketingName} 
                      onChange={e => {
                        const emp = employees.find(emp => emp.name === e.target.value);
                        setEditQuoteMarketingName(e.target.value);
                        setEditQuoteMarketingPhone(emp?.phone || '');
                        setEditQuoteMarketingEmail(emp?.email || '');
                      }}
                      style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px', width: '100%', fontWeight: '600' }}
                    >
                      <option value="" style={{ background: 'var(--bg)', color: 'var(--text)' }}>-- Pilih Marketing --</option>
                      {employees.filter(e => e.position?.toLowerCase().includes('marketing')).map(e => (
                        <option key={e.id} value={e.name} style={{ background: 'var(--bg)', color: 'var(--text)' }}>{e.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label style={{ color: 'var(--secondary)', fontWeight: '600' }}>Nomor Telpon Marketing</label>
                    <input 
                      required 
                      type="text" 
                      value={editQuoteMarketingPhone} 
                      onChange={e => setEditQuoteMarketingPhone(e.target.value)} 
                      placeholder="+62 812..." 
                      style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px', width:'100%' }} 
                    />
                  </div>
                  <div className="input-group">
                    <label style={{ color: 'var(--secondary)', fontWeight: '600' }}>Email Marketing</label>
                    <input 
                      required 
                      type="email" 
                      value={editQuoteMarketingEmail} 
                      onChange={e => setEditQuoteMarketingEmail(e.target.value)} 
                      placeholder="marketing@alpfreight.co.id" 
                      style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px', width:'100%' }} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px 50px', minWidth: "700px", gap: '15px', marginBottom: '10px', fontWeight: '600', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <div>{t('activity') || 'Deskripsi Pekerjaan'}</div>
                  <div>{t('ratePerTrip') || 'Tarif'}</div>
                  <div>{t('quantity') || 'Jumlah'}</div>
                  <div>Satuan</div>
                  <div></div>
                </div>

                {editQuoteItems.map((item, index) => (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px 50px', minWidth: "700px", gap: '15px', marginBottom: '15px' }}>
                    <input required type="text" value={item.description} onChange={e => updateEditQuoteItem(index, 'description', e.target.value)} placeholder="Service description..." style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', padding: '10px' }} />
                    <input required type="number" value={item.rate} onChange={e => updateEditQuoteItem(index, 'rate', e.target.value)} style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', padding: '10px' }} />
                    <input required type="number" value={item.quantity} onChange={e => updateEditQuoteItem(index, 'quantity', e.target.value)} style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', padding: '10px' }} />
                    <input type="text" value={item.unit} onChange={e => updateEditQuoteItem(index, 'unit', e.target.value)} placeholder="Trip/Kg/..." style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', padding: '10px' }} />
                    <button type="button" onClick={() => removeEditQuoteItem(index)} style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>
                ))}

                <button type="button" onClick={addEditQuoteItem} className="btn" style={{ marginBottom: '20px', background: 'var(--secondary-bg)', color: 'var(--secondary)', border: '1px dashed var(--secondary)', width: '100%' }}>
                  + Add Item
                </button>

                <div className="input-group" style={{ marginBottom: '20px' }}>
                  <label style={{ color: 'var(--secondary)', fontWeight: '600' }}>Alamat ALP (Tampil Di Header Penawaran)</label>
                  <input
                    required
                    type="text"
                    value={editQuoteCompanyAddress}
                    onChange={e => setEditQuoteCompanyAddress(e.target.value)}
                    placeholder="Masukkan alamat cabang ALP untuk penawaran ini..."
                    style={{ background: 'var(--input-bg)', border: '2px solid var(--secondary)', borderRadius: '12px', color: 'var(--text)', padding: '12px', width:'100%' }}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: '20px' }}>
                  <label style={{ color: 'var(--secondary)', fontWeight: '600' }}>Catatan Penawaran (Tampil di bagian bawah)</label>
                  <textarea
                    rows="3"
                    value={editQuoteGeneralNotes}
                    onChange={e => setEditQuoteGeneralNotes(e.target.value)}
                    placeholder="Syarat & ketentuan..."
                    style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '15px', width: '100%', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                  <button type="button" onClick={() => setActiveQuotationForEdit(null)} className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'var(--text)', border: '1px solid var(--border)' }}>Close Form</button>
                  <ButtonWithLoading type="submit" className="btn btn-gold" style={{ flex: 1, background: 'var(--secondary)', color: 'white' }} onClick={handleSaveQuotationEdit}>
                    Simpan Perubahan
                  </ButtonWithLoading>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Prospect Form Modal */}
      <AnimatePresence>
        {activeProspectForEdit && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
          }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card" style={{ width: '100%', maxWidth: '900px', padding: '40px', maxHeight: '90vh', overflowY: 'auto' , overflowX: 'auto' }}
            >
              <h3 style={{ marginBottom: '25px', color: 'var(--secondary)' }}>Edit Calon Pelanggan - {activeProspectForEdit.name}</h3>
              <form onSubmit={handleProspectEditSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                <div className="input-group">
                  <label>{t('customerName')}</label>
                  <input required type="text" value={editProspectData.name} onChange={e => setEditProspectData({ ...editProspectData, name: e.target.value })} style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px', width:'100%' }} />
                </div>
                <div className="input-group">
                  <label>PIC (Person In Charge)</label>
                  <input required type="text" value={editProspectData.pic} onChange={e => setEditProspectData({ ...editProspectData, pic: e.target.value })} placeholder="Nama penanggung jawab" style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px', width:'100%' }} />
                </div>
                <div className="input-group">
                  <label>{t('phoneNumber')}</label>
                  <input required type="text" value={editProspectData.phone} onChange={e => setEditProspectData({ ...editProspectData, phone: e.target.value })} style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px', width:'100%' }} />
                </div>
                <div className="input-group">
                  <label>{t('emailAddress')}</label>
                  <input required type="email" value={editProspectData.email} onChange={e => setEditProspectData({ ...editProspectData, email: e.target.value })} style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px', width:'100%' }} />
                </div>
                <div className="input-group">
                  <label>{t('address')}</label>
                  <input required type="text" value={editProspectData.address} onChange={e => setEditProspectData({ ...editProspectData, address: e.target.value })} style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px', width:'100%' }} />
                </div>
                <div className="input-group">
                  <label>Notes</label>
                  <input type="text" value={editProspectData.notes} onChange={e => setEditProspectData({ ...editProspectData, notes: e.target.value })} placeholder="Catatan tambahan" style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px', width:'100%' }} />
                </div>
                <div className="input-group">
                  <label>Nama Marketing</label>
                  <select 
                    required 
                    value={editProspectData.marketingName} 
                    onChange={e => {
                      const emp = employees.find(emp => emp.name === e.target.value);
                      setEditProspectData({ 
                        ...editProspectData, 
                        marketingName: e.target.value,
                        marketingPhone: emp?.phone || '',
                        marketingEmail: emp?.email || ''
                      });
                    }}
                    style={{ background: 'var(--input-bg)', border: '2px solid var(--secondary)', borderRadius: '12px', color: 'var(--text)', padding: '12px', fontWeight: '600', width: '100%' }}
                  >
                    <option value="" style={{ background: 'var(--bg)', color: 'var(--text)' }}>-- Pilih Marketing --</option>
                    {employees.filter(e => e.position?.toLowerCase().includes('marketing')).map(e => (
                      <option key={e.id} value={e.name} style={{ background: 'var(--bg)', color: 'var(--text)' }}>{e.name}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label>Nomor Telpon Marketing</label>
                  <input required type="text" value={editProspectData.marketingPhone} onChange={e => setEditProspectData({ ...editProspectData, marketingPhone: e.target.value })} placeholder="+62 812..." style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px', width:'100%' }} />
                </div>
                <div className="input-group">
                  <label>Email Marketing</label>
                  <input required type="email" value={editProspectData.marketingEmail} onChange={e => setEditProspectData({ ...editProspectData, marketingEmail: e.target.value })} placeholder="marketing@alpfreight.co.id" style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px', width:'100%' }} />
                </div>
                <div className="input-group" style={{ gridColumn: 'span 3' }}>
                  <label>Alamat ALP (Tampil Di Header Penawaran)</label>
                  <input required type="text" value={editProspectData.companyAddress} onChange={e => setEditProspectData({ ...editProspectData, companyAddress: e.target.value })} placeholder="Masukkan alamat cabang ALP untuk penawaran ini..." style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px', width:'100%' }} />
                </div>
                <div className="input-group" style={{ gridColumn: 'span 3' }}>
                  <label>{t('prospectJob')}</label>
                  <textarea required rows="2" value={editProspectData.description} onChange={e => setEditProspectData({ ...editProspectData, description: e.target.value })} style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '15px', width: '100%', fontFamily: 'inherit' }} />
                </div>
                
                <div style={{ gridColumn: 'span 3', borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h5 style={{ color: 'var(--secondary)', margin: 0, fontWeight: '600' }}>{t('customFields')}</h5>
                    <button 
                      type="button" 
                      onClick={() => setEditProspectCustomFields([...editProspectCustomFields, { key: '', value: '' }])}
                      className="btn btn-gold" 
                      style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Plus size={14} /> {t('addCustomField')}
                    </button>
                  </div>
                  {editProspectCustomFields.map((field, index) => (
                    <div key={index} style={{ display: 'flex', gap: '15px', marginBottom: '10px', alignItems: 'center' }}>
                      <input 
                        placeholder={isID ? "Nama Kolom (misal: NPWP)" : "Field Name (e.g. NPWP)"}
                        type="text" 
                        value={field.key} 
                        onChange={e => {
                          const updated = [...editProspectCustomFields];
                          updated[index].key = e.target.value;
                          setEditProspectCustomFields(updated);
                        }}
                        style={{ flex: 1, background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px' }}
                      />
                      <input 
                        placeholder={isID ? "Nilai Kolom" : "Field Value"}
                        type="text" 
                        value={field.value} 
                        onChange={e => {
                          const updated = [...editProspectCustomFields];
                          updated[index].value = e.target.value;
                          setEditProspectCustomFields(updated);
                        }}
                        style={{ flex: 2, background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px' }}
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const updated = editProspectCustomFields.filter((_, i) => i !== index);
                          setEditProspectCustomFields(updated.length ? updated : [{ key: '', value: '' }]);
                        }}
                        style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger-border)', padding: '12px', borderRadius: '12px', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '15px', gridColumn: 'span 3', marginTop: '20px' }}>
                  <button type="button" onClick={() => setActiveProspectForEdit(null)} className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'var(--text)', border: '1px solid var(--border)' }}>Batal</button>
                  <ButtonWithLoading type="submit" className="btn btn-gold" style={{ flex: 1, background: 'var(--secondary)', color: 'white' }} onClick={handleProspectEditSubmit}>
                    Simpan Perubahan
                  </ButtonWithLoading>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Customer Form Modal */}
      <AnimatePresence>
        {activeCustomerForEdit && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
          }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card" style={{ width: '100%', maxWidth: '900px', padding: '40px', maxHeight: '90vh', overflowY: 'auto' , overflowX: 'auto' }}
            >
              <h3 style={{ marginBottom: '25px', color: 'var(--secondary)' }}>{t('editCustomer') || 'Edit Saved Customer'} - {activeCustomerForEdit.name}</h3>
              <form onSubmit={handleCustomerEditSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                <div className="input-group">
                  <label>{t('customerName')}</label>
                  <input required type="text" value={editCustomerData.name} onChange={e => setEditCustomerData({ ...editCustomerData, name: e.target.value })} style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px', width: '100%' }} />
                </div>
                <div className="input-group">
                  <label>{t('phoneNumber')}</label>
                  <input type="text" value={editCustomerData.phone} onChange={e => setEditCustomerData({ ...editCustomerData, phone: e.target.value })} style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px', width: '100%' }} />
                </div>
                <div className="input-group">
                  <label>{t('emailAddress')}</label>
                  <input type="email" value={editCustomerData.email} onChange={e => setEditCustomerData({ ...editCustomerData, email: e.target.value })} style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px', width: '100%' }} />
                </div>
                <div className="input-group" style={{ gridColumn: 'span 3' }}>
                  <label>{t('address')}</label>
                  <input type="text" value={editCustomerData.address} onChange={e => setEditCustomerData({ ...editCustomerData, address: e.target.value })} style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px', width: '100%' }} />
                </div>
                
                <div style={{ gridColumn: 'span 3', borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h5 style={{ color: 'var(--secondary)', margin: 0, fontWeight: '600' }}>{t('customFields')}</h5>
                    <button 
                      type="button" 
                      onClick={() => setEditCustomerCustomFields([...editCustomerCustomFields, { key: '', value: '' }])}
                      className="btn btn-gold" 
                      style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Plus size={14} /> {t('addCustomField')}
                    </button>
                  </div>
                  {editCustomerCustomFields.map((field, index) => (
                    <div key={index} style={{ display: 'flex', gap: '15px', marginBottom: '10px', alignItems: 'center' }}>
                      <input 
                        placeholder={isID ? "Nama Kolom (misal: NPWP)" : "Field Name (e.g. NPWP)"}
                        type="text" 
                        value={field.key} 
                        onChange={e => {
                          const updated = [...editCustomerCustomFields];
                          updated[index].key = e.target.value;
                          setEditCustomerCustomFields(updated);
                        }}
                        style={{ flex: 1, background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px' }}
                      />
                      <input 
                        placeholder={isID ? "Nilai Kolom" : "Field Value"}
                        type="text" 
                        value={field.value} 
                        onChange={e => {
                          const updated = [...editCustomerCustomFields];
                          updated[index].value = e.target.value;
                          setEditCustomerCustomFields(updated);
                        }}
                        style={{ flex: 2, background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px' }}
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const updated = editCustomerCustomFields.filter((_, i) => i !== index);
                          setEditCustomerCustomFields(updated.length ? updated : [{ key: '', value: '' }]);
                        }}
                        style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger-border)', padding: '12px', borderRadius: '12px', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '15px', gridColumn: 'span 3', marginTop: '20px' }}>
                  <button type="button" onClick={() => setActiveCustomerForEdit(null)} className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'var(--text)', border: '1px solid var(--border)' }}>Batal</button>
                  <ButtonWithLoading type="submit" className="btn btn-gold" style={{ flex: 1, background: 'var(--secondary)', color: 'white' }} onClick={handleCustomerEditSubmit}>
                    Simpan Perubahan
                  </ButtonWithLoading>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Draft Modal */}
      <AnimatePresence>
        {selectedDraft && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.95)',
            zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
            padding: '40px 20px', overflowY: 'auto', backdropFilter: 'blur(10px)'
          }}>
            <style>{`
              @media print {
                body > * { display: none !important; }
                .draft-print-overlay { display: flex !important; position: static !important; background: white !important; padding: 0 !important; }
                #quotation-print-area { box-shadow: none !important; width: 210mm !important; min-height: 297mm !important; margin: 0 !important; padding: 1cm !important; }
                .no-print { display: none !important; }
              }
            `}</style>
            <motion.div 
              id="quotation-print-area"
              className="quotation-modal-content"
              style={{
                width: '210mm',
                minHeight: '297mm',
                background: 'white',
                margin: '0 auto',
                padding: '1cm',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                color: '#000'
              }}
            >
              <div className="no-print" style={{ 
                position: 'sticky', top: '0', right: '0', 
                display: 'flex', justifyContent: 'flex-end', gap: '15px', 
                padding: '20px', background: 'rgba(255,255,255,0.9)', 
                backdropFilter: 'blur(10px)', zIndex: 10,
                borderBottom: '1px solid #e2e8f0', marginBottom: '20mm'
              }}>
                <button onClick={() => setSelectedDraft(null)} className="btn" style={{ height: '45px', padding: '0 30px', fontSize: '1rem', background: '#f1f5f9', color: '#64748b', border: 'none' }}>
                  Close
                </button>
                <button onClick={() => window.print()} className="btn" style={{ height: '45px', padding: '0 30px', fontSize: '1rem', background: '#0f172a', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🖨️ Print
                </button>
              </div>

                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '25px', marginBottom: '45px' }}>
                  <div style={{ display: "flex", gap: "25px", alignItems: "center", flexWrap: "wrap" }}>
                    <img src="/assets/logo.png" alt="Logo" style={{ width: '75px', height: '75px', objectFit: 'contain' }} />
                    <div>
                      <h4 style={{ margin: 0, fontWeight: '900', fontSize: '1.1rem', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>LOGISTICS & FREIGHT FORWARDING</h4>
                      <div className="text-slate" style={{ fontSize: '0.75rem', lineHeight: '1.4', marginTop: '5px', maxWidth: '300px', fontWeight: '500' }}>
                        {selectedDraft.companyAddress || "Ruko The Summer B1-2A, Jl. Centre Point, Teluk Tering, Batam Kota, Batam"}
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate" style={{ padding: '18px 30px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'right', minWidth: '240px' }}>
                    <p style={{ margin: 0, fontWeight: '900', fontSize: '1.1rem', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>NO. {selectedDraft.id}</p>
                    <p className="text-slate" style={{ margin: '4px 0 0 0', fontWeight: '700', fontSize: '0.9rem' }}>
                      {new Date(selectedDraft.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '60px', marginBottom: '70px' }}>
                  {/* Customer Details */}
                  <div style={{ borderLeft: '4px solid #065f46', paddingLeft: '30px' }}>
                    <h5 className="text-slate" style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '800', marginBottom: '18px', letterSpacing: '1.5px' }}>CUSTOMER DETAILS</h5>
                    <h3 className="text-gold" style={{ margin: '0 0 10px 0', fontSize: '2.4rem', fontWeight: '900', letterSpacing: '-0.5px', lineHeight: '1.1' }}>{selectedDraft.customerName}</h3>
                    <p className="text-green" style={{ margin: '0 0 8px 0', fontSize: '1.3rem', fontWeight: '800' }}>Attn: {selectedDraft.pic || 'Purchasing Department'}</p>
                    <p className="text-slate" style={{ margin: 0, fontSize: '1.15rem', fontWeight: '600' }}>{selectedDraft.address || 'Batam'}</p>
                  </div>

                  {/* Marketing Details */}
                  <div style={{ textAlign: 'right' }}>
                    <h5 className="text-slate" style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '800', marginBottom: '18px', letterSpacing: '1.5px' }}>MARKETING PERSON</h5>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '1.8rem', fontWeight: '900', color: '#0f172a' }}>{selectedDraft.marketingName || 'PT. Alpha Logistics Prakarsa Team'}</h4>
                    <p className="text-slate" style={{ margin: 0, fontWeight: '700', fontSize: '1rem' }}>{selectedDraft.marketingEmail || 'marketing@alp.co.id'}</p>
                    <p className="text-slate" style={{ margin: '4px 0 25px 0', fontWeight: '700', fontSize: '1rem' }}>{selectedDraft.marketingPhone || '+62 813-6562-2272'}</p>
                    <div style={{ borderTop: '1px solid #e2e8f0', display: 'inline-block', paddingTop: '12px' }}>
                      <span className="text-slate" style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '800', letterSpacing: '1px', marginRight: '12px' }}>VALIDITY PERIOD:</span>
                      <span style={{ color: '#0f172a', fontWeight: '900', fontSize: '0.95rem' }}>{selectedDraft.validTo || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div style={{ flex: 1 }}>
                  <div className="table-container"><table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '50px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #0f172a' }}>
                        <th className="text-slate" style={{ padding: '15px 0', textAlign: 'left', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: '800', letterSpacing: '1px' }}>DESCRIPTION</th>
                        <th className="text-slate" style={{ padding: '15px 0', textAlign: 'center', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: '800', width: '140px', letterSpacing: '1px' }}>UNIT RATE</th>
                        <th className="text-slate" style={{ padding: '15px 0', textAlign: 'center', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: '800', width: '100px', letterSpacing: '1px' }}>QTY</th>
                        <th className="text-slate" style={{ padding: '15px 0', textAlign: 'right', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: '800', width: '160px', letterSpacing: '1px' }}>AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDraft.items && selectedDraft.items.length > 0 ? (
                        selectedDraft.items.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '20px 0' }}>
                              <div style={{ fontWeight: '900', fontSize: '1.2rem', color: '#0f172a' }}>{item.description}</div>
                              <div className="text-slate" style={{ fontSize: '0.8rem', marginTop: '4px', fontWeight: '600' }}>Premium Logistics & Freight Services</div>
                            </td>
                            <td className="text-slate" style={{ padding: '20px 0', textAlign: 'center', fontWeight: '700', fontSize: '1.05rem' }}>
                              IDR {parseFloat(item.rate).toLocaleString()}
                            </td>
                            <td style={{ padding: '20px 0', textAlign: 'center', color: '#0f172a' }}>
                              <div style={{ fontWeight: '900', fontSize: '1.1rem' }}>{item.quantity}</div>
                              <div className="text-slate" style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '800' }}>{item.unit || 'Unit'}</div>
                            </td>
                            <td style={{ padding: '20px 0', textAlign: 'right', fontWeight: '950', fontSize: '1.2rem', color: '#0f172a' }}>
                              IDR {(Number(item.rate || 0) * Number(item.quantity || 1)).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-slate" style={{ padding: '50px 0', textAlign: 'center', fontStyle: 'italic', fontSize: '1.1rem' }}>
                            No services listed for this quotation.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table></div>

                  {/* Grand Total Section */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '35px', marginTop: '20px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <h3 className="text-gold" style={{ margin: 0, textTransform: 'uppercase', fontSize: '1.2rem', fontWeight: '900', letterSpacing: '1px' }}>GRAND TOTAL</h3>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <h2 className="text-gold" style={{ margin: 0, fontSize: '3.8rem', fontWeight: '950', letterSpacing: '-2px' }}>
                        IDR {Number(selectedDraft.rate || 0).toLocaleString()}
                      </h2>
                    </div>
                  </div>

                  {selectedDraft.generalNotes && (
                    <div style={{ padding: '25px 0', marginTop: '10px', borderTop: '1px dashed #e2e8f0' }}>
                      <h5 className="text-slate" style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: '0.95rem', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '1px' }}>Notes & Terms:</h5>
                      <p className="text-slate" style={{ margin: 0, fontSize: '1rem', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontWeight: '500' }}>{selectedDraft.generalNotes}</p>
                    </div>
                  )}
                  
                  <div style={{ flex: 1 }}></div>
                </div>

                {/* Footer Section */}
                <div style={{ marginTop: 'auto', paddingTop: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ maxWidth: '400px' }}>
                    <p className="text-slate" style={{ fontSize: '0.85rem', fontWeight: '700', margin: '0 0 6px 0' }}>* Pricing is inclusive of standard handling fees.</p>
                    <p className="text-slate" style={{ fontSize: '0.85rem', fontWeight: '700', margin: 0 }}>* Validity is subject to space availability.</p>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: '300px' }}>
                    <p style={{ fontWeight: '900', fontSize: '1rem', color: '#0f172a', textTransform: 'uppercase', marginBottom: '80px', letterSpacing: '1.5px' }}>AUTHORIZED SIGNATURE</p>
                    <div style={{ borderBottom: '2.5px solid #0f172a', width: '250px', margin: '0 auto 15px auto' }}></div>
                    <p style={{ margin: 0, fontWeight: '900', fontSize: '1.2rem', color: '#0f172a' }}>Management</p>
                    <p className="text-slate" style={{ margin: 0, fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>PT. OMEGA TRUST LOGISTIK</p>
                  </div>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content - Hidden during Print */}
      <div className="no-print">
        {/* Header & Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', gap: '30px' }}>
          <button
            onClick={() => setActiveTab('jobOrders')}
            style={{
              background: 'none', border: 'none', padding: '10px 0',
              color: activeTab === 'jobOrders' ? 'var(--secondary)' : 'var(--text-muted)',
              fontSize: '1rem', fontWeight: '600', cursor: 'pointer', position: 'relative', transition: 'all 0.3s'
            }}
          >
            {t('activeJobOrders') || 'Active JO'}
            {activeTab === 'jobOrders' && <motion.div layoutId="activeTab" style={{ position: 'absolute', bottom: -1, left: 0, right: 0, background: 'var(--secondary)', height: '2px' }} />}
          </button>
          <button
            onClick={() => setActiveTab('quotationList')}
            style={{
              background: 'none', border: 'none', padding: '10px 0',
              color: activeTab === 'quotationList' ? 'var(--secondary)' : 'var(--text-muted)',
              fontSize: '1rem', fontWeight: '600', cursor: 'pointer', position: 'relative', transition: 'all 0.3s'
            }}
          >
            {t('quotationList') || 'Quotation List'}
            {activeTab === 'quotationList' && <motion.div layoutId="activeTab" style={{ position: 'absolute', bottom: -1, left: 0, right: 0, background: 'var(--secondary)', height: '2px' }} />}
          </button>
          <button
            onClick={() => setActiveTab('prospects')}
            style={{
              background: 'none', border: 'none', padding: '10px 0',
              color: activeTab === 'prospects' ? 'var(--secondary)' : 'var(--text-muted)',
              fontSize: '1rem', fontWeight: '600', cursor: 'pointer', position: 'relative', transition: 'all 0.3s'
            }}
          >
            {t('prospectCustomers')}
            {activeTab === 'prospects' && <motion.div layoutId="activeTab" style={{ position: 'absolute', bottom: -1, left: 0, right: 0, background: 'var(--secondary)', height: '2px' }} />}
          </button>
          <button
            onClick={() => setActiveTab('savedCustomers')}
            style={{
              background: 'none', border: 'none', padding: '10px 0',
              color: activeTab === 'savedCustomers' ? 'var(--secondary)' : 'var(--text-muted)',
              fontSize: '1rem', fontWeight: '600', cursor: 'pointer', position: 'relative', transition: 'all 0.3s'
            }}
          >
            {t('savedCustomers') || 'Saved Customers'}
            {activeTab === 'savedCustomers' && <motion.div layoutId="activeTab" style={{ position: 'absolute', bottom: -1, left: 0, right: 0, background: 'var(--secondary)', height: '2px' }} />}
          </button>
        </div>

        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center' }}>
            {canWrite && activeTab === 'prospects' && (
              <button className="btn btn-gold" onClick={() => setShowProspectForm(!showProspectForm)} style={{ marginBottom: '10px' }}>
                <Plus size={18} /> {showProspectForm ? t('cancel') : t('addProspect')}
              </button>
            )}
            {canWrite && activeTab === 'savedCustomers' && (
              <button className="btn btn-gold" onClick={() => setShowCustomerForm(!showCustomerForm)} style={{ marginBottom: '10px' }}>
                <Plus size={18} /> {showCustomerForm ? t('cancel') : t('addCustomer')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Unified Search & Date Filter Bar */}
      <div className="glass-card" style={{ padding: '15px 25px', marginBottom: '25px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', background: 'rgba(255,255,255,0.03)' , overflowX: 'auto' }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Filter Tanggal:</span>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.85rem' }} />
          <span style={{ color: 'var(--text-muted)' }}>s/d</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.85rem' }} />
          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(''); setEndDate(''); }} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600' }}>Reset</button>
          )}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-gold" onClick={handleExport} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <FileSpreadsheet size={18} /> Export Excel
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showProspectForm && activeTab === 'prospects' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="glass-card" style={{ padding: '30px', overflow: 'hidden' , overflowX: 'auto' }}
          >
            <form onSubmit={handleProspectSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              <div className="input-group" style={{ gridColumn: 'span 3', borderBottom: '1px dashed var(--border)', paddingBottom: '15px', marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)' }}>
                  <Users size={16} /> {t('loadCustomer') || 'Load Saved Customer Data'}
                </label>
                <select
                  value=""
                  onChange={e => {
                    const selectedId = e.target.value;
                    if (!selectedId) return;
                    const cust = customers.find(c => c.id === selectedId);
                    if (cust) {
                      setProspectData({
                        ...prospectData,
                        name: cust.name || '',
                        phone: cust.phone || '',
                        email: cust.email || '',
                        address: cust.address || '',
                      });

                      let fields = [];
                      try {
                        const parsed = typeof cust.customData === 'string' 
                          ? JSON.parse(cust.customData || '{}') 
                          : (cust.customData || {});
                        fields = Object.entries(parsed).map(([k, v]) => ({ key: k, value: String(v) }));
                      } catch (e) {
                        console.error("Error parsing loaded customer customData:", e);
                      }
                      if (fields.length === 0) {
                        fields = [{ key: '', value: '' }];
                      }
                      setProspectCustomFields(fields);

                      toast.success(isID ? 'Data pelanggan berhasil dimuat!' : 'Customer data loaded successfully!');
                    }
                  }}
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px', width: '100%', cursor: 'pointer', fontWeight: '600' }}
                >
                  <option value="">{isID ? '-- Pilih Pelanggan untuk Memuat Data --' : '-- Select Customer to Load Data --'}</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id} style={{ background: 'var(--bg)', color: 'var(--text)' }}>{c.name} ({c.id})</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>{t('customerName')}</label>
                <input required type="text" value={prospectData.name} onChange={e => setProspectData({ ...prospectData, name: e.target.value })} />
              </div>
              <div className="input-group">
                <label>PIC (Person In Charge)</label>
                <input required type="text" value={prospectData.pic} onChange={e => setProspectData({ ...prospectData, pic: e.target.value })} placeholder="Nama penanggung jawab" />
              </div>
              <div className="input-group">
                <label>{t('phoneNumber')}</label>
                <input required type="text" value={prospectData.phone} onChange={e => setProspectData({ ...prospectData, phone: e.target.value })} />
              </div>
              <div className="input-group">
                <label>{t('emailAddress')}</label>
                <input required type="email" value={prospectData.email} onChange={e => setProspectData({ ...prospectData, email: e.target.value })} />
              </div>
              <div className="input-group">
                <label>{t('address')}</label>
                <input required type="text" value={prospectData.address} onChange={e => setProspectData({ ...prospectData, address: e.target.value })} />
              </div>
              <div className="input-group">
                <label>Notes</label>
                <input type="text" value={prospectData.notes} onChange={e => setProspectData({ ...prospectData, notes: e.target.value })} placeholder="Catatan tambahan" />
              </div>
              <div className="input-group">
                <label>Nama Marketing</label>
                <select 
                  required 
                  value={prospectData.marketingName} 
                  onChange={e => {
                    const emp = employees.find(emp => emp.name === e.target.value);
                    setProspectData({ 
                      ...prospectData, 
                      marketingName: e.target.value,
                      marketingPhone: emp?.phone || '',
                      marketingEmail: emp?.email || ''
                    });
                  }}
                  style={{ background: 'var(--input-bg)', border: '2px solid var(--secondary)', borderRadius: '12px', color: 'var(--text)', padding: '12px', fontWeight: '600' }}
                >
                  <option value="" style={{ background: 'var(--bg)', color: 'var(--text)' }}>-- Pilih Marketing --</option>
                  {employees.filter(e => e.position?.toLowerCase().includes('marketing')).map(e => (
                    <option key={e.id} value={e.name} style={{ background: 'var(--bg)', color: 'var(--text)' }}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Nomor Telpon Marketing</label>
                <input required type="text" value={prospectData.marketingPhone} onChange={e => setProspectData({ ...prospectData, marketingPhone: e.target.value })} placeholder="+62 812..." />
              </div>
              <div className="input-group">
                <label>Email Marketing</label>
                <input required type="email" value={prospectData.marketingEmail} onChange={e => setProspectData({ ...prospectData, marketingEmail: e.target.value })} placeholder="marketing@alpfreight.co.id" />
              </div>
              <div className="input-group" style={{ gridColumn: 'span 3' }}>
                <label>Alamat ALP (Tampil Di Header Penawaran)</label>
                <input required type="text" value={prospectData.companyAddress} onChange={e => setProspectData({ ...prospectData, companyAddress: e.target.value })} placeholder="Masukkan alamat cabang ALP untuk penawaran ini..." />
              </div>
              <div className="input-group" style={{ gridColumn: 'span 3' }}>
                <label>{t('prospectJob')}</label>
                <textarea required rows="2" value={prospectData.description} onChange={e => setProspectData({ ...prospectData, description: e.target.value })} style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '15px', width: '100%', fontFamily: 'inherit' }} />
              </div>
              
              <div style={{ gridColumn: 'span 3', borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h5 style={{ color: 'var(--secondary)', margin: 0, fontWeight: '600' }}>{t('customFields')}</h5>
                  <button 
                    type="button" 
                    onClick={() => setProspectCustomFields([...prospectCustomFields, { key: '', value: '' }])}
                    className="btn btn-gold" 
                    style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Plus size={14} /> {t('addCustomField')}
                  </button>
                </div>
                {prospectCustomFields.map((field, index) => (
                  <div key={index} style={{ display: 'flex', gap: '15px', marginBottom: '10px', alignItems: 'center' }}>
                    <input 
                      placeholder={isID ? "Nama Kolom (misal: NPWP)" : "Field Name (e.g. NPWP)"}
                      type="text" 
                      value={field.key} 
                      onChange={e => {
                        const updated = [...prospectCustomFields];
                        updated[index].key = e.target.value;
                        setProspectCustomFields(updated);
                      }}
                      style={{ flex: 1, background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px' }}
                    />
                    <input 
                      placeholder={isID ? "Nilai Kolom" : "Field Value"}
                      type="text" 
                      value={field.value} 
                      onChange={e => {
                        const updated = [...prospectCustomFields];
                        updated[index].value = e.target.value;
                        setProspectCustomFields(updated);
                      }}
                      style={{ flex: 2, background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px' }}
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        const updated = prospectCustomFields.filter((_, i) => i !== index);
                        setProspectCustomFields(updated.length ? updated : [{ key: '', value: '' }]);
                      }}
                      style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger-border)', padding: '12px', borderRadius: '12px', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <ButtonWithLoading className="btn btn-gold" style={{ gridColumn: 'span 3' }} onClick={handleProspectSubmit}>
                {t('addProspect')}
              </ButtonWithLoading>
            </form>
          </motion.div>
        )}

        {showCustomerForm && activeTab === 'savedCustomers' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="glass-card" style={{ padding: '30px', overflow: 'hidden' , overflowX: 'auto', marginBottom: '25px' }}
          >
            <form onSubmit={handleCustomerSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              <div className="input-group">
                <label>{t('customerName')}</label>
                <input required type="text" value={newCustomerData.name} onChange={e => setNewCustomerData({ ...newCustomerData, name: e.target.value })} style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px', width: '100%' }} />
              </div>
              <div className="input-group">
                <label>{t('phoneNumber')}</label>
                <input type="text" value={newCustomerData.phone} onChange={e => setNewCustomerData({ ...newCustomerData, phone: e.target.value })} style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px', width: '100%' }} />
              </div>
              <div className="input-group">
                <label>{t('emailAddress')}</label>
                <input type="email" value={newCustomerData.email} onChange={e => setNewCustomerData({ ...newCustomerData, email: e.target.value })} style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px', width: '100%' }} />
              </div>
              <div className="input-group" style={{ gridColumn: 'span 3' }}>
                <label>{t('address')}</label>
                <input type="text" value={newCustomerData.address} onChange={e => setNewCustomerData({ ...newCustomerData, address: e.target.value })} style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px', width: '100%' }} />
              </div>
              
              <div style={{ gridColumn: 'span 3', borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h5 style={{ color: 'var(--secondary)', margin: 0, fontWeight: '600' }}>{t('customFields')}</h5>
                  <button 
                    type="button" 
                    onClick={() => setNewCustomerCustomFields([...newCustomerCustomFields, { key: '', value: '' }])}
                    className="btn btn-gold" 
                    style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Plus size={14} /> {t('addCustomField')}
                  </button>
                </div>
                {newCustomerCustomFields.map((field, index) => (
                  <div key={index} style={{ display: 'flex', gap: '15px', marginBottom: '10px', alignItems: 'center' }}>
                    <input 
                      placeholder={isID ? "Nama Kolom (misal: NPWP)" : "Field Name (e.g. NPWP)"}
                      type="text" 
                      value={field.key} 
                      onChange={e => {
                        const updated = [...newCustomerCustomFields];
                        updated[index].key = e.target.value;
                        setNewCustomerCustomFields(updated);
                      }}
                      style={{ flex: 1, background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px' }}
                    />
                    <input 
                      placeholder={isID ? "Nilai Kolom" : "Field Value"}
                      type="text" 
                      value={field.value} 
                      onChange={e => {
                        const updated = [...newCustomerCustomFields];
                        updated[index].value = e.target.value;
                        setNewCustomerCustomFields(updated);
                      }}
                      style={{ flex: 2, background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '12px' }}
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        const updated = newCustomerCustomFields.filter((_, i) => i !== index);
                        setNewCustomerCustomFields(updated.length ? updated : [{ key: '', value: '' }]);
                      }}
                      style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger-border)', padding: '12px', borderRadius: '12px', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <ButtonWithLoading className="btn btn-gold" style={{ gridColumn: 'span 3' }} onClick={handleCustomerSubmit}>
                {t('addCustomer')}
              </ButtonWithLoading>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
      >
        {activeTab === 'jobOrders' ? (
          <div className="glass-card" style={{ padding: '25px', overflowX: 'auto' }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", flexWrap: "wrap", gap: "15px" }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                <CheckCircle size={20} style={{ color: 'var(--success)' }} />
                {t('activeJobOrders')}
              </h4>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{isID ? 'Urutkan:' : 'Sort:'}</span>
                  <select 
                    value={jobOrderSortBy} 
                    onChange={(e) => setJobOrderSortBy(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="created_desc">{isID ? 'Tanggal Pembuatan (Terbaru)' : 'Creation Date (Newest)'}</option>
                    <option value="created_asc">{isID ? 'Tanggal Pembuatan (Terlama)' : 'Creation Date (Oldest)'}</option>
                    <option value="company_asc">{isID ? 'Nama Perusahaan (A-Z)' : 'Company Name (A-Z)'}</option>
                    <option value="company_desc">{isID ? 'Nama Perusahaan (Z-A)' : 'Company Name (Z-A)'}</option>
                    <option value="id_asc">{isID ? 'No. Penawaran (Asc)' : 'Quotation # (Asc)'}</option>
                    <option value="id_desc">{isID ? 'No. Penawaran (Desc)' : 'Quotation # (Desc)'}</option>
                    <option value="amount_desc">{isID ? 'Total Nilai (Tertinggi)' : 'Amount (Highest)'}</option>
                    <option value="amount_asc">{isID ? 'Total Nilai (Terendah)' : 'Amount (Lowest)'}</option>
                  </select>
                </div>
                <div style={{ position: 'relative', width: '250px' }}>
                  <input
                    type="text"
                    placeholder={t('searchJobOrders') || "Search by customer or ID..."}
                    value={jobOrderSearchTerm}
                    onChange={(e) => setJobOrderSearchTerm(e.target.value)}
                    style={{ padding: '10px 15px 10px 45px', borderRadius: '100px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', width: '100%' }}
                  />
                  <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>
            </div>
            <div className="table-container"><div className="table-responsive-wrapper" style={{ overflowX: 'auto', width: '100%' }}>
<table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--gold-metallic)' }}>
                  <th style={{ padding: '15px' }}>Quotation #</th>
                  <th style={{ padding: '15px' }}>{t('date')}</th>
                  <th style={{ padding: '15px' }}>{t('companyName')}</th>
                  <th style={{ padding: '15px' }}>PIC</th>
                  <th style={{ padding: '15px' }}>{t('activity')}</th>
                  <th style={{ padding: '15px' }}>{t('amount')}</th>
                  <th style={{ padding: '15px' }}>{t('status')}</th>
                  <th style={{ padding: '15px' }}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {quotations
                  .filter(q => q.status === 'approved' && filterByDate(q.date))
                  .filter(q => {
                    const qJOs = jobOrders.filter(jo => String(jo.quotationId) === String(q.id));
                    if (qJOs.length > 0 && qJOs.every(jo => jo.status === 'invoiced')) {
                      return false;
                    }
                    return true;
                  })
                  .filter(q => {
                    const name = q.customerName || '';
                    const id = q.id || '';
                    const pic = q.pic || '';
                    const term = jobOrderSearchTerm.toLowerCase();
                    return name.toLowerCase().includes(term) ||
                           id.toLowerCase().includes(term) ||
                           pic.toLowerCase().includes(term);
                  })
                  .sort((a, b) => {
                    if (jobOrderSortBy === 'created_desc') {
                      return getQuotationTime(b) - getQuotationTime(a) || (b.id || '').localeCompare(a.id || '');
                    }
                    if (jobOrderSortBy === 'created_asc') {
                      return getQuotationTime(a) - getQuotationTime(b) || (a.id || '').localeCompare(b.id || '');
                    }
                    if (jobOrderSortBy === 'company_asc') {
                      return (a.customerName || '').localeCompare(b.customerName || '');
                    }
                    if (jobOrderSortBy === 'company_desc') {
                      return (b.customerName || '').localeCompare(a.customerName || '');
                    }
                    if (jobOrderSortBy === 'id_asc') {
                      return (a.id || '').localeCompare(b.id || '');
                    }
                    if (jobOrderSortBy === 'id_desc') {
                      return (b.id || '').localeCompare(a.id || '');
                    }
                    if (jobOrderSortBy === 'amount_desc') {
                      return (b.total || b.rate || 0) - (a.total || a.rate || 0);
                    }
                    if (jobOrderSortBy === 'amount_asc') {
                      return (a.total || a.rate || 0) - (b.total || b.rate || 0);
                    }
                    return 0;
                  })
                  .map(quote => {
                    const firstItem = Array.isArray(quote.items) && quote.items.length > 0 ? quote.items[0] : null;
                    const activityLabel = firstItem ? firstItem.description : '-';
                    const quoteJOs = jobOrders.filter(jo => String(jo.quotationId) === String(quote.id) && jo.status !== 'invoiced');
                    const isExpanded = !!expandedQuoteJOs[quote.id];

                    return (
                      <React.Fragment key={quote.id}>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(16, 185, 129, 0.04)' }} className="table-row-hover">
                          <td style={{ padding: '15px', fontWeight: '700', color: 'var(--secondary)', fontSize: '0.85rem' }}>
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedQuoteJOs(prev => ({ ...prev, [quote.id]: !prev[quote.id] }));
                              }}
                              style={{ cursor: 'pointer', marginRight: '8px', display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}
                            >
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </span>
                            {quote.id}
                          </td>
                          <td style={{ padding: '15px', fontSize: '0.85rem' }}>{quote.date}</td>
                          <td style={{ padding: '15px', fontSize: '0.95rem', fontWeight: '600' }}>{quote.customerName}</td>
                          <td style={{ padding: '15px', fontSize: '0.9rem', color: 'var(--secondary)' }}>{quote.pic || '-'}</td>
                          <td style={{ padding: '15px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            {activityLabel}{Array.isArray(quote.items) && quote.items.length > 1 ? ` +${quote.items.length - 1} more` : ''}
                          </td>
                          <td style={{ padding: '15px', fontSize: '0.9rem', fontWeight: '600' }}>Rp {(quote.total || 0).toLocaleString()}</td>
                          <td style={{ padding: '15px' }}>
                            <span className="badge badge-approved" style={{ fontSize: '0.7rem' }}>{t('approved')}</span>
                          </td>
                          <td style={{ padding: '15px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {canWrite && (
                                <ButtonWithLoading
                                  className="btn-icon"
                                  style={{ color: 'var(--warning)', background: 'var(--warning-bg)' }}
                                  onClick={() => unapproveQuotation(quote.id)}
                                  title="Batalkan Approval (kembalikan ke Pending)"
                                >
                                  <XCircle size={16} />
                                </ButtonWithLoading>
                              )}
                              {user?.role === 'owner' && (
                                <button
                                  className="btn-icon"
                                  style={{ color: 'var(--danger)', background: 'var(--danger-bg)' }}
                                  onClick={() => setDeleteConfirm({ id: quote.id, name: quote.customerName, type: 'quotation' })}
                                  title="Hapus"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${quote.id}-details`} style={{ background: 'rgba(255, 255, 255, 0.01)', borderBottom: '1px solid var(--glass-border)' }}>
                            <td colSpan={8} style={{ padding: '20px 40px', background: 'rgba(0, 0, 0, 0.2)' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <h5 style={{ color: 'var(--secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 10px 0' }}>
                                  <FileText size={16} /> {isID ? 'Daftar Job Order (Aktivitas)' : 'Job Orders List (Activities)'} ({quoteJOs.length})
                                </h5>
                                {quoteJOs.length === 0 ? (
                                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                                    {isID ? 'Belum ada Job Order yang dibuat untuk penawaran ini di Admin Office.' : 'No Job Orders created for this quotation yet in Admin Office.'}
                                  </p>
                                ) : (
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead>
                                      <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                                        <th style={{ padding: '8px 12px' }}>JO ID</th>
                                        <th style={{ padding: '8px 12px' }}>{isID ? 'Instruksi / Aktivitas' : 'Instruction / Activity'}</th>
                                        <th style={{ padding: '8px 12px' }}>{isID ? 'Jumlah' : 'Qty'}</th>
                                        <th style={{ padding: '8px 12px' }}>{isID ? 'Status Operasional' : 'Operational Status'}</th>
                                        <th style={{ padding: '8px 12px' }}>{isID ? 'Peralatan & Driver' : 'Containers & Drivers'}</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>{isID ? 'Foto' : 'Photos'}</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {quoteJOs.map(jo => {
                                        const photosCount = Array.isArray(jo.photos) ? jo.photos.length : 0;
                                        return (
                                          <tr key={jo.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }} className="table-row-hover">
                                            <td style={{ padding: '8px 12px', fontWeight: '700', color: 'var(--secondary)' }}>{jo.id}</td>
                                            <td style={{ padding: '8px 12px' }}>{jo.jobDescription || jo.instruction}</td>
                                            <td style={{ padding: '8px 12px' }}>{jo.quantity}</td>
                                            <td style={{ padding: '8px 12px' }}>
                                              <span className={`badge badge-${jo.status || 'pending'}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                                                {jo.status === 'pending' ? (isID ? 'Draft' : 'Draft') : jo.status === 'dispatched' ? (isID ? 'Dikirim' : 'Dispatched') : jo.status === 'done' ? (isID ? 'Selesai' : 'Completed') : jo.status === 'invoiced' ? (isID ? 'Sudah Di-Invoice' : 'Invoiced') : jo.status}
                                              </span>
                                            </td>
                                            <td style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                              <div>C: {Array.isArray(jo.containerNo) ? jo.containerNo.join(', ') : jo.containerNo || '-'}</div>
                                              <div>V: {Array.isArray(jo.vehicleNo) ? jo.vehicleNo.join(', ') : jo.vehicleNo || '-'}</div>
                                            </td>
                                            <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                              {photosCount} {isID ? 'Foto' : 'Photos'}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
              </tbody>
            </table>
</div></div>
            {quotations.filter(q => q.status === 'approved').filter(q =>
              q.customerName.toLowerCase().includes(jobOrderSearchTerm.toLowerCase()) ||
              q.id.toLowerCase().includes(jobOrderSearchTerm.toLowerCase())
            ).length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                  <CheckCircle size={48} style={{ opacity: 0.2, marginBottom: '15px', display: 'block', margin: '0 auto 15px' }} />
                  <p style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '6px' }}>Belum ada Job Order aktif</p>
                  <p style={{ fontSize: '0.85rem' }}>Approve penawaran dari tab <strong>Quotation List</strong> untuk memulai Job Order.</p>
                </div>
              )}
          </div>
        ) : activeTab === 'quotationList' ? (
          <div className="glass-card" style={{ padding: '25px', overflowX: 'auto' }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", flexWrap: "wrap", gap: "15px" }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                <FileText size={20} style={{ color: 'var(--gold-metallic)' }} />
                {t('quotationList') || 'All Quotations'}
              </h4>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{isID ? 'Urutkan:' : 'Sort:'}</span>
                  <select 
                    value={quotationSortBy} 
                    onChange={(e) => setQuotationSortBy(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="created_desc">{isID ? 'Tanggal Pembuatan (Terbaru)' : 'Creation Date (Newest)'}</option>
                    <option value="created_asc">{isID ? 'Tanggal Pembuatan (Terlama)' : 'Creation Date (Oldest)'}</option>
                    <option value="company_asc">{isID ? 'Nama Perusahaan (A-Z)' : 'Company Name (A-Z)'}</option>
                    <option value="company_desc">{isID ? 'Nama Perusahaan (Z-A)' : 'Company Name (Z-A)'}</option>
                    <option value="id_asc">{isID ? 'No. Penawaran (Asc)' : 'Quotation # (Asc)'}</option>
                    <option value="id_desc">{isID ? 'No. Penawaran (Desc)' : 'Quotation # (Desc)'}</option>
                    <option value="amount_desc">{isID ? 'Total Nilai (Tertinggi)' : 'Amount (Highest)'}</option>
                    <option value="amount_asc">{isID ? 'Total Nilai (Terendah)' : 'Amount (Lowest)'}</option>
                  </select>
                </div>
                <div style={{ position: 'relative', width: '250px' }}>
                  <input
                    type="text"
                    placeholder={t('searchQuotations') || "Search all quotations..."}
                    value={fullQuoteSearchTerm}
                    onChange={(e) => setFullQuoteSearchTerm(e.target.value)}
                    style={{ padding: '10px 15px 10px 45px', borderRadius: '100px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', width: '100%' }}
                  />
                  <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>
            </div>
            <div className="table-container"><div className="table-responsive-wrapper" style={{ overflowX: 'auto', width: '100%' }}>
<table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--gold-metallic)' }}>
                  <th style={{ padding: '15px' }}>Quotation #</th>
                  <th style={{ padding: '15px' }}>Date</th>
                  <th style={{ padding: '15px' }}>Company</th>
                  <th style={{ padding: '15px' }}>PIC</th>
                  <th style={{ padding: '15px' }}>Amount</th>
                  <th style={{ padding: '15px' }}>Status</th>
                  <th style={{ padding: '15px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotations
                  .filter(q => filterByDate(q.date))
                  .filter(q => {
                    const name = q.customerName || '';
                    const id = q.id || '';
                    const pic = q.pic || '';
                    const term = fullQuoteSearchTerm.toLowerCase();
                    return name.toLowerCase().includes(term) ||
                           id.toLowerCase().includes(term) ||
                           pic.toLowerCase().includes(term);
                  })
                  .sort((a, b) => {
                    if (quotationSortBy === 'created_desc') {
                      return getQuotationTime(b) - getQuotationTime(a) || (b.id || '').localeCompare(a.id || '');
                    }
                    if (quotationSortBy === 'created_asc') {
                      return getQuotationTime(a) - getQuotationTime(b) || (a.id || '').localeCompare(b.id || '');
                    }
                    if (quotationSortBy === 'company_asc') {
                      return (a.customerName || '').localeCompare(b.customerName || '');
                    }
                    if (quotationSortBy === 'company_desc') {
                      return (b.customerName || '').localeCompare(a.customerName || '');
                    }
                    if (quotationSortBy === 'id_asc') {
                      return (a.id || '').localeCompare(b.id || '');
                    }
                    if (quotationSortBy === 'id_desc') {
                      return (b.id || '').localeCompare(a.id || '');
                    }
                    if (quotationSortBy === 'amount_desc') {
                      return (b.total || b.rate || 0) - (a.total || a.rate || 0);
                    }
                    if (quotationSortBy === 'amount_asc') {
                      return (a.total || a.rate || 0) - (b.total || b.rate || 0);
                    }
                    return 0;
                  })
                  .map(quote => (
                    <tr key={quote.id} style={{ borderBottom: '1px solid var(--glass-border)' }} className="table-row-hover">
                      <td style={{ padding: '15px', fontWeight: '700', color: 'var(--secondary)' }}>{quote.id}</td>
                      <td style={{ padding: '15px', fontSize: '0.85rem' }}>{quote.date}</td>
                      <td style={{ padding: '15px', fontWeight: '600' }}>{quote.customerName}</td>
                      <td style={{ padding: '15px' }}>{quote.pic || '-'}</td>
                      <td style={{ padding: '15px', fontWeight: '700' }}>Rp {quote.total?.toLocaleString() || quote.rate?.toLocaleString()}</td>
                      <td style={{ padding: '15px' }}>
                        <span className={`badge badge-${quote.status}`} style={{ fontSize: '0.7rem' }}>{t(quote.status)}</span>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {canWrite && quote.status === 'pending' && (
                            <ButtonWithLoading
                              className="btn-icon"
                              style={{ color: 'var(--success)', background: 'var(--success-bg)' }}
                              onClick={async () => {
                                await approveQuotation(quote.id);
                                setActiveTab('jobOrders');
                              }}
                              title="Approve — pindah ke Active Job Orders"
                            >
                              <CheckCircle size={16} />
                            </ButtonWithLoading>
                          )}
                          {canWrite && quote.status === 'approved' && (
                            <ButtonWithLoading
                              className="btn-icon"
                              style={{ color: 'var(--warning)', background: 'var(--warning-bg)' }}
                              onClick={() => unapproveQuotation(quote.id)}
                              title="Batalkan Approval"
                            >
                              <XCircle size={16} />
                            </ButtonWithLoading>
                          )}
                          <button
                            className="btn-icon"
                            style={{ color: 'var(--secondary)', background: 'var(--secondary-bg)' }}
                            onClick={() => {
                              setSelectedDraft(quote);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            title="Print Preview / Export PDF"
                          >
                            <FileText size={16} />
                          </button>
                          {canWrite && (
                            <button
                              className="btn-icon"
                              style={{ color: 'var(--secondary)', background: 'var(--secondary-bg)' }}
                              onClick={() => handleOpenEditQuotationModal(quote)}
                              title="Edit Quotation"
                            >
                              <Edit size={16} />
                            </button>
                          )}
                          {user?.role === 'owner' && (
                            <button
                              className="btn-icon"
                              style={{ color: 'var(--danger)', background: 'var(--danger-bg)' }}
                              onClick={() => setDeleteConfirm({ id: quote.id, name: quote.customerName, type: 'quotation' })}
                              title="Hapus Penawaran"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
</div></div>
          </div>
        ) : activeTab === 'savedCustomers' ? (
          <div className="glass-card" style={{ padding: '25px', overflowX: 'auto' }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", flexWrap: "wrap", gap: "15px" }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                <Users size={20} style={{ color: 'var(--secondary)' }} />
                {t('savedCustomers') || 'Saved Customers'}
              </h4>
              <div style={{ position: 'relative', width: '300px' }}>
                <input 
                  type="text" 
                  placeholder={isID ? "Cari pelanggan..." : "Search customers..."} 
                  value={customerSearchTerm} 
                  onChange={(e) => setCustomerSearchTerm(e.target.value)} 
                  style={{ padding: '10px 15px 10px 45px', borderRadius: '100px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', width: '100%' }} 
                />
                <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>
            <div className="table-container">
              <div className="table-responsive-wrapper" style={{ overflowX: 'auto', width: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                      <th style={{ padding: '15px' }}>ID</th>
                      <th style={{ padding: '15px' }}>{t('customerName')}</th>
                      <th style={{ padding: '15px' }}>{t('address')}</th>
                      <th style={{ padding: '15px' }}>{t('customFields')}</th>
                      <th style={{ padding: '15px' }}>{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map(cust => {
                      let customFieldsList = [];
                      try {
                        const customObj = typeof cust.customData === 'string' ? JSON.parse(cust.customData || '{}') : (cust.customData || {});
                        customFieldsList = Object.entries(customObj);
                      } catch (e) {
                        // ignore
                      }

                      return (
                        <tr key={cust.id} style={{ borderBottom: '1px solid var(--glass-border)' }} className="table-row-hover">
                          <td style={{ padding: '15px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{cust.id}</td>
                          <td style={{ padding: '15px' }}>
                            <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{cust.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cust.email || '-'} | {cust.phone || '-'}</div>
                          </td>
                          <td style={{ padding: '15px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{cust.address || '-'}</td>
                          <td style={{ padding: '15px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {customFieldsList.length > 0 ? (
                                customFieldsList.map(([k, v]) => (
                                  <span key={k} style={{ 
                                    padding: '4px 8px', 
                                    background: 'var(--secondary-bg)', 
                                    border: '1px solid var(--secondary-border)', 
                                    color: 'var(--secondary)', 
                                    borderRadius: '6px', 
                                    fontSize: '0.75rem', 
                                    fontWeight: '500' 
                                  }}>
                                    <strong>{k}</strong>: {String(v)}
                                  </span>
                                ))
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>-</span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '15px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {canWrite && (
                                <button
                                  className="btn-icon"
                                  style={{ color: 'var(--secondary)', background: 'var(--secondary-bg)', height: '28px', width: '28px' }}
                                  onClick={() => handleOpenEditCustomerModal(cust)}
                                  title="Edit Customer"
                                >
                                  <Edit size={14} />
                                </button>
                              )}
                              {user?.role === 'owner' && (
                                <button
                                  className="btn-icon"
                                  style={{ color: 'var(--danger)', background: 'var(--danger-bg)', height: '28px', width: '28px' }}
                                  onClick={() => setDeleteConfirm({ id: cust.id, name: cust.name, type: 'customer' })}
                                  title="Delete Customer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredCustomers.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                          {t('noData') || 'No customers found.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '25px', overflowX: 'auto' }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", flexWrap: "wrap", gap: "15px" }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                <UserPlus size={20} style={{ color: 'var(--secondary)' }} />
                {t('prospectCustomers')}
              </h4>
              <div style={{ position: 'relative', width: '300px' }}>
                <input type="text" placeholder={t('searchProspects')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '10px 15px 10px 45px', borderRadius: '100px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', width: '100%' }} />
                <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>
            <div className="table-container"><div className="table-responsive-wrapper" style={{ overflowX: 'auto', width: '100%' }}>
<table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '15px' }}>{t('companyName')}</th>
                  <th style={{ padding: '15px' }}>PIC</th>
                  <th style={{ padding: '15px' }}>{t('address')}</th>
                  <th style={{ padding: '15px' }}>{t('prospectJob')}</th>
                  <th style={{ padding: '15px' }}>Marketing</th>
                  <th style={{ padding: '15px' }}>{t('status')}</th>
                  <th style={{ padding: '15px' }}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredProspects.map(prospect => (
                  <tr key={prospect.id} style={{ borderBottom: '1px solid var(--glass-border)' }} className="table-row-hover">
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{prospect.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{prospect.email} | {prospect.phone}</div>
                    </td>
                    <td style={{ padding: '15px', fontSize: '0.9rem', fontWeight: '600', color: 'var(--secondary)' }}>{prospect.pic || '-'}</td>
                    <td style={{ padding: '15px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{prospect.address}</td>
                    <td style={{ padding: '15px', fontSize: '0.9rem' }}>{prospect.description}</td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{prospect.marketingName || '-'}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{prospect.marketingPhone || ''}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{prospect.marketingEmail || ''}</div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <select 
                        disabled={!canWrite}
                        value={prospect.status} 
                        onChange={(e) => updateProspectStatus(prospect.id, e.target.value)} 
                        style={{ padding: '6px 10px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--secondary)', fontSize: '0.8rem', cursor: canWrite ? 'pointer' : 'not-allowed' }}
                      >
                        <option value="followUp" style={{ background: 'var(--bg)', color: 'var(--text)' }}>{t('followUp')}</option>
                        <option value="negotiation" style={{ background: 'var(--bg)', color: 'var(--text)' }}>{t('negotiation')}</option>
                        <option value="deal" style={{ background: 'var(--bg)', color: 'var(--text)' }}>{t('deal')}</option>
                        <option value="lost" style={{ background: 'var(--bg)', color: 'var(--text)' }}>{t('lost')}</option>
                      </select>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {canWrite && prospect.status !== 'deal' && prospect.status !== 'lost' && (
                          <button className="btn btn-gold" style={{ padding: '8px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setActiveProspectForQuote(prospect)}>
                            <Plus size={14} /> {t('createQuotation')}
                          </button>
                        )}
                        {canWrite && (
                          <button
                            className="btn-icon"
                            style={{ color: 'var(--secondary)', background: 'var(--secondary-bg)', height: '28px', width: '28px' }}
                            onClick={() => handleOpenEditProspectModal(prospect)}
                            title="Edit Prospect"
                          >
                            <Edit size={14} />
                          </button>
                        )}
                        {canWrite && prospect.status === 'deal' && (
                          <button
                            className="btn-icon"
                            style={{ color: 'var(--warning)', background: 'var(--warning-bg)', height: '28px', width: '28px' }}
                            onClick={() => updateProspectStatus(prospect.id, 'negotiation')}
                            title="Batalkan Deal (kembalikan ke Negosiasi)"
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                        {user?.role === 'owner' && (
                          <button
                            className="btn-icon"
                            style={{ color: 'var(--danger)', background: 'var(--danger-bg)', height: '28px', width: '28px' }}
                            onClick={() => setDeleteConfirm({ id: prospect.id, name: prospect.name, type: 'prospect' })}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
</div></div>
          </div>
        )}
      </motion.div>
    </div>
    </div>
  );
};

export default Marketing;

