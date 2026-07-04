import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, 
  Plus, 
  Search, 
  X, 
  Check, 
  XCircle, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  ArrowRight,
  Receipt,
  FileText,
  User,
  CreditCard,
  Building,
  Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ButtonWithLoading } from '../components/ButtonWithLoading';

const defaultSubcategories = {
  'Gaji': [
    { id: 'Gaji Pokok', en: 'Base Salary' },
    { id: 'Lembur', en: 'Overtime' },
    { id: 'Tunjangan', en: 'Allowance' },
    { id: 'THR', en: 'Holiday Allowance' },
    { id: 'Lain-lain', en: 'Others' }
  ],
  'Operasional': [
    { id: 'Listrik & Air', en: 'Electricity & Water' },
    { id: 'Internet & Telepon', en: 'Internet & Phone' },
    { id: 'ATK / Perlengkapan Kantor', en: 'Office Supplies' },
    { id: 'Bensin & Transportasi', en: 'Fuel & Transport' },
    { id: 'Konsumsi', en: 'Meals/Consumption' },
    { id: 'Perbaikan & Pemeliharaan', en: 'Maintenance & Repairs' },
    { id: 'Lain-lain', en: 'Others' }
  ],
  'Bonus': [
    { id: 'Bonus Kinerja', en: 'Performance Bonus' },
    { id: 'Insentif Penjualan', en: 'Sales Incentive' },
    { id: 'Lain-lain', en: 'Others' }
  ],
  'Sewa': [
    { id: 'Sewa Kantor', en: 'Office Rent' },
    { id: 'Sewa Gudang', en: 'Warehouse Rent' },
    { id: 'Sewa Kendaraan', en: 'Vehicle Rent' },
    { id: 'Lain-lain', en: 'Others' }
  ],
  'Lain-lain': [
    { id: 'Lain-lain', en: 'Others' }
  ]
};

const CostApplications = () => {
  const { 
    user, 
    language, 
    otherExpenses, 
    jobOrders, 
    companyBankAccounts, 
    addOtherExpense, 
    updateOtherExpense, 
    deleteOtherExpense,
    hasAccess,
    t
  } = useApp();

  const navigate = useNavigate();
  const isID = language === 'id';
  const isAccountant = user?.role === 'owner' || hasAccess('accounting', true);

  const handleCategoryChange = (val) => {
    setCategory(val);
    if (val !== 'CUSTOM') {
      const subs = defaultSubcategories[val] || [];
      if (subs.length > 0) {
        setSubcategory(subs[0].id);
      } else {
        setSubcategory('');
      }
    } else {
      setSubcategory('');
    }
  };

  // Filter and parse cost applications from otherExpenses
  const applications = useMemo(() => {
    return (otherExpenses || []).map(e => {
      let parsed = { type: 'expense', status: 'pending', costType: 'other', joId: null, items: [], requestedBy: 'Staff', employeeId: null, notes: '' };
      if (e.description && e.description.startsWith('{')) {
        try { 
          parsed = JSON.parse(e.description); 
        } catch(err) {
          // Fallback if JSON parsing fails
          parsed.notes = e.description;
        }
      }
      return { 
        ...e, 
        ...parsed, 
        rawDescription: e.description,
        amount: e.amount || 0,
        rawRecord: e 
      };
    }).filter(item => item.type === 'cost_application');
  }, [otherExpenses]);

  // Statistics
  const stats = useMemo(() => {
    const s = { pending: 0, approved: 0, paid: 0, rejected: 0, pendingAmt: 0, approvedAmt: 0, paidAmt: 0 };
    applications.forEach(a => {
      const status = a.status || 'pending';
      const amt = parseFloat(a.amount) || 0;
      if (status === 'pending') {
        s.pending++;
        s.pendingAmt += amt;
      } else if (status === 'approved') {
        s.approved++;
        s.approvedAmt += amt;
      } else if (status === 'paid' || status === 'released') {
        s.paid++;
        s.paidAmt += amt;
      } else if (status === 'rejected') {
        s.rejected++;
      }
    });
    return s;
  }, [applications]);

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredApplications = useMemo(() => {
    return applications.filter(a => {
      const matchesSearch = 
        (a.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.bankName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.joId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [applications, searchTerm, statusFilter]);

  // Modal State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  
  // Form Fields State
  const [formId, setFormId] = useState(null);
  const [costType, setCostType] = useState('operational');
  const [selectedJoId, setSelectedJoId] = useState('');
  const [recipientBank, setRecipientBank] = useState('');
  const [recipientBankAccount, setRecipientBankAccount] = useState('');
  const [recipientName, setRecipientName] = useState(user?.name || '');
  const [applicatorName, setApplicatorName] = useState(user?.name || '');
  const [category, setCategory] = useState('Lain-lain');
  const [customCategory, setCustomCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ details: '', amount: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Release Modal State
  const [companyBankAccountId, setCompanyBankAccountId] = useState('');
  const [customSourceTarget, setCustomSourceTarget] = useState('');

  const handleOpenNewModal = () => {
    setFormId(null);
    setCostType('operational');
    setSelectedJoId('');
    setRecipientBank('');
    setRecipientBankAccount('');
    setRecipientName(user?.name || '');
    setApplicatorName(user?.name || '');
    setCategory('Lain-lain');
    setCustomCategory('');
    setSubcategory('Lain-lain');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setItems([{ details: '', amount: '' }]);
    setShowApplyModal(true);
  };

  const handleOpenEditModal = (app) => {
    setFormId(app.id);
    setCostType(app.costType || 'operational');
    setSelectedJoId(app.joId || '');
    setRecipientBank(app.bankName || '');
    setRecipientBankAccount(app.bankAccount || '');
    setRecipientName(app.employeeName || '');
    setApplicatorName(app.requestedBy || app.employeeName || '');
    const catVal = app.category || 'Lain-lain';
    setCategory(catVal);
    if (!['Lain-lain', 'Operasional', 'Sewa', 'Gaji', 'Bonus'].includes(catVal)) {
      setCategory('CUSTOM');
      setCustomCategory(catVal);
    } else {
      setCustomCategory('');
    }
    setSubcategory(app.subcategory || 'Lain-lain');
    setExpenseDate(app.expenseDate || new Date().toISOString().split('T')[0]);
    setNotes(app.notes || '');
    setItems(app.items && app.items.length > 0 ? app.items : [{ details: '', amount: '' }]);
    setShowApplyModal(true);
  };

  const handleAddItemRow = () => {
    setItems([...items, { details: '', amount: '' }]);
  };

  const handleRemoveItemRow = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, value) => {
    const updated = [...items];
    updated[idx][field] = value;
    setItems(updated);
  };

  const handleSaveApplication = async () => {
    if (costType === 'operational' && !selectedJoId) {
      toast.error(isID ? 'Pilih Job Order terlebih dahulu!' : 'Please select a Job Order!');
      return;
    }
    if (!recipientBank || !recipientBankAccount || !recipientName) {
      toast.error(isID ? 'Isi informasi rekening penerima dengan lengkap!' : 'Please fill in recipient bank account details!');
      return;
    }
    if (items.some(item => !item.details || parseFloat(item.amount || 0) <= 0)) {
      toast.error(isID ? 'Lengkapi deskripsi dan nominal untuk semua item!' : 'Please complete details and amount for all items!');
      return;
    }

    setIsSubmitting(true);
    const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const id = formId || 'EXP-' + Date.now() + Math.random().toString(36).substr(2, 4);

    const serializedDescription = JSON.stringify({
      type: 'cost_application',
      costType,
      joId: costType === 'operational' ? selectedJoId : null,
      items,
      status: 'pending',
      requestedBy: applicatorName,
      employeeId: user?.employeeId || null,
      notes,
      category: category === 'CUSTOM' ? customCategory : category,
      subcategory
    });

    const payload = {
      id,
      employeeName: recipientName,
      position: user?.role || 'staff',
      bankAccount: recipientBankAccount,
      bankName: recipientBank,
      amount: totalAmount,
      description: serializedDescription,
      taxes: [],
      proofPhoto: null,
      expenseDate,
      totalAfterTax: totalAmount,
      date: expenseDate
    };

    try {
      if (formId) {
        await updateOtherExpense(formId, payload);
        toast.success(isID ? 'Pengajuan berhasil diperbarui' : 'Application updated successfully');
      } else {
        await addOtherExpense(payload);
        toast.success(isID ? 'Pengajuan berhasil diajukan' : 'Application submitted successfully');
      }
      setShowApplyModal(false);
    } catch (err) {
      toast.error(isID ? 'Gagal menyimpan pengajuan: ' : 'Failed to save application: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (app, newStatus) => {
    const updatedDescription = JSON.stringify({
      type: 'cost_application',
      costType: app.costType,
      joId: app.joId,
      items: app.items,
      status: newStatus,
      requestedBy: app.requestedBy,
      employeeId: app.employeeId,
      notes: app.notes,
      companyBankAccountId: app.companyBankAccountId || null,
      customSourceTarget: app.customSourceTarget || '',
      releasedDate: app.releasedDate || null,
      category: app.category || 'Lain-lain',
      subcategory: app.subcategory || ''
    });

    const payload = {
      ...app.rawRecord,
      description: updatedDescription
    };

    try {
      await updateOtherExpense(app.id, payload);
      toast.success(isID ? `Status berhasil diubah menjadi ${newStatus}` : `Status changed to ${newStatus}`);
    } catch(err) {
      toast.error(isID ? 'Gagal mengubah status: ' : 'Failed to update status: ' + err.message);
    }
  };

  const handleOpenReleaseModal = (app) => {
    setSelectedApp(app);
    setCompanyBankAccountId('');
    setCustomSourceTarget('');
    setShowReleaseModal(true);
  };

  const handleReleaseFunds = async () => {
    if (!companyBankAccountId) {
      toast.error(isID ? 'Pilih rekening asal pembayaran!' : 'Please select a paying bank account!');
      return;
    }
    if (companyBankAccountId === 'CUSTOM' && !customSourceTarget) {
      toast.error(isID ? 'Tulis sumber dana kustom!' : 'Please fill in the custom source!');
      return;
    }

    setIsSubmitting(true);
    const updatedDescription = JSON.stringify({
      type: 'cost_application',
      costType: selectedApp.costType,
      joId: selectedApp.joId,
      items: selectedApp.items,
      status: 'paid', // Status paid/released
      requestedBy: selectedApp.requestedBy,
      employeeId: selectedApp.employeeId,
      notes: selectedApp.notes,
      companyBankAccountId,
      customSourceTarget: companyBankAccountId === 'CUSTOM' ? customSourceTarget : '',
      releasedDate: new Date().toISOString().split('T')[0],
      category: selectedApp.category || 'Lain-lain',
      subcategory: selectedApp.subcategory || ''
    });

    const payload = {
      ...selectedApp.rawRecord,
      description: updatedDescription,
      expenseDate: new Date().toISOString().split('T')[0],
      date: new Date().toISOString().split('T')[0]
    };

    try {
      await updateOtherExpense(selectedApp.id, payload);
      toast.success(isID ? 'Dana berhasil dicairkan!' : 'Funds released successfully!');
      setShowReleaseModal(false);
    } catch (err) {
      toast.error(isID ? 'Gagal mencairkan dana: ' : 'Failed to release funds: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteApplication = async (id) => {
    if (window.confirm(isID ? 'Anda yakin ingin menghapus pengajuan ini?' : 'Are you sure you want to delete this application?')) {
      try {
        await deleteOtherExpense(id);
        toast.success(isID ? 'Pengajuan berhasil dihapus' : 'Application deleted successfully');
      } catch (err) {
        toast.error(isID ? 'Gagal menghapus pengajuan: ' : 'Failed to delete application: ' + err.message);
      }
    }
  };

  const formatCurrency = (val) => {
    return 'Rp ' + parseFloat(val || 0).toLocaleString('id-ID');
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '50px' }}>
      
      {/* Top Banner Stats */}
      <div className="grid-3" style={{ marginBottom: '30px', gap: '20px' }}>
        <div className="glass-card" style={{ padding: '25px', display: 'flex', alignItems: 'center', gap: '20px', borderLeft: '5px solid var(--warning)' }}>
          <div style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--warning)', padding: '12px', borderRadius: '12px' }}>
            <Wallet size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>
              {isID ? 'Menunggu Persetujuan' : 'Pending Approvals'}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', margin: '4px 0', color: 'var(--text)' }}>{stats.pending}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--warning)', fontWeight: '600' }}>{formatCurrency(stats.pendingAmt)}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '25px', display: 'flex', alignItems: 'center', gap: '20px', borderLeft: '5px solid var(--info)' }}>
          <div style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--info)', padding: '12px', borderRadius: '12px' }}>
            <CheckCircle2 size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>
              {isID ? 'Disetujui (Belum Cair)' : 'Approved (Unreleased)'}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', margin: '4px 0', color: 'var(--text)' }}>{stats.approved}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--info)', fontWeight: '600' }}>{formatCurrency(stats.approvedAmt)}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '25px', display: 'flex', alignItems: 'center', gap: '20px', borderLeft: '5px solid var(--success)' }}>
          <div style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)', padding: '12px', borderRadius: '12px' }}>
            <Receipt size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>
              {isID ? 'Sudah Dicairkan' : 'Released Funds'}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', margin: '4px 0', color: 'var(--text)' }}>{stats.paid}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: '600' }}>{formatCurrency(stats.paidAmt)}</div>
          </div>
        </div>
      </div>

      {/* Main Section Card */}
      <div className="glass-card" style={{ padding: '30px' }}>
        
        {/* Controls Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '25px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, minWidth: '300px' }}>
            <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '5px 15px', width: '100%', maxWidth: '350px' }}>
              <Search size={18} style={{ color: 'var(--text-muted)', marginRight: '10px' }} />
              <input 
                type="text" 
                placeholder={isID ? "Cari pengajuan..." : "Search applications..."} 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ background: 'none', border: 'none', color: 'var(--text)', outline: 'none', width: '100%', fontSize: '0.85rem' }}
              />
            </div>

            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '9px 15px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              <option value="all">{isID ? 'Semua Status' : 'All Status'}</option>
              <option value="pending">{isID ? 'Menunggu' : 'Pending'}</option>
              <option value="approved">{isID ? 'Disetujui' : 'Approved'}</option>
              <option value="paid">{isID ? 'Sudah Cair' : 'Released'}</option>
              <option value="rejected">{isID ? 'Ditolak' : 'Rejected'}</option>
            </select>
          </div>

          <button onClick={handleOpenNewModal} className="btn btn-accent" style={{ padding: '10px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <Plus size={18} /> {isID ? 'Buat Pengajuan' : 'Apply for Cost'}
          </button>
        </div>

        {/* Applications List */}
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '12px 15px', color: 'var(--text-muted)' }}>{isID ? 'Tanggal' : 'Date'}</th>
                <th style={{ padding: '12px 15px', color: 'var(--text-muted)' }}>{isID ? 'Pemohon' : 'Applicant'}</th>
                <th style={{ padding: '12px 15px', color: 'var(--text-muted)' }}>{isID ? 'Tipe Biaya' : 'Cost Type'}</th>
                <th style={{ padding: '12px 15px', color: 'var(--text-muted)' }}>{isID ? 'Referensi JO' : 'Job Order Ref'}</th>
                <th style={{ padding: '12px 15px', color: 'var(--text-muted)' }}>{isID ? 'Rekening Tujuan' : 'Recipient Account'}</th>
                <th style={{ padding: '12px 15px', color: 'var(--text-muted)', textAlign: 'right' }}>{isID ? 'Total Nominal' : 'Total Amount'}</th>
                <th style={{ padding: '12px 15px', color: 'var(--text-muted)', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '12px 15px', color: 'var(--text-muted)', textAlign: 'center' }}>{isID ? 'Aksi' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <Info size={36} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.3 }} />
                    {isID ? 'Tidak ada data pengajuan biaya.' : 'No cost applications found.'}
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => {
                  const itemsSummary = app.items?.map(i => `${i.details} (${formatCurrency(i.amount)})`).join(', ') || app.notes;
                  
                  return (
                    <tr key={app.id} style={{ borderBottom: '1px solid var(--border)' }} className="table-row-hover">
                      <td style={{ padding: '15px' }}>
                        <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold' }}>{app.expenseDate || app.date}</span>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{isID ? 'Pemohon: ' : 'Applicant: '}</span>
                            <span style={{ fontWeight: '700', fontSize: '0.82rem', color: 'var(--secondary)' }}>{app.requestedBy || 'Staff'}</span>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{isID ? 'Penerima: ' : 'Recipient: '}</span>
                            <span style={{ fontWeight: '600', fontSize: '0.82rem', color: 'var(--text)' }}>{app.employeeName}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 'bold', background: app.costType === 'operational' ? 'rgba(16,185,129,0.1)' : 'rgba(236,72,153,0.1)', color: app.costType === 'operational' ? 'var(--success)' : '#ec4899', border: app.costType === 'operational' ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(236,72,153,0.2)', display: 'inline-block', marginBottom: '4px' }}>
                          {app.costType === 'operational' ? (isID ? 'Operasional' : 'Operational') : (isID ? 'Lain-lain' : 'Other')}
                        </span>
                        {(app.category || app.subcategory) && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {app.category}{app.subcategory ? ` (${app.subcategory})` : ''}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '15px', fontWeight: 'bold', color: 'var(--secondary)' }}>
                        {app.joId ? app.joId : '-'}
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>{app.bankName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.bankAccount}</div>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'right', fontWeight: '800', color: 'var(--text)', fontSize: '0.95rem' }}>
                        {formatCurrency(app.amount)}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <span className={`status-badge ${app.status || 'pending'}`} style={{ textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                          {app.status === 'paid' ? (isID ? 'Cair' : 'Paid') : t(app.status || 'pending')}
                        </span>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          
                          {/* Accountant Actions: Approve / Reject / Release */}
                          {isAccountant && app.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleUpdateStatus(app, 'approved')}
                                style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--info)', border: 'none', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title={isID ? "Setujui" : "Approve"}
                              >
                                <Check size={15} />
                              </button>
                              <button 
                                onClick={() => handleUpdateStatus(app, 'rejected')}
                                style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', border: 'none', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title={isID ? "Tolak" : "Reject"}
                              >
                                <X size={15} />
                              </button>
                            </>
                          )}

                          {isAccountant && app.status === 'approved' && (
                            <button 
                              onClick={() => handleOpenReleaseModal(app)}
                              className="btn btn-accent" 
                              style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', borderRadius: '6px' }}
                            >
                              <Receipt size={13} /> {isID ? 'Cairkan' : 'Release'}
                            </button>
                          )}

                          {/* Staff actions: Edit / Delete (Only pending) */}
                          {app.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleOpenEditModal(app)}
                                style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border)', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Edit"
                              >
                                <FileText size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteApplication(app.id)}
                                style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: 'none', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title={isID ? "Hapus" : "Delete"}
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}

                          {/* View Info for non-editable rows */}
                          {(app.status === 'paid' || app.status === 'released' || app.status === 'rejected' || (!isAccountant && app.status === 'approved')) && (
                            <>
                              {(app.status === 'paid' || app.status === 'released') ? (
                                <button 
                                  onClick={() => {
                                    navigate('/accounting', { state: { activeTab: 'other_expenses', scrollToId: app.id } });
                                  }}
                                  style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--secondary)', border: '1px solid rgba(212,175,55,0.2)', padding: '5px 10px', fontSize: '0.75rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                  {isID ? 'Lihat' : 'View'}
                                </button>
                              ) : (
                                <button 
                                  onClick={() => {
                                    alert(`${isID ? 'Rincian item:' : 'Items Details:'}\n` + app.items?.map(i => `- ${i.details}: ${formatCurrency(i.amount)}`).join('\n') + `\n\n${isID ? 'Catatan:' : 'Notes:'} ${app.notes || '-'}`);
                                  }}
                                  style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '5px 10px', fontSize: '0.75rem', borderRadius: '6px', cursor: 'pointer' }}
                                >
                                  {isID ? 'Lihat' : 'View'}
                                </button>
                              )}
                            </>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', border: '1px solid var(--border)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h3 style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--secondary)' }}>
                <Wallet size={24} /> {formId ? (isID ? 'Edit Pengajuan Biaya' : 'Edit Cost Application') : (isID ? 'Form Pengajuan Biaya Baru' : 'New Cost Application')}
              </h3>
              <button onClick={() => setShowApplyModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Applicator Name Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {isID ? 'Nama Pemohon (Akun Pengaju)' : 'Applicator Name'}
                </label>
                <input 
                  type="text"
                  required
                  placeholder={isID ? "Nama pemohon..." : "Enter applicator name..."}
                  value={applicatorName}
                  onChange={e => setApplicatorName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }}
                />
              </div>

              {/* Type Selection */}
              <div className="grid-2" style={{ gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {isID ? 'Tipe Pengajuan' : 'Application Type'}
                  </label>
                  <select 
                    value={costType}
                    onChange={e => setCostType(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }}
                  >
                    <option value="operational">{isID ? 'Biaya Operasional JO' : 'JO Operational Cost'}</option>
                    <option value="other">{isID ? 'Biaya Lain-lain (Kantor/Umum)' : 'Other Cost (Office/General)'}</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {isID ? 'Tanggal Transaksi' : 'Transaction Date'}
                  </label>
                  <input 
                    type="date"
                    value={expenseDate}
                    onChange={e => setExpenseDate(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }}
                  />
                </div>
              </div>

              {/* Category & Subcategory Selection */}
              <div className="grid-2" style={{ gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {isID ? 'Kategori Transaksi' : 'Transaction Category'}
                  </label>
                  <select 
                    value={category}
                    onChange={e => handleCategoryChange(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }}
                  >
                    <option value="Lain-lain">{isID ? 'Lain-lain' : 'Other'}</option>
                    <option value="Operasional">{isID ? 'Operasional' : 'Operational'}</option>
                    <option value="Sewa">{isID ? 'Sewa' : 'Rent'}</option>
                    <option value="Gaji">{isID ? 'Gaji / Payroll' : 'Salary / Payroll'}</option>
                    <option value="Bonus">{isID ? 'Bonus' : 'Bonus'}</option>
                    <option value="CUSTOM">{isID ? '-- Kategori Kustom --' : '-- Custom Category --'}</option>
                  </select>
                  {category === 'CUSTOM' && (
                    <input 
                      type="text"
                      placeholder={isID ? "Tulis kategori kustom..." : "Enter custom category..."}
                      value={customCategory}
                      onChange={e => setCustomCategory(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', marginTop: '8px' }}
                    />
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {isID ? 'Subkategori' : 'Subcategory'}
                  </label>
                  {category === 'CUSTOM' ? (
                    <input 
                      type="text"
                      placeholder={isID ? "Subkategori" : "Subcategory"}
                      value={subcategory}
                      onChange={e => setSubcategory(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }}
                    />
                  ) : (
                    <select
                      value={subcategory}
                      onChange={e => setSubcategory(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }}
                    >
                      {(defaultSubcategories[category] || []).map(sub => (
                        <option key={sub.id} value={sub.id}>
                          {isID ? sub.id : (sub.en || sub.id)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Job Order Selector (Operational only) */}
              {costType === 'operational' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {isID ? 'Hubungkan ke Job Order' : 'Link to Job Order'}
                  </label>
                  <select 
                    value={selectedJoId}
                    onChange={e => setSelectedJoId(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }}
                  >
                    <option value="" style={{ color: 'var(--text-muted)' }}>-- {isID ? 'Pilih Job Order' : 'Select Job Order'} --</option>
                    {(jobOrders || []).map(jo => (
                      <option key={jo.id} value={jo.id}>
                        {jo.id} - {jo.customerName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Recipient Account Details */}
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', padding: '15px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--secondary)', marginBottom: '12px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={15} /> {isID ? 'Informasi Rekening Tujuan Transfer' : 'Recipient Transfer Details'}
                </div>
                <div className="grid-3" style={{ gap: '10px' }}>
                  <div>
                    <input 
                      type="text"
                      placeholder={isID ? "Nama Bank (BCA, Mandiri...)" : "Bank Name (BCA, Mandiri...)"}
                      value={recipientBank}
                      onChange={e => setRecipientBank(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <input 
                      type="text"
                      placeholder={isID ? "Nomor Rekening" : "Account Number"}
                      value={recipientBankAccount}
                      onChange={e => setRecipientBankAccount(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <input 
                      type="text"
                      placeholder={isID ? "Nama Penerima" : "Recipient Name"}
                      value={recipientName}
                      onChange={e => setRecipientName(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Items Breakdown list */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {isID ? 'Rincian Item Biaya' : 'Cost Items Breakdown'}
                  </label>
                  <button 
                    onClick={handleAddItemRow}
                    style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--secondary)', border: '1px solid var(--secondary)', borderRadius: '6px', padding: '3px 10px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    + {isID ? 'Tambah Item' : 'Add Item'}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input 
                        type="text"
                        placeholder={isID ? "Deskripsi item/pekerjaan" : "Item/Job Description"}
                        value={item.details}
                        onChange={e => handleItemChange(idx, 'details', e.target.value)}
                        style={{ flex: 2, padding: '8px 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '0.85rem' }}
                      />
                      <input 
                        type="number"
                        step="any"
                        placeholder={isID ? "Nominal (Rp)" : "Amount (IDR)"}
                        value={item.amount}
                        onChange={e => handleItemChange(idx, 'amount', e.target.value)}
                        style={{ flex: 1, padding: '8px 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '0.85rem' }}
                      />
                      {items.length > 1 && (
                        <button 
                          onClick={() => handleRemoveItemRow(idx)}
                          style={{ padding: '8px', background: 'var(--danger-bg)', color: 'var(--danger)', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContext: 'center' }}
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '15px 20px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>TOTAL:</span>
                <span style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--secondary)' }}>
                  {formatCurrency(items.reduce((s, i) => s + parseFloat(i.amount || 0), 0))}
                </span>
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {isID ? 'Catatan Tambahan' : 'Additional Notes'}
                </label>
                <textarea 
                  placeholder={isID ? "Tulis keterangan tambahan..." : "Enter additional details..."}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={{ width: '100%', height: '80px', padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', resize: 'none', fontSize: '0.85rem' }}
                />
              </div>

              {/* Submit button */}
              <ButtonWithLoading 
                onClick={handleSaveApplication}
                loading={isSubmitting}
                className="btn btn-accent"
                style={{ width: '100%', padding: '12px', borderRadius: '10px', fontWeight: 'bold' }}
              >
                {formId ? (isID ? 'Simpan Perubahan' : 'Save Changes') : (isID ? 'Kirim Pengajuan' : 'Submit Application')}
              </ButtonWithLoading>

            </div>

          </div>
        </div>
      )}

      {/* Release Funds Modal (Accounting/Owner only) */}
      {showReleaseModal && selectedApp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '500px', padding: '30px', border: '1px solid var(--border)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)' }}>
                <Building size={20} /> {isID ? 'Pencairan Dana Pengajuan' : 'Release Cost Application'}
              </h3>
              <button onClick={() => setShowReleaseModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', padding: '12px 15px', borderRadius: '8px', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{isID ? 'Pemohon:' : 'Applicant:'}</span>
                  <span style={{ fontWeight: 'bold' }}>{selectedApp.employeeName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{isID ? 'Tujuan Bank:' : 'Destination:'}</span>
                  <span style={{ fontWeight: 'bold' }}>{selectedApp.bankName} - {selectedApp.bankAccount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '6px', marginTop: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{isID ? 'Total Nominal:' : 'Total Amount:'}</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--secondary)' }}>{formatCurrency(selectedApp.amount)}</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {isID ? 'Rekening Sumber Pencairan' : 'Paying Company Account'}
                </label>
                <select 
                  value={companyBankAccountId}
                  onChange={e => setCompanyBankAccountId(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '0.85rem' }}
                >
                  <option value="" style={{ color: 'var(--text-muted)' }}>-- {isID ? 'Pilih Rekening Perusahaan' : 'Select Bank Account'} --</option>
                  {(companyBankAccounts || []).map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountName} - {acc.bankName} ({acc.accountNumber})
                    </option>
                  ))}
                  <option value="CUSTOM">{isID ? '-- SUMBER DANA LAIN (Kustom) --' : '-- OTHER PAYMENT SOURCE (Custom) --'}</option>
                </select>
              </div>

              {companyBankAccountId === 'CUSTOM' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {isID ? 'Deskripsi Sumber Dana Kustom' : 'Custom Payment Source Name'}
                  </label>
                  <input 
                    type="text"
                    placeholder={isID ? "Contoh: Kas Kecil Kantor, dll." : "Example: Petty Cash, etc."}
                    value={customSourceTarget}
                    onChange={e => setCustomSourceTarget(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '0.85rem' }}
                  />
                </div>
              )}

              <ButtonWithLoading 
                onClick={handleReleaseFunds}
                loading={isSubmitting}
                className="btn btn-accent"
                style={{ width: '100%', padding: '12px', borderRadius: '10px', fontWeight: 'bold' }}
              >
                {isID ? 'Konfirmasi & Cairkan Dana' : 'Confirm & Release Funds'}
              </ButtonWithLoading>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default CostApplications;
