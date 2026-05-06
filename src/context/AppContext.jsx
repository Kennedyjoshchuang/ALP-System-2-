import React, { createContext, useContext, useEffect, useState } from 'react';
import { useCustomers } from '../api/hooks/useCustomers';
import { apiRequest, API_URL } from '../api/api';
import { translations } from '../translations/translations';

const AppContext = createContext();

// const API_URL is now imported from ../api/api

export const AppProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem('omega_lang') || 'en');
  const { customers, addCustomer: addCustomerHook, isLoading: customersLoading, error: customersError } = useCustomers();
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
    const saved = sessionStorage.getItem('omega_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [theme, setTheme] = useState(() => localStorage.getItem('omega_theme') || 'dark');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Translation function
  const t = (key) => {
    return translations[language][key] || key;
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'id' : 'en';
    setLanguage(newLang);
    localStorage.setItem('omega_lang', newLang);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('omega_theme', newTheme);
  };

  const login = (username, password) => {
    // 1. Check hardcoded/admin accounts
    const rolesMap = {
      'owner': { name: 'Owner', role: 'owner', key: 'Haiga1899.2003' },
      'marketing': { name: 'Marketing', role: 'marketing', key: 'Haiga1899.2003' },
      'admin': { name: 'Admin Office', role: 'admin', key: 'Haiga1899.2003' },
      'executor': { name: 'Executor', role: 'executor', key: 'Haiga1899.2003' },
      'accounting': { name: 'Accounting', role: 'accounting', key: 'Haiga1899.2003' }
    };


    const userMatch = rolesMap[username];
    if (userMatch && password === userMatch.key) {
      const userData = { name: userMatch.name, role: userMatch.role };
      setUser(userData);
      sessionStorage.setItem('omega_user', JSON.stringify(userData));
      return true;
    }

    // 2. Check custom employee accounts
    const empAccount = employeeAccounts.find(acc => acc.username === username && acc.password === password);
    if (empAccount) {
      const employee = employees.find(e => e.id === empAccount.id);
      const userData = { 
        name: employee?.name || empAccount.username, 
        role: empAccount.role,
        employeeId: empAccount.id 
      };
      setUser(userData);
      sessionStorage.setItem('omega_user', JSON.stringify(userData));
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('omega_user');
  };

  // Fetch all data from API (excluding customers, which are handled by useCustomers)
  const fetchData = async () => {
    try {
      const endpoints = [
        'prospects',
        'quotations',
        'job-orders',
        'invoices',
        'receivables',
        'vendors',
        'purchase-orders',
        'salaries',
        'other-expenses',
        'employees',
        'employee-accounts',
        'company-bank-accounts'
      ];
      const dataPromises = endpoints.map((endpoint) =>
        apiRequest(endpoint).catch((err) => {
          console.warn(`Fetch failed for ${endpoint}: ${err.message}`);
          return [];
        })
      );
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
      setJobOrders(safeParse(joData, ['photos', 'costs', 'containerNo', 'vehicleNo', 'driverName']));
      setInvoices(safeParse(invData, ['extra_charges', 'tax_deduction_proof', 'taxes_deducted', 'paymentProofPhoto', 'signedInvoicePhoto', 'signedReceiptPhoto']));
      setReceivables(safeParse(recData, ['extra_charges', 'tax_deduction_proof', 'taxes_deducted', 'paymentProofPhoto', 'signedInvoicePhoto', 'signedReceiptPhoto']));
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
    fetchData();
  }, []);

  const addCustomer = async (customer) => {
    const newCustomer = { ...customer, id: `CUST-${Date.now().toString().slice(-4)}` };
    // Use the mutation provided by useCustomers (optimistic update handled there)
    await addCustomerHook(newCustomer);
    return newCustomer;
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

  const convertProspectToCustomer = async (id) => {
    const prospect = prospects.find(p => p.id === id);
    if (prospect) {
      const customer = await addCustomer({
        name: prospect.name,
        phone: prospect.phone,
        email: prospect.email,
        address: prospect.address
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
      id: `JO-${Date.now().toString().slice(-6)}`,
      status: 'pending',
      containerNo: '',
      vehicleNo: '',
      driverName: '',
      activityStatus: '',
      photos: [],
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

  const dispatchJO = async (joId, quantity) => {
    await updateJOStatus(joId, { status: 'dispatched', issueQuantity: quantity });
  };

  const updateJOStatus = async (joId, updates) => {
    // Optimistic update
    setJobOrders(prev => prev.map(jo => 
      jo.id === joId ? { ...jo, ...updates } : jo
    ));

    await apiRequest(`job-orders/${joId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  };

  const completeJO = async (joId) => {
    await updateJOStatus(joId, { status: 'done' });
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

  const createInvoice = async (joId) => {
    console.log("Starting createInvoice for JO ID:", joId);
    const jo = jobOrders.find(j => String(j.id) === String(joId));
    if (!jo) {
      console.error("Job Order not found in local state for ID:", joId);
      return null;
    }
    
    const quotation = jo.quotationId 
      ? quotations.find(q => String(q.id) === String(jo.quotationId))
      : null;
    
    // Defensive parsing for quotation items
    let items = [];
    if (quotation && quotation.items) {
      try {
        items = typeof quotation.items === 'string' ? JSON.parse(quotation.items) : quotation.items;
      } catch (e) {
        console.error("Failed to parse quotation items:", e);
        items = [];
      }
    }

    if (!Array.isArray(items)) items = [];
    
    // Find rate for selected activity (using description as matched in AdminHub)
    const targetDesc = (jo.instruction || jo.jobDescription || "").trim().toLowerCase();
    const item = items.find(i => (i.description || "").trim().toLowerCase() === targetDesc);
    
    // Ensure rate is a valid number using cleanNumber
    let rate = 0;
    if (item && item.rate) {
      rate = cleanNumber(item.rate);
    } else {
      rate = cleanNumber(jo.rate);
    }

    const qty = cleanNumber(jo.issueQuantity || jo.quantity || 1);
    const amount = rate * qty;
    
    console.log(`Calculated amount: ${amount} (Rate: ${rate}, Qty: ${qty})`);
    
    if (isNaN(amount)) {
      console.error("Calculated amount is NaN. Rate:", rate, "Qty:", qty);
      throw new Error("Gagal menghitung nominal invoice (Data tidak valid).");
    }

    const newInvoice = {
      // Use more robust ID generation
      id: `INV-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      joId,
      customerName: jo.customerName || 'Pelanggan',
      amount: amount,
      subtotal: amount,
      tax: 0,
      date: new Date().toISOString(),
      status: 'unpaid',
      extra_charges: [],
      signedReceiptPhoto: null,
      signedInvoicePhoto: null,
      deliveryStatus: 'not_sent'
    };
    
    try {
      const data = await apiRequest('invoices', {
        method: 'POST',
        body: JSON.stringify(newInvoice)
      });
      
      const { id } = data;
      const finalInvoice = { ...newInvoice, id: id || newInvoice.id };
      
      // Update local state
      setInvoices(prev => [...prev, finalInvoice]);
      setReceivables(prev => [...prev, { ...finalInvoice, balance: finalInvoice.amount }]);
      setJobOrders(prev => prev.map(j => String(j.id) === String(joId) ? { ...j, status: 'invoiced' } : j));
      
      return finalInvoice;
    } catch (error) {
      console.error("Failed to create invoice:", error);
      throw error;
    }
  };

  const settleInvoice = async (invoiceId, paymentProofPhoto, taxesDeducted, taxDeductionProof) => {
    const totalTax = Array.isArray(taxesDeducted) ? taxesDeducted.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0) : 0;
    
    await apiRequest(`invoices/${invoiceId}/settle`, { 
      method: 'PUT',
      body: JSON.stringify({ paymentProofPhoto, taxesDeducted, taxDeductionProof })
    });
    setInvoices(prev => prev.map(inv => 
      inv.id === invoiceId ? { 
        ...inv, 
        status: 'paid', 
        paymentProofPhoto,
        tax_deduction: totalTax, 
        taxes_deducted: taxesDeducted,
        tax_deduction_proof: taxDeductionProof 
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
        tax_deduction_proof: taxDeductionProof 
      } : r
    ));
  };

  const settleReceivable = async (invoiceId) => {
    await settleInvoice(invoiceId);
  };

  const deleteCustomer = async (id) => {
    await apiRequest(`customers/${id}`, { method: 'DELETE' });
    setCustomers(prev => prev.filter(c => c.id !== id));
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
      alert("Masalah koneksi saat mencoba menghapus.");
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
    setCustomers([]);
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
      user, login, logout,
      language, toggleLanguage, t,
      theme, toggleTheme, loading,
      customers, addCustomer, deleteCustomer,
      vendors, addVendor, updateVendor, deleteVendor,
      purchaseOrders, createPurchaseOrder, issuePurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, patchPurchaseOrderLocal,
      prospects, addProspect, updateProspectStatus, convertProspectToCustomer, deleteProspect,
      prospectDrafts,
      quotations, createQuotation, approveQuotation, unapproveQuotation, deleteQuotation,
      jobOrders, createJO, dispatchJO, updateJOStatus, completeJO, deleteJO,
      invoices, createInvoice, settleInvoice, deleteInvoice, updateInvoice,
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





