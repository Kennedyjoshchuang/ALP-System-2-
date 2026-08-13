import toast from 'react-hot-toast';
import { useConfirm } from '../context/ConfirmContext';
import React, { useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CreditCard, Download, Receipt, Wallet, CheckCircle, Plus, X, XCircle, DollarSign, Search, FileSpreadsheet, RotateCcw, Edit3, Save, Image, ChevronDown, ChevronUp, User, Briefcase, Banknote, Calendar, FileText, Trash2, Settings, ExternalLink, ShieldCheck, ShieldAlert, GitMerge } from 'lucide-react';
import { exportToExcel } from '../utils/exportUtils';
import { ButtonWithLoading } from '../components/ButtonWithLoading';
import ExtraDocsUploader from '../components/ExtraDocsUploader';
import { apiRequest } from '../api/api';

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

const sortInvoices = (list, sortBy) => {
  return [...list].sort((a, b) => {
    const idA = a.id || '';
    const idB = b.id || '';
    const dateA = a.date ? new Date(a.date) : new Date(0);
    const dateB = b.date ? new Date(b.date) : new Date(0);
    const nameA = a.customerName || '';
    const nameB = b.customerName || '';
    const amountA = parseFloat(a.balance || a.amount || 0);
    const amountB = parseFloat(b.balance || b.amount || 0);

    if (sortBy === 'inv_no_desc') {
      return idB.localeCompare(idA, undefined, { numeric: true, sensitivity: 'base' });
    }
    if (sortBy === 'inv_no_asc') {
      return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
    }
    if (sortBy === 'date_desc') {
      return dateB - dateA;
    }
    if (sortBy === 'date_asc') {
      return dateA - dateB;
    }
    if (sortBy === 'client_asc') {
      return nameA.localeCompare(nameB);
    }
    if (sortBy === 'client_desc') {
      return nameB.localeCompare(nameA);
    }
    if (sortBy === 'amount_desc') {
      return amountB - amountA;
    }
    if (sortBy === 'amount_asc') {
      return amountA - amountB;
    }
    return 0;
  });
};

const Accounting = () => {
  const context = useApp();
  const confirm = useConfirm();
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const renderPositionTags = (positionStr, customStyle = {}) => {
    if (!positionStr) return <span style={{ color: 'var(--text-muted)' }}>-</span>;
    const parts = positionStr.split(',').map(p => p.trim()).filter(Boolean);
    
    const roleColors = {
      'marketing': { bg: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', text: 'var(--green-vibrant)' },
      'admin office': { bg: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', text: 'var(--blue-vibrant)' },
      'procurement': { bg: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', text: '#a78bfa' },
      'executor': { bg: 'rgba(236, 72, 153, 0.1)', border: '1px solid rgba(236, 72, 153, 0.3)', text: '#f472b6' },
      'accounting': { bg: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', text: 'var(--gold-vibrant)' },
      'hrd': { bg: 'rgba(20, 184, 166, 0.1)', border: '1px solid rgba(20, 184, 166, 0.3)', text: '#2dd4bf' },
      'system control': { bg: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', text: 'var(--red-vibrant)' }
    };

    return (
      <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '4px', ...customStyle }}>
        {parts.map((part, index) => {
          const styleConf = roleColors[part.toLowerCase()] || { 
            bg: 'rgba(255, 255, 255, 0.05)', 
            border: '1px solid rgba(255, 255, 255, 0.1)', 
            text: 'var(--text-muted)' 
          };
          return (
            <span 
              key={index} 
              style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 8px', 
                borderRadius: '4px', 
                fontSize: '0.7rem', 
                fontWeight: '700', 
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                background: styleConf.bg,
                border: styleConf.border,
                color: styleConf.text
              }}
            >
              {part}
            </span>
          );
        })}
      </div>
    );
  };

  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    if (location.state && location.state.activeTab) {
      return location.state.activeTab;
    }
    return 'billing';
  });
  const [expandedReportMonths, setExpandedReportMonths] = useState({});
  const [expandedOtherTxMonths, setExpandedOtherTxMonths] = useState({});
  const [receivableSubTab, setReceivableSubTab] = useState('outstanding');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [costModal, setCostModal] = useState(null); // holds the JO being costed
  const [costLines, setCostLines] = useState([{ vendorId: '', serviceIdx: '', qty: 1, customVendorName: '', customServiceDescription: '', customPrice: '', targetItemIdx: '' }]);
  const [searchTerm, setSearchTerm] = useState('');
  const [joSortBy, setJoSortBy] = useState('created_desc');
  const [invoiceSortBy, setInvoiceSortBy] = useState('inv_no_desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editingJOsData, setEditingJOsData] = useState({});
  const [photoViewer, setPhotoViewer] = useState(null); // holds { joId, photos }
  const [isPendingCollapsed, setIsPendingCollapsed] = useState(false);
  const [isIssuedCollapsed, setIsIssuedCollapsed] = useState(false);
  const [undoConfirmJoId, setUndoConfirmJoId] = useState(null); // inline undo confirmation
  const [shipmentEdits, setShipmentEdits] = useState({});
  const [savingShipment, setSavingShipment] = useState({});
  const [uploadSignedModal, setUploadSignedModal] = useState(null); // { invId, type: 'invoice' | 'receipt' }
  
  // Mass Selection State
  const [selectedLedger, setSelectedLedger] = useState(new Set());
  const [selectedPayables, setSelectedPayables] = useState(new Set());
  const [selectedIssued, setSelectedIssued] = useState(new Set());

  
  // PO States
  const [showPOModal, setShowPOModal] = useState(false);
  const [poJoId, setPoJoId] = useState('');
  const [poVendorId, setPoVendorId] = useState('');
  const [poItems, setPoItems] = useState([{ serviceIdx: '', qty: 1 }]);
  const [poNotes, setPoNotes] = useState('');
  const [printPO, setPrintPO] = useState(null);

  // Custom Invoice States
  const [showCustomInvoiceModal, setShowCustomInvoiceModal] = useState(false);
  const [customInvoiceForm, setCustomInvoiceForm] = useState({
    id: '',
    joId: '',
    customerName: '',
    date: new Date().toISOString().substring(0, 10),
    taxPercent: 0,
    items: [{ description: '', qty: 1, rate: 0 }],
    notes: ''
  });

  // Salary States
  const [salaryModal, setSalaryModal] = useState(false);
  const [salaryForm, setSalaryForm] = useState({
    name: '', position: '', bankAccount: '', bankName: '', baseSalary: '', period: '', nik: '', npwp: '', taxes: [], proofPhoto: '', expenseDate: ''
  });

  // Other Expense States
  const [otherExpenseModal, setOtherExpenseModal] = useState(false);
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState('all');
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);
  const [otherExpenseForm, setOtherExpenseForm] = useState({
    id: null,
    type: 'expense',
    category: 'Lain-lain',
    customCategory: '',
    subcategory: '',
    customSubcategory: '',
    companyBankAccountId: '',
    customSourceTarget: '',
    employeeId: '',
    employeeName: '',
    position: '',
    bankAccount: '',
    bankName: '',
    amount: '',
    descriptionText: '',
    description: '',
    taxes: [],
    proofPhoto: '',
    expenseDate: ''
  });

  // Reimbursement States
  const [reimbursementModal, setReimbursementModal] = useState(false);
  const [reimbursementForm, setReimbursementForm] = useState({
    id: null,
    employeeId: '',
    employeeName: '',
    expenseDate: new Date().toISOString().substring(0, 10),
    items: [{ details: '', amount: '', receiptPhoto: '' }],
    recipientBankName: '',
    recipientBankAccount: '',
    companyBankAccountId: '',
    customSourceTarget: '',
    status: 'pending',
    notes: '',
    totalCost: 0,
    proofPhoto: '' // overall proof of payment if any
  });


  const [salarySlip, setSalarySlip] = useState(null);
  const [financialReport, setFinancialReport] = useState(null); // holds report data for PDF
  const [payableSubTab, setPayableSubTab] = useState('outstanding');
  const [vendorInvoiceModal, setVendorInvoiceModal] = useState(null);
  const [paymentProofModal, setPaymentProofModal] = useState(null);
  const [modalPhotos, setModalPhotos] = useState([]);
  const [modalTaxPhotos, setModalTaxPhotos] = useState([]);
  const [batchPrintInvoices, setBatchPrintInvoices] = useState(null);
  const [batchPrintPOs, setBatchPrintPOs] = useState(null);
  const [batchPrintIssued, setBatchPrintIssued] = useState(null);
  const [batchPrintPaidInvoices, setBatchPrintPaidInvoices] = useState(null);


  const [bankModal, setBankModal] = useState(null);
  const [showBankSettings, setShowBankSettings] = useState(false);
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [bankToDelete, setBankToDelete] = useState(null);

  // Invoice Bank Selection
  const [issuingInvoiceJoId, setIssuingInvoiceJoId] = useState(null);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [expandedCompletedGroups, setExpandedCompletedGroups] = useState({});
  const [expandedPLGroups, setExpandedPLGroups] = useState({});
  const [expandedJOPL, setExpandedJOPL] = useState({});
  const [splitModalData, setSplitModalData] = useState(null); // stores { jo, itemIdx, item } or null
  const [mergeModalData, setMergeModalData] = useState(null); // stores { sourceJo } or null
  const [mergeTargetJoId, setMergeTargetJoId] = useState('');
  const [isProcessingMerge, setIsProcessingMerge] = useState(false);
  const [splitForm, setSplitForm] = useState({
    customerName: '',
    quotationId: '',
    description: '',
    rate: 0,
    quantity: 1,
    issueQuantity: 0,
    autoGenerateInvoice: false,
    invoiceId: '',
    invoiceDate: '',
    taxPercent: 0,
    bankAccountId: '',
    invoiceNotes: '',
    customerAddress: '',
    customerPic: '',
    customerPhone: '',
    customerEmail: ''
  });
  const [isProcessingSplit, setIsProcessingSplit] = useState(false);

  const handleOpenSplitModal = (jo, itemIdx) => {
    const item = jo.items[itemIdx];
    if (!item) return;

    const parentInvoice = joInvoiceMap[String(jo.id)];
    const linkedQuo = jo.quotationId ? quotations.find(q => String(q.id) === String(jo.quotationId)) : null;

    const customerObj = customers.find(c => c.name === (jo?.customerName || ''));
    const address = parentInvoice?.customerAddress || linkedQuo?.companyAddress || jo.address || customerObj?.address || '';
    const pic = parentInvoice?.customerPic || linkedQuo?.pic || '';
    const phone = parentInvoice?.customerPhone || linkedQuo?.phone || '';
    const email = parentInvoice?.customerEmail || linkedQuo?.email || '';

    let taxPercent = 0;
    if (parentInvoice && parentInvoice.subtotal > 0) {
      taxPercent = Math.round((parentInvoice.tax / parentInvoice.subtotal) * 100);
    }

    const initialBankAccountId = parentInvoice?.bankAccountId || (companyBankAccounts.length > 0 ? companyBankAccounts[0].id : '');
    const generatedInvId = `INV-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    setSplitModalData({ jo, itemIdx, item });
    setSplitForm({
      customerName: jo.customerName || '',
      quotationId: jo.quotationId || '',
      description: getResolvedDescription(item, jo, itemIdx) || 'Freight Forwarding Services',
      rate: parseFloat(item.rate || 0),
      quantity: parseInt(item.quantity || 1, 10),
      issueQuantity: parseInt(item.issueQuantity || 0, 10),
      autoGenerateInvoice: !!parentInvoice,
      invoiceId: '',
      invoiceDate: new Date().toISOString().substring(0, 10),
      taxPercent,
      bankAccountId: initialBankAccountId,
      invoiceNotes: '',
      customerAddress: address,
      customerPic: pic,
      customerPhone: phone,
      customerEmail: email
    });
  };

  const handleProcessSplit = async () => {
    if (!canWrite || !splitModalData) return;
    const { jo, itemIdx, item } = splitModalData;

    setIsProcessingSplit(true);
    try {
      // 1. Create the new standalone JO using splitForm values
      const newJoPayload = {
        quotationId: splitForm.quotationId,
        customerName: splitForm.customerName,
        phone: jo.phone || '',
        email: jo.email || '',
        quoteValidity: jo.quoteValidity || '',
        rate: parseFloat(splitForm.rate || 0),
        quantity: parseInt(splitForm.quantity || 1, 10),
        issueQuantity: parseInt(splitForm.issueQuantity || 0, 10),
        jobDescription: splitForm.description,
        items: [{
          description: splitForm.description,
          rate: parseFloat(splitForm.rate || 0),
          quantity: parseInt(splitForm.quantity || 1, 10),
          issueQuantity: parseInt(splitForm.issueQuantity || 0, 10),
          status: item.status || 'pending',
          containerNo: item.containerNo || [],
          vehicleNo: item.vehicleNo || [],
          driverName: item.driverName || []
        }]
      };

      const newJo = await createJO(newJoPayload);

      // 2. Prepare remaining items for the original JO
      const remainingItems = jo.items.filter((_, idx) => idx !== itemIdx);
      const remainingQty = remainingItems.reduce((sum, it) => sum + parseInt(it.quantity || 0, 10), 0);
      const remainingIssueQty = remainingItems.reduce((sum, it) => sum + parseInt(it.issueQuantity || 0, 10), 0);
      const remainingInstruction = remainingItems.map(it => it.description).join(', ');

      // 3. Migrate costs associated with this item index
      const originalCosts = Array.isArray(jo.costs) ? jo.costs : [];
      const movedCosts = [];
      const remainingCosts = [];

      originalCosts.forEach(cost => {
        if (cost.targetItemIdx === itemIdx) {
          movedCosts.push({
            ...cost,
            targetItemIdx: 0 // new JO has only 1 item at index 0
          });
        } else {
          let newTargetIdx = cost.targetItemIdx;
          if (cost.targetItemIdx !== null && cost.targetItemIdx !== undefined && cost.targetItemIdx > itemIdx) {
            newTargetIdx = cost.targetItemIdx - 1;
          }
          remainingCosts.push({
            ...cost,
            targetItemIdx: newTargetIdx
          });
        }
      });

      // 4. Update the original JO status
      await updateJOStatus(jo.id, {
        items: remainingItems,
        quantity: remainingQty,
        issueQuantity: remainingIssueQty,
        instruction: remainingInstruction,
        costs: remainingCosts
      });

      // Update parent invoice if it exists
      const parentInvoice = joInvoiceMap[String(jo.id)];
      if (parentInvoice && Array.isArray(parentInvoice.items)) {
        const splitDesc = (getResolvedDescription(item, jo, itemIdx) || item.description || 'Freight Forwarding Services').trim().toLowerCase();
        const splitRate = parseFloat(item.rate || 0);
        const splitQty = parseFloat(item.issueQuantity || item.quantity || 1);

        let matchIdx = parentInvoice.items.findIndex(i => 
          (i.description || '').trim().toLowerCase() === splitDesc &&
          parseFloat(i.rate || 0) === splitRate &&
          parseFloat(i.qty || 0) === splitQty
        );
        if (matchIdx === -1) {
          matchIdx = parentInvoice.items.findIndex(i => 
            (i.description || '').trim().toLowerCase() === splitDesc &&
            parseFloat(i.rate || 0) === splitRate
          );
        }
        if (matchIdx === -1) {
          matchIdx = parentInvoice.items.findIndex(i => 
            (i.description || '').trim().toLowerCase() === splitDesc
          );
        }

        if (matchIdx !== -1) {
          const updatedParentItems = parentInvoice.items.filter((_, idx) => idx !== matchIdx);
          let subtotal = updatedParentItems.reduce((sum, i) => sum + (parseFloat(i.qty || 0) * parseFloat(i.rate || 0)), 0);
          if (Array.isArray(parentInvoice.extra_charges)) {
            subtotal += parentInvoice.extra_charges.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
          }
          const oldSubtotal = parseFloat(parentInvoice.subtotal || 0);
          const taxRate = oldSubtotal > 0 ? (parseFloat(parentInvoice.tax || 0) / oldSubtotal) : 0;
          const tax = subtotal * taxRate;
          const amount = subtotal + tax;

          await updateInvoice(parentInvoice.id, {
            items: updatedParentItems,
            subtotal,
            tax,
            amount
          });
        }
      }

      // 5. Update the new JO with the migrated costs (if any)
      if (movedCosts.length > 0) {
        await updateJOStatus(newJo.id, {
          costs: movedCosts
        });
      }

      // 6. Automatically generate invoice if selected
      if (splitForm.autoGenerateInvoice) {
        const qty = parseFloat(splitForm.issueQuantity || splitForm.quantity || 1);
        const subtotal = parseFloat(splitForm.rate || 0) * qty;
        const tax = subtotal * ((parseFloat(splitForm.taxPercent) || 0) / 100);
        const amount = subtotal + tax;

        const invoiceData = {
          id: splitForm.invoiceId.trim(),
          joId: newJo.id,
          consolidatedJOs: [newJo.id],
          customerName: splitForm.customerName,
          customerAddress: splitForm.customerAddress,
          customerPic: splitForm.customerPic,
          customerPhone: splitForm.customerPhone,
          customerEmail: splitForm.customerEmail,
          date: splitForm.invoiceDate,
          amount,
          subtotal,
          tax,
          items: [{
            description: splitForm.description,
            qty,
            rate: parseFloat(splitForm.rate || 0),
            amount: subtotal,
            containerNo: item.containerNo || [],
            vehicleNo: item.vehicleNo || [],
            driverName: item.driverName || []
          }],
          extra_charges: [],
          notes: splitForm.invoiceNotes || null
        };

        const newInv = await createCustomInvoice(invoiceData);
        if (!newInv) throw new Error('Gagal menerbitkan invoice untuk JO baru.');
      }

      toast.success(isID 
        ? `Berhasil memisahkan item ke JO baru: ${newJo.id}`
        : `Successfully split item to new JO: ${newJo.id}`
      );
      setSplitModalData(null);
    } catch (err) {
      console.error('Split/Invoice process error:', err);
      toast.error(isID 
        ? `Gagal memproses pemisahan: ${err.message}`
        : `Failed to process split: ${err.message}`
      );
    } finally {
      setIsProcessingSplit(false);
    }
  };

  const handleProcessMerge = async () => {
    if (!canWrite || !mergeModalData || !mergeTargetJoId) return;
    const { sourceJo } = mergeModalData;
    const targetJo = jobOrders.find(j => String(j.id) === String(mergeTargetJoId));
    if (!targetJo) return;

    setIsProcessingMerge(true);
    try {
      // 1. Merge items
      const mergedItems = [
        ...(targetJo.items || []),
        ...(sourceJo.items || [])
      ];

      // Update Target JO quantities and instructions
      const updatedQty = mergedItems.reduce((sum, it) => sum + parseInt(it.quantity || 0, 10), 0);
      const updatedIssueQty = mergedItems.reduce((sum, it) => sum + parseInt(it.issueQuantity || 0, 10), 0);
      const updatedInstruction = mergedItems.map(it => it.description).join(', ');

      // 2. Migrate costs
      const targetItemsOffset = (targetJo.items || []).length;
      const sourceCosts = Array.isArray(sourceJo.costs) ? sourceJo.costs : [];
      const migratedCosts = sourceCosts.map(cost => {
        let newIdx = cost.targetItemIdx;
        if (cost.targetItemIdx !== null && cost.targetItemIdx !== undefined) {
          newIdx = targetItemsOffset + cost.targetItemIdx;
        }
        return {
          ...cost,
          targetItemIdx: newIdx
        };
      });

      const mergedCosts = [
        ...(Array.isArray(targetJo.costs) ? targetJo.costs : []),
        ...migratedCosts
      ];

      // 3. Invoice merging cases
      const sourceInv = invoices.find(inv => {
        const jIds = inv.consolidatedJOs || (inv.joId ? [inv.joId] : []);
        return jIds.map(String).includes(String(sourceJo.id));
      });
      const targetInv = invoices.find(inv => {
        const jIds = inv.consolidatedJOs || (inv.joId ? [inv.joId] : []);
        return jIds.map(String).includes(String(targetJo.id));
      });

      if (sourceInv && targetInv) {
        // Case A: Both have invoices -> merge source into target and delete source
        const mergedInvoiceItems = [
          ...(targetInv.items || []),
          ...(sourceInv.items || [])
        ];
        const subtotal = parseFloat(targetInv.subtotal || 0) + parseFloat(sourceInv.subtotal || 0);
        const tax = parseFloat(targetInv.tax || 0) + parseFloat(sourceInv.tax || 0);
        const amount = parseFloat(targetInv.amount || 0) + parseFloat(sourceInv.amount || 0);
        const consolidatedJOs = Array.from(new Set([
          ...(targetInv.consolidatedJOs || [targetJo.id]),
          ...(sourceInv.consolidatedJOs || [sourceJo.id])
        ]));

        await updateInvoice(targetInv.id, {
          items: mergedInvoiceItems,
          subtotal,
          tax,
          amount,
          consolidatedJOs
        });
        await deleteInvoice(sourceInv.id);

      } else if (sourceInv && !targetInv) {
        // Case B: Only source has invoice -> transfer it to target JO and append target JO items
        const sourceSubtotalBefore = parseFloat(sourceInv.subtotal || 0);
        const sourceTaxBefore = parseFloat(sourceInv.tax || 0);
        const taxRate = sourceSubtotalBefore > 0 ? (sourceTaxBefore / sourceSubtotalBefore) : 0;

        let extraSubtotal = 0;
        const newInvoiceItems = (targetJo.items || []).map(item => {
          const qty = parseFloat(item.issueQuantity || item.quantity || 1);
          const rate = parseFloat(item.rate || 0);
          const amount = qty * rate;
          extraSubtotal += amount;
          return {
            description: item.description || 'Freight Forwarding Services',
            qty,
            rate,
            amount,
            containerNo: item.containerNo || [],
            vehicleNo: item.vehicleNo || [],
            driverName: item.driverName || []
          };
        });

        const mergedInvoiceItems = [
          ...(sourceInv.items || []),
          ...newInvoiceItems
        ];

        const subtotal = sourceSubtotalBefore + extraSubtotal;
        const tax = subtotal * taxRate;
        const amount = subtotal + tax;

        const consolidatedJOs = Array.from(new Set([
          ...(sourceInv.consolidatedJOs || [sourceJo.id]),
          targetJo.id
        ])).filter(id => String(id) !== String(sourceJo.id));

        await updateInvoice(sourceInv.id, {
          joId: targetJo.id,
          items: mergedInvoiceItems,
          subtotal,
          tax,
          amount,
          consolidatedJOs
        });

      } else if (!sourceInv && targetInv) {
        // Case C: Only target has invoice -> append source items to target invoice
        const targetSubtotalBefore = parseFloat(targetInv.subtotal || 0);
        const targetTaxBefore = parseFloat(targetInv.tax || 0);
        const taxRate = targetSubtotalBefore > 0 ? (targetTaxBefore / targetSubtotalBefore) : 0;

        let extraSubtotal = 0;
        const newInvoiceItems = (sourceJo.items || []).map(item => {
          const qty = parseFloat(item.issueQuantity || item.quantity || 1);
          const rate = parseFloat(item.rate || 0);
          const amount = qty * rate;
          extraSubtotal += amount;
          return {
            description: item.description || 'Freight Forwarding Services',
            qty,
            rate,
            amount,
            containerNo: item.containerNo || [],
            vehicleNo: item.vehicleNo || [],
            driverName: item.driverName || []
          };
        });

        const mergedInvoiceItems = [
          ...(targetInv.items || []),
          ...newInvoiceItems
        ];

        const subtotal = targetSubtotalBefore + extraSubtotal;
        const tax = subtotal * taxRate;
        const amount = subtotal + tax;
        const consolidatedJOs = Array.from(new Set([
          ...(targetInv.consolidatedJOs || [targetJo.id]),
          targetJo.id
        ]));

        await updateInvoice(targetInv.id, {
          items: mergedInvoiceItems,
          subtotal,
          tax,
          amount,
          consolidatedJOs
        });
      }

      // 4. Update the target JO database record with combined items and costs
      await updateJOStatus(targetJo.id, {
        items: mergedItems,
        quantity: updatedQty,
        issueQuantity: updatedIssueQty,
        instruction: updatedInstruction,
        costs: mergedCosts
      });

      // 5. Delete source JO database record
      await deleteJO(sourceJo.id);

      toast.success(isID
        ? `Berhasil menggabungkan JO ${sourceJo.id} ke JO ${targetJo.id}`
        : `Successfully merged JO ${sourceJo.id} into JO ${targetJo.id}`
      );
      setMergeModalData(null);
    } catch (err) {
      console.error('Merge process error:', err);
      toast.error(isID
        ? `Gagal memproses penggabungan: ${err.message}`
        : `Failed to process merge: ${err.message}`
      );
    } finally {
      setIsProcessingMerge(false);
    }
  };

  const handleOpenMergeModal = (jo) => {
    setMergeModalData({ sourceJo: jo });
    const candidates = jobOrders.filter(j => 
      String(j.quotationId) === String(jo.quotationId) && 
      String(j.id) !== String(jo.id) && 
      j.customerName === jo.customerName
    );
    if (candidates.length > 0) {
      setMergeTargetJoId(candidates[0].id);
    } else {
      setMergeTargetJoId('');
    }
  };

  const getResolvedDescription = (item, jo, idx) => {
    if (item.description && item.description !== 'Freight Forwarding Services') {
      return item.description;
    }
    if (jo.quotationId) {
      const quot = (quotations || []).find(q => q.id === jo.quotationId);
      if (quot) {
        if (Array.isArray(quot.items) && quot.items[idx]) {
          return quot.items[idx].description;
        }
        if (Array.isArray(quot.items) && quot.items[0]) {
          return quot.items[0].description;
        }
        if (quot.subject) {
          return quot.subject;
        }
      }
    }
    let rawInst = jo.instruction || '';
    if (rawInst.includes('|||')) {
      rawInst = rawInst.split('|||')[0].trim();
    }
    if (rawInst) return rawInst;
    return 'Freight Forwarding Services';
  };


  // Invoice Confirmation Modal
  const [invoiceConfirmData, setInvoiceConfirmData] = useState(null);
  // Shape: { joId, bankAccount, consolidatedJOIds, linkedJOs, form: { id, customerName, customerAddress, customerPic, customerPhone, customerEmail, date, items, extraCharges, taxPercent, bankAccountId } }
  const [receivableProofModal, setReceivableProofModal] = useState(null); // invoice to upload proof for
  const [settleModal, setSettleModal] = useState(null); // { id, amount, ... }
  const [settleForm, setSettleForm] = useState({ paymentProof: [], taxes: [{ name: '', amount: 0 }], taxProof: [] });
  const [settlePayableModal, setSettlePayableModal] = useState(null);
  const [settlePayableForm, setSettlePayableForm] = useState({ paymentProof: [], taxName: '', taxAmount: 0, taxProof: [] });
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null); 
  const [verifyStep, setVerifyStep] = useState(1);
  const [verifyText, setVerifyText] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const { 
    jobOrders = [], invoices = [], createInvoice, createCustomInvoice, settleInvoice, deleteInvoice, updateInvoice, createJO, deleteJO, 
    receivables = [], vendors = [], purchaseOrders = [], updateJOStatus, updatePurchaseOrder, deletePurchaseOrder, patchPurchaseOrderLocal,
    quotations = [],
    salaries = [], addSalary, deleteSalary, updateSalary,
    otherExpenses = [], addOtherExpense, deleteOtherExpense, updateOtherExpense,
    employees = [], companyBankAccounts = [], updateCompanyBank, deleteCompanyBank,
    customers = [],
    getSystemConfig,
    loading,
    t,
    language,
    hasAccess
  } = context || {};

  const getAssociatedJOs = (invoice) => {
    if (!invoice) return [];
    const primaryJo = jobOrders.find(j => String(j.id) === String(invoice.joId));
    const consolidated = invoice.consolidatedJOs || [];
    if (consolidated.length > 0) {
      return jobOrders.filter(j => consolidated.map(String).includes(String(j.id)));
    }
    return primaryJo ? [primaryJo] : [];
  };

  const renderShipmentInfo = (associatedJOs) => {
    if (!associatedJOs || associatedJOs.length === 0) return '—';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem' }}>
        {associatedJOs.map(jo => (
          <div key={jo.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px', background: 'rgba(255,255,255,0.02)', padding: '6px', borderRadius: '6px', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontWeight: 'bold', color: 'var(--secondary)', fontSize: '0.7rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <span>{jo.id}</span>
              {jo.shipmentStatus && (
                <span className={`badge ${jo.shipmentStatus === 'done' ? 'badge-done' : 'badge-dispatched'}`} style={{ fontSize: '0.6rem', padding: '1px 4px' }}>
                  {jo.shipmentStatus === 'done' ? (isID ? 'Selesai' : 'Done') : (isID ? 'Dalam Proses' : 'In Progress')}
                </span>
              )}
            </div>
            {jo.etd && <div><span style={{ color: 'var(--text-muted)' }}>ETD:</span> {formatDate(jo.etd)}</div>}
            {jo.eta && <div><span style={{ color: 'var(--text-muted)' }}>ETA:</span> {formatDate(jo.eta)}</div>}
            {!jo.shipmentStatus && !jo.etd && !jo.eta && (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>-</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  const getAggregatedContainers = (associatedJOs, invoice = null) => {
    const counts = {};
    
    // 1. Try to get container numbers from invoice.items
    if (invoice && Array.isArray(invoice.items) && invoice.items.length > 0) {
      invoice.items.forEach(item => {
        const cNo = item.containerNo;
        if (Array.isArray(cNo)) {
          cNo.filter(Boolean).forEach(num => {
            const clean = String(num).trim();
            if (clean) counts[clean] = (counts[clean] || 0) + 1;
          });
        } else if (cNo && String(cNo).trim()) {
          const clean = String(cNo).trim();
          counts[clean] = (counts[clean] || 0) + 1;
        }
      });
    }

    // 2. Combine with associatedJOs container numbers
    if (associatedJOs && Array.isArray(associatedJOs)) {
      associatedJOs.forEach(jo => {
        let list = [];
        // A. Try to get container numbers from jo.items (new scheme)
        if (Array.isArray(jo.items) && jo.items.length > 0) {
          jo.items.forEach(item => {
            const cNo = item.containerNo;
            if (Array.isArray(cNo)) {
              list = [...list, ...cNo.filter(Boolean)];
            } else if (cNo && String(cNo).trim()) {
              list.push(String(cNo).trim());
            }
          });
        }
        
        // B. If no containers found in items, fall back to root containerNo (legacy scheme)
        if (list.length === 0) {
          const cNo = jo.containerNo;
          if (Array.isArray(cNo)) {
            list = cNo.filter(Boolean);
          } else if (cNo && String(cNo).trim()) {
            list = [String(cNo).trim()];
          }
        }

        list.forEach(num => {
          const clean = String(num).trim();
          if (clean) {
            counts[clean] = (counts[clean] || 0) + 1;
          }
        });
      });
    }

    return Object.entries(counts).map(([num, count]) => {
      return count > 1 ? `${num} (${count}x)` : num;
    });
  };

  const canWrite = hasAccess ? hasAccess('accounting', true) : false;

  const isID = language === 'id';
  const highlightId = location.state?.scrollToId;

  React.useEffect(() => {
    if (location.state && location.state.activeTab === 'other_expenses' && location.state.scrollToId) {
      const txId = location.state.scrollToId;
      const tx = (otherExpenses || []).find(e => e.id === txId);
      if (tx) {
        const tDate = tx.expenseDate || tx.date;
        if (tDate) {
          const d = new Date(tDate);
          const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          setExpandedOtherTxMonths(prev => ({ ...prev, [mKey]: true }));
          
          setTimeout(() => {
            const element = document.getElementById(`tx-row-${txId}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 300);
        }
      }
    }
  }, [location.state, otherExpenses]);

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

  const parsePolymorphicDescription = (desc) => {
    if (!desc || typeof desc !== 'string') {
      return { type: 'expense', category: 'Lain-lain', subcategory: '', description: String(desc || '') };
    }
    try {
      const trimmed = desc.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const parsed = JSON.parse(trimmed);
        return {
          type: parsed.type || 'expense',
          category: parsed.category || 'Lain-lain',
          subcategory: parsed.subcategory || '',
          description: parsed.description || '',
          employeeId: parsed.employeeId || null,
          customCategory: parsed.customCategory || '',
          companyBankAccountId: parsed.companyBankAccountId || null,
          customSourceTarget: parsed.customSourceTarget || '',
          items: parsed.items || [],
          recipientBankName: parsed.recipientBankName || '',
          recipientBankAccount: parsed.recipientBankAccount || '',
          receiptPhotos: parsed.receiptPhotos || [],
          status: parsed.status || 'pending',
          notes: parsed.notes || ''
        };
      }
    } catch (e) {
      // Not JSON
    }
    return { type: 'expense', category: 'Lain-lain', subcategory: '', description: desc, companyBankAccountId: null, customSourceTarget: '', items: [], status: 'pending' };
  };

  const allParsedOtherExpenses = React.useMemo(() => {
    return (otherExpenses || []).map(e => {
      const parsed = parsePolymorphicDescription(e.description);
      return {
        ...e,
        ...parsed,
        rawDescription: e.description,
        description: parsed.description
      };
    });
  }, [otherExpenses]);

  const enrichedOtherTransactions = React.useMemo(() => {
    return allParsedOtherExpenses.filter(e => e.type !== 'reimbursement');
  }, [allParsedOtherExpenses]);

  const reimbursementsList = React.useMemo(() => {
    return allParsedOtherExpenses.filter(e => e.type === 'reimbursement');
  }, [allParsedOtherExpenses]);

  const existingCategories = React.useMemo(() => {
    const defaultCats = ['Gaji', 'Operasional', 'Bonus', 'Sewa', 'Lain-lain'];
    const customCats = new Set();
    enrichedOtherTransactions.forEach(t => {
      if (t.category && !defaultCats.includes(t.category)) {
        customCats.add(t.category);
      }
    });
    return [...defaultCats, ...customCats];
  }, [enrichedOtherTransactions]);

  const availableSubcategories = React.useMemo(() => {
    if (categoryFilter === 'all') return [];
    const subs = new Set();
    const defaults = defaultSubcategories[categoryFilter] || [];
    defaults.forEach(s => {
      subs.add(s.id);
    });
    enrichedOtherTransactions.forEach(t => {
      if (t.category === categoryFilter && t.subcategory) {
        subs.add(t.subcategory);
      }
    });
    return Array.from(subs);
  }, [categoryFilter, enrichedOtherTransactions]);

  React.useEffect(() => {
    setSubcategoryFilter('all');
  }, [categoryFilter]);

  const filteredOtherTransactions = React.useMemo(() => {
    return enrichedOtherTransactions
      .filter(t => filterByDate(t.expenseDate || t.date))
      .filter(t => {
        if (transactionTypeFilter === 'all') return true;
        return t.type === transactionTypeFilter;
      })
      .filter(t => {
        if (categoryFilter === 'all') return true;
        return t.category === categoryFilter;
      })
      .filter(t => {
        if (subcategoryFilter === 'all') return true;
        return t.subcategory === subcategoryFilter;
      })
      .filter(t => {
        const term = searchTerm.toLowerCase();
        return (t.employeeName || '').toLowerCase().includes(term) ||
               (t.description || '').toLowerCase().includes(term) ||
               (t.category || '').toLowerCase().includes(term);
      });
  }, [enrichedOtherTransactions, transactionTypeFilter, searchTerm, startDate, endDate, categoryFilter, subcategoryFilter]);

  const handleEditOtherTransaction = (transaction) => {
    const parsed = parsePolymorphicDescription(transaction.rawDescription || transaction.description);
    
    // Look up employeeId by name from database row if not serialized in JSON
    let employeeId = parsed.employeeId;
    if (!employeeId && transaction.employeeName && transaction.employeeName !== 'Umum') {
      const foundEmp = employees.find(emp => 
        emp.name && 
        emp.name.trim().toLowerCase() === transaction.employeeName.trim().toLowerCase()
      );
      if (foundEmp) {
        employeeId = foundEmp.id;
      }
    }

    const category = parsed.category || 'Lain-lain';
    const isExistingCategory = existingCategories.includes(category);
    const customCategory = !isExistingCategory ? category : '';

    const subcategory = parsed.subcategory || '';
    const defaultSubs = isExistingCategory ? (defaultSubcategories[category] || []).map(s => s.id) : [];
    const customSubs = [];
    if (category) {
      enrichedOtherTransactions.forEach(t => {
        if (t.category === category && t.subcategory && !defaultSubs.includes(t.subcategory) && !customSubs.includes(t.subcategory)) {
          customSubs.push(t.subcategory);
        }
      });
    }
    const allSubs = [...defaultSubs, ...customSubs];
    const isCustomSubcategory = subcategory && !allSubs.includes(subcategory);

    setOtherExpenseForm({
      ...transaction,
      type: parsed.type || 'expense',
      category: isExistingCategory ? category : 'CUSTOM',
      customCategory: customCategory,
      subcategory: isCustomSubcategory ? 'CUSTOM' : subcategory,
      customSubcategory: isCustomSubcategory ? subcategory : '',
      companyBankAccountId: parsed.companyBankAccountId || '',
      customSourceTarget: parsed.customSourceTarget || '',
      descriptionText: parsed.description || '',
      taxes: Array.isArray(transaction.taxes) ? transaction.taxes : [],
      employeeId: employeeId || ''
    });
    
    const hasEmployee = !!(employeeId || (transaction.employeeName && transaction.employeeName !== 'Umum'));
    setShowOptionalDetails(!!(hasEmployee || (transaction.bankAccount && transaction.bankAccount !== '-')));
    setOtherExpenseModal(true);
  };

  const handleNewOtherTransaction = (type = 'expense') => {
    setOtherExpenseForm({
      type,
      category: 'Lain-lain',
      customCategory: '',
      subcategory: '',
      customSubcategory: '',
      companyBankAccountId: '',
      customSourceTarget: '',
      employeeId: '',
      employeeName: '',
      position: '',
      bankAccount: '',
      bankName: '',
      amount: '',
      descriptionText: '',
      description: '',
      taxes: [],
      proofPhoto: '',
      expenseDate: new Date().toISOString().substring(0, 10)
    });
    setShowOptionalDetails(false);
    setOtherExpenseModal(true);
  };

  const handleSaveOtherTransaction = async () => {
    if (!canWrite) return;
    const finalCategory = otherExpenseForm.category === 'CUSTOM' ? otherExpenseForm.customCategory : otherExpenseForm.category;
    const finalSubcategory = otherExpenseForm.subcategory === 'CUSTOM' ? otherExpenseForm.customSubcategory : otherExpenseForm.subcategory;
    
    const existingRaw = otherExpenseForm.id ? (otherExpenses || []).find(e => e.id === otherExpenseForm.id) : null;
    let existingParsed = {};
    if (existingRaw && existingRaw.description && typeof existingRaw.description === 'string' && existingRaw.description.startsWith('{')) {
      try { existingParsed = JSON.parse(existingRaw.description); } catch(e){}
    }

    const isCostApp = existingParsed.type === 'cost_application' || otherExpenseForm.type === 'cost_application';

    const serializedDescription = JSON.stringify({
      ...existingParsed,
      type: isCostApp ? 'cost_application' : (otherExpenseForm.type || 'expense'),
      category: finalCategory || 'Lain-lain',
      subcategory: finalSubcategory || '',
      description: otherExpenseForm.descriptionText || '',
      employeeId: otherExpenseForm.employeeId || existingParsed.employeeId || null,
      companyBankAccountId: otherExpenseForm.companyBankAccountId || existingParsed.companyBankAccountId || null,
      customSourceTarget: otherExpenseForm.companyBankAccountId === 'CUSTOM' ? otherExpenseForm.customSourceTarget : (existingParsed.customSourceTarget || '')
    });

    const totalTaxes = (otherExpenseForm.taxes || []).reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
    const totalAfterTax = parseFloat(otherExpenseForm.amount || 0) - totalTaxes;

    const payload = {
      id: otherExpenseForm.id,
      employeeName: otherExpenseForm.employeeName || 'Umum',
      position: otherExpenseForm.position || 'Umum',
      bankAccount: otherExpenseForm.bankAccount || '-',
      bankName: otherExpenseForm.bankName || '-',
      amount: parseFloat(otherExpenseForm.amount || 0),
      description: serializedDescription,
      taxes: otherExpenseForm.taxes || [],
      proofPhoto: otherExpenseForm.proofPhoto || '',
      expenseDate: otherExpenseForm.expenseDate,
      totalAfterTax: totalAfterTax,
      date: otherExpenseForm.date || otherExpenseForm.expenseDate
    };

    try {
      if (otherExpenseForm.id) {
        await updateOtherExpense(otherExpenseForm.id, payload);
      } else {
        await addOtherExpense(payload);
      }
      setOtherExpenseModal(false);
    } catch (err) {
      toast.error('Gagal menyimpan transaksi: ' + err.message);
    }
  };

  const handleNewReimbursement = () => {
    setReimbursementForm({
      id: null,
      employeeId: '',
      employeeName: '',
      expenseDate: new Date().toISOString().substring(0, 10),
      items: [{ details: '', amount: '', receiptPhoto: '' }],
      recipientBankName: '',
      recipientBankAccount: '',
      companyBankAccountId: '',
      customSourceTarget: '',
      status: 'pending',
      notes: '',
      totalCost: 0,
      proofPhoto: ''
    });
    setReimbursementModal(true);
  };

  const handleEditReimbursement = (r) => {
    setReimbursementForm({
      id: r.id,
      employeeId: r.employeeId || '',
      employeeName: r.employeeName || '',
      expenseDate: r.expenseDate || r.date,
      items: Array.isArray(r.items) ? r.items : [],
      recipientBankName: r.recipientBankName || '',
      recipientBankAccount: r.recipientBankAccount || '',
      companyBankAccountId: r.companyBankAccountId || '',
      customSourceTarget: r.customSourceTarget || '',
      status: r.status || 'pending',
      notes: r.notes || '',
      totalCost: r.totalCost || r.amount || 0,
      proofPhoto: r.proofPhoto || ''
    });
    setReimbursementModal(true);
  };

  const handleSaveReimbursement = async () => {
    if (!canWrite) return;
    const totalAmount = reimbursementForm.items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const serializedDescription = JSON.stringify({
      type: 'reimbursement',
      items: reimbursementForm.items,
      recipientBankName: reimbursementForm.recipientBankName,
      recipientBankAccount: reimbursementForm.recipientBankAccount,
      companyBankAccountId: reimbursementForm.companyBankAccountId,
      customSourceTarget: reimbursementForm.companyBankAccountId === 'CUSTOM' ? reimbursementForm.customSourceTarget : '',
      status: reimbursementForm.status,
      notes: reimbursementForm.notes
    });

    const payload = {
      id: reimbursementForm.id,
      employeeName: reimbursementForm.employeeName || 'Staff',
      position: 'Staff',
      bankAccount: reimbursementForm.recipientBankAccount || '-',
      bankName: reimbursementForm.recipientBankName || '-',
      amount: totalAmount,
      description: serializedDescription,
      taxes: [],
      proofPhoto: reimbursementForm.proofPhoto || '',
      expenseDate: reimbursementForm.expenseDate,
      totalAfterTax: totalAmount,
      date: reimbursementForm.expenseDate
    };

    try {
      if (reimbursementForm.id) {
        await updateOtherExpense(reimbursementForm.id, payload);
      } else {
        await addOtherExpense(payload);
      }
      setReimbursementModal(false);
    } catch (err) {
      toast.error('Gagal menyimpan reimbursement: ' + err.message);
    }
  };

  const handleUpdateReimbursementStatus = async (r, newStatus) => {
    if (!canWrite) return;
    const serializedDescription = JSON.stringify({
      type: 'reimbursement',
      items: Array.isArray(r.items) ? r.items : [],
      recipientBankName: r.recipientBankName || '',
      recipientBankAccount: r.recipientBankAccount || '',
      companyBankAccountId: r.companyBankAccountId || '',
      customSourceTarget: r.customSourceTarget || '',
      status: newStatus,
      notes: r.notes || ''
    });
    
    // Create payload by overriding description
    const payload = {
      employeeName: r.employeeName,
      position: r.position,
      bankAccount: r.bankAccount,
      bankName: r.bankName,
      amount: r.amount,
      taxes: r.taxes,
      proofPhoto: r.proofPhoto,
      expenseDate: r.expenseDate,
      totalAfterTax: r.totalAfterTax,
      date: r.date,
      description: serializedDescription
    };
    try {
      await updateOtherExpense(r.id, payload);
    } catch (err) {
      toast.error('Gagal mengubah status: ' + err.message);
    }
  };

  const poMap = React.useMemo(() => {
    const map = {};
    (purchaseOrders || []).forEach(po => {
      if (!map[po.joId]) map[po.joId] = [];
      map[po.joId].push(po);
    });
    return map;
  }, [purchaseOrders]);

  const costAppMap = React.useMemo(() => {
    const map = {};
    (otherExpenses || []).forEach(e => {
      let parsed = {};
      if (e.description && typeof e.description === 'string' && e.description.startsWith('{')) {
        try { parsed = JSON.parse(e.description); } catch(err){}
      }
      if (parsed.type === 'cost_application' && parsed.joId) {
        const joIdStr = String(parsed.joId);
        if (!map[joIdStr]) map[joIdStr] = [];
        map[joIdStr].push({ ...e, ...parsed, amount: parseFloat(e.amount || 0), rawRecord: e });
      }
    });
    return map;
  }, [otherExpenses]);

  const invoiceMap = React.useMemo(() => {
    const map = {};
    (invoices || []).forEach(inv => {
      map[String(inv.joId)] = inv;
    });
    return map;
  }, [invoices]);

  const activeJOs = React.useMemo(() => {
    return jobOrders
      .filter(jo => jo.status !== 'pending')
      .filter(jo => filterByDate(jo.date))
      .filter(jo => {
        const id = jo.id || '';
        const name = jo.customerName || '';
        const term = searchTerm.toLowerCase();
        return id.toLowerCase().includes(term) || name.toLowerCase().includes(term);
      });
  }, [jobOrders, startDate, endDate, searchTerm]);

  const sortedActiveJOs = React.useMemo(() => {
    const getJoTimestamp = (jo) => {
      if (jo.id) {
        if (jo.id.startsWith('JO-')) {
          const tsStr = jo.id.substring(3);
          const ts = parseInt(tsStr, 10);
          if (!isNaN(ts) && ts > 1000000000000) {
            return ts;
          }
        } else {
          const parts = jo.id.split('.');
          if (parts.length === 3) {
            const seq = parseInt(parts[2], 10);
            if (!isNaN(seq)) {
              const d = jo.date ? new Date(jo.date).getTime() : 0;
              return d + seq;
            }
          }
        }
      }
      if (jo.date) {
        const d = new Date(jo.date).getTime();
        if (!isNaN(d)) return d;
      }
      return 0;
    };

    return [...activeJOs].sort((a, b) => {
      if (joSortBy === 'created_desc') {
        return getJoTimestamp(b) - getJoTimestamp(a) || (b.id || '').localeCompare(a.id || '');
      }
      if (joSortBy === 'created_asc') {
        return getJoTimestamp(a) - getJoTimestamp(b) || (a.id || '').localeCompare(b.id || '');
      }
      if (joSortBy === 'company_asc') {
        return (a.customerName || '').localeCompare(b.customerName || '');
      }
      if (joSortBy === 'company_desc') {
        return (b.customerName || '').localeCompare(a.customerName || '');
      }
      if (joSortBy === 'id_asc') {
        return (a.id || '').localeCompare(b.id || '');
      }
      if (joSortBy === 'id_desc') {
        return (b.id || '').localeCompare(a.id || '');
      }
      return 0;
    });
  }, [activeJOs, joSortBy]);

  const plFinancials = React.useMemo(() => {
    return activeJOs.reduce((acc, j) => {
      const manualCost = Array.isArray(j.costs) ? j.costs.reduce((a, c) => a + parseFloat(c.total || 0), 0) : 0;
      const poCost = (poMap[j.id] || []).reduce((a, p) => a + parseFloat(p.grandTotal || 0), 0);
      const costAppCost = (costAppMap[String(j.id)] || [])
        .filter(ca => ca.status !== 'rejected')
        .reduce((a, ca) => a + (parseFloat(ca.amount) || 0), 0);
      const cost = manualCost + poCost + costAppCost;
      const inv = invoiceMap[String(j.id)];
      const rev = inv ? parseFloat(inv.amount || inv.subtotal || 0) : 0;
      return { cost: acc.cost + cost, revenue: acc.revenue + rev };
    }, { cost: 0, revenue: 0 });
  }, [activeJOs, poMap, costAppMap, invoiceMap]);

  const joInvoiceMap = React.useMemo(() => {
    const map = {};
    (invoices || []).forEach(inv => {
      if (inv.joId) {
        map[String(inv.joId)] = inv;
      }
      let consolidated = inv.consolidatedJOs;
      if (typeof consolidated === 'string') {
        try {
          consolidated = JSON.parse(consolidated);
        } catch (e) {
          consolidated = null;
        }
      }
      if (Array.isArray(consolidated)) {
        consolidated.forEach(id => {
          map[String(id)] = inv;
        });
      }
    });
    return map;
  }, [invoices]);

  const groupedPLData = React.useMemo(() => {
    const groups = {};
    sortedActiveJOs.forEach(jo => {
      const invoice = joInvoiceMap[String(jo.id)];
      let groupKey = '';
      let groupType = 'single';
      let groupName = '';

      if (jo.quotationId) {
        groupKey = `q_${jo.quotationId}`;
        groupType = 'quotation';
        groupName = jo.quotationId;
      } else if (invoice) {
        groupKey = `i_${invoice.id}`;
        groupType = 'invoice';
        groupName = invoice.id;
      } else {
        groupKey = `jo_${jo.id}`;
        groupType = 'single';
        groupName = jo.id;
      }

      if (!groups[groupKey]) {
        groups[groupKey] = {
          key: groupKey,
          type: groupType,
          name: groupName,
          customerName: jo.customerName || 'Direct Customer',
          jobOrders: [],
          invoice: invoice || null,
        };
      }
      groups[groupKey].jobOrders.push(jo);
    });
    return Object.values(groups);
  }, [sortedActiveJOs, joInvoiceMap]);

  const plGroupFinancials = React.useMemo(() => {
    const financials = {};
    groupedPLData.forEach(group => {
      let groupCost = 0;
      let groupRevenue = 0;
      const uniqueInvoices = new Set();

      group.jobOrders.forEach(jo => {
        const manualCost = Array.isArray(jo.costs) ? jo.costs.reduce((s, c) => s + parseFloat(c.total || 0), 0) : 0;
        const poCost = (poMap[jo.id] || []).reduce((s, p) => s + parseFloat(p.grandTotal || 0), 0);
        const costAppCost = (costAppMap[String(jo.id)] || [])
          .filter(ca => ca.status !== 'rejected')
          .reduce((a, ca) => a + (parseFloat(ca.amount) || 0), 0);
        groupCost += (manualCost + poCost + costAppCost);

        const invoice = joInvoiceMap[String(jo.id)];
        if (invoice && !uniqueInvoices.has(invoice.id)) {
          uniqueInvoices.add(invoice.id);
          groupRevenue += parseFloat(invoice.amount || invoice.subtotal || 0);
        }
      });

      financials[group.key] = {
        cost: groupCost,
        revenue: groupRevenue,
        profitLoss: groupRevenue - groupCost
      };
    });
    return financials;
  }, [groupedPLData, poMap, costAppMap, joInvoiceMap]);

  const vendorList = vendors || [];

  const addCostLine = () => setCostLines(prev => [...prev, { vendorId: '', serviceIdx: '', qty: 1, customVendorName: '', customServiceDescription: '', customPrice: '', targetItemIdx: '' }]);
  const removeCostLine = (i) => setCostLines(prev => prev.filter((_, idx) => idx !== i));
  const updateCostLine = (i, field, val) => setCostLines(prev => {
    const n = [...prev];
    n[i] = { ...n[i], [field]: val };
    if (field === 'vendorId') {
      n[i].serviceIdx = '';
      n[i].customVendorName = '';
      n[i].customServiceDescription = '';
      n[i].customPrice = '';
    }
    if (field === 'serviceIdx') {
      n[i].customServiceDescription = '';
      n[i].customPrice = '';
    }
    return n;
  });

  // PO Helpers
  const addPOItem = () => setPoItems(p => [...p, { serviceIdx: '', qty: 1 }]);
  const removePOItem = (i) => setPoItems(p => p.filter((_, idx) => idx !== i));
  const updatePOItem = (i, field, val) => setPoItems(p => { const n=[...p]; n[i]={...n[i],[field]:val}; return n; });

  const buildPOPayload = () => {
    const jo = jobOrders.find(j => j.id === poJoId);
    if (!jo) { toast.error('Job Order tidak ditemukan.'); return null; }
    const vendor = vendorList.find(v => v.id === poVendorId);
    if (!vendor) { toast.error('Vendor tidak ditemukan.'); return null; }

    const items = poItems
      .filter(it => it.serviceIdx !== '')
      .map(it => {
        const svc = vendor.services[parseInt(it.serviceIdx)];
        const qty = parseFloat(it.qty) || 1;
        return {
          serviceDescription: svc.description,
          unitPrice: parseFloat(svc.price || 0),
          qty,
          total: parseFloat(svc.price || 0) * qty
        };
      });

    if (items.length === 0) { toast('Pilih minimal satu layanan vendor.'); return null; }

    return {
      joId: jo.id,
      customerName: jo.customerName,
      jobInstruction: jo.jobDescription || jo.instruction || '-',
      vendorId: vendor.id,
      vendorName: vendor.name,
      items,
      grandTotal: items.reduce((s, it) => s + it.total, 0),
      notes: poNotes
    };
  };

  const resetPOForm = () => {
    setShowPOModal(false);
    setPoJoId('');
    setPoVendorId('');
    setPoItems([{ serviceIdx: '', qty: 1 }]);
    setPoNotes('');
  };

  const handleSavePODraft = async () => {
    if (!canWrite) return;
    try {
      const payload = buildPOPayload();
      if (!payload) return;
      await context.createPurchaseOrder({ ...payload, status: 'draft' });
      resetPOForm();
    } catch (err) {
      toast.error('Gagal menyimpan draft: ' + err.message);
    }
  };

  const handleIssuePO = async () => {
    if (!canWrite) return;
    try {
      const payload = buildPOPayload();
      if (!payload) return;
      const newPO = await context.createPurchaseOrder({ ...payload, status: 'issued' });
      resetPOForm();
      setPrintPO({ ...newPO, status: 'issued' });
      setActiveTab('hutang');
      setPayableSubTab('outstanding');
    } catch (err) {
      toast.error('Gagal menerbitkan Purchase Order: ' + err.message);
    }
  };

  const handleUploadVendorInvoice = async (poId, photos) => {
    if (!canWrite) return;
    await updatePurchaseOrder(poId, { vendorInvoicePhoto: photos });
    setVendorInvoiceModal(null);
    setModalPhotos([]);
  };

  const handleSettlePayable = async (poId, data) => {
    if (!canWrite) return;
    if (!data.paymentProofPhoto || data.paymentProofPhoto.length === 0) {
      const confirmed = await confirm(
        isID 
          ? "Anda belum melampirkan Bukti Bayar. Lanjutkan proses pelunasan tanpa bukti?" 
          : "You haven't attached payment proof. Proceed with settlement without proof?",
        {
          title: isID ? "Konfirmasi Pelunasan" : "Confirm Settlement",
          confirmText: isID ? "Lanjutkan" : "Proceed",
          cancelText: isID ? "Batal" : "Cancel"
        }
      );
      if (!confirmed) return;
    }
    const paidDate = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    
    // Full payload including all tax data
    const cleanData = {
      ...data,
      tax_amount: parseFloat(data.tax_amount) || 0,
      status: 'paid',
      paidDate
    };

    try {
      console.log("Settling PO with data:", cleanData);
      await updatePurchaseOrder(poId, cleanData);
      setSettlePayableModal(null);
      setPaymentProofModal(null); 
      setModalPhotos([]);
    } catch (err) {
      console.error("Primary settlement failed, trying fallback...", err);
      
      // Fallback: save only the safe columns to DB (in case tax columns don't exist yet)
      if (err.message.includes('column') || err.message.includes('400') || err.message.includes('500')) {
        try {
          const taxInfo = `[TAX_INFO] Name: ${data.tax_name || '-'}, Amount: ${data.tax_amount || 0}`;
          const fallbackDbData = {
            paymentProofPhoto: data.paymentProofPhoto,
            status: 'paid',
            paidDate,
            notes: (settlePayableModal.notes || '') + '\n' + taxInfo
            // We omit tax_name, tax_amount, tax_proof_photo as DB columns may not exist
          };
          
          await updatePurchaseOrder(poId, fallbackDbData);

          // Also update local state with tax data so View (Full Doc) shows tax photos.
          // patchPurchaseOrderLocal only updates React state without calling the API.
          patchPurchaseOrderLocal?.(poId, {
            tax_name: data.tax_name,
            tax_amount: parseFloat(data.tax_amount) || 0,
            tax_proof_photo: data.tax_proof_photo,
          });

          toast.success("Pembayaran berhasil disimpan. Catatan: Kolom pajak belum ada di database — jalankan migrasi 'add_tax_columns_po.cjs' untuk menyimpan permanen.");
          setSettlePayableModal(null);
          setPaymentProofModal(null);
          setModalPhotos([]);
          return;
        } catch (fallbackErr) {
          toast.error("Gagal memproses pembayaran: " + fallbackErr.message);
        }
      } else {
        toast.error("Gagal memproses pembayaran: " + err.message);
      }
    }
  };

  const downloadPhotos = (photos, prefix) => {
    if (!photos || photos.length === 0) return;
    photos.forEach((photo, idx) => {
      const link = document.createElement('a');
      link.href = photo;
      link.download = `${prefix}_${idx + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const handleExport = () => {
    let dataToExport = [];
    let fileName = "";

    if (activeTab === 'costing') {
      dataToExport = activeJOs.map(jo => {
        const manualCost = Array.isArray(jo.costs) ? jo.costs.reduce((s,c)=>s+(c.total||0),0) : 0;
        const poCost = (purchaseOrders || []).filter(po => po.joId === jo.id).reduce((s,p)=>s+(p.grandTotal||0),0);
        const costAppCost = (costAppMap[String(jo.id)] || [])
          .filter(ca => ca.status !== 'rejected')
          .reduce((s, ca) => s + (parseFloat(ca.amount) || 0), 0);
        const totalCost = manualCost + poCost + costAppCost;
        const invoice = (invoices || []).find(inv => inv.joId === jo.id);
        const revenue = invoice ? parseFloat(invoice.amount || invoice.subtotal || 0) : 0;
        
        return {
          JO_ID: jo.id,
          Date: jo.date,
          Customer: jo.customerName,
          Status: jo.status,
          Revenue_Inv: revenue,
          Total_Biaya: totalCost,
          Profit_Loss: revenue - totalCost
        };
      });
      fileName = "JO_Records_Financial";
    } else if (activeTab === 'billing') {
      // For billing, we can export issued invoices as primary
      dataToExport = invoices
        .filter(inv => filterByDate(inv.date))
        .filter(inv => {
          const id = inv.id || '';
          const name = inv.customerName || '';
          const term = searchTerm.toLowerCase();
          const associatedJOs = getAssociatedJOs(inv);
          const containerMatch = associatedJOs.some(jo => {
            if (Array.isArray(jo.containerNo)) {
              return jo.containerNo.some(c => c && c.toLowerCase().includes(term));
            }
            return jo.containerNo && jo.containerNo.toLowerCase().includes(term);
          }) || (Array.isArray(inv.items) && inv.items.some(item => {
            if (Array.isArray(item.containerNo)) {
              return item.containerNo.some(c => c && c.toLowerCase().includes(term));
            }
            return item.containerNo && String(item.containerNo).toLowerCase().includes(term);
          }));
          return id.toLowerCase().includes(term) || name.toLowerCase().includes(term) || containerMatch;
        })
        .map(inv => {
          const associatedJOs = getAssociatedJOs(inv);
          const containerNumbers = getAggregatedContainers(associatedJOs, inv).join(', ');
          return {
            Invoice_ID: inv.id,
            JO_ID: inv.joId,
            Container_No: containerNumbers,
            Date: inv.date,
            Customer: inv.customerName,
            Subtotal: inv.subtotal,
            Tax: inv.tax,
            Total_Amount: inv.amount,
            Status: inv.status
          };
        });
      fileName = "Issued_Invoices_Report";
    } else if (activeTab === 'piutang') {
      const source = receivableSubTab === 'outstanding' ? receivables : paidInvoices;
      dataToExport = source
        .filter(item => filterByDate(item.date))
        .filter(item => item.id.toLowerCase().includes(searchTerm.toLowerCase()) || item.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
        .map(item => ({
          Invoice_ID: item.id,
          Date: item.date,
          Customer: item.customerName,
          Amount: item.amount,
          Balance: item.balance || 0,
          Status: item.status
        }));
      fileName = receivableSubTab === 'outstanding' ? "Accounts_Receivable_Ledger" : "Invoice_Lunas_Archive";
    } else if (activeTab === 'outstanding_summary') {
      const summary = Object.values(receivables.reduce((acc, r) => {
        if (!acc[r.customerName]) acc[r.customerName] = { Customer: r.customerName, Total_Outstanding: 0, Total_Invoices: 0 };
        acc[r.customerName].Total_Outstanding += (r.balance || r.amount);
        acc[r.customerName].Total_Invoices += 1;
        return acc;
      }, {}));
      dataToExport = summary;
      fileName = "Outstanding_Receivables_By_Customer";
    } else if (activeTab === 'other_expenses') {
      dataToExport = (filteredOtherTransactions || []).map(t => {
        const taxDeduction = Array.isArray(t.taxes) && t.taxes.length > 0
          ? t.taxes.reduce((acc, x) => acc + parseFloat(x.amount || 0), 0)
          : 0;

        let sourceOrTarget = '-';
        if (t.companyBankAccountId === 'CUSTOM' && t.customSourceTarget) {
          sourceOrTarget = t.customSourceTarget;
        } else if (t.companyBankAccountId) {
          const companyBank = (companyBankAccounts || []).find(b => b.id === t.companyBankAccountId);
          if (companyBank) {
            sourceOrTarget = `${companyBank.bankName} (${companyBank.accountNumber})`;
          }
        }

        return {
          ID: t.id,
          Type: t.type === 'income' ? (isID ? 'Pendapatan' : 'Income') : (isID ? 'Pengeluaran' : 'Expense'),
          Description: t.description || '-',
          Employee: t.employeeName || '-',
          Category: t.category || '-',
          Subcategory: t.subcategory || '-',
          Account_Recipient: t.bankName && t.bankName !== '-' ? `${t.bankName} (${t.bankAccount || ''})` : '-',
          Source_Target_Account: sourceOrTarget,
          Date: t.expenseDate || t.date || '-',
          Amount: parseFloat(t.amount || 0),
          Tax_Deduction: taxDeduction,
          Total: parseFloat(t.totalAfterTax || t.amount || 0)
        };
      });
      fileName = "Other_Income_Expenses_Report";
    } else if (activeTab === 'salary') {
      dataToExport = (salaries || [])
        .filter(s => filterByDate(s.expenseDate || s.date))
        .filter(s => (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
        .map(s => {
          const taxSum = Array.isArray(s.taxes) ? s.taxes.reduce((acc, x) => acc + parseFloat(x.amount || 0), 0) : 0;
          const base = parseFloat(s.baseSalary || 0);
          return {
            ID: s.id,
            Name: s.name,
            Position: s.position || '-',
            Period: s.period || '-',
            Bank: `${s.bankName || ''} ${s.bankAccount || ''}`.trim() || '-',
            Base_Salary: base,
            Tax_Deduction: taxSum,
            Total_Paid: base - taxSum,
            Date: s.expenseDate || s.date || '-'
          };
        });
      fileName = "Payroll_Salary_Report";
    } else if (activeTab === 'reimbursements') {
      dataToExport = (reimbursementsList || [])
        .filter(r => filterByDate(r.expenseDate || r.date))
        .filter(r => (r.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase()) || (r.description || '').toLowerCase().includes(searchTerm.toLowerCase()))
        .map(r => ({
          ID: r.id,
          Staff_Name: r.employeeName || '-',
          Description: r.description || '-',
          Category: r.category || '-',
          Bank_Account: r.bankName && r.bankName !== '-' ? `${r.bankName} (${r.bankAccount || ''})` : '-',
          Amount: parseFloat(r.amount || 0),
          Date: r.expenseDate || r.date || '-'
        }));
      fileName = "Staff_Reimbursements_Report";
    } else if (activeTab === 'hutang') {
      dataToExport = (purchaseOrders || [])
        .filter(po => filterByDate(po.date))
        .filter(po => (po.id || '').toLowerCase().includes(searchTerm.toLowerCase()) || (po.vendorName || '').toLowerCase().includes(searchTerm.toLowerCase()))
        .map(po => ({
          PO_ID: po.id,
          JO_ID: po.joId || '-',
          Vendor: po.vendorName || '-',
          Date: po.date || '-',
          Grand_Total: parseFloat(po.grandTotal || po.amount || 0),
          Status: po.status || '-'
        }));
      fileName = "Accounts_Payables_Ledger";
    }

    if (dataToExport.length === 0) {
      toast("Tidak ada data untuk di-export pada rentang tanggal ini.");
      return;
    }

    exportToExcel(dataToExport, fileName);
  };

  const handleSaveCosts = async () => {
    if (!costModal) return;
    
    // Validate custom fields
    for (const l of costLines) {
      if (l.vendorId === 'custom') {
        if (!l.customVendorName?.trim() || !l.customServiceDescription?.trim() || l.customPrice === '') {
          toast(isID ? "Harap lengkapi semua field input manual untuk Vendor Custom!" : "Please fill in all manual input fields for the Custom Vendor!");
          return;
        }
      } else if (l.vendorId) {
        if (l.serviceIdx === 'custom') {
          if (!l.customServiceDescription?.trim() || l.customPrice === '') {
            toast(isID ? "Harap lengkapi semua field input manual untuk Layanan Custom!" : "Please fill in all manual input fields for the Custom Service!");
            return;
          }
        } else if (l.serviceIdx === '') {
          toast(isID ? "Harap pilih layanan atau pilih 'Custom Layanan'!" : "Please select a service or select 'Custom Service'!");
          return;
        }
      } else {
        toast(isID ? "Harap pilih vendor terlebih dahulu!" : "Please select a vendor first!");
        return;
      }
    }

    const newEntries = costLines
      .map(l => {
        const qty = parseFloat(l.qty) || 1;
        const targetItemIdx = l.targetItemIdx !== undefined && l.targetItemIdx !== '' ? parseInt(l.targetItemIdx, 10) : null;
        if (l.vendorId === 'custom') {
          const unitPrice = parseFloat(l.customPrice) || 0;
          return {
            vendorId: 'custom',
            vendorName: l.customVendorName || 'Custom Vendor',
            serviceDescription: l.customServiceDescription || 'Custom Service',
            unitPrice,
            qty,
            total: unitPrice * qty,
            targetItemIdx
          };
        } else {
          const vendor = vendorList.find(v => v.id === l.vendorId);
          if (l.serviceIdx === 'custom') {
            const unitPrice = parseFloat(l.customPrice) || 0;
            return {
              vendorId: l.vendorId,
              vendorName: vendor?.name || '',
              serviceDescription: l.customServiceDescription || 'Custom Service',
              unitPrice,
              qty,
              total: unitPrice * qty,
              targetItemIdx
            };
          } else {
            const svc = vendor?.services?.[parseInt(l.serviceIdx)];
            const unitPrice = parseFloat(svc?.price || 0);
            return {
              vendorId: l.vendorId,
              vendorName: vendor?.name || '',
              serviceDescription: svc?.description || '',
              unitPrice,
              qty,
              total: unitPrice * qty,
              targetItemIdx
            };
          }
        }
      });
    const existingCosts = Array.isArray(costModal.costs) ? costModal.costs : [];
    await updateJOStatus(costModal.id, { costs: [...existingCosts, ...newEntries] });
    setCostModal(null);
    setCostLines([{ vendorId: '', serviceIdx: '', qty: 1, customVendorName: '', customServiceDescription: '', customPrice: '', targetItemIdx: '' }]);
  };

  const handleDeleteCost = async (jo, costIdx) => {
    const updatedCosts = jo.costs.filter((_, i) => i !== costIdx);
    await updateJOStatus(jo.id, { costs: updatedCosts });
    setCostModal(prev => prev ? { ...prev, costs: updatedCosts } : null);
  };

  const handleDeletePOFromModal = async (po) => {
    if (!canWrite) return;
    const isPaid = po.status === 'paid';
    const msg = isPaid 
      ? (isID 
          ? `Purchase Order ${po.id} berstatus LUNAS/PAID. Yakin ingin menghapus PO ini dari sistem dan JO? Tindakan ini tidak dapat dibatalkan.` 
          : `Purchase Order ${po.id} is marked as PAID. Are you sure you want to delete this PO from the system and JO? This action cannot be undone.`)
      : (isID 
          ? `Hapus Purchase Order ${po.id} (${po.vendorName}) dari sistem dan Job Order ini?` 
          : `Delete Purchase Order ${po.id} (${po.vendorName}) from the system and this Job Order?`);

    const confirmed = await confirm(msg, {
      title: isID ? "Hapus Purchase Order" : "Delete Purchase Order",
      confirmText: isID ? "Hapus" : "Delete",
      cancelText: isID ? "Batal" : "Cancel",
      isDanger: true
    });

    if (confirmed) {
      try {
        await deletePurchaseOrder(po.id);
        toast.success(isID ? `PO ${po.id} berhasil dihapus` : `PO ${po.id} successfully deleted`);
      } catch (err) {
        toast.error((isID ? "Gagal menghapus PO: " : "Failed to delete PO: ") + err.message);
      }
    }
  };

  const handleUnlinkPOFromModal = async (po) => {
    if (!canWrite || !costModal) return;
    const confirmed = await confirm(
      isID 
        ? `Lepas kaitan PO ${po.id} dari JO ${costModal.id}? PO akan tetap tersimpan di modul Hutang tanpa terhubung ke JO ini.` 
        : `Unlink PO ${po.id} from JO ${costModal.id}? The PO will remain in Payables without being tied to this JO.`,
      {
        title: isID ? "Lepas Kaitan PO" : "Unlink PO",
        confirmText: isID ? "Lepas Kaitan" : "Unlink",
        cancelText: isID ? "Batal" : "Cancel"
      }
    );

    if (confirmed) {
      try {
        await updatePurchaseOrder(po.id, { joId: '-' });
        toast.success(isID ? `Kaitan PO ${po.id} dilepas dari JO` : `PO ${po.id} unlinked from JO`);
      } catch (err) {
        toast.error((isID ? "Gagal melepas kaitan PO: " : "Failed to unlink PO: ") + err.message);
      }
    }
  };

  const handleRejectCostAppFromModal = async (ca) => {
    if (!canWrite) return;
    const confirmed = await confirm(
      isID 
        ? `Tolak pengajuan biaya ${ca.id} (${ca.employeeName || ca.requestedBy})? Biaya ini tidak akan dihitung lagi dalam Laba/Rugi JO.` 
        : `Reject cost application ${ca.id} (${ca.employeeName || ca.requestedBy})? This cost will no longer be counted towards JO Profit/Loss.`,
      {
        title: isID ? "Tolak Pengajuan Biaya" : "Reject Cost Application",
        confirmText: isID ? "Tolak" : "Reject",
        cancelText: isID ? "Batal" : "Cancel",
        isDanger: true
      }
    );

    if (confirmed) {
      try {
        let parsed = {};
        const rawDesc = ca.rawDescription || (ca.rawRecord && ca.rawRecord.description) || ca.description || '';
        if (typeof rawDesc === 'string' && rawDesc.startsWith('{')) {
          try { parsed = JSON.parse(rawDesc); } catch (e) {}
        }
        const updatedDescription = JSON.stringify({
          ...parsed,
          type: 'cost_application',
          status: 'rejected'
        });
        await updateOtherExpense(ca.id, {
          ...(ca.rawRecord || {}),
          description: updatedDescription
        });
        toast.success(isID ? `Pengajuan ${ca.id} berhasil ditolak` : `Application ${ca.id} rejected`);
      } catch (err) {
        toast.error((isID ? "Gagal menolak pengajuan: " : "Failed to reject application: ") + err.message);
      }
    }
  };

  const handleUnlinkCostAppFromModal = async (ca) => {
    if (!canWrite || !costModal) return;
    const confirmed = await confirm(
      isID 
        ? `Lepas kaitan pengajuan biaya ${ca.id} dari JO ${costModal.id}? Pengajuan akan tetap tersimpan sebagai pengeluaran operasional umum.` 
        : `Unlink cost application ${ca.id} from JO ${costModal.id}? The application will remain as a general operational expense.`,
      {
        title: isID ? "Lepas Kaitan Pengajuan" : "Unlink Cost Application",
        confirmText: isID ? "Lepas Kaitan" : "Unlink",
        cancelText: isID ? "Batal" : "Cancel"
      }
    );

    if (confirmed) {
      try {
        let parsed = {};
        const rawDesc = ca.rawDescription || (ca.rawRecord && ca.rawRecord.description) || ca.description || '';
        if (typeof rawDesc === 'string' && rawDesc.startsWith('{')) {
          try { parsed = JSON.parse(rawDesc); } catch (e) {}
        }
        const updatedDescription = JSON.stringify({
          ...parsed,
          type: 'cost_application',
          costType: 'general',
          joId: null
        });
        await updateOtherExpense(ca.id, {
          ...(ca.rawRecord || {}),
          description: updatedDescription
        });
        toast.success(isID ? `Pengajuan ${ca.id} dilepas dari JO` : `Application ${ca.id} unlinked from JO`);
      } catch (err) {
        toast.error((isID ? "Gagal melepas kaitan: " : "Failed to unlink application: ") + err.message);
      }
    }
  };

  const handleDeleteCostAppFromModal = async (ca) => {
    if (!canWrite) return;
    const confirmed = await confirm(
      isID 
        ? `Hapus permanen pengajuan biaya ${ca.id} (${ca.employeeName || ca.requestedBy}) dari sistem?` 
        : `Permanently delete cost application ${ca.id} (${ca.employeeName || ca.requestedBy}) from the system?`,
      {
        title: isID ? "Hapus Pengajuan Biaya" : "Delete Cost Application",
        confirmText: isID ? "Hapus" : "Delete",
        cancelText: isID ? "Batal" : "Cancel",
        isDanger: true
      }
    );

    if (confirmed) {
      try {
        await deleteOtherExpense(ca.id);
        toast.success(isID ? `Pengajuan ${ca.id} berhasil dihapus` : `Application ${ca.id} successfully deleted`);
      } catch (err) {
        toast.error((isID ? "Gagal menghapus pengajuan: " : "Failed to delete application: ") + err.message);
      }
    }
  };


  if (!context) return null;
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--secondary)' }}>Loading Accounting Module...</div>;
  }


  const getJoTimestamp = (jo) => {
    if (jo.id) {
      if (jo.id.startsWith('JO-')) {
        const tsStr = jo.id.substring(3);
        const ts = parseInt(tsStr, 10);
        if (!isNaN(ts) && ts > 1000000000000) {
          return ts;
        }
      } else {
        const parts = jo.id.split('.');
        if (parts.length === 3) {
          const seq = parseInt(parts[2], 10);
          if (!isNaN(seq)) {
            const d = jo.date ? new Date(jo.date).getTime() : 0;
            return d + seq;
          }
        }
      }
    }
    if (jo.date) {
      const d = new Date(jo.date).getTime();
      if (!isNaN(d)) return d;
    }
    return 0;
  };

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
      if (joSortBy === 'created_desc') {
        return getJoTimestamp(b) - getJoTimestamp(a) || (b.id || '').localeCompare(a.id || '');
      }
      if (joSortBy === 'created_asc') {
        return getJoTimestamp(a) - getJoTimestamp(b) || (a.id || '').localeCompare(b.id || '');
      }
      if (joSortBy === 'company_asc') {
        return (a.customerName || '').localeCompare(b.customerName || '');
      }
      if (joSortBy === 'company_desc') {
        return (b.customerName || '').localeCompare(a.customerName || '');
      }
      if (joSortBy === 'id_asc') {
        return (a.id || '').localeCompare(b.id || '');
      }
      if (joSortBy === 'id_desc') {
        return (b.id || '').localeCompare(a.id || '');
      }
      return 0;
    });

  const handleShipmentChange = (joId, field, value) => {
    setShipmentEdits(prev => {
      const joEdits = prev[joId] || {};
      const jo = jobOrders.find(j => j.id === joId) || {};
      return {
        ...prev,
        [joId]: {
          shipmentStatus: joEdits.shipmentStatus !== undefined ? joEdits.shipmentStatus : (jo.shipmentStatus || ''),
          etd: joEdits.etd !== undefined ? joEdits.etd : (jo.etd || ''),
          eta: joEdits.eta !== undefined ? joEdits.eta : (jo.eta || ''),
          [field]: value
        }
      };
    });
  };

  const hasShipmentChanges = (joId) => {
    const edits = shipmentEdits[joId];
    if (!edits) return false;
    const jo = jobOrders.find(j => j.id === joId) || {};
    return (
      (edits.shipmentStatus !== (jo.shipmentStatus || '')) ||
      (edits.etd !== (jo.etd || '')) ||
      (edits.eta !== (jo.eta || ''))
    );
  };

  const handleSaveShipment = async (joId) => {
    const edits = shipmentEdits[joId];
    if (!edits) return;
    
    setSavingShipment(prev => ({ ...prev, [joId]: true }));
    try {
      await updateJOStatus(joId, {
        shipmentStatus: edits.shipmentStatus || null,
        etd: edits.etd || null,
        eta: edits.eta || null
      });
      toast.success(isID ? 'Status pengiriman berhasil diperbarui' : 'Shipment status updated successfully');
      setShipmentEdits(prev => {
        const copy = { ...prev };
        delete copy[joId];
        return copy;
      });
    } catch (err) {
      console.error(err);
      toast.error(isID ? 'Gagal memperbarui status pengiriman' : 'Failed to update shipment status');
    } finally {
      setSavingShipment(prev => ({ ...prev, [joId]: false }));
    }
  };

  const paidInvoices = invoices
    .filter(inv => inv.status === 'paid')
    .filter(inv => filterByDate(inv.date))
    .filter(inv => {
      const id = inv.id || '';
      const name = inv.customerName || '';
      const term = searchTerm.toLowerCase();
      return id.toLowerCase().includes(term) || name.toLowerCase().includes(term);
    });
  
  const handleIssueInvoice = async (joId, bankAccount, notes) => {
    try {
      const linkedJO = jobOrders.find(j => String(j.id) === String(joId));
      if (!linkedJO) {
        toast.error('Job Order tidak ditemukan.');
        return;
      }

      if (linkedJO.shipmentStatus !== 'done') {
        toast.error(isID 
          ? 'Invoice hanya dapat diterbitkan untuk Job Order dengan status pengiriman Selesai / Done.' 
          : 'Invoices can only be issued for Job Orders with a shipment status of Done.');
        return;
      }

      if (!bankAccount) {
        setIssuingInvoiceJoId(joId);
        setInvoiceNotes('');
        if (companyBankAccounts.length > 0) {
          setSelectedBankId(companyBankAccounts[0].id);
        }
        return;
      }

      

      const linkedQuo = linkedJO.quotationId
        ? quotations.find(q => String(q.id) === String(linkedJO.quotationId))
        : null;

      // Collect all consolidated JOs (same quotation + customerName + done status)
      let targetJOs = [linkedJO];
      if (linkedJO.quotationId) {
        targetJOs = jobOrders.filter(j =>
          String(j.quotationId) === String(linkedJO.quotationId) &&
          (j.status === 'done' || String(j.id) === String(joId)) &&
          j.customerName === linkedJO.customerName
        );
      }

      // Build line items from quotation items matched to each JO description
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
          // Multi-item job order
          targetJo.items.forEach(item => {
            if (item.status === 'done' || String(targetJo.id) === String(joId)) {
              const qty = cleanNum(item.issueQuantity || item.quantity || 1);
              const rate = cleanNum(item.rate);
              const itemContainers = Array.isArray(item.containerNo) ? item.containerNo.filter(Boolean) : (item.containerNo ? [item.containerNo] : []);
              const parentContainers = Array.isArray(targetJo.containerNo) ? targetJo.containerNo.filter(Boolean) : (targetJo.containerNo ? [targetJo.containerNo] : []);
              const containerNo = itemContainers.length > 0 ? itemContainers : parentContainers;

              const itemVehicles = Array.isArray(item.vehicleNo) ? item.vehicleNo.filter(Boolean) : (item.vehicleNo ? [item.vehicleNo] : []);
              const parentVehicles = Array.isArray(targetJo.vehicleNo) ? targetJo.vehicleNo.filter(Boolean) : (targetJo.vehicleNo ? [targetJo.vehicleNo] : []);
              const vehicleNo = itemVehicles.length > 0 ? itemVehicles : parentVehicles;

              const itemDrivers = Array.isArray(item.driverName) ? item.driverName.filter(Boolean) : (item.driverName ? [item.driverName] : []);
              const parentDrivers = Array.isArray(targetJo.driverName) ? targetJo.driverName.filter(Boolean) : (targetJo.driverName ? [targetJo.driverName] : []);
              const driverName = itemDrivers.length > 0 ? itemDrivers : parentDrivers;

              items.push({
                description: item.description || 'Freight Forwarding Services',
                qty,
                rate,
                containerNo,
                vehicleNo,
                driverName
              });
            }
          });
        } else {
          // Legacy single-item job order
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
            containerNo: Array.isArray(targetJo.containerNo) ? targetJo.containerNo : (targetJo.containerNo ? [targetJo.containerNo] : []),
            vehicleNo: Array.isArray(targetJo.vehicleNo) ? targetJo.vehicleNo : (targetJo.vehicleNo ? [targetJo.vehicleNo] : []),
            driverName: Array.isArray(targetJo.driverName) ? targetJo.driverName : (targetJo.driverName ? [targetJo.driverName] : [])
          });
        }
      });

      let suggestedInvoiceId = '';
      try {
        const nextRes = await apiRequest('invoices/next-number');
        if (nextRes && nextRes.nextInvoiceId) {
          suggestedInvoiceId = nextRes.nextInvoiceId;
        }
      } catch (err) {
        console.error('Failed to fetch next invoice ID:', err);
      }

      setInvoiceConfirmData({
        joId,
        bankAccount,
        consolidatedJOIds: targetJOs.map(j => j.id),
        linkedJOs: targetJOs,
        form: {
          id: suggestedInvoiceId,
          customerName: linkedJO.customerName || '',
          customerAddress: linkedQuo?.companyAddress || linkedJO?.address || customers.find(c => c.name === (linkedJO?.customerName || ''))?.address || '',
          customerPic: linkedQuo?.pic || '',
          customerPhone: linkedQuo?.phone || '',
          customerEmail: linkedQuo?.email || '',
          date: new Date().toISOString().substring(0, 10),
          items,
          extraCharges: targetJOs.reduce((acc, jo) => {
            if (jo.extra_charges && Array.isArray(jo.extra_charges)) {
              jo.extra_charges.forEach(ec => {
                acc.push({
                  description: ec.description || '',
                  qty: parseFloat(ec.qty) || 1,
                  rate: parseFloat(ec.rate || ec.amount || 0)
                });
              });
            }
            return acc;
          }, []),
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

      // Calculate totals from form
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
          containerNo: line.containerNo || [],
          vehicleNo: line.vehicleNo || [],
          driverName: line.driverName || []
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

      // Build print data
      const linkedJO = jobOrders.find(j => String(j.id) === String(joId));
      const linkedQuo = linkedJO?.quotationId
        ? quotations.find(q => String(q.id) === String(linkedJO.quotationId))
        : null;
      const customerObj = customers.find(c => c.name === (linkedJO?.customerName || ''));
      const printData = {
        invoice: {
          ...newInv,
          customerAddress: newInv.customerAddress || linkedQuo?.companyAddress || linkedJO?.address || customerObj?.address || ''
        },
        jo: linkedJO || null,
        consolidatedJOs: linkedJOs || [],
        quotation: linkedQuo || null,
        bankAccount: bank,
      };
      localStorage.setItem('print_invoice_data_' + newInv.id, JSON.stringify(printData));

      setActiveTab('billing');
      setIsIssuedCollapsed(false);
      setInvoiceConfirmData(null);
      setIssuingInvoiceJoId(null);
      window.open('/print/invoice?id=' + newInv.id, '_blank');

    } catch (err) {
      console.error('Confirm Issue Invoice error:', err);
      toast.error('Error: ' + (err.message || 'Gagal menerbitkan invoice.'));
    }
  };

  const handleCreateCustomInvoice = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const { id, joId, customerName, date, taxPercent, items, notes } = customInvoiceForm;

      if (!customerName.trim()) {
        toast.error(isID ? "Nama customer harus diisi" : "Customer name is required");
        return;
      }

      if (!items || items.length === 0) {
        toast.error(isID ? "Invoice harus memiliki minimal 1 item" : "Invoice must have at least 1 item");
        return;
      }

      for (let i = 0; i < items.length; i++) {
        if (!items[i].description.trim()) {
          toast.error(isID ? `Deskripsi item ke-${i+1} harus diisi` : `Item ${i+1} description is required`);
          return;
        }
        if (parseFloat(items[i].qty) <= 0 || parseFloat(items[i].rate) < 0) {
          toast.error(isID ? `Jumlah & Harga item ke-${i+1} harus valid` : `Item ${i+1} quantity & price must be valid`);
          return;
        }
      }

      // Calculations
      let subtotal = 0;
      const parsedItems = items.map(item => {
        const qty = parseFloat(item.qty) || 1;
        const rate = parseFloat(item.rate) || 0;
        const itemAmount = qty * rate;
        subtotal += itemAmount;
        return {
          description: item.description,
          qty,
          rate,
          amount: itemAmount
        };
      });

      const tax = (subtotal * (parseFloat(taxPercent) || 0)) / 100;
      const grandTotal = subtotal + tax;

      const invoiceData = {
        id: id.trim() || undefined,
        joId: joId || null,
        customerName: customerName.trim(),
        date,
        amount: grandTotal,
        subtotal,
        tax,
        items: parsedItems,
        extra_charges: [],
        notes: notes || null
      };

      console.log("Creating custom invoice:", invoiceData);
      await createCustomInvoice(invoiceData);

      // Reset Form and Modal
      setCustomInvoiceForm({
        id: '',
        joId: '',
        customerName: '',
        date: new Date().toISOString().substring(0, 10),
        taxPercent: 0,
        items: [{ description: '', qty: 1, rate: 0 }],
        notes: ''
      });
      setShowCustomInvoiceModal(false);
      toast.error(isID ? "Invoice kustom berhasil dibuat!" : "Custom invoice created successfully!");
    } catch (err) {
      console.error("Error creating custom invoice:", err);
      toast.error("Error: " + (err.message || "Failed to create custom invoice"));
    }
  };

  const updateCustomInvoiceItem = (index, field, value) => {
    setCustomInvoiceForm(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const addCustomInvoiceItem = () => {
    setCustomInvoiceForm(prev => ({
      ...prev,
      items: [...prev.items, { description: '', qty: 1, rate: 0 }]
    }));
  };

  const removeCustomInvoiceItem = (index) => {
    setCustomInvoiceForm(prev => {
      if (prev.items.length <= 1) return prev;
      return {
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      };
    });
  };

  const handleJOChangePrefill = (selectedJoId) => {
    if (!selectedJoId) {
      setCustomInvoiceForm(prev => ({
        ...prev,
        joId: '',
        customerName: '',
        items: [{ description: '', qty: 1, rate: 0 }]
      }));
      return;
    }

    const foundJo = jobOrders.find(j => String(j.id) === String(selectedJoId));
    if (!foundJo) return;

    // Fetch quotation items if any
    const quotation = foundJo.quotationId 
      ? quotations.find(q => String(q.id) === String(foundJo.quotationId))
      : null;

    let prefilledItems = [];
    if (quotation && quotation.items) {
      try {
        const parsedItems = typeof quotation.items === 'string' ? JSON.parse(quotation.items) : quotation.items;
        if (Array.isArray(parsedItems) && parsedItems.length > 0) {
          const targetDesc = (foundJo.instruction || foundJo.jobDescription || "").trim().toLowerCase();
          const item = parsedItems.find(i => (i.description || "").trim().toLowerCase() === targetDesc);
          
          if (item) {
            prefilledItems = [{
              description: item.description || foundJo.instruction || foundJo.jobDescription || 'Freight Forwarding Services',
              qty: parseFloat(foundJo.issueQuantity || foundJo.quantity || 1),
              rate: parseFloat(item.rate || foundJo.rate || 0)
            }];
          } else {
            prefilledItems = parsedItems.map(i => ({
              description: i.description || 'Logistics Service',
              qty: parseFloat(i.quantity || 1),
              rate: parseFloat(i.rate || 0)
            }));
          }
        }
      } catch (e) {
        console.error("Error parsing quotation items for prefill:", e);
      }
    }

    if (prefilledItems.length === 0) {
      prefilledItems = [{
        description: foundJo.instruction || foundJo.jobDescription || 'Freight Forwarding Services',
        qty: parseFloat(foundJo.issueQuantity || foundJo.quantity || 1),
        rate: parseFloat(foundJo.rate || 0)
      }];
    }

    setCustomInvoiceForm(prev => ({
      ...prev,
      joId: selectedJoId,
      customerName: foundJo.customerName || '',
      items: prefilledItems
    }));
  };

  const handleUploadReceivableProof = async (invId, paymentPhotos, taxPhotos) => {
    try {
      await updateInvoice(invId, { 
        paymentProofPhoto: paymentPhotos,
        tax_deduction_proof: taxPhotos
      });
      setReceivableProofModal(null);
      setModalPhotos([]);
      setModalTaxPhotos([]);
    } catch (err) {
      toast.error("Gagal upload bukti: " + err.message);
    }
  };

  const handleDownloadInvoice = (inv) => {
    // If inv is a receivable object, it might be missing joId but have id or invoiceId
    // Let's find the original invoice to get the joId
    const originalInv = invoices.find(i => i.id === inv.id || i.id === inv.invoiceId);
    const joId = inv.joId || (originalInv ? originalInv.joId : null);

    const linkedJO = jobOrders.find(j => String(j.id) === String(joId));
    const linkedQuo = linkedJO ? quotations.find(q => String(q.id) === String(linkedJO.quotationId)) : null;
    
    // Pass the enriched invoice object (merging receivable and original invoice data)
    const enrichedInv = { ...originalInv, ...inv };
    
    const consolidatedJOs = enrichedInv.consolidatedJOs 
      ? jobOrders.filter(j => enrichedInv.consolidatedJOs.map(String).includes(String(j.id)))
      : linkedJO ? [linkedJO] : [];

    const customerObj = customers.find(c => c.name === (enrichedInv.customerName || ''));
    localStorage.setItem('print_invoice_data_' + enrichedInv.id, JSON.stringify({ 
      invoice: {
        ...enrichedInv,
        customerAddress: enrichedInv.customerAddress || linkedQuo?.companyAddress || linkedJO?.address || customerObj?.address || ''
      }, 
      jo: linkedJO, 
      consolidatedJOs: consolidatedJOs,
      quotation: linkedQuo 
    }));

    // 1. Main Invoice
    window.open('/print/invoice?id=' + enrichedInv.id, '_blank');
    
    // 2. Receipt (STT)
    window.open('/print/invoice-receipt?id=' + enrichedInv.id, '_blank');

    // 3. Attachments (Operational Photos + Signed Docs + Payment/Tax Proofs)
    const hasOpsPhotos = linkedJO && Array.isArray(linkedJO.photos) && linkedJO.photos.length > 0;
    const hasSignedPhotos = enrichedInv.signedInvoicePhoto || enrichedInv.signedReceiptPhoto;
    const hasProofs = enrichedInv.paymentProofPhoto || enrichedInv.tax_deduction_proof;
    
    if (hasOpsPhotos || hasSignedPhotos || hasProofs) {
      window.open('/print/invoice-attachment?id=' + enrichedInv.id, '_blank');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSettle = (inv) => {
    setSettleModal(inv);
    const existingTaxes = Array.isArray(inv.taxes_deducted) ? inv.taxes_deducted : (inv.tax_deduction > 0 ? [{ name: 'PPh 23', amount: inv.tax_deduction }] : [{ name: '', amount: 0 }]);
    
    const getInitialPhotos = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      return [val];
    };

    setSettleForm({ 
      paymentProof: getInitialPhotos(inv.paymentProofPhoto), 
      taxes: existingTaxes, 
      taxProof: getInitialPhotos(inv.tax_deduction_proof),
      paymentDate: new Date().toLocaleDateString('sv-SE')
    });
  };

  const confirmSettle = async () => {
    if (!canWrite) return;
    if (!settleModal) return;
    try {
      await settleInvoice(settleModal.id, settleForm.paymentProof, settleForm.taxes, settleForm.taxProof, settleForm.paymentDate);
      setSettleModal(null);
      toast.success('Payment settled! Invoice moved to Lunas Records.');
    } catch (err) {
      toast.error('Gagal settle pembayaran: ' + err.message);
    }
  };

  const handleUndoInvoice = async (joId) => {
    if (!canWrite) return;
    const inv = invoices.find(i => i.joId === joId);
    if (!inv) {
      toast.error('Invoice tidak ditemukan.');
      return;
    }
    try {
      await deleteInvoice(inv.id);
    } catch (err) {
      toast.error('Gagal membatalkan invoice: ' + err.message);
    } finally {
      setUndoConfirmJoId(null);
    }
  };

  const handleUndoPaidInvoice = async (inv) => {
    if (!canWrite) return;
    const confirmed = await confirm(
      isID 
        ? `Batalkan pembayaran untuk Invoice ${inv.id}? Invoice akan dikembalikan ke Piutang Outstanding.`
        : `Undo payment for Invoice ${inv.id}? It will be moved back to Outstanding Receivables.`,
      {
        title: isID ? "Batalkan Pembayaran" : "Undo Payment",
        confirmText: isID ? "Ya, Batalkan" : "Yes, Undo",
        cancelText: isID ? "Batal" : "Cancel",
        isDanger: true
      }
    );
    if (confirmed) {
      try {
        await updateInvoice(inv.id, { status: 'issued' });
      } catch (err) {
        toast.error('Failed to undo invoice: ' + err.message);
      }
    }
  };

  const handleUndoPaidPO = async (po) => {
    if (!canWrite) return;
    const confirmed = await confirm(
      isID
        ? `Batalkan pembayaran untuk PO ${po.id}? PO akan dikembalikan ke Hutang Outstanding.`
        : `Undo payment for PO ${po.id}? It will be moved back to Outstanding Payables.`,
      {
        title: isID ? "Batalkan Pembayaran" : "Undo Payment",
        confirmText: isID ? "Ya, Batalkan" : "Yes, Undo",
        cancelText: isID ? "Batal" : "Cancel",
        isDanger: true
      }
    );
    if (confirmed) {
      try {
        await updatePurchaseOrder(po.id, { status: 'issued' });
      } catch (err) {
        toast.error('Failed to undo PO payment: ' + err.message);
      }
    }
  };

  const handleStartEditInvoice = (inv) => {
    const originalInv = invoices.find(i => i.id === inv.id || i.id === inv.invoiceId) || inv;
    
    const joIds = originalInv.consolidatedJOs && originalInv.consolidatedJOs.length > 0 
      ? originalInv.consolidatedJOs 
      : (originalInv.joId ? [originalInv.joId] : []);

    let preparedItems = [];
    if (Array.isArray(originalInv.items) && originalInv.items.length > 0) {
      preparedItems = originalInv.items.map(it => {
        const itemJoId = it.joId || originalInv.joId;
        const jo = jobOrders.find(j => String(j.id) === String(itemJoId));

        let containerNo = Array.isArray(it.containerNo) && it.containerNo.filter(Boolean).length > 0
          ? [...it.containerNo]
          : (jo && jo.containerNo ? (Array.isArray(jo.containerNo) ? [...jo.containerNo] : [jo.containerNo]) : []);

        let vehicleNo = Array.isArray(it.vehicleNo) && it.vehicleNo.filter(Boolean).length > 0
          ? [...it.vehicleNo]
          : (jo && jo.vehicleNo ? (Array.isArray(jo.vehicleNo) ? [...jo.vehicleNo] : [jo.vehicleNo]) : []);

        let driverName = Array.isArray(it.driverName) && it.driverName.filter(Boolean).length > 0
          ? [...it.driverName]
          : (jo && jo.driverName ? (Array.isArray(jo.driverName) ? [...jo.driverName] : [jo.driverName]) : []);

        // Ensure there is at least one element for the UI inputs
        if (containerNo.length === 0) containerNo = [''];
        if (vehicleNo.length === 0) vehicleNo = [''];
        if (driverName.length === 0) driverName = [''];

        return {
          ...it,
          joId: itemJoId,
          containerNo,
          vehicleNo,
          driverName
        };
      });
    } else {
      // Reconstruct legacy/single-item invoice items
      joIds.forEach(id => {
        const jo = jobOrders.find(j => String(j.id) === String(id));
        if (jo && Array.isArray(jo.items) && jo.items.length > 0) {
          jo.items.forEach(item => {
            const qty = parseFloat(item.issueQuantity || item.quantity || 1);
            const rate = parseFloat(item.rate || 0);
            
            const containerNo = Array.isArray(item.containerNo) && item.containerNo.length > 0 
              ? [...item.containerNo] 
              : (Array.isArray(jo.containerNo) && jo.containerNo.length > 0 ? [...jo.containerNo] : [jo.containerNo || '']);
            const vehicleNo = Array.isArray(item.vehicleNo) && item.vehicleNo.length > 0 
              ? [...item.vehicleNo] 
              : (Array.isArray(jo.vehicleNo) && jo.vehicleNo.length > 0 ? [...jo.vehicleNo] : [jo.vehicleNo || '']);
            const driverName = Array.isArray(item.driverName) && item.driverName.length > 0 
              ? [...item.driverName] 
              : (Array.isArray(jo.driverName) && jo.driverName.length > 0 ? [...jo.driverName] : [jo.driverName || '']);

            preparedItems.push({
              description: item.description || 'Freight Forwarding Services',
              qty,
              rate,
              amount: rate * qty,
              joId: id,
              containerNo,
              vehicleNo,
              driverName
            });
          });
        } else {
          const qty = jo ? parseFloat(jo.issueQuantity || jo.quantity || 1) : 1;
          const subtotal = parseFloat(originalInv.subtotal || originalInv.amount || 0);
          const rate = (String(id) === String(originalInv.joId)) ? (subtotal / qty) : 0;
          
          const containerNo = jo ? (Array.isArray(jo.containerNo) && jo.containerNo.length > 0 ? [...jo.containerNo] : [jo.containerNo || '']) : [''];
          const vehicleNo = jo ? (Array.isArray(jo.vehicleNo) && jo.vehicleNo.length > 0 ? [...jo.vehicleNo] : [jo.vehicleNo || '']) : [''];
          const driverName = jo ? (Array.isArray(jo.driverName) && jo.driverName.length > 0 ? [...jo.driverName] : [jo.driverName || '']) : [''];

          preparedItems.push({
            description: jo ? (jo.instruction || jo.jobDescription || '').split(' ||| ')[0].trim() : 'Freight Forwarding Services',
            qty,
            rate,
            amount: rate * qty,
            joId: id,
            containerNo,
            vehicleNo,
            driverName
          });
        }
      });

      if (preparedItems.length === 0) {
        const subtotal = parseFloat(originalInv.subtotal || originalInv.amount || 0);
        preparedItems.push({
          description: 'Freight Forwarding Services',
          qty: 1,
          rate: subtotal,
          amount: subtotal,
          joId: originalInv.joId || '',
          containerNo: [''],
          vehicleNo: [''],
          driverName: ['']
        });
      }
    }

    const preparedInv = {
      ...originalInv,
      originalId: originalInv.id,
      items: preparedItems
    };

    const initialJOData = {};
    joIds.forEach(id => {
      const jo = jobOrders.find(j => String(j.id) === String(id));
      if (jo) {
        initialJOData[String(id)] = {
          instruction: (jo.instruction || jo.jobDescription || '').split(' ||| ')[0].trim(),
          vesselName: jo.vesselName || ''
        };
      }
    });

    setEditingJOsData(initialJOData);
    setEditingInvoice(preparedInv);
  };

  const handleSaveInvoiceEdit = async () => {
    if (!editingInvoice) return;
    try {
      const extraChargesTotal = (editingInvoice.extra_charges || []).reduce((s, c) => s + parseFloat(c.amount || 0), 0);
      const subtotal = parseFloat(editingInvoice.subtotal || editingInvoice.amount);
      const finalAmount = subtotal + extraChargesTotal;

      const cleanedInvoiceItems = (editingInvoice.items || []).map(it => {
        const containerNo = Array.isArray(it.containerNo)
          ? it.containerNo.map(s => String(s || '').trim()).filter(Boolean)
          : [];
        const vehicleNo = Array.isArray(it.vehicleNo)
          ? it.vehicleNo.map(s => String(s || '').trim()).filter(Boolean)
          : [];
        const driverName = Array.isArray(it.driverName)
          ? it.driverName.map(s => String(s || '').trim()).filter(Boolean)
          : [];

        return {
          ...it,
          containerNo,
          vehicleNo,
          driverName
        };
      });

      await updateInvoice(editingInvoice.originalId, {
        id: editingInvoice.id,
        amount: finalAmount,
        subtotal: subtotal,
        tax: 0,
        extra_charges: editingInvoice.extra_charges || [],
        consolidatedJOs: editingInvoice.consolidatedJOs || [],
        items: cleanedInvoiceItems
      });

      const joIds = editingInvoice.consolidatedJOs && editingInvoice.consolidatedJOs.length > 0 
        ? editingInvoice.consolidatedJOs 
        : (editingInvoice.joId ? [editingInvoice.joId] : []);

      for (const joId of joIds) {
        const jo = jobOrders.find(j => String(j.id) === String(joId));
        if (!jo) continue;

        const joItems = (editingInvoice.items || []).filter(it => String(it.joId) === String(joId));

        const updatedJoItems = joItems.map(it => {
          const containerNo = Array.isArray(it.containerNo)
            ? it.containerNo.map(s => String(s || '').trim()).filter(Boolean)
            : [];
          const vehicleNo = Array.isArray(it.vehicleNo)
            ? it.vehicleNo.map(s => String(s || '').trim()).filter(Boolean)
            : [];
          const driverName = Array.isArray(it.driverName)
            ? it.driverName.map(s => String(s || '').trim()).filter(Boolean)
            : [];
          
          return {
            description: it.description,
            rate: parseFloat(it.rate || 0),
            quantity: parseFloat(it.qty || it.quantity || 1),
            issueQuantity: parseFloat(it.qty || it.quantity || 1),
            status: 'done',
            containerNo,
            vehicleNo,
            driverName
          };
        });

        const containerNo = [...new Set(updatedJoItems.flatMap(item => Array.isArray(item.containerNo) ? item.containerNo : [item.containerNo || '']))].filter(Boolean);
        const vehicleNo = [...new Set(updatedJoItems.flatMap(item => Array.isArray(item.vehicleNo) ? item.vehicleNo : [item.vehicleNo || '']))].filter(Boolean);
        const driverName = [...new Set(updatedJoItems.flatMap(item => Array.isArray(item.driverName) ? item.driverName : [item.driverName || '']))].filter(Boolean);

        const joDraft = editingJOsData[String(joId)] || {};
        const instruction = joDraft.instruction !== undefined ? joDraft.instruction : (jo.instruction || jo.jobDescription || '');
        const vesselName = joDraft.vesselName !== undefined ? joDraft.vesselName : (jo.vesselName || '');

        await updateJOStatus(joId, {
          items: updatedJoItems,
          containerNo,
          vehicleNo,
          driverName,
          instruction,
          vesselName
        });
      }

      setEditingInvoice(null);
      toast.success(isID ? 'Invoice dan Job Order berhasil diperbarui!' : 'Invoice and Job Orders updated successfully!');
    } catch (err) {
      console.error('Error saving invoice/job order changes:', err);
      toast.error(isID ? 'Gagal menyimpan perubahan: ' + err.message : 'Failed to save changes: ' + err.message);
    }
  };

  const handleCreatePOFromAccounting = (joId) => {
    setPoJoId(joId);
    setShowPOModal(true);
  };

  const toggleLedgerSelection = (id) => {
    const newSelected = new Set(selectedLedger);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedLedger(newSelected);
  };

  const toggleAllLedger = (items) => {
    if (selectedLedger.size === items.length) {
      setSelectedLedger(new Set());
    } else {
      setSelectedLedger(new Set(items.map(i => i.id)));
    }
  };

  const handleBatchPrint = () => {
    if (selectedLedger.size === 0) return;
    const selectedList = invoices.filter(inv => selectedLedger.has(inv.id));
    setBatchPrintInvoices(selectedList);
  };

  const togglePayableSelection = (id) => {
    const newSelected = new Set(selectedPayables);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedPayables(newSelected);
  };

  const toggleAllPayables = (items) => {
    if (selectedPayables.size === items.length) {
      setSelectedPayables(new Set());
    } else {
      setSelectedPayables(new Set(items.map(i => i.id)));
    }
  };

  const handleBatchPrintPayable = () => {
    if (selectedPayables.size === 0) return;
    const selectedList = purchaseOrders.filter(po => selectedPayables.has(po.id));
    setBatchPrintPOs(selectedList);
  };

  const handleBatchDownloadVendorInvoice = () => {
    if (selectedPayables.size === 0) return;
    const selectedList = purchaseOrders.filter(po => selectedPayables.has(po.id));
    let downloaded = 0;
    selectedList.forEach(po => {
      if (po.vendorInvoicePhoto && po.vendorInvoicePhoto.length > 0) {
        downloadPhotos(po.vendorInvoicePhoto, `Invoice_Vendor_${po.vendorName}_${po.id}`);
        downloaded++;
      }
    });
    if (downloaded === 0) {
      toast.success('Tidak ada invoice vendor yang tersedia untuk di-download pada PO yang dipilih.');
    }
  };

  const toggleIssuedSelection = (id) => {
    const newSelected = new Set(selectedIssued);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIssued(newSelected);
  };

  const toggleAllIssued = (items) => {
    if (selectedIssued.size === items.length) {
      setSelectedIssued(new Set());
    } else {
      setSelectedIssued(new Set(items.map(i => i.id)));
    }
  };

  const handleBatchPrintIssued = () => {
    if (selectedIssued.size === 0) return;
    const selectedList = invoices.filter(inv => selectedIssued.has(inv.id));
    setBatchPrintIssued(selectedList);
  };

  const handleBatchPrintPaidInvoices = () => {
    if (selectedLedger.size === 0) return;
    const selectedList = (paidInvoices || [])
      .filter(inv => selectedLedger.has(inv.id))
      .map(inv => {
        const originalInv = invoices.find(i => i.id === inv.id || i.id === inv.invoiceId);
        return { ...originalInv, ...inv };
      });
    setBatchPrintPaidInvoices(selectedList);
  };

  const filteredIssuedInvoices = React.useMemo(() => {
    // 1. Group completed JOs just like we do in the rendering code
    const groups = {};
    (completedJOs || []).forEach(jo => {
      const qId = jo.quotationId || 'direct';
      // If it's a direct job, only include it if it hasn't been invoiced yet!
      if (!jo.quotationId) {
        const hasInvoice = (invoices || []).some(inv => String(inv.joId) === String(jo.id) || (Array.isArray(inv.consolidatedJOs) && inv.consolidatedJOs.map(String).includes(String(jo.id))));
        if (hasInvoice) return;
      }
      if (!groups[qId]) {
        groups[qId] = { quotationId: qId, jobOrders: [] };
      }
      groups[qId].jobOrders.push(jo);
    });

    // 2. Filter quotation groups
    const pendingJoIds = new Set();
    Object.values(groups).forEach(group => {
      if (group.quotationId === 'direct') {
        group.jobOrders.forEach(jo => pendingJoIds.add(String(jo.id)));
        return;
      }
      
      const hasUninvoicedJO = group.jobOrders.some(jo => {
        const hasInvoice = (invoices || []).some(inv => String(inv.joId) === String(jo.id) || (Array.isArray(inv.consolidatedJOs) && inv.consolidatedJOs.map(String).includes(String(jo.id))));
        return !hasInvoice;
      });

      if (hasUninvoicedJO) {
        group.jobOrders.forEach(jo => pendingJoIds.add(String(jo.id)));
      }
    });

    const list = (invoices || [])
      .filter(inv => filterByDate(inv.date))
      .filter(inv => {
        // Exclude invoices that are linked to a completed JO currently displayed in the cascade
        if (pendingJoIds.has(String(inv.joId))) {
          return false;
        }

        const id = inv.id || '';
        const name = inv.customerName || '';
        const term = searchTerm.toLowerCase();
        const associatedJOs = getAssociatedJOs(inv);
        const containerMatch = associatedJOs.some(jo => {
          if (Array.isArray(jo.containerNo)) {
            return jo.containerNo.some(c => c && c.toLowerCase().includes(term));
          }
          return jo.containerNo && jo.containerNo.toLowerCase().includes(term);
        }) || (Array.isArray(inv.items) && inv.items.some(item => {
          if (Array.isArray(item.containerNo)) {
            return item.containerNo.some(c => c && c.toLowerCase().includes(term));
          }
          return item.containerNo && String(item.containerNo).toLowerCase().includes(term);
        }));
        return id.toLowerCase().includes(term) || name.toLowerCase().includes(term) || containerMatch;
      });

    return sortInvoices(list, invoiceSortBy);
  }, [invoices, searchTerm, filterByDate, jobOrders, invoiceSortBy]);

  return (
    <div className="accounting-container">
      {/* Invoice Modal */}
      {selectedInvoice && (() => {
        const linkedJO = jobOrders.find(jo => jo.id === selectedInvoice.joId);
        const isPaid = selectedInvoice.status === 'paid';

        return (
          <div className="no-print" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '40px'
          }}>
            <style>{`
              @media print {
                #invoice-print { 
                  width: 210mm !important; 
                  height: 297mm !important; 
                  padding: 1.5cm !important; 
                  margin: 0 !important;
                  box-shadow: none !important;
                }
                .no-print { display: none !important; }
              }
            `}</style>
            <div className="glass-card" style={{ 
              background: 'white', color: '#1e293b', width: '100%', maxWidth: '850px',
              padding: '0', borderRadius: '12px', position: 'relative',
              maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 0 50px rgba(0,0,0,0.5)'
            }}>
              <div className="no-print" style={{ position: 'sticky', top: 0, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: '15px', zIndex: 10 }}>
                <button onClick={() => window.print()} className="btn btn-primary" style={{ height: '40px' }}><FileText size={18}/> Print / Save PDF</button>
                <button onClick={() => setSelectedInvoice(null)} className="btn" style={{ height: '40px', background: '#f1f5f9', color: '#64748b', border: 'none' }}><XCircle size={18}/> Close</button>
              </div>

              <div id="invoice-print" style={{ padding: '60px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '4px solid #065f46', paddingBottom: '30px', marginBottom: '40px' }}>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <img src="/assets/logo.png" alt="Logo" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
                    <div>
                      <h2 style={{ color: '#065f46', background: 'none', webkitTextFillColor: 'initial', margin: 0, fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1px' }}>PT. ALPHA LOGISTICS PRAKARSA</h2>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h1 style={{ color: 'var(--secondary)', background: 'none', webkitTextFillColor: 'initial', fontSize: '3.5rem', margin: 0, fontWeight: '950', letterSpacing: '-2px' }}>INVOICE</h1>
                    <p style={{ fontWeight: '800', margin: '5px 0 0 0', fontSize: '1.2rem', color: '#0f172a' }}>NO: {selectedInvoice.id}</p>
                  </div>
                </div>

                <div className="grid-responsive-2" style={{ gap: '60px', marginBottom: '50px' }}>
                  <div>
                    <h4 style={{ color: '#065f46', marginBottom: '15px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '800', letterSpacing: '1px' }}>BILL TO:</h4>
                    <p style={{ fontWeight: '900', fontSize: '1.6rem', margin: '0 0 8px 0', color: '#0f172a' }}>{selectedInvoice.customerName}</p>
                    <p style={{ margin: 0, color: '#475569', fontWeight: '600' }}>{selectedInvoice.address || 'Batam, Indonesia'}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ marginBottom: '25px' }}>
                      <h4 style={{ color: '#065f46', marginBottom: '8px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '800', letterSpacing: '1px' }}>INVOICE DETAILS:</h4>
                      <p style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}><strong>Date:</strong> {formatDate(selectedInvoice.date)}</p>
                      <p style={{ margin: 0, fontSize: '1.1rem' }}><strong>Due Date:</strong> {new Date(new Date(selectedInvoice.date).getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div>
                      <h4 style={{ color: '#065f46', marginBottom: '8px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '800', letterSpacing: '1px' }}>PAYMENT INFO:</h4>
                      <div style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: '700', lineHeight: '1.5' }}>
                        Bank Mandiri (IDR)<br />
                        Acc No: 164-00-0255502-3<br />
                        Acc Name: PT. Alpha Logistics Prakarsa
                      </div>
                    </div>
                  </div>
                </div>

                <div className="table-container"><div className="table-container"><table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '50px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '3px solid #065f46' }}>
                      <th style={{ padding: '15px', textAlign: 'left', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: '800', color: '#0f172a' }}>Service Description</th>
                      <th style={{ padding: '15px', textAlign: 'center', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', width: '100px' }}>Qty</th>
                      <th style={{ padding: '15px', textAlign: 'right', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', width: '220px' }}>Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '25px 15px' }}>
                        <div style={{ fontWeight: '900', fontSize: '1.3rem', color: '#0f172a' }}>Logistics Services - JO #{selectedInvoice.joId}</div>
                        <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '6px', fontWeight: '600' }}>Premium freight forwarding and handling fees</div>
                      </td>
                      <td style={{ padding: '25px 15px', textAlign: 'center', fontWeight: '800', fontSize: '1.2rem' }}>1</td>
                      <td style={{ padding: '25px 15px', textAlign: 'right', fontWeight: '950', fontSize: '1.4rem', color: '#0f172a' }}>Rp {parseFloat(selectedInvoice.amount).toLocaleString('id-ID')}</td>
                    </tr>
                  </tbody>
                </table></div></div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '40px', marginTop: '10px', padding: '35px', background: '#f8fafc', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                  <div style={{ textAlign: 'right' }}>
                    <h3 style={{ margin: 0, color: '#64748b', textTransform: 'uppercase', fontSize: '1.1rem', fontWeight: '800', letterSpacing: '1.5px' }}>GRAND TOTAL</h3>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h2 style={{ margin: 0, fontSize: '3.8rem', fontWeight: '950', color: '#065f46', letterSpacing: '-2px' }}>Rp {parseFloat(selectedInvoice.amount).toLocaleString('id-ID')}</h2>
                  </div>
                </div>

                {isPaid && (
                  (() => {
                    const associatedJOs = getAssociatedJOs(selectedInvoice);
                    if (associatedJOs.length === 0) return null;
                    
                    let allVehicles = [];
                    let allPhotos = [];
                    let allStatuses = [];
                    
                    associatedJOs.forEach(jo => {
                      if (Array.isArray(jo.vehicleNo)) {
                        allVehicles.push(...jo.vehicleNo.filter(Boolean));
                      } else if (jo.vehicleNo && String(jo.vehicleNo).trim()) {
                        allVehicles.push(String(jo.vehicleNo).trim());
                      }
                      
                      if (Array.isArray(jo.photos)) {
                        allPhotos.push(...jo.photos.filter(Boolean));
                      }
                      
                      if (jo.activityStatus) {
                        allStatuses.push(jo.activityStatus);
                      }
                    });
                    
                    const allContainers = getAggregatedContainers(associatedJOs, selectedInvoice);
                    allVehicles = [...new Set(allVehicles)];
                    allPhotos = [...new Set(allPhotos)];
                    allStatuses = [...new Set(allStatuses)];
                    
                    const displayStatus = allStatuses.length > 0 ? allStatuses.join(', ') : 'DELIVERED';
                    
                    return (
                      <div style={{ borderTop: '2px dashed #cbd5e1', paddingTop: '50px', marginTop: '60px' }}>
                        <h4 style={{ color: '#065f46', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase', fontSize: '0.9rem', fontWeight: '900', letterSpacing: '1px' }}>
                          <CheckCircle size={20} /> Operational Execution Proof (POD)
                        </h4>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', marginBottom: '40px', background: 'white', border: '1px solid #e2e8f0', padding: '25px', borderRadius: '12px' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '800' }}>Container No.</span>
                            <div style={{ fontWeight: '900', fontSize: '1.2rem', color: '#0f172a', whiteSpace: 'pre-wrap' }}>
                              {allContainers.length > 0 ? allContainers.join(', ') : 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '800' }}>Vehicle No.</span>
                            <div style={{ fontWeight: '900', fontSize: '1.2rem', color: '#0f172a', whiteSpace: 'pre-wrap' }}>
                              {allVehicles.length > 0 ? allVehicles.join(', ') : 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '800' }}>Final Activity Status</span>
                            <div style={{ fontWeight: '900', fontSize: '1.2rem', color: 'var(--success)' }}>
                              {displayStatus}
                            </div>
                          </div>
                        </div>

                        {allPhotos.length > 0 && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                            {allPhotos.map((photo, idx) => (
                              <div key={idx} style={{ height: '140px', borderRadius: '10px', overflow: 'hidden', border: '2px solid #f1f5f9' }}>
                                <img src={photo} alt="Operation Proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}

                <div style={{ marginTop: '100px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ maxWidth: '400px' }}>
                    <p style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '700', marginBottom: '10px' }}>* Payment due within 14 days of invoice date.</p>
                    <p style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '700' }}>* All business is subject to our standard terms and conditions.</p>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: '250px' }}>
                    <p style={{ marginBottom: '80px', fontSize: '0.9rem', fontWeight: '900', textTransform: 'uppercase', color: '#0f172a', letterSpacing: '1px' }}>Authorized Signature</p>
                    <div style={{ borderBottom: '3px solid #0f172a', width: '100%', marginBottom: '15px' }}></div>
                    <p style={{ margin: 0, fontWeight: '950', color: '#065f46', fontSize: '1.2rem' }}>PT. ALPHA LOGISTICS PRAKARSA</p>
                    <p style={{ margin: 0, color: '#64748b', fontWeight: '700', fontSize: '0.85rem' }}>Finance Department</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Print PO View */}
      {printPO && (
        <div style={{ position: 'fixed', inset: 0, background: 'white', zIndex: 10000, padding: '40px', color: 'black', overflowY: 'auto' }}>
          <style>{`
            @media print {
              #po-print { 
                width: 210mm !important; 
                height: 297mm !important; 
                padding: 1.5cm !important; 
                margin: 0 !important;
                box-shadow: none !important;
                border: none !important;
              }
              .no-print { display: none !important; }
            }
          `}</style>
          <div className="no-print" style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '10px' }}>
            <button className="btn" style={{ background: '#eee', color: '#333' }} onClick={() => setPrintPO(null)}>Close</button>
            <button className="btn btn-primary" onClick={() => window.print()}>Print PO</button>
          </div>
          
          <div id="po-print" style={{ maxWidth: '850px', margin: '0 auto', border: '1px solid #ddd', padding: '50px', background: 'white', boxShadow: '0 0 20px rgba(0,0,0,0.05)', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '4px solid #333', paddingBottom: '25px', marginBottom: '40px' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <img src="/assets/logo.png" alt="Logo" style={{ width: '70px', height: '70px', objectFit: 'contain' }} />
                <div>
                  <h1 style={{ margin: 0, fontSize: '2.5rem', color: '#0f172a', fontWeight: '900', letterSpacing: '-1px' }}>PURCHASE ORDER</h1>
                  <div style={{ color: '#d97706', fontWeight: '800', fontSize: '1.1rem', marginTop: '2px' }}>Ref: {printPO.id}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '900', fontSize: '1.4rem', color: '#0f172a' }}>PT. ALPHA LOGISTICS PRAKARSA</div>
                <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '600', marginTop: '5px' }}>
                  Ruko The Summer B1-2A, Jl. Centre Point,<br />
                  Teluk Tering, Batam Kota, Batam<br />
                  Date: {printPO.date}
                </div>
              </div>
            </div>

            <div className="grid-responsive-2" style={{ gap: '50px', marginBottom: '40px' }}>
              <div style={{ borderLeft: '5px solid #d97706', paddingLeft: '20px' }}>
                <div style={{ textTransform: 'uppercase', fontSize: '0.8rem', color: '#64748b', fontWeight: '800', marginBottom: '10px', letterSpacing: '1px' }}>Vendor Information:</div>
                <div style={{ fontWeight: '900', fontSize: '1.4rem', color: '#0f172a' }}>{printPO.vendorName}</div>
                <div style={{ color: '#475569', fontWeight: '600', marginTop: '5px' }}>Trusted Logistics Partner</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ textTransform: 'uppercase', fontSize: '0.8rem', color: '#64748b', fontWeight: '800', marginBottom: '10px', letterSpacing: '1px' }}>Job Order Reference:</div>
                <div style={{ fontWeight: '900', fontSize: '1.4rem', color: '#0f172a' }}>{printPO.joId}</div>
                <div style={{ marginTop: '15px' }}>
                  <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b', fontWeight: '800' }}>Customer Reference:</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#475569' }}>{printPO.customerName}</div>
                </div>
              </div>
            </div>

            <div className="table-container"><div className="table-container"><table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '3px solid #333' }}>
                  <th style={{ padding: '15px', textAlign: 'left', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: '800', color: '#0f172a' }}>Service Description</th>
                  <th style={{ padding: '15px', textAlign: 'center', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', width: '80px' }}>Qty</th>
                  <th style={{ padding: '15px', textAlign: 'right', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', width: '180px' }}>Unit Price</th>
                  <th style={{ padding: '15px', textAlign: 'right', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', width: '200px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(printPO.items || []).map((it, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '20px 15px' }}>
                      <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#0f172a' }}>{it.serviceDescription}</div>
                      <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: '600', marginTop: '4px' }}>Premium Vendor Service</div>
                    </td>
                    <td style={{ padding: '20px 15px', textAlign: 'center', fontWeight: '800' }}>{it.qty}</td>
                    <td style={{ padding: '20px 15px', textAlign: 'right', fontWeight: '700' }}>Rp {it.unitPrice.toLocaleString('id-ID')}</td>
                    <td style={{ padding: '20px 15px', textAlign: 'right', fontWeight: '900', fontSize: '1.1rem', color: '#0f172a' }}>Rp {it.total.toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f8fafc' }}>
                  <td colSpan="3" style={{ padding: '25px 15px', textAlign: 'right', fontWeight: '900', fontSize: '1.2rem', color: '#64748b' }}>TOTAL AMOUNT PAYABLE</td>
                  <td style={{ padding: '25px 15px', textAlign: 'right', fontWeight: '950', fontSize: '1.8rem', color: '#d97706' }}>Rp {(printPO.grandTotal || 0).toLocaleString('id-ID')}</td>
                </tr>
              </tfoot>
            </table></div></div>

            {printPO.notes && (
              <div style={{ marginBottom: '40px', padding: '15px', background: '#f8fafc', borderLeft: '4px solid #d97706', borderRadius: '4px' }}>
                <div style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b', fontWeight: '800', marginBottom: '5px', letterSpacing: '1px' }}>Notes / Special Instructions:</div>
                <div style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: '600', whiteSpace: 'pre-wrap' }}>{printPO.notes}</div>
              </div>
            )}

            <div style={{ marginTop: '80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '100px', textAlign: 'center' }}>
              <div>
                <div style={{ borderBottom: '2px solid #333', height: '100px', marginBottom: '15px' }} />
                <div style={{ fontSize: '0.9rem', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1px' }}>Vendor Signature</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '5px' }}>Authorized Stamp & Sign</div>
              </div>
              <div>
                <div style={{ borderBottom: '2px solid #333', height: '100px', marginBottom: '15px' }} />
                <div style={{ fontSize: '0.9rem', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1px' }}>Authorized Signature</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '5px' }}>PT. Alpha Logistics Prakarsa</div>
              </div>
            </div>

            <div style={{ marginTop: '60px', borderTop: '1px dashed #cbd5e1', paddingTop: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>* This Purchase Order is a legally binding document between PT. Alpha Logistics Prakarsa and the specified vendor.</p>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '5px 0 0 0' }}>* Please acknowledge receipt of this PO within 24 hours.</p>
            </div>
          </div>
        </div>
      )}

      {/* PO Modal */}
      {showPOModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
          <div className="glass-card" style={{width:'100%',maxWidth:'720px',padding:'40px',maxHeight:'90vh',overflowY:'auto',position:'relative'}}>
            <button onClick={resetPOForm} style={{position:'absolute',top:'15px',right:'15px',background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer'}}><X size={20}/></button>
            <h3 style={{color:'var(--secondary)',marginBottom:'25px',display:'flex',alignItems:'center',gap:'10px'}}><Receipt size={22}/> {isID ? 'Buat Purchase Order' : 'Create Purchase Order'}</h3>
            <form onSubmit={e => e.preventDefault()}>
              <div className="input-group" style={{marginBottom:'20px'}}>
                <label style={{color:'var(--secondary)',fontWeight:'600'}}>1. Job Order</label>
                {poJoId ? (
                  <div style={{padding:'12px',background:'var(--input-bg)',border:'1px solid var(--border)',borderRadius:'10px',color:'var(--secondary)',fontWeight:'700'}}>
                    {poJoId} — {jobOrders.find(j=>j.id===poJoId)?.customerName}
                  </div>
                ) : (
                  <select required value={poJoId} onChange={e=>setPoJoId(e.target.value)} style={{width:'100%',padding:'12px',background:'var(--input-bg)',border:'1px solid var(--border)',borderRadius:'10px',color:'var(--secondary)',fontWeight:'700'}}>
                    <option value="" style={{ background: 'var(--bg)', color: 'var(--text)' }}>-- {isID ? 'Pilih Job Order' : 'Select Job Order'} --</option>
                    {jobOrders.filter(jo => jo.status !== 'cancelled').map(jo => (
                      <option key={jo.id} value={jo.id} style={{color:'var(--text)', background:'var(--bg)'}}>
                        {jo.id} — {jo.customerName} ({jo.instruction})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="input-group" style={{marginBottom:'20px'}}>
                <label style={{color:'var(--secondary)',fontWeight:'600'}}>2. {isID ? 'Pilih Vendor' : 'Select Vendor'}</label>
                <select required value={poVendorId} onChange={e=>{setPoVendorId(e.target.value);setPoItems([{serviceIdx:'',qty:1}]);}} style={{width:'100%',padding:'12px',background:'var(--input-bg)',border:'1px solid var(--border)',borderRadius:'10px',color:'var(--secondary)',fontWeight:'700'}}>
                  <option value="" style={{color:'var(--text-muted)', background: 'var(--bg)'}}>-- {isID ? 'Pilih Vendor' : 'Select Vendor'} --</option>
                  {vendorList.map(v=><option key={v.id} value={v.id} style={{color:'var(--text)',background:'var(--bg)'}}>{v.name}</option>)}
                </select>
              </div>



              {poVendorId && (() => {
                const vendor = vendorList.find(v=>v.id===poVendorId);
                return (
                  <div style={{marginBottom:'20px'}}>
                    <label style={{color:'var(--secondary)',fontWeight:'600',display:'block',marginBottom:'10px'}}>3. {isID ? 'Pilih Layanan Vendor' : 'Select Vendor Services'}</label>
                    {poItems.map((item,i)=>{
                      const svc = vendor?.services?.[parseInt(item.serviceIdx)];
                      const sub = svc ? parseFloat(svc.price||0)*parseFloat(item.qty||1) : 0;
                      return (
                        <div key={i} className="grid-quote-items" style={{gap:'8px',marginBottom:'10px',alignItems:'center'}}>
                          <select required value={item.serviceIdx} onChange={e=>updatePOItem(i,'serviceIdx',e.target.value)} style={{padding:'9px',background:'var(--input-bg)',border:'1px solid var(--border)',borderRadius:'8px',color:'var(--secondary)',fontWeight:'600',fontSize:'0.85rem'}}>
                            <option value="" style={{color:'var(--text-muted)', background: 'var(--bg)'}}>-- {isID ? 'Pilih Layanan' : 'Select Service'} --</option>
                            {vendor?.services?.map((s,si)=><option key={si} value={si} style={{color:'var(--text)', background:'var(--bg)'}}>{s.description} — Rp {parseFloat(s.price||0).toLocaleString(isID ? 'id-ID' : 'en-US')}</option>)}
                          </select>
                          <input type="number" min="1" step="any" value={item.qty} onChange={e=>updatePOItem(i,'qty',e.target.value)} style={{padding:'9px',background:'var(--input-bg)',border:'1px solid var(--border)',borderRadius:'8px',color:'var(--text)',fontSize:'0.85rem',textAlign:'center'}}/>
                          <div style={{padding:'9px',background:'rgba(255,255,255,0.03)',border:'1px solid var(--glass-border)',borderRadius:'8px',fontSize:'0.85rem',fontWeight:'700',color:'var(--secondary)',textAlign:'right'}}>{svc?`Rp ${sub.toLocaleString(isID ? 'id-ID' : 'en-US')}`:'Rp 0'}</div>
                          <button type="button" onClick={()=>removePOItem(i)} disabled={poItems.length===1} style={{background:'var(--danger-bg)',color:'var(--danger)',border:'none',borderRadius:'8px',height:'36px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={13}/></button>
                        </div>
                      );
                    })}
                    <button type="button" onClick={addPOItem} style={{width:'100%',padding:'8px',background:'rgba(212,175,55,0.08)',color:'var(--secondary)',border:'1px dashed var(--secondary)',borderRadius:'8px',cursor:'pointer',fontSize:'0.85rem',marginBottom:'15px'}}>+ {isID ? 'Tambah Baris Layanan' : 'Add Service Line'}</button>
                    <div style={{textAlign:'right',padding:'12px 15px',background:'rgba(255,255,255,0.03)',borderRadius:'10px',border:'1px solid var(--glass-border)'}}>
                      <span style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>Grand Total PO: </span>
                      <span style={{color:'var(--secondary)',fontWeight:'800',fontSize:'1.1rem'}}>Rp {poItems.filter(it=>it.serviceIdx!=='').reduce((s,it)=>{const svc=vendor?.services?.[parseInt(it.serviceIdx)];return s+(svc?parseFloat(svc.price||0)*parseFloat(it.qty||1):0);},0).toLocaleString(isID ? 'id-ID' : 'en-US')}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="input-group" style={{marginBottom:'20px'}}>
                <label style={{color:'var(--secondary)',fontWeight:'600'}}>4. {isID ? 'Catatan (Notes)' : 'Notes'}</label>
                <textarea 
                  value={poNotes} 
                  onChange={e => setPoNotes(e.target.value)} 
                  placeholder={isID ? 'Tambahkan instruksi khusus untuk vendor (opsional)...' : 'Add special instructions for vendor (optional)...'}
                  style={{width:'100%',padding:'12px',background:'var(--input-bg)',border:'1px solid var(--border)',borderRadius:'10px',color:'var(--text)',minHeight:'80px',fontSize:'0.9rem'}}
                />
              </div>

              <div style={{display:'flex',gap:'12px',marginTop:'20px' }}>
                <button type="button" onClick={resetPOForm} className="btn" style={{flex:1,background:'rgba(255,255,255,0.05)',border:'1px solid var(--border)',color:'var(--text)'}}>{isID ? 'Batal' : 'Cancel'}</button>
                <ButtonWithLoading type="button" onClick={handleSavePODraft} className="btn" style={{flex:1,background:'var(--secondary-bg)',color:'var(--secondary)',border:'1px solid var(--secondary)'}} disabled={!poVendorId}>💾 {isID ? 'Simpan Draft' : 'Save Draft'}</ButtonWithLoading>
                <ButtonWithLoading type="button" onClick={handleIssuePO} className="btn btn-gold" style={{flex:2}} disabled={!poVendorId}>🚀 {isID ? 'Terbitkan PO' : 'Issue PO'}</ButtonWithLoading>
              </div>
            </form>
          </div>
        </div>
      )}

      {batchPrintInvoices && (
        <div style={{ position: 'fixed', inset: 0, background: 'white', zIndex: 10000, color: 'black', overflowY: 'auto', padding: '20px' }}>
          <style>{`
            @media print {
              .batch-inv-page { 
                width: 210mm !important; 
                height: 297mm !important; 
                padding: 1.5cm !important; 
                margin: 0 !important;
                box-shadow: none !important;
                border: none !important;
                page-break-after: always !important;
              }
              .no-print { display: none !important; }
            }
          `}</style>
          <div className="no-print" style={{ position: 'sticky', top: '10px', right: '10px', display: 'flex', gap: '10px', justifyContent: 'flex-end', background: 'rgba(255,255,255,0.9)', padding: '10px', borderRadius: '8px', zIndex: 10001 }}>
            <button className="btn" style={{ background: '#eee', color: '#333' }} onClick={() => setBatchPrintInvoices(null)}>Close</button>
            <button className="btn btn-primary" onClick={() => window.print()}><FileText size={18}/> Print All Selected Invoices</button>
          </div>
          
          <div style={{ maxWidth: '850px', margin: '0 auto' }}>
            {batchPrintInvoices.map((inv, index) => {
              return (
                <div key={inv.id} className="batch-inv-page" style={{ background: 'white', padding: '50px', marginBottom: '50px', border: '1px solid #eee', boxShadow: '0 0 10px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '4px solid #0f172a', paddingBottom: '25px', marginBottom: '40px' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <img src="/assets/logo.png" alt="Logo" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
                      <div>
                        <h1 style={{ margin: 0, color: '#0f172a', fontSize: '2.5rem', letterSpacing: '-1px', fontWeight: '900' }}>INVOICE</h1>
                        <div style={{ color: '#64748b', fontWeight: '700', marginTop: '2px' }}>NO: {inv.id}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '900', fontSize: '1.2rem', color: '#0f172a' }}>PT. ALPHA LOGISTICS PRAKARSA</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '5px' }}>
                        Ruko The Summer B1-2A, Jl. Centre Point,<br />
                        Teluk Tering, Batam Kota, Batam<br />
                        T: +62 813-6562-2272
                      </div>
                    </div>
                  </div>

                  <div className="grid-responsive-2" style={{ gap: '40px', marginBottom: '40px' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '800', display: 'block', marginBottom: '8px' }}>Billed To:</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0f172a' }}>{inv.customerName}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ marginBottom: '15px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '800', display: 'block', marginBottom: '3px' }}>Invoice Date:</span>
                        <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>{formatDate(inv.date)}</div>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>
                        Bank Mandiri | 164-00-0255502-3<br />
                        PT. Alpha Logistics Prakarsa
                      </div>
                    </div>
                  </div>

                  <div className="table-container"><div className="table-container"><table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #0f172a' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '800', fontSize: '0.8rem' }}>DESCRIPTION</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: '800', fontSize: '0.8rem', width: '80px' }}>QTY</th>
                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: '800', fontSize: '0.8rem', width: '180px' }}>TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(inv.items) && inv.items.length > 0 ? (
                        inv.items.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '16px 12px' }}>
                              <div style={{ fontWeight: '800', fontSize: '1rem' }}>{item.description}</div>
                              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>JO Ref: {(() => {
                                const ass = getAssociatedJOs(inv);
                                return ass[idx] ? ass[idx].id : inv.joId;
                              })()}</div>
                            </td>
                            <td style={{ padding: '16px 12px', textAlign: 'center' }}>{item.qty || 1}</td>
                            <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: '900', fontSize: '1.1rem' }}>Rp {(parseFloat(item.rate || 0) * (item.qty || 1)).toLocaleString('id-ID')}</td>
                          </tr>
                        ))
                      ) : (
                        <tr style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '20px 12px' }}>
                            <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>
                              {(() => {
                                const ass = getAssociatedJOs(inv);
                                const firstJo = ass[0];
                                if (firstJo) {
                                  return firstJo.instruction || firstJo.jobDescription || 'Freight Forwarding Services';
                                }
                                return 'Freight Forwarding Services';
                              })()}
                            </div>
                            <div style={{ color: '#64748b', fontSize: '0.8rem' }}>JO Ref: {inv.joId}</div>
                          </td>
                          <td style={{ padding: '20px 12px', textAlign: 'center' }}>1</td>
                          <td style={{ padding: '20px 12px', textAlign: 'right', fontWeight: '900', fontSize: '1.2rem' }}>Rp {parseFloat(inv.amount).toLocaleString('id-ID')}</td>
                        </tr>
                      )}
                    </tbody>
                  </table></div></div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '30px', background: '#f8fafc', padding: '20px', borderRadius: '10px' }}>
                    <div style={{ fontWeight: '800', color: '#64748b' }}>TOTAL DUE</div>
                    <div style={{ fontWeight: '950', fontSize: '2.2rem', color: '#065f46' }}>Rp {parseFloat(inv.amount).toLocaleString('id-ID')}</div>
                  </div>

                  <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      * Computer generated invoice, no signature required unless requested.
                    </div>
                    <div style={{ textAlign: 'center', minWidth: '200px' }}>
                      <p style={{ marginBottom: '60px', fontSize: '0.85rem', fontWeight: '800' }}>AUTHORIZED BY</p>
                      <div style={{ borderBottom: '2px solid #0f172a', width: '100%', marginBottom: '10px' }}></div>
                      <p style={{ margin: 0, fontWeight: '900' }}>PT. ALPHA LOGISTICS PRAKARSA</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {batchPrintIssued && (
        <div style={{ position: 'fixed', inset: 0, background: 'white', zIndex: 10000, color: 'black', overflowY: 'auto', padding: '20px' }}>
          <style>{`
            @media print {
              .batch-issued-page { 
                width: 210mm !important; 
                min-height: 297mm !important; 
                padding: 1.2cm !important; 
                margin: 0 !important;
                box-shadow: none !important;
                border: none !important;
                page-break-after: always !important;
                display: flex !important;
                flex-direction: column !important;
              }
              .no-print { display: none !important; }
              body { background: white !important; }
            }
          `}</style>
          <div className="no-print" style={{ position: 'sticky', top: '10px', right: '10px', display: 'flex', gap: '10px', justifyContent: 'flex-end', background: 'rgba(255,255,255,0.9)', padding: '10px', borderRadius: '8px', zIndex: 10001 }}>
            <button className="btn" style={{ background: '#eee', color: '#333' }} onClick={() => { setBatchPrintIssued(null); setSelectedIssued(new Set()); }}>Close</button>
            <button className="btn btn-primary" onClick={() => window.print()}><FileText size={18}/> Print All Selected (Inv + Att)</button>
          </div>
          
          <div style={{ maxWidth: '850px', margin: '0 auto' }}>
            {batchPrintIssued.map((inv) => {
              const linkedJO = jobOrders.find(j => String(j.id) === String(inv.joId));
              const linkedQuo = linkedJO ? quotations.find(q => String(q.id) === String(linkedJO.quotationId)) : null;
              
              const getPhotos = (val) => {
                if (!val) return [];
                if (Array.isArray(val)) return val;
                if (typeof val === 'string') {
                  if (val.startsWith('[') || val.startsWith('{')) {
                    try { return JSON.parse(val); } catch(e) { return [val]; }
                  }
                  return [val];
                }
                return [];
              };

              const operationalPhotos = Array.isArray(linkedJO?.photos) ? linkedJO.photos : [];
              const docs = [
                { src: inv.signedInvoicePhoto, label: 'SIGNED INVOICE' },
                { src: inv.signedReceiptPhoto, label: 'SIGNED STT (SURAT JALAN)' }
              ];
              const paymentPhotos = getPhotos(inv.paymentProofPhoto);
              paymentPhotos.forEach((p) => p && docs.push({ src: p, label: 'BUKTI PEMBAYARAN (PAYMENT PROOF)' }));
              const taxPhotos = getPhotos(inv.tax_deduction_proof);
              taxPhotos.forEach((p) => p && docs.push({ src: p, label: 'BUKTI POTONG PAJAK (TAX PROOF)' }));
              
              const allAtts = docs.filter(d => d.src);
              operationalPhotos.forEach(p => {
                if (p && !allAtts.find(ap => ap.src === p)) {
                  allAtts.push({ src: p, label: 'DOKUMENTASI OPERASIONAL' });
                }
              });

              return (
                <React.Fragment key={inv.id}>
                  {/* INVOICE PAGE */}
                  <div className="batch-issued-page" style={{ background: 'white', padding: '1.2cm', marginBottom: '40px', border: '1px solid #eee', boxShadow: '0 0 10px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '4px solid #1e293b', paddingBottom: '22px', marginBottom: '32px' }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <img src="/assets/logo.png" alt="Logo" style={{ width: '65px', height: '65px', objectFit: 'contain' }} />
                        <div>
                          <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#1e293b' }}>PT. ALPHA LOGISTICS PRAKARSA</h1>
                          <p style={{ margin: '3px 0 0 0', fontSize: '0.72rem', color: '#64748b' }}>Ruko The Summer B1-2A, Jl. Centre Point, Teluk Tering, Batam Kota, Batam</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--secondary)' }}>INVOICE</div>
                        <div style={{ marginTop: '6px', fontWeight: '800', fontSize: '0.95rem' }}>No: {inv.id}</div>
                      </div>
                    </div>
                    <div className="grid-responsive-2" style={{ gap: '40px', marginBottom: '36px' }}>
                      <div>
                        <p style={{ margin: '0 0 6px 0', fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>DITAGIHKAN KEPADA:</p>
                        <p style={{ margin: '0 0 4px 0', fontSize: '1.4rem', fontWeight: '900', color: '#1e293b' }}>{inv.customerName}</p>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>{inv.customerAddress || linkedQuo?.companyAddress || linkedJO?.address || customers.find(c => c.name === (inv.customerName || ''))?.address || 'Indonesia'}</p>
                      </div>
                      <div style={{ textAlign: 'right', fontSize:'0.85rem' }}>
                         <p style={{ margin:0 }}><strong>Tanggal:</strong> {formatDate(inv.date)}</p>
                         <p style={{ margin:0 }}><strong>JO Ref:</strong> {(() => { const ass = getAssociatedJOs(inv); return ass.length > 0 ? ass.map(j => j.id).join(', ') : inv.joId; })()}</p>
                      </div>
                    </div>
                    <div className="table-container"><div className="table-container"><table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                      <thead>
                        <tr style={{ background: '#1e293b', color: 'white' }}>
                          <th style={{ padding: '11px 14px', textAlign: 'left', fontSize: '0.72rem' }}>DESKRIPSI</th>
                          <th style={{ padding: '11px 14px', textAlign: 'right', fontSize: '0.72rem' }}>TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding:'15px 14px', borderBottom:'1px solid #eee' }}>
                             <div style={{ fontWeight:'800' }}>{linkedJO?.instruction || linkedJO?.jobDescription || 'Freight Forwarding Services'}</div>
                          </td>
                          <td style={{ padding:'15px 14px', textAlign:'right', fontWeight:'900' }}>
                             Rp {parseFloat(inv.subtotal || inv.amount).toLocaleString('id-ID')}
                          </td>
                        </tr>
                        {(inv.extra_charges || []).map((ec, i) => (
                          <tr key={i}>
                            <td style={{ padding:'10px 14px', fontSize:'0.85rem', color:'#475569', borderBottom:'1px solid #eee' }}>{ec.description}</td>
                            <td style={{ padding:'10px 14px', textAlign:'right', fontWeight:'700', borderBottom:'1px solid #eee' }}>Rp {parseFloat(ec.amount).toLocaleString('id-ID')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table></div></div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
                      <div style={{ background: '#1e293b', color: 'white', padding: '18px 30px', borderRadius: '12px', textAlign: 'right', minWidth: '280px' }}>
                        <div style={{ fontSize: '0.68rem', fontWeight: '800', color: '#94a3b8' }}>TOTAL DUE</div>
                        <div style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--secondary)' }}>Rp {parseFloat(inv.amount).toLocaleString('id-ID')}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>* Dokumen sah tanpa tanda tangan basah.</p>
                      <div style={{ textAlign: 'center', minWidth: '200px' }}>
                        <p style={{ margin: '0 0 50px 0', fontSize: '0.78rem', fontWeight: '900' }}>Hormat Kami,</p>
                        <div style={{ borderBottom: '2px solid #1e293b', width: '100%', marginBottom: '10px' }}></div>
                        <p style={{ margin: 0, fontWeight: '900' }}>PT. ALPHA LOGISTICS PRAKARSA</p>
                      </div>
                    </div>
                  </div>

                  {/* STT PAGE */}
                  <div className="batch-issued-page" style={{ background: 'white', padding: '1.5cm', marginBottom: '40px', border: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '4px solid #1e293b', paddingBottom: '20px', marginBottom: '40px' }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <img src="/assets/logo.png" alt="Logo" style={{ width: '60px', height: '60px' }} />
                        <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900' }}>PT. ALPHA LOGISTICS PRAKARSA</h1>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#64748b' }}>TANDA TERIMA</div>
                        <div style={{ fontWeight: '800' }}>NO: {inv.id}/STT</div>
                      </div>
                    </div>
                    <p>Telah diterima dokumen penagihan:</p>
                    <div style={{ background: '#f8fafc', padding: '25px', borderRadius: '12px', border:'1px solid #e2e8f0', marginBottom:'40px' }}>
                       <p><strong>No. Invoice:</strong> {inv.id}</p>
                       <p><strong>Customer:</strong> {inv.customerName}</p>
                       <p><strong>Total Tagihan:</strong> Rp {parseFloat(inv.amount).toLocaleString('id-ID')}</p>
                    </div>
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between' }}>
                       <div style={{ textAlign:'center', flex:1 }}>
                          <p style={{ marginBottom:'70px' }}>PENGIRIM,</p>
                          <div style={{ borderBottom:'2px solid #1e293b', width:'80%', margin:'0 auto' }}></div>
                       </div>
                       <div style={{ textAlign:'center', flex:1 }}>
                          <p style={{ marginBottom:'70px' }}>PENERIMA,</p>
                          <div style={{ borderBottom:'2px solid #1e293b', width:'80%', margin:'0 auto' }}></div>
                       </div>
                    </div>
                  </div>

                  {/* ATTACHMENT PAGES */}
                  {allAtts.map((att, attIdx) => (
                    <div key={attIdx} className="batch-issued-page" style={{ background: 'white', padding: '1.2cm', marginBottom: '40px', border: '1px solid #eee', display:'flex', flexDirection:'column' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #1e293b', paddingBottom: '15px', marginBottom: '25px' }}>
                          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                            <img src="/assets/logo.png" alt="Logo" style={{ width: '45px', height: '45px' }} />
                            <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: '900' }}>PT. ALPHA LOGISTICS PRAKARSA</h1>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: '900', color: '#64748b' }}>{att.label}</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '800' }}>Invoice: {inv.id}</div>
                          </div>
                       </div>
                       <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', border:'1px solid #eee', padding:'10px' }}>
                          <img src={att.src} style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain' }} />
                       </div>
                    </div>
                  ))}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {batchPrintPaidInvoices && (
        <div style={{ position: 'fixed', inset: 0, background: 'white', zIndex: 10000, color: 'black', overflowY: 'auto', padding: '20px' }}>
          <style>{`
            @media print {
              .batch-paid-page { 
                width: 210mm !important; 
                min-height: 297mm !important; 
                padding: 1.2cm !important; 
                margin: 0 !important;
                box-shadow: none !important;
                border: none !important;
                page-break-after: always !important;
                display: flex !important;
                flex-direction: column !important;
              }
              .no-print { display: none !important; }
              body { background: white !important; }
            }
          `}</style>
          <div className="no-print" style={{ position: 'sticky', top: '10px', right: '10px', display: 'flex', gap: '10px', justifyContent: 'flex-end', background: 'rgba(255,255,255,0.9)', padding: '10px', borderRadius: '8px', zIndex: 10001 }}>
            <button className="btn" style={{ background: '#eee', color: '#333' }} onClick={() => { setBatchPrintPaidInvoices(null); setSelectedLedger(new Set()); }}>Close</button>
            <button className="btn btn-primary" style={{ background:'var(--success)' }} onClick={() => window.print()}><FileText size={18}/> Print All Selected (Full Doc)</button>
          </div>
          
          <div style={{ maxWidth: '850px', margin: '0 auto' }}>
            {batchPrintPaidInvoices.map((inv) => {
              const linkedJO = jobOrders.find(j => String(j.id) === String(inv.joId));
              const linkedQuo = linkedJO ? quotations.find(q => String(q.id) === String(linkedJO.quotationId)) : null;
              
              const getPhotos = (val) => {
                if (!val) return [];
                if (Array.isArray(val)) return val;
                if (typeof val === 'string') {
                  if (val.startsWith('[') || val.startsWith('{')) {
                    try { return JSON.parse(val); } catch(e) { return [val]; }
                  }
                  return [val];
                }
                return [];
              };

              const operationalPhotos = Array.isArray(linkedJO?.photos) ? linkedJO.photos : [];
              const docs = [
                { src: inv.signedInvoicePhoto, label: 'SIGNED INVOICE' },
                { src: inv.signedReceiptPhoto, label: 'SIGNED STT (SURAT JALAN)' }
              ];
              const paymentPhotos = getPhotos(inv.paymentProofPhoto);
              paymentPhotos.forEach((p) => p && docs.push({ src: p, label: 'BUKTI PEMBAYARAN (PAYMENT PROOF)' }));
              const taxPhotos = getPhotos(inv.tax_deduction_proof);
              taxPhotos.forEach((p) => p && docs.push({ src: p, label: 'BUKTI POTONG PAJAK (TAX PROOF)' }));
              
              const allAtts = docs.filter(d => d.src);
              operationalPhotos.forEach(p => {
                if (p && !allAtts.find(ap => ap.src === p)) {
                  allAtts.push({ src: p, label: 'DOKUMENTASI OPERASIONAL' });
                }
              });

              return (
                <React.Fragment key={inv.id}>
                  {/* INVOICE PAGE */}
                  <div className="batch-paid-page" style={{ background: 'white', padding: '1.2cm', marginBottom: '40px', border: '1px solid #eee', boxShadow: '0 0 10px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '4px solid #1e293b', paddingBottom: '22px', marginBottom: '32px' }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <img src="/assets/logo.png" alt="Logo" style={{ width: '65px', height: '65px', objectFit: 'contain' }} />
                        <div>
                          <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#1e293b' }}>PT. ALPHA LOGISTICS PRAKARSA</h1>
                          <p style={{ margin: '3px 0 0 0', fontSize: '0.72rem', color: '#64748b' }}>Ruko The Summer B1-2A, Jl. Centre Point, Teluk Tering, Batam Kota, Batam</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--success)' }}>INVOICE</div>
                        <div style={{ marginTop: '6px', fontWeight: '800', fontSize: '0.95rem' }}>No: {inv.id}</div>
                        <div style={{ color: 'var(--success)', fontWeight: '900', fontSize: '0.8rem', marginTop: '5px' }}>SETTLED / PAID</div>
                      </div>
                    </div>
                    <div className="grid-responsive-2" style={{ gap: '40px', marginBottom: '36px' }}>
                      <div>
                        <p style={{ margin: '0 0 6px 0', fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>DITAGIHKAN KEPADA:</p>
                        <p style={{ margin: '0 0 4px 0', fontSize: '1.4rem', fontWeight: '900', color: '#1e293b' }}>{inv.customerName}</p>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>{linkedQuo?.companyAddress || linkedJO?.address || 'Indonesia'}</p>
                      </div>
                      <div style={{ textAlign: 'right', fontSize:'0.85rem' }}>
                         <p style={{ margin:0 }}><strong>Tanggal:</strong> {formatDate(inv.date)}</p>
                         <p style={{ margin:0 }}><strong>JO Ref:</strong> {(() => { const ass = getAssociatedJOs(inv); return ass.length > 0 ? ass.map(j => j.id).join(', ') : inv.joId; })()}</p>
                      </div>
                    </div>
                    <div className="table-container"><div className="table-container"><table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                      <thead>
                        <tr style={{ background: '#1e293b', color: 'white' }}>
                          <th style={{ padding: '11px 14px', textAlign: 'left', fontSize: '0.72rem' }}>DESKRIPSI</th>
                          <th style={{ padding: '11px 14px', textAlign: 'right', fontSize: '0.72rem' }}>TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding:'15px 14px', borderBottom:'1px solid #eee' }}>
                             <div style={{ fontWeight:'800' }}>{linkedJO?.instruction || linkedJO?.jobDescription || 'Freight Forwarding Services'}</div>
                          </td>
                          <td style={{ padding:'15px 14px', textAlign:'right', fontWeight:'900' }}>
                             Rp {parseFloat(inv.subtotal || inv.amount).toLocaleString('id-ID')}
                          </td>
                        </tr>
                        {(inv.extra_charges || []).map((ec, i) => (
                          <tr key={i}>
                            <td style={{ padding:'10px 14px', fontSize:'0.85rem', color:'#475569', borderBottom:'1px solid #eee' }}>{ec.description}</td>
                            <td style={{ padding:'10px 14px', textAlign:'right', fontWeight:'700', borderBottom:'1px solid #eee' }}>Rp {parseFloat(ec.amount).toLocaleString('id-ID')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table></div></div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
                      <div style={{ background: '#1e293b', color: 'white', padding: '18px 30px', borderRadius: '12px', textAlign: 'right', minWidth: '280px' }}>
                        <div style={{ fontSize: '0.68rem', fontWeight: '800', color: '#94a3b8' }}>TOTAL PELUNASAN</div>
                        <div style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--success)' }}>Rp {parseFloat(inv.amount).toLocaleString('id-ID')}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>* Dokumen pelunasan sah sistem.</p>
                      <div style={{ textAlign: 'center', minWidth: '200px' }}>
                        <p style={{ margin: '0 0 50px 0', fontSize: '0.78rem', fontWeight: '900' }}>Hormat Kami,</p>
                        <div style={{ borderBottom: '2px solid #1e293b', width: '100%', marginBottom: '10px' }}></div>
                        <p style={{ margin: 0, fontWeight: '900' }}>PT. ALPHA LOGISTICS PRAKARSA</p>
                      </div>
                    </div>
                  </div>

                  {/* STT PAGE */}
                  <div className="batch-paid-page" style={{ background: 'white', padding: '1.5cm', marginBottom: '40px', border: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '4px solid #1e293b', paddingBottom: '20px', marginBottom: '40px' }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <img src="/assets/logo.png" alt="Logo" style={{ width: '60px', height: '60px' }} />
                        <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900' }}>PT. ALPHA LOGISTICS PRAKARSA</h1>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#64748b' }}>TANDA TERIMA</div>
                        <div style={{ fontWeight: '800' }}>NO: {inv.id}/STT</div>
                      </div>
                    </div>
                    <p>Telah diterima dokumen pelunasan penagihan:</p>
                    <div style={{ background: '#f8fafc', padding: '25px', borderRadius: '12px', border:'1px solid #e2e8f0', marginBottom:'40px' }}>
                       <p><strong>No. Invoice:</strong> {inv.id}</p>
                       <p><strong>Customer:</strong> {inv.customerName}</p>
                       <p><strong>Total Terbayar:</strong> Rp {parseFloat(inv.amount).toLocaleString('id-ID')}</p>
                    </div>
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between' }}>
                       <div style={{ textAlign:'center', flex:1 }}>
                          <p style={{ marginBottom:'70px' }}>PENGIRIM,</p>
                          <div style={{ borderBottom:'2px solid #1e293b', width:'80%', margin:'0 auto' }}></div>
                       </div>
                       <div style={{ textAlign:'center', flex:1 }}>
                          <p style={{ marginBottom:'70px' }}>PENERIMA,</p>
                          <div style={{ borderBottom:'2px solid #1e293b', width:'80%', margin:'0 auto' }}></div>
                       </div>
                    </div>
                  </div>

                  {/* ATTACHMENT PAGES */}
                  {allAtts.map((att, attIdx) => (
                    <div key={attIdx} className="batch-paid-page" style={{ background: 'white', padding: '1.2cm', marginBottom: '40px', border: '1px solid #eee', display:'flex', flexDirection:'column' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #1e293b', paddingBottom: '15px', marginBottom: '25px' }}>
                          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                            <img src="/assets/logo.png" alt="Logo" style={{ width: '45px', height: '45px' }} />
                            <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: '900' }}>PT. ALPHA LOGISTICS PRAKARSA</h1>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: '900', color: '#64748b' }}>{att.label}</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '800' }}>Invoice: {inv.id}</div>
                          </div>
                       </div>
                       <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', border:'1px solid #eee', padding:'10px' }}>
                          <img src={att.src} style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain' }} />
                       </div>
                    </div>
                  ))}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}


      {batchPrintPOs && (
        <div style={{ position: 'fixed', inset: 0, background: 'white', zIndex: 10000, color: 'black', overflowY: 'auto', padding: '20px' }}>
          <style>{`
            @media print {
              .batch-po-page { 
                width: 210mm !important; 
                height: 297mm !important; 
                padding: 1.2cm !important; 
                margin: 0 !important;
                box-shadow: none !important;
                border: none !important;
                page-break-after: always !important;
              }
              .no-print { display: none !important; }
            }
          `}</style>
          <div className="no-print" style={{ position: 'sticky', top: '10px', right: '10px', display: 'flex', gap: '10px', justifyContent: 'flex-end', background: 'rgba(255,255,255,0.9)', padding: '10px', borderRadius: '8px', zIndex: 10001 }}>
            <button className="btn" style={{ background: '#eee', color: '#333' }} onClick={() => setBatchPrintPOs(null)}>Close</button>
            <button className="btn btn-primary" onClick={() => window.print()}><FileText size={18}/> Print All Selected Full Docs</button>
          </div>
          
          <div style={{ maxWidth: '850px', margin: '0 auto' }}>
            {batchPrintPOs.map((po) => {
              const getPhotos = (val) => {
                if (!val) return [];
                if (Array.isArray(val)) return val;
                if (typeof val === 'string') {
                  if (val.startsWith('[') || val.startsWith('{')) {
                    try { return JSON.parse(val); } catch(e) { return [val]; }
                  }
                  return [val];
                }
                return [];
              };

              const docs = [];
              const vendorInvPhotos = getPhotos(po.vendorInvoicePhoto);
              vendorInvPhotos.forEach(p => p && docs.push({ src: p, label: 'INVOICE VENDOR' }));
              const paymentPhotos = getPhotos(po.paymentProofPhoto);
              paymentPhotos.forEach(p => p && docs.push({ src: p, label: 'BUKTI PEMBAYARAN (PAYMENT PROOF)' }));
              const taxPhotos = getPhotos(po.tax_proof_photo);
              taxPhotos.forEach(p => p && docs.push({ src: p, label: 'BUKTI POTONG PAJAK (TAX PROOF)' }));
              const allPhotos = docs.filter(d => d.src);

              if (allPhotos.length === 0) return (
                <div key={po.id} className="batch-po-page" style={{ padding: '60px', textAlign: 'center', background:'white', marginBottom:'20px', border:'1px solid #eee' }}>
                   <h3 style={{color:'#1e293b'}}>PO ID: {po.id}</h3>
                   <p style={{color:'#94a3b8'}}>Tidak ada foto dokumentasi untuk PO ini.</p>
                </div>
              );

              return allPhotos.map((p, pIdx) => (
                <div key={`${po.id}-${pIdx}`} className="batch-po-page" style={{ background: 'white', padding: '1.2cm', marginBottom: '40px', border: '1px solid #eee', boxShadow: '0 0 10px rgba(0,0,0,0.05)', display:'flex', flexDirection:'column', minHeight:'297mm' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #1e293b', paddingBottom: '18px', marginBottom: '28px' }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <img src="/assets/logo.png" alt="Logo" style={{ width: '45px', height: '45px', objectFit: 'contain' }} />
                      <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: '900', color: '#1e293b' }}>PT. ALPHA LOGISTICS PRAKARSA</h1>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1rem', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>{p.label}</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#1e293b' }}>PO ID: {po.id}</div>
                    </div>
                  </div>

                  <div style={{ padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '0.75rem' }}>
                      {[
                        ['Vendor', po.vendorName],
                        ['Grand Total', `Rp ${parseFloat(po.grandTotal || 0).toLocaleString()}`],
                        ['Tanggal Pelunasan', po.paidDate],
                        ['Tax Name', po.tax_name || '-'],
                        ['Tax Amount', `Rp ${parseFloat(po.tax_amount || 0).toLocaleString()}`],
                        ['Job Order Ref', po.joId],
                      ].map(([l, v]) => (
                        <div key={l}>
                          <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase' }}>{l}</div>
                          <div style={{ fontWeight: '700', color: '#1e293b' }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '10px', border:'1px solid #eee', overflow:'hidden' }}>
                    <img src={p.src} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>

                  <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: 0 }}>Halaman {pIdx + 1} dari {allPhotos.length} — {po.id}</p>
                    <div style={{ textAlign: 'center', minWidth: '180px' }}>
                      <div style={{ borderBottom: '1px solid #1e293b', width: '100%', marginBottom: '6px' }}></div>
                      <p style={{ margin: 0, fontWeight: '800', fontSize: '0.8rem' }}>Accounting Division</p>
                    </div>
                  </div>
                </div>
              ));
            })}
          </div>
        </div>
      )}





      {/* JO Costing Modal */}
{/* JO Costing Modal */}
      {costModal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px' }}>
          <div className="glass-card" style={{ width:'100%',maxWidth:'700px',padding:'35px',maxHeight:'90vh',overflowY:'auto',position:'relative' }}>
            <button onClick={() => { setCostModal(null); setCostLines([{vendorId:'',serviceIdx:'',qty:1,customVendorName:'',customServiceDescription:'',customPrice:'',targetItemIdx:''}]); }} style={{ position:'absolute',top:'15px',right:'15px',background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer' }}><X size={20}/></button>
            <h3 style={{ color:'var(--secondary)',marginBottom:'8px',fontSize:'1.3rem' }}>{isID ? 'Input Biaya' : 'Input Cost'} — {costModal.id}</h3>
            <p style={{ color:'var(--text-muted)',fontSize:'0.85rem',marginBottom:'25px' }}>{isID ? 'Pelanggan:' : 'Customer:'} <strong style={{color:'var(--text)'}}>{costModal.customerName}</strong></p>

            {/* Existing costs */}
            {(() => {
              const manualCostsList = Array.isArray(costModal.costs) ? costModal.costs : [];
              const poCostsList = poMap[costModal.id] || [];
              const costAppsList = costAppMap[String(costModal.id)] || [];
              const hasRecordedCosts = manualCostsList.length > 0 || poCostsList.length > 0 || costAppsList.length > 0;

              if (!hasRecordedCosts) return null;

              const manualTotal = manualCostsList.reduce((s, c) => s + parseFloat(c.total || 0), 0);
              const poTotal = poCostsList.reduce((s, p) => s + parseFloat(p.grandTotal || 0), 0);
              const costAppTotal = costAppsList.filter(ca => ca.status !== 'rejected').reduce((s, ca) => s + parseFloat(ca.amount || 0), 0);
              const grandTotal = manualTotal + poTotal + costAppTotal;

              return (
                <div style={{ marginBottom:'25px' }}>
                  <div style={{ fontSize:'0.75rem',color:'var(--secondary)',fontWeight:'700',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'10px' }}>{isID ? 'Biaya & Pengeluaran Tercatat' : 'Recorded Costs & Expenses'}</div>
                  <div className="table-container"><table style={{ width:'100%',borderCollapse:'collapse',fontSize:'0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom:'1px solid var(--glass-border)',color:'var(--text-muted)' }}>
                        <th style={{padding:'8px',textAlign:'left'}}>{isID ? 'Vendor / Sumber' : 'Vendor / Source'}</th>
                        <th style={{padding:'8px',textAlign:'left'}}>{isID ? 'Layanan / Deskripsi' : 'Service / Description'}</th>
                        <th style={{padding:'8px',textAlign:'center'}}>{isID ? 'Jenis' : 'Type'}</th>
                        <th style={{padding:'8px',textAlign:'right'}}>Total</th>
                        <th style={{padding:'8px',textAlign:'right'}}>{isID ? 'Aksi' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {manualCostsList.map((c, ci) => (
                        <tr key={`mc-${ci}`} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                          <td className="word-wrap-cell" style={{padding:'8px',color:'var(--text-muted)'}}>{c.vendorName || c.customVendorName || (isID ? 'Vendor Kustom' : 'Custom Vendor')}</td>
                          <td className="word-wrap-cell" style={{padding:'8px'}}>{c.serviceDescription || c.customServiceDescription || '—'}</td>
                          <td style={{padding:'8px',textAlign:'center'}}><span style={{ fontSize: '0.62rem', background: 'rgba(212, 175, 55, 0.1)', color: 'var(--secondary)', border: '1px solid rgba(212, 175, 55, 0.25)', padding: '2px 6px', borderRadius: '4px' }}>Manual</span></td>
                          <td style={{padding:'8px',textAlign:'right',fontWeight:'700',color:'var(--secondary)'}}>Rp {(c.total||0).toLocaleString(isID ? 'id-ID' : 'en-US')}</td>
                          <td style={{padding:'8px',textAlign:'right'}}>
                            {canWrite && (
                              <button className="btn btn-sm btn-danger" style={{ padding: '4px 8px', fontSize: '0.72rem' }} onClick={() => handleDeleteCost(costModal, ci)}>
                                {isID ? 'Hapus' : 'Delete'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {poCostsList.map((p, pi) => (
                        <tr key={`po-${pi}`} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                          <td className="word-wrap-cell" style={{padding:'8px',color:'var(--text-muted)'}}>{p.vendorName || 'PO Vendor'}</td>
                          <td className="word-wrap-cell" style={{padding:'8px'}}>{p.items?.map(i => i.serviceDescription).join(', ') || (isID ? 'Layanan PO' : 'PO Services')}</td>
                          <td style={{padding:'8px',textAlign:'center'}}><span style={{ fontSize: '0.62rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.25)', padding: '2px 6px', borderRadius: '4px' }}>PO: {p.poNumber || p.id}</span></td>
                          <td style={{padding:'8px',textAlign:'right',fontWeight:'700',color:'#3b82f6'}}>Rp {(p.grandTotal||0).toLocaleString(isID ? 'id-ID' : 'en-US')}</td>
                          <td style={{padding:'8px',textAlign:'right'}}>
                            {canWrite && (
                              <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                                <button 
                                  className="btn btn-sm" 
                                  style={{ padding: '4px 8px', fontSize: '0.72rem', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', border: '1px solid rgba(245, 158, 11, 0.3)' }}
                                  onClick={() => handleUnlinkPOFromModal(p)}
                                  title={isID ? "Lepas kaitan dari JO ini (PO tetap ada di Hutang)" : "Unlink from this JO (PO remains in Payables)"}
                                >
                                  {isID ? 'Lepas' : 'Unlink'}
                                </button>
                                <button 
                                  className="btn btn-sm btn-danger" 
                                  style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                                  onClick={() => handleDeletePOFromModal(p)}
                                  title={isID ? "Hapus PO permanen dari sistem" : "Delete PO permanently"}
                                >
                                  {isID ? 'Hapus' : 'Delete'}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {costAppsList.map((ca, cai) => {
                        const caStatus = ca.status || 'pending';
                        const statusBg = caStatus === 'paid' || caStatus === 'released' ? 'rgba(34, 197, 94, 0.1)' : caStatus === 'approved' ? 'rgba(59, 130, 246, 0.1)' : caStatus === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)';
                        const statusColor = caStatus === 'paid' || caStatus === 'released' ? '#22c55e' : caStatus === 'approved' ? '#3b82f6' : caStatus === 'rejected' ? '#ef4444' : '#f59e0b';
                        const statusLabel = caStatus === 'paid' || caStatus === 'released' ? (isID ? 'Cair' : 'Released') : caStatus === 'approved' ? (isID ? 'Disetujui' : 'Approved') : caStatus === 'rejected' ? (isID ? 'Ditolak' : 'Rejected') : (isID ? 'Menunggu' : 'Pending');
                        const itemDesc = Array.isArray(ca.items) ? ca.items.map(it => it.details).filter(Boolean).join(', ') : (ca.notes || '—');

                        return (
                          <tr key={`ca-${cai}`} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                            <td className="word-wrap-cell" style={{padding:'8px',color:'var(--text-muted)'}}>{ca.employeeName || ca.requestedBy || (isID ? 'Pengajuan Biaya' : 'Cost App')}</td>
                            <td className="word-wrap-cell" style={{padding:'8px'}}>{itemDesc}</td>
                            <td style={{padding:'8px',textAlign:'center'}}>
                              <div style={{ display: 'flex', gap: '3px', justifyContent: 'center' }}>
                                <span style={{ fontSize: '0.62rem', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.25)', padding: '2px 6px', borderRadius: '4px' }}>Cost App: {ca.id}</span>
                                <span style={{ fontSize: '0.62rem', background: statusBg, color: statusColor, border: `1px solid ${statusColor}40`, padding: '2px 6px', borderRadius: '4px' }}>{statusLabel}</span>
                              </div>
                            </td>
                            <td style={{padding:'8px',textAlign:'right',fontWeight:'700',color: caStatus === 'rejected' ? 'var(--text-muted)' : '#a855f7', textDecoration: caStatus === 'rejected' ? 'line-through' : 'none'}}>Rp {(ca.amount||0).toLocaleString(isID ? 'id-ID' : 'en-US')}</td>
                            <td style={{padding:'8px',textAlign:'right'}}>
                              {canWrite && (
                                <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                                  {caStatus !== 'rejected' && (
                                    <button 
                                      className="btn btn-sm" 
                                      style={{ padding: '4px 8px', fontSize: '0.72rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                                      onClick={() => handleRejectCostAppFromModal(ca)}
                                      title={isID ? "Tolak pengajuan biaya (tidak dihitung dalam Laba/Rugi)" : "Reject cost application (excluded from P&L)"}
                                    >
                                      {isID ? 'Tolak' : 'Reject'}
                                    </button>
                                  )}
                                  <button 
                                    className="btn btn-sm" 
                                    style={{ padding: '4px 8px', fontSize: '0.72rem', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', border: '1px solid rgba(245, 158, 11, 0.3)' }}
                                    onClick={() => handleUnlinkCostAppFromModal(ca)}
                                    title={isID ? "Lepas kaitan dari JO ini (tetap ada sebagai pengeluaran operasional umum)" : "Unlink from this JO (remains as general operational expense)"}
                                  >
                                    {isID ? 'Lepas' : 'Unlink'}
                                  </button>
                                  <button 
                                    className="btn btn-sm btn-danger" 
                                    style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                                    onClick={() => handleDeleteCostAppFromModal(ca)}
                                    title={isID ? "Hapus pengajuan permanen dari sistem" : "Delete application permanently"}
                                  >
                                    {isID ? 'Hapus' : 'Delete'}
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      <tr style={{ borderTop:'2px solid var(--glass-border)' }}>
                        <td colSpan="3" style={{padding:'10px 8px',fontWeight:'700',textAlign:'right'}}>{isID ? 'Grand Total Biaya' : 'Grand Total Cost'}</td>
                        <td style={{padding:'10px 8px',textAlign:'right',fontWeight:'800',color:'var(--danger)',fontSize:'1.1rem'}}>Rp {grandTotal.toLocaleString(isID ? 'id-ID' : 'en-US')}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table></div>
                </div>
              );
            })()}

            {/* Add new cost lines */}
            <div style={{ fontSize:'0.75rem',color:'var(--secondary)',fontWeight:'700',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'12px' }}>{isID ? 'Tambah Biaya Baru' : 'Add New Cost'}</div>
            <>
              {costLines.map((line, i) => {
                const selVendor = line.vendorId && line.vendorId !== 'custom' ? vendorList.find(v => v.id === line.vendorId) : null;
                const selSvc = selVendor && line.serviceIdx && line.serviceIdx !== 'custom' ? selVendor.services?.[parseInt(line.serviceIdx)] : null;
                const unitPrice = (line.vendorId === 'custom' || line.serviceIdx === 'custom') ? parseFloat(line.customPrice || 0) : parseFloat(selSvc?.price || 0);
                const lineTotal = unitPrice * parseFloat(line.qty || 1);
                return (
                  <div key={i} style={{ padding:'12px', background:'rgba(255,255,255,0.02)', border:'1px solid var(--glass-border)', borderRadius:'10px', marginBottom:'12px' }}>
                    <div className="cost-input-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px', alignItems: 'center' }}>
                       <select value={line.vendorId} onChange={e=>updateCostLine(i,'vendorId',e.target.value)} style={{ padding:'9px',background:'var(--input-bg)',border:'1px solid var(--border)',borderRadius:'8px',color:'var(--secondary)',fontWeight:'600',fontSize:'0.85rem',width:'100%' }}>
                        <option value="" style={{color:'var(--text-muted)', background:'var(--bg)'}}>-- {isID ? 'Pilih Vendor' : 'Select Vendor'} --</option>
                        {vendorList.map(v=><option key={v.id} value={v.id} style={{color:'var(--text)', background:'var(--bg)'}}>{v.name}</option>)}
                        <option value="custom" style={{color:'var(--secondary)', background:'var(--bg)', fontWeight:'bold'}}>-- {isID ? 'Custom Vendor' : 'Custom Vendor'} --</option>
                       </select>

                       <select 
                        value={line.serviceIdx} 
                        onChange={e=>updateCostLine(i,'serviceIdx',e.target.value)} 
                        disabled={!line.vendorId || line.vendorId === 'custom'} 
                        style={{ padding:'9px',background:'var(--input-bg)',border:'1px solid var(--border)',borderRadius:'8px',color:'var(--secondary)',fontWeight:'600',fontSize:'0.85rem',width:'100%' }}
                       >
                        <option value="" style={{color:'var(--text-muted)', background:'var(--bg)'}}>-- {isID ? 'Pilih Layanan' : 'Select Service'} --</option>
                        {line.vendorId !== 'custom' && (selVendor?.services||[]).map((s,si)=>{
                          const optionTotal = parseFloat(s.price || 0) * parseFloat(line.qty || 1);
                          return (
                            <option key={si} value={si} style={{color:'var(--text)', background:'var(--bg)'}}>
                              {s.description} (Rp {optionTotal.toLocaleString(isID ? 'id-ID' : 'en-US')})
                            </option>
                          );
                        })}
                        {line.vendorId && line.vendorId !== 'custom' && (
                          <option value="custom" style={{color:'var(--secondary)', background:'var(--bg)', fontWeight:'bold'}}>-- {isID ? 'Custom Layanan' : 'Custom Service'} --</option>
                        )}
                       </select>

                       {Array.isArray(costModal?.items) && costModal.items.length > 0 && (
                         <select 
                           value={line.targetItemIdx || ''} 
                           onChange={e=>updateCostLine(i,'targetItemIdx',e.target.value)} 
                           style={{ padding:'9px',background:'var(--input-bg)',border:'1px solid var(--border)',borderRadius:'8px',color:'var(--secondary)',fontWeight:'600',fontSize:'0.85rem',width:'100%' }}
                         >
                           <option value="" style={{color:'var(--text-muted)', background:'var(--bg)'}}>-- {isID ? 'Pilih Item JO' : 'Select JO Item'} --</option>
                           {costModal.items.map((item, itemIdx) => (
                             <option key={itemIdx} value={itemIdx} style={{color:'var(--text)', background:'var(--bg)'}}>
                               {item.description}
                             </option>
                           ))}
                         </select>
                       )}

                       <input type="number" min="1" step="any" value={line.qty} onChange={e=>updateCostLine(i,'qty',e.target.value)} placeholder="Qty" style={{ padding:'9px',background:'var(--input-bg)',border:'1px solid var(--border)',borderRadius:'8px',color:'var(--text)',fontSize:'0.85rem',textAlign:'center',width:'100%' }}/>
                      
                       <div style={{ fontSize:'0.85rem',color:'var(--secondary)',fontWeight:'600',padding:'9px',background:'rgba(255,255,255,0.03)',borderRadius:'8px',border:'1px solid var(--glass-border)',width:'100%',boxSizing:'border-box',textAlign:'center' }}>
                        Rp {lineTotal.toLocaleString(isID ? 'id-ID' : 'en-US')}
                       </div>
                      
                       <button onClick={()=>removeCostLine(i)} disabled={costLines.length===1} style={{ background:'var(--danger-bg)',color:'var(--danger)',border:'none',borderRadius:'8px',height:'36px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',width:'100%' }}><X size={14}/></button>
                    </div>

                    {/* Custom Fields Sub-row */}
                    {(line.vendorId === 'custom' || line.serviceIdx === 'custom') && (
                      <div className={line.vendorId === 'custom' ? "custom-fields-grid-3" : "custom-fields-grid-2"}>
                        {line.vendorId === 'custom' && (
                          <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                            <span style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:'600', textTransform:'uppercase' }}>{isID ? 'Nama Vendor Custom' : 'Custom Vendor Name'}</span>
                            <input 
                              type="text" 
                              value={line.customVendorName || ''} 
                              onChange={e=>updateCostLine(i,'customVendorName',e.target.value)} 
                              placeholder={isID ? "Nama Vendor" : "Vendor Name"} 
                              style={{ padding:'8px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'6px', color:'var(--text)', fontSize:'0.8rem' }}
                            />
                          </div>
                        )}
                        <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                          <span style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:'600', textTransform:'uppercase' }}>{isID ? 'Deskripsi Layanan' : 'Service Description'}</span>
                          <input 
                            type="text" 
                            value={line.customServiceDescription || ''} 
                            onChange={e=>updateCostLine(i,'customServiceDescription',e.target.value)} 
                            placeholder={isID ? "Deskripsi Layanan" : "Service Description"} 
                            style={{ padding:'8px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'6px', color:'var(--text)', fontSize:'0.8rem' }}
                          />
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                          <span style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:'600', textTransform:'uppercase' }}>{isID ? 'Harga Satuan' : 'Unit Price'}</span>
                          <input 
                            type="number" 
                            min="0" 
                            step="any" 
                            value={line.customPrice || ''} 
                            onChange={e=>updateCostLine(i,'customPrice',e.target.value)} 
                            placeholder={isID ? "Harga Satuan (Rp)" : "Unit Price (Rp)"} 
                            style={{ padding:'8px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'6px', color:'var(--text)', fontSize:'0.8rem' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <button onClick={addCostLine} style={{ width:'100%',padding:'8px',background:'rgba(212,175,55,0.08)',color:'var(--secondary)',border:'1px dashed var(--secondary)',borderRadius:'8px',cursor:'pointer',fontSize:'0.85rem',marginBottom:'20px' }}>+ {isID ? 'Tambah Baris Biaya' : 'Add Cost Line'}</button>
              <div style={{ display:'flex',gap:'12px' }}>
                <button onClick={()=>{ setCostModal(null); setCostLines([{vendorId:'',serviceIdx:'',qty:1,customVendorName:'',customServiceDescription:'',customPrice:'',targetItemIdx:''}]); }} className="btn" style={{ flex:1,background:'rgba(255,255,255,0.05)',border:'1px solid var(--border)',color:'var(--text)' }}>{isID ? 'Batal' : 'Cancel'}</button>
                <ButtonWithLoading onClick={handleSaveCosts} className="btn btn-gold" style={{ flex: 2 }}><CheckCircle size={16}/> {isID ? 'Simpan Biaya' : 'Save Cost'}</ButtonWithLoading>
              </div>
            </>
          </div>
        </div>
      )}

      <h3 className="shimmer-text" style={{ fontSize: '1.8rem', marginBottom: '30px' }}>{isID ? 'Hub Manajemen Keuangan' : 'Financial Management Hub'}</h3>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '30px', flexWrap:'wrap' }}>
        <button
          onClick={() => setActiveTab('billing')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '11px 22px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', transition: 'all 0.2s',
            background: activeTab === 'billing' ? 'linear-gradient(135deg, var(--info), #1d4ed8)' : 'rgba(255,255,255,0.05)',
            color: activeTab === 'billing' ? '#ffffff' : 'var(--text-muted)',
            boxShadow: activeTab === 'billing' ? '0 4px 15px rgba(59,130,246,0.4)' : 'none',
            border: activeTab === 'billing' ? 'none' : '1px solid var(--glass-border)'
          }}
        >
          <Receipt size={17} /> {isID ? 'Penagihan & Invoice' : 'Billing & Invoices'}
        </button>

        <button
          onClick={() => setActiveTab('costing')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '11px 22px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', transition: 'all 0.2s',
            background: activeTab === 'costing' ? 'linear-gradient(135deg, var(--secondary), #a07d1c)' : 'rgba(255,255,255,0.05)',
            color: activeTab === 'costing' ? '#1a1200' : 'var(--text-muted)',
            boxShadow: activeTab === 'costing' ? '0 4px 15px rgba(212,175,55,0.4)' : 'none',
            border: activeTab === 'costing' ? 'none' : '1px solid var(--glass-border)'
          }}
        >
          <DollarSign size={17} /> {isID ? 'Laba & Rugi' : 'Profit and Loss'}
          {activeJOs.length > 0 && (
            <span style={{ background: activeTab === 'costing' ? 'rgba(0,0,0,0.2)' : 'var(--secondary-border)', color: activeTab === 'costing' ? '#1a1200' : 'var(--secondary)', borderRadius: '20px', padding: '1px 8px', fontSize: '0.72rem', fontWeight: '800' }}>
              {activeJOs.length}
            </span>
          )}
        </button>

          <button
            onClick={() => setActiveTab('piutang')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '11px 22px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', transition: 'all 0.2s',
              background: activeTab === 'piutang' ? 'linear-gradient(135deg, var(--success), #047857)' : 'rgba(255,255,255,0.05)',
              color: activeTab === 'piutang' ? '#ffffff' : 'var(--text-muted)',
              boxShadow: activeTab === 'piutang' ? '0 4px 15px rgba(16,185,129,0.4)' : 'none',
              border: activeTab === 'piutang' ? 'none' : '1px solid var(--glass-border)'
            }}
          >
            <Wallet size={17} /> {isID ? 'Piutang & Receivable' : 'Receivables & Piutang'}
        </button>

        <button
          onClick={() => setActiveTab('salary')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '11px 22px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', transition: 'all 0.2s',
            background: activeTab === 'salary' ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : 'rgba(255,255,255,0.05)',
            color: activeTab === 'salary' ? '#ffffff' : 'var(--text-muted)',
            boxShadow: activeTab === 'salary' ? '0 4px 15px rgba(139,92,246,0.4)' : 'none',
            border: activeTab === 'salary' ? 'none' : '1px solid var(--glass-border)'
          }}
        >
          <User size={17} /> {isID ? 'Biaya Gaji' : 'Payroll & Salaries'}
        </button>

        <button
          onClick={() => setActiveTab('other_expenses')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '11px 22px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', transition: 'all 0.2s',
            background: activeTab === 'other_expenses' ? 'linear-gradient(135deg, #ec4899, #be185d)' : 'rgba(255,255,255,0.05)',
            color: activeTab === 'other_expenses' ? '#ffffff' : 'var(--text-muted)',
            boxShadow: activeTab === 'other_expenses' ? '0 4px 15px rgba(236,72,153,0.4)' : 'none',
            border: activeTab === 'other_expenses' ? 'none' : '1px solid var(--glass-border)'
          }}
        >
          <Briefcase size={17} /> {isID ? 'Pemasukan & Pengeluaran' : 'Income & Expenses'}
        </button>

        {(context?.user?.role === 'accounting' || context?.user?.role === 'owner') && (
          <button
            onClick={() => setActiveTab('reimbursements')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '11px 22px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', transition: 'all 0.2s',
              background: activeTab === 'reimbursements' ? 'linear-gradient(135deg, #14b8a6, #0f766e)' : 'rgba(255,255,255,0.05)',
              color: activeTab === 'reimbursements' ? '#ffffff' : 'var(--text-muted)',
              boxShadow: activeTab === 'reimbursements' ? '0 4px 15px rgba(20,184,166,0.4)' : 'none',
              border: activeTab === 'reimbursements' ? 'none' : '1px solid var(--glass-border)'
            }}
          >
            <Receipt size={17} /> {isID ? 'Reimbursement' : 'Reimbursements'}
          </button>
        )}

        <button
          onClick={() => setActiveTab('hutang')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '11px 22px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', transition: 'all 0.2s',
            background: activeTab === 'hutang' ? 'linear-gradient(135deg, var(--warning), #d97706)' : 'rgba(255,255,255,0.05)',
            color: activeTab === 'hutang' ? '#ffffff' : 'var(--text-muted)',
            boxShadow: activeTab === 'hutang' ? '0 4px 15px rgba(245,158,11,0.4)' : 'none',
            border: activeTab === 'hutang' ? 'none' : '1px solid var(--glass-border)'
          }}
        >
          <Banknote size={17} /> {isID ? 'Hutang & Payable' : 'Payables & Hutang'}
        </button>

        <button
          onClick={() => setActiveTab('detail_report')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '11px 22px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', transition: 'all 0.2s',
            background: activeTab === 'detail_report' ? 'linear-gradient(135deg, #6366f1, #4338ca)' : 'rgba(255,255,255,0.05)',
            color: activeTab === 'detail_report' ? '#ffffff' : 'var(--text-muted)',
            boxShadow: activeTab === 'detail_report' ? '0 4px 15px rgba(99,102,241,0.4)' : 'none',
            border: activeTab === 'detail_report' ? 'none' : '1px solid var(--glass-border)'
          }}
        >
          <FileText size={17} /> {isID ? 'Laporan Rinci' : 'Detail Report'}
        </button>

        {canWrite && (
          <button
            onClick={() => setShowBankSettings(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '11px 22px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', transition: 'all 0.2s',
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text-muted)',
              border: '1px solid var(--glass-border)',
              marginLeft: 'auto'
            }}
          >
            <Settings size={17} /> {isID ? 'Rekening Bank' : 'Bank Accounts'}
          </button>
        )}

        {canWrite && activeTab === 'billing' && (
          <button
            onClick={() => {
              const dateVal = new Date().toISOString().substring(0, 10);
              setCustomInvoiceForm({
                id: '',
                joId: '',
                customerName: '',
                date: dateVal,
                taxPercent: 0,
                items: [{ description: '', qty: 1, rate: 0 }],
                notes: ''
              });
              setShowCustomInvoiceModal(true);

              // Fetch next invoice ID asynchronously
              apiRequest('invoices/next-number')
                .then(res => {
                  if (res && res.nextInvoiceId) {
                    setCustomInvoiceForm(prev => prev.id === '' ? { ...prev, id: res.nextInvoiceId } : prev);
                  }
                })
                .catch(err => {
                  console.error('Failed to fetch next invoice ID:', err);
                });
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '11px 22px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', transition: 'all 0.2s',
              background: 'linear-gradient(135deg, var(--success), #059669)',
              color: '#ffffff',
              border: 'none',
              boxShadow: '0 4px 15px var(--success-border)',
              marginLeft: '12px'
            }}
          >
            <Plus size={17} /> {isID ? 'Buat Invoice Kustom' : 'Create Custom Invoice'}
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '20px 25px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', background: 'rgba(255,255,255,0.03)', marginBottom: '30px' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
          <input id="accounting-search" aria-label={isID ? "Cari Invoice, Pelanggan, JO..." : "Search Invoices, Customers, JOs..."} type="text" placeholder={isID ? "Cari Invoice, Pelanggan, JO..." : "Search Invoices, Customers, JOs..."} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '10px 15px 10px 40px', borderRadius: '10px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
        {(activeTab === 'billing' || activeTab === 'costing') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor="jo-sort" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{isID ? 'Urutkan JO:' : 'Sort JOs:'}</label>
            <select 
              id="jo-sort"
              value={joSortBy} 
              onChange={(e) => setJoSortBy(e.target.value)}
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
        )}
        {(activeTab === 'billing' || activeTab === 'piutang') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor="invoice-sort" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{isID ? 'Urutkan Invoice:' : 'Sort Invoices:'}</label>
            <select 
              id="invoice-sort"
              value={invoiceSortBy} 
              onChange={(e) => setInvoiceSortBy(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
            >
              <option value="inv_no_desc">{isID ? 'Nomor Invoice (Terbesar)' : 'Invoice Number (Highest First)'}</option>
              <option value="inv_no_asc">{isID ? 'Nomor Invoice (Terkecil)' : 'Invoice Number (Lowest First)'}</option>
              <option value="date_desc">{isID ? 'Tanggal Invoice (Terbaru)' : 'Invoice Date (Newest First)'}</option>
              <option value="date_asc">{isID ? 'Tanggal Invoice (Terlama)' : 'Invoice Date (Oldest First)'}</option>
              <option value="client_asc">{isID ? 'Nama Pelanggan (A-Z)' : 'Customer Name (A-Z)'}</option>
              <option value="client_desc">{isID ? 'Nama Pelanggan (Z-A)' : 'Customer Name (Z-A)'}</option>
              <option value="amount_desc">{isID ? 'Jumlah (Terbesar)' : 'Amount (Highest First)'}</option>
              <option value="amount_asc">{isID ? 'Jumlah (Terkecil)' : 'Amount (Lowest First)'}</option>
            </select>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>{isID ? 'Filter Tanggal:' : 'Date Filter:'}</span>
          <input id="accounting-start-date" aria-label={isID ? "Tanggal Mulai" : "Start Date"} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.85rem' }} />
          <span style={{ color: 'var(--text-muted)' }}>{isID ? 's/d' : 'to'}</span>
          <input id="accounting-end-date" aria-label={isID ? "Tanggal Akhir" : "End Date"} type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.85rem' }} />
          {(startDate || endDate || searchTerm || categoryFilter !== 'all' || subcategoryFilter !== 'all') && (
            <button onClick={() => { setStartDate(''); setEndDate(''); setSearchTerm(''); setCategoryFilter('all'); setSubcategoryFilter('all'); }} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600' }}>Reset</button>
          )}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-gold" onClick={handleExport} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <FileSpreadsheet size={18} /> {isID ? 'Ekspor Excel' : 'Export Excel'}
          </button>
        </div>
      </div>

      {activeTab === 'costing' ? (
        <div className="glass-card" style={{ padding:'25px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px', flexWrap:'wrap', gap:'15px' }}>
            <div>
              <h4 style={{ margin:0, display:'flex', alignItems:'center', gap:'10px' }}><DollarSign size={20} style={{color:'var(--secondary)'}}/>{isID ? 'Laba & Rugi' : 'Profit and Loss'}</h4>
              <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', marginTop:'5px', marginBottom:0 }}>{isID ? 'Semua Job Order yang telah diterbitkan dari Admin Office. Biaya hanya dapat dipilih dari Vendor List tervalidasi.' : 'All Job Orders issued from the Admin Office. Costs can only be selected from the validated Vendor List.'}</p>
            </div>
            <div style={{ display:'flex', gap:'15px', flexShrink:0 }}>
              {[
                {label: isID ? 'Total JO' : 'Total JO', val:activeJOs.length, color:'var(--secondary)'},
                {label: isID ? 'Total Pendapatan' : 'Total Revenue', val:'Rp ' + plFinancials.revenue.toLocaleString('id-ID'), color:'var(--success)'},
                {label: isID ? 'Total Biaya' : 'Total Cost', val:'Rp ' + plFinancials.cost.toLocaleString('id-ID'), color:'var(--danger)'},
                {label: isID ? 'Total Laba' : 'Total Profit', val:'Rp ' + (plFinancials.revenue - plFinancials.cost).toLocaleString('id-ID'), color: (plFinancials.revenue - plFinancials.cost) >= 0 ? 'var(--success)' : 'var(--danger)'}
              ].map(stat=>(
                <div key={stat.label} style={{ textAlign:'center', background:'rgba(255,255,255,0.03)', border:'1px solid var(--glass-border)', borderRadius:'10px', padding:'10px 16px', minWidth: '120px' }}>
                  <div style={{ fontSize:'1rem', fontWeight:'800', color:stat.color }}>{stat.val}</div>
                  <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          {activeJOs.length === 0 ? (
            <div style={{ textAlign:'center',padding:'60px',color:'var(--text-muted)' }}>
              <DollarSign size={48} style={{ opacity:0.2,display:'block',margin:'0 auto 15px' }}/>
              <p style={{ fontWeight:'600',marginBottom:'6px' }}>{isID ? 'Belum ada Job Order diterbitkan' : 'No Job Orders issued yet'}</p>
              <p style={{ fontSize:'0.85rem' }}>{isID ? 'Buat dan dispatch Job Order dari halaman Admin Office agar muncul di sini.' : 'Create and dispatch Job Orders from the Admin Office page to make them appear here.'}</p>
            </div>
          ) : (
            <div className="table-container"><div className="table-container"><table style={{ width:'100%',borderCollapse:'collapse',minWidth:'900px' }}>
              <thead>
                <tr style={{ textAlign:'left', borderBottom:'2px solid var(--gold-metallic)' }}>
                   <th style={{padding:'12px'}}>JO Ref</th>
                   <th style={{padding:'12px'}}>{isID ? 'Pelanggan' : 'Customer'}</th>
                   <th style={{padding:'12px'}}>{isID ? 'No Invoice' : 'Inv ID'}</th>
                   <th style={{padding:'12px'}}>{isID ? 'Tgl Invoice' : 'Inv Date'}</th>
                   <th style={{padding:'12px'}}>Status</th>
                   <th style={{padding:'12px', textAlign:'right'}}>{isID ? 'Pendapatan (Inv)' : 'Revenue (Inv)'}</th>
                   <th style={{padding:'12px', textAlign:'right'}}>{isID ? 'Total Biaya' : 'Total Cost'}</th>
                   <th style={{padding:'12px', textAlign:'right'}}>{isID ? 'Laba/Rugi' : 'Profit/Loss'}</th>
                   <th style={{padding:'12px', textAlign:'center'}}>{isID ? 'Aksi' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {groupedPLData.map(group => {
                  const isExpanded = expandedPLGroups[group.key] === true;
                  const groupFin = plGroupFinancials[group.key] || { cost: 0, revenue: 0, profitLoss: 0 };
                  
                  if (group.type === 'single') {
                    const jo = group.jobOrders[0];
                    const hasItems = Array.isArray(jo.items) && jo.items.length > 0;

                    if (hasItems) {
                      const manualCostTotal = Array.isArray(jo.costs) ? jo.costs.reduce((s, c) => s + parseFloat(c.total || 0), 0) : 0;
                      const poCostTotal = (poMap[jo.id] || []).reduce((s, p) => s + parseFloat(p.grandTotal || 0), 0);
                      const costAppTotal = (costAppMap[String(jo.id)] || []).filter(ca => ca.status !== 'rejected').reduce((s, ca) => s + (parseFloat(ca.amount) || 0), 0);
                      const totalCost = manualCostTotal + poCostTotal + costAppTotal;

                      const invoice = joInvoiceMap[String(jo.id)];
                      const revenue = invoice ? parseFloat(invoice.amount || invoice.subtotal || 0) : jo.items.reduce((s, item) => s + parseFloat(item.rate || 0) * parseFloat(item.issueQuantity || item.quantity || 1), 0);
                      const profitLoss = revenue - totalCost;
                      const isJoExpanded = expandedJOPL[jo.id] === true;

                      return (
                        <React.Fragment key={jo.id}>
                          <tr 
                            style={{ borderBottom: '1px solid var(--glass-border)', cursor: 'pointer' }} 
                            className="table-row-hover"
                            onClick={() => setExpandedJOPL({ ...expandedJOPL, [jo.id]: !isJoExpanded })}
                          >
                            <td style={{ padding: '12px', fontWeight: '700', color: 'var(--secondary)', fontSize: '0.85rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>{isJoExpanded ? '📂' : '📁'}</span>
                                <span>{jo.id}</span>
                              </div>
                            </td>
                            <td style={{ padding: '12px', fontWeight: '600' }}>{jo.customerName}</td>
                            <td style={{ padding: '12px', fontSize: '0.8rem', fontWeight: '700', color: 'var(--secondary)' }}>
                              {invoice ? invoice.id : <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>{isID ? 'Belum Ada' : 'None Yet'}</span>}
                            </td>
                            <td style={{ padding: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {invoice ? new Date(invoice.date).toLocaleDateString() : '—'}
                            </td>
                            <td style={{ padding: '12px' }}><span className={`badge badge-${jo.status}`} style={{ fontSize: '0.7rem' }}>{jo.status}</span></td>
                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: revenue > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                              {revenue > 0 ? `Rp ${revenue.toLocaleString('id-ID')}` : '—'}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: totalCost > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                              {totalCost > 0 ? `Rp ${totalCost.toLocaleString('id-ID')}` : '—'}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: '800', color: profitLoss > 0 ? 'var(--success)' : profitLoss < 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                              {revenue > 0 || totalCost > 0 ? `Rp ${profitLoss.toLocaleString('id-ID')}` : '—'}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
                                {canWrite && (
                                  <button className="btn" style={{ padding: '7px 14px', fontSize: '0.8rem', gap: '6px', background: 'var(--secondary-bg)', color: 'var(--secondary)', border: '1px solid var(--secondary)' }} onClick={() => { setCostModal(jo); setCostLines([{ vendorId: '', serviceIdx: '', qty: 1, customVendorName: '', customServiceDescription: '', customPrice: '', targetItemIdx: '' }]); }}>
                                    <Plus size={14} /> {isID ? 'Biaya' : 'Costs'}
                                  </button>
                                )}
                                {(() => {
                                  const hasMergeCandidates = jo.quotationId && jobOrders.some(j => String(j.quotationId) === String(jo.quotationId) && String(j.id) !== String(jo.id) && j.customerName === jo.customerName);
                                  return canWrite && hasMergeCandidates && (
                                    <button 
                                      className="btn" 
                                      style={{ 
                                        padding: '7px 14px', 
                                        fontSize: '0.8rem', 
                                        gap: '6px', 
                                        background: 'rgba(52, 211, 153, 0.1)', 
                                        color: '#34d399', 
                                        border: '1px solid rgba(52, 211, 153, 0.25)' 
                                      }} 
                                      onClick={() => handleOpenMergeModal(jo)}
                                    >
                                      <GitMerge size={14} /> {isID ? 'Gabungkan' : 'Merge'}
                                    </button>
                                  );
                                })()}
                                {!invoice && canWrite && jo.shipmentStatus === "done" && (
                                  <ButtonWithLoading
                                    className="btn btn-gold"
                                    style={{ padding: "7px 14px", fontSize: "0.8rem", gap: "6px" }}
                                    onClick={() => handleIssueInvoice(jo.id)}
                                  >
                                    <Receipt size={14} /> {isID ? "Invoice" : "Invoice"}
                                  </ButtonWithLoading>
                                )}
                              </div>
                            </td>
                          </tr>

                          {isJoExpanded && (
                            <tr style={{ background: 'rgba(255, 255, 255, 0.015)', borderBottom: '1px solid var(--glass-border)' }}>
                              <td colSpan="9" style={{ padding: '15px 25px 20px 40px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '25px' }}>
                                  {/* Left Column: Services & Revenue */}
                                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '15px 20px' }}>
                                    <div style={{ fontWeight: '800', color: 'var(--secondary)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>
                                      {isID ? 'Rincian Layanan & Pendapatan' : 'Services & Revenue Breakdown'}
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                      <thead>
                                        <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                          <th style={{ padding: '6px 0' }}>{isID ? 'Layanan' : 'Service'}</th>
                                          <th style={{ padding: '6px 0', textAlign: 'center' }}>Qty</th>
                                          <th style={{ padding: '6px 0', textAlign: 'right' }}>{isID ? 'Tarif' : 'Rate'}</th>
                                          <th style={{ padding: '6px 0', textAlign: 'right' }}>Total</th>
                                          {canWrite && <th style={{ padding: '6px 0', textAlign: 'center' }}>{isID ? 'Aksi' : 'Action'}</th>}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {jo.items.map((item, idx) => {
                                          const qty = parseFloat(item.issueQuantity || item.quantity || 1);
                                          const subtotal = parseFloat(item.rate || 0) * qty;
                                          return (
                                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.78rem' }}>
                                              <td style={{ padding: '8px 0', fontWeight: '500' }}>
                                                <div>{getResolvedDescription(item, jo, idx)}</div>
                                                {item.status && <span className={`badge badge-${item.status}`} style={{ fontSize: '0.58rem', padding: '1px 4px', marginTop: '3px', display: 'inline-block' }}>{item.status}</span>}
                                              </td>
                                              <td style={{ padding: '8px 0', textAlign: 'center' }}>{qty}</td>
                                              <td style={{ padding: '8px 0', textAlign: 'right' }}>Rp {parseFloat(item.rate || 0).toLocaleString()}</td>
                                              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '700', color: 'var(--secondary)' }}>Rp {subtotal.toLocaleString()}</td>
                                              {canWrite && (
                                                <td style={{ padding: '8px 0', textAlign: 'center' }}>
                                                  {jo.items.length > 1 ? (
                                                    <button
                                                      className="btn"
                                                      style={{
                                                        padding: '4px 8px',
                                                        fontSize: '0.7rem',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        background: 'rgba(212, 175, 55, 0.1)',
                                                        color: 'var(--secondary)',
                                                        border: '1px solid rgba(212, 175, 55, 0.25)',
                                                        cursor: isProcessingSplit ? 'not-allowed' : 'pointer'
                                                      }}
                                                      disabled={isProcessingSplit}
                                                      onClick={() => handleOpenSplitModal(jo, idx)}
                                                      title={isID ? 'Pisahkan menjadi JO baru' : 'Split into a new JO'}
                                                    >
                                                      {isProcessingSplit && splitModalData?.jo?.id === jo.id && splitModalData?.itemIdx === idx ? (
                                                        <span>...</span>
                                                      ) : (
                                                        <>
                                                          <ExternalLink size={12} />
                                                          <span>{isID ? 'Pisahkan' : 'Split'}</span>
                                                        </>
                                                      )}
                                                    </button>
                                                  ) : (
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                      —
                                                    </span>
                                                  )}
                                                </td>
                                              )}
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>

                                  {/* Right Column: Costs & Expenses */}
                                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '15px 20px' }}>
                                    <div style={{ fontWeight: '800', color: '#ef4444', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>
                                      {isID ? 'Rincian Pengeluaran & Biaya' : 'Costs & Expenses Breakdown'}
                                    </div>
                                    {(() => {
                                      const manualCostsList = Array.isArray(jo.costs) ? jo.costs : [];
                                      const poCostsList = poMap[jo.id] || [];
                                      const costAppsList = costAppMap[String(jo.id)] || [];
                                      
                                      if (manualCostsList.length === 0 && poCostsList.length === 0 && costAppsList.length === 0) {
                                        return (
                                          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', fontStyle: 'italic' }}>
                                            {isID ? 'Belum ada catatan biaya.' : 'No costing records registered.'}
                                          </div>
                                        );
                                      }

                                      return (
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                          <thead>
                                            <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                              <th style={{ padding: '6px 0' }}>{isID ? 'Vendor / Jenis' : 'Vendor / Type'}</th>
                                              <th style={{ padding: '6px 0' }}>{isID ? 'Deskripsi' : 'Description'}</th>
                                              <th style={{ padding: '6px 0', textAlign: 'right' }}>{isID ? 'Biaya' : 'Amount'}</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {manualCostsList.map((c, cIdx) => (
                                              <tr key={`mc-${cIdx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.78rem' }}>
                                                <td style={{ padding: '8px 0', fontWeight: '500' }}>
                                                  <div>{c.vendorName || c.customVendorName || (isID ? 'Vendor Kustom' : 'Custom Vendor')}</div>
                                                  <span style={{ fontSize: '0.58rem', background: 'rgba(212, 175, 55, 0.1)', color: 'var(--secondary)', border: '1px solid rgba(212, 175, 55, 0.25)', padding: '1px 4px', borderRadius: '3px', marginTop: '3px', display: 'inline-block' }}>
                                                    Manual Cost
                                                  </span>
                                                </td>
                                                <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>{c.serviceDescription || c.customServiceDescription || '—'}</td>
                                                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '700', color: '#ef4444' }}>
                                                  Rp {parseFloat(c.total || 0).toLocaleString()}
                                                </td>
                                              </tr>
                                            ))}
                                            {costAppsList.map((ca, caIdx) => {
                                              const caStatus = ca.status || 'pending';
                                              const statusBg = caStatus === 'paid' || caStatus === 'released' ? 'rgba(34, 197, 94, 0.1)' : caStatus === 'approved' ? 'rgba(59, 130, 246, 0.1)' : caStatus === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)';
                                              const statusColor = caStatus === 'paid' || caStatus === 'released' ? '#22c55e' : caStatus === 'approved' ? '#3b82f6' : caStatus === 'rejected' ? '#ef4444' : '#f59e0b';
                                              const statusLabel = caStatus === 'paid' || caStatus === 'released' ? (isID ? 'Cair' : 'Released') : caStatus === 'approved' ? (isID ? 'Disetujui' : 'Approved') : caStatus === 'rejected' ? (isID ? 'Ditolak' : 'Rejected') : (isID ? 'Menunggu' : 'Pending');
                                              const itemDesc = Array.isArray(ca.items) ? ca.items.map(it => it.details).filter(Boolean).join(', ') : (ca.notes || '—');

                                              return (
                                                <tr key={`ca-${caIdx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.78rem' }}>
                                                  <td style={{ padding: '8px 0', fontWeight: '500' }}>
                                                    <div>{ca.employeeName || ca.requestedBy || (isID ? 'Pengajuan Biaya' : 'Cost App')}</div>
                                                    <div style={{ display: 'flex', gap: '4px', marginTop: '3px' }}>
                                                      <span style={{ fontSize: '0.58rem', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.25)', padding: '1px 4px', borderRadius: '3px', display: 'inline-block' }}>
                                                        Cost App: {ca.id}
                                                      </span>
                                                      <span style={{ fontSize: '0.58rem', background: statusBg, color: statusColor, border: `1px solid ${statusColor}40`, padding: '1px 4px', borderRadius: '3px', display: 'inline-block' }}>
                                                        {statusLabel}
                                                      </span>
                                                    </div>
                                                  </td>
                                                  <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>{itemDesc}</td>
                                                  <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '700', color: caStatus === 'rejected' ? 'var(--text-muted)' : '#ef4444', textDecoration: caStatus === 'rejected' ? 'line-through' : 'none' }}>
                                                    Rp {parseFloat(ca.amount || 0).toLocaleString()}
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                            {poCostsList.map((p, pIdx) => (
                                              <tr key={`po-${pIdx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.78rem' }}>
                                                <td style={{ padding: '8px 0', fontWeight: '500' }}>
                                                  <div>{p.vendorName || (isID ? 'Vendor PO' : 'PO Vendor')}</div>
                                                  <span style={{ fontSize: '0.58rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.25)', padding: '1px 4px', borderRadius: '3px', marginTop: '3px', display: 'inline-block' }}>
                                                    PO: {p.poNumber || p.id}
                                                  </span>
                                                </td>
                                                <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>
                                                  {p.items?.map(pi => pi.serviceDescription).join(', ') || (isID ? 'Layanan PO' : 'PO Services')}
                                                </td>
                                                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '700', color: '#ef4444' }}>
                                                  Rp {parseFloat(p.grandTotal || 0).toLocaleString()}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    }

                    const manualCost = Array.isArray(jo.costs) ? jo.costs.reduce((s, c) => s + parseFloat(c.total || 0), 0) : 0;
                    const poCost = (poMap[jo.id] || []).reduce((s, p) => s + parseFloat(p.grandTotal || 0), 0);
                    const costAppCost = (costAppMap[String(jo.id)] || []).filter(ca => ca.status !== 'rejected').reduce((s, ca) => s + (parseFloat(ca.amount) || 0), 0);
                    const totalCost = manualCost + poCost + costAppCost;
                    
                    const invoice = joInvoiceMap[String(jo.id)];
                    const revenue = invoice ? parseFloat(invoice.amount || invoice.subtotal || 0) : 0;
                    const profitLoss = revenue - totalCost;

                    return (
                      <tr key={jo.id} style={{ borderBottom: '1px solid var(--glass-border)' }} className="table-row-hover">
                        <td style={{ padding: '12px', fontWeight: '700', color: 'var(--secondary)', fontSize: '0.85rem' }}>{jo.id}</td>
                        <td style={{ padding: '12px', fontWeight: '600' }}>{jo.customerName}</td>
                        <td style={{ padding: '12px', fontSize: '0.8rem', fontWeight: '700', color: 'var(--secondary)' }}>
                          {invoice ? invoice.id : <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>{isID ? 'Belum Ada' : 'None Yet'}</span>}
                        </td>
                        <td style={{ padding: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {invoice ? new Date(invoice.date).toLocaleDateString() : '—'}
                        </td>
                        <td style={{ padding: '12px' }}><span className={`badge badge-${jo.status}`} style={{ fontSize: '0.7rem' }}>{jo.status}</span></td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: revenue > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                          {revenue > 0 ? `Rp ${revenue.toLocaleString('id-ID')}` : '—'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: totalCost > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                          {totalCost > 0 ? `Rp ${totalCost.toLocaleString('id-ID')}` : '—'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '800', color: profitLoss > 0 ? 'var(--success)' : profitLoss < 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                          {revenue > 0 || totalCost > 0 ? `Rp ${profitLoss.toLocaleString('id-ID')}` : '—'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            {canWrite && (
                              <button className="btn" style={{ padding: '7px 14px', fontSize: '0.8rem', gap: '6px', background: 'var(--secondary-bg)', color: 'var(--secondary)', border: '1px solid var(--secondary)' }} onClick={() => { setCostModal(jo); setCostLines([{ vendorId: '', serviceIdx: '', qty: 1, customVendorName: '', customServiceDescription: '', customPrice: '', targetItemIdx: '' }]); }}>
                                <Plus size={14} /> {isID ? 'Biaya' : 'Costs'}
                              </button>
                            )}
                            {(() => {
                              const hasMergeCandidates = jo.quotationId && jobOrders.some(j => String(j.quotationId) === String(jo.quotationId) && String(j.id) !== String(jo.id) && j.customerName === jo.customerName);
                              return canWrite && hasMergeCandidates && (
                                <button 
                                  className="btn" 
                                  style={{ 
                                    padding: '7px 14px', 
                                    fontSize: '0.8rem', 
                                    gap: '6px', 
                                    background: 'rgba(52, 211, 153, 0.1)', 
                                    color: '#34d399', 
                                    border: '1px solid rgba(52, 211, 153, 0.25)' 
                                  }} 
                                  onClick={() => handleOpenMergeModal(jo)}
                                >
                                  <GitMerge size={14} /> {isID ? 'Gabungkan' : 'Merge'}
                                </button>
                              );
                            })()}
                            {!invoice && canWrite && jo.shipmentStatus === "done" && (
                                  <ButtonWithLoading
                                    className="btn btn-gold"
                                    style={{ padding: "7px 14px", fontSize: "0.8rem", gap: "6px" }}
                                    onClick={() => handleIssueInvoice(jo.id)}
                                  >
                                    <Receipt size={14} /> {isID ? "Invoice" : "Invoice"}
                                  </ButtonWithLoading>
                                )}
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  // Render Folder Group row and child rows
                  return (
                    <React.Fragment key={group.key}>
                      <tr 
                        style={{ 
                          background: 'rgba(212, 175, 55, 0.05)', 
                          borderBottom: '2px solid var(--secondary)',
                          cursor: 'pointer'
                        }}
                        onClick={() => setExpandedPLGroups({ ...expandedPLGroups, [group.key]: !isExpanded })}
                      >
                        <td style={{ padding: '12px', fontWeight: '800', color: 'var(--secondary)', fontSize: '0.85rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{isExpanded ? '📂' : '📁'}</span>
                            <span>{group.type === 'quotation' ? 'Quo: ' + group.name : 'Inv: ' + group.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px', fontWeight: '800' }}>{group.customerName}</td>
                        <td style={{ padding: '12px', fontSize: '0.8rem', fontWeight: '700', color: 'var(--secondary)' }}>
                          {group.invoice ? group.invoice.id : <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>{isID ? 'Belum Ada' : 'None Yet'}</span>}
                        </td>
                        <td style={{ padding: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {group.invoice ? new Date(group.invoice.date).toLocaleDateString() : '—'}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                            {group.jobOrders.length} {isID ? 'Pekerjaan' : 'Jobs'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: groupFin.revenue > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                          {groupFin.revenue > 0 ? `Rp ${groupFin.revenue.toLocaleString('id-ID')}` : '—'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: groupFin.cost > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                          {groupFin.cost > 0 ? `Rp ${groupFin.cost.toLocaleString('id-ID')}` : '—'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '800', color: groupFin.profitLoss > 0 ? 'var(--success)' : groupFin.profitLoss < 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                          {groupFin.revenue > 0 || groupFin.cost > 0 ? `Rp ${groupFin.profitLoss.toLocaleString('id-ID')}` : '—'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button className="btn" style={{ padding: '4px 8px', background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer' }}>
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && group.jobOrders.map(jo => {
                        const hasItems = Array.isArray(jo.items) && jo.items.length > 0;
                        
                        if (hasItems) {
                          const manualCostTotal = Array.isArray(jo.costs) ? jo.costs.reduce((s, c) => s + parseFloat(c.total || 0), 0) : 0;
                          const poCostTotal = (poMap[jo.id] || []).reduce((s, p) => s + parseFloat(p.grandTotal || 0), 0);
                          const costAppTotal = (costAppMap[String(jo.id)] || []).filter(ca => ca.status !== 'rejected').reduce((s, ca) => s + (parseFloat(ca.amount) || 0), 0);
                          const totalCost = manualCostTotal + poCostTotal + costAppTotal;

                          const invoice = joInvoiceMap[String(jo.id)];
                          const revenue = invoice ? parseFloat(invoice.amount || invoice.subtotal || 0) : jo.items.reduce((s, item) => s + parseFloat(item.rate || 0) * parseFloat(item.issueQuantity || item.quantity || 1), 0);
                          const profitLoss = revenue - totalCost;
                          const isJoExpanded = expandedJOPL[jo.id] === true;

                          return (
                            <React.Fragment key={jo.id}>
                              <tr 
                                style={{ 
                                  borderBottom: '1px solid var(--glass-border)', 
                                  background: 'rgba(255,255,255,0.02)',
                                  cursor: 'pointer'
                                }} 
                                className="table-row-hover"
                                onClick={() => setExpandedJOPL({ ...expandedJOPL, [jo.id]: !isJoExpanded })}
                              >
                                <td style={{ padding: '12px', paddingLeft: '30px', fontWeight: '700', color: 'var(--secondary)', fontSize: '0.85rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>{isJoExpanded ? '📂' : '📁'}</span>
                                    <span>{jo.id}</span>
                                  </div>
                                </td>
                                <td style={{ padding: '12px', fontWeight: '600' }}>{jo.customerName}</td>
                                <td style={{ padding: '12px', fontSize: '0.8rem', fontWeight: '700', color: 'var(--secondary)' }}>
                                  {invoice ? invoice.id : <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>{isID ? 'Belum Ada' : 'None Yet'}</span>}
                                </td>
                                <td style={{ padding: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  {invoice ? new Date(invoice.date).toLocaleDateString() : '—'}
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <span className={`badge badge-${jo.status}`} style={{ fontSize: '0.7rem' }}>{jo.status}</span>
                                </td>
                                <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: revenue > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                                  {revenue > 0 ? `Rp ${revenue.toLocaleString('id-ID')}` : '—'}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: totalCost > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                                  {totalCost > 0 ? `Rp ${totalCost.toLocaleString('id-ID')}` : '—'}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'right', fontWeight: '800', color: profitLoss > 0 ? 'var(--success)' : profitLoss < 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                                  {revenue > 0 || totalCost > 0 ? `Rp ${profitLoss.toLocaleString('id-ID')}` : '—'}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
                                    {canWrite && (
                                      <button className="btn" style={{ padding: '7px 14px', fontSize: '0.8rem', gap: '6px', background: 'var(--secondary-bg)', color: 'var(--secondary)', border: '1px solid var(--secondary)' }} onClick={() => { setCostModal(jo); setCostLines([{ vendorId: '', serviceIdx: '', qty: 1, customVendorName: '', customServiceDescription: '', customPrice: '', targetItemIdx: '' }]); }}>
                                        <Plus size={14} /> {isID ? 'Biaya' : 'Costs'}
                                      </button>
                                    )}
                                    {(() => {
                                      const hasMergeCandidates = jo.quotationId && jobOrders.some(j => String(j.quotationId) === String(jo.quotationId) && String(j.id) !== String(jo.id) && j.customerName === jo.customerName);
                                      return canWrite && hasMergeCandidates && (
                                        <button 
                                          className="btn" 
                                          style={{ 
                                            padding: '7px 14px', 
                                            fontSize: '0.8rem', 
                                            gap: '6px', 
                                            background: 'rgba(52, 211, 153, 0.1)', 
                                            color: '#34d399', 
                                            border: '1px solid rgba(52, 211, 153, 0.25)' 
                                          }} 
                                          onClick={() => handleOpenMergeModal(jo)}
                                        >
                                          <GitMerge size={14} /> {isID ? 'Gabungkan' : 'Merge'}
                                        </button>
                                      );
                                    })()}
                                    {!invoice && canWrite && jo.shipmentStatus === "done" && (
                                  <ButtonWithLoading
                                    className="btn btn-gold"
                                    style={{ padding: "7px 14px", fontSize: "0.8rem", gap: "6px" }}
                                    onClick={() => handleIssueInvoice(jo.id)}
                                  >
                                    <Receipt size={14} /> {isID ? "Invoice" : "Invoice"}
                                  </ButtonWithLoading>
                                )}
                                  </div>
                                </td>
                              </tr>

                          {isJoExpanded && (
                            <tr style={{ background: 'rgba(255, 255, 255, 0.015)', borderBottom: '1px solid var(--glass-border)' }}>
                              <td colSpan="9" style={{ padding: '15px 25px 20px 40px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '25px' }}>
                                  {/* Left Column: Services & Revenue */}
                                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '15px 20px' }}>
                                    <div style={{ fontWeight: '800', color: 'var(--secondary)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>
                                      {isID ? 'Rincian Layanan & Pendapatan' : 'Services & Revenue Breakdown'}
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                      <thead>
                                        <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                          <th style={{ padding: '6px 0' }}>{isID ? 'Layanan' : 'Service'}</th>
                                          <th style={{ padding: '6px 0', textAlign: 'center' }}>Qty</th>
                                          <th style={{ padding: '6px 0', textAlign: 'right' }}>{isID ? 'Tarif' : 'Rate'}</th>
                                          <th style={{ padding: '6px 0', textAlign: 'right' }}>Total</th>
                                          {canWrite && <th style={{ padding: '6px 0', textAlign: 'center' }}>{isID ? 'Aksi' : 'Action'}</th>}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {jo.items.map((item, idx) => {
                                          const qty = parseFloat(item.issueQuantity || item.quantity || 1);
                                          const subtotal = parseFloat(item.rate || 0) * qty;
                                          return (
                                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.78rem' }}>
                                              <td style={{ padding: '8px 0', fontWeight: '500' }}>
                                                <div>{getResolvedDescription(item, jo, idx)}</div>
                                                {item.status && <span className={`badge badge-${item.status}`} style={{ fontSize: '0.58rem', padding: '1px 4px', marginTop: '3px', display: 'inline-block' }}>{item.status}</span>}
                                              </td>
                                              <td style={{ padding: '8px 0', textAlign: 'center' }}>{qty}</td>
                                              <td style={{ padding: '8px 0', textAlign: 'right' }}>Rp {parseFloat(item.rate || 0).toLocaleString()}</td>
                                              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '700', color: 'var(--secondary)' }}>Rp {subtotal.toLocaleString()}</td>
                                              {canWrite && (
                                                <td style={{ padding: '8px 0', textAlign: 'center' }}>
                                                  {jo.items.length > 1 ? (
                                                    <button
                                                      className="btn"
                                                      style={{
                                                        padding: '4px 8px',
                                                        fontSize: '0.7rem',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        background: 'rgba(212, 175, 55, 0.1)',
                                                        color: 'var(--secondary)',
                                                        border: '1px solid rgba(212, 175, 55, 0.25)',
                                                        cursor: isProcessingSplit ? 'not-allowed' : 'pointer'
                                                      }}
                                                      disabled={isProcessingSplit}
                                                      onClick={() => handleOpenSplitModal(jo, idx)}
                                                      title={isID ? 'Pisahkan menjadi JO baru' : 'Split into a new JO'}
                                                    >
                                                      {isProcessingSplit && splitModalData?.jo?.id === jo.id && splitModalData?.itemIdx === idx ? (
                                                        <span>...</span>
                                                      ) : (
                                                        <>
                                                          <ExternalLink size={12} />
                                                          <span>{isID ? 'Pisahkan' : 'Split'}</span>
                                                        </>
                                                      )}
                                                    </button>
                                                  ) : (
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                      —
                                                    </span>
                                                  )}
                                                </td>
                                              )}
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>

                                  {/* Right Column: Costs & Expenses */}
                                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '15px 20px' }}>
                                    <div style={{ fontWeight: '800', color: '#ef4444', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>
                                      {isID ? 'Rincian Pengeluaran & Biaya' : 'Costs & Expenses Breakdown'}
                                    </div>
                                    {(() => {
                                      const manualCostsList = Array.isArray(jo.costs) ? jo.costs : [];
                                      const poCostsList = poMap[jo.id] || [];
                                      const costAppsList = costAppMap[String(jo.id)] || [];
                                      
                                      if (manualCostsList.length === 0 && poCostsList.length === 0 && costAppsList.length === 0) {
                                        return (
                                          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', fontStyle: 'italic' }}>
                                            {isID ? 'Belum ada catatan biaya.' : 'No costing records registered.'}
                                          </div>
                                        );
                                      }

                                      return (
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                          <thead>
                                            <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                              <th style={{ padding: '6px 0' }}>{isID ? 'Vendor / Jenis' : 'Vendor / Type'}</th>
                                              <th style={{ padding: '6px 0' }}>{isID ? 'Deskripsi' : 'Description'}</th>
                                              <th style={{ padding: '6px 0', textAlign: 'right' }}>{isID ? 'Biaya' : 'Amount'}</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {manualCostsList.map((c, cIdx) => (
                                              <tr key={`mc-${cIdx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.78rem' }}>
                                                <td style={{ padding: '8px 0', fontWeight: '500' }}>
                                                  <div>{c.vendorName || c.customVendorName || (isID ? 'Vendor Kustom' : 'Custom Vendor')}</div>
                                                  <span style={{ fontSize: '0.58rem', background: 'rgba(212, 175, 55, 0.1)', color: 'var(--secondary)', border: '1px solid rgba(212, 175, 55, 0.25)', padding: '1px 4px', borderRadius: '3px', marginTop: '3px', display: 'inline-block' }}>
                                                    Manual Cost
                                                  </span>
                                                </td>
                                                <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>{c.serviceDescription || c.customServiceDescription || '—'}</td>
                                                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '700', color: '#ef4444' }}>
                                                  Rp {parseFloat(c.total || 0).toLocaleString()}
                                                </td>
                                              </tr>
                                            ))}
                                            {costAppsList.map((ca, caIdx) => {
                                              const caStatus = ca.status || 'pending';
                                              const statusBg = caStatus === 'paid' || caStatus === 'released' ? 'rgba(34, 197, 94, 0.1)' : caStatus === 'approved' ? 'rgba(59, 130, 246, 0.1)' : caStatus === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)';
                                              const statusColor = caStatus === 'paid' || caStatus === 'released' ? '#22c55e' : caStatus === 'approved' ? '#3b82f6' : caStatus === 'rejected' ? '#ef4444' : '#f59e0b';
                                              const statusLabel = caStatus === 'paid' || caStatus === 'released' ? (isID ? 'Cair' : 'Released') : caStatus === 'approved' ? (isID ? 'Disetujui' : 'Approved') : caStatus === 'rejected' ? (isID ? 'Ditolak' : 'Rejected') : (isID ? 'Menunggu' : 'Pending');
                                              const itemDesc = Array.isArray(ca.items) ? ca.items.map(it => it.details).filter(Boolean).join(', ') : (ca.notes || '—');

                                              return (
                                                <tr key={`ca-${caIdx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.78rem' }}>
                                                  <td style={{ padding: '8px 0', fontWeight: '500' }}>
                                                    <div>{ca.employeeName || ca.requestedBy || (isID ? 'Pengajuan Biaya' : 'Cost App')}</div>
                                                    <div style={{ display: 'flex', gap: '4px', marginTop: '3px' }}>
                                                      <span style={{ fontSize: '0.58rem', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.25)', padding: '1px 4px', borderRadius: '3px', display: 'inline-block' }}>
                                                        Cost App: {ca.id}
                                                      </span>
                                                      <span style={{ fontSize: '0.58rem', background: statusBg, color: statusColor, border: `1px solid ${statusColor}40`, padding: '1px 4px', borderRadius: '3px', display: 'inline-block' }}>
                                                        {statusLabel}
                                                      </span>
                                                    </div>
                                                  </td>
                                                  <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>{itemDesc}</td>
                                                  <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '700', color: caStatus === 'rejected' ? 'var(--text-muted)' : '#ef4444', textDecoration: caStatus === 'rejected' ? 'line-through' : 'none' }}>
                                                    Rp {parseFloat(ca.amount || 0).toLocaleString()}
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                            {poCostsList.map((p, pIdx) => (
                                              <tr key={`po-${pIdx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.78rem' }}>
                                                <td style={{ padding: '8px 0', fontWeight: '500' }}>
                                                  <div>{p.vendorName || (isID ? 'Vendor PO' : 'PO Vendor')}</div>
                                                  <span style={{ fontSize: '0.58rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.25)', padding: '1px 4px', borderRadius: '3px', marginTop: '3px', display: 'inline-block' }}>
                                                    PO: {p.poNumber || p.id}
                                                  </span>
                                                </td>
                                                <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>
                                                  {p.items?.map(pi => pi.serviceDescription).join(', ') || (isID ? 'Layanan PO' : 'PO Services')}
                                                </td>
                                                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '700', color: '#ef4444' }}>
                                                  Rp {parseFloat(p.grandTotal || 0).toLocaleString()}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                            </React.Fragment>
                          );
                        }

                        const manualCost = Array.isArray(jo.costs) ? jo.costs.reduce((s, c) => s + parseFloat(c.total || 0), 0) : 0;
                        const poCost = (poMap[jo.id] || []).reduce((s, p) => s + parseFloat(p.grandTotal || 0), 0);
                        const costAppCost = (costAppMap[String(jo.id)] || []).filter(ca => ca.status !== 'rejected').reduce((s, ca) => s + (parseFloat(ca.amount) || 0), 0);
                        const totalCost = manualCost + poCost + costAppCost;
                        
                        const invoice = joInvoiceMap[String(jo.id)];
                        const isPrimaryJo = invoice && String(invoice.joId) === String(jo.id);
                        const revenue = isPrimaryJo ? parseFloat(invoice.amount || invoice.subtotal || 0) : 0;
                        const profitLoss = revenue - totalCost;

                        return (
                          <tr key={jo.id} style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.01)' }} className="table-row-hover">
                            <td style={{ padding: '12px', paddingLeft: '30px', fontWeight: '700', color: 'var(--secondary)', fontSize: '0.85rem' }}>
                              <span style={{ color: 'var(--text-muted)', marginRight: '5px' }}>📄</span> {jo.id}
                            </td>
                            <td style={{ padding: '12px', fontWeight: '600' }}>{jo.customerName}</td>
                            <td style={{ padding: '12px', fontSize: '0.8rem', fontWeight: '700', color: 'var(--secondary)' }}>
                              {invoice ? invoice.id : <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>{isID ? 'Belum Ada' : 'None Yet'}</span>}
                            </td>
                            <td style={{ padding: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {invoice ? new Date(invoice.date).toLocaleDateString() : '—'}
                            </td>
                            <td style={{ padding: '12px' }}><span className={`badge badge-${jo.status}`} style={{ fontSize: '0.7rem' }}>{jo.status}</span></td>
                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: revenue > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                              {revenue > 0 ? `Rp ${revenue.toLocaleString('id-ID')}` : (invoice ? <span style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>{isID ? '(Tercakup)' : '(Covered)'}</span> : '—')}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: totalCost > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                              {totalCost > 0 ? `Rp ${totalCost.toLocaleString('id-ID')}` : '—'}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: '800', color: isPrimaryJo ? (profitLoss > 0 ? 'var(--success)' : profitLoss < 0 ? 'var(--danger)' : 'var(--text-muted)') : 'var(--text-muted)' }}>
                              {isPrimaryJo ? (revenue > 0 || totalCost > 0 ? `Rp ${profitLoss.toLocaleString('id-ID')}` : '—') : <span style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>{isID ? 'Lihat Folder' : 'See Folder'}</span>}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                {canWrite && (
                                  <button className="btn" style={{ padding: '7px 14px', fontSize: '0.8rem', gap: '6px', background: 'var(--secondary-bg)', color: 'var(--secondary)', border: '1px solid var(--secondary)' }} onClick={() => { setCostModal(jo); setCostLines([{ vendorId: '', serviceIdx: '', qty: 1, customVendorName: '', customServiceDescription: '', customPrice: '', targetItemIdx: '' }]); }}>
                                    <Plus size={14} /> {isID ? 'Biaya' : 'Costs'}
                                  </button>
                                )}
                                {(() => {
                                  const hasMergeCandidates = jo.quotationId && jobOrders.some(j => String(j.quotationId) === String(jo.quotationId) && String(j.id) !== String(jo.id) && j.customerName === jo.customerName);
                                  return canWrite && hasMergeCandidates && (
                                    <button 
                                      className="btn" 
                                      style={{ 
                                        padding: '7px 14px', 
                                        fontSize: '0.8rem', 
                                        gap: '6px', 
                                        background: 'rgba(52, 211, 153, 0.1)', 
                                        color: '#34d399', 
                                        border: '1px solid rgba(52, 211, 153, 0.25)' 
                                      }} 
                                      onClick={() => handleOpenMergeModal(jo)}
                                    >
                                      <GitMerge size={14} /> {isID ? 'Gabungkan' : 'Merge'}
                                    </button>
                                  );
                                })()}
                                {!invoice && canWrite && jo.shipmentStatus === "done" && (
                                  <ButtonWithLoading
                                    className="btn btn-gold"
                                    style={{ padding: "7px 14px", fontSize: "0.8rem", gap: "6px" }}
                                    onClick={() => handleIssueInvoice(jo.id)}
                                  >
                                    <Receipt size={14} /> {isID ? "Invoice" : "Invoice"}
                                  </ButtonWithLoading>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table></div></div>
          )}
        </div>
      ) : activeTab === 'billing' ? (
        <div className="billing-section">
          {/* Readonly Pending Invoices Card */}
          <div className="glass-card" style={{ padding: '25px', marginBottom: '40px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: isPendingCollapsed ? '0' : '20px', cursor:'pointer' }} onClick={() => setIsPendingCollapsed(!isPendingCollapsed)}>
              <h4 style={{ margin:0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Receipt size={20} style={{ color: 'var(--secondary)' }} />
                {isID ? 'Invoice Tertunda (dari Operasional - Readonly)' : 'Pending Invoices (from Operations - Readonly)'}
              </h4>
              <button style={{ background:'none', border:'none', color:'var(--secondary)', cursor:'pointer' }}>
                {isPendingCollapsed ? <ChevronDown /> : <ChevronUp />}
              </button>
            </div>
            
            {!isPendingCollapsed && (
              <div className="table-container"><table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: '15px' }}>JO Ref</th>
                    <th style={{ padding: '15px' }}>{isID ? 'Pelanggan' : 'Customer'}</th>
                    <th style={{ padding: '15px' }}>{isID ? 'Status' : 'Status'}</th>
                    <th style={{ padding: '15px' }}>{isID ? 'Pengiriman' : 'Shipment'}</th>
                    <th style={{ padding: '15px', textAlign: 'center' }}>{isID ? 'Foto' : 'Photos'}</th>
                    <th style={{ padding: '15px' }}>{isID ? 'Status Penagihan' : 'Billing Status'}</th>
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
                        const hasInvoice = invoices.some(inv => String(inv.joId) === String(jo.id) || (Array.isArray(inv.consolidatedJOs) && inv.consolidatedJOs.map(String).includes(String(jo.id))));
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
                        const hasInvoice = invoices.some(inv => String(inv.joId) === String(jo.id) || (Array.isArray(inv.consolidatedJOs) && inv.consolidatedJOs.map(String).includes(String(jo.id))));
                        return !hasInvoice;
                      });
                      return hasUninvoicedJO;
                    });

                    if (pendingGroups.length === 0) {
                      return (
                        <tr>
                          <td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                             {isID ? 'Tidak ada invoice tertunda.' : 'No pending invoices found.'}
                          </td>
                        </tr>
                      );
                    }

                    return pendingGroups.map(group => {
                      const isGroupExpanded = expandedCompletedGroups[group.quotationId] !== false;
                      const uninvoicedJOs = group.jobOrders.filter(jo => !invoices.some(inv => String(inv.joId) === String(jo.id) || (Array.isArray(inv.consolidatedJOs) && inv.consolidatedJOs.map(String).includes(String(jo.id)))));
                      const allInvoiced = uninvoicedJOs.length === 0;

                      return (
                        <React.Fragment key={group.quotationId}>
                          {/* Quotation Group Folder Row */}
                          <tr 
                            style={{ 
                              background: 'var(--secondary-bg)', 
                              borderBottom: '2px solid var(--secondary)',
                              cursor: 'pointer'
                            }}
                            onClick={() => setExpandedCompletedGroups({ ...expandedCompletedGroups, [group.quotationId]: !isGroupExpanded })}
                          >
                            <td colSpan="7" style={{ padding: '12px 15px', verticalAlign: 'middle' }}>
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
                                  {!allInvoiced && canWrite && uninvoicedJOs.every(jo => jo.shipmentStatus === 'done') && (
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

                          {/* Child Job Orders */}
                          {isGroupExpanded && group.jobOrders.map(jo => {
                            const joInvoices = invoices.filter(inv => String(inv.joId) === String(jo.id));
                            const hasInvoice = joInvoices.length > 0;
                            return (
                              <React.Fragment key={jo.id}>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.01)' }}>
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
                                              • {getResolvedDescription(item, jo, idx)} ({isID ? 'Jumlah:' : 'Qty:'} {item.issueQuantity || item.quantity || 1} | {isID ? 'Tarif:' : 'Rate:'} Rp {parseFloat(item.rate || 0).toLocaleString(isID ? 'id-ID' : 'en-US')}) 
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
                                    {hasInvoice ? (
                                      <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', fontWeight: '600' }}>
                                        <CheckCircle size={16} /> {isID ? 'Sudah Di-invoice' : 'Invoiced'} ({joInvoices.length})
                                      </span>
                                    ) : (
                                      <span style={{ color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', fontWeight: '600' }}>
                                        {isID ? 'Siap Ditagih' : 'Ready to Invoice'}
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ padding: '15px' }}>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                      {!hasInvoice && canWrite && jo.shipmentStatus === 'done' ? (
                                        <ButtonWithLoading 
                                          className="btn btn-gold" 
                                          style={{ padding: '8px 16px', fontSize: '0.85rem' }} 
                                          onClick={() => handleIssueInvoice(jo.id)}
                                        >
                                          {isID ? 'Terbitkan Invoice' : 'Issue Invoice'}
                                        </ButtonWithLoading>
                                      ) : (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>
                                      )}
                                    </div>
                                  </td>
                                </tr>

                                {/* Collapsible Nested Invoice Row */}
                                {hasInvoice && (
                                  <tr style={{ background: 'rgba(212, 175, 55, 0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                                    <td colSpan="7" style={{ padding: '10px 15px 15px 50px' }}>
                                      <div style={{ fontSize: '0.72rem', color: 'var(--secondary)', fontWeight: '800', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                        {isID ? 'Invoice Terkait:' : 'Associated Invoices:'}
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {joInvoices.map(inv => (
                                          <div key={inv.id} style={{ 
                                            display: 'flex', 
                                            flexWrap: 'wrap', 
                                            alignItems: 'center', 
                                            justifyContent: 'space-between', 
                                            background: 'rgba(255,255,255,0.02)', 
                                            border: '1px solid var(--glass-border)', 
                                            borderRadius: '8px', 
                                            padding: '10px 15px',
                                            gap: '15px'
                                          }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                              <div>
                                                <div style={{ fontWeight: '800', color: 'var(--secondary)', fontSize: '0.85rem' }}>{inv.id}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                  {isID ? 'Tanggal:' : 'Date:'} {inv.date || '-'} | {isID ? 'Total:' : 'Total:'} <span style={{ color: 'var(--secondary)', fontWeight: '700' }}>Rp {parseFloat(inv.amount || inv.subtotal || 0).toLocaleString()}</span>
                                                </div>
                                              </div>
                                              <span className={`badge badge-${inv.status}`} style={{ fontSize: '0.65rem' }}>{inv.status}</span>
                                            </div>
                                            
                                            {/* Upload Photos & Delivery Status */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                  {inv.signedInvoicePhoto ? (
                                                    <button onClick={() => setPhotoViewer({ title: `Signed Invoice - ${inv.id}`, photos: [inv.signedInvoicePhoto] })} style={{ background:'none', border:'none', color:'#10b981', cursor:'pointer' }} title={isID ? 'Invoice TTD Diunggah' : 'Signed Invoice Uploaded'}><ShieldCheck size={16}/></button>
                                                  ) : (
                                                    <button onClick={() => setUploadSignedModal({ invId: inv.id, type: 'invoice' })} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }} title={isID ? 'Unggah Invoice TTD' : 'Upload Signed Invoice'}><Image size={16}/></button>
                                                  )}
                                                  {inv.signedReceiptPhoto ? (
                                                    <button onClick={() => setPhotoViewer({ title: `Signed Delivery Receipt - ${inv.id}`, photos: [inv.signedReceiptPhoto] })} style={{ background:'none', border:'none', color:'#3b82f6', cursor:'pointer' }} title={isID ? 'STT TTD Diunggah' : 'Signed STT Uploaded'}><ShieldCheck size={16}/></button>
                                                  ) : (
                                                    <button onClick={() => setUploadSignedModal({ invId: inv.id, type: 'receipt' })} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }} title={isID ? 'Unggah STT TTD' : 'Upload Signed STT'}><FileText size={16}/></button>
                                                  )}
                                                </div>
                                                <span style={{ fontSize:'0.6rem', color:'var(--text-muted)' }}>
                                                  {isID ? 'Dok TTD' : 'Signed Docs'}
                                                </span>
                                              </div>

                                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <select 
                                                  value={inv.deliveryStatus || 'not_sent'} 
                                                  onChange={(e) => updateInvoice(inv.id, { deliveryStatus: e.target.value })}
                                                  style={{ background:'var(--input-bg)', border:'1px solid var(--glass-border)', color:'var(--text)', fontSize:'0.7rem', padding:'2px 4px', borderRadius:'4px' }}
                                                >
                                                  <option value="not_sent" style={{ background: 'var(--bg)', color: 'var(--text)' }}>{isID ? 'Belum Kirim' : 'Not Sent'}</option>
                                                  <option value="on_process" style={{ background: 'var(--bg)', color: 'var(--text)' }}>{isID ? 'Proses Kirim' : 'On Process'}</option>
                                                  <option value="delivered" style={{ background: 'var(--bg)', color: 'var(--text)' }}>{isID ? 'Diterima' : 'Delivered'}</option>
                                                </select>
                                                <span style={{ fontSize:'0.6rem', color:'var(--text-muted)', textAlign: 'center' }}>
                                                  {isID ? 'Pengiriman' : 'Delivery'}
                                                </span>
                                              </div>
                                            </div>

                                            {/* Actions */}
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                              <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.7rem', gap: '4px' }} onClick={() => handleDownloadInvoice(inv)}>
                                                <Download size={12} /> {isID ? 'Lihat' : 'View'}
                                              </button>
                                              <button className="btn" style={{ padding: '4px 8px', fontSize: '0.7rem', gap: '4px', background: 'rgba(16, 185, 129, 0.75)', color: '#ffffff', border: '1px solid rgba(16, 185, 129, 0.8)' }} onClick={() => handleStartEditInvoice(inv)}>
                                                <Edit3 size={12} /> Edit
                                              </button>
                                              <button className="btn" style={{ padding: '4px 8px', fontSize: '0.7rem', gap: '4px', background: 'rgba(59, 130, 246, 0.75)', color: '#ffffff', border: '1px solid rgba(59, 130, 246, 0.8)' }} onClick={() => {
                                                const linkedJO = jobOrders.find(j => String(j.id) === String(inv.joId));
                                                const linkedQuo = linkedJO ? quotations.find(q => String(q.id) === String(linkedJO.quotationId)) : null;
                                                const consolidatedJOs = inv.consolidatedJOs ? jobOrders.filter(j => inv.consolidatedJOs.map(String).includes(String(j.id))) : linkedJO ? [linkedJO] : [];
                                                const customerObj = customers.find(c => c.name === (inv.customerName || ''));
                                                localStorage.setItem('print_invoice_data_' + inv.id, JSON.stringify({ 
                                                  invoice: {
                                                    ...inv,
                                                    customerAddress: inv.customerAddress || linkedQuo?.companyAddress || linkedJO?.address || customerObj?.address || ''
                                                  }, 
                                                  jo: linkedJO, 
                                                  consolidatedJOs, 
                                                  quotation: linkedQuo 
                                                }));
                                                window.open('/print/invoice-delivery?id=' + inv.id, '_blank');
                                              }}>
                                                <FileText size={12} /> STT
                                              </button>
                                              <button className="btn" style={{ padding: '4px 8px', fontSize: '0.7rem', gap: '4px', background: 'rgba(212, 175, 55, 0.75)', color: '#030712', border: '1px solid var(--secondary)' }} onClick={() => {
                                                const linkedJO = jobOrders.find(j => String(j.id) === String(inv.joId));
                                                const allAtts = [
                                                  ...(linkedJO?.photos || []),
                                                  inv.signedInvoicePhoto,
                                                  inv.signedReceiptPhoto,
                                                  ...(Array.isArray(inv.paymentProofPhoto) ? inv.paymentProofPhoto : (inv.paymentProofPhoto ? [inv.paymentProofPhoto] : [])),
                                                  ...(Array.isArray(inv.tax_deduction_proof) ? inv.tax_deduction_proof : (inv.tax_deduction_proof ? [inv.tax_deduction_proof] : []))
                                                ].filter(Boolean);
                                                if (allAtts.length > 0) {
                                                  setPhotoViewer({ title: `Attachments - ${inv.id}`, photos: allAtts });
                                                } else {
                                                  alert(isID ? "Tidak ada lampiran." : "No attachments.");
                                                }
                                              }}>
                                                <Image size={12} /> Ops
                                              </button>
                                              <button className="btn" style={{ padding: '4px 8px', fontSize: '0.7rem', gap: '4px', background: 'rgba(239, 68, 68, 0.75)', color: '#ffffff', border: '1px solid rgba(239, 68, 68, 0.8)' }} onClick={() => {
                                                setDeleteConfirmModal(inv);
                                                setVerifyStep(1);
                                                setVerifyText('');
                                                setOtpInput('');
                                              }}>
                                                <Trash2 size={12} /> {isID ? 'Hapus' : 'Delete'}
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </React.Fragment>
                      );
                    });
                  })()}
                </tbody>
              </table></div>
            )}
          </div>

          <div className="glass-card" style={{ padding: '25px', overflowX: 'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: isIssuedCollapsed ? '0' : '20px', cursor:'pointer' }} onClick={() => setIsIssuedCollapsed(!isIssuedCollapsed)}>
              <h4 style={{ margin:0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Receipt size={20} style={{ color: 'var(--secondary)' }} />
                {isID ? 'Invoice yang Diterbitkan' : 'Issued Invoices'}
              </h4>
              <button style={{ background:'none', border:'none', color:'var(--secondary)', cursor:'pointer' }}>
                {isIssuedCollapsed ? <ChevronDown /> : <ChevronUp />}
              </button>
            </div>

            {!isIssuedCollapsed && (
              <div className="table-container"><div className="table-container"><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--secondary)' }}>
                  <th style={{ padding: '15px', width: '40px' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIssued.size > 0 && selectedIssued.size === filteredIssuedInvoices.length}
                      onChange={() => toggleAllIssued(filteredIssuedInvoices)}
                    />
                  </th>
                  <th style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>{isID ? 'ID Inv / JO / Tgl' : 'Inv ID / JO / Date'}</th>
                  <th style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>{isID ? 'No. Kontainer' : 'Container No.'}</th>
                  <th style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>{isID ? 'Info Pengiriman' : 'Shipment Info'}</th>
                  <th style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>{isID ? 'Pelanggan' : 'Customer'}</th>
                  <th style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'right' }}>{isID ? 'Pendapatan (INV)' : 'Revenue (INV)'}</th>
                  <th style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'right' }}>{isID ? 'Total Biaya' : 'Total Cost'}</th>
                  <th style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'right' }}>{isID ? 'Laba/Rugi' : 'Profit/Loss'}</th>
                  <th style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'center' }}>{isID ? 'Status & Dokumen' : 'Status & Docs'}</th>
                  <th style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'center' }}>{isID ? 'Aksi' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssuedInvoices.map(inv => {
                    const linkedJO = jobOrders.find(j => String(j.id) === String(inv.joId));
                    return (
                    <tr key={inv.id} style={{ borderBottom:'1px solid var(--glass-border)' }} className="table-row-hover">
                      <td style={{ padding: '15px' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedIssued.has(inv.id)}
                          onChange={() => toggleIssuedSelection(inv.id)}
                        />
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ fontWeight: '800', color: 'var(--secondary)' }}>{inv.id}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <span>JO:</span>
                          {(() => {
                            const ass = getAssociatedJOs(inv);
                            if (ass.length === 0) return <span>{inv.joId}</span>;
                            return ass.map((j, i) => {
                              const isLegacy = !j.items || j.items.length === 0;
                              return (
                                <span key={j.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                  <strong>{j.id}</strong>
                                  {isLegacy && (
                                    <span style={{ 
                                      fontSize: '0.65rem', 
                                      background: 'rgba(239, 68, 68, 0.1)', 
                                      color: '#ef4444', 
                                      border: '1px solid rgba(239, 68, 68, 0.25)', 
                                      padding: '1px 4px', 
                                      borderRadius: '4px',
                                      fontWeight: '600'
                                    }} title={isID ? "Job Order belum dikonversi ke format baru!" : "Job Order not converted to new format!"}>
                                      ⚠️ Legacy
                                    </span>
                                  )}
                                  {i < ass.length - 1 && <span style={{ color: 'var(--text-muted)' }}>,</span>}
                                </span>
                              );
                            });
                          })()}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <strong>{isID ? 'Tgl: ' : 'Date: '}</strong>
                          <span>{new Date(inv.date).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td style={{ padding: '15px' }}>
                        {(() => {
                          const associatedJOs = getAssociatedJOs(inv);
                          const allContainers = getAggregatedContainers(associatedJOs, inv);
                          if (allContainers.length === 0) return '—';
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {allContainers.map((num, idx) => (
                                <span key={idx} style={{ 
                                  fontFamily: 'monospace', 
                                  fontSize: '0.75rem', 
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
                          );
                        })()}
                      </td>
                      <td style={{ padding: '15px' }}>
                        {renderShipmentInfo(getAssociatedJOs(inv))}
                      </td>
                      <td style={{ padding: '15px', fontWeight: '600' }}>{inv.customerName}</td>
                      <td 
                        style={{ padding: '15px', textAlign: 'right', fontWeight: '700', color: 'var(--success)', fontSize: '1rem', cursor: 'pointer' }}
                        onClick={() => { setActiveTab('costing'); setSearchTerm(inv.joId); }}
                        title={isID ? 'Lihat Detail di Catatan JO' : 'View Detail in JO Records'}
                      >
                        Rp {(inv.amount || inv.subtotal).toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'right', fontWeight: '700', color: 'var(--danger)' }}>
                        {(() => {
                          const jo = jobOrders.find(j => j.id === inv.joId);
                          if (!jo) return '—';
                          const manualCost = Array.isArray(jo.costs) ? jo.costs.reduce((s,c)=>s+(c.total||0),0) : 0;
                          const poCost = (purchaseOrders || []).filter(po => po.joId === jo.id).reduce((s,p)=>s+(p.grandTotal||0),0);
                          const costAppCost = (costAppMap[String(jo.id)] || []).filter(ca => ca.status !== 'rejected').reduce((s, ca) => s + (parseFloat(ca.amount) || 0), 0);
                          const totalCost = manualCost + poCost + costAppCost;
                          return totalCost > 0 ? `Rp ${totalCost.toLocaleString('id-ID')}` : '—';
                        })()}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'right', fontWeight: '800' }}>
                        {(() => {
                          const jo = jobOrders.find(j => j.id === inv.joId);
                          if (!jo) return '—';
                          const manualCost = Array.isArray(jo.costs) ? jo.costs.reduce((s,c)=>s+(c.total||0),0) : 0;
                          const poCost = (purchaseOrders || []).filter(po => po.joId === jo.id).reduce((s,p)=>s+(p.grandTotal||0),0);
                          const costAppCost = (costAppMap[String(jo.id)] || []).filter(ca => ca.status !== 'rejected').reduce((s, ca) => s + (parseFloat(ca.amount) || 0), 0);
                          const totalCost = manualCost + poCost + costAppCost;
                          const revenue = inv.amount || inv.subtotal;
                          const profit = revenue - totalCost;
                          return (
                              <span style={{ color: profit > 0 ? 'var(--success)' : profit < 0 ? 'var(--danger)' : 'inherit' }}>
                                Rp {profit.toLocaleString('id-ID')}
                              </span>
                          );
                        })()}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                           <div>
                             <span className={`badge badge-${inv.status}`} style={{ fontSize: '0.7rem' }}>{inv.status}</span>
                           </div>
                           <div>
                             <select 
                               value={inv.deliveryStatus || 'not_sent'} 
                               onChange={(e) => updateInvoice(inv.id, { deliveryStatus: e.target.value })}
                               style={{ background:'var(--input-bg)', border:'1px solid var(--glass-border)', color:'var(--text)', fontSize:'0.7rem', padding:'4px', borderRadius:'4px' }}
                             >
                               <option value="not_sent" style={{ background: 'var(--bg)', color: 'var(--text)' }}>{isID ? 'Belum Dikirim' : 'Not Sent'}</option>
                               <option value="on_process" style={{ background: 'var(--bg)', color: 'var(--text)' }}>{isID ? 'Proses Kirim' : 'On Process'}</option>
                               <option value="delivered" style={{ background: 'var(--bg)', color: 'var(--text)' }}>{isID ? 'Diterima' : 'Delivered'}</option>
                             </select>
                           </div>
                           <div style={{ display:'flex', flexDirection:'column', gap:'5px', alignItems:'center' }}>
                             <div style={{ display:'flex', gap:'8px' }}>
                               {inv.signedInvoicePhoto ? (
                                 <button onClick={() => setPhotoViewer({ title: `Signed Invoice - ${inv.id}`, photos: [inv.signedInvoicePhoto] })} style={{ background:'none', border:'none', color:'var(--success)', cursor:'pointer' }} title={isID ? 'Invoice TTD Diunggah' : 'Signed Invoice Uploaded'}><ShieldCheck size={18}/></button>
                               ) : (
                                 <button onClick={() => setUploadSignedModal({ invId: inv.id, type: 'invoice' })} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }} title={isID ? 'Unggah Invoice TTD' : 'Upload Signed Invoice'}><Image size={18}/></button>
                               )}
                               {inv.signedReceiptPhoto ? (
                                 <button onClick={() => setPhotoViewer({ title: `Signed Delivery Receipt - ${inv.id}`, photos: [inv.signedReceiptPhoto] })} style={{ background:'none', border:'none', color:'var(--info)', cursor:'pointer' }} title={isID ? 'STT TTD Diunggah' : 'Signed STT Uploaded'}><ShieldCheck size={18}/></button>
                               ) : (
                                 <button onClick={() => setUploadSignedModal({ invId: inv.id, type: 'receipt' })} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }} title={isID ? 'Unggah STT TTD' : 'Upload Signed STT'}><FileText size={18}/></button>
                               )}
                             </div>
                             <span style={{ fontSize:'0.65rem', color:'var(--text-muted)', whiteSpace: 'nowrap' }}>
                               {!inv.signedInvoicePhoto && !inv.signedReceiptPhoto ? (isID ? 'Dokumen: Tertunda' : 'Docs: Pending') : (isID ? 'Dokumen: Sebagian/Lengkap' : 'Docs: Partial/Complete')}
                             </span>
                           </div>
                         </div>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '5px' }} onClick={() => handleDownloadInvoice(inv)}>
                            <Download size={14} /> {isID ? 'Lihat (Inv + Lampiran)' : 'View (Inv + Att)'}
                          </button>
                          {canWrite && (
                            <button 
                              className="btn" 
                              style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '5px', background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success-border)' }} 
                              onClick={() => handleStartEditInvoice(inv)}
                            >
                              <Edit3 size={14} /> Edit
                            </button>
                          )}
                          <button 
                            className="btn" 
                            style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '5px', background: 'var(--info-bg)', color: 'var(--info)', border: '1px solid var(--info-border)' }} 
                            onClick={() => {
                              const linkedJO = jobOrders.find(j => String(j.id) === String(inv.joId));
                              const linkedQuo = linkedJO ? quotations.find(q => String(q.id) === String(linkedJO.quotationId)) : null;
                              const consolidatedJOs = inv.consolidatedJOs
                                ? jobOrders.filter(j => inv.consolidatedJOs.map(String).includes(String(j.id)))
                                : linkedJO ? [linkedJO] : [];
                              const customerObj = customers.find(c => c.name === (inv.customerName || ''));
                              localStorage.setItem('print_invoice_data_' + inv.id, JSON.stringify({ 
                                invoice: {
                                  ...inv,
                                  customerAddress: inv.customerAddress || linkedQuo?.companyAddress || linkedJO?.address || customerObj?.address || ''
                                }, 
                                jo: linkedJO, 
                                consolidatedJOs, 
                                quotation: linkedQuo 
                              }));
                              window.open('/print/invoice-delivery?id=' + inv.id, '_blank');
                            }}
                          >
                            <FileText size={14} /> STT
                          </button>
                          <button 
                            className="btn" 
                            style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '5px', background: 'var(--secondary-bg)', color: 'var(--secondary)', border: '1px solid var(--secondary)' }} 
                            onClick={() => {
                              const linkedJO = jobOrders.find(j => String(j.id) === String(inv.joId));
                              const allAtts = [
                                ...(linkedJO?.photos || []),
                                inv.signedInvoicePhoto,
                                inv.signedReceiptPhoto,
                                ...(Array.isArray(inv.paymentProofPhoto) ? inv.paymentProofPhoto : (inv.paymentProofPhoto ? [inv.paymentProofPhoto] : [])),
                                ...(Array.isArray(inv.tax_deduction_proof) ? inv.tax_deduction_proof : (inv.tax_deduction_proof ? [inv.tax_deduction_proof] : []))
                              ].filter(Boolean);
                              
                              if (allAtts.length > 0) {
                                setPhotoViewer({ title: `Attachments - ${inv.id}`, photos: allAtts });
                              } else {
                                toast(isID ? "Tidak ada lampiran." : "No attachments.");
                              }
                            }}
                          >
                            <Image size={14} /> Ops
                          </button>
                          {canWrite && (
                            <button 
                              className="btn" 
                              style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '5px', background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger-border)' }} 
                              onClick={() => {
                                setDeleteConfirmModal(inv);
                                setVerifyStep(1);
                                setVerifyText('');
                                setOtpInput('');
                              }}
                            >
                              <Trash2 size={14} /> {isID ? 'Hapus' : 'Delete'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )})}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{isID ? 'Tidak ada invoice ditemukan.' : 'No invoices found.'}</td>
                  </tr>
                )}
              </tbody>
            </table></div></div>
            )}

            {selectedIssued.size > 0 && !isIssuedCollapsed && (
              <div style={{ marginTop: '20px', padding: '15px', background: 'var(--info-bg)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--info)' }}>
                <span style={{ fontWeight: '600', color:'var(--text)' }}>{selectedIssued.size} {isID ? 'Invoice Terpilih' : 'Invoices Selected'}</span>
                <button className="btn btn-primary" onClick={handleBatchPrintIssued} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <ExternalLink size={16} /> {isID ? 'Lihat Sekaligus (Inv + Lampiran)' : 'Batch View (Inv + Att)'}
                </button>
              </div>
            )}
          </div>

        </div>
      ) : activeTab === 'piutang' ? (
        <div className="piutang-section">
          {/* Sub-Navigation */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', background: 'rgba(255,255,255,0.02)', padding: '5px', borderRadius: '10px', width: 'fit-content' }}>
            <button 
              onClick={() => { setReceivableSubTab('outstanding'); setSelectedLedger(new Set()); }}
              style={{
                padding: '8px 20px', borderRadius: '8px', border: 'none',
                background: receivableSubTab === 'outstanding' ? 'var(--secondary)' : 'transparent',
                color: receivableSubTab === 'outstanding' ? 'black' : 'var(--text-muted)',
                fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s'
              }}
            >
              {isID ? 'Piutang Outstanding' : 'Outstanding Receivables'}
            </button>
            <button 
              onClick={() => { setReceivableSubTab('lunas'); setSelectedLedger(new Set()); }}
              style={{
                padding: '8px 20px', borderRadius: '8px', border: 'none',
                background: receivableSubTab === 'lunas' ? 'var(--success)' : 'transparent',
                color: receivableSubTab === 'lunas' ? 'white' : 'var(--text-muted)',
                fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s'
              }}
            >
              {isID ? 'Invoice Lunas' : 'Paid Invoices'}
            </button>

          </div>

          {receivableSubTab === 'outstanding' && (
            <div className="glass-card" style={{ padding:'25px', marginBottom:'25px', border:'1px solid var(--secondary)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
                <h4 style={{ margin:0, color:'var(--secondary)', display:'flex', alignItems:'center', gap:'10px' }}><Wallet size={20}/> {isID ? 'Ringkasan Piutang per Pelanggan' : 'Receivables Summary per Customer'}</h4>
                <button 
                  onClick={() => { setActiveTab('outstanding_summary'); handleExport(); setActiveTab('piutang'); }} 
                  className="btn btn-gold" 
                  style={{ fontSize:'0.8rem', padding:'6px 15px' }}
                >
                  <Download size={14}/> {isID ? 'Unduh Ringkasan per Pelanggan' : 'Download Summary per Customer'}
                </button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'15px' }}>
                {(() => {
                  const grouped = (receivables || [])
                    .filter(r => r.status !== 'paid')
                    .reduce((acc, r) => {
                      if (!acc[r.customerName]) acc[r.customerName] = 0;
                      acc[r.customerName] += (r.balance || r.amount);
                      return acc;
                    }, {});
                  
                  return Object.entries(grouped).map(([name, total]) => (
                    <div key={name} className="glass-card" style={{ padding: '25px', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.03)' }}>
                      <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--info-bg)', color: 'var(--info)' }}>
                        <Wallet size={24} />
                      </div>
                      <div>
                        <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--info)' }}>Rp {total.toLocaleString()}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px', marginTop: '2px' }}>{name}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--secondary)', fontWeight: '700', marginTop: '4px' }}>{isID ? 'TOTAL OUTSTANDING' : 'TOTAL OUTSTANDING'}</div>
                      </div>
                    </div>
                  ));
                })()}

                {receivables.length === 0 && <p style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>{isID ? 'Tidak ada data piutang outstanding.' : 'No outstanding receivables found.'}</p>}
              </div>
            </div>
          )}

          <div className="glass-card" style={{ padding: '25px' }}>
            <h4 style={{ marginBottom: '20px', color: receivableSubTab === 'outstanding' ? 'var(--secondary)' : 'var(--success)' }}>
              {receivableSubTab === 'outstanding' ? (isID ? 'Buku Besar Piutang Usaha' : 'Accounts Receivable Ledger') : (isID ? 'Arsip Invoice Lunas' : 'Settled Invoices Archive')}
            </h4>
            <div className="table-container"><div className="table-container"><table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '15px', width: '40px' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedLedger.size > 0 && selectedLedger.size === (receivableSubTab === 'outstanding' ? (receivables || []).filter(r => r.status !== 'paid') : (paidInvoices || [])).filter(item => filterByDate(item.date)).filter(item => item.id.toLowerCase().includes(searchTerm.toLowerCase()) || item.customerName.toLowerCase().includes(searchTerm.toLowerCase())).length}
                      onChange={() => toggleAllLedger((receivableSubTab === 'outstanding' ? (receivables || []).filter(r => r.status !== 'paid') : (paidInvoices || [])).filter(item => filterByDate(item.date)).filter(item => item.id.toLowerCase().includes(searchTerm.toLowerCase()) || item.customerName.toLowerCase().includes(searchTerm.toLowerCase())))}
                    />
                  </th>

                  <th style={{ padding: '15px' }}>Invoice</th>
                  <th style={{ padding: '15px' }}>{isID ? 'Pelanggan' : 'Customer'}</th>
                  <th style={{ padding: '15px' }}>{isID ? 'Info Pengiriman' : 'Shipment Info'}</th>
                  <th style={{ padding: '15px' }}>{receivableSubTab === 'outstanding' ? (isID ? 'Jumlah Piutang' : 'Outstanding Amount') : (isID ? 'Jumlah Dibayar' : 'Amount Paid')}</th>
                  {receivableSubTab === 'lunas' && <th style={{ padding: '15px' }}>{isID ? 'Potongan Pajak' : 'Tax Ded.'}</th>}
                  <th style={{ padding: '15px' }}>{isID ? 'Aksi' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const outstandingReceivables = (receivables || []).filter(r => r.status !== 'paid');
                  const filteredItems = (receivableSubTab === 'outstanding' ? outstandingReceivables : paidInvoices)
                    .filter(item => filterByDate(item.date))
                    .filter(item => {
                      const id = item.id || '';
                      const name = item.customerName || '';
                      const term = searchTerm.toLowerCase();
                      return id.toLowerCase().includes(term) || name.toLowerCase().includes(term);
                    });
                  
                  const sortedItems = sortInvoices(filteredItems, invoiceSortBy);
                  
                  return sortedItems.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '15px' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedLedger.has(item.id)}
                          onChange={() => toggleLedgerSelection(item.id)}
                        />
                      </td>
                      <td style={{ padding: '15px', color: 'var(--secondary)', fontWeight: 'bold' }}>{item.id}</td>
                      <td style={{ padding: '15px' }}>{item.customerName}</td>
                      <td style={{ padding: '15px' }}>
                        {(() => {
                          const originalInv = invoices.find(i => i.id === item.id || i.id === item.invoiceId);
                          const associatedJOs = originalInv ? getAssociatedJOs(originalInv) : [];
                          return renderShipmentInfo(associatedJOs);
                        })()}
                      </td>
                      <td style={{ padding: '15px', fontWeight: 'bold' }}>
                        Rp {(item.balance || item.amount).toLocaleString()}
                        {receivableSubTab === 'lunas' && item.paidDate && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 'normal', marginTop: '4px' }}>
                            {isID ? 'Lunas: ' : 'Paid: '}{item.paidDate}
                          </div>
                        )}
                      </td>
                      {receivableSubTab === 'lunas' && (
                        <td style={{ padding: '15px' }}>
                          <div style={{ color: 'var(--danger)', fontWeight: '600' }}>Rp {(item.tax_deduction || 0).toLocaleString()}</div>
                          {item.tax_deduction_proof && (
                            <button 
                              onClick={() => setPhotoViewer({ title: `${isID ? 'Bukti Potong Pajak' : 'Bukti Potong Pajak'} - ${item.id}`, photos: item.tax_deduction_proof })}
                              style={{ background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer', padding: 0, marginTop: '4px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <ShieldCheck size={12}/> {isID ? 'Lihat Bukti' : 'View Proof'}
                            </button>
                          )}
                        </td>
                      )}
                      <td style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="btn" 
                            style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--info-bg)', color: 'var(--info)', border: '1px solid var(--info-border)' }}
                            onClick={() => handleDownloadInvoice(item)}
                          >
                            <ShieldCheck size={14} /> {isID ? 'Dokumen' : 'Doc'}
                          </button>
                          {canWrite && (
                            <button 
                              className="btn" 
                              style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success-border)' }}
                              onClick={() => {
                                const originalInv = invoices.find(i => i.id === item.id || i.id === item.invoiceId);
                                handleStartEditInvoice(originalInv || item);
                              }}
                            >
                              <Edit3 size={14} /> {isID ? 'Ubah' : 'Edit'}
                            </button>
                          )}

                          {receivableSubTab === 'outstanding' ? (
                            canWrite && (
                              <>
                                <ButtonWithLoading className="btn btn-gold" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => handleSettle(item)}>
                                  {isID ? 'Lunasi' : 'Settle'}
                                </ButtonWithLoading>
                                <button 
                                  className="btn" 
                                  style={{ padding: '8px 12px', fontSize: '0.8rem', background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger-border)' }} 
                                  onClick={() => {
                                    setDeleteConfirmModal(item);
                                    setVerifyStep(1);
                                    setVerifyText('');
                                    setOtpInput('');
                                  }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )
                          ) : (
                            <>
                              {canWrite && (
                                <>
                                  <button 
                                    className="btn btn-gold" 
                                    style={{ padding: '8px 12px', fontSize: '0.8rem', gap: '5px' }} 
                                    onClick={() => {
                                      setReceivableProofModal(item);
                                      setModalPhotos(item.paymentProofPhoto ? (Array.isArray(item.paymentProofPhoto) ? item.paymentProofPhoto : [item.paymentProofPhoto]) : []);
                                      setModalTaxPhotos(item.tax_deduction_proof ? (Array.isArray(item.tax_deduction_proof) ? item.tax_deduction_proof : [item.tax_deduction_proof]) : []);
                                    }}
                                    title={isID ? "Unggah Bukti Pajak / Bukti Bayar" : "Upload Tax Proof / Payment Proof"}
                                  >
                                    <Image size={14} /> {isID ? 'Bukti Pajak' : 'Upload Tax Proof'}
                                  </button>
                                  <button 
                                    className="btn" 
                                    style={{ padding: '8px 12px', fontSize: '0.8rem', background: 'var(--warning-bg)', color: 'var(--warning)', border: '1px solid rgba(245, 158, 11, 0.2)', gap: '5px' }} 
                                    onClick={() => handleUndoPaidInvoice(item)}
                                    title={isID ? "Batal Pembayaran" : "Undo Payment"}
                                  >
                                    <RotateCcw size={14} /> {isID ? 'Batal' : 'Undo'}
                                  </button>
                                </>
                              )}
                              <button 
                                className="btn btn-primary" 
                                style={{ padding: '8px 16px', fontSize: '0.85rem', gap: '5px' }} 
                                onClick={() => handleDownloadInvoice(item)}
                              >
                                <Download size={14} /> {isID ? 'Lihat (Dokumen Lengkap)' : 'View (Full Doc)'}
                              </button>
                              {canWrite && (
                                <button 
                                  className="btn" 
                                  style={{ padding: '8px 12px', fontSize: '0.8rem', background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger-border)' }} 
                                  onClick={() => {
                                    setDeleteConfirmModal(item);
                                    setVerifyStep(1);
                                    setVerifyText('');
                                    setOtpInput('');
                                  }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ));
                })()}

                {((receivableSubTab === 'outstanding' ? receivables : paidInvoices).length === 0) && (
                  <tr>
                    <td colSpan={receivableSubTab === 'lunas' ? "6" : "5"} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{isID ? 'Data tidak ditemukan.' : 'No records found.'}</td>
                  </tr>
                )}
              </tbody>
            </table></div></div>

            {selectedLedger.size > 0 && (
              <div style={{ marginTop: '20px', padding: '15px', background: receivableSubTab === 'lunas' ? 'var(--success-bg)' : 'var(--secondary-bg)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: receivableSubTab === 'lunas' ? '1px solid var(--success)' : '1px solid var(--secondary)' }}>
                <span style={{ fontWeight: '600', color:'var(--text)' }}>{selectedLedger.size} {isID ? 'Invoice Terpilih' : 'Invoices Selected'}</span>
                {receivableSubTab === 'lunas' ? (
                  <button className="btn" style={{ background:'var(--success)', color:'white', display:'flex', alignItems:'center', gap:'8px' }} onClick={handleBatchPrintPaidInvoices}>
                    <ExternalLink size={16} /> {isID ? 'Lihat Sekaligus (Dokumen Lengkap)' : 'Batch View (Full Doc)'}
                  </button>
                ) : (
                  <button className="btn btn-gold" onClick={handleBatchPrint} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <Download size={16} /> {isID ? 'Unduh Invoice Terpilih (Batch)' : 'Download Selected Invoices (Batch)'}
                  </button>
                )}
              </div>
            )}

          </div>
        </div>
      ) : activeTab === 'salary' ? (
        <div className="salary-section">
          <div className="glass-card" style={{ padding: '25px', marginBottom: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h4 style={{ margin: 0, color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <User size={20} /> {isID ? 'Pengeluaran Biaya Gaji' : 'Payroll & Salary Expenses'}
              </h4>
              {canWrite && (
                <button className="btn btn-primary" style={{ background: '#8b5cf6' }} onClick={() => { setSalaryForm({ name: '', position: '', bankAccount: '', bankName: '', baseSalary: '', period: '', nik: '', npwp: '', taxes: [], proofPhoto: '', expenseDate: '' }); setSalaryModal(true); }}>
                  <Plus size={16} /> {isID ? 'Tambah Data Gaji' : 'Add Salary Data'}
                </button>
              )}
            </div>
            
            <div className="table-container"><div className="table-container"><table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #8b5cf6' }}>
                  <th style={{ padding: '15px' }}>{isID ? 'Nama / Jabatan' : 'Name / Position'}</th>
                  <th style={{ padding: '15px' }}>{isID ? 'Rekening' : 'Bank Account'}</th>
                  <th style={{ padding: '15px' }}>{isID ? 'Periode' : 'Period'}</th>
                  <th style={{ padding: '15px', textAlign: 'right' }}>{isID ? 'Gaji Pokok' : 'Base Salary'}</th>
                  <th style={{ padding: '15px', textAlign: 'right' }}>{isID ? 'Potongan Pajak' : 'Tax Deduction'}</th>
                  <th style={{ padding: '15px', textAlign: 'right' }}>{isID ? 'Total Bayar' : 'Total Paid'}</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>{isID ? 'Bukti' : 'Proof'}</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>{isID ? 'Aksi' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {salaries.filter(s => (s.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontWeight: '700', color: 'var(--text)' }}>{s.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                        {renderPositionTags(s.position)}
                        <span>| NIK: {s.nik}</span>
                      </div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontSize: '0.85rem' }}>{s.bankName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: '600' }}>{s.bankAccount}</div>
                    </td>
                    <td style={{ padding: '15px' }}>{s.period}</td>
                    <td style={{ padding: '15px', textAlign: 'right', fontWeight: '600' }}>Rp {parseFloat(s.baseSalary || 0).toLocaleString()}</td>
                    <td style={{ padding: '15px', textAlign: 'right', color: 'var(--danger)' }}>
                      - Rp {s.taxes.reduce((acc, t) => acc + parseFloat(t.amount || 0), 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'right', fontWeight: '800', color: 'var(--success)' }}>
                      Rp {parseFloat(s.totalToPay || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      {s.proofPhoto ? (
                        <button onClick={() => setPhotoViewer({ title: `${isID ? 'Bukti Gaji' : 'Salary Proof'} - ${s.name}`, photos: [s.proofPhoto] })} style={{ background:'none', border:'none', color:'var(--secondary)', cursor:'pointer' }}><Image size={18}/></button>
                      ) : <span style={{ color:'var(--text-muted)' }}>-</span>}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button className="btn btn-gold" style={{ padding: '5px 10px', fontSize: '0.75rem', gap: '5px' }} onClick={() => setSalarySlip(s)}>
                          <Download size={14} /> {isID ? 'Slip' : 'Slip'}
                        </button>
                        {canWrite && (
                          <button className="btn btn-sm" style={{ background: 'var(--secondary-bg)', color: 'var(--secondary)', border: '1px solid var(--secondary)', display:'flex', alignItems:'center', justifyContent:'center', width:'32px', height:'32px', borderRadius:'6px', cursor:'pointer' }} onClick={() => { setSalaryForm(s); setSalaryModal(true); }}>
                            <Edit3 size={14} />
                          </button>
                        )}
                        {canWrite && (
                          <button className="btn btn-sm btn-danger" onClick={() => deleteSalary(s.id)} style={{ width:'32px', height:'32px' }}>
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {salaries.length === 0 && (
                  <tr><td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{isID ? 'Belum ada data gaji tercatat.' : 'No salary records registered.'}</td></tr>
                )}
              </tbody>
            </table></div></div>
          </div>
        </div>
      ) : activeTab === 'reimbursements' ? (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Receipt size={24} style={{ color: '#14b8a6' }} /> {isID ? 'Reimbursement Staff' : 'Staff Reimbursements'}
            </h2>
            <button
              onClick={handleNewReimbursement}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem',
                background: 'linear-gradient(135deg, #14b8a6, #0f766e)', color: 'white', border: 'none', boxShadow: '0 4px 15px rgba(20,184,166,0.3)'
              }}
            >
              <Plus size={18} /> {isID ? 'Pengajuan Baru' : 'New Application'}
            </button>
          </div>

          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: '15px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{isID ? 'Tanggal' : 'Date'}</th>
                    <th style={{ padding: '15px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{isID ? 'Nama Staff' : 'Staff Name'}</th>
                    <th style={{ padding: '15px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{isID ? 'Total Biaya' : 'Total Cost'}</th>
                    <th style={{ padding: '15px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{isID ? 'Penerima / Rekening' : 'Recipient / Bank'}</th>
                    <th style={{ padding: '15px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>{isID ? 'Status' : 'Status'}</th>
                    <th style={{ padding: '15px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>{isID ? 'Aksi' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {reimbursementsList.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        {isID ? 'Belum ada data reimbursement.' : 'No reimbursements recorded yet.'}
                      </td>
                    </tr>
                  ) : (
                    reimbursementsList.map((r, i) => (
                      <tr key={r.id || i} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }}>
                        <td style={{ padding: '15px' }}>{new Date(r.expenseDate || r.date).toLocaleDateString(isID ? 'id-ID' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td style={{ padding: '15px', fontWeight: '600' }}>{r.employeeName}</td>
                        <td style={{ padding: '15px', fontWeight: '600', color: 'var(--text)' }}>Rp {parseFloat(r.totalCost || r.amount || 0).toLocaleString()}</td>
                        <td style={{ padding: '15px' }}>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>
                              {isID ? 'Penerima:' : 'Recipient:'}
                            </span>
                            <div style={{ fontSize: '0.85rem' }}>{r.recipientBankName || '-'}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: '600' }}>{r.recipientBankAccount || '-'}</div>
                          </div>
                          {(() => {
                            if (r.companyBankAccountId === 'CUSTOM' && r.customSourceTarget) {
                              return (
                                <div style={{ marginTop: '5px', paddingTop: '5px', borderTop: '1px dashed var(--glass-border)' }}>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                    {isID ? 'Sumber Dana:' : 'Paid Via:'}
                                  </span>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: '600' }}>{r.customSourceTarget}</div>
                                </div>
                              );
                            }
                            const companyBank = companyBankAccounts.find(b => b.id === r.companyBankAccountId);
                            if (companyBank) {
                              return (
                                <div style={{ marginTop: '5px', paddingTop: '5px', borderTop: '1px dashed var(--glass-border)' }}>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                    {isID ? 'Sumber Dana:' : 'Paid Via:'}
                                  </span>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--text)' }}>{companyBank.bankName} - {companyBank.accountNumber}</div>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <select 
                            disabled={!canWrite}
                            value={r.status || 'pending'} 
                            onChange={(e) => handleUpdateReimbursementStatus(r, e.target.value)}
                            style={{ 
                              padding: '6px 12px', borderRadius: '20px', border: 'none', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', cursor: canWrite ? 'pointer' : 'not-allowed',
                              background: r.status === 'paid' ? 'var(--success-bg)' : r.status === 'approved' ? 'var(--info-bg)' : 'var(--warning-bg)',
                              color: r.status === 'paid' ? 'var(--success)' : r.status === 'approved' ? 'var(--info)' : 'var(--warning)',
                              opacity: canWrite ? 1 : 0.7
                            }}
                          >
                            <option value="pending">{isID ? 'Menunggu' : 'Pending'}</option>
                            <option value="approved">{isID ? 'Disetujui' : 'Approved'}</option>
                            <option value="paid">{isID ? 'Dibayar' : 'Paid'}</option>
                          </select>
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            {canWrite && (
                              <button onClick={() => handleEditReimbursement(r)} style={{ background: 'var(--info-bg)', color: 'var(--info)', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }} title={isID ? 'Edit Data' : 'Edit Data'}>
                                <Edit3 size={16} />
                              </button>
                            )}
                            {canWrite && (
                              <button onClick={async () => {
                                const confirmed = await confirm(
                                  isID ? 'Yakin hapus data ini?' : 'Delete this record?',
                                  {
                                    title: isID ? 'Hapus Data' : 'Delete Data',
                                    confirmText: isID ? 'Hapus' : 'Delete',
                                    cancelText: isID ? 'Batal' : 'Cancel',
                                    isDanger: true
                                  }
                                );
                                if (confirmed) deleteOtherExpense(r.id);
                              }} style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }} title={isID ? 'Hapus Data' : 'Delete Data'}>
                                <Trash2 size={16} />
                              </button>
                            )}
                            {!canWrite && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'other_expenses' ? (
        <div className="other-expenses-section">
          <div className="glass-card" style={{ padding: '25px', marginBottom: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h4 style={{ margin: 0, color: '#ec4899', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Briefcase size={20} /> {isID ? 'Transaksi Pendapatan & Pengeluaran Lain' : 'Other Income & Expense Transactions'}
              </h4>
              <div style={{ display: 'flex', gap: '10px' }}>
                {canWrite && (
                  <button className="btn" style={{ background: 'linear-gradient(135deg, var(--success), #047857)', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => handleNewOtherTransaction('income')}>
                    <Plus size={16} /> {isID ? 'Tambah Pendapatan' : 'Add Income'}
                  </button>
                )}
                {canWrite && (
                  <button className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #ec4899, #be185d)', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => handleNewOtherTransaction('expense')}>
                    <Plus size={16} /> {isID ? 'Tambah Pengeluaran' : 'Add Expense'}
                  </button>
                )}
              </div>
            </div>

            {/* Sub-Navigation Toggle & Category/Subcategory Filters */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '25px' }}>
              <div style={{ display: 'flex', gap: '5px', background: 'rgba(255,255,255,0.02)', padding: '5px', borderRadius: '10px', alignItems: 'center' }}>
                <button
                  onClick={() => setTransactionTypeFilter('all')}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', transition: 'all 0.2s',
                    background: transactionTypeFilter === 'all' ? 'var(--secondary)' : 'transparent',
                    color: transactionTypeFilter === 'all' ? '#1a1200' : 'var(--text-muted)',
                    border: 'none'
                  }}
                >
                  {isID ? 'Semua Transaksi' : 'All Transactions'}
                </button>
                <button
                  onClick={() => setTransactionTypeFilter('income')}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', transition: 'all 0.2s',
                    background: transactionTypeFilter === 'income' ? 'linear-gradient(135deg, var(--success), #047857)' : 'transparent',
                    color: transactionTypeFilter === 'income' ? 'white' : 'var(--text-muted)',
                    border: 'none'
                  }}
                >
                  {isID ? '🟢 Pendapatan' : '🟢 Income'}
                </button>
                <button
                  onClick={() => setTransactionTypeFilter('expense')}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', transition: 'all 0.2s',
                    background: transactionTypeFilter === 'expense' ? 'linear-gradient(135deg, #ec4899, #be185d)' : 'transparent',
                    color: transactionTypeFilter === 'expense' ? 'white' : 'var(--text-muted)',
                    border: 'none'
                  }}
                >
                  {isID ? '🔴 Pengeluaran' : '🔴 Expense'}
                </button>
              </div>

              {/* Category & Subcategory filters */}
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>{isID ? 'Kategori:' : 'Category:'}</span>
                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="all">{isID ? 'Semua Kategori' : 'All Categories'}</option>
                    {existingCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>{isID ? 'Subkategori:' : 'Subcategory:'}</span>
                  <select
                    value={subcategoryFilter}
                    onChange={e => setSubcategoryFilter(e.target.value)}
                    disabled={categoryFilter === 'all'}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: categoryFilter === 'all' ? 'rgba(255,255,255,0.02)' : 'var(--input-bg)',
                      border: '1px solid var(--border)',
                      color: categoryFilter === 'all' ? 'var(--text-muted)' : 'var(--text)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      cursor: categoryFilter === 'all' ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="all">{isID ? 'Semua Subkategori' : 'All Subcategories'}</option>
                    {availableSubcategories.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {(() => {
              const transactionsByMonth = {};
              filteredOtherTransactions.forEach(t => {
                const dateStr = t.expenseDate || t.date;
                const dateObj = new Date(dateStr);
                let mKey = 'Unknown';
                if (!isNaN(dateObj.getTime())) {
                  mKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
                }
                if (!transactionsByMonth[mKey]) {
                  transactionsByMonth[mKey] = {
                    key: mKey,
                    income: 0,
                    expense: 0,
                    items: []
                  };
                }
                const totalAmount = parseFloat(t.totalAfterTax || t.amount || 0);
                if (t.type === 'income') {
                  transactionsByMonth[mKey].income += totalAmount;
                } else {
                  transactionsByMonth[mKey].expense += totalAmount;
                }
                transactionsByMonth[mKey].items.push(t);
              });

              const sortedMonths = Object.keys(transactionsByMonth).sort((a, b) => b.localeCompare(a));

              if (filteredOtherTransactions.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
                    <Briefcase size={48} style={{ opacity: 0.2, marginBottom: '15px', display: 'block', margin: '0 auto 15px' }} />
                    <p style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '6px' }}>{isID ? 'Belum ada transaksi pendapatan atau pengeluaran lain.' : 'No other income or expense transactions yet.'}</p>
                    <p style={{ fontSize: '0.85rem' }}>{isID ? 'Tambahkan transaksi baru menggunakan tombol di atas.' : 'Add new transactions using the buttons above.'}</p>
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {sortedMonths.map(mKey => {
                    const monthData = transactionsByMonth[mKey];
                    const isExpanded = !!expandedOtherTxMonths[mKey];
                    
                    const monthName = (() => {
                      if (mKey === 'Unknown') return isID ? 'Tidak Diketahui' : 'Unknown';
                      const [year, month] = mKey.split('-');
                      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
                      return date.toLocaleDateString(isID ? 'id-ID' : 'en-US', { month: 'long', year: 'numeric' });
                    })();

                    const netBalance = monthData.income - monthData.expense;

                    return (
                      <div key={mKey} className="glass-card" style={{ border: '1px solid var(--glass-border)', borderRadius: '12px', overflow: 'hidden', background: 'rgba(255,255,255,0.01)' }}>
                        {/* Monthly Summary Header */}
                        <div 
                          onClick={() => setExpandedOtherTxMonths(prev => ({ ...prev, [mKey]: !isExpanded }))}
                          style={{ 
                            padding: '15px 20px', 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            cursor: 'pointer', 
                            background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent',
                            transition: 'background 0.2s',
                            gap: '15px'
                          }}
                          className="table-row-hover"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', color: '#ec4899' }}>
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </span>
                            <span style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--secondary)' }}>{monthName}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '10px' }}>
                              ({monthData.items.length} {isID ? 'transaksi' : 'transactions'})
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '0.85rem' }}>
                            {monthData.income > 0 && (
                              <div>
                                <span style={{ color: 'var(--text-muted)', marginRight: '5px' }}>{isID ? 'Pemasukan:' : 'Income:'}</span>
                                <span style={{ fontWeight: '700', color: 'var(--success)' }}>+Rp {monthData.income.toLocaleString()}</span>
                              </div>
                            )}
                            {monthData.expense > 0 && (
                              <div>
                                <span style={{ color: 'var(--text-muted)', marginRight: '5px' }}>{isID ? 'Pengeluaran:' : 'Expense:'}</span>
                                <span style={{ fontWeight: '700', color: '#ec4899' }}>-Rp {monthData.expense.toLocaleString()}</span>
                              </div>
                            )}
                            <div style={{ borderLeft: '1px solid var(--glass-border)', paddingLeft: '20px' }}>
                              <span style={{ color: 'var(--text-muted)', marginRight: '5px' }}>Net:</span>
                              <span style={{ fontWeight: '800', color: netBalance >= 0 ? 'var(--success)' : '#ec4899' }}>
                                {netBalance >= 0 ? '+' : '-'}Rp {Math.abs(netBalance).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Monthly Transactions Table */}
                        {isExpanded && (
                          <div style={{ padding: '20px', borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.1)', overflowX: 'auto' }}>
                            <div className="table-container">
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr style={{ textAlign: 'left', borderBottom: '2px solid #ec4899' }}>
                                    <th style={{ padding: '15px' }}>{isID ? 'Deskripsi / Transaksi' : 'Description / Transaction'}</th>
                                    <th style={{ padding: '15px' }}>{isID ? 'Kategori' : 'Category'}</th>
                                    <th style={{ padding: '15px' }}>{isID ? 'Rekening / Penerima' : 'Account / Recipient'}</th>
                                    <th style={{ padding: '15px' }}>{isID ? 'Tanggal' : 'Date'}</th>
                                    <th style={{ padding: '15px', textAlign: 'right' }}>{isID ? 'Nominal' : 'Amount'}</th>
                                    <th style={{ padding: '15px', textAlign: 'right' }}>{isID ? 'Potongan Pajak' : 'Tax Deduction'}</th>
                                    <th style={{ padding: '15px', textAlign: 'right' }}>Total</th>
                                    <th style={{ padding: '15px', textAlign: 'center' }}>{isID ? 'Bukti' : 'Proof'}</th>
                                    <th style={{ padding: '15px', textAlign: 'center' }}>{isID ? 'Aksi' : 'Action'}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {monthData.items.map(t => (
                                    <tr 
                                      key={t.id} 
                                      id={`tx-row-${t.id}`}
                                      style={{ 
                                        borderBottom: '1px solid var(--glass-border)',
                                        background: t.id === highlightId ? 'rgba(212, 175, 55, 0.15)' : undefined 
                                      }} 
                                      className="table-row-hover"
                                    >
                                      <td style={{ padding: '15px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <span style={{
                                            fontSize: '0.65rem', padding: '2px 6px', borderRadius: '12px',
                                            background: t.type === 'income' ? 'rgba(16,185,129,0.15)' : 'rgba(236,72,153,0.15)',
                                            color: t.type === 'income' ? 'var(--success)' : '#ec4899', fontWeight: '800', textTransform: 'uppercase'
                                          }}>
                                            {isID ? (t.type === 'income' ? 'MASUK' : 'KELUAR') : (t.type === 'income' ? 'INCOME' : 'EXPENSE')}
                                          </span>
                                          <span style={{ fontWeight: '700', color: 'var(--text)' }}>
                                            {t.description || (isID ? 'Tanpa Deskripsi' : 'No Description')}
                                          </span>
                                        </div>
                                        {t.employeeName && t.employeeName !== 'Umum' && (
                                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                                            <span>{isID ? 'Karyawan' : 'Employee'}: {t.employeeName}</span>
                                            {t.position && (
                                              <>
                                                <span>(</span>
                                                {renderPositionTags(t.position)}
                                                <span>)</span>
                                              </>
                                            )}
                                          </div>
                                        )}
                                      </td>
                                      <td style={{ padding: '15px' }}>
                                        <span style={{
                                          fontSize: '0.75rem', padding: '4px 10px', borderRadius: '6px',
                                          background: 'rgba(255,255,255,0.05)', color: 'var(--text)', border: '1px solid var(--glass-border)',
                                          fontWeight: '600', display: 'inline-block'
                                        }}>
                                          {t.category || (isID ? 'Lain-lain' : 'Others')}
                                        </span>
                                        {t.subcategory && (
                                          <div style={{ fontSize: '0.7rem', color: 'var(--secondary)', marginTop: '4px', paddingLeft: '4px', fontWeight: '500' }}>
                                            ↳ {t.subcategory}
                                          </div>
                                        )}
                                      </td>
                                      <td style={{ padding: '15px' }}>
                                        {t.bankName && t.bankName !== '-' ? (
                                          <div style={{ marginBottom: '6px' }}>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                              {isID ? 'Penerima:' : 'Recipient:'}
                                            </span>
                                            <div style={{ fontSize: '0.85rem' }}>{t.bankName}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: '600' }}>{t.bankAccount}</div>
                                          </div>
                                        ) : null}

                                        {(() => {
                                          if (t.companyBankAccountId === 'CUSTOM' && t.customSourceTarget) {
                                            return (
                                              <div>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                                  {t.type === 'income' 
                                                    ? (isID ? 'Target:' : 'Target:') 
                                                    : (isID ? 'Sumber:' : 'Source:')}
                                                </span>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{t.customSourceTarget}</div>
                                              </div>
                                            );
                                          }
                                          const companyBank = companyBankAccounts.find(b => b.id === t.companyBankAccountId);
                                          if (companyBank) {
                                            return (
                                              <div>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                                  {t.type === 'income' 
                                                    ? (isID ? 'Target (Rek. Perusahaan):' : 'Target (Company Acc):') 
                                                    : (isID ? 'Sumber (Rek. Perusahaan):' : 'Source (Company Acc):')}
                                                </span>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{companyBank.bankName}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: '600' }}>{companyBank.accountNumber}</div>
                                              </div>
                                            );
                                          }
                                          return !t.bankName || t.bankName === '-' ? <span style={{ color: 'var(--text-muted)' }}>-</span> : null;
                                        })()}
                                      </td>
                                      <td style={{ padding: '15px' }}>{new Date(t.expenseDate || t.date).toLocaleDateString(isID ? 'id-ID' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                      <td style={{ padding: '15px', textAlign: 'right', fontWeight: '600' }}>Rp {parseFloat(t.amount || 0).toLocaleString()}</td>
                                      <td style={{ padding: '15px', textAlign: 'right', color: 'var(--danger)' }}>
                                        {t.taxes && t.taxes.length > 0 ? `- Rp ${t.taxes.reduce((acc, x) => acc + parseFloat(x.amount || 0), 0).toLocaleString()}` : '-'}
                                      </td>
                                      <td style={{
                                        padding: '15px', textAlign: 'right', fontWeight: '800',
                                        color: t.type === 'income' ? 'var(--success)' : '#ec4899'
                                      }}>
                                        {t.type === 'income' ? '+' : '-'} Rp {parseFloat(t.totalAfterTax || t.amount || 0).toLocaleString()}
                                      </td>
                                      <td style={{ padding: '15px', textAlign: 'center' }}>
                                        {t.proofPhoto ? (
                                          <button onClick={() => setPhotoViewer({ title: `${isID ? 'Bukti Transaksi' : 'Transaction Proof'} - ${t.description}`, photos: [t.proofPhoto] })} style={{ background:'none', border:'none', color:'var(--secondary)', cursor:'pointer' }}><Image size={18}/></button>
                                        ) : <span style={{ color:'var(--text-muted)' }}>-</span>}
                                      </td>
                                      <td style={{ padding: '15px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                          {canWrite && (
                                            <button className="btn btn-sm" style={{ background: 'var(--secondary-bg)', color: 'var(--secondary)', border: '1px solid var(--secondary)', display:'flex', alignItems:'center', justifyContent:'center', width:'32px', height:'32px', borderRadius:'6px', cursor:'pointer' }} onClick={() => handleEditOtherTransaction(t)}>
                                              <Edit3 size={14} />
                                            </button>
                                          )}
                                          {canWrite && (
                                            <button className="btn btn-sm btn-danger" onClick={() => deleteOtherExpense(t.id)} style={{ width:'32px', height:'32px' }}>
                                              <Trash2 size={14} />
                                            </button>
                                          )}
                                          {!canWrite && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      ) : activeTab === 'hutang' ? (
        <div className="hutang-section">
          {/* Sub-Navigation */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', background: 'rgba(255,255,255,0.02)', padding: '5px', borderRadius: '10px', width: 'fit-content', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button 
                onClick={() => setPayableSubTab('outstanding')}
                style={{
                  padding: '8px 20px', borderRadius: '8px', border: 'none',
                  background: payableSubTab === 'outstanding' ? 'var(--warning)' : 'transparent',
                  color: payableSubTab === 'outstanding' ? 'black' : 'var(--text-muted)',
                  fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s'
                }}
              >
                {isID ? 'Hutang Outstanding' : 'Outstanding Payables'}
              </button>
              <button 
                onClick={() => { setPayableSubTab('lunas'); setSelectedPayables(new Set()); }}
                style={{
                  padding: '8px 20px', borderRadius: '8px', border: 'none',
                  background: payableSubTab === 'lunas' ? 'var(--success)' : 'transparent',
                  color: payableSubTab === 'lunas' ? 'white' : 'var(--text-muted)',
                  fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s'
                }}
              >
                {isID ? 'Hutang Lunas' : 'Paid Payables'}
              </button>
            </div>
            <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)', margin: '0 5px' }}></div>
            {payableSubTab === 'outstanding' && canWrite && (
              <button 
                onClick={() => { setPoJoId(''); setPoVendorId(''); setShowPOModal(true); }}
                style={{
                  padding: '8px 20px', borderRadius: '8px', border: 'none',
                  background: 'var(--secondary)', color: 'black',
                  fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <Plus size={16}/> {isID ? 'Tambah Hutang (PO)' : 'Add Payable (PO)'}
              </button>
            )}
          </div>

          <div className="glass-card" style={{ padding: '25px' }}>
            <h4 style={{ marginBottom: '20px', color: payableSubTab === 'outstanding' ? 'var(--warning)' : 'var(--success)' }}>
              {payableSubTab === 'outstanding' ? (isID ? 'Buku Besar Hutang Vendor Outstanding' : 'Outstanding Vendor Payables') : (isID ? 'Arsip Hutang Vendor Lunas' : 'Settled Vendor Payables')}
            </h4>
            <div className="table-container"><div className="table-container"><table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--glass-border)' }}>
                  <th style={{ padding: '15px', width: '40px' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedPayables.size > 0 && selectedPayables.size === purchaseOrders.filter(po => po.status === (payableSubTab === 'outstanding' ? 'issued' : 'paid') && filterByDate(po.date) && (po.id.toLowerCase().includes(searchTerm.toLowerCase()) || po.vendorName.toLowerCase().includes(searchTerm.toLowerCase()))).length}
                      onChange={() => toggleAllPayables(purchaseOrders.filter(po => po.status === (payableSubTab === 'outstanding' ? 'issued' : 'paid') && filterByDate(po.date) && (po.id.toLowerCase().includes(searchTerm.toLowerCase()) || po.vendorName.toLowerCase().includes(searchTerm.toLowerCase()))))}
                    />
                  </th>
                  <th style={{ padding: '15px' }}>PO ID / JO</th>
                  <th style={{ padding: '15px' }}>{isID ? 'Nama Vendor' : 'Vendor Name'}</th>
                  <th style={{ padding: '15px' }}>{isID ? 'Tanggal' : 'Date'}</th>
                  <th style={{ padding: '15px', textAlign: 'right' }}>{payableSubTab === 'outstanding' ? (isID ? 'Total Keseluruhan' : 'Grand Total') : (isID ? 'Nominal Dibayar' : 'Amount Paid')}</th>
                   <th style={{ padding: '15px', textAlign: 'center' }}>{isID ? 'Faktur Vendor' : 'Inv Vendor'}</th>
                   <th style={{ padding: '15px', textAlign: 'center' }}>{isID ? 'Pajak (PPh)' : 'Tax (PPh)'}</th>
                   <th style={{ padding: '15px', textAlign: 'center' }}>{isID ? 'Bukti Bayar' : 'Payment Proof'}</th>
                   <th style={{ padding: '15px', textAlign: 'center' }}>{isID ? 'Bukti Pajak' : 'Tax Proof'}</th>
                   <th style={{ padding: '15px', textAlign: 'center' }}>{isID ? 'Aksi' : 'Action'}</th>

                </tr>
              </thead>
              <tbody>
                {(() => {
                  const filteredPOs = purchaseOrders
                    .filter(po => po.status === (payableSubTab === 'outstanding' ? 'issued' : 'paid'))
                    .filter(po => filterByDate(po.date))
                    .filter(po => {
                      const id = po.id || '';
                      const name = po.vendorName || '';
                      const term = searchTerm.toLowerCase();
                      return id.toLowerCase().includes(term) || name.toLowerCase().includes(term);
                    });
                  
                  return filteredPOs.map(po => (
                    <tr key={po.id} style={{ borderBottom: '1px solid var(--glass-border)' }} className="table-row-hover">
                      <td style={{ padding: '15px' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedPayables.has(po.id)}
                          onChange={() => togglePayableSelection(po.id)}
                        />
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ fontWeight: '700', color: 'var(--secondary)' }}>{po.id}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>JO: {po.joId}</div>
                      </td>
                      <td style={{ padding: '15px', fontWeight: '600' }}>{po.vendorName}</td>
                      <td style={{ padding: '15px' }}>{new Date(po.date).toLocaleDateString(isID ? 'id-ID' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td style={{ padding: '15px', textAlign: 'right' }}>
                        {payableSubTab === 'outstanding' ? (
                          <div style={{ fontWeight: '800', color: 'var(--warning)' }}>Rp {parseFloat(po.grandTotal || 0).toLocaleString()}</div>
                        ) : (
                          <div>
                            <div style={{ fontWeight: '900', color: 'var(--success)', fontSize: '1rem' }}>
                              Rp {(parseFloat(po.grandTotal || 0) - (parseFloat(po.tax_amount) || 0)).toLocaleString()}
                            </div>
                            {po.tax_amount > 0 && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                                (Inv: Rp {parseFloat(po.grandTotal).toLocaleString()})
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        {po.vendorInvoicePhoto && po.vendorInvoicePhoto.length > 0 ? (
                          <div style={{ display:'flex', gap:'5px', justifyContent:'center' }}>
                            <button onClick={() => setPhotoViewer({ title: `${isID ? 'Invoice Vendor' : 'Vendor Invoice'} - ${po.vendorName}`, photos: po.vendorInvoicePhoto })} style={{ background:'none', border:'none', color:'var(--secondary)', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
                              <Image size={18}/> 
                              <span style={{ fontSize:'0.7rem', fontWeight:'700' }}>({po.vendorInvoicePhoto.length})</span>
                            </button>
                            {canWrite && (
                              <>
                                <button onClick={() => { setModalPhotos(po.vendorInvoicePhoto); setVendorInvoiceModal(po); }} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}><Edit3 size={14}/></button>
                                <button onClick={async () => {
                                  const confirmed = await confirm(
                                    isID ? 'Hapus semua lampiran invoice vendor?' : 'Delete all vendor invoice attachments?',
                                    {
                                      title: isID ? 'Hapus Lampiran' : 'Delete Attachments',
                                      confirmText: isID ? 'Hapus' : 'Delete',
                                      cancelText: isID ? 'Batal' : 'Cancel',
                                      isDanger: true
                                    }
                                  );
                                  if (confirmed) handleUploadVendorInvoice(po.id, []);
                                }} style={{ background:'none', border:'none', color:'var(--danger)', cursor:'pointer' }}><Trash2 size={14}/></button>
                              </>
                            )}
                          </div>
                        ) : (
                          canWrite ? (
                            <button onClick={() => { setModalPhotos([]); setVendorInvoiceModal(po); }} style={{ background:'var(--info-bg)', color:'var(--info)', border:'1px dashed var(--info)', padding:'4px 8px', borderRadius:'6px', fontSize:'0.7rem', cursor:'pointer' }}>{isID ? '+ Unggah' : '+ Upload'}</button>
                          ) : (
                            <span style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>—</span>
                          )
                        )}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        {po.tax_amount > 0 ? (
                          <div style={{ fontSize:'0.75rem' }}>
                            <div style={{ color:'var(--secondary)', fontWeight:'700' }}>{po.tax_name || (isID ? 'Pajak' : 'Tax')}</div>
                            <div style={{ color:'var(--text-muted)' }}>Rp {parseFloat(po.tax_amount).toLocaleString()}</div>
                          </div>
                        ) : (
                          <span style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        {po.paymentProofPhoto && po.paymentProofPhoto.length > 0 ? (
                           <div style={{ display:'flex', gap:'5px', justifyContent:'center' }}>
                              <button onClick={() => setPhotoViewer({ title: `${isID ? 'Bukti Pembayaran' : 'Payment Proof'} - ${po.vendorName}`, photos: po.paymentProofPhoto })} style={{ background:'none', border:'none', color:'var(--success)', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
                                <CheckCircle size={18}/>
                                <span style={{ fontSize:'0.7rem', fontWeight:'700' }}>({po.paymentProofPhoto.length})</span>
                              </button>
                           </div>
                        ) : (
                           <span style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        {po.tax_proof_photo && po.tax_proof_photo.length > 0 ? (
                           <div style={{ display:'flex', gap:'5px', justifyContent:'center' }}>
                              <button onClick={() => setPhotoViewer({ title: `${isID ? 'Bukti Potong Pajak' : 'Tax Deduction Proof'} - ${po.vendorName}`, photos: po.tax_proof_photo })} style={{ background:'none', border:'none', color:'var(--secondary)', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
                                 <ShieldCheck size={18}/>
                                 <span style={{ fontSize:'0.7rem', fontWeight:'700' }}>({po.tax_proof_photo.length})</span>
                              </button>
                              {canWrite && (
                                <>
                                  <button onClick={() => { 
                                     setSettlePayableModal(po);
                                     setSettlePayableForm({
                                        paymentProof: po.paymentProofPhoto || [],
                                        taxName: po.tax_name || '',
                                        taxAmount: po.tax_amount || 0,
                                        taxProof: po.tax_proof_photo || []
                                     });
                                  }} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}><Edit3 size={14}/></button>
                                  <button onClick={async () => {
                                    const confirmed = await confirm(
                                      isID ? 'Hapus bukti potong pajak?' : 'Delete tax deduction proof?',
                                      {
                                        title: isID ? 'Hapus Bukti Potong' : 'Delete Tax Proof',
                                        confirmText: isID ? 'Hapus' : 'Delete',
                                        cancelText: isID ? 'Batal' : 'Cancel',
                                        isDanger: true
                                      }
                                    );
                                    if (confirmed) handleSettlePayable(po.id, { tax_proof_photo: [] });
                                  }} style={{ background:'none', border:'none', color:'var(--danger)', cursor:'pointer' }}><Trash2 size={14}/></button>
                                </>
                              )}
                           </div>
                        ) : po.status === 'paid' && po.tax_amount > 0 ? (
                           canWrite ? (
                             <button onClick={() => { 
                                setSettlePayableModal(po);
                                setSettlePayableForm({
                                   paymentProof: po.paymentProofPhoto || [],
                                   taxName: po.tax_name || '',
                                   taxAmount: po.tax_amount || 0,
                                   taxProof: po.tax_proof_photo || []
                                });
                             }} style={{ background:'rgba(255,193,7,0.1)', color:'var(--secondary)', border:'1px dashed var(--secondary)', padding:'4px 8px', borderRadius:'6px', fontSize:'0.7rem', cursor:'pointer' }}>{isID ? '+ Bukti Pajak' : '+ Tax Proof'}</button>
                           ) : (
                             <span style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>—</span>
                           )
                        ) : (
                           <span style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        {payableSubTab === 'outstanding' ? (
                          canWrite ? (
                            <button 
                              className="btn btn-gold" 
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                              onClick={() => {
                                setSettlePayableModal(po);
                                setSettlePayableForm({
                                  paymentProof: po.paymentProofPhoto || [],
                                  taxName: po.tax_name || '',
                                  taxAmount: po.tax_amount || 0,
                                  taxProof: po.tax_proof_photo || []
                                });
                              }}
                            >
                              {isID ? 'Tandai Lunas' : 'Mark as Paid'}
                            </button>
                          ) : (
                            <span style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>—</span>
                          )
                        ) : (
                          <div style={{ textAlign:'center' }}>
                            <div style={{ color:'var(--success)', fontWeight:'700', fontSize:'0.8rem' }}>{isID ? 'Dilunasi pada' : 'Settled on'} {po.paidDate}</div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginTop: '6px' }}>
                              {canWrite && (
                                <button 
                                  className="btn" 
                                  style={{ padding: '4px 10px', fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '5px', borderRadius:'6px', background: 'var(--warning-bg)', color: 'var(--warning)', border: '1px solid rgba(245, 158, 11, 0.2)' }}
                                  onClick={() => handleUndoPaidPO(po)}
                                  title={isID ? "Batal Pembayaran" : "Undo Payment"}
                                >
                                  <RotateCcw size={12}/> {isID ? 'Batal' : 'Undo'}
                                </button>
                              )}
                              <button 
                                className="btn btn-gold" 
                                style={{ padding: '4px 10px', fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '5px', borderRadius:'6px' }}
                                onClick={() => {
                                  localStorage.setItem('print_po_data', JSON.stringify(po));
                                  window.open('/print/po-attachment', '_blank');
                                }}
                              >
                                <ExternalLink size={12}/> {isID ? 'Lihat (Dokumen Lengkap)' : 'View (Full Doc)'}
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                    </tr>
                  ));
                })()}
                {purchaseOrders.filter(po => po.status === (payableSubTab === 'outstanding' ? 'issued' : 'paid')).length === 0 && (
                   <tr><td colSpan="10" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{isID ? 'Data tidak ditemukan.' : 'No data found.'}</td></tr>
                )}
              </tbody>
            </table></div></div>

            {payableSubTab === 'lunas' && selectedPayables.size > 0 && (
              <div style={{ marginTop: '20px', padding: '15px', background: 'var(--success-bg)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--success)' }}>
                <span style={{ fontWeight: '600', color:'var(--text)' }}>{selectedPayables.size} {isID ? 'PO Terpilih' : 'PO Selected'}</span>
                <button className="btn btn-gold" onClick={handleBatchPrintPayable} style={{ background:'var(--success)', borderColor:'var(--success)', color:'white', display:'flex', alignItems:'center', gap:'8px' }}>
                  <ExternalLink size={16} /> {isID ? 'Lihat Sekaligus (Dokumen Lengkap)' : 'Batch View (Full Docs)'}
                </button>
              </div>
            )}

            {payableSubTab === 'outstanding' && selectedPayables.size > 0 && (
              <div style={{ marginTop: '20px', padding: '15px', background: 'var(--warning-bg)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--warning)' }}>
                <span style={{ fontWeight: '600', color:'var(--text)' }}>{selectedPayables.size} {isID ? 'PO Terpilih' : 'PO Selected'}</span>
                <button className="btn btn-gold" onClick={handleBatchDownloadVendorInvoice} style={{ background:'var(--warning)', borderColor:'var(--warning)', color:'white', display:'flex', alignItems:'center', gap:'8px' }}>
                  <Download size={16} /> {isID ? 'Unduh Invoice Vendor (Masal)' : 'Download Vendor Invoices (Batch)'}
                </button>
              </div>
            )}

          </div>
        </div>
      ) : activeTab === 'detail_report' ? (
        <div className="report-section">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'25px' }}>
              <h3 style={{ margin:0, color:'var(--secondary)', display:'flex', alignItems:'center', gap:'10px' }}><FileSpreadsheet size={24}/> {isID ? 'Analisis Laporan Keuangan' : 'Financial Report Analysis'}</h3>
              <button 
                 className="btn btn-gold" 
                 style={{ padding:'10px 20px', display:'flex', alignItems:'center', gap:'8px', borderRadius:'12px', fontWeight:'700' }}
                 onClick={() => {
                   const periodInvoices = invoices.filter(inv => filterByDate(inv.date));
                   const periodPOs = purchaseOrders.filter(po => filterByDate(po.date));
                   const periodSalaries = salaries.filter(s => filterByDate(s.expenseDate || s.date));
                   const periodMiscEnriched = enrichedOtherTransactions.filter(e => filterByDate(e.expenseDate || e.date));
                   const periodCustomIncome = periodMiscEnriched.filter(e => e.type === 'income');
                   const periodCustomExpense = [...periodMiscEnriched.filter(e => e.type === 'expense'), ...reimbursementsList.filter(r => r.status === 'paid' && filterByDate(r.expenseDate || r.date))];
                   const periodReceivables = receivables.filter(r => filterByDate(r.paidDate));

                   const totalCustomIncome = periodCustomIncome.reduce((s, ex) => s + parseFloat(ex.totalAfterTax || ex.amount || 0), 0);
                   const totalCustomExpense = periodCustomExpense.reduce((s, ex) => s + parseFloat(ex.totalAfterTax || 0), 0);

                   const reportData = {
                     revenue: periodInvoices.reduce((s, i) => s + parseFloat(i.amount || 0), 0) + totalCustomIncome,
                     opCosts: periodPOs.reduce((s, p) => s + parseFloat(p.grandTotal || 0), 0),
                     payroll: periodSalaries.reduce((s, sa) => s + parseFloat(sa.totalToPay || 0), 0),
                     misc: totalCustomExpense,
                     taxPiutang: periodInvoices.reduce((s, i) => s + (parseFloat(i.tax_deduction) || 0), 0),
                     taxHutang: periodPOs.reduce((s, p) => s + (parseFloat(p.tax_amount) || 0), 0),
                     totalHutang: purchaseOrders.filter(po => po.status === 'issued').reduce((s, p) => s + parseFloat(p.grandTotal || 0), 0),
                     totalPiutang: receivables.reduce((s, r) => s + parseFloat(r.balance || 0), 0),
                     inflow: periodReceivables.filter(r => r.status === 'paid').reduce((s, r) => s + parseFloat(r.amount || 0), 0) + totalCustomIncome,
                     outflow: 
                       purchaseOrders.filter(p => p.status === 'paid' && filterByDate(p.paidDate)).reduce((s, p) => s + (parseFloat(p.grandTotal || 0) - (parseFloat(p.tax_amount) || 0)), 0) +
                       periodSalaries.reduce((s, sa) => s + parseFloat(sa.totalToPay || 0), 0) +
                       totalCustomExpense,
                     dateRange: startDate && endDate ? `${formatDate(startDate)} - ${formatDate(endDate)}` : 'All Time'
                   };
                   setFinancialReport(reportData);
                 }}

              >
                 <Download size={18}/> {isID ? 'Ekspor PDF Profesional' : 'Export Professional PDF'}
              </button>
          </div>

          {/* Summary Dashboard */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'20px', marginBottom:'30px' }}>
            {(() => {
              const periodMiscEnriched = enrichedOtherTransactions.filter(e => filterByDate(e.expenseDate || e.date));
              const periodCustomIncome = periodMiscEnriched.filter(e => e.type === 'income');
              const periodCustomExpense = [...periodMiscEnriched.filter(e => e.type === 'expense'), ...reimbursementsList.filter(r => r.status === 'paid' && filterByDate(r.expenseDate || r.date))];

              const totalCustomIncome = periodCustomIncome.reduce((s, ex) => s + parseFloat(ex.totalAfterTax || ex.amount || 0), 0);
              const totalCustomExpense = periodCustomExpense.reduce((s, ex) => s + parseFloat(ex.totalAfterTax || 0), 0);

              const reportData = {
                revenue: invoices.filter(inv => filterByDate(inv.date)).reduce((s, i) => s + parseFloat(i.amount || 0), 0) + totalCustomIncome,
                opCosts: purchaseOrders.filter(po => filterByDate(po.date)).reduce((s, p) => s + parseFloat(p.grandTotal || 0), 0),
                payroll: salaries.filter(s => filterByDate(s.expenseDate || s.date)).reduce((s, sa) => s + parseFloat(sa.totalToPay || 0), 0),
                misc: totalCustomExpense,
                taxPiutang: invoices.filter(i => filterByDate(i.date)).reduce((s, i) => s + (parseFloat(i.tax_deduction) || 0), 0),
                taxHutang: purchaseOrders.filter(p => filterByDate(p.date)).reduce((s, p) => s + (parseFloat(p.tax_amount) || 0), 0),
                totalHutang: purchaseOrders.filter(po => po.status === 'issued').reduce((s, p) => s + parseFloat(p.grandTotal || 0), 0),
                totalPiutang: receivables.reduce((s, r) => s + parseFloat(r.balance || 0), 0),
                cashInflow: receivables.filter(r => r.status === 'paid' && filterByDate(r.paidDate)).reduce((s, r) => s + parseFloat(r.amount || 0), 0) + totalCustomIncome,
                cashOutflow: 
                  purchaseOrders.filter(p => p.status === 'paid' && filterByDate(p.paidDate)).reduce((s, p) => s + (parseFloat(p.grandTotal || 0) - (parseFloat(p.tax_amount) || 0)), 0) +
                  salaries.filter(s => filterByDate(s.expenseDate || s.date)).reduce((s, sa) => s + parseFloat(sa.totalToPay || 0), 0) +
                  totalCustomExpense
              };
              const totalExpenses = reportData.opCosts + reportData.payroll + reportData.misc;
              const netProfit = reportData.revenue - (totalExpenses + reportData.taxPiutang);

              return [
                { label: isID ? 'Omset per Periode' : 'Revenue per Period', val: reportData.revenue, color: 'var(--success)', icon: <Receipt size={24}/> },
                { label: isID ? 'Hutang Outstanding (Total)' : 'Outstanding Payable (Total)', val: reportData.totalHutang, color: 'var(--warning)', icon: <Briefcase size={24}/> },
                { label: isID ? 'Piutang Outstanding (Total)' : 'Outstanding Receivable (Total)', val: reportData.totalPiutang, color: 'var(--info)', icon: <Wallet size={24}/> },
                { label: isID ? 'Keuntungan Bersih' : 'Net Profit', val: netProfit, color: netProfit >= 0 ? 'var(--success)' : 'var(--danger)', icon: <DollarSign size={24}/>, highlight: true },
                { label: isID ? 'Penerimaan Dana (Periode)' : 'Cash Inflow (Period)', val: reportData.cashInflow, color: 'var(--success)', icon: <CheckCircle size={20}/>, small: true },
                { label: isID ? 'Pengeluaran Dana (Periode)' : 'Cash Outflow (Period)', val: reportData.cashOutflow, color: 'var(--danger)', icon: <XCircle size={20}/>, small: true },
                { label: isID ? 'Pajak Invoice Piutang' : 'Receivable Invoice Tax', val: reportData.taxPiutang, color: '#8b5cf6', icon: <ShieldCheck size={20}/>, small: true },
                { label: isID ? 'Pajak Invoice Hutang' : 'Payable Invoice Tax', val: reportData.taxHutang, color: '#ec4899', icon: <ShieldAlert size={20}/>, small: true }
              ].map(stat => (
                <div key={stat.label} className="glass-card" style={{ padding:'25px', display:'flex', alignItems:'center', gap:'20px', border: stat.highlight ? `2px solid ${stat.color}` : '1px solid var(--glass-border)', background: stat.highlight ? `rgba(${stat.color === 'var(--success)' ? '16,185,129' : '239,68,68'}, 0.05)` : 'rgba(255,255,255,0.03)' }}>
                  <div style={{ padding:'12px', borderRadius:'12px', background: `${stat.color}15`, color: stat.color }}>{stat.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: stat.small ? '1.1rem' : '1.4rem', fontWeight:'900', color: stat.color }}>Rp {stat.val.toLocaleString()}</div>
                    <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', textTransform:'uppercase', fontWeight:'800', letterSpacing:'0.5px', marginTop:'2px' }}>{stat.label}</div>
                  </div>
                </div>
              ));
            })()}
          </div>


          <div className="grid-responsive-2" style={{ gap:'30px' }}>
            {/* Detailed Transaction Log */}
            <div className="glass-card" style={{ padding:'30px' }}>
              <h4 style={{ marginBottom:'25px', display:'flex', alignItems:'center', gap:'10px' }}><Calendar size={20} style={{color:'var(--secondary)'}}/> {isID ? 'Log Detail Transaksi' : 'Transaction Detail Log'}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {(() => {
                  const logs = [
                    ...invoices.filter(i => filterByDate(i.date)).map(i => ({ date: i.date, desc: `Invoice: ${i.id} (${i.customerName})`, cat: isID ? 'PENDAPATAN' : 'REVENUE', amt: i.amount, color: 'var(--success)' })),
                    ...purchaseOrders.filter(p => filterByDate(p.date)).map(p => ({ date: p.date, desc: `PO: ${p.id} (${p.vendorName})`, cat: isID ? 'BIAYA OP' : 'OP COST', amt: -p.grandTotal, color: 'var(--warning)' })),
                    ...salaries.filter(s => filterByDate(s.expenseDate || s.date)).map(s => ({ date: s.expenseDate || s.date, desc: isID ? `Gaji: ${s.name} (${s.period})` : `Payroll: ${s.name} (${s.period})`, cat: isID ? 'BIAYA GAJI' : 'PAYROLL', amt: -s.totalToPay, color: '#8b5cf6' })),
                    ...enrichedOtherTransactions.filter(e => filterByDate(e.expenseDate || e.date)).map(e => {
                      const isIncome = e.type === 'income';
                      return {
                        date: e.expenseDate || e.date,
                        desc: (() => {
                          let cbText = '';
                          if (e.companyBankAccountId === 'CUSTOM' && e.customSourceTarget) {
                            cbText = ` [${e.customSourceTarget}]`;
                          } else {
                            const cb = companyBankAccounts.find(b => b.id === e.companyBankAccountId);
                            if (cb) cbText = ` [${cb.bankName}]`;
                          }
                          return isIncome 
                            ? (isID ? `Pemasukan Lain: ${e.description} (${e.employeeName || 'Umum'})${cbText}` : `Other Income: ${e.description} (${e.employeeName || 'General'})${cbText}`)
                            : (isID ? `Lain-lain: ${e.description} (${e.employeeName || 'Umum'})${cbText}` : `Misc: ${e.description} (${e.employeeName || 'General'})${cbText}`);
                        })(),
                        cat: isIncome 
                          ? (isID ? 'PENDAPATAN LAIN' : 'OTHER INCOME') 
                          : ((isID ? (e.category || 'PENGELUARAN') : (e.category || 'EXPENSE')) + (e.subcategory ? ` - ${e.subcategory}` : '')).toUpperCase(),
                        amt: isIncome ? e.totalAfterTax || e.amount : -e.totalAfterTax,
                        color: isIncome ? 'var(--success)' : '#ec4899'
                      };
                    }),
                    ...reimbursementsList.filter(r => r.status === 'paid' && filterByDate(r.expenseDate || r.date)).map(r => {
                      let cbText = '';
                      if (r.companyBankAccountId === 'CUSTOM' && r.customSourceTarget) cbText = ` [${r.customSourceTarget}]`;
                      else {
                        const cb = companyBankAccounts.find(b => b.id === r.companyBankAccountId);
                        if (cb) cbText = ` [${cb.bankName}]`;
                      }
                      return {
                        date: r.expenseDate || r.date,
                        desc: `Reimbursement: ${r.employeeName}${cbText}`,
                        cat: isID ? 'REIMBURSEMENT' : 'REIMBURSEMENT',
                        amt: -parseFloat(r.totalAfterTax || r.amount || 0),
                        color: '#14b8a6'
                      };
                    })
                  ].sort((a, b) => new Date(b.date) - new Date(a.date));

                  const logsByMonth = {};
                  logs.forEach(log => {
                    const dateObj = new Date(log.date);
                    let mKey = 'Unknown';
                    if (!isNaN(dateObj.getTime())) {
                      mKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
                    }
                    if (!logsByMonth[mKey]) {
                      logsByMonth[mKey] = {
                        key: mKey,
                        income: 0,
                        expense: 0,
                        items: []
                      };
                    }
                    if (log.amt >= 0) {
                      logsByMonth[mKey].income += log.amt;
                    } else {
                      logsByMonth[mKey].expense += Math.abs(log.amt);
                    }
                    logsByMonth[mKey].items.push(log);
                  });

                  const sortedMonths = Object.keys(logsByMonth).sort((a, b) => b.localeCompare(a));

                  if (sortedMonths.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        {isID ? 'Tidak ada data dalam rentang tanggal yang dipilih.' : 'No data in selected date range.'}
                      </div>
                    );
                  }

                  return sortedMonths.map(mKey => {
                    const monthData = logsByMonth[mKey];
                    const isExpanded = !!expandedReportMonths[mKey];
                    const monthName = (() => {
                      if (mKey === 'Unknown') return isID ? 'Tidak Diketahui' : 'Unknown';
                      const [year, month] = mKey.split('-');
                      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
                      return date.toLocaleDateString(isID ? 'id-ID' : 'en-US', { month: 'long', year: 'numeric' });
                    })();

                    const netBalance = monthData.income - monthData.expense;

                    return (
                      <div key={mKey} className="glass-card" style={{ border: '1px solid var(--glass-border)', borderRadius: '12px', overflow: 'hidden', background: 'rgba(255,255,255,0.01)' }}>
                        <div 
                          onClick={() => setExpandedReportMonths(prev => ({ ...prev, [mKey]: !isExpanded }))}
                          style={{ 
                            padding: '15px 20px', 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            cursor: 'pointer', 
                            background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent',
                            transition: 'background 0.2s',
                            gap: '15px'
                          }}
                          className="table-row-hover"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', color: 'var(--secondary)' }}>
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </span>
                            <span style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--secondary)' }}>{monthName}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '10px' }}>
                              ({monthData.items.length} {isID ? 'transaksi' : 'transactions'})
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '0.85rem' }}>
                            <div>
                              <span style={{ color: 'var(--text-muted)', marginRight: '5px' }}>{isID ? 'Pemasukan:' : 'Income:'}</span>
                              <span style={{ fontWeight: '700', color: 'var(--success)' }}>+Rp {monthData.income.toLocaleString()}</span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)', marginRight: '5px' }}>{isID ? 'Pengeluaran:' : 'Expense:'}</span>
                              <span style={{ fontWeight: '700', color: 'var(--danger)' }}>-Rp {monthData.expense.toLocaleString()}</span>
                            </div>
                            <div style={{ borderLeft: '1px solid var(--glass-border)', paddingLeft: '20px' }}>
                              <span style={{ color: 'var(--text-muted)', marginRight: '5px' }}>Net:</span>
                              <span style={{ fontWeight: '800', color: netBalance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                {netBalance >= 0 ? '+' : '-'}Rp {Math.abs(netBalance).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div style={{ padding: '20px', borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.1)', overflowX: 'auto' }}>
                            <div className="table-container">
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--glass-border)' }}>
                                    <th style={{ padding: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{isID ? 'Tanggal' : 'Date'}</th>
                                    <th style={{ padding: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{isID ? 'Deskripsi' : 'Description'}</th>
                                    <th style={{ padding: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{isID ? 'Kategori' : 'Category'}</th>
                                    <th style={{ padding: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>{isID ? 'Jumlah' : 'Amount'}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {monthData.items.map((log, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }} className="table-row-hover">
                                      <td style={{ padding: '12px', fontSize: '0.85rem' }}>{new Date(log.date).toLocaleDateString()}</td>
                                      <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: '600' }}>{log.desc}</td>
                                      <td style={{ padding: '12px' }}>
                                        <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '10px', background: `${log.color}20`, color: log.color, fontWeight: '700' }}>{log.cat}</span>
                                      </td>
                                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: log.amt >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                        {log.amt >= 0 ? '+' : '-'} Rp {Math.abs(log.amt).toLocaleString()}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Expense Distribution */}
            <div className="glass-card" style={{ padding:'30px' }}>
              <h4 style={{ marginBottom:'25px' }}>{isID ? 'Distribusi Pengeluaran' : 'Expense Distribution'}</h4>
              {(() => {
                const op = purchaseOrders.filter(po => filterByDate(po.date)).reduce((s, p) => s + parseFloat(p.grandTotal || 0), 0);
                const pr = salaries.filter(s => filterByDate(s.expenseDate || s.date)).reduce((s, sa) => s + parseFloat(sa.totalToPay || 0), 0);
                
                // Dynamic category grouping for custom expenses
                const customExpenseGroups = {};
                enrichedOtherTransactions
                  .filter(e => e.type === 'expense' && filterByDate(e.expenseDate || e.date))
                  .forEach(e => {
                    const cat = e.category || 'Lain-lain';
                    customExpenseGroups[cat] = (customExpenseGroups[cat] || 0) + parseFloat(e.totalAfterTax || 0);
                  });

                const ms = Object.values(customExpenseGroups).reduce((s, v) => s + v, 0);

                const expenseCategories = [
                  { label: isID ? 'Operasional' : 'Operational', val: op, color: 'var(--warning)' },
                  { label: isID ? 'Payroll (Gaji)' : 'Payroll (Salaries)', val: pr, color: '#8b5cf6' },
                  ...Object.keys(customExpenseGroups).map((catName, idx) => {
                    const colors = ['#ec4899', 'var(--info)', '#14b8a6', '#f43f5e', '#a855f7', '#06b6d4'];
                    const color = colors[idx % colors.length];
                    return { label: catName, val: customExpenseGroups[catName], color };
                  })
                ];
                
                const total = expenseCategories.reduce((s, c) => s + c.val, 0) || 1;

                return (
                  <div style={{ display:'grid', gap:'20px' }}>
                    {expenseCategories.map(cat => (
                      <div key={cat.label}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px', fontSize:'0.85rem' }}>
                          <span style={{ color:'var(--text-muted)', fontWeight:'600' }}>{cat.label}</span>
                          <span style={{ fontWeight:'700' }}>{((cat.val / total) * 100).toFixed(1)}%</span>
                        </div>
                        <div style={{ height:'8px', background:'rgba(255,255,255,0.05)', borderRadius:'4px', overflow:'hidden' }}>
                          <div style={{ height:'100%', width: `${(cat.val / total) * 100}%`, background: cat.color }}></div>
                        </div>
                        <div style={{ fontSize:'0.75rem', marginTop:'5px', color:'var(--text-muted)' }}>Rp {cat.val.toLocaleString()}</div>
                      </div>
                    ))}
                    
                    <div style={{ marginTop:'20px', padding:'20px', background:'rgba(255,255,255,0.02)', borderRadius:'15px', border:'1px solid var(--glass-border)' }}>
                       <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginBottom:'5px' }}>Efficiency Ratio</div>
                       <div style={{ fontSize:'1.2rem', fontWeight:'800', color: (op + pr + ms) < invoices.reduce((s,i)=>s+parseFloat(i.amount||0),0) ? 'var(--success)' : 'var(--danger)' }}>
                         {((op + pr + ms) / (invoices.reduce((s,i)=>s+parseFloat(i.amount||0),0) || 1) * 100).toFixed(1)}%
                       </div>
                       <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{isID ? 'Biaya sebagai % dari Pendapatan' : 'Cost as % of Revenue'}</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      ) : null}

      {/* Edit Invoice Modal */}
      {editingInvoice && (() => {
        const joIds = editingInvoice.consolidatedJOs && editingInvoice.consolidatedJOs.length > 0 
          ? editingInvoice.consolidatedJOs 
          : (editingInvoice.joId ? [editingInvoice.joId] : []);
        const linkedJOs = jobOrders.filter(j => joIds.map(String).includes(String(j.id)));

        return (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
            <div className="glass-card" style={{ width:'100%', maxWidth: editingInvoice.items ? '800px' : '500px', padding:'30px', position:'relative', maxHeight:'90vh', overflowY:'auto' }}>
              <button onClick={() => setEditingInvoice(null)} style={{ position:'absolute', top:'15px', right:'15px', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}><X size={20}/></button>
              <h3 style={{ color:'var(--secondary)', marginBottom:'5px' }}>Edit Invoice Details</h3>
              <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', marginBottom:'25px' }}>Revision for <strong style={{color:'var(--text)'}}>{editingInvoice.id}</strong></p>
              
              <div style={{ display:'grid', gap:'20px' }}>
                <div>
                  <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>{isID ? 'Nomor Invoice' : 'Invoice Number'}</label>
                  <input 
                    type="text" 
                    value={editingInvoice.id} 
                    onChange={e => setEditingInvoice({...editingInvoice, id: e.target.value})}
                    style={{ width:'100%', padding:'12px 15px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'10px', color:'var(--text)', fontSize:'1.1rem', fontWeight:'700' }}
                  />
                </div>

                <div>
                  <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>Base Amount (Revenue)</label>
                  <div style={{ position:'relative' }}>
                    <span style={{ position:'absolute', left:'15px', top:'50%', transform:'translateY(-50%)', color:'var(--secondary)', fontWeight:'700' }}>Rp</span>
                    <input 
                      type="number" 
                      step="any" 
                      value={editingInvoice.subtotal || editingInvoice.amount} 
                      onChange={e => setEditingInvoice({...editingInvoice, subtotal: e.target.value})}
                      disabled={Array.isArray(editingInvoice.items)}
                      style={{ width:'100%', padding:'12px 15px 12px 45px', background: Array.isArray(editingInvoice.items) ? 'rgba(255,255,255,0.02)' : 'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'10px', color: Array.isArray(editingInvoice.items) ? 'var(--text-muted)' : 'var(--text)', fontSize:'1.1rem', fontWeight:'700', cursor: Array.isArray(editingInvoice.items) ? 'not-allowed' : 'auto' }}
                    />
                  </div>
                </div>

                {Array.isArray(editingInvoice.items) && (
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px', flexWrap:'wrap', gap:'8px' }}>
                      <label style={{ fontSize:'0.75rem', color:'var(--text-muted)', textTransform:'uppercase', fontWeight:'700' }}>
                        {isID ? 'Item Invoice (Per Item)' : 'Invoice Items'}
                      </label>
                      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                        <button 
                          type="button"
                          onClick={() => {
                            const defaultJoId = joIds.length > 0 ? joIds[0] : '';
                            const newItems = [...(editingInvoice.items || []), { 
                              description: 'Storage Demmurage', 
                              qty: 1, 
                              rate: '', 
                              amount: 0,
                              joId: defaultJoId,
                              containerNo: [''],
                              vehicleNo: [''],
                              driverName: ['']
                            }];
                            const newSubtotal = newItems.reduce((sum, item) => sum + (parseFloat(item.qty || 0) * parseFloat(item.rate || 0)), 0);
                            setEditingInvoice({
                              ...editingInvoice,
                              items: newItems,
                              subtotal: newSubtotal
                            });
                          }}
                          style={{ background:'rgba(212, 175, 55, 0.15)', color:'var(--secondary)', border:'1px solid var(--secondary)', borderRadius:'6px', padding:'4px 10px', fontSize:'0.7rem', fontWeight:'700', cursor:'pointer' }}
                        >
                          + Storage Demmurage
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            const defaultJoId = joIds.length > 0 ? joIds[0] : '';
                            const newItems = [...(editingInvoice.items || []), { 
                              description: 'Insurance Cost', 
                              qty: 1, 
                              rate: '', 
                              amount: 0,
                              joId: defaultJoId,
                              containerNo: [''],
                              vehicleNo: [''],
                              driverName: ['']
                            }];
                            const newSubtotal = newItems.reduce((sum, item) => sum + (parseFloat(item.qty || 0) * parseFloat(item.rate || 0)), 0);
                            setEditingInvoice({
                              ...editingInvoice,
                              items: newItems,
                              subtotal: newSubtotal
                            });
                          }}
                          style={{ background:'rgba(59, 130, 246, 0.15)', color:'#60a5fa', border:'1px solid #3b82f6', borderRadius:'6px', padding:'4px 10px', fontSize:'0.7rem', fontWeight:'700', cursor:'pointer' }}
                        >
                          + Insurance Cost
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            const defaultJoId = joIds.length > 0 ? joIds[0] : '';
                            const newItems = [...(editingInvoice.items || []), { 
                              description: 'Freight Forwarding Services', 
                              qty: 1, 
                              rate: 0, 
                              amount: 0,
                              joId: defaultJoId,
                              containerNo: [''],
                              vehicleNo: [''],
                              driverName: ['']
                            }];
                            const newSubtotal = newItems.reduce((sum, item) => sum + (parseFloat(item.qty || 0) * parseFloat(item.rate || 0)), 0);
                            setEditingInvoice({
                              ...editingInvoice,
                              items: newItems,
                              subtotal: newSubtotal
                            });
                          }}
                          style={{ background:'var(--secondary-bg)', color:'var(--secondary)', border:'1px solid var(--secondary)', borderRadius:'6px', padding:'4px 10px', fontSize:'0.7rem', cursor:'pointer' }}
                        >
                          + {isID ? 'Tambah Item' : 'Add Item'}
                        </button>
                      </div>
                    </div>

                    {/* Reminder Box */}
                    <div style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1rem' }}>💡</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text)', lineHeight: '1.4' }}>
                        <strong>{isID ? 'Pengingat:' : 'Reminder:'}</strong> {isID ? 'Periksa apakah ada biaya rutin seperti Storage Demmurage atau Insurance Cost yang perlu dimasukkan ke dalam item layanan.' : 'Please verify if routine costs like Storage Demmurage or Insurance Cost need to be included in the service items.'}
                      </span>
                    </div>

                    <div style={{ display:'grid', gap:'12px', maxHeight:'300px', overflowY:'auto', paddingRight:'5px', marginBottom: '10px' }}>
                      {(editingInvoice.items || []).map((item, idx) => (
                        <div key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', marginBottom: '8px' }}>
                          <div style={{ display:'grid', gridTemplateColumns:'2.2fr 0.8fr 1.2fr 1fr 32px', gap:'8px', alignItems:'center' }}>
                            <div>
                              <input 
                                type="text" 
                                placeholder={isID ? "Deskripsi" : "Description"}
                                value={item.description || ''} 
                                onChange={e => {
                                  const newItems = [...editingInvoice.items];
                                  newItems[idx] = { ...newItems[idx], description: e.target.value };
                                  setEditingInvoice({...editingInvoice, items: newItems});
                                }}
                                style={{ width: '100%', padding:'6px 10px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'6px', color:'var(--text)', fontSize:'0.8rem' }}
                              />
                            </div>
                            <div>
                              <input 
                                type="number" 
                                placeholder="Qty" 
                                value={item.qty || 0} 
                                onChange={e => {
                                  const val = parseFloat(e.target.value || 0);
                                  const newItems = [...editingInvoice.items];
                                  const newRate = parseFloat(newItems[idx].rate || 0);
                                  newItems[idx] = { 
                                    ...newItems[idx], 
                                    qty: val,
                                    amount: val * newRate
                                  };
                                  const newSubtotal = newItems.reduce((sum, it) => sum + (parseFloat(it.qty || 0) * parseFloat(it.rate || 0)), 0);
                                  setEditingInvoice({...editingInvoice, items: newItems, subtotal: newSubtotal});
                                }}
                                style={{ width: '100%', padding:'6px 10px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'6px', color:'var(--text)', fontSize:'0.8rem', fontWeight:'600' }}
                              />
                            </div>
                            <div>
                              <input 
                                type="number" 
                                placeholder="Rate" 
                                value={item.rate || 0} 
                                onChange={e => {
                                  const val = parseFloat(e.target.value || 0);
                                  const newItems = [...editingInvoice.items];
                                  const newQty = parseFloat(newItems[idx].qty || 0);
                                  newItems[idx] = { 
                                    ...newItems[idx], 
                                    rate: val,
                                    amount: newQty * val
                                  };
                                  const newSubtotal = newItems.reduce((sum, it) => sum + (parseFloat(it.qty || 0) * parseFloat(it.rate || 0)), 0);
                                  setEditingInvoice({...editingInvoice, items: newItems, subtotal: newSubtotal});
                                }}
                                style={{ width: '100%', padding:'6px 10px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'6px', color:'var(--text)', fontSize:'0.8rem', fontWeight:'600' }}
                              />
                            </div>
                            <div style={{ padding:'6px 10px', color:'var(--text)', fontSize:'0.8rem', fontWeight:'700', textAlign: 'right' }}>
                              Rp {((item.qty || 0) * (item.rate || 0)).toLocaleString()}
                            </div>
                            <button 
                              type="button"
                              onClick={() => {
                                const newItems = (editingInvoice.items || []).filter((_, i) => i !== idx);
                                const newSubtotal = newItems.reduce((sum, it) => sum + (parseFloat(it.qty || 0) * parseFloat(it.rate || 0)), 0);
                                setEditingInvoice({...editingInvoice, items: newItems, subtotal: newSubtotal});
                              }}
                              style={{ background:'var(--danger-bg)', color:'var(--danger)', border:'none', borderRadius:'6px', height:'32px', width: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor:'pointer' }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' + (joIds.length > 1 ? ' 1.2fr' : ''), gap: '15px', marginTop: '12px', paddingLeft: '10px', background: 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: '8px' }}>
                            {/* Column 1: Container Numbers */}
                            <div>
                              <label style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: '600' }}>Containers</label>
                              <div style={{ display: 'grid', gap: '4px' }}>
                                {(item.containerNo || []).map((c, cIdx) => (
                                  <div key={cIdx} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                    <input
                                      type="text"
                                      value={c}
                                      onChange={e => {
                                        const newItems = [...editingInvoice.items];
                                        const newContainers = [...(newItems[idx].containerNo || [])];
                                        newContainers[cIdx] = e.target.value;
                                        newItems[idx] = { ...newItems[idx], containerNo: newContainers };
                                        setEditingInvoice({ ...editingInvoice, items: newItems });
                                      }}
                                      placeholder="Container #"
                                      style={{ width: '100%', padding: '4px 8px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text)', fontSize: '0.75rem' }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newItems = [...editingInvoice.items];
                                        const newContainers = (newItems[idx].containerNo || []).filter((_, i) => i !== cIdx);
                                        newItems[idx] = { ...newItems[idx], containerNo: newContainers };
                                        setEditingInvoice({ ...editingInvoice, items: newItems });
                                      }}
                                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px' }}
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newItems = [...editingInvoice.items];
                                    const newContainers = [...(newItems[idx].containerNo || []), ''];
                                    newItems[idx] = { ...newItems[idx], containerNo: newContainers };
                                    setEditingInvoice({ ...editingInvoice, items: newItems });
                                  }}
                                  style={{ background: 'none', border: '1px dashed var(--border)', borderRadius: '4px', color: 'var(--text-muted)', fontSize: '0.65rem', padding: '2px 6px', cursor: 'pointer' }}
                                >
                                  + Container
                                </button>
                              </div>
                            </div>

                            {/* Column 2: Vehicle Numbers */}
                            <div>
                              <label style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: '600' }}>Vehicles</label>
                              <div style={{ display: 'grid', gap: '4px' }}>
                                {(item.vehicleNo || []).map((v, vIdx) => (
                                  <div key={vIdx} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                    <input
                                      type="text"
                                      value={v}
                                      onChange={e => {
                                        const newItems = [...editingInvoice.items];
                                        const newVehicles = [...(newItems[idx].vehicleNo || [])];
                                        newVehicles[vIdx] = e.target.value;
                                        newItems[idx] = { ...newItems[idx], vehicleNo: newVehicles };
                                        setEditingInvoice({ ...editingInvoice, items: newItems });
                                      }}
                                      placeholder="Plat Mobil #"
                                      style={{ width: '100%', padding: '4px 8px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text)', fontSize: '0.75rem' }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newItems = [...editingInvoice.items];
                                        const newVehicles = (newItems[idx].vehicleNo || []).filter((_, i) => i !== vIdx);
                                        newItems[idx] = { ...newItems[idx], vehicleNo: newVehicles };
                                        setEditingInvoice({ ...editingInvoice, items: newItems });
                                      }}
                                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px' }}
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newItems = [...editingInvoice.items];
                                    const newVehicles = [...(newItems[idx].vehicleNo || []), ''];
                                    newItems[idx] = { ...newItems[idx], vehicleNo: newVehicles };
                                    setEditingInvoice({ ...editingInvoice, items: newItems });
                                  }}
                                  style={{ background: 'none', border: '1px dashed var(--border)', borderRadius: '4px', color: 'var(--text-muted)', fontSize: '0.65rem', padding: '2px 6px', cursor: 'pointer' }}
                                >
                                  + Vehicle
                                </button>
                              </div>
                            </div>

                            {/* Column 3: Driver Names */}
                            <div>
                              <label style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: '600' }}>Drivers</label>
                              <div style={{ display: 'grid', gap: '4px' }}>
                                {(item.driverName || []).map((d, dIdx) => (
                                  <div key={dIdx} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                    <input
                                      type="text"
                                      value={d}
                                      onChange={e => {
                                        const newItems = [...editingInvoice.items];
                                        const newDrivers = [...(newItems[idx].driverName || [])];
                                        newDrivers[dIdx] = e.target.value;
                                        newItems[idx] = { ...newItems[idx], driverName: newDrivers };
                                        setEditingInvoice({ ...editingInvoice, items: newItems });
                                      }}
                                      placeholder="Nama Driver"
                                      style={{ width: '100%', padding: '4px 8px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text)', fontSize: '0.75rem' }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newItems = [...editingInvoice.items];
                                        const newDrivers = (newItems[idx].driverName || []).filter((_, i) => i !== dIdx);
                                        newItems[idx] = { ...newItems[idx], driverName: newDrivers };
                                        setEditingInvoice({ ...editingInvoice, items: newItems });
                                      }}
                                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px' }}
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newItems = [...editingInvoice.items];
                                    const newDrivers = [...(newItems[idx].driverName || []), ''];
                                    newItems[idx] = { ...newItems[idx], driverName: newDrivers };
                                    setEditingInvoice({ ...editingInvoice, items: newItems });
                                  }}
                                  style={{ background: 'none', border: '1px dashed var(--border)', borderRadius: '4px', color: 'var(--text-muted)', fontSize: '0.65rem', padding: '2px 6px', cursor: 'pointer' }}
                                >
                                  + Driver
                                </button>
                              </div>
                            </div>

                            {/* Column 4: Job Order Selector (For Consolidated Invoices) */}
                            {joIds.length > 1 && (
                              <div>
                                <label style={{ display: 'block', fontSize: '0.68rem', color: 'var(--secondary)', marginBottom: '5px', fontWeight: '700' }}>Linked JO</label>
                                <select
                                  value={item.joId || ''}
                                  onChange={e => {
                                    const newItems = [...editingInvoice.items];
                                    newItems[idx] = { ...newItems[idx], joId: e.target.value };
                                    setEditingInvoice({ ...editingInvoice, items: newItems });
                                  }}
                                  style={{ width: '100%', padding: '4px 8px', background: 'var(--input-bg)', border: '1px solid var(--secondary)', borderRadius: '4px', color: 'var(--text)', fontSize: '0.75rem', fontWeight: '600' }}
                                >
                                  <option value="">-- General / All JOs --</option>
                                  {joIds.map(jid => (
                                    <option key={jid} value={jid} style={{ background: 'var(--bg)', color: 'var(--text)' }}>
                                      JO #{jid}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {(editingInvoice.items || []).length === 0 && (
                        <p style={{ textAlign:'center', color:'var(--text-muted)', fontSize:'0.8rem', padding:'10px', background:'rgba(255,255,255,0.02)', borderRadius:'8px' }}>
                          {isID ? 'Tidak ada item' : 'No items'}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                    <label style={{ fontSize:'0.75rem', color:'var(--text-muted)', textTransform:'uppercase', fontWeight:'700' }}>Biaya Tambahan (Extra Charges)</label>
                    <button 
                      type="button"
                      onClick={() => setEditingInvoice({...editingInvoice, extra_charges: [...(editingInvoice.extra_charges || []), { description: '', amount: 0 }]})}
                      style={{ background:'var(--secondary-bg)', color:'var(--secondary)', border:'1px solid var(--secondary)', borderRadius:'6px', padding:'4px 10px', fontSize:'0.7rem', cursor:'pointer' }}
                    >
                      + Tambah Biaya
                    </button>
                  </div>
                  
                  <div style={{ display:'grid', gap:'10px', maxHeight:'200px', overflowY:'auto', paddingRight:'5px' }}>
                    {(editingInvoice.extra_charges || []).map((charge, idx) => (
                      <div key={idx} style={{ display:'grid', gridTemplateColumns:'1fr 120px 32px', gap:'8px', alignItems:'center' }}>
                        <input 
                          type="text" 
                          placeholder="Deskripsi Biaya" 
                          value={charge.description} 
                          onChange={e => {
                            const n = [...editingInvoice.extra_charges];
                            n[idx].description = e.target.value;
                            setEditingInvoice({...editingInvoice, extra_charges: n});
                          }}
                          style={{ padding:'8px 12px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)', fontSize:'0.85rem' }}
                        />
                        <input 
                          type="number" 
                          step="any" 
                          placeholder="Rp" 
                          value={charge.amount} 
                          onChange={e => {
                            const n = [...editingInvoice.extra_charges];
                            n[idx].amount = e.target.value;
                            setEditingInvoice({...editingInvoice, extra_charges: n});
                          }}
                          style={{ padding:'8px 12px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)', fontSize:'0.85rem', fontWeight:'600' }}
                        />
                        <button 
                          onClick={() => {
                            const n = (editingInvoice.extra_charges || []).filter((_, i) => i !== idx);
                            setEditingInvoice({...editingInvoice, extra_charges: n});
                          }}
                          style={{ background:'var(--danger-bg)', color:'var(--danger)', border:'none', borderRadius:'6px', height:'32px', cursor:'pointer' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {(editingInvoice.extra_charges || []).length === 0 && (
                      <p style={{ textAlign:'center', color:'var(--text-muted)', fontSize:'0.8rem', padding:'10px', background:'rgba(255,255,255,0.02)', borderRadius:'8px' }}>Tidak ada biaya tambahan</p>
                    )}
                  </div>
                </div>

                <div>
                  <ExtraDocsUploader
                    extraDocuments={editingInvoice.extraDocuments || editingInvoice.extra_documents || []}
                    onChange={docs => setEditingInvoice({ ...editingInvoice, extraDocuments: docs, extra_documents: docs })}
                  />
                </div>

                {linkedJOs.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'10px', textTransform:'uppercase', fontWeight:'700' }}>
                      {isID ? 'Detail Job Order Terkait' : 'Linked Job Order Details'}
                    </label>
                    <div style={{ display: 'grid', gap: '15px' }}>
                      {linkedJOs.map(jo => {
                        const joDraft = editingJOsData[String(jo.id)] || { instruction: (jo.instruction || jo.jobDescription || '').split(' ||| ')[0].trim(), vesselName: jo.vesselName || '' };
                        return (
                          <div key={jo.id} style={{ padding: '15px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '10px' }}>
                            <div style={{ fontWeight: '700', fontSize: '0.85rem', marginBottom: '10px', color: 'var(--secondary)' }}>
                              Job Order: {jo.id} ({jo.customerName})
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                                  {isID ? 'Instruksi Pekerjaan' : 'Job Instruction'}
                                </label>
                                <textarea
                                  value={joDraft.instruction}
                                  onChange={e => {
                                    setEditingJOsData({
                                      ...editingJOsData,
                                      [String(jo.id)]: { ...joDraft, instruction: e.target.value }
                                    });
                                  }}
                                  rows={2}
                                  style={{ width: '100%', padding: '8px 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '0.8rem', resize: 'vertical' }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                                  {isID ? 'Nama Kapal' : 'Vessel Name'}
                                </label>
                                <input
                                  type="text"
                                  value={joDraft.vesselName}
                                  onChange={e => {
                                    setEditingJOsData({
                                      ...editingJOsData,
                                      [String(jo.id)]: { ...joDraft, vesselName: e.target.value }
                                    });
                                  }}
                                  style={{ width: '100%', padding: '8px 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '0.8rem' }}
                                />
                              </div>
                            </div>

                            {/* JO Costs & Expenses Breakdown */}
                            <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                              <div style={{ fontWeight: '700', fontSize: '0.75rem', color: '#ef4444', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                                {isID ? 'Rincian Biaya & Pengeluaran JO' : 'JO Costs & Expenses Breakdown'}
                              </div>
                              {(() => {
                                const manualCostsList = Array.isArray(jo.costs) ? jo.costs : [];
                                const poCostsList = poMap[jo.id] || [];
                                const costAppsList = costAppMap[String(jo.id)] || [];

                                if (manualCostsList.length === 0 && poCostsList.length === 0 && costAppsList.length === 0) {
                                  return (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                      {isID ? 'Belum ada catatan biaya.' : 'No costing records registered.'}
                                    </div>
                                  );
                                }

                                return (
                                  <div style={{ display: 'grid', gap: '4px', fontSize: '0.75rem' }}>
                                    {manualCostsList.map((c, cIdx) => (
                                      <div key={`mc-${cIdx}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                        <div>
                                          <span>{c.vendorName || c.customVendorName || (isID ? 'Vendor Kustom' : 'Custom Vendor')}</span>
                                          <span style={{ fontSize: '0.58rem', background: 'rgba(212, 175, 55, 0.1)', color: 'var(--secondary)', border: '1px solid rgba(212, 175, 55, 0.25)', padding: '1px 4px', borderRadius: '3px', marginLeft: '6px' }}>Manual</span>
                                        </div>
                                        <span style={{ fontWeight: '700', color: '#ef4444' }}>Rp {parseFloat(c.total || 0).toLocaleString()}</span>
                                      </div>
                                    ))}
                                    {poCostsList.map((p, pIdx) => (
                                      <div key={`po-${pIdx}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                        <div>
                                          <span>{p.vendorName || (isID ? 'Vendor PO' : 'PO Vendor')}</span>
                                          <span style={{ fontSize: '0.58rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.25)', padding: '1px 4px', borderRadius: '3px', marginLeft: '6px' }}>PO: {p.poNumber || p.id}</span>
                                        </div>
                                        <span style={{ fontWeight: '700', color: '#ef4444' }}>Rp {parseFloat(p.grandTotal || 0).toLocaleString()}</span>
                                      </div>
                                    ))}
                                    {costAppsList.map((ca, caIdx) => {
                                      const caStatus = ca.status || 'pending';
                                      const statusBg = caStatus === 'paid' || caStatus === 'released' ? 'rgba(34, 197, 94, 0.1)' : caStatus === 'approved' ? 'rgba(59, 130, 246, 0.1)' : caStatus === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)';
                                      const statusColor = caStatus === 'paid' || caStatus === 'released' ? '#22c55e' : caStatus === 'approved' ? '#3b82f6' : caStatus === 'rejected' ? '#ef4444' : '#f59e0b';
                                      const statusLabel = caStatus === 'paid' || caStatus === 'released' ? (isID ? 'Cair' : 'Released') : caStatus === 'approved' ? (isID ? 'Disetujui' : 'Approved') : caStatus === 'rejected' ? (isID ? 'Ditolak' : 'Rejected') : (isID ? 'Menunggu' : 'Pending');

                                      return (
                                        <div key={`ca-${caIdx}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                          <div>
                                            <span>{ca.employeeName || ca.requestedBy || (isID ? 'Pengajuan Biaya' : 'Cost App')}</span>
                                            <span style={{ fontSize: '0.58rem', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.25)', padding: '1px 4px', borderRadius: '3px', marginLeft: '6px' }}>Cost App: {ca.id}</span>
                                            <span style={{ fontSize: '0.58rem', background: statusBg, color: statusColor, border: `1px solid ${statusColor}40`, padding: '1px 4px', borderRadius: '3px', marginLeft: '4px' }}>{statusLabel}</span>
                                          </div>
                                          <span style={{ fontWeight: '700', color: caStatus === 'rejected' ? 'var(--text-muted)' : '#ef4444', textDecoration: caStatus === 'rejected' ? 'line-through' : 'none' }}>Rp {parseFloat(ca.amount || 0).toLocaleString()}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{ marginTop:'10px', padding:'15px', background:'var(--secondary-bg)', borderRadius:'10px', border:'1px solid var(--secondary-bg)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px', fontSize:'0.85rem' }}>
                    <span style={{ color:'var(--text-muted)' }}>Base Amount</span>
                    <span>Rp {parseFloat(editingInvoice.subtotal || editingInvoice.amount || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px', fontSize:'0.85rem' }}>
                    <span style={{ color:'var(--text-muted)' }}>Extra Total</span>
                    <span>Rp {(editingInvoice.extra_charges || []).reduce((s, c) => s + parseFloat(c.amount || 0), 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontWeight:'700', color:'var(--secondary)', fontSize:'1.1rem', marginTop:'10px', borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:'10px' }}>
                    <span>Total Billing</span>
                    <span>Rp {(parseFloat(editingInvoice.subtotal || editingInvoice.amount || 0) + (editingInvoice.extra_charges || []).reduce((s, c) => s + parseFloat(c.amount || 0), 0)).toLocaleString()}</span>
                  </div>
                </div>

                <div style={{ display:'flex', gap:'12px', marginTop:'10px' }}>
                  <button onClick={() => setEditingInvoice(null)} className="btn" style={{ flex:1, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', color:'var(--text)' }}>Cancel</button>
                  <ButtonWithLoading onClick={handleSaveInvoiceEdit} className="btn btn-gold" style={{ flex:2, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                    <Save size={18} /> Update Invoice
                  </ButtonWithLoading>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Photo Viewer Modal */}
      {photoViewer && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', zIndex:20000, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px' }}>
          <div style={{ background:'var(--card-bg)', border:'1px solid var(--glass-border)', borderRadius:'15px', width:'100%', maxWidth:'1000px', maxHeight:'90vh', display:'flex', flexDirection:'column', position:'relative' }}>
            <button onClick={() => setPhotoViewer(null)} style={{ position:'absolute', top:'-40px', right:'0', background:'none', border:'none', color:'white', cursor:'pointer' }}><X size={30}/></button>
            <div style={{ padding:'20px', borderBottom:'1px solid var(--glass-border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ margin:0, color:'var(--secondary)' }}>{photoViewer.title || `Documentation Photos for ${photoViewer.joId || ''}`}</h3>
              <p style={{ margin:0, color:'var(--text-muted)', fontSize:'0.85rem' }}>{photoViewer.photos.length} Total Images</p>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'20px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'15px' }}>
              {(() => {
                const getPhotos = (data) => {
                  if (!data) return [];
                  if (Array.isArray(data)) return data;
                  if (typeof data === 'string') {
                    if (data.startsWith('[') || data.startsWith('{')) {
                      try {
                        const parsed = JSON.parse(data);
                        return Array.isArray(parsed) ? parsed : [parsed];
                      } catch (e) { return [data]; }
                    }
                    return [data];
                  }
                  return [];
                };
                const photoList = getPhotos(photoViewer.photos);
                return photoList.map((p, idx) => (
                  <div key={idx} style={{ position:'relative', borderRadius:'10px', overflow:'hidden', border:'1px solid var(--glass-border)', background:'#000' }}>
                    <img src={p} alt={`JO Photo ${idx}`} style={{ width:'100%', height:'180px', objectFit:'cover' }} />
                    <a 
                      href={p} 
                      download={`Photo_${idx+1}.jpg`}
                      style={{ position:'absolute', bottom:'10px', right:'10px', background:'var(--secondary)', color:'white', width:'30px', height:'30px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 10px rgba(0,0,0,0.5)' }}
                      title="Download Photo"
                    >
                      <Download size={14} />
                    </a>
                  </div>
                ));
              })()}
            </div>
            <div style={{ padding:'15px', borderTop:'1px solid var(--glass-border)', textAlign:'right' }}>
              <button onClick={() => setPhotoViewer(null)} className="btn btn-gold" style={{ padding:'10px 25px' }}>Done</button>
            </div>
          </div>
        </div>
      )}
      {/* Custom Invoice Modal */}
      {showCustomInvoiceModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
          <div className="glass-card" style={{ width:'100%', maxWidth:'850px', padding:'35px', maxHeight:'90vh', overflowY:'auto', position:'relative' }}>
            <button onClick={() => setShowCustomInvoiceModal(false)} style={{ position:'absolute', top:'15px', right:'15px', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}><X size={20}/></button>
            <h3 style={{ color:'var(--success)', marginBottom:'25px', display:'flex', alignItems:'center', gap:'10px' }}><Plus size={24}/> {isID ? 'Buat Invoice Kustom Baru' : 'Create New Custom Invoice'}</h3>
            
            <form onSubmit={handleCreateCustomInvoice}>
              <div className="grid-responsive-2" style={{ gap:'20px', marginBottom:'20px' }}>
                <div>
                  <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>{isID ? 'Nomor Invoice (ID)' : 'Invoice Number (ID)'}</label>
                  <input 
                    type="text" 
                    value={customInvoiceForm.id} 
                    onChange={e => setCustomInvoiceForm({ ...customInvoiceForm, id: e.target.value })}
                    placeholder={isID ? '(Otomatis - Sequential)' : '(Auto-generated Sequential)'}
                    style={{ width:'100%', padding:'10px 12px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)', fontSize:'0.9rem' }}
                  />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>{isID ? 'Hubungkan ke Job Order (Opsional)' : 'Link to Job Order (Optional)'}</label>
                  <select 
                    value={customInvoiceForm.joId} 
                    onChange={e => handleJOChangePrefill(e.target.value)}
                    style={{ width:'100%', padding:'10px 12px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)', fontSize:'0.9rem', outline:'none', cursor:'pointer' }}
                  >
                    <option value="">{isID ? '-- Pilih Job Order --' : '-- Select Job Order --'}</option>
                    {jobOrders
                      .filter(jo => !invoices.some(inv => String(inv.joId) === String(jo.id)))
                      .map(jo => (
                        <option key={jo.id} value={jo.id}>{jo.id} - {jo.customerName} ({jo.instruction || jo.jobDescription || 'No Desc'})</option>
                      ))
                    }
                  </select>
                </div>
              </div>

              <div className="grid-responsive-2" style={{ gap:'20px', marginBottom:'20px' }}>
                <div>
                  <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>{isID ? 'Isi Cepat dari Pelanggan Terdaftar' : 'Quick Fill from Registered Customer'}</label>
                  <select 
                    onChange={e => {
                      if (e.target.value) {
                        setCustomInvoiceForm(prev => ({ ...prev, customerName: e.target.value }));
                      }
                    }}
                    style={{ width:'100%', padding:'10px 12px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)', fontSize:'0.9rem', outline:'none', cursor:'pointer' }}
                  >
                    <option value="">{isID ? '-- Pilih Pelanggan --' : '-- Select Customer --'}</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>{isID ? 'Nama Customer' : 'Customer Name'}</label>
                  <input 
                    type="text" 
                    value={customInvoiceForm.customerName} 
                    onChange={e => setCustomInvoiceForm({ ...customInvoiceForm, customerName: e.target.value })}
                    placeholder={isID ? "Nama Customer / Perusahaan" : "Customer / Company Name"}
                    style={{ width:'100%', padding:'10px 12px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)', fontSize:'0.9rem' }}
                    required
                  />
                </div>
              </div>

              <div className="grid-responsive-2" style={{ gap:'20px', marginBottom:'20px' }}>
                <div>
                  <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>{isID ? 'Tanggal Invoice' : 'Invoice Date'}</label>
                  <input 
                    type="date" 
                    value={customInvoiceForm.date} 
                    onChange={e => setCustomInvoiceForm({ ...customInvoiceForm, date: e.target.value })}
                    style={{ width:'100%', padding:'10px 12px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)', fontSize:'0.9rem' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>{isID ? 'Pajak / PPN (%)' : 'Tax / VAT (%)'}</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    step="any"
                    value={customInvoiceForm.taxPercent} 
                    onChange={e => setCustomInvoiceForm({ ...customInvoiceForm, taxPercent: parseFloat(e.target.value) || 0 })}
                    style={{ width:'100%', padding:'10px 12px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)', fontSize:'0.9rem' }}
                  />
                </div>
              </div>
              
              <div style={{ marginBottom:'20px' }}>
                <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>
                  {isID ? 'Keterangan (Opsional)' : 'Description (Optional)'}
                </label>
                <textarea 
                  value={customInvoiceForm.notes} 
                  onChange={e => setCustomInvoiceForm({ ...customInvoiceForm, notes: e.target.value })}
                  placeholder={isID ? "Masukkan keterangan tambahan untuk invoice..." : "Enter additional description for the invoice..."}
                  style={{ width:'100%', minHeight:'70px', padding:'10px 12px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)', fontSize:'0.9rem', resize:'vertical' }}
                />
              </div>

              {/* Items Section */}
              <div style={{ marginTop:'30px', marginBottom:'20px' }}>
                <h4 style={{ borderBottom:'1px solid var(--glass-border)', paddingBottom:'8px', color:'var(--text)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'8px' }}>
                  <span>{isID ? 'Item Layanan' : 'Service Items'}</span>
                  <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                    <button 
                      type="button"
                      onClick={() => setCustomInvoiceForm(prev => ({ ...prev, items: [...prev.items, { description: 'Storage Demmurage', qty: 1, rate: '' }] }))}
                      style={{ background:'rgba(212, 175, 55, 0.15)', color:'var(--secondary)', border:'1px solid var(--secondary)', borderRadius:'6px', padding:'4px 10px', fontSize:'0.75rem', fontWeight:'700', cursor:'pointer' }}
                    >
                      + Storage Demmurage
                    </button>
                    <button 
                      type="button"
                      onClick={() => setCustomInvoiceForm(prev => ({ ...prev, items: [...prev.items, { description: 'Insurance Cost', qty: 1, rate: '' }] }))}
                      style={{ background:'rgba(59, 130, 246, 0.15)', color:'#60a5fa', border:'1px solid #3b82f6', borderRadius:'6px', padding:'4px 10px', fontSize:'0.75rem', fontWeight:'700', cursor:'pointer' }}
                    >
                      + Insurance Cost
                    </button>
                    <button 
                      type="button" 
                      onClick={addCustomInvoiceItem}
                      style={{ background:'var(--success-bg)', color:'var(--success)', border:'1px solid var(--success)', borderRadius:'6px', padding:'4px 10px', fontSize:'0.75rem', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}
                    >
                      <Plus size={14}/> {isID ? 'Tambah Item' : 'Add Item'}
                    </button>
                  </div>
                </h4>

                <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginTop:'15px' }}>
                  {customInvoiceForm.items.map((item, idx) => {
                    const rowTotal = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
                    return (
                      <div key={idx} style={{ display:'flex', gap:'12px', alignItems:'flex-end', flexWrap:'wrap', background:'rgba(255,255,255,0.02)', padding:'12px', borderRadius:'8px', border:'1px solid var(--glass-border)' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <label style={{ display:'block', fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:'4px', textTransform:'uppercase' }}>{isID ? 'Deskripsi Layanan' : 'Service Description'}</label>
                          <input 
                            type="text"
                            value={item.description}
                            onChange={e => updateCustomInvoiceItem(idx, 'description', e.target.value)}
                            placeholder={isID ? "Contoh: Jasa Pengiriman Trucking" : "e.g., Trucking Delivery Service"}
                            style={{ width:'100%', padding:'8px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'6px', color:'var(--text)', fontSize:'0.85rem' }}
                            required
                          />
                        </div>
                        <div style={{ width: '80px' }}>
                          <label style={{ display:'block', fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:'4px', textTransform:'uppercase' }}>{isID ? 'Jumlah' : 'Qty'}</label>
                          <input 
                            type="number"
                            min="0.01"
                            step="any"
                            value={item.qty}
                            onChange={e => updateCustomInvoiceItem(idx, 'qty', e.target.value)}
                            style={{ width:'100%', padding:'8px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'6px', color:'var(--text)', fontSize:'0.85rem' }}
                            required
                          />
                        </div>
                        <div style={{ width: '150px' }}>
                          <label style={{ display:'block', fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:'4px', textTransform:'uppercase' }}>{isID ? 'Harga Satuan' : 'Unit Rate'}</label>
                          <input 
                            type="number"
                            min="0"
                            step="any"
                            value={item.rate}
                            onChange={e => updateCustomInvoiceItem(idx, 'rate', e.target.value)}
                            style={{ width:'100%', padding:'8px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'6px', color:'var(--text)', fontSize:'0.85rem' }}
                            required
                          />
                        </div>
                        <div style={{ width: '130px', textAlign:'right', paddingBottom:'10px' }}>
                          <span style={{ display:'block', fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:'4px', textTransform:'uppercase' }}>Total</span>
                          <span style={{ fontSize:'0.9rem', fontWeight:'700', color:'var(--text)' }}>Rp {rowTotal.toLocaleString('id-ID')}</span>
                        </div>
                        <div style={{ width: '40px', paddingBottom:'5px' }}>
                          <button
                            type="button"
                            onClick={() => removeCustomInvoiceItem(idx)}
                            disabled={customInvoiceForm.items.length <= 1}
                            style={{ background:'var(--danger-bg)', color:'var(--danger)', border:'1px solid var(--danger-border)', borderRadius:'6px', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center', cursor: customInvoiceForm.items.length <= 1 ? 'not-allowed' : 'pointer' }}
                          >
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Extra Document Pages Upload */}
              <div style={{ marginBottom: '20px' }}>
                <ExtraDocsUploader
                  extraDocuments={customInvoiceForm.extraDocuments || []}
                  onChange={docs => setCustomInvoiceForm({ ...customInvoiceForm, extraDocuments: docs })}
                />
              </div>

              {/* Summary Calculations */}
              {(() => {
                const subtotal = customInvoiceForm.items.reduce((s, item) => s + (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0), 0);
                const tax = (subtotal * (parseFloat(customInvoiceForm.taxPercent) || 0)) / 100;
                const total = subtotal + tax;
                return (
                  <div style={{ background:'rgba(255,255,255,0.03)', padding:'20px', borderRadius:'10px', border:'1px solid var(--glass-border)', display:'flex', flexDirection:'column', gap:'8px', marginLeft:'auto', maxWidth:'350px', marginBottom:'25px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.85rem' }}>
                      <span style={{ color:'var(--text-muted)' }}>Subtotal:</span>
                      <span style={{ fontWeight:'600', color:'var(--text)' }}>Rp {subtotal.toLocaleString('id-ID')}</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.85rem' }}>
                      <span style={{ color:'var(--text-muted)' }}>PPN / Pajak ({customInvoiceForm.taxPercent}%):</span>
                      <span style={{ fontWeight:'600', color:'var(--text)' }}>Rp {tax.toLocaleString('id-ID')}</span>
                    </div>
                    <div style={{ height:'1px', background:'var(--glass-border)', margin:'5px 0' }} />
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'1.05rem', fontWeight:'800' }}>
                      <span style={{ color:'var(--secondary)' }}>{isID ? 'Total Tagihan:' : 'Grand Total:'}</span>
                      <span style={{ color:'var(--secondary)' }}>Rp {total.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                );
              })()}

              <div style={{ display:'flex', gap:'12px', borderTop:'1px solid var(--glass-border)', paddingTop:'20px', justifyContent:'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setShowCustomInvoiceModal(false)} 
                  className="btn" 
                  style={{ background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', color:'var(--text)', padding:'10px 25px' }}
                >
                  {isID ? 'Batal' : 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  className="btn btn-gold" 
                  style={{ background:'linear-gradient(135deg, var(--success), #059669)', border:'none', color:'#ffffff', padding:'10px 25px', boxShadow:'0 4px 15px var(--success-border)' }}
                >
                  <CheckCircle size={16} style={{ marginRight:'6px' }}/> {isID ? 'Simpan Invoice' : 'Save Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Salary Modal */}
      {salaryModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
          <div className="glass-card" style={{ width:'100%', maxWidth:'700px', padding:'35px', maxHeight:'90vh', overflowY:'auto', position:'relative' }}>
            <button onClick={() => setSalaryModal(false)} style={{ position:'absolute', top:'15px', right:'15px', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}><X size={20}/></button>
            <h3 style={{ color:'#8b5cf6', marginBottom:'25px', display:'flex', alignItems:'center', gap:'10px' }}><User size={24}/> {salaryForm.id ? (isID ? 'Perbarui Data Gaji Karyawan' : 'Update Employee Salary Data') : (isID ? 'Tambah Data Gaji Karyawan' : 'Add Employee Salary Data')}</h3>
            
            <div className="grid-responsive-2" style={{ gap:'20px', marginBottom:'20px' }}>
              <div>
                <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>{isID ? 'Pilih Karyawan' : 'Select Employee'}</label>
                <select 
                  value={salaryForm.employeeId || ''} 
                  onChange={e => {
                    const emp = employees.find(emp => emp.id === e.target.value);
                    if (emp) {
                      setSalaryForm({
                        ...salaryForm,
                        employeeId: emp.id,
                        name: emp.name,
                        position: emp.position,
                        bankAccount: emp.bankAccount || '',
                        bankName: emp.bankName || '',
                        nik: emp.nik || '',
                        npwp: emp.npwp || ''
                      });
                    }
                  }} 
                  style={{ width:'100%', padding:'10px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)' }}
                >
                  <option value="" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>-- {isID ? 'Pilih Karyawan' : 'Select Employee'} --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id} style={{ background: 'var(--bg)', color: 'var(--text)' }}>
                      {emp.name} ({emp.position})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>{isID ? 'Jabatan' : 'Position'}</label>
                <div style={{ width:'100%', padding:'10px 15px', background:'rgba(255,255,255,0.02)', border:'1px solid var(--border)', borderRadius:'8px', minHeight: '44px', display: 'flex', alignItems: 'center' }}>
                  {renderPositionTags(salaryForm.position)}
                </div>
              </div>
            </div>

            <div className="grid-responsive-2" style={{ gap:'20px', marginBottom:'20px' }}>
              <div>
                <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>{isID ? 'Nomor Rekening' : 'Bank Account Number'}</label>
                <input type="text" value={salaryForm.bankAccount} onChange={e => setSalaryForm({...salaryForm, bankAccount: e.target.value})} style={{ width:'100%', padding:'10px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)' }} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>{isID ? 'Nama Bank' : 'Bank Name'}</label>
                <input type="text" value={salaryForm.bankName} onChange={e => setSalaryForm({...salaryForm, bankName: e.target.value})} style={{ width:'100%', padding:'10px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)' }} />
              </div>
            </div>

            <div className="grid-responsive-2" style={{ gap:'20px', marginBottom:'20px' }}>
              <div>
                <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>{isID ? 'Nominal Gaji Pokok' : 'Base Salary Amount'}</label>
                <input type="number" step="any" value={salaryForm.baseSalary} onChange={e => setSalaryForm({...salaryForm, baseSalary: e.target.value})} style={{ width:'100%', padding:'10px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)', fontWeight:'700' }} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>{isID ? 'Periode Bulan' : 'Monthly Period'}</label>
                <input type="text" placeholder={isID ? "misal April 2024" : "e.g. April 2024"} value={salaryForm.period} onChange={e => setSalaryForm({...salaryForm, period: e.target.value})} style={{ width:'100%', padding:'10px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)' }} />
              </div>
            </div>

            <div className="grid-responsive-2" style={{ gap:'20px', marginBottom:'20px' }}>
              <div>
                <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>{isID ? 'NIK' : 'National ID (NIK)'}</label>
                <input type="text" value={salaryForm.nik} onChange={e => setSalaryForm({...salaryForm, nik: e.target.value})} style={{ width:'100%', padding:'10px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)' }} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>{isID ? 'NPWP' : 'Tax ID (NPWP)'}</label>
                <input type="text" value={salaryForm.npwp} onChange={e => setSalaryForm({...salaryForm, npwp: e.target.value})} style={{ width:'100%', padding:'10px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)' }} />
              </div>
            </div>

            <div style={{ marginBottom:'25px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                <label style={{ fontSize:'0.75rem', color:'var(--text-muted)', textTransform:'uppercase', fontWeight:'700' }}>{isID ? 'Potongan Pajak / Lainnya' : 'Tax Deductions / Others'}</label>
                <button onClick={() => setSalaryForm({...salaryForm, taxes: [...salaryForm.taxes, { name: '', amount: 0 }]})} style={{ background:'rgba(139,92,246,0.1)', color:'#8b5cf6', border:'1px solid #8b5cf6', borderRadius:'6px', padding:'4px 10px', fontSize:'0.7rem', cursor:'pointer' }}>+ {isID ? 'Tambah Potongan' : 'Add Deduction'}</button>
              </div>
              {salaryForm.taxes.map((tax, idx) => (
                <div key={idx} style={{ display:'grid', gridTemplateColumns:'1fr 120px 32px', gap:'10px', marginBottom:'8px' }}>
                  <input type="text" placeholder={isID ? "Deskripsi (misal PPh21)" : "Description (e.g. Tax PPh21)"} value={tax.name} onChange={e => { const n=[...salaryForm.taxes]; n[idx].name=e.target.value; setSalaryForm({...salaryForm, taxes:n}); }} style={{ padding:'8px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'6px', color:'var(--text)', fontSize:'0.85rem' }} />
                  <input type="number" step="any" placeholder={isID ? "Nominal" : "Amount"} value={tax.amount} onChange={e => { const n=[...salaryForm.taxes]; n[idx].amount=e.target.value; setSalaryForm({...salaryForm, taxes:n}); }} style={{ padding:'8px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'6px', color:'var(--text)', fontSize:'0.85rem' }} />
                  <button onClick={() => setSalaryForm({...salaryForm, taxes: salaryForm.taxes.filter((_,i)=>i!==idx)})} style={{ background:'var(--danger-bg)', color:'var(--danger)', border:'none', borderRadius:'6px', cursor:'pointer' }}><X size={14}/></button>
                </div>
              ))}
            </div>

            <div className="grid-responsive-2" style={{ gap:'20px', marginBottom:'30px' }}>
              <div>
                <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>{isID ? 'Bukti Transfer (Upload)' : 'Transfer Proof (Upload)'}</label>
                <input type="file" onChange={e => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setSalaryForm({...salaryForm, proofPhoto: reader.result});
                    reader.readAsDataURL(file);
                  }
                }} style={{ width:'100%', fontSize:'0.8rem', color:'var(--text-muted)' }} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>{isID ? 'Tanggal Pembayaran' : 'Payment Date'}</label>
                <input type="date" value={salaryForm.expenseDate} onChange={e => setSalaryForm({...salaryForm, expenseDate: e.target.value})} style={{ width:'100%', padding:'10px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)' }} />
              </div>
            </div>

            <div style={{ background:'var(--success-bg)', padding:'20px', borderRadius:'15px', border:'1px solid var(--success)', marginBottom:'30px', textAlign:'right' }}>
              <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginBottom:'5px' }}>{isID ? 'Total Gaji yang Dibayarkan (Setelah Potongan)' : 'Total Salary Paid (After Deductions)'}</div>
              <div style={{ fontSize:'1.8rem', fontWeight:'900', color:'var(--success)' }}>
                Rp {(parseFloat(salaryForm.baseSalary || 0) - salaryForm.taxes.reduce((acc, t) => acc + parseFloat(t.amount || 0), 0)).toLocaleString(isID ? 'id-ID' : 'en-US')}
              </div>
            </div>

            <ButtonWithLoading className="btn btn-primary" style={{ width:'100%', padding:'15px', background:'#8b5cf6' }} onClick={async () => {
               const totalTaxes = salaryForm.taxes.reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
               const totalToPay = parseFloat(salaryForm.baseSalary || 0) - totalTaxes;
               if (salaryForm.id) {
                 await updateSalary(salaryForm.id, { ...salaryForm, totalToPay });
               } else {
                 await addSalary({ ...salaryForm, totalToPay });
               }
               setSalaryModal(false);
               setSalaryForm({ name: '', position: '', bankAccount: '', bankName: '', baseSalary: '', period: '', nik: '', npwp: '', taxes: [], proofPhoto: '', expenseDate: '' });
            }}>
              {salaryForm.id ? (isID ? '💾 Perbarui Data Gaji' : '💾 Update Salary Data') : (isID ? '🚀 Simpan & Terbitkan Gaji' : '🚀 Save & Issue Salary')}
            </ButtonWithLoading>
          </div>
        </div>
      )}

      {/* Other Expense Modal */}
      {reimbursementModal && (
        <div className="modal-overlay" style={{ zIndex: 1000, animation: 'fadeIn 0.2s ease-out' }}>
          <div className="modal-content glass-card" style={{ maxWidth: '800px', width: '90%', animation: 'slideUp 0.3s ease-out', padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid var(--border)', paddingBottom: '15px' }}>
              <h3 style={{ color: '#14b8a6', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Receipt size={24} /> {reimbursementForm.id ? (isID ? 'Edit Reimbursement' : 'Edit Reimbursement') : (isID ? 'Pengajuan Reimbursement' : 'New Reimbursement')}
              </h3>
              <button onClick={() => setReimbursementModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>{isID ? 'Nama Staff' : 'Staff Name'}</label>
                <input
                  type="text"
                  value={reimbursementForm.employeeName}
                  onChange={e => setReimbursementForm({ ...reimbursementForm, employeeName: e.target.value })}
                  placeholder="John Doe"
                  style={{ width: '100%', padding: '10px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>{isID ? 'Tanggal Pengeluaran' : 'Expense Date'}</label>
                <input
                  type="date"
                  value={reimbursementForm.expenseDate}
                  onChange={e => setReimbursementForm({ ...reimbursementForm, expenseDate: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>{isID ? 'Daftar Item Reimbursement' : 'Reimbursement Items'}</label>
              {reimbursementForm.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                  <input
                    type="text"
                    value={item.details}
                    onChange={e => { const items = [...reimbursementForm.items]; items[idx].details = e.target.value; setReimbursementForm({ ...reimbursementForm, items }); }}
                    placeholder={isID ? 'Detail biaya (Misal: Ongkos Taxi)' : 'Item details (e.g., Taxi Fare)'}
                    style={{ flex: 2, padding: '10px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }}
                  />
                  <input
                    type="number"
                    value={item.amount}
                    onChange={e => { const items = [...reimbursementForm.items]; items[idx].amount = e.target.value; setReimbursementForm({ ...reimbursementForm, items }); }}
                    placeholder="Rp"
                    style={{ flex: 1, padding: '10px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }}
                  />
                  {reimbursementForm.items.length > 1 && (
                    <button onClick={() => { const items = reimbursementForm.items.filter((_, i) => i !== idx); setReimbursementForm({ ...reimbursementForm, items }); }} style={{ padding: '10px', background: 'var(--danger-bg)', color: 'var(--danger)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setReimbursementForm({ ...reimbursementForm, items: [...reimbursementForm.items, { details: '', amount: '', receiptPhoto: '' }] })}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(20,184,166,0.1)', color: '#14b8a6', padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginTop: '5px' }}
              >
                <Plus size={16} /> {isID ? 'Tambah Item' : 'Add Item'}
              </button>
              <div style={{ textAlign: 'right', marginTop: '10px', fontSize: '1.1rem', fontWeight: 'bold' }}>
                Total: Rp {reimbursementForm.items.reduce((s, i) => s + parseFloat(i.amount || 0), 0).toLocaleString()}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>{isID ? 'Rekening Tujuan (Nama Bank)' : 'Recipient Bank Name'}</label>
                <input
                  type="text"
                  value={reimbursementForm.recipientBankName}
                  onChange={e => setReimbursementForm({ ...reimbursementForm, recipientBankName: e.target.value })}
                  placeholder="BCA, Mandiri, dll."
                  style={{ width: '100%', padding: '10px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>{isID ? 'Nomor Rekening Tujuan' : 'Recipient Account Number'}</label>
                <input
                  type="text"
                  value={reimbursementForm.recipientBankAccount}
                  onChange={e => setReimbursementForm({ ...reimbursementForm, recipientBankAccount: e.target.value })}
                  placeholder="1234567890"
                  style={{ width: '100%', padding: '10px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>{isID ? 'Sumber Dana Perusahaan (Opsional)' : 'Source Company Bank (Optional)'}</label>
              <select
                value={reimbursementForm.companyBankAccountId || ''}
                onChange={e => setReimbursementForm({ ...reimbursementForm, companyBankAccountId: e.target.value })}
                style={{ width: '100%', padding: '10px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }}
              >
                <option value="" style={{ background: 'var(--bg)', color: 'var(--text)' }}>{isID ? '-- Pilih Rekening Sumber Dana --' : '-- Select Source Bank Account --'}</option>
                {companyBankAccounts.map(b => (
                  <option key={b.id} value={b.id} style={{ background: 'var(--bg)', color: 'var(--text)' }}>{b.bankName} - {b.accountNumber} ({b.accountName})</option>
                ))}
                <option value="CUSTOM" style={{ background: 'var(--bg)', color: 'var(--text)' }}>{isID ? '+ Tambah Sumber Dana Baru (Custom)...' : '+ Add New Source (Custom)...'}</option>
              </select>
              {reimbursementForm.companyBankAccountId === 'CUSTOM' && (
                <div style={{ marginTop: '10px' }}>
                  <input
                    type="text"
                    value={reimbursementForm.customSourceTarget || ''}
                    onChange={e => setReimbursementForm({ ...reimbursementForm, customSourceTarget: e.target.value })}
                    placeholder={isID ? 'Misal: Petty Cash, GoPay, OVO...' : 'e.g., Petty Cash, GoPay, OVO...'}
                    style={{ width: '100%', padding: '10px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }}
                  />
                </div>
              )}
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>{isID ? 'Catatan Penting' : 'Important Notes'}</label>
              <textarea
                value={reimbursementForm.notes}
                onChange={e => setReimbursementForm({ ...reimbursementForm, notes: e.target.value })}
                rows="3"
                placeholder={isID ? 'Keperluan meeting klien...' : 'Client meeting notes...'}
                style={{ width: '100%', padding: '10px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', resize: 'vertical' }}
              ></textarea>
            </div>

            <ButtonWithLoading onClick={handleSaveReimbursement} style={{ width: '100%', padding: '15px', background: '#14b8a6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
              {isID ? 'Simpan Reimbursement' : 'Save Reimbursement'}
            </ButtonWithLoading>
          </div>
        </div>
      )}

      {otherExpenseModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
          <div className="glass-card" style={{ width:'100%', maxWidth:'700px', padding:'35px', maxHeight:'90vh', overflowY:'auto', position:'relative' }}>
            <button onClick={() => setOtherExpenseModal(false)} style={{ position:'absolute', top:'15px', right:'15px', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}><X size={20}/></button>
            <h3 style={{ color: otherExpenseForm.type === 'income' ? 'var(--success)' : '#ec4899', marginBottom:'25px', display:'flex', alignItems:'center', gap:'10px' }}>
              <Briefcase size={24}/> {otherExpenseForm.id ? (isID ? 'Perbarui Transaksi' : 'Update Transaction') : (isID ? 'Tambah Transaksi Baru' : 'Add New Transaction')}
            </h3>

            {/* Segmented Control: Income vs Expense */}
            <div style={{ marginBottom:'25px' }}>
              <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>{isID ? 'Jenis Transaksi' : 'Transaction Type'}</label>
              <div style={{ display:'flex', gap:'10px' }}>
                <button
                  type="button"
                  onClick={() => setOtherExpenseForm({ ...otherExpenseForm, type: 'income' })}
                  style={{
                    flex: 1, padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
                    background: otherExpenseForm.type === 'income' ? 'linear-gradient(135deg, var(--success), #047857)' : 'rgba(255,255,255,0.05)',
                    color: otherExpenseForm.type === 'income' ? 'white' : 'var(--text-muted)',
                    border: 'none',
                    boxShadow: otherExpenseForm.type === 'income' ? '0 4px 10px var(--success-border)' : 'none'
                  }}
                >
                  {isID ? '🟢 PENDAPATAN' : '🟢 INCOME'}
                </button>
                <button
                  type="button"
                  onClick={() => setOtherExpenseForm({ ...otherExpenseForm, type: 'expense' })}
                  style={{
                    flex: 1, padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
                    background: otherExpenseForm.type === 'expense' ? 'linear-gradient(135deg, #ec4899, #be185d)' : 'rgba(255,255,255,0.05)',
                    color: otherExpenseForm.type === 'expense' ? 'white' : 'var(--text-muted)',
                    border: 'none',
                    boxShadow: otherExpenseForm.type === 'expense' ? '0 4px 10px rgba(236,72,153,0.3)' : 'none'
                  }}
                >
                  {isID ? '🔴 PENGELUARAN' : '🔴 EXPENSE'}
                </button>
              </div>
            </div>

            {/* Category selection */}
            <div className="grid-responsive-2" style={{ gap:'20px', marginBottom:'20px' }}>
              <div>
                <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>{isID ? 'Kategori Transaksi' : 'Transaction Category'}</label>
                <select
                  value={existingCategories.includes(otherExpenseForm.category) ? otherExpenseForm.category : 'CUSTOM'}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === 'CUSTOM') {
                      setOtherExpenseForm({ ...otherExpenseForm, category: 'CUSTOM', customCategory: '', subcategory: '', customSubcategory: '' });
                    } else {
                      setOtherExpenseForm({ ...otherExpenseForm, category: val, customCategory: '', subcategory: '', customSubcategory: '' });
                    }
                  }}
                  style={{ width:'100%', padding:'10px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)' }}
                >
                  {existingCategories.map(cat => (
                    <option key={cat} value={cat} style={{ background: 'var(--bg)', color: 'var(--text)' }}>{cat}</option>
                  ))}
                  <option value="CUSTOM" style={{ background: 'var(--bg)', color: 'var(--text)' }}>{isID ? '+ Tambah Kategori Baru...' : '+ Add New Category...'}</option>
                </select>
                {otherExpenseForm.category === 'CUSTOM' && (
                  <div style={{ marginTop:'10px' }}>
                    <input 
                      type="text" 
                      value={otherExpenseForm.customCategory || ''} 
                      onChange={e => setOtherExpenseForm({ ...otherExpenseForm, customCategory: e.target.value })}
                      placeholder={isID ? 'Masukkan nama kategori baru...' : 'Enter new category name...'}
                      style={{ width:'100%', padding:'10px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)' }}
                    />
                  </div>
                )}
              </div>

              {/* Subcategory selection */}
              <div>
                <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>{isID ? 'Subkategori Transaksi' : 'Transaction Subcategory'}</label>
                {(() => {
                  const currentCategory = otherExpenseForm.category === 'CUSTOM' ? otherExpenseForm.customCategory : otherExpenseForm.category;
                  const defaults = defaultSubcategories[currentCategory] || [];
                  const defaultIds = defaults.map(s => s.id);
                  const customSubs = [];
                  if (currentCategory) {
                    enrichedOtherTransactions.forEach(t => {
                      if (t.category === currentCategory && t.subcategory && !defaultIds.includes(t.subcategory) && !customSubs.includes(t.subcategory)) {
                        customSubs.push(t.subcategory);
                      }
                    });
                  }
                  const subsList = [
                    ...defaults,
                    ...customSubs.map(s => ({ id: s, en: s }))
                  ];
                  const isCustomSub = otherExpenseForm.subcategory === 'CUSTOM';
                  
                  return (
                    <>
                      <select
                        value={otherExpenseForm.subcategory || ''}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === 'CUSTOM') {
                            setOtherExpenseForm({ ...otherExpenseForm, subcategory: 'CUSTOM', customSubcategory: '' });
                          } else {
                            setOtherExpenseForm({ ...otherExpenseForm, subcategory: val, customSubcategory: '' });
                          }
                        }}
                        style={{ width:'100%', padding:'10px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)' }}
                      >
                        <option value="" style={{ background: 'var(--bg)', color: 'var(--text)' }}>{isID ? '-- Pilih Subkategori --' : '-- Select Subcategory --'}</option>
                        {subsList.map(sub => (
                          <option key={sub.id} value={sub.id} style={{ background: 'var(--bg)', color: 'var(--text)' }}>
                            {isID ? sub.id : sub.en}
                          </option>
                        ))}
                        <option value="CUSTOM" style={{ background: 'var(--bg)', color: 'var(--text)' }}>{isID ? '+ Tambah Subkategori Baru...' : '+ Add New Subcategory...'}</option>
                      </select>
                      {isCustomSub && (
                        <div style={{ marginTop:'10px' }}>
                          <input 
                            type="text" 
                            value={otherExpenseForm.customSubcategory || ''} 
                            onChange={e => setOtherExpenseForm({ ...otherExpenseForm, customSubcategory: e.target.value })}
                            placeholder={isID ? 'Masukkan nama subkategori baru...' : 'Enter new subcategory name...'}
                            style={{ width:'100%', padding:'10px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)' }}
                          />
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Source/Target Bank Account */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>
                {otherExpenseForm.type === 'income' 
                  ? (isID ? 'Rekening Bank Penerima (Target)' : 'Recipient Bank Account (Target)') 
                  : (isID ? 'Rekening Bank Sumber (Source)' : 'Source Bank Account')}
              </label>
              <select
                value={otherExpenseForm.companyBankAccountId || ''}
                onChange={e => setOtherExpenseForm({ ...otherExpenseForm, companyBankAccountId: e.target.value })}
                style={{ width:'100%', padding:'10px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)' }}
              >
                <option value="" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
                  {isID ? '-- Pilih Rekening Perusahaan (Opsional) --' : '-- Select Company Bank Account (Optional) --'}
                </option>
                {companyBankAccounts.map(bank => (
                  <option key={bank.id} value={bank.id} style={{ background: 'var(--bg)', color: 'var(--text)' }}>
                    {bank.bankName} - {bank.accountNumber} ({bank.accountName})
                  </option>
                ))}
                <option value="CUSTOM" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
                  {isID ? '+ Tambah Sumber/Target Baru (Custom)...' : '+ Add New Source/Target (Custom)...'}
                </option>
              </select>
              {otherExpenseForm.companyBankAccountId === 'CUSTOM' && (
                <div style={{ marginTop:'10px' }}>
                  <input 
                    type="text" 
                    value={otherExpenseForm.customSourceTarget || ''} 
                    onChange={e => setOtherExpenseForm({ ...otherExpenseForm, customSourceTarget: e.target.value })}
                    placeholder={isID ? 'Misal: Petty Cash, GoPay, OVO...' : 'e.g., Petty Cash, GoPay, OVO...'}
                    style={{ width:'100%', padding:'10px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)' }}
                  />
                </div>
              )}
            </div>

            {/* Optional details (collapsible) */}
            <div style={{ marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => setShowOptionalDetails(!showOptionalDetails)}
                style={{
                  display: 'flex', alignItems: 'center', width: '100%',
                  padding: '12px 15px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)',
                  borderRadius: '8px', color: 'var(--text)', cursor: 'pointer', fontWeight: '600'
                }}
              >
                <span style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
                  <User size={16} /> 
                  <span>{isID ? 'Detail Karyawan & Rekening Penerima' : 'Employee Details & Recipient Account'}</span>
                  {otherExpenseForm.employeeName && otherExpenseForm.employeeName !== 'Umum' ? (
                    <span style={{ fontSize: '0.75rem', background: 'rgba(212,175,55,0.15)', color: 'var(--secondary)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--secondary-border)', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      {isID ? 'Terpilih' : 'Selected'}: {otherExpenseForm.employeeName} 
                      {otherExpenseForm.position && <>({renderPositionTags(otherExpenseForm.position)})</>}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ({isID ? 'Opsional' : 'Optional'})
                    </span>
                  )}
                </span>
                <span style={{ marginLeft:'auto' }}>
                  {showOptionalDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </button>

              {showOptionalDetails && (
                <div style={{ marginTop: '15px', padding: '20px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px solid var(--glass-border)', display:'grid', gap:'20px' }}>
                  <div className="grid-responsive-2" style={{ gap:'20px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', textTransform:'uppercase', fontWeight:'700', margin: 0 }}>{isID ? 'Pilih Karyawan' : 'Select Employee'}</label>
                        {otherExpenseForm.employeeName && otherExpenseForm.employeeName !== 'Umum' && (
                          <button
                            type="button"
                            onClick={() => {
                              setOtherExpenseForm({
                                ...otherExpenseForm,
                                employeeId: '',
                                employeeName: 'Umum',
                                position: 'Umum',
                                bankAccount: '-',
                                bankName: '-'
                              });
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--danger)',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              padding: 0,
                              textDecoration: 'underline',
                              fontWeight: '600'
                            }}
                          >
                            {isID ? 'Hapus Asosiasi Karyawan' : 'Remove Employee Association'}
                          </button>
                        )}
                      </div>
                      <select 
                        value={otherExpenseForm.employeeId || ''} 
                        onChange={e => {
                          const emp = employees.find(emp => emp.id === e.target.value);
                          if (emp) {
                            setOtherExpenseForm({
                              ...otherExpenseForm,
                              employeeId: emp.id,
                              employeeName: emp.name,
                              position: emp.position,
                              bankAccount: emp.accountNumber || emp.bankAccount || '',
                              bankName: emp.bankName || ''
                            });
                          } else {
                            setOtherExpenseForm({
                              ...otherExpenseForm,
                              employeeId: '',
                              employeeName: 'Umum',
                              position: 'Umum',
                              bankAccount: '-',
                              bankName: '-'
                            });
                          }
                        }} 
                        style={{ width:'100%', padding:'10px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)' }}
                      >
                        <option value="" style={{ background: 'var(--bg)', color: 'var(--text)' }}>{isID ? 'Umum (Tanpa Karyawan / Kosongkan)' : 'General (No Employee / Leave Blank)'}</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id} style={{ background: 'var(--bg)', color: 'var(--text)' }}>{emp.name} ({emp.position})</option>
                        ))}
                        {otherExpenseForm.employeeName && otherExpenseForm.employeeName !== 'Umum' && !employees.some(emp => emp.id === otherExpenseForm.employeeId) && (
                          <option value={otherExpenseForm.employeeId || "legacy-unmatched"} disabled style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>
                            {otherExpenseForm.employeeName} ({otherExpenseForm.position || (isID ? 'Karyawan' : 'Employee')}) [{isID ? 'Legacy / Tidak Terdaftar' : 'Legacy / Unlisted'}]
                          </option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>{isID ? 'Jabatan' : 'Position'}</label>
                      <div style={{ width:'100%', padding:'10px 15px', background:'rgba(255,255,255,0.02)', border:'1px solid var(--border)', borderRadius:'8px', minHeight: '44px', display: 'flex', alignItems: 'center' }}>
                        {renderPositionTags(otherExpenseForm.position)}
                      </div>
                    </div>
                  </div>

                  <div className="grid-responsive-2" style={{ gap:'20px' }}>
                    <div>
                      <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>{isID ? 'Nomor Rekening' : 'Account Number'}</label>
                      <input type="text" value={otherExpenseForm.bankAccount || ''} onChange={e => setOtherExpenseForm({...otherExpenseForm, bankAccount: e.target.value})} style={{ width:'100%', padding:'10px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)' }} />
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>{isID ? 'Nama Bank' : 'Bank Name'}</label>
                      <input type="text" value={otherExpenseForm.bankName || ''} onChange={e => setOtherExpenseForm({...otherExpenseForm, bankName: e.target.value})} style={{ width:'100%', padding:'10px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div style={{ marginBottom:'20px' }}>
              <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>{isID ? 'Deskripsi Transaksi' : 'Transaction Description'}</label>
              <textarea value={otherExpenseForm.descriptionText || ''} onChange={e => setOtherExpenseForm({...otherExpenseForm, descriptionText: e.target.value})} style={{ width:'100%', padding:'10px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)', minHeight:'80px' }} />
            </div>

            {/* Amount and Date */}
            <div className="grid-responsive-2" style={{ gap:'20px', marginBottom:'20px' }}>
              <div>
                <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>{isID ? 'Nominal (Rp)' : 'Amount (IDR)'}</label>
                <input type="number" step="any" value={otherExpenseForm.amount || ''} onChange={e => setOtherExpenseForm({...otherExpenseForm, amount: e.target.value})} style={{ width:'100%', padding:'10px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)', fontWeight:'700' }} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>{isID ? 'Tanggal Transaksi' : 'Transaction Date'}</label>
                <input type="date" value={otherExpenseForm.expenseDate || ''} onChange={e => setOtherExpenseForm({...otherExpenseForm, expenseDate: e.target.value})} style={{ width:'100%', padding:'10px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)' }} />
              </div>
            </div>

            {/* Tax Deductions */}
            <div style={{ marginBottom:'25px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                <label style={{ fontSize:'0.75rem', color:'var(--text-muted)', textTransform:'uppercase', fontWeight:'700' }}>{isID ? 'Potongan Pajak / Lainnya' : 'Tax / Other Deductions'}</label>
                <button onClick={() => setOtherExpenseForm({...otherExpenseForm, taxes: [...(otherExpenseForm.taxes || []), { name: '', amount: 0 }]})} style={{ background:'rgba(236,72,153,0.1)', color:'#ec4899', border:'1px solid #ec4899', borderRadius:'6px', padding:'4px 10px', fontSize:'0.7rem', cursor:'pointer' }}>{isID ? '+ Tambah Potongan' : '+ Add Deduction'}</button>
              </div>
              {(otherExpenseForm.taxes || []).map((tax, idx) => (
                <div key={idx} style={{ display:'grid', gridTemplateColumns:'1fr 120px 32px', gap:'10px', marginBottom:'8px' }}>
                  <input type="text" placeholder={isID ? 'Deskripsi Potongan' : 'Deduction Description'} value={tax.name} onChange={e => { const n=[...otherExpenseForm.taxes]; n[idx].name=e.target.value; setOtherExpenseForm({...otherExpenseForm, taxes:n}); }} style={{ padding:'8px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'6px', color:'var(--text)', fontSize:'0.85rem' }} />
                  <input type="number" step="any" placeholder={isID ? 'Nominal' : 'Amount'} value={tax.amount} onChange={e => { const n=[...otherExpenseForm.taxes]; n[idx].amount=e.target.value; setOtherExpenseForm({...otherExpenseForm, taxes:n}); }} style={{ padding:'8px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'6px', color:'var(--text)', fontSize:'0.85rem' }} />
                  <button onClick={() => setOtherExpenseForm({...otherExpenseForm, taxes: otherExpenseForm.taxes.filter((_,i)=>i!==idx)})} style={{ background:'var(--danger-bg)', color:'var(--danger)', border:'none', borderRadius:'6px', cursor:'pointer' }}><X size={14}/></button>
                </div>
              ))}
            </div>

            {/* Photo upload */}
            <div style={{ marginBottom:'30px' }}>
              <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>{isID ? 'Upload Bukti Transaksi / Nota' : 'Upload Transaction Proof / Receipt'}</label>
              <input type="file" onChange={e => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setOtherExpenseForm({...otherExpenseForm, proofPhoto: reader.result});
                  reader.readAsDataURL(file);
                }
              }} style={{ width:'100%', fontSize:'0.8rem', color:'var(--text-muted)' }} />
            </div>

            {/* Total calculation panel */}
            <div style={{
              background: otherExpenseForm.type === 'income' ? 'var(--success-bg)' : 'rgba(236,72,153,0.05)',
              padding:'20px', borderRadius:'15px',
              border: otherExpenseForm.type === 'income' ? '1px solid var(--success)' : '1px solid #ec4899',
              marginBottom:'30px', textAlign:'right'
            }}>
              <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginBottom:'5px' }}>
                {otherExpenseForm.type === 'income' ? (isID ? 'Total Pendapatan Bersih (Setelah Potongan)' : 'Total Net Income (After Deductions)') : (isID ? 'Total Pengeluaran Bersih (Setelah Pajak)' : 'Total Net Expense (After Taxes)')}
              </div>
              <div style={{ fontSize:'1.8rem', fontWeight:'900', color: otherExpenseForm.type === 'income' ? 'var(--success)' : '#ec4899' }}>
                Rp {(parseFloat(otherExpenseForm.amount || 0) - (otherExpenseForm.taxes || []).reduce((acc, t) => acc + parseFloat(t.amount || 0), 0)).toLocaleString(isID ? 'id-ID' : 'en-US')}
              </div>
            </div>

            <ButtonWithLoading className="btn btn-primary" style={{ width:'100%', padding:'15px', background: otherExpenseForm.type === 'income' ? 'var(--success)' : '#ec4899' }} onClick={handleSaveOtherTransaction}>
              {otherExpenseForm.id ? (isID ? '💾 Perbarui Transaksi' : '💾 Update Transaction') : (isID ? '💾 Simpan Transaksi' : '💾 Save Transaction')}
            </ButtonWithLoading>
          </div>
        </div>
      )}


      {/* Salary Slip Print View */}
      {salarySlip && (
        <div style={{ position:'fixed', inset:0, background:'white', zIndex:30000, color:'black', padding:'40px', overflowY:'auto' }}>
          <div className="no-print" style={{ display:'flex', justifyContent:'space-between', marginBottom:'30px', background:'#f8fafc', padding:'15px', borderRadius:'12px', border:'1px solid #e2e8f0' }}>
             <div style={{ display:'flex', alignItems:'center', gap:'10px', color:'#64748b' }}>
               <FileText size={20}/>
               <span style={{ fontWeight:'600' }}>{isID ? 'Pratinjau Slip Gaji' : 'Salary Slip Preview'}: {salarySlip.name} - {salarySlip.period}</span>
             </div>
             <div style={{ display:'flex', gap:'10px' }}>
               <button className="btn" style={{ background:'white', border:'1px solid #cbd5e1', color:'#334155' }} onClick={() => setSalarySlip(null)}>{isID ? 'Tutup Pratinjau' : 'Close Preview'}</button>
               <button className="btn btn-primary" onClick={() => window.print()}>{isID ? 'Cetak / Simpan PDF' : 'Print / Save PDF'}</button>
             </div>
          </div>

          <div style={{ maxWidth:'800px', margin:'0 auto', border:'2px solid #333', padding:'40px', background:'white' }}>
            <div style={{ display:'flex', justifyContent:'space-between', borderBottom:'4px solid #333', paddingBottom:'20px', marginBottom:'30px' }}>
              <div>
                <h1 style={{ margin:0, fontSize:'1.8rem', letterSpacing:'1px' }}>{isID ? 'SLIP GAJI KARYAWAN' : 'EMPLOYEE SALARY SLIP'}</h1>
                <div style={{ color:'#666', marginTop:'5px' }}>{isID ? 'Nomor Ref' : 'Ref Number'}: {salarySlip.id}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontWeight:'900', fontSize:'1.2rem' }}>PT. ALPHA LOGISTICS PRAKARSA</div>
                <div style={{ fontSize:'0.85rem', color:'#444' }}>Logistics & Transportation Excellence</div>
                <div style={{ marginTop:'10px', fontWeight:'700' }}>{isID ? 'Periode' : 'Period'}: {salarySlip.period}</div>
              </div>
            </div>

            <div className="grid-responsive-2" style={{ gap:'40px', marginBottom:'40px', background:'#f9f9f9', padding:'20px', border:'1px solid #eee' }}>
               <div>
                 <div style={{ fontSize:'0.75rem', color:'#888', textTransform:'uppercase', marginBottom:'5px' }}>{isID ? 'Informasi Karyawan:' : 'Employee Information:'}</div>
                 <div style={{ fontWeight:'800', fontSize:'1.2rem' }}>{salarySlip.name}</div>
                 <div style={{ fontSize:'1rem', color:'#333', display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {salarySlip.position ? salarySlip.position.split(',').map((p, idx) => (
                      <span key={idx} style={{ background: '#e2e8f0', color: '#1e293b', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>
                        {p.trim()}
                      </span>
                    )) : '-'}
                  </div>
                 <div style={{ marginTop:'10px', fontSize:'0.85rem' }}>NIK: {salarySlip.nik || '-'}</div>
                 <div style={{ fontSize:'0.85rem' }}>NPWP: {salarySlip.npwp || '-'}</div>
               </div>
               <div style={{ textAlign:'right' }}>
                 <div style={{ fontSize:'0.75rem', color:'#888', textTransform:'uppercase', marginBottom:'5px' }}>{isID ? 'Informasi Pembayaran:' : 'Payment Information:'}</div>
                 <div style={{ fontWeight:'700' }}>{salarySlip.bankName}</div>
                 <div style={{ fontSize:'1.1rem', letterSpacing:'1px' }}>{salarySlip.bankAccount}</div>
                 <div style={{ marginTop:'10px', fontSize:'0.85rem' }}>{isID ? 'Tanggal Bayar' : 'Payment Date'}: {new Date(salarySlip.expenseDate).toLocaleDateString(isID ? 'id-ID' : 'en-US', {day:'numeric', month:'long', year:'numeric'})}</div>
               </div>
            </div>

            <div className="grid-responsive-2" style={{ gap:'30px' }}>
               {/* Earnings */}
               <div>
                 <h4 style={{ borderBottom:'2px solid #333', paddingBottom:'8px', marginBottom:'15px' }}>{isID ? 'PENGHASILAN' : 'EARNINGS'}</h4>
                 <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
                   <span>{isID ? 'Gaji Pokok' : 'Base Salary'}</span>
                   <span style={{ fontWeight:'600' }}>Rp {parseFloat(salarySlip.baseSalary).toLocaleString(isID ? 'id-ID' : 'en-US')}</span>
                 </div>
                 <div style={{ borderTop:'1px solid #eee', paddingTop:'10px', marginTop:'20px', display:'flex', justifyContent:'space-between', fontWeight:'800' }}>
                   <span>{isID ? 'Total Penghasilan' : 'Total Earnings'}</span>
                   <span>Rp {parseFloat(salarySlip.baseSalary).toLocaleString(isID ? 'id-ID' : 'en-US')}</span>
                 </div>
               </div>

               {/* Deductions */}
               <div>
                 <h4 style={{ borderBottom:'2px solid var(--danger)', paddingBottom:'8px', marginBottom:'15px' }}>{isID ? 'POTONGAN' : 'DEDUCTIONS'}</h4>
                 {salarySlip.taxes.map((t, idx) => (
                   <div key={idx} style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
                     <span>{t.name}</span>
                     <span style={{ color:'var(--danger)' }}>- Rp {parseFloat(t.amount).toLocaleString(isID ? 'id-ID' : 'en-US')}</span>
                   </div>
                 ))}
                 {salarySlip.taxes.length === 0 && <div style={{ color:'#888', fontStyle:'italic', fontSize:'0.85rem' }}>{isID ? 'Tidak ada potongan.' : 'No deductions.'}</div>}
                 
                 <div style={{ borderTop:'1px solid #eee', paddingTop:'10px', marginTop:'20px', display:'flex', justifyContent:'space-between', fontWeight:'800' }}>
                   <span>{isID ? 'Total Potongan' : 'Total Deductions'}</span>
                   <span style={{ color:'var(--danger)' }}>Rp {salarySlip.taxes.reduce((acc, t) => acc + parseFloat(t.amount), 0).toLocaleString(isID ? 'id-ID' : 'en-US')}</span>
                 </div>
               </div>
            </div>

            <div style={{ marginTop:'50px', background:'#333', color:'white', padding:'25px', display:'flex', justifyContent:'space-between', alignItems:'center', borderRadius:'4px' }}>
               <div style={{ fontSize:'0.9rem', fontWeight:'600', textTransform:'uppercase' }}>{isID ? 'Take Home Pay (Total Diterima)' : 'Take Home Pay (Total Received)'}</div>
               <div style={{ fontSize:'2rem', fontWeight:'900', letterSpacing:'1px' }}>Rp {parseFloat(salarySlip.totalToPay).toLocaleString(isID ? 'id-ID' : 'en-US')}</div>
            </div>

            <div style={{ marginTop:'60px', display:'flex', justifyContent:'space-between' }}>
               <div style={{ textAlign:'center', width:'200px' }}>
                 <div style={{ fontSize:'0.85rem', marginBottom:'80px' }}>{isID ? 'Dibuat Oleh,' : 'Prepared By,'}</div>
                 <div style={{ borderBottom:'1px solid #333', fontWeight:'700' }}>{isID ? 'Bagian Keuangan' : 'Finance Department'}</div>
                 <div style={{ fontSize:'0.75rem', color:'#666' }}>PT. Alpha Logistics Prakarsa</div>
               </div>
               <div style={{ textAlign:'center', width:'200px' }}>
                 <div style={{ fontSize:'0.85rem', marginBottom:'80px' }}>{isID ? 'Diterima Oleh,' : 'Received By,'}</div>
                 <div style={{ borderBottom:'1px solid #333', fontWeight:'700' }}>{salarySlip.name}</div>
                 <div style={{ fontSize:'0.75rem', color:'#666' }}>{isID ? 'Karyawan' : 'Employee'}</div>
               </div>
            </div>

            <div style={{ marginTop:'40px', fontSize:'0.7rem', color:'#999', textAlign:'center', borderTop:'1px dashed #ccc', paddingTop:'15px' }}>
              {isID ? 'Dokumen ini diterbitkan secara elektronik melalui PT. Alpha Logistics Prakarsa dan sah tanpa tanda tangan basah.' : 'This document is electronically issued by PT. Alpha Logistics Prakarsa and is valid without a physical signature.'}
            </div>
          </div>
        </div>
      )}

      {/* Vendor Invoice Modal */}
      {vendorInvoiceModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
          <div className="glass-card" style={{ width:'100%', maxWidth:'600px', padding:'35px', textAlign:'center', maxHeight:'90vh', overflowY:'auto' }}>
            <button onClick={() => { setVendorInvoiceModal(null); setModalPhotos([]); }} style={{ position:'absolute', top:'15px', right:'15px', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}><X size={20}/></button>
            <h3 style={{ color:'var(--secondary)', marginBottom:'20px' }}>{isID ? 'Unggah Invoice Vendor' : 'Upload Vendor Invoice'}</h3>
            <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', marginBottom:'25px' }}>PO: <strong>{vendorInvoiceModal.id}</strong> - {vendorInvoiceModal.vendorName}</p>
            
            {/* Preview Section */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(100px, 1fr))', gap:'10px', marginBottom:'25px' }}>
              {modalPhotos.map((p, i) => (
                <div key={i} style={{ position:'relative', height:'100px', borderRadius:'8px', overflow:'hidden', border:'1px solid var(--glass-border)' }}>
                  <img src={p} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  <button onClick={() => setModalPhotos(prev => prev.filter((_, idx) => idx !== i))} style={{ position:'absolute', top:'5px', right:'5px', background:'rgba(239,68,68,0.8)', color:'white', border:'none', borderRadius:'50%', width:'20px', height:'20px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={12}/></button>
                </div>
              ))}
              <label htmlFor="vendor-inv-upload" style={{ height:'100px', borderRadius:'8px', border:'2px dashed var(--glass-border)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-muted)', transition:'all 0.3s' }} onMouseOver={e=>e.currentTarget.style.borderColor='var(--secondary)'} onMouseOut={e=>e.currentTarget.style.borderColor='var(--glass-border)'}>
                <Plus size={24}/>
                <span style={{ fontSize:'0.7rem', marginTop:'5px' }}>{isID ? 'Tambah Foto' : 'Add Photo'}</span>
              </label>
            </div>

            <input type="file" multiple onChange={e => {
              const files = Array.from(e.target.files);
              files.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => setModalPhotos(prev => [...prev, reader.result]);
                reader.readAsDataURL(file);
              });
            }} style={{ display:'none' }} id="vendor-inv-upload" />
            <div style={{ display:'flex', gap:'10px', justifyContent:'center' }}>
              <button onClick={() => { setVendorInvoiceModal(null); setModalPhotos([]); }} className="btn" style={{ background:'rgba(255,255,255,0.05)', color:'var(--text)' }}>{isID ? 'Batal' : 'Cancel'}</button>
              <ButtonWithLoading onClick={() => handleUploadVendorInvoice(vendorInvoiceModal.id, modalPhotos)} className="btn btn-gold" disabled={modalPhotos.length === 0}>
                {isID ? 'Simpan' : 'Save'} {modalPhotos.length > 0 && `(${modalPhotos.length})`} {isID ? 'Foto' : 'Photos'}
              </ButtonWithLoading>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Payment Proof Modal (Payable) */}
      {settlePayableModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
          <div className="glass-card" style={{ width:'100%', maxWidth:'650px', padding:'35px', position:'relative', maxHeight:'90vh', overflowY:'auto' }}>
            <button onClick={() => setSettlePayableModal(null)} style={{ position:'absolute', top:'15px', right:'15px', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}><X size={20}/></button>
            <h3 style={{ color:'var(--secondary)', marginBottom:'20px', display:'flex', alignItems:'center', gap:'10px' }}><CheckCircle size={24}/> {isID ? 'Pelunasan Pembayaran Vendor' : 'Settle Vendor Payment'}</h3>
            <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', marginBottom:'25px' }}>{isID ? 'Konfirmasi pembayaran untuk' : 'Confirm payment for'} <strong>{settlePayableModal.vendorName}</strong> {isID ? 'sejumlah' : 'amounting to'} <strong>Rp {settlePayableModal.grandTotal.toLocaleString(isID ? 'id-ID' : 'en-US')}</strong></p>
            
            {/* Payment Proof Section */}
            <div style={{ marginBottom:'25px', padding:'20px', background:'rgba(255,255,255,0.02)', borderRadius:'12px', border:'1px solid var(--glass-border)' }}>
              <label style={{ display:'block', fontSize:'0.75rem', color:'var(--secondary)', marginBottom:'12px', textTransform:'uppercase', fontWeight:'800', letterSpacing:'0.5px' }}>1. {isID ? 'Bukti Pembayaran' : 'Bukti Pembayaran (Payment Proof)'}</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px, 1fr))', gap:'10px', marginBottom:'15px' }}>
                {(settlePayableForm.paymentProof || []).map((p, i) => (
                  <div key={i} style={{ position:'relative', height:'80px', borderRadius:'8px', overflow:'hidden', border:'1px solid var(--glass-border)' }}>
                    <img src={p} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    <button onClick={() => setSettlePayableForm({...settlePayableForm, paymentProof: settlePayableForm.paymentProof.filter((_, idx) => idx !== i)})} style={{ position:'absolute', top:'3px', right:'3px', background:'rgba(239,68,68,0.8)', color:'white', border:'none', borderRadius:'50%', width:'18px', height:'18px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={10}/></button>
                  </div>
                ))}
                <label htmlFor="po-pay-proof" style={{ height:'80px', borderRadius:'8px', border:'2px dashed var(--glass-border)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-muted)' }}>
                  <Plus size={20}/>
                  <span style={{ fontSize:'0.6rem', marginTop:'3px' }}>{isID ? 'Unggah' : 'Upload'}</span>
                </label>
              </div>
              <input type="file" multiple id="po-pay-proof" style={{ display:'none' }} onChange={e => {
                const files = Array.from(e.target.files);
                files.forEach(file => {
                  const reader = new FileReader();
                  reader.onloadend = () => setSettlePayableForm(prev => ({ ...prev, paymentProof: [...prev.paymentProof, reader.result] }));
                  reader.readAsDataURL(file);
                });
              }} />
            </div>

            {/* Tax Deduction Section */}
            <div style={{ marginBottom:'25px', padding:'20px', background:'rgba(212,175,55,0.03)', borderRadius:'12px', border:'1px solid var(--secondary-bg)' }}>
              <label style={{ display:'block', fontSize:'0.75rem', color:'var(--secondary)', marginBottom:'15px', textTransform:'uppercase', fontWeight:'800', letterSpacing:'0.5px' }}>2. {isID ? 'Pemotongan Pajak (Opsional)' : 'Tax Deduction (Optional)'}</label>
              
              <div className="grid-responsive-2" style={{ gap:'15px' }}>
                <div>
                  <label style={{ display:'block', fontSize:'0.7rem', color:'var(--text-muted)', marginBottom:'5px' }}>{isID ? 'Nama Pajak (misal PPh 23)' : 'Tax Name (e.g. PPh 23)'}</label>
                  <input 
                    type="text" 
                    value={settlePayableForm.taxName} 
                    onChange={e => setSettlePayableForm({...settlePayableForm, taxName: e.target.value})}
                    placeholder={isID ? 'Nama Pajak' : 'Tax Name'}
                    style={{ width:'100%', padding:'10px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)', fontSize:'0.9rem' }}
                  />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'0.7rem', color:'var(--text-muted)', marginBottom:'5px' }}>{isID ? 'Nominal Pajak (Rp)' : 'Tax Amount (Rp)'}</label>
                  <input 
                    type="number" 
                    value={settlePayableForm.taxAmount} 
                    onChange={e => setSettlePayableForm({...settlePayableForm, taxAmount: e.target.value})}
                    placeholder="0"
                    style={{ width:'100%', padding:'10px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)', fontSize:'0.9rem', fontWeight:'700' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ background:'rgba(255,193,7,0.05)', padding:'20px', borderRadius:'15px', border:'1px solid var(--secondary)', marginBottom:'25px' }}>
               <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                  <span style={{ color:'var(--text-muted)' }}>{isID ? 'Total Invoice:' : 'Total Invoice:'}</span>
                  <span style={{ fontWeight:'700' }}>Rp {settlePayableModal.grandTotal.toLocaleString(isID ? 'id-ID' : 'en-US')}</span>
               </div>
               <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px', color:'var(--danger)' }}>
                  <span>{isID ? 'Potongan Pajak' : 'Tax Deduction'} ({settlePayableForm.taxName || (isID ? 'Pajak' : 'Tax')}):</span>
                  <span style={{ fontWeight:'700' }}>- Rp {(parseFloat(settlePayableForm.taxAmount) || 0).toLocaleString(isID ? 'id-ID' : 'en-US')}</span>
               </div>
               <div style={{ display:'flex', justifyContent:'space-between', paddingTop:'10px', borderTop:'1px solid var(--glass-border)', marginTop:'10px' }}>
                  <span style={{ fontWeight:'800', color:'var(--secondary)' }}>{isID ? 'TOTAL DIBAYAR (NET):' : 'TOTAL PAID (NET):'}</span>
                  <span style={{ fontWeight:'900', color:'var(--secondary)', fontSize:'1.2rem' }}>Rp {(settlePayableModal.grandTotal - (parseFloat(settlePayableForm.taxAmount) || 0)).toLocaleString(isID ? 'id-ID' : 'en-US')}</span>
               </div>
            </div>

            <div style={{ display:'flex', gap:'15px', justifyContent:'center' }}>
              <button onClick={() => setSettlePayableModal(null)} className="btn" style={{ flex:1, background:'rgba(255,255,255,0.05)', color:'var(--text)' }}>{isID ? 'Batal' : 'Cancel'}</button>
              <ButtonWithLoading 
                onClick={() => handleSettlePayable(settlePayableModal.id, { 
                  paymentProofPhoto: settlePayableForm.paymentProof,
                  tax_name: settlePayableForm.taxName,
                  tax_amount: parseFloat(settlePayableForm.taxAmount || 0),
                  tax_proof_photo: settlePayableForm.taxProof
                })} 
                className="btn btn-gold" 
                style={{ flex:2 }}
                disabled={!settlePayableModal}
              >
                {isID ? 'Simpan & Lunasi Pembayaran' : 'Save & Settle Payment'}
              </ButtonWithLoading>
            </div>
          </div>
        </div>
      )}

      {/* Financial Report PDF Preview */}
      {financialReport && (
        <div style={{ position:'fixed', inset:0, background:'white', zIndex:30000, color:'black', padding:'40px', overflowY:'auto' }}>
          <div className="no-print" style={{ display:'flex', justifyContent:'space-between', marginBottom:'30px', background:'#f8fafc', padding:'15px', borderRadius:'12px', border:'1px solid #e2e8f0' }}>
             <div style={{ display:'flex', alignItems:'center', gap:'10px', color:'#64748b' }}>
               <FileText size={20}/>
               <span style={{ fontWeight:'600' }}>{isID ? 'Pratinjau Laporan Keuangan Profesional' : 'Professional Financial Report Preview'}</span>
             </div>
             <div style={{ display:'flex', gap:'10px' }}>
               <button className="btn" style={{ background:'white', border:'1px solid #cbd5e1', color:'#334155' }} onClick={() => setFinancialReport(null)}>{isID ? 'Tutup' : 'Close'}</button>
               <button className="btn btn-primary" onClick={() => window.print()}>{isID ? 'Unduh / Simpan PDF' : 'Download / Save PDF'}</button>
             </div>
          </div>

          <div style={{ maxWidth:'1000px', margin:'0 auto', border:'1px solid #333', padding:'50px', background:'white' }}>
            <div style={{ display:'flex', justifyContent:'space-between', borderBottom:'4px solid #333', paddingBottom:'25px', marginBottom:'40px' }}>
              <div>
                <h1 style={{ margin:0, fontSize:'2.2rem', letterSpacing:'1px', fontWeight:'900' }}>{isID ? 'LAPORAN RINGKASAN KEUANGAN' : 'FINANCIAL SUMMARY REPORT'}</h1>
                <div style={{ color:'#666', marginTop:'5px', fontSize:'1rem' }}>{isID ? 'Periode' : 'Period'}: <strong>{financialReport.dateRange}</strong></div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontWeight:'900', fontSize:'1.4rem' }}>PT. ALPHA LOGISTICS PRAKARSA</div>
                <div style={{ fontSize:'0.9rem', color:'#444' }}>{isID ? 'Unggulan Logistik & Transportasi' : 'Logistics & Transportation Excellence'}</div>
                <div style={{ marginTop:'10px', fontSize:'0.8rem', color:'#888' }}>{isID ? 'Dibuat pada' : 'Generated on'}: {new Date().toLocaleString(isID ? 'id-ID' : 'en-US')}</div>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'20px', marginBottom:'40px' }}>
               <div style={{ background:'#f0fdf4', padding:'25px', borderRadius:'8px', border:'1px solid #bcf0da' }}>
                  <div style={{ fontSize:'0.8rem', color:'#065f46', textTransform:'uppercase', fontWeight:'700', marginBottom:'10px' }}>{isID ? 'Total Pendapatan' : 'Total Revenue'}</div>
                  <div style={{ fontSize:'1.6rem', fontWeight:'900', color:'#059669' }}>Rp {financialReport.revenue.toLocaleString(isID ? 'id-ID' : 'en-US')}</div>
               </div>
               <div style={{ background:'#fef2f2', padding:'25px', borderRadius:'8px', border:'1px solid #fecaca' }}>
                  <div style={{ fontSize:'0.8rem', color:'#991b1b', textTransform:'uppercase', fontWeight:'700', marginBottom:'10px' }}>{isID ? 'Total Pengeluaran' : 'Total Expenses'}</div>
                  <div style={{ fontSize:'1.6rem', fontWeight:'900', color:'#dc2626' }}>Rp {(financialReport.opCosts + financialReport.payroll + financialReport.misc).toLocaleString(isID ? 'id-ID' : 'en-US')}</div>
               </div>
               <div style={{ background:'#fffbeb', padding:'25px', borderRadius:'8px', border:'2px solid var(--warning)' }}>
                  <div style={{ fontSize:'0.8rem', color:'#92400e', textTransform:'uppercase', fontWeight:'700', marginBottom:'10px' }}>{isID ? 'Laba Bersih' : 'Net Profit'}</div>
                  {(() => {
                    const net = financialReport.revenue - (financialReport.opCosts + financialReport.payroll + financialReport.misc);
                    return <div style={{ fontSize:'1.6rem', fontWeight:'900', color: net >= 0 ? '#059669' : '#dc2626' }}>Rp {net.toLocaleString(isID ? 'id-ID' : 'en-US')}</div>;
                  })()}
               </div>
            </div>

            <h3 style={{ borderBottom:'2px solid #333', paddingBottom:'10px', marginBottom:'20px', fontSize:'1.2rem' }}>{isID ? 'Rincian Pengeluaran' : 'Expense Breakdown'}</h3>
            <div className="table-container"><table style={{ width:'100%', borderCollapse:'collapse', marginBottom:'40px' }}>
               <thead>
                 <tr style={{ background:'#f8fafc', textAlign:'left' }}>
                   <th style={{ padding:'15px', border:'1px solid #e2e8f0' }}>{isID ? 'Kategori' : 'Category'}</th>
                   <th style={{ padding:'15px', border:'1px solid #e2e8f0', textAlign:'right' }}>{isID ? 'Jumlah' : 'Amount'}</th>
                   <th style={{ padding:'15px', border:'1px solid #e2e8f0', textAlign:'right' }}>% {isID ? 'dari Pendapatan' : 'of Revenue'}</th>
                 </tr>
               </thead>
               <tbody>
                 <tr>
                   <td style={{ padding:'15px', border:'1px solid #e2e8f0', fontWeight:'600' }}>{isID ? 'Operasional (Purchase Order)' : 'Operational (Purchase Orders)'}</td>
                   <td style={{ padding:'15px', border:'1px solid #e2e8f0', textAlign:'right' }}>Rp {financialReport.opCosts.toLocaleString(isID ? 'id-ID' : 'en-US')}</td>
                   <td style={{ padding:'15px', border:'1px solid #e2e8f0', textAlign:'right' }}>{((financialReport.opCosts / (financialReport.revenue || 1)) * 100).toFixed(2)}%</td>
                 </tr>
                 <tr>
                   <td style={{ padding:'15px', border:'1px solid #e2e8f0', fontWeight:'600' }}>{isID ? 'Gaji & Payroll' : 'Payroll (Salaries)'}</td>
                   <td style={{ padding:'15px', border:'1px solid #e2e8f0', textAlign:'right' }}>Rp {financialReport.payroll.toLocaleString(isID ? 'id-ID' : 'en-US')}</td>
                   <td style={{ padding:'15px', border:'1px solid #e2e8f0', textAlign:'right' }}>{((financialReport.payroll / (financialReport.revenue || 1)) * 100).toFixed(2)}%</td>
                 </tr>
                 <tr>
                   <td style={{ padding:'15px', border:'1px solid #e2e8f0', fontWeight:'600' }}>{isID ? 'Pengeluaran Lain-lain' : 'Miscellaneous Expenses'}</td>
                   <td style={{ padding:'15px', border:'1px solid #e2e8f0', textAlign:'right' }}>Rp {financialReport.misc.toLocaleString(isID ? 'id-ID' : 'en-US')}</td>
                   <td style={{ padding:'15px', border:'1px solid #e2e8f0', textAlign:'right' }}>{((financialReport.misc / (financialReport.revenue || 1)) * 100).toFixed(2)}%</td>
                 </tr>
               </tbody>
               <tfoot>
                 <tr style={{ background:'#f1f5f9', fontWeight:'800' }}>
                   <td style={{ padding:'15px', border:'1px solid #e2e8f0' }}>{isID ? 'TOTAL PENGELUARAN' : 'TOTAL EXPENSES'}</td>
                   <td style={{ padding:'15px', border:'1px solid #e2e8f0', textAlign:'right' }}>Rp {(financialReport.opCosts + financialReport.payroll + financialReport.misc).toLocaleString(isID ? 'id-ID' : 'en-US')}</td>
                   <td style={{ padding:'15px', border:'1px solid #e2e8f0', textAlign:'right' }}>{(((financialReport.opCosts + financialReport.payroll + financialReport.misc) / (financialReport.revenue || 1)) * 100).toFixed(2)}%</td>
                 </tr>
               </tfoot>
            </table></div>

            <h3 style={{ borderBottom:'2px solid #333', paddingBottom:'10px', marginBottom:'20px', fontSize:'1.2rem' }}>{isID ? 'Log Transaksi Rinci' : 'Detailed Transaction Logs'}</h3>
            <div className="table-container"><table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.85rem' }}>
               <thead>
                 <tr style={{ background:'#f8fafc', textAlign:'left' }}>
                   <th style={{ padding:'10px', border:'1px solid #e2e8f0' }}>{isID ? 'Tanggal' : 'Date'}</th>
                   <th style={{ padding:'10px', border:'1px solid #e2e8f0' }}>{isID ? 'Deskripsi' : 'Description'}</th>
                   <th style={{ padding:'10px', border:'1px solid #e2e8f0' }}>{isID ? 'Kategori' : 'Category'}</th>
                   <th style={{ padding:'10px', border:'1px solid #e2e8f0', textAlign:'right' }}>{isID ? 'Jumlah' : 'Amount'}</th>
                 </tr>
               </thead>
               <tbody>
                 {(() => {
                   const logs = [
                      ...invoices.filter(i => filterByDate(i.date)).map(i => ({ date: i.date, desc: `${isID ? 'Tagihan' : 'Invoice'}: ${i.id} (${i.customerName})`, cat: isID ? 'PENDAPATAN' : 'REVENUE', amt: parseFloat(i.amount||0) })),
                      ...purchaseOrders.filter(p => filterByDate(p.date)).map(p => ({ date: p.date, desc: `PO: ${p.id} (${p.vendorName})`, cat: isID ? 'BIAYA OPERASIONAL' : 'OP COST', amt: -parseFloat(p.grandTotal||0) })),
                      ...salaries.filter(s => filterByDate(s.expenseDate || s.date)).map(s => ({ date: s.expenseDate || s.date, desc: `Payroll: ${s.name}`, cat: isID ? 'GAJI / PAYROLL' : 'PAYROLL', amt: -parseFloat(s.totalToPay||0) })),
                      ...enrichedOtherTransactions.filter(e => filterByDate(e.expenseDate || e.date)).map(e => {
                        const isIncome = e.type === 'income';
                        return {
                          date: e.expenseDate || e.date,
                          desc: (() => {
                            let cbText = '';
                            if (e.companyBankAccountId === 'CUSTOM' && e.customSourceTarget) {
                              cbText = ` [${e.customSourceTarget}]`;
                            } else {
                              const cb = companyBankAccounts.find(b => b.id === e.companyBankAccountId);
                              if (cb) cbText = ` [${cb.bankName}]`;
                            }
                            return `${isIncome ? (isID ? 'Pemasukan Lain' : 'Other Income') : (isID ? 'Lain-lain' : 'Misc')}: ${e.description} (${e.employeeName || (isID ? 'Umum' : 'General')})${cbText}`;
                          })(),
                          cat: isIncome ? (isID ? 'PEMASUKAN LAIN' : 'OTHER INCOME') : ((isID ? (e.category || 'PENGELUARAN') : (e.category || 'EXPENSE')) + (e.subcategory ? ` - ${e.subcategory}` : '')).toUpperCase(),
                          amt: isIncome ? parseFloat(e.totalAfterTax || e.amount || 0) : -parseFloat(e.totalAfterTax || 0)
                        };
                      }),
                      ...reimbursementsList.filter(r => r.status === 'paid' && filterByDate(r.expenseDate || r.date)).map(r => {
                        let cbText = '';
                        if (r.companyBankAccountId === 'CUSTOM' && r.customSourceTarget) cbText = ` [${r.customSourceTarget}]`;
                        else {
                          const cb = companyBankAccounts.find(b => b.id === r.companyBankAccountId);
                          if (cb) cbText = ` [${cb.bankName}]`;
                        }
                        return {
                          date: r.expenseDate || r.date,
                          desc: `Reimbursement: ${r.employeeName}${cbText}`,
                          cat: 'REIMBURSEMENT',
                          amt: -parseFloat(r.totalAfterTax || r.amount || 0)
                        };
                      })
                    ].sort((a, b) => new Date(b.date) - new Date(a.date));

                   return logs.length > 0 ? logs.slice(0, 50).map((log, idx) => (
                     <tr key={idx}>
                       <td style={{ padding:'10px', border:'1px solid #e2e8f0' }}>{new Date(log.date).toLocaleDateString(isID ? 'id-ID' : 'en-US')}</td>
                       <td style={{ padding:'10px', border:'1px solid #e2e8f0', fontWeight:'600' }}>{log.desc}</td>
                       <td style={{ padding:'10px', border:'1px solid #e2e8f0' }}>{log.cat}</td>
                       <td style={{ padding:'10px', border:'1px solid #e2e8f0', textAlign:'right', fontWeight:'700', color: log.amt >= 0 ? '#059669' : '#dc2626' }}>
                         {log.amt >= 0 ? '+' : '-'} Rp {Math.abs(log.amt).toLocaleString(isID ? 'id-ID' : 'en-US')}
                       </td>
                     </tr>
                   )) : <tr><td colSpan="4" style={{ padding:'20px', textAlign:'center' }}>{isID ? 'Tidak ada transaksi ditemukan pada periode ini.' : 'No transactions found in this period.'}</td></tr>;
                 })()}
               </tbody>
            </table></div>
            
            <div style={{ marginTop:'60px', display:'flex', justifyContent:'space-between' }}>
               <div style={{ textAlign:'center', width:'250px' }}>
                 <div style={{ fontSize:'0.9rem', marginBottom:'80px' }}>{isID ? 'Auditor Keuangan,' : 'Financial Auditor,'}</div>
                 <div style={{ borderBottom:'2px solid #333', fontWeight:'800' }}>{isID ? 'Departemen Keuangan' : 'Finance Department'}</div>
                 <div style={{ fontSize:'0.75rem', color:'#666', marginTop:'5px' }}>PT. ALPHA LOGISTICS PRAKARSA System</div>
               </div>
               <div style={{ textAlign:'center', width:'250px' }}>
                 <div style={{ fontSize:'0.9rem', marginBottom:'80px' }}>{isID ? 'Disetujui Oleh,' : 'Approved By,'}</div>
                 <div style={{ borderBottom:'2px solid #333', fontWeight:'800' }}>{isID ? 'Manajer Operasional' : 'Operations Manager'}</div>
                 <div style={{ fontSize:'0.75rem', color:'#666', marginTop:'5px' }}>PT. ALPHA LOGISTICS PRAKARSA System</div>
               </div>
            </div>

            <div style={{ marginTop:'50px', borderTop:'1px dashed #ccc', paddingTop:'20px', textAlign:'center', color:'#999', fontSize:'0.7rem' }}>
               {isID ? 'Rahasia - Hanya untuk Penggunaan Internal. Dokumen ini dibuat secara elektronik dan diverifikasi oleh Sistem PT. Alpha Logistics Prakarsa.' : 'Confidential - For Internal Use Only. This document is electronically generated and verified by the PT. Alpha Logistics Prakarsa System.'}
            </div>
          </div>
        </div>
      )}

      {/* Receivable Proof Modal */}
      {receivableProofModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
          <div className="glass-card" style={{ width:'100%', maxWidth:'600px', padding:'35px', textAlign:'center', maxHeight:'90vh', overflowY:'auto' }}>
            <button onClick={() => { setReceivableProofModal(null); setModalPhotos([]); setModalTaxPhotos([]); }} style={{ position:'absolute', top:'15px', right:'15px', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}><X size={20}/></button>
            <h3 style={{ color:'var(--success)', marginBottom:'20px' }}>{isID ? 'Unggah Bukti Pembayaran & Pajak' : 'Upload Payment & Tax Proof'}</h3>
            <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', marginBottom:'25px' }}>Invoice: <strong>{receivableProofModal.id}</strong> - {receivableProofModal.customerName}</p>
            
            {/* Payment Proof Section */}
            <div style={{ marginBottom:'25px', textAlign:'left' }}>
              <label style={{ display:'block', fontSize:'0.75rem', color:'var(--secondary)', marginBottom:'10px', textTransform:'uppercase', fontWeight:'800' }}>1. {isID ? 'Bukti Pembayaran' : 'Bukti Pembayaran (Payment Proof)'}</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(100px, 1fr))', gap:'10px', marginBottom:'15px' }}>
                {modalPhotos.map((p, i) => (
                  <div key={i} style={{ position:'relative', height:'100px', borderRadius:'8px', overflow:'hidden', border:'1px solid var(--glass-border)' }}>
                    <img src={p} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    <button onClick={() => setModalPhotos(prev => prev.filter((_, idx) => idx !== i))} style={{ position:'absolute', top:'5px', right:'5px', background:'rgba(239,68,68,0.8)', color:'white', border:'none', borderRadius:'50%', width:'20px', height:'20px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={12}/></button>
                  </div>
                ))}
                <label htmlFor="rec-proof-upload" style={{ height:'100px', borderRadius:'8px', border:'2px dashed var(--glass-border)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-muted)' }}>
                  <Plus size={24}/>
                  <span style={{ fontSize:'0.7rem', marginTop:'5px' }}>{isID ? 'Tambah Foto' : 'Add Photo'}</span>
                </label>
              </div>
              <input type="file" multiple onChange={e => {
                const files = Array.from(e.target.files);
                files.forEach(file => {
                  const reader = new FileReader();
                  reader.onloadend = () => setModalPhotos(prev => [...prev, reader.result]);
                  reader.readAsDataURL(file);
                });
              }} style={{ display:'none' }} id="rec-proof-upload" />
            </div>

            {/* Tax Proof Section */}
            <div style={{ marginBottom:'30px', textAlign:'left' }}>
              <label style={{ display:'block', fontSize:'0.75rem', color:'#8b5cf6', marginBottom:'10px', textTransform:'uppercase', fontWeight:'800' }}>2. {isID ? 'Bukti Potong Pajak' : 'Bukti Potong Pajak (Tax Proof)'}</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(100px, 1fr))', gap:'10px', marginBottom:'15px' }}>
                {modalTaxPhotos.map((p, i) => (
                  <div key={i} style={{ position:'relative', height:'100px', borderRadius:'8px', overflow:'hidden', border:'1px solid var(--glass-border)' }}>
                    <img src={p} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    <button onClick={() => setModalTaxPhotos(prev => prev.filter((_, idx) => idx !== i))} style={{ position:'absolute', top:'5px', right:'5px', background:'rgba(239,68,68,0.8)', color:'white', border:'none', borderRadius:'50%', width:'20px', height:'20px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={12}/></button>
                  </div>
                ))}
                <label htmlFor="rec-tax-upload" style={{ height:'100px', borderRadius:'8px', border:'2px dashed var(--glass-border)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-muted)' }}>
                  <ShieldCheck size={24}/>
                  <span style={{ fontSize:'0.7rem', marginTop:'5px' }}>{isID ? 'Tambah Bukti Pajak' : 'Add Tax Proof'}</span>
                </label>
              </div>
              <input type="file" multiple onChange={e => {
                const files = Array.from(e.target.files);
                files.forEach(file => {
                  const reader = new FileReader();
                  reader.onloadend = () => setModalTaxPhotos(prev => [...prev, reader.result]);
                  reader.readAsDataURL(file);
                });
              }} style={{ display:'none' }} id="rec-tax-upload" />
            </div>
            
            <div style={{ display:'flex', gap:'10px', justifyContent:'center' }}>
              <button onClick={() => { setReceivableProofModal(null); setModalPhotos([]); setModalTaxPhotos([]); }} className="btn">{isID ? 'Batal' : 'Cancel'}</button>
              <ButtonWithLoading onClick={() => handleUploadReceivableProof(receivableProofModal.id, modalPhotos, modalTaxPhotos)} className="btn btn-gold" style={{ flex: 1 }}>{isID ? 'Simpan Dokumen' : 'Save Documents'}</ButtonWithLoading>
            </div>
          </div>
        </div>
      )}

      {/* Settle Modal with Tax Deduction */}
      {settleModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:10005, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
          <div className="glass-card" style={{ width:'100%', maxWidth:'550px', padding:'35px', position:'relative' }}>
            <button onClick={() => setSettleModal(null)} style={{ position:'absolute', top:'15px', right:'15px', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}><X size={20}/></button>
            <h3 style={{ color:'var(--secondary)', marginBottom:'20px', display:'flex', alignItems:'center', gap:'10px' }}><CheckCircle size={24}/> {isID ? 'Pelunasan Pembayaran Invoice' : 'Settle Invoice Payment'}</h3>
            <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', marginBottom:'25px' }}>Invoice: <strong>{settleModal.id}</strong> - {settleModal.customerName}</p>
            
            <div style={{ marginBottom:'20px' }}>
              <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>
                {isID ? 'Tanggal Pembayaran' : 'Payment Date'}
              </label>
              <input 
                type="date"
                required
                value={settleForm.paymentDate || ''}
                onChange={e => setSettleForm({...settleForm, paymentDate: e.target.value})}
                style={{ 
                  padding:'10px', 
                  background:'var(--input-bg)', 
                  border:'1px solid var(--border)', 
                  borderRadius:'8px', 
                  color:'var(--text)', 
                  fontSize:'0.9rem',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom:'20px' }}>
              <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>{isID ? 'Bukti Pembayaran' : 'Bukti Pembayaran (Payment Proof)'}</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(70px, 1fr))', gap:'10px', marginBottom:'10px' }}>
                {(settleForm.paymentProof || []).map((p, i) => (
                  <div key={i} style={{ position:'relative', height:'70px', borderRadius:'8px', overflow:'hidden', border:'1px solid var(--glass-border)' }}>
                    <img src={p} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    <button onClick={() => setSettleForm({...settleForm, paymentProof: settleForm.paymentProof.filter((_, idx) => idx !== i)})} style={{ position:'absolute', top:'2px', right:'2px', background:'rgba(239,68,68,0.8)', color:'white', border:'none', borderRadius:'50%', width:'18px', height:'18px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={10}/></button>
                  </div>
                ))}
                <label style={{ height:'70px', borderRadius:'8px', border:'2px dashed var(--glass-border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                  <Plus size={20} color="var(--text-muted)"/>
                  <input type="file" multiple style={{ display:'none' }} onChange={e => {
                    const files = Array.from(e.target.files);
                    files.forEach(file => {
                      const reader = new FileReader();
                      reader.onloadend = () => setSettleForm(prev => ({...prev, paymentProof: [...prev.paymentProof, reader.result]}));
                      reader.readAsDataURL(file);
                    });
                  }} />
                </label>
              </div>
              <span style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{isID ? 'Unggah bukti transfer dari pelanggan' : 'Upload receipt(s) from customer'}</span>
            </div>

            <div style={{ marginBottom:'20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                <label style={{ fontSize:'0.75rem', color:'var(--text-muted)', textTransform:'uppercase', fontWeight:'700' }}>{isID ? 'Pemotongan Pajak (PPh 23 / Lainnya)' : 'Tax Deduction (PPh 23 / Others)'}</label>
                <button 
                  onClick={() => setSettleForm({...settleForm, taxes: [...settleForm.taxes, { name: '', amount: 0 }]})}
                  style={{ background:'rgba(255,193,7,0.1)', color:'var(--secondary)', border:'1px solid var(--secondary)', borderRadius:'6px', padding:'4px 10px', fontSize:'0.7rem', cursor:'pointer' }}
                >
                  + {isID ? 'Tambah Pajak' : 'Add Tax'}
                </button>
              </div>
              
              {settleForm.taxes.map((tax, idx) => (
                <div key={idx} style={{ display:'grid', gridTemplateColumns:'1fr 150px 32px', gap:'10px', marginBottom:'10px' }}>
                  <input 
                    type="text" 
                    placeholder={isID ? 'Jenis Pajak (misal PPh 23)' : 'Tax Type (e.g. PPh 23)'} 
                    value={tax.name} 
                    onChange={e => {
                      const newTaxes = [...settleForm.taxes];
                      newTaxes[idx].name = e.target.value;
                      setSettleForm({...settleForm, taxes: newTaxes});
                    }}
                    style={{ padding:'10px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)', fontSize:'0.9rem' }}
                  />
                  <input 
                    type="number" 
                    placeholder={isID ? 'Nominal' : 'Amount'} 
                    value={tax.amount} 
                    onChange={e => {
                      const newTaxes = [...settleForm.taxes];
                      newTaxes[idx].amount = e.target.value;
                      setSettleForm({...settleForm, taxes: newTaxes});
                    }}
                    style={{ padding:'10px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)', fontSize:'0.9rem', fontWeight:'700' }}
                  />
                  <button 
                    onClick={() => setSettleForm({...settleForm, taxes: settleForm.taxes.filter((_, i) => i !== idx)})}
                    style={{ background:'var(--danger-bg)', color:'var(--danger)', border:'none', borderRadius:'8px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
                  >
                    <X size={14}/>
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginBottom:'30px' }}>
              <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', fontWeight:'700' }}>{isID ? 'Bukti Potong Pajak' : 'Bukti Potong Pajak (Tax Proof)'}</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(70px, 1fr))', gap:'10px', marginBottom:'10px' }}>
                {(settleForm.taxProof || []).map((p, i) => (
                  <div key={i} style={{ position:'relative', height:'70px', borderRadius:'8px', overflow:'hidden', border:'1px solid var(--glass-border)' }}>
                    <img src={p} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    <button onClick={() => setSettleForm({...settleForm, taxProof: settleForm.taxProof.filter((_, idx) => idx !== i)})} style={{ position:'absolute', top:'2px', right:'2px', background:'rgba(239,68,68,0.8)', color:'white', border:'none', borderRadius:'50%', width:'18px', height:'18px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={10}/></button>
                  </div>
                ))}
                <label style={{ height:'70px', borderRadius:'8px', border:'2px dashed var(--glass-border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                  <ShieldCheck size={20} color="var(--text-muted)"/>
                  <input type="file" multiple style={{ display:'none' }} onChange={e => {
                    const files = Array.from(e.target.files);
                    files.forEach(file => {
                      const reader = new FileReader();
                      reader.onloadend = () => setSettleForm(prev => ({...prev, taxProof: [...prev.taxProof, reader.result]}));
                      reader.readAsDataURL(file);
                    });
                  }} />
                </label>
              </div>
              <span style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{isID ? 'Unggah dokumen bukti potong pajak' : 'Upload tax withholding document(s)'}</span>
            </div>

            <div style={{ background:'rgba(255,193,7,0.05)', padding:'20px', borderRadius:'15px', border:'1px solid var(--secondary)', marginBottom:'25px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                <span style={{ fontSize:'0.85rem', color:'var(--text-muted)' }}>{isID ? 'Jumlah Tagihan:' : 'Invoice Amount:'}</span>
                <span style={{ fontWeight:'600' }}>Rp {settleModal.amount.toLocaleString(isID ? 'id-ID' : 'en-US')}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'15px' }}>
                <span style={{ fontSize:'0.85rem', color:'var(--text-muted)' }}>{isID ? 'Total Pemotongan Pajak:' : 'Total Tax Deduction:'}</span>
                <span style={{ fontWeight:'600', color:'var(--danger)' }}>- Rp {settleForm.taxes.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0).toLocaleString(isID ? 'id-ID' : 'en-US')}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', paddingTop:'10px', borderTop:'1px solid var(--glass-border)' }}>
                <span style={{ fontWeight:'700' }}>{isID ? 'Pelunasan Akhir:' : 'Final Settlement:'}</span>
                <span style={{ fontWeight:'900', color:'var(--secondary)', fontSize:'1.2rem' }}>Rp {(settleModal.amount - settleForm.taxes.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)).toLocaleString(isID ? 'id-ID' : 'en-US')}</span>
              </div>
            </div>

            <div style={{ display:'flex', gap:'12px' }}>
              <button onClick={() => setSettleModal(null)} className="btn" style={{ flex:1, padding:'15px' }}>{isID ? 'Batal' : 'Cancel'}</button>
              <ButtonWithLoading onClick={confirmSettle} className="btn btn-gold" style={{ flex:2, padding:'15px', fontWeight:'800' }}>{isID ? 'Konfirmasi Pelunasan' : 'Confirm Settlement'}</ButtonWithLoading>
            </div>
          </div>
        </div>
      )}

      {/* Bank Settings Modal */}

      {showBankSettings && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
          <div className="glass-card" style={{ width:'100%', maxWidth:'800px', padding:'35px', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px' }}>
              <h3 style={{ color:'var(--secondary)', display:'flex', alignItems:'center', gap:'10px' }}><Settings size={22}/> {isID ? 'Pengaturan Rekening Perusahaan' : 'Company Bank Settings'}</h3>
              <button onClick={() => setShowBankSettings(false)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}><X size={24}/></button>
            </div>

            {canWrite && (
              <div style={{ background:'rgba(255,255,255,0.02)', borderRadius:'12px', padding:'20px', border:'1px solid var(--glass-border)', marginBottom:'30px' }}>
                <h4 style={{ fontSize:'0.9rem', marginBottom:'20px', color:'var(--text-muted)' }}>{isID ? 'Tambah / Edit Rekening' : 'Add / Edit Account'}</h4>
                <div className="grid-responsive-3" style={{ gap:'15px', marginBottom:'15px' }}>
                  <input type="text" placeholder={isID ? 'Nama Bank (misal Mandiri IDR)' : 'Bank Name (e.g. Mandiri IDR)'} value={bankModal?.bankName || ''} onChange={e => setBankModal({...bankModal, bankName: e.target.value})} style={{ padding:'10px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)' }} />
                  <input type="text" placeholder={isID ? 'Nomor Rekening' : 'Account Number'} value={bankModal?.accountNumber || ''} onChange={e => setBankModal({...bankModal, accountNumber: e.target.value})} style={{ padding:'10px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)' }} />
                  <input type="text" placeholder={isID ? 'Atas Nama' : 'Account Holder Name'} value={bankModal?.accountName || ''} onChange={e => setBankModal({...bankModal, accountName: e.target.value})} style={{ padding:'10px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)' }} />
                </div>
                <div style={{ display:'flex', gap:'10px' }}>
                  <ButtonWithLoading 
                    className="btn btn-primary" 
                    style={{ flex:1 }}
                    loading={isSavingBank}
                    onClick={async () => {
                      if (!bankModal?.bankName || !bankModal?.accountNumber || !bankModal?.accountName) return toast.error(isID ? 'Data tidak lengkap' : 'Data is incomplete');
                      setIsSavingBank(true);
                      try {
                        await updateCompanyBank({ ...bankModal, id: bankModal.id || `BANK-${Date.now()}` });
                        setBankModal(null);
                      } catch (err) {
                        toast.error((isID ? "Gagal menyimpan rekening: " : "Failed to save account: ") + err.message);
                      } finally {
                        setIsSavingBank(false);
                      }
                    }}
                  >
                    <Save size={18}/> {isID ? 'Simpan Rekening' : 'Save Account'}
                  </ButtonWithLoading>
                  {bankModal && (
                    <button className="btn" style={{ background:'rgba(255,255,255,0.1)', color:'var(--text)' }} onClick={() => setBankModal(null)}>
                      {isID ? 'Batal / Tambah Baru' : 'Reset / Add New'}
                    </button>
                  )}
                </div>
              </div>
            )}

            <div style={{ display:'grid', gap:'15px' }}>
              {companyBankAccounts.map(bank => (
                <div key={bank.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'15px', background:'rgba(255,255,255,0.05)', borderRadius:'10px', border:'1px solid var(--glass-border)' }}>
                  <div>
                    <div style={{ fontWeight:'700', fontSize:'1rem' }}>{bank.bankName}</div>
                    <div style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>{bank.accountNumber} - {bank.accountName}</div>
                  </div>
                  {canWrite && (
                    <div style={{ display:'flex', gap:'10px', alignItems: 'center' }}>
                      {bankToDelete === bank.id ? (
                        <div style={{ display:'flex', gap:'8px', background:'var(--danger-bg)', padding:'5px 10px', borderRadius:'8px', border:'1px solid var(--danger-border)' }}>
                          <span style={{ fontSize:'0.75rem', color:'var(--danger)', fontWeight:'700' }}>{isID ? 'Hapus?' : 'Delete?'}</span>
                          <button 
                            className="btn btn-sm" 
                            style={{ background:'var(--danger)', color:'white', border:'none', padding:'2px 8px', fontSize:'0.7rem' }}
                            onClick={async () => {
                              try {
                                await deleteCompanyBank(bank.id);
                                setBankToDelete(null);
                              } catch (err) {
                                toast.error((isID ? "Gagal menghapus: " : "Failed to delete: ") + err.message);
                              }
                            }}
                          >{isID ? 'Ya' : 'Yes'}</button>
                          <button 
                            className="btn btn-sm" 
                            style={{ background:'rgba(255,255,255,0.1)', color:'var(--text)', border:'none', padding:'2px 8px', fontSize:'0.7rem' }}
                            onClick={() => setBankToDelete(null)}
                          >{isID ? 'Batal' : 'Cancel'}</button>
                        </div>
                      ) : (
                        <>
                          <button className="btn" style={{ padding:'6px 12px', fontSize:'0.75rem', background:'var(--info-bg)', color:'var(--info)' }} onClick={() => setBankModal(bank)}><Edit3 size={14}/> {isID ? 'Ubah' : 'Edit'}</button>
                          <button className="btn" style={{ padding:'6px 12px', fontSize:'0.75rem', background:'var(--danger-bg)', color:'var(--danger)' }} onClick={() => setBankToDelete(bank.id)}><Trash2 size={14}/> {isID ? 'Hapus' : 'Delete'}</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {companyBankAccounts.length === 0 && <div style={{ textAlign:'center', color:'var(--text-muted)', padding:'20px' }}>{isID ? 'Belum ada rekening terdaftar.' : 'No registered bank accounts yet.'}</div>}
            </div>
          </div>
        </div>
      )}
      {/* Upload Signed Document Modal */}
      {uploadSignedModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:10001, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
          <div className="glass-card" style={{ width:'100%', maxWidth:'450px', padding:'30px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'25px' }}>
              <h3 style={{ margin:0, color:'var(--secondary)' }}>{isID ? 'Unggah Dokumen Tertandatangan' : 'Upload Signed Document'}</h3>
              <button onClick={() => setUploadSignedModal(null)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}><X size={24}/></button>
            </div>

            <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', marginBottom:'20px' }}>
              {isID ? 'Pilih foto atau hasil pemindaian (scan) dari' : 'Select a photo or scan of the'} <strong>{uploadSignedModal.type === 'invoice' ? (isID ? 'Tagihan / Invoice' : 'Invoice') : (isID ? 'Surat Tanda Terima (STT)' : 'Delivery Receipt (STT)')}</strong> {isID ? 'yang sudah ditandatangan oleh customer.' : 'that has been signed by the customer.'}
            </p>

            <div style={{ marginBottom:'30px' }}>
              <input 
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file || !uploadSignedModal) return;

                  setIsUploading(true);
                  const reader = new FileReader();
                  reader.onload = async (readerEvent) => {
                    const base64 = readerEvent.target.result;
                    try {
                      const updateData = uploadSignedModal.type === 'invoice' 
                        ? { signedInvoicePhoto: base64 } 
                        : { signedReceiptPhoto: base64 };
                      
                      await updateInvoice(uploadSignedModal.invId, updateData);
                      setUploadSignedModal(null);
                      toast.error(isID ? "Dokumen berhasil diunggah!" : "Document uploaded successfully!");
                    } catch (err) {
                      toast.error((isID ? "Gagal mengunggah dokumen: " : "Failed to upload document: ") + err.message);
                    } finally {
                      setIsUploading(false);
                      // Clear the input value to allow re-uploading the same file
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }
                  };
                  reader.readAsDataURL(file);
                }}
              />
              <div 
                style={{ 
                  height:'150px', 
                  border:'2px dashed var(--glass-border)', 
                  borderRadius:'12px', 
                  display:'flex', 
                  flexDirection:'column', 
                  alignItems:'center', 
                  justifyContent:'center', 
                  gap:'10px', 
                  background:'rgba(255,255,255,0.02)', 
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  opacity: isUploading ? 0.6 : 1
                }}
                onClick={() => !isUploading && fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      width: '32px', height: '32px', border: '3px solid var(--secondary-bg)', 
                      borderTop: '3px solid var(--secondary)', borderRadius: '50%',
                      animation: 'spin 1s linear infinite', margin: '0 auto 10px'
                    }} />
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{isID ? 'Memproses foto...' : 'Processing photo...'}</div>
                  </div>
                ) : (
                  <>
                    <div style={{ background:'var(--secondary-glass)', padding:'10px', borderRadius:'50%' }}>
                      <Image size={32} style={{ color:'var(--secondary)' }}/>
                    </div>
                    <div style={{ fontWeight:'700', fontSize:'0.9rem' }}>{isID ? 'Klik untuk Memilih Foto' : 'Click to Choose Photo'}</div>
                    <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{isID ? 'Format: JPG, PNG, WEBP' : 'Formats: JPG, PNG, WEBP'}</div>
                  </>
                )}
              </div>
            </div>

            <button 
              onClick={() => setUploadSignedModal(null)} 
              className="btn" 
              style={{ width:'100%', padding:'12px' }}
            >
              {isID ? 'Batal' : 'Cancel'}
            </button>
          </div>
        </div>
      )}


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
        const addPresetItem = (desc) => setF({ items: [...f.items, { description: desc, qty: 1, rate: '' }] });
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
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '900', color: 'var(--secondary)' }}>🧾 {isID ? 'Konfirmasi & Edit Invoice' : 'Confirm & Edit Invoice'}</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {isID ? 'Periksa dan edit semua data sebelum invoice diterbitkan.' : 'Review and edit all data before the invoice is issued.'}
                  </p>
                </div>
                <button onClick={() => setInvoiceConfirmData(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                  <X size={22} />
                </button>
              </div>

              {/* Row 1: Invoice ID + Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={labelStyle}>{isID ? 'No. Invoice' : 'Invoice No.'}</label>
                  <input style={inputStyle} value={f.id} onChange={e => setF({ id: e.target.value })} placeholder={isID ? '(Otomatis - Sequential)' : '(Auto-generated Sequential)'} />
                </div>
                <div>
                  <label style={labelStyle}>{isID ? 'Tanggal Invoice' : 'Invoice Date'}</label>
                  <input type="date" style={inputStyle} value={f.date} onChange={e => setF({ date: e.target.value })} />
                </div>
              </div>

              {/* Customer Info Section */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '18px', marginBottom: '20px' }}>
                <p style={{ ...labelStyle, fontSize: '0.72rem', color: 'var(--secondary)', marginBottom: '14px' }}>📋 {isID ? 'Info Pelanggan' : 'Customer Info'}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>{isID ? 'Nama Customer' : 'Customer Name'}</label>
                    <input style={inputStyle} value={f.customerName} onChange={e => setF({ customerName: e.target.value })} placeholder="PT. ..." />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>{isID ? 'Alamat' : 'Address'}</label>
                    <textarea
                      rows={2}
                      style={{ ...inputStyle, resize: 'vertical' }}
                      value={f.customerAddress}
                      onChange={e => setF({ customerAddress: e.target.value })}
                      placeholder={isID ? 'Alamat perusahaan customer...' : 'Customer company address...'}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Attn. / PIC</label>
                    <input style={inputStyle} value={f.customerPic} onChange={e => setF({ customerPic: e.target.value })} placeholder="Nama PIC..." />
                  </div>
                  <div>
                    <label style={labelStyle}>{isID ? 'Telepon' : 'Phone'}</label>
                    <input style={inputStyle} value={f.customerPhone} onChange={e => setF({ customerPhone: e.target.value })} placeholder="+62..." />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Email</label>
                    <input type="email" style={inputStyle} value={f.customerEmail} onChange={e => setF({ customerEmail: e.target.value })} placeholder="finance@..." />
                  </div>
                </div>
                {/* JO Ref display */}
                <div style={{ marginTop: '12px', padding: '8px 12px', background: 'var(--secondary-bg)', borderRadius: '6px', fontSize: '0.78rem', color: 'var(--secondary)', fontWeight: '700' }}>
                  JO Ref: {invoiceConfirmData.consolidatedJOIds.join(', ')}
                </div>
              </div>

              {/* Custom Notes Section */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>{isID ? 'Keterangan (Opsional)' : 'Description (Optional)'}</label>
                <textarea
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  value={f.notes || ''}
                  onChange={e => setF({ notes: e.target.value })}
                  placeholder={isID ? 'Masukkan keterangan tambahan untuk invoice...' : 'Enter additional description for the invoice...'}
                />
              </div>

              {/* Line Items */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <p style={{ ...labelStyle, fontSize: '0.72rem', color: 'var(--text)', margin: 0 }}>📦 {isID ? 'Item Layanan' : 'Service Items'}</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => addPresetItem('Storage Demmurage')}
                      style={{ background: 'rgba(212, 175, 55, 0.15)', color: 'var(--secondary)', border: '1px solid var(--secondary)', borderRadius: '6px', padding: '4px 10px', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      + Storage Demmurage
                    </button>
                    <button
                      type="button"
                      onClick={() => addPresetItem('Insurance Cost')}
                      style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid #3b82f6', borderRadius: '6px', padding: '4px 10px', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      + Insurance Cost
                    </button>
                    <button
                      type="button"
                      onClick={addItem}
                      style={{ background: 'var(--secondary-bg)', color: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 10px', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Plus size={13} /> {isID ? 'Tambah Item' : 'Add Item'}
                    </button>
                  </div>
                </div>

                {/* Reminder Box */}
                <div style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1rem' }}>💡</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text)', lineHeight: '1.4' }}>
                    <strong>{isID ? 'Pengingat:' : 'Reminder:'}</strong> {isID ? 'Periksa apakah ada biaya rutin seperti Storage Demmurage atau Insurance Cost yang perlu dimasukkan ke dalam item layanan.' : 'Please verify if routine costs like Storage Demmurage or Insurance Cost need to be included in the service items.'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 140px 32px', gap: '6px', marginBottom: '6px' }}>
                  {['Deskripsi', 'Qty', 'Harga Satuan', ''].map((h, i) => (
                    <span key={i} style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</span>
                  ))}
                </div>
                {f.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 140px 32px', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                    <input style={inputStyle} value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="Deskripsi layanan..." />
                    <input type="number" style={{ ...inputStyle, textAlign: 'center' }} value={item.qty} onChange={e => updateItem(idx, 'qty', e.target.value)} min="1" step="any" />
                    <input type="number" style={{ ...inputStyle, textAlign: 'right' }} value={item.rate} onChange={e => updateItem(idx, 'rate', e.target.value)} placeholder="Rp" min="0" step="any" />
                    <button onClick={() => removeItem(idx)} disabled={f.items.length === 1} style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '6px', color: 'var(--danger)', cursor: f.items.length === 1 ? 'not-allowed' : 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: f.items.length === 1 ? 0.4 : 1 }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Extra Charges */}
              <div style={{ marginBottom: '20px' }}>
                <p style={{ ...labelStyle, fontSize: '0.72rem', color: 'var(--text)', marginBottom: '10px' }}>➕ {isID ? 'Biaya Tambahan' : 'Extra Charges'}</p>
                {f.extraCharges.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 140px 32px', gap: '6px', marginBottom: '6px' }}>
                    {['Deskripsi', 'Qty', 'Harga Satuan', ''].map((h, i) => (
                      <span key={i} style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</span>
                    ))}
                  </div>
                )}
                {f.extraCharges.map((ec, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 140px 32px', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                    <input style={inputStyle} value={ec.description} onChange={e => updateExtra(idx, 'description', e.target.value)} placeholder="Biaya tambahan..." />
                    <input type="number" style={{ ...inputStyle, textAlign: 'center' }} value={ec.qty} onChange={e => updateExtra(idx, 'qty', e.target.value)} min="1" step="any" />
                    <input type="number" style={{ ...inputStyle, textAlign: 'right' }} value={ec.rate} onChange={e => updateExtra(idx, 'rate', e.target.value)} placeholder="Rp" min="0" step="any" />
                    <button onClick={() => removeExtra(idx)} style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '6px', color: 'var(--danger)', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button onClick={addExtra} style={{ marginTop: '4px', background: 'none', border: '1px dashed var(--border)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={14} /> {isID ? 'Tambah Biaya Tambahan' : 'Add Extra Charge'}
                </button>
              </div>

              {/* Totals + Tax + Bank */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                {/* Tax */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '16px' }}>
                  <label style={labelStyle}>{isID ? 'Pajak (%)' : 'Tax (%)'}</label>
                  <input type="number" style={{ ...inputStyle, width: '100px' }} value={f.taxPercent} onChange={e => setF({ taxPercent: e.target.value })} min="0" max="100" step="0.1" />
                  <div style={{ marginTop: '12px' }}>
                    <label style={labelStyle}>{isID ? 'Rekening Bank' : 'Bank Account'}</label>
                    <select
                      value={f.bankAccountId}
                      onChange={e => setF({ bankAccountId: e.target.value })}
                      style={{ ...inputStyle }}
                    >
                      {companyBankAccounts.map(b => (
                        <option key={b.id} value={b.id} style={{ background: 'var(--bg)', color: 'var(--text)' }}>
                          {b.bankName} — {b.accountNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Summary */}
                <div style={{ background: 'var(--secondary-bg)', border: '1px solid var(--secondary)', borderRadius: '10px', padding: '16px' }}>
                  <p style={{ ...labelStyle, color: 'var(--secondary)', marginBottom: '12px' }}>{isID ? 'Ringkasan' : 'Summary'}</p>
                  {[
                    [isID ? 'Subtotal' : 'Subtotal', fmtRp(subtotal)],
                    [`Pajak (${parseFloat(f.taxPercent) || 0}%)`, fmtRp(taxAmt)],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      <span>{l}:</span><span style={{ fontWeight: '700' }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid var(--secondary)', marginTop: '10px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '900', fontSize: '0.9rem', color: 'var(--secondary)' }}>TOTAL:</span>
                    <span style={{ fontWeight: '900', fontSize: '1.2rem', color: 'var(--secondary)' }}>{fmtRp(grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
                <button
                  onClick={() => {
                    setInvoiceConfirmData(null);
                    setIssuingInvoiceJoId(invoiceConfirmData.joId);
                  }}
                  className="btn"
                  style={{ padding: '11px 22px', background: 'rgba(255,255,255,0.05)', color: 'var(--text)', fontWeight: '700' }}
                >
                  ← {isID ? 'Kembali' : 'Back'}
                </button>
                <ButtonWithLoading
                  className="btn btn-gold"
                  style={{ padding: '11px 28px', fontWeight: '900', fontSize: '0.95rem' }}
                  onClick={handleConfirmAndIssueInvoice}
                >
                  ✓ {isID ? 'Konfirmasi & Terbitkan' : 'Confirm & Issue'}
                </ButtonWithLoading>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Merge Job Order Modal */}
      {mergeModalData && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:9999, display:'flex', alignItems:'center', justifyContent: 'center', padding:'20px' }}>
          <div className="glass-card" style={{ width:'100%', maxWidth:'550px', padding:'30px', maxHeight:'90vh', overflowY:'auto', position:'relative' }}>
            <button 
              onClick={() => setMergeModalData(null)} 
              style={{ position:'absolute', top:'15px', right:'15px', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}
            >
              <X size={20}/>
            </button>
            <h3 style={{ color:'var(--secondary)', marginBottom:'5px', fontSize:'1.25rem' }}>
              {isID ? 'Gabungkan Job Order' : 'Merge Job Order'}
            </h3>
            <p style={{ color:'var(--text-muted)', fontSize:'0.82rem', marginBottom:'20px' }}>
              {isID ? 'Gabungkan rincian item, biaya, dan invoice dari JO ini ke JO lainnya.' : 'Combine items, costs, and invoices of this JO into another.'}
            </p>

            <div style={{ display:'flex', flexDirection:'column', gap:'15px' }}>
              {/* SOURCE INFO */}
              <div>
                <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'5px', fontWeight:'700', textTransform:'uppercase' }}>
                  {isID ? 'JO Asal (Akan Dihapus)' : 'Source JO (To Be Deleted)'}
                </label>
                <div style={{ padding:'10px', background:'rgba(255,255,255,0.02)', border:'1px solid var(--glass-border)', borderRadius:'6px', fontSize:'0.85rem' }}>
                  <strong>JO #{mergeModalData.sourceJo.id}</strong> - {mergeModalData.sourceJo.customerName}
                  <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:'4px' }}>
                    {mergeModalData.sourceJo.items?.map(it => it.description).join(', ')}
                  </div>
                </div>
              </div>

              {/* TARGET SELECTION */}
              <div>
                <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'5px', fontWeight:'700', textTransform:'uppercase' }}>
                  {isID ? 'Pilih JO Tujuan' : 'Select Target JO'}
                </label>
                <select 
                  className="form-control"
                  style={{ width:'100%', padding:'10px', background:'var(--bg)', border:'1px solid var(--glass-border)', color:'var(--text)', borderRadius:'6px' }}
                  value={mergeTargetJoId}
                  onChange={e => setMergeTargetJoId(e.target.value)}
                >
                  {jobOrders.filter(j => 
                    String(j.quotationId) === String(mergeModalData.sourceJo.quotationId) && 
                    String(j.id) !== String(mergeModalData.sourceJo.id) && 
                    j.customerName === mergeModalData.sourceJo.customerName
                  ).map(j => (
                    <option key={j.id} value={j.id}>
                      JO #{j.id} ({j.items?.map(it => it.description).join(', ') || 'No Description'})
                    </option>
                  ))}
                </select>
              </div>

              {/* INVOICE RECONCILIATION SUMMARY */}
              {(() => {
                const sourceJo = mergeModalData.sourceJo;
                const targetJo = jobOrders.find(j => String(j.id) === String(mergeTargetJoId));
                if (!targetJo) return null;

                const sourceInv = invoices.find(inv => {
                  const jIds = inv.consolidatedJOs || (inv.joId ? [inv.joId] : []);
                  return jIds.map(String).includes(String(sourceJo.id));
                });
                const targetInv = invoices.find(inv => {
                  const jIds = inv.consolidatedJOs || (inv.joId ? [inv.joId] : []);
                  return jIds.map(String).includes(String(targetJo.id));
                });

                let reconcText = '';
                let alertColor = 'rgba(52, 211, 153, 0.1)';
                let borderColor = 'rgba(52, 211, 153, 0.2)';
                let textColor = '#34d399';

                if (sourceInv && targetInv) {
                  reconcText = isID 
                    ? `Kedua JO memiliki invoice. Invoice JO asal (${sourceInv.id}) akan digabungkan ke invoice JO tujuan (${targetInv.id}), dan invoice JO asal akan dihapus.` 
                    : `Both JOs have invoices. The source invoice (${sourceInv.id}) will be merged into the target invoice (${targetInv.id}), and the source invoice will be deleted.`;
                  alertColor = 'rgba(239, 68, 68, 0.1)';
                  borderColor = 'rgba(239, 68, 68, 0.2)';
                  textColor = '#f87171';
                } else if (sourceInv && !targetInv) {
                  reconcText = isID
                    ? `Hanya JO asal yang memiliki invoice (${sourceInv.id}). Invoice ini akan dialihkan untuk menunjuk ke JO tujuan.`
                    : `Only the source JO has an invoice (${sourceInv.id}). This invoice will be transferred to point to the target JO.`;
                  alertColor = 'rgba(217, 119, 6, 0.1)';
                  borderColor = 'rgba(217, 119, 6, 0.2)';
                  textColor = '#f59e0b';
                } else if (!sourceInv && targetInv) {
                  reconcText = isID
                    ? `Hanya JO tujuan yang memiliki invoice (${targetInv.id}). Layanan dari JO asal akan ditambahkan sebagai item baru pada invoice JO tujuan.`
                    : `Only the target JO has an invoice (${targetInv.id}). Services from the source JO will be appended as new items to the target invoice.`;
                  alertColor = 'rgba(217, 119, 6, 0.1)';
                  borderColor = 'rgba(217, 119, 6, 0.2)';
                  textColor = '#f59e0b';
                } else {
                  reconcText = isID
                    ? `Kedua JO tidak memiliki invoice. Item dan biaya akan digabungkan tanpa perubahan invoice.`
                    : `Neither JO has an invoice. Items and costs will be merged without invoice adjustments.`;
                }

                return (
                  <div style={{ background: alertColor, border: `1px solid ${borderColor}`, borderRadius:'8px', padding:'12px', fontSize:'0.8rem', color: textColor }}>
                    <strong>{isID ? 'Penyelarasan Invoice:' : 'Invoice Reconciliation:'}</strong> {reconcText}
                  </div>
                );
              })()}
            </div>

            {/* BUTTONS */}
            <div style={{ display:'flex', gap:'15px', marginTop:'25px' }}>
              <button 
                className="btn" 
                onClick={() => setMergeModalData(null)}
                style={{ flex:1, background:'rgba(255,255,255,0.05)', color:'var(--text)' }}
                disabled={isProcessingMerge}
              >
                {isID ? 'Batal' : 'Cancel'}
              </button>
              <ButtonWithLoading
                className="btn btn-gold"
                loading={isProcessingMerge}
                style={{ flex:1 }}
                onClick={handleProcessMerge}
              >
                {isID ? 'Proses Penggabungan' : 'Process Merge'}
              </ButtonWithLoading>
            </div>
          </div>
        </div>
      )}

      {/* Split Job Order Item Modal */}
      {splitModalData && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:9999, display:'flex', alignItems:'center', justifyContent: 'center', padding:'20px' }}>
          <div className="glass-card" style={{ width:'100%', maxWidth:'650px', padding:'30px', maxHeight:'90vh', overflowY:'auto', position:'relative' }}>
            <button 
              onClick={() => setSplitModalData(null)} 
              style={{ position:'absolute', top:'15px', right:'15px', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}
            >
              <X size={20}/>
            </button>
            <h3 style={{ color:'var(--secondary)', marginBottom:'5px', fontSize:'1.25rem' }}>
              {isID ? 'Pisahkan Item menjadi JO Baru' : 'Split Item into New JO'}
            </h3>
            <p style={{ color:'var(--text-muted)', fontSize:'0.82rem', marginBottom:'20px' }}>
              {isID ? 'Pecah rincian layanan ini menjadi Job Order terpisah.' : 'Split this service item into a standalone Job Order.'}
            </p>

            {/* Warning if parent JO is already invoiced */}
            {joInvoiceMap[String(splitModalData.jo.id)] && (
              <div style={{ background:'rgba(217, 119, 6, 0.1)', border:'1px solid rgba(217, 119, 6, 0.25)', borderRadius:'8px', padding:'12px', marginBottom:'20px', color:'#f59e0b', fontSize:'0.8rem', display:'flex', gap:'8px', alignItems:'flex-start' }}>
                <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>{isID ? 'Peringatan:' : 'Warning:'}</strong> {isID 
                    ? 'Job Order asal sudah memiliki invoice. Memisahkan item ini tidak akan mengubah data invoice asal. Anda harus menyesuaikan invoice asal secara manual.' 
                    : 'The original Job Order is already invoiced. Splitting this item will not automatically modify the original invoice. You must adjust the original invoice manually.'}
                </div>
              </div>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:'15px' }}>
              {/* JO FIELDS */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div>
                  <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'5px', fontWeight:'700', textTransform:'uppercase' }}>{isID ? 'Pelanggan' : 'Customer'}</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    style={{ width:'100%', padding:'8px 12px', background:'rgba(255,255,255,0.03)', border:'1px solid var(--glass-border)', color:'var(--text)', borderRadius:'6px' }}
                    value={splitForm.customerName}
                    onChange={e => setSplitForm({ ...splitForm, customerName: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'5px', fontWeight:'700', textTransform:'uppercase' }}>{isID ? 'Ref Penawaran' : 'Quotation Ref'}</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    style={{ width:'100%', padding:'8px 12px', background:'rgba(255,255,255,0.03)', border:'1px solid var(--glass-border)', color:'var(--text)', borderRadius:'6px' }}
                    value={splitForm.quotationId}
                    onChange={e => setSplitForm({ ...splitForm, quotationId: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'5px', fontWeight:'700', textTransform:'uppercase' }}>{isID ? 'Deskripsi Layanan' : 'Service Description'}</label>
                <input 
                  type="text" 
                  className="form-control" 
                  style={{ width:'100%', padding:'8px 12px', background:'rgba(255,255,255,0.03)', border:'1px solid var(--glass-border)', color:'var(--text)', borderRadius:'6px' }}
                  value={splitForm.description}
                  onChange={e => setSplitForm({ ...splitForm, description: e.target.value })}
                />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px' }}>
                <div>
                  <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'5px', fontWeight:'700', textTransform:'uppercase' }}>{isID ? 'Tarif (Rp)' : 'Rate (Rp)'}</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    style={{ width:'100%', padding:'8px 12px', background:'rgba(255,255,255,0.03)', border:'1px solid var(--glass-border)', color:'var(--text)', borderRadius:'6px' }}
                    value={splitForm.rate}
                    onChange={e => setSplitForm({ ...splitForm, rate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'5px', fontWeight:'700', textTransform:'uppercase' }}>Qty</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    style={{ width:'100%', padding:'8px 12px', background:'rgba(255,255,255,0.03)', border:'1px solid var(--glass-border)', color:'var(--text)', borderRadius:'6px' }}
                    value={splitForm.quantity}
                    onChange={e => setSplitForm({ ...splitForm, quantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'5px', fontWeight:'700', textTransform:'uppercase' }}>{isID ? 'Qty Realisasi' : 'Issue Qty'}</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    style={{ width:'100%', padding:'8px 12px', background:'rgba(255,255,255,0.03)', border:'1px solid var(--glass-border)', color:'var(--text)', borderRadius:'6px' }}
                    value={splitForm.issueQuantity}
                    onChange={e => setSplitForm({ ...splitForm, issueQuantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* AUTO GENERATE INVOICE OPTION */}
              <div style={{ margin:'10px 0', padding:'12px', background:'rgba(255,255,255,0.02)', border:'1px solid var(--glass-border)', borderRadius:'8px' }}>
                <label style={{ display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', fontWeight:'700', color:'var(--secondary)', fontSize:'0.9rem' }}>
                  <input 
                    type="checkbox" 
                    checked={splitForm.autoGenerateInvoice}
                    onChange={e => setSplitForm({ ...splitForm, autoGenerateInvoice: e.target.checked })}
                    style={{ width:'16px', height:'16px', accentColor:'var(--secondary)' }}
                  />
                  <span>{isID ? 'Terbitkan Invoice Otomatis untuk JO Baru' : 'Auto-Generate Invoice for New JO'}</span>
                </label>
              </div>

              {splitForm.autoGenerateInvoice && (
                <div style={{ padding:'15px', background:'rgba(255,255,255,0.02)', border:'1px solid var(--glass-border)', borderRadius:'10px', display:'flex', flexDirection:'column', gap:'12px' }}>
                  <div style={{ fontSize:'0.75rem', color:'var(--secondary)', fontWeight:'700', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'5px' }}>
                    {isID ? 'Rincian Invoice Baru' : 'New Invoice Details'}
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                    <div>
                      <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'5px', fontWeight:'700', textTransform:'uppercase' }}>{isID ? 'No Invoice' : 'Invoice ID'}</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        style={{ width:'100%', padding:'8px 12px', background:'rgba(255,255,255,0.03)', border:'1px solid var(--glass-border)', color:'var(--text)', borderRadius:'6px' }}
                        value={splitForm.invoiceId}
                        onChange={e => setSplitForm({ ...splitForm, invoiceId: e.target.value })}
                        placeholder={isID ? '(Otomatis - Sequential)' : '(Auto-generated Sequential)'}
                      />
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'5px', fontWeight:'700', textTransform:'uppercase' }}>{isID ? 'Tgl Invoice' : 'Invoice Date'}</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        style={{ width:'100%', padding:'8px 12px', background:'rgba(255,255,255,0.03)', border:'1px solid var(--glass-border)', color:'var(--text)', borderRadius:'6px' }}
                        value={splitForm.invoiceDate}
                        onChange={e => setSplitForm({ ...splitForm, invoiceDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                    <div>
                      <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'5px', fontWeight:'700', textTransform:'uppercase' }}>{isID ? 'Rekening Bank Perusahaan' : 'Company Bank Account'}</label>
                      <select 
                        className="form-control" 
                        style={{ width:'100%', padding:'8px 12px', background:'var(--bg)', border:'1px solid var(--glass-border)', color:'var(--text)', borderRadius:'6px' }}
                        value={splitForm.bankAccountId}
                        onChange={e => setSplitForm({ ...splitForm, bankAccountId: e.target.value })}
                      >
                        {companyBankAccounts.map(bank => (
                          <option key={bank.id} value={bank.id}>{bank.bankName} - {bank.accountNumber} ({bank.accountName})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'5px', fontWeight:'700', textTransform:'uppercase' }}>{isID ? 'Pajak (%)' : 'Tax (%)'}</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        style={{ width:'100%', padding:'8px 12px', background:'rgba(255,255,255,0.03)', border:'1px solid var(--glass-border)', color:'var(--text)', borderRadius:'6px' }}
                        value={splitForm.taxPercent}
                        onChange={e => setSplitForm({ ...splitForm, taxPercent: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'5px', fontWeight:'700', textTransform:'uppercase' }}>{isID ? 'Catatan Invoice' : 'Invoice Notes'}</label>
                    <textarea 
                      className="form-control" 
                      rows="2"
                      style={{ width:'100%', padding:'8px 12px', background:'rgba(255,255,255,0.03)', border:'1px solid var(--glass-border)', color:'var(--text)', borderRadius:'6px', resize:'vertical' }}
                      value={splitForm.invoiceNotes}
                      onChange={e => setSplitForm({ ...splitForm, invoiceNotes: e.target.value })}
                    />
                  </div>

                  {/* PREVIEW AMOUNT */}
                  <div style={{ marginTop:'10px', padding:'10px', background:'rgba(212, 175, 55, 0.05)', border:'1px solid rgba(212, 175, 55, 0.15)', borderRadius:'6px', display:'flex', justifyContent:'space-between', fontSize:'0.85rem' }}>
                    <span style={{ color:'var(--text-muted)' }}>{isID ? 'Total Tagihan (Estimasi):' : 'Billing Total (Estimated):'}</span>
                    <span style={{ color:'var(--secondary)', fontWeight:'800' }}>
                      {(() => {
                        const qty = parseFloat(splitForm.issueQuantity || splitForm.quantity || 1);
                        const sub = parseFloat(splitForm.rate || 0) * qty;
                        const tx = sub * (parseFloat(splitForm.taxPercent || 0) / 100);
                        return `Rp ${(sub + tx).toLocaleString(isID ? 'id-ID' : 'en-US')}`;
                      })()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* BUTTONS */}
            <div style={{ display:'flex', gap:'15px', marginTop:'25px' }}>
              <button 
                className="btn" 
                onClick={() => setSplitModalData(null)}
                style={{ flex:1, background:'rgba(255,255,255,0.05)', color:'var(--text)' }}
                disabled={isProcessingSplit}
              >
                {isID ? 'Batal' : 'Cancel'}
              </button>
              <ButtonWithLoading
                className="btn btn-gold"
                loading={isProcessingSplit}
                style={{ flex:1 }}
                onClick={handleProcessSplit}
              >
                {isID ? 'Proses Pemisahan' : 'Process Split'}
              </ButtonWithLoading>
            </div>
          </div>
        </div>
      )}

      {/* Delete Invoice Verification Modal */}
      {deleteConfirmModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', zIndex:20000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
          <div className="glass-card" style={{ width:'100%', maxWidth:'450px', padding:'40px', textAlign:'center', border:'1px solid var(--danger)' }}>
            <div style={{ width:'70px', height:'70px', borderRadius:'50%', background:'var(--danger-bg)', color:'var(--danger)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 25px' }}>
              <ShieldAlert size={35} />
            </div>
            
            <h3 style={{ fontSize:'1.5rem', marginBottom:'15px', color:'var(--text)' }}>
              {verifyStep === 1 ? (isID ? 'Hapus Invoice yang Diterbitkan?' : 'Delete Issued Invoice?') : (isID ? 'Otoritas Keamanan' : 'Security Authorization')}
            </h3>
            
            <p style={{ color:'var(--text-muted)', fontSize:'0.9rem', marginBottom:'30px', lineHeight:'1.5' }}>
              {verifyStep === 1 
                ? (isID ? `Menghapus Invoice ${deleteConfirmModal.id} akan membatalkan status piutang. Ketik "DELETE" untuk melanjutkan.` : `Deleting Invoice ${deleteConfirmModal.id} will cancel the accounts receivable status. Type "DELETE" to continue.`)
                : (isID ? 'Tindakan ini memerlukan kunci keamanan 4-digit (Security Key) dari System Control.' : 'This action requires a 4-digit Security Key from System Control.')}
            </p>

            <div style={{ marginBottom:'30px' }}>
              {verifyStep === 1 ? (
                <input 
                  type="text" 
                  placeholder={isID ? 'Ketik DELETE' : 'Type DELETE'} 
                  value={verifyText}
                  onChange={e => setVerifyText(e.target.value)}
                  style={{ width:'100%', padding:'12px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'10px', color:'var(--text)', textAlign:'center', fontSize:'1.1rem', fontWeight:'800', letterSpacing:'2px' }}
                />
              ) : (
                <input 
                  type="password" 
                  maxLength={4}
                  placeholder="0000" 
                  value={otpInput}
                  onChange={e => setOtpInput(e.target.value)}
                  style={{ width:'120px', padding:'12px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'10px', color:'var(--secondary)', textAlign:'center', fontSize:'1.5rem', fontWeight:'800', letterSpacing:'8px' }}
                />
              )}
            </div>

            <div style={{ display:'flex', gap:'15px' }}>
              <button 
                className="btn" 
                onClick={() => {
                  setDeleteConfirmModal(null);
                  setVerifyStep(1);
                  setVerifyText('');
                  setOtpInput('');
                }}
                style={{ flex:1, background:'rgba(255,255,255,0.05)', color:'var(--text)' }}
              >
                {isID ? 'Batal' : 'Cancel'}
              </button>
              <ButtonWithLoading
                className="btn"
                loading={isAuthorizing}
                style={{ flex:1, background:'var(--danger)', color:'white' }}
                onClick={async () => {
                  if (verifyStep === 1) {
                    if (verifyText.toUpperCase() !== 'DELETE') return toast(isID ? 'Teks verifikasi tidak sesuai.' : 'Verification text does not match.');
                    setVerifyStep(2);
                  } else {
                    if (otpInput.length < 4) return toast(isID ? 'Masukkan 4 digit security key.' : 'Please enter the 4-digit security key.');
                    if (!canWrite) return;
                    setIsAuthorizing(true);
                    try {
                      const config = await getSystemConfig();
                      if (!config || !config.otpKey || otpInput !== config.otpKey) {
                        toast.error(isID ? 'Security Key Salah! Silakan cek OTP di menu System Control.' : 'Incorrect Security Key! Please check the OTP in the System Control menu.');
                        setOtpInput('');
                        return;
                      }
                      await deleteInvoice(deleteConfirmModal.id);
                      setDeleteConfirmModal(null);
                      setVerifyStep(1);
                      setVerifyText('');
                      setOtpInput('');
                      toast.error(isID ? 'Invoice berhasil dihapus.' : 'Invoice successfully deleted.');
                    } catch (err) {
                      toast.error((isID ? 'Gagal menghapus: ' : 'Failed to delete: ') + err.message);
                    } finally {
                      setIsAuthorizing(false);
                    }
                  }
                }}
              >
                {verifyStep === 1 ? (isID ? 'Lanjut' : 'Continue') : (isID ? 'Hapus Permanen' : 'Delete Permanently')}
              </ButtonWithLoading>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounting;