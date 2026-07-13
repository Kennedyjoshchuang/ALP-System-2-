import React, { createContext, useContext, useEffect, useState } from 'react';
import { useCustomers } from '../api/hooks/useCustomers';
import { apiRequest, API_URL } from '../api/api';
import { translations } from '../translations/translations';
import toast from 'react-hot-toast';

const AppContext = createContext();

export const parsePermissions = (roleStr) => {
  if (!roleStr) return {};
  if (roleStr.startsWith('{')) {
    try {
      return JSON.parse(roleStr);
    } catch (e) {
      return {};
    }
  }
  // Legacy role mapping
  switch (roleStr) {
    case 'marketing': return { marketing: 'write' };
    case 'accounting': return { accounting: 'write' };
    case 'executor': return { executor: 'write' };
    case 'admin': return { admin: 'write', procurement: 'write' };
    case 'hrd': return { hrd: 'write' };
    case 'owner': return { marketing: 'write', admin: 'write', procurement: 'write', executor: 'write', accounting: 'write', hrd: 'write', systemControl: 'write' };
    default: return {};
  }
};

// const API_URL is now imported from ../api/api

export const AppProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem('alp_lang') || 'en');
  const { customers, addCustomer: addCustomerHook, updateCustomer: updateCustomerHook, isLoading: customersLoading, error: customersError, refetch: refetchCustomers } = useCustomers();
  const [prospects, setProspects] = useState([]);
  const [prospectDrafts, setProspectDrafts] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [jobOrders, setJobOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [receivables, setReceivables] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [otherExpenses, setOtherExpenses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeAccounts, setEmployeeAccounts] = useState([]);
  const [companyBankAccounts, setCompanyBankAccounts] = useState([]);
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('alp_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [theme, setTheme] = useState(() => localStorage.getItem('alp_theme') || 'dark');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const hasAccess = (moduleKey, writeRequired = false) => {
    if (!user) return false;
    if (user.role === 'owner') return true;
    if (moduleKey === 'costApplications') return true;
    
    if (user.permissions && user.permissions[moduleKey]) {
      const accessLevel = user.permissions[moduleKey];
      if (writeRequired) {
        return accessLevel === 'write';
      }
      return accessLevel === 'write' || accessLevel === 'read';
    }
    
    return false;
  };


  // Translation function
  const t = (key) => {
    return translations[language][key] || key;
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'id' : 'en';
    setLanguage(newLang);
    localStorage.setItem('alp_lang', newLang);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('alp_theme', newTheme);
  };

  const login = async (username, password) => {
    try {
      const res = await apiRequest('login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      if (res && res.success && res.token) {
        setUser(res.user);
        sessionStorage.setItem('alp_user', JSON.stringify(res.user));
        sessionStorage.setItem('alp_token', res.token);
        return true;
      }
    } catch (err) {
      console.error('Login failed:', err);
      throw err;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('alp_user');
    sessionStorage.removeItem('alp_token');
  };

  // Fetch all data from API (excluding customers, which are handled by useCustomers)
  const fetchData = async () => {
    try {
      const endpoints = [
        { name: 'prospects', allowed: hasAccess('marketing') },
        { name: 'quotations', allowed: hasAccess('marketing') },
        { name: 'job-orders', allowed: true },
        { name: 'invoices', allowed: hasAccess('accounting') },
        { name: 'receivables', allowed: hasAccess('accounting') },
        { name: 'vendors', allowed: hasAccess('procurement') },
        { name: 'purchase-orders', allowed: hasAccess('admin') || hasAccess('accounting') },
        { name: 'salaries', allowed: hasAccess('accounting') },
        { name: 'other-expenses', allowed: true },
        { name: 'employees', allowed: hasAccess('hrd') },
        { name: 'employee-accounts', allowed: hasAccess('hrd') },
        { name: 'company-bank-accounts', allowed: hasAccess('accounting') }
      ];
      const dataPromises = endpoints.map((ep) => {
        if (!ep.allowed) return Promise.resolve([]);
        return apiRequest(ep.name).catch((err) => {
          console.warn(`Fetch failed for ${ep.name}: ${err.message}`);
          return [];
        });
      });
      const [
        prosData,
        quoData,
        joData,
        invData,
        recData,
        venData,
        poData,
        salData,
        expData,
        empData,
        accData,
        bankData
      ] = await Promise.all(dataPromises);

      const safeParse = (data, keys) => {
        if (!Array.isArray(data)) return [];
        return data.map(item => {
          const newItem = { ...item };
          keys.forEach(key => {
            if (newItem[key] && typeof newItem[key] === 'string') {
              try {
                newItem[key] = JSON.parse(newItem[key]);
              } catch (e) {
                console.warn(`Failed to parse ${key} for item ${newItem.id}:`, e.message);
              }
            }
            // Ensure array type for common list columns if they are null/undefined
            if (['items', 'photos', 'costs', 'containerNo', 'vehicleNo', 'driverName', 'extra_charges', 'services', 'assets', 'taxes'].includes(key)) {
              if (!Array.isArray(newItem[key])) newItem[key] = [];
            }
          });
          return newItem;
        });
      };

      setProspects(Array.isArray(prosData) ? prosData : []);
      setQuotations(safeParse(quoData, ['items']));
      const parsedJOs = safeParse(joData, ['photos', 'costs', 'containerNo', 'vehicleNo', 'driverName', 'items']).map(jo => {
        let instructionText = jo.instruction || '';
        let dispatchedAt = jo.dispatchedAt || null;
        let completedAt = jo.completedAt || null;
        let shipmentStatus = jo.shipmentStatus || null;
        let etd = jo.etd || null;
        let eta = jo.eta || null;
        let vesselName = jo.vesselName || null;
        
        if (instructionText && instructionText.includes('|||')) {
          const parts = instructionText.split('|||');
          instructionText = parts[0].trim();
          try {
            const meta = JSON.parse(parts[1].trim());
            if (meta.dispatchedAt) dispatchedAt = meta.dispatchedAt;
            if (meta.completedAt) completedAt = meta.completedAt;
            if (meta.shipmentStatus) shipmentStatus = meta.shipmentStatus;
            if (meta.etd) etd = meta.etd;
            if (meta.eta) eta = meta.eta;
            if (meta.vesselName) vesselName = meta.vesselName;
          } catch (e) {
            // failed to parse
          }
        }
        
        return {
          ...jo,
          instruction: instructionText,
          jobDescription: instructionText,
          dispatchedAt,
          completedAt,
          shipmentStatus,
          etd,
          eta,
          vesselName
        };
      });
      setJobOrders(parsedJOs);
      const unpackInvoiceNotes = (inv) => {
        let notesText = inv.notes || '';
        let consolidatedJOs = Array.isArray(inv.consolidatedJOs) ? inv.consolidatedJOs : [];
        let items = Array.isArray(inv.items) ? inv.items : [];

        if (notesText && notesText.includes('|||')) {
          const parts = notesText.split('|||');
          notesText = parts[0].trim();
          try {
            const meta = JSON.parse(parts[1].trim());
            if (Array.isArray(meta.consolidatedJOs) && consolidatedJOs.length === 0) {
              consolidatedJOs = meta.consolidatedJOs;
            }
            if (Array.isArray(meta.items) && items.length === 0) {
              items = meta.items;
            }
          } catch (e) {
            // ignore
          }
        }
        return {
          ...inv,
          notes: notesText || null,
          consolidatedJOs: consolidatedJOs.length > 0 ? consolidatedJOs : (inv.joId ? [inv.joId] : []),
          items: items
        };
      };

      setInvoices(safeParse(invData, ['extra_charges', 'tax_deduction_proof', 'taxes_deducted', 'paymentProofPhoto', 'signedInvoicePhoto', 'signedReceiptPhoto']).map(unpackInvoiceNotes));
      const parsedReceivables = safeParse(recData, ['extra_charges', 'tax_deduction_proof', 'taxes_deducted', 'paymentProofPhoto', 'signedInvoicePhoto', 'signedReceiptPhoto']).map(rec => {
        const originalInv = invData.find(i => i.id === rec.id || i.id === rec.invoiceId);
        const unpackedInv = originalInv ? unpackInvoiceNotes(originalInv) : null;
        return {
          ...rec,
          joId: rec.joId || (unpackedInv ? unpackedInv.joId : null),
          consolidatedJOs: (unpackedInv && unpackedInv.consolidatedJOs) ? unpackedInv.consolidatedJOs : (rec.joId ? [rec.joId] : []),
          items: unpackedInv ? (unpackedInv.items || []) : []
        };
      });
      setReceivables(parsedReceivables);
      setVendors(safeParse(venData, ['services', 'assets']));
      setPurchaseOrders(safeParse(poData, ['items', 'vendorInvoicePhoto', 'paymentProofPhoto']));
      setSalaries(safeParse(salData, ['taxes']));
      setOtherExpenses(safeParse(expData, ['taxes']));
      setEmployees(Array.isArray(empData) ? empData : []);
      setEmployeeAccounts(Array.isArray(accData) ? accData : []);
      setCompanyBankAccounts(Array.isArray(bankData) ? bankData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const body = document.body;
    if (theme === 'light') {
      body.classList.add('light-theme');
    } else {
      body.classList.remove('light-theme');
    }
  }, [theme]);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      toast.error('Sesi Anda telah berakhir. Silakan login kembali.');
    };
    window.addEventListener('alp-auth-unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('alp-auth-unauthorized', handleUnauthorized);
    };
  }, []);


  const addCustomer = async (customer) => {
    const newCustomer = { ...customer, id: customer.id || `CUST-${Date.now().toString().slice(-4)}` };
    // Use the mutation provided by useCustomers (optimistic update handled there)
    await addCustomerHook(newCustomer);
    return newCustomer;
  };

  const updateCustomer = async (id, updates) => {
    await updateCustomerHook({ id, ...updates });
  };

  const addProspect = async (prospectData) => {
    const newProspect = {
      ...prospectData,
      id: `PRP-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'followUp'
    };
    await apiRequest('prospects', {
      method: 'POST',
      body: JSON.stringify(newProspect)
    });
    setProspects(prev => [...prev, newProspect]);
    return newProspect;
  };

  const updateProspectStatus = async (id, status) => {
    await apiRequest(`prospects/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    setProspects(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  };

  const updateProspect = async (id, updates) => {
    await apiRequest(`prospects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    setProspects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const convertProspectToCustomer = async (id) => {
    const prospect = prospects.find(p => p.id === id);
    if (prospect) {
      const customer = await addCustomer({
        name: prospect.name,
        phone: prospect.phone,
        email: prospect.email,
        address: prospect.address,
        customData: prospect.customData || {}
      });
      await updateProspectStatus(id, 'deal');
      return customer;
    }
  };

  const createQuotation = async (quotationData) => {
    const newQuotation = {
      ...quotationData,
      id: `QUO-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      status: 'pending'
    };
    const { id } = await apiRequest('quotations', {
      method: 'POST',
      body: JSON.stringify(newQuotation)
    });
    const finalQuotation = { ...newQuotation, id };
    setQuotations(prev => [...prev, finalQuotation]);
    return finalQuotation;
  };

  const updateQuotation = async (quotationId, quotationData) => {
    await apiRequest(`quotations/${quotationId}`, {
      method: 'PUT',
      body: JSON.stringify(quotationData)
    });
    setQuotations(prev => prev.map(q => 
      q.id === quotationId ? { ...q, ...quotationData } : q
    ));
  };

  const approveQuotation = async (quotationId) => {
    await apiRequest(`quotations/${quotationId}/approve`, { method: 'PUT' });
    setQuotations(prev => prev.map(q => 
      q.id === quotationId ? { ...q, status: 'approved' } : q
    ));
  };

  const unapproveQuotation = async (quotationId) => {
    await apiRequest(`quotations/${quotationId}/unapprove`, { method: 'PUT' });
    setQuotations(prev => prev.map(q =>
      q.id === quotationId ? { ...q, status: 'pending' } : q
    ));
  };

  const createJO = async (joData) => {
    const newJO = {
      ...joData,
      instruction: joData.instruction || joData.jobDescription || '',
      jobDescription: joData.instruction || joData.jobDescription || '',
      id: `JO-${Date.now().toString().slice(-6)}`,
      status: 'pending',
      containerNo: '',
      vehicleNo: '',
      driverName: '',
      activityStatus: '',
      photos: [],
      items: joData.items || [],
      date: new Date().toISOString()
    };
    const { id } = await apiRequest('job-orders', {
      method: 'POST',
      body: JSON.stringify(joData)
    });
    const finalJO = { ...newJO, id };
    setJobOrders(prev => [...prev, finalJO]);
    return finalJO;
  };

  const createBulkJOs = async (joDataArray) => {
    const createdJOs = await apiRequest('job-orders/bulk', {
      method: 'POST',
      body: JSON.stringify(joDataArray)
    });
    setJobOrders(prev => [...prev, ...createdJOs]);
    return createdJOs;
  };

  const dispatchJO = async (joId, quantity, updatedItems) => {
    const dispatchedAt = new Date().toISOString();
    const updates = { status: 'dispatched', dispatchedAt };
    if (quantity !== undefined && quantity !== null) updates.issueQuantity = quantity;
    if (updatedItems) updates.items = updatedItems;
    await updateJOStatus(joId, updates);
  };

  const updateJOStatus = async (joId, updates) => {
    // Intercept updates to serialize dispatchedAt/completedAt/shipment fields into instruction polymorphically
    const currentJo = jobOrders.find(j => j.id === joId) || {};
    
    const dispatchedAt = 'dispatchedAt' in updates ? updates.dispatchedAt : currentJo.dispatchedAt;
    const completedAt = 'completedAt' in updates ? updates.completedAt : currentJo.completedAt;
    const shipmentStatus = 'shipmentStatus' in updates ? updates.shipmentStatus : currentJo.shipmentStatus;
    const etd = 'etd' in updates ? updates.etd : currentJo.etd;
    const eta = 'eta' in updates ? updates.eta : currentJo.eta;
    const vesselName = 'vesselName' in updates ? updates.vesselName : currentJo.vesselName;
    
    const finalUpdates = { ...updates };
    
    // Clean up SQL columns to avoid PostgREST schema cache error
    delete finalUpdates.dispatchedAt;
    delete finalUpdates.completedAt;
    delete finalUpdates.shipmentStatus;
    delete finalUpdates.etd;
    delete finalUpdates.eta;
    delete finalUpdates.vesselName;
    
    if (dispatchedAt || completedAt || shipmentStatus || etd || eta || vesselName) {
      // Get the raw instruction (without old metadata)
      let rawInstruction = updates.instruction || updates.jobDescription || currentJo.instruction || currentJo.jobDescription || '';
      // If the updates or current state has metadata, strip it first to get the pure instruction
      if (rawInstruction.includes('|||')) {
        rawInstruction = rawInstruction.split('|||')[0].trim();
      }
      
      const meta = { dispatchedAt, completedAt, shipmentStatus, etd, eta, vesselName };
      finalUpdates.instruction = `${rawInstruction} ||| ${JSON.stringify(meta)}`;
    }
    
    // Optimistic update
    setJobOrders(prev => prev.map(jo => {
      if (jo.id === joId) {
        const merged = { ...jo, ...updates };
        // Clean up serialized string inside state so the frontend gets pristine instruction
        if (merged.instruction && merged.instruction.includes('|||')) {
          merged.instruction = merged.instruction.split('|||')[0].trim();
        }
        merged.jobDescription = merged.instruction;
        merged.dispatchedAt = dispatchedAt;
        merged.completedAt = completedAt;
        merged.shipmentStatus = shipmentStatus;
        merged.etd = etd;
        merged.eta = eta;
        merged.vesselName = vesselName;
        return merged;
      }
      return jo;
    }));

    await apiRequest(`job-orders/${joId}`, {
      method: 'PUT',
      body: JSON.stringify(finalUpdates)
    });
  };

  const completeJO = async (joId) => {
    const completedAt = new Date().toISOString();
    await updateJOStatus(joId, { status: 'done', completedAt });
  };

  const cleanNumber = (val) => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    // Handle Indonesian format: dot as thousands separator, comma as decimal
    // First, check if it's already a clean string number
    if (/^\d+(\.\d+)?$/.test(String(val))) return parseFloat(val);
    
    // Otherwise, strip everything except digits, comma and dot
    let str = String(val).replace(/[^\d.,-]/g, '');
    
    // If it has both dot and comma, or just comma, it's likely Indonesian format (1.000,00)
    if (str.includes(',') && str.includes('.')) {
      str = str.replace(/\./g, '').replace(/,/g, '.');
    } else if (str.includes(',')) {
      str = str.replace(/,/g, '.');
    }
    
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
  };

  const createInvoice = async (joId, notes) => {
    console.log("Starting createInvoice for JO ID:", joId);
    const jo = jobOrders.find(j => String(j.id) === String(joId));
    if (!jo) {
      console.error("Job Order not found in local state for ID:", joId);
      return null;
    }
    
    // Find all JOs sharing the same quotationId and customerName, and are in 'done' status.
    let targetJOs = [jo];
    if (jo.quotationId) {
      targetJOs = jobOrders.filter(j => 
        String(j.quotationId) === String(jo.quotationId) && 
        (j.status === 'done' || String(j.id) === String(joId)) &&
        j.customerName === jo.customerName
      );
    }
    
     // Calculate total amount across all target JOs and build items list
    let totalAmount = 0;
    const items = [];
    targetJOs.forEach(targetJo => {
      if (Array.isArray(targetJo.items) && targetJo.items.length > 0) {
        // Multi-item job order
        targetJo.items.forEach(item => {
          if (item.status === 'done' || String(targetJo.id) === String(joId)) {
            const qty = cleanNumber(item.issueQuantity || item.quantity || 1);
            const rate = cleanNumber(item.rate);
            totalAmount += rate * qty;
            items.push({
              description: item.description || 'Freight Forwarding Services',
              qty,
              rate,
              containerNo: item.containerNo || [],
              vehicleNo: item.vehicleNo || [],
              driverName: item.driverName || []
            });
          }
        });
      } else {
        // Legacy single-item job order
        const quotation = targetJo.quotationId 
          ? quotations.find(q => String(q.id) === String(targetJo.quotationId))
          : null;
        let qItems = [];
        if (quotation && quotation.items) {
          try {
            qItems = typeof quotation.items === 'string' ? JSON.parse(quotation.items) : quotation.items;
          } catch (e) {
            qItems = [];
          }
        }
        if (!Array.isArray(qItems)) qItems = [];
        const targetDesc = (targetJo.instruction || targetJo.jobDescription || "").trim().toLowerCase();
        const matchedItem = qItems.find(i => (i.description || "").trim().toLowerCase() === targetDesc);
        
        let rate = 0;
        if (matchedItem && matchedItem.rate) {
          rate = cleanNumber(matchedItem.rate);
        } else {
          rate = cleanNumber(targetJo.rate);
        }
        const qty = cleanNumber(targetJo.issueQuantity || targetJo.quantity || 1);
        totalAmount += rate * qty;
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
    
    if (isNaN(totalAmount)) {
      throw new Error("Gagal menghitung nominal invoice (Data tidak valid).");
    }

    const newInvoiceId = `INV-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const consolidatedJOs = targetJOs.map(j => j.id);

    const newInvoice = {
      id: newInvoiceId,
      joId, // Primary JO reference
      consolidatedJOs, // Array of consolidated JO IDs
      customerName: jo.customerName || 'Pelanggan',
      amount: totalAmount,
      subtotal: totalAmount,
      tax: 0,
      date: new Date().toISOString(),
      status: 'unpaid',
      notes: notes || null,
      extra_charges: [],
      signedReceiptPhoto: null,
      signedInvoicePhoto: null,
      deliveryStatus: 'not_sent',
      items
    };
    
    try {
      const data = await apiRequest('invoices', {
        method: 'POST',
        body: JSON.stringify(newInvoice)
      });
      
      const finalInvoice = { 
        ...newInvoice, 
        id: data.id || newInvoice.id,
        notes: notes || null,
        consolidatedJOs,
        items
      };
      
      setInvoices(prev => [...prev, finalInvoice]);
      setReceivables(prev => [...prev, { ...finalInvoice, balance: finalInvoice.amount }]);
      
      // Update all consolidated JOs to 'invoiced'
      setJobOrders(prev => prev.map(j => 
        consolidatedJOs.map(String).includes(String(j.id)) ? { ...j, status: 'invoiced' } : j
      ));
      
      return finalInvoice;
    } catch (error) {
      console.error("Failed to create invoice:", error);
      throw error;
    }
  };

  const createCustomInvoice = async (invoiceData) => {
    console.log("Starting createCustomInvoice for customer:", invoiceData.customerName);
    const newInvoiceId = invoiceData.id || `INV-CUST-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    const consolidatedJOs = Array.isArray(invoiceData.consolidatedJOs) && invoiceData.consolidatedJOs.length > 0
      ? invoiceData.consolidatedJOs
      : invoiceData.joId ? [invoiceData.joId] : [];

    const items = invoiceData.items || [];
    const newInvoice = {
      id: newInvoiceId,
      joId: invoiceData.joId || null,
      consolidatedJOs,
      customerName: invoiceData.customerName || 'Pelanggan',
      customerAddress: invoiceData.customerAddress || '',
      customerPic: invoiceData.customerPic || '',
      customerPhone: invoiceData.customerPhone || '',
      customerEmail: invoiceData.customerEmail || '',
      amount: cleanNumber(invoiceData.amount),
      subtotal: cleanNumber(invoiceData.subtotal || invoiceData.amount),
      tax: cleanNumber(invoiceData.tax || 0),
      date: invoiceData.date || new Date().toISOString(),
      status: invoiceData.status || 'unpaid',
      notes: invoiceData.notes || null,
      extra_charges: invoiceData.extra_charges || [],
      signedReceiptPhoto: null,
      signedInvoicePhoto: null,
      deliveryStatus: 'not_sent',
      items
    };

    try {
      const data = await apiRequest('invoices', {
        method: 'POST',
        body: JSON.stringify(newInvoice)
      });
      
      const finalInvoice = { 
        ...newInvoice, 
        id: data.id || newInvoice.id,
        notes: invoiceData.notes || null,
        consolidatedJOs,
        items
      };
      
      setInvoices(prev => [...prev, finalInvoice]);
      setReceivables(prev => [...prev, { ...finalInvoice, balance: finalInvoice.amount }]);
      
      // Mark ALL consolidated JOs as invoiced
      if (consolidatedJOs.length > 0) {
        setJobOrders(prev => prev.map(j =>
          consolidatedJOs.map(String).includes(String(j.id)) ? { ...j, status: 'invoiced' } : j
        ));
      }
      
      return finalInvoice;
    } catch (error) {
      console.error("Failed to create custom invoice:", error);
      throw error;
    }
  };

  const convertLegacyJOs = async (primaryJoId, joIdsToDelete, items) => {
    try {
      await apiRequest('job-orders/convert-legacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryJoId, joIdsToDelete, items })
      });
      await fetchData();
      return true;
    } catch (error) {
      console.error("Failed to convert legacy job orders:", error);
      throw error;
    }
  };

  const convertBatchLegacyJOs = async (batches, onProgress) => {
    try {
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        if (onProgress) {
          onProgress(i, batches.length, batch.quotationId || batch.primaryJoId);
        }
        await apiRequest('job-orders/convert-legacy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            primaryJoId: batch.primaryJoId, 
            joIdsToDelete: batch.joIdsToDelete, 
            items: batch.items 
          })
        });
      }
      await fetchData();
      return true;
    } catch (error) {
      console.error("Failed to convert batch legacy job orders:", error);
      throw error;
    }
  };

  const settleInvoice = async (invoiceId, paymentProofPhoto, taxesDeducted, taxDeductionProof, paidDate) => {
    const totalTax = Array.isArray(taxesDeducted) ? taxesDeducted.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0) : 0;
    
    await apiRequest(`invoices/${invoiceId}/settle`, { 
      method: 'PUT',
      body: JSON.stringify({ paymentProofPhoto, taxesDeducted, taxDeductionProof, paidDate })
    });
    setInvoices(prev => prev.map(inv => 
      inv.id === invoiceId ? { 
        ...inv, 
        status: 'paid', 
        paymentProofPhoto,
        tax_deduction: totalTax, 
        taxes_deducted: taxesDeducted,
        tax_deduction_proof: taxDeductionProof,
        paidDate
      } : inv
    ));
    setReceivables(prev => prev.map(r => 
      r.id === invoiceId || r.invoiceId === invoiceId ? { 
        ...r, 
        status: 'paid', 
        balance: 0, 
        paymentProofPhoto, 
        tax_deduction: totalTax, 
        taxes_deducted: taxesDeducted,
        tax_deduction_proof: taxDeductionProof,
        paidDate
      } : r
    ));
  };

  const settleReceivable = async (invoiceId) => {
    await settleInvoice(invoiceId);
  };

  const deleteCustomer = async (id) => {
    await apiRequest(`customers/${id}`, { method: 'DELETE' });
    refetchCustomers();
  };

  const addVendor = async (data) => {
    const newVendor = { ...data, id: `VND-${Date.now().toString().slice(-6)}`, date: new Date().toISOString() };
    const res = await apiRequest('vendors', { method: 'POST', body: JSON.stringify(newVendor) });
    const { id } = res;
    const finalVendor = { ...newVendor, id };
    setVendors(prev => [...prev, finalVendor]);
    return finalVendor;
  };
  const updateVendor = async (id, data) => {
    await apiRequest(`vendors/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    setVendors(prev => prev.map(v => v.id === id ? { ...v, ...data } : v));
  };
  const deleteVendor = async (id) => {
    await apiRequest(`vendors/${id}`, { method: 'DELETE' });
    setVendors(prev => prev.filter(v => v.id !== id));
  };

  const createPurchaseOrder = async (poData) => {
    const newPO = {
      ...poData,
      id: `PO-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      status: poData.status || 'draft'
    };
    
    try {
      const finalPO = await apiRequest('purchase-orders', {
        method: 'POST',
        body: JSON.stringify(poData)
      });
      // Ensure items are parsed if server returns them as string
      if (typeof finalPO.items === 'string') finalPO.items = JSON.parse(finalPO.items);
      if (typeof finalPO.vendorInvoicePhoto === 'string') finalPO.vendorInvoicePhoto = JSON.parse(finalPO.vendorInvoicePhoto);
      if (typeof finalPO.paymentProofPhoto === 'string') finalPO.paymentProofPhoto = JSON.parse(finalPO.paymentProofPhoto);
      if (typeof finalPO.tax_proof_photo === 'string') finalPO.tax_proof_photo = JSON.parse(finalPO.tax_proof_photo);
      
      setPurchaseOrders(prev => [finalPO, ...prev]);
      return finalPO;
    } catch (error) {
      console.error("Failed to create PO:", error);
      throw error;
    }
  };

  const issuePurchaseOrder = async (poId) => {
    await apiRequest(`purchase-orders/${poId}/issue`, { method: 'PUT' });
    setPurchaseOrders(prev => prev.map(p => p.id === poId ? { ...p, status: 'issued' } : p));
  };

  const deletePurchaseOrder = async (poId) => {
    await apiRequest(`purchase-orders/${poId}`, { method: 'DELETE' });
    setPurchaseOrders(prev => prev.filter(p => p.id !== poId));
  };

  const updatePurchaseOrder = async (poId, data) => {
    await apiRequest(`purchase-orders/${poId}`, { 
      method: 'PUT', 
      body: JSON.stringify(data)
    });
    setPurchaseOrders(prev => prev.map(p => p.id === poId ? { ...p, ...data } : p));
  };

  // Local-only patch: updates React state without hitting the API.
  // Use this when the DB schema doesn't have a column yet but you need the UI to reflect the data.
  const patchPurchaseOrderLocal = (poId, data) => {
    setPurchaseOrders(prev => prev.map(p => p.id === poId ? { ...p, ...data } : p));
  };
  const deleteProspect = async (id) => {
    await apiRequest(`prospects/${id}`, { method: 'DELETE' });
    setProspects(prev => prev.filter(p => p.id !== id));
  };


  const deleteJO = async (id) => {
    await apiRequest(`job-orders/${id}`, { method: 'DELETE' });
    setJobOrders(prev => prev.filter(jo => jo.id !== id));
  };
  const deleteInvoice = async (id) => {
    // Revert JO status before deleting
    const invoiceToDelete = invoices.find(inv => inv.id === id);
    if (invoiceToDelete) {
      const joIdsToRevert = invoiceToDelete.consolidatedJOs || [invoiceToDelete.joId];
      setJobOrders(prev => prev.map(jo => 
        joIdsToRevert.includes(jo.id) ? { ...jo, status: 'done' } : jo
      ));
    }

    await apiRequest(`invoices/${id}`, { method: 'DELETE' });
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    setReceivables(prev => prev.filter(r => r.invoiceId !== id));
  };
  const updateInvoice = async (id, updates) => {
    await apiRequest(`invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...updates } : inv));
    // Also update receivable if it exists
    setReceivables(prev => prev.map(r => r.id === id ? { ...r, ...updates, balance: updates.amount ?? r.balance } : r));
  };
  const deleteQuotation = async (id) => {

    try {
      await apiRequest(`quotations/${id}`, { method: 'DELETE' });
      setQuotations(prev => prev.filter(q => q.id !== id));
      // Also refresh other data since we implemented cascade delete on backend
      fetchData();
      console.log(`Berhasil menghapus penawaran: ${id}`);
    } catch (error) {
      console.error("Gagal menghapus:", error);
      toast.error("Masalah koneksi saat mencoba menghapus.");
    }
  };

  const addSalary = async (salary) => {
    const newSalary = { 
      ...salary, 
      id: `SAL-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString()
    };
    await apiRequest('salaries', {
      method: 'POST',
      body: JSON.stringify(newSalary)
    });
    setSalaries(prev => [newSalary, ...prev]);
    return newSalary;
  };

  const deleteSalary = async (id) => {
    await apiRequest(`salaries/${id}`, { method: 'DELETE' });
    setSalaries(prev => prev.filter(s => s.id !== id));
  };

  const updateSalary = async (id, updates) => {
    await apiRequest(`salaries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    setSalaries(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const addOtherExpense = async (expense) => {
    const newExpense = { 
      ...expense, 
      id: `EXP-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString()
    };
    await apiRequest('other-expenses', {
      method: 'POST',
      body: JSON.stringify(newExpense)
    });
    setOtherExpenses(prev => [newExpense, ...prev]);
    return newExpense;
  };

  const deleteOtherExpense = async (id) => {
    await apiRequest(`other-expenses/${id}`, { method: 'DELETE' });
    setOtherExpenses(prev => prev.filter(e => e.id !== id));
  };
  const updateOtherExpense = async (id, updates) => {
    await apiRequest(`other-expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    setOtherExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const clearAllData = async () => {
    if (user?.role !== 'owner') return;
    await apiRequest('system/clear', { method: 'POST' });
    refetchCustomers();
    setProspects([]);
    setProspectDrafts([]);
    setJobOrders([]);
    setInvoices([]);
    setReceivables([]);
  };

  const getSystemConfig = async () => {
    return await apiRequest('system/config');
  };

  const updateSystemConfig = async (config) => {
    await apiRequest('system/config', {
      method: 'POST',
      body: JSON.stringify(config)
    });
  };

  // --- EMPLOYEE METHODS ---
  const addEmployee = async (employee) => {
    const newEmployee = { ...employee, id: `EMP-${Date.now().toString().slice(-6)}` };
    await apiRequest('employees', {
      method: 'POST',
      body: JSON.stringify(newEmployee)
    });
    setEmployees(prev => [...prev, newEmployee]);
    return newEmployee;
  };

  const updateEmployee = async (id, updates) => {
    await apiRequest(`employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const deleteEmployee = async (id) => {
    await apiRequest(`employees/${id}`, { method: 'DELETE' });
    setEmployees(prev => prev.filter(e => e.id !== id));
    setEmployeeAccounts(prev => prev.filter(a => a.id !== id));
  };

  const addEmployeeAccount = async (account) => {
    await apiRequest('employee-accounts', {
      method: 'POST',
      body: JSON.stringify(account)
    });
    setEmployeeAccounts(prev => [...prev, account]);
  };
  
  const updateEmployeeAccount = async (id, updates) => {
    await apiRequest(`employee-accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    setEmployeeAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };
  
  const deleteEmployeeAccount = async (id) => {
    await apiRequest(`employee-accounts/${id}`, { method: 'DELETE' });
    setEmployeeAccounts(prev => prev.filter(a => a.id !== id));
  };

  const updateCompanyBank = async (account) => {
    // Optimistic update
    setCompanyBankAccounts(prev => {
      const idx = prev.findIndex(a => a.id === account.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = account;
        return next;
      }
      return [...prev, account];
    });

    await apiRequest('company-bank-accounts', {
      method: 'POST',
      body: JSON.stringify(account)
    });
  };

  const deleteCompanyBank = async (id) => {
    await apiRequest(`company-bank-accounts/${id}`, { method: 'DELETE' });
    setCompanyBankAccounts(prev => prev.filter(b => b.id !== id));
  };


  return (
    <AppContext.Provider value={{
      user, login, logout, hasAccess,
      language, toggleLanguage, t,
      theme, toggleTheme, loading,
      customers, addCustomer, updateCustomer, deleteCustomer,
      vendors, addVendor, updateVendor, deleteVendor,
      purchaseOrders, createPurchaseOrder, issuePurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, patchPurchaseOrderLocal,
      prospects, addProspect, updateProspectStatus, convertProspectToCustomer, deleteProspect, updateProspect,
      prospectDrafts,
      quotations, createQuotation, updateQuotation, approveQuotation, unapproveQuotation, deleteQuotation,
      jobOrders, createJO, createBulkJOs, dispatchJO, updateJOStatus, completeJO, deleteJO, convertLegacyJOs, convertBatchLegacyJOs,
      invoices, createInvoice, createCustomInvoice, settleInvoice, deleteInvoice, updateInvoice,
      receivables, settleReceivable,
      salaries, addSalary, deleteSalary, updateSalary,
      otherExpenses, addOtherExpense, deleteOtherExpense, updateOtherExpense,
      employees, addEmployee, updateEmployee, deleteEmployee,
      employeeAccounts, addEmployeeAccount, updateEmployeeAccount, deleteEmployeeAccount,
      companyBankAccounts, updateCompanyBank, deleteCompanyBank,
      maintenanceMode, setMaintenanceMode,
      clearAllData,
      getSystemConfig, updateSystemConfig
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);

