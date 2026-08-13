/**
 * Task Counter Utility
 * Calculates immediate doable/actionable tasks per module, strictly excluding passive waiting tasks.
 */

export const getTaskCounts = (context) => {
  if (!context) return {};

  const {
    user,
    hasAccess,
    prospects = [],
    quotations = [],
    jobOrders = [],
    invoices = [],
    purchaseOrders = [],
    otherExpenses = [],
    employees = [],
    employeeAccounts = [],
    maintenanceMode = false
  } = context;

  const counts = {};

  // 1. MARKETING
  if (hasAccess && hasAccess('marketing')) {
    // Blue: New prospects without quotation / uncontacted
    const newProspectsCount = (Array.isArray(prospects) ? prospects : []).filter(p => {
      return !p.status || p.status === 'pending' || p.status === 'new';
    }).length;

    // Amber: Pending & draft quotations created by marketing needing action/followup
    const pendingQuotesCount = (Array.isArray(quotations) ? quotations : []).filter(q => {
      return q.status === 'pending' || q.status === 'draft';
    }).length;

    const marketingBadges = [];
    if (newProspectsCount > 0) {
      marketingBadges.push({ type: 'blue', count: newProspectsCount, labelId: 'Prospek Baru', labelEn: 'New Leads' });
    }
    if (pendingQuotesCount > 0) {
      marketingBadges.push({ type: 'amber', count: pendingQuotesCount, labelId: 'Penawaran Pending', labelEn: 'Pending Quotes' });
    }
    if (marketingBadges.length > 0) counts.marketing = marketingBadges;
  }

  // 2. ADMIN OFFICE
  if (hasAccess && hasAccess('admin')) {
    const safeJobOrders = Array.isArray(jobOrders) ? jobOrders : [];
    const safeQuotations = Array.isArray(quotations) ? quotations : [];
    const safePOs = Array.isArray(purchaseOrders) ? purchaseOrders : [];

    // Amber: Approved quotations where customer agreed and admin must issue a JO
    const approvedQuotesToJO = safeQuotations.filter(q => {
      if (q.status !== 'approved') return false;
      const alreadyHasJO = safeJobOrders.some(jo => String(jo.quotationId) === String(q.id) || String(jo.quoteId) === String(q.id));
      return !alreadyHasJO;
    }).length;

    // Red: Job Orders waiting for Admin to generate Surat Jalan / dispatch
    const josNeedingSuratJalan = safeJobOrders.filter(jo => {
      if (jo.status === 'completed' || jo.status === 'done' || jo.status === 'invoiced' || jo.status === 'cancelled') return false;
      return !jo.dispatchedAt || jo.status === 'pending';
    }).length;

    // Blue: Pending POs to issue
    const pendingPOsCount = safePOs.filter(po => po.status === 'pending' || po.status === 'draft').length;

    const adminBadges = [];
    if (approvedQuotesToJO > 0) {
      adminBadges.push({ type: 'amber', count: approvedQuotesToJO, labelId: 'Siap Dibuat JO', labelEn: 'Ready for JO' });
    }
    if (josNeedingSuratJalan > 0) {
      adminBadges.push({ type: 'red', count: josNeedingSuratJalan, labelId: 'Perlu Surat Jalan', labelEn: 'Needs Surat Jalan' });
    }
    if (pendingPOsCount > 0) {
      adminBadges.push({ type: 'blue', count: pendingPOsCount, labelId: 'PO Tertunda', labelEn: 'Pending POs' });
    }
    if (adminBadges.length > 0) counts.admin = adminBadges;
  }

  // 3. PROCUREMENT
  if (hasAccess && hasAccess('procurement')) {
    const safePOs = Array.isArray(purchaseOrders) ? purchaseOrders : [];
    const draftPOs = safePOs.filter(po => po.status === 'pending' || po.status === 'draft').length;

    const procurementBadges = [];
    if (draftPOs > 0) {
      procurementBadges.push({ type: 'amber', count: draftPOs, labelId: 'Draf PO', labelEn: 'Draft POs' });
    }
    if (procurementBadges.length > 0) counts.procurement = procurementBadges;
  }

  // 4. EXECUTOR
  if (hasAccess && hasAccess('executor')) {
    const safeJobOrders = Array.isArray(jobOrders) ? jobOrders : [];
    const safeInvoices = Array.isArray(invoices) ? invoices : [];

    // Orange: Dispatched JOs actively running in field operations
    const inProgressJOs = safeJobOrders.filter(jo => {
      if (jo.status === 'completed' || jo.status === 'done' || jo.status === 'invoiced' || jo.status === 'cancelled') return false;
      return jo.status === 'dispatched' || jo.status === 'in_progress';
    }).length;

    // Amber: Finished JOs waiting in Pending Invoices tab
    const pendingInvoicesJOs = safeJobOrders.filter(jo => {
      const isFinished = jo.status === 'done' || jo.shipmentStatus === 'done';
      if (!isFinished) return false;
      const alreadyInvoiced = safeInvoices.some(inv => 
        String(inv.joId) === String(jo.id) || 
        (Array.isArray(inv.consolidatedJOs) && inv.consolidatedJOs.map(String).includes(String(jo.id)))
      );
      return !alreadyInvoiced;
    }).length;

    const executorBadges = [];
    if (inProgressJOs > 0) {
      executorBadges.push({ type: 'orange', count: inProgressJOs, labelId: 'Pekerjaan Aktif', labelEn: 'Active Jobs' });
    }
    if (pendingInvoicesJOs > 0) {
      executorBadges.push({ type: 'amber', count: pendingInvoicesJOs, labelId: 'Invoice Tertunda', labelEn: 'Pending Invoices' });
    }
    if (executorBadges.length > 0) counts.executor = executorBadges;
  }

  // 5. ACCOUNTING
  if (hasAccess && hasAccess('accounting')) {
    const safeJobOrders = Array.isArray(jobOrders) ? jobOrders : [];
    const safeInvoices = Array.isArray(invoices) ? invoices : [];
    const safeExpenses = Array.isArray(otherExpenses) ? otherExpenses : [];
    const safePOs = Array.isArray(purchaseOrders) ? purchaseOrders : [];

    // Amber: Actionable invoices - only JOs where the shipment status has been explicitly set to 'done' and not yet invoiced (matches generate invoice button on Accounting page)
    const completedJOsNeedingInvoice = safeJobOrders.filter(jo => {
      if (jo.shipmentStatus !== 'done') return false;
      const alreadyInvoiced = safeInvoices.some(inv => {
        if (String(inv.joId) === String(jo.id)) return true;
        if (Array.isArray(inv.consolidatedJOs) && inv.consolidatedJOs.map(String).includes(String(jo.id))) return true;
        return false;
      });
      return !alreadyInvoiced;
    }).length;

    // Purple: Cost applications & expense reimbursements pending approval/disbursement
    const pendingExpenses = safeExpenses.filter(e => e.status === 'pending').length;

    // Blue: Unpaid POs awaiting disbursement
    const unpaidPOs = safePOs.filter(po => {
      const isUnpaid = po.paymentStatus === 'unpaid' || po.status === 'unpaid' || (!po.paymentStatus && po.status === 'approved');
      return isUnpaid && !po.paymentProofPhoto;
    }).length;

    const accountingBadges = [];
    if (completedJOsNeedingInvoice > 0) {
      accountingBadges.push({ type: 'amber', count: completedJOsNeedingInvoice, labelId: 'Perlu Invoice', labelEn: 'Needs Invoice' });
    }
    if (pendingExpenses > 0) {
      accountingBadges.push({ type: 'purple', count: pendingExpenses, labelId: 'Pengajuan Biaya', labelEn: 'Cost Approvals' });
    }
    if (unpaidPOs > 0) {
      accountingBadges.push({ type: 'blue', count: unpaidPOs, labelId: 'PO Belum Dibayar', labelEn: 'Unpaid POs' });
    }
    if (accountingBadges.length > 0) counts.accounting = accountingBadges;
  }

  // 6. COST APPLICATIONS
  if (hasAccess && (user?.role === 'owner' || hasAccess('costApplications') || hasAccess('accounting') || hasAccess('executor'))) {
    const safeExpenses = Array.isArray(otherExpenses) ? otherExpenses : [];
    const isApprover = user?.role === 'owner' || (hasAccess && hasAccess('accounting', true));

    const costBadges = [];
    if (isApprover) {
      const pendingApprovalCount = safeExpenses.filter(e => e.status === 'pending').length;
      if (pendingApprovalCount > 0) {
        costBadges.push({ type: 'purple', count: pendingApprovalCount, labelId: 'Perlu Persetujuan', labelEn: 'Needs Approval' });
      }
    } else {
      // Submitter role: show revisions needed
      const rejectedCount = safeExpenses.filter(e => e.status === 'rejected' && (e.applicant === user?.name || e.createdBy === user?.name)).length;
      if (rejectedCount > 0) {
        costBadges.push({ type: 'red', count: rejectedCount, labelId: 'Perlu Revisi', labelEn: 'Needs Revision' });
      }
    }
    if (costBadges.length > 0) counts.costApplications = costBadges;
  }

  // 7. HRD
  if (hasAccess && hasAccess('hrd')) {
    const safeEmployees = Array.isArray(employees) ? employees : [];
    const safeAccounts = Array.isArray(employeeAccounts) ? employeeAccounts : [];

    // Blue: Employees without account
    const missingAccounts = safeEmployees.filter(emp => {
      const hasAcc = safeAccounts.some(acc => acc.employeeId === emp.id || (emp.email && acc.email === emp.email) || acc.username === emp.name);
      return !hasAcc;
    }).length;

    // Amber: Employees with incomplete profiles
    const incompleteProfiles = safeEmployees.filter(emp => {
      return !emp.nik || !emp.phone || !emp.accountNumber;
    }).length;

    const hrdBadges = [];
    if (missingAccounts > 0) {
      hrdBadges.push({ type: 'blue', count: missingAccounts, labelId: 'Akun Belum Dibuat', labelEn: 'Missing Accounts' });
    }
    if (incompleteProfiles > 0) {
      hrdBadges.push({ type: 'amber', count: incompleteProfiles, labelId: 'Profil Belum Lengkap', labelEn: 'Incomplete Profiles' });
    }
    if (hrdBadges.length > 0) counts.hrd = hrdBadges;
  }

  // 8. SYSTEM CONTROL
  if (hasAccess && hasAccess('systemControl')) {
    if (maintenanceMode) {
      counts.systemControl = [
        { type: 'red', count: 1, labelId: 'Maintenance Aktif', labelEn: 'Maintenance Active' }
      ];
    }
  }

  return counts;
};
