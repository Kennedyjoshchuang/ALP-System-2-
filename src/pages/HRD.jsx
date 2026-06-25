import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useConfirm } from '../context/ConfirmContext';
import toast from 'react-hot-toast';
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  Phone, 
  CreditCard, 
  ShieldCheck, 
  Trash2, 
  Edit2, 
  X, 
  Check,
  Building,
  Hash,
  Key,
  RotateCcw,
  Settings2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HRD = () => {
  const confirm = useConfirm();
  const { 
    employees = [], addEmployee, updateEmployee, deleteEmployee,
    employeeAccounts = [], addEmployeeAccount, updateEmployeeAccount, deleteEmployeeAccount,
    t, user, language, hasAccess 
  } = useApp();
  const isID = language === 'id';
  const canWrite = hasAccess ? hasAccess('hrd', true) : false;

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isEditAccount, setIsEditAccount] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isAccountSubmitting, setIsAccountSubmitting] = useState(false);
  const [createAccountError, setCreateAccountError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    nik: '',
    npwp: '',
    position: '',
    email: '',
    accountNumber: '',
    bankName: ''
  });

  const [accountData, setAccountData] = useState({
    username: '',
    password: '',
    permissions: {}
  });

  const filteredEmployees = (employees || []).filter(emp => 
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const isEditing = !!selectedEmployee;
      if (isEditing) {
        await updateEmployee(selectedEmployee.id, formData);
        toast.success(isID ? 'Data karyawan berhasil diperbarui!' : 'Employee data successfully updated!');
      } else {
        await addEmployee(formData);
        toast.success(isID ? 'Karyawan baru berhasil ditambahkan!' : 'New employee successfully added!');
      }
      setIsAddModalOpen(false);
      setSelectedEmployee(null);
      setFormData({
        name: '', address: '', phone: '', nik: '', npwp: '',
        position: '', email: '', accountNumber: '', bankName: ''
      });
    } catch (err) {
      console.error('Gagal menyimpan karyawan:', err);
      const msg = err.message || (isID ? 'Terjadi kesalahan. Coba lagi.' : 'An error occurred. Please try again.');
      setSubmitError(msg);
      toast.error((isID ? 'Gagal menyimpan: ' : 'Failed to save: ') + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    
    setIsAccountSubmitting(true);
    setCreateAccountError('');
    try {
      const finalRoleStr = JSON.stringify(accountData.permissions);
      const payload = { username: accountData.username, password: accountData.password, role: finalRoleStr };

      if (isEditAccount) {
        if (!accountData.password) delete payload.password; // optional password update
        await updateEmployeeAccount(selectedEmployee.id, payload);
        toast.success(isID ? 'Akses sistem berhasil diperbarui!' : 'System access successfully updated!');
      } else {
        await addEmployeeAccount({
          id: selectedEmployee.id,
          ...payload
        });
        toast.success(isID ? 'Akses sistem berhasil diberikan!' : 'System access successfully granted!');
      }
      setIsAccountModalOpen(false);
      setIsEditAccount(false);
      setSelectedEmployee(null);
      setAccountData({ username: '', password: '', permissions: {} });
    } catch (err) {
      console.error('Gagal membuat akun:', err);
      const msg = err.message || (isID ? 'Terjadi kesalahan. Coba lagi.' : 'An error occurred. Please try again.');
      setCreateAccountError(msg);
      toast.error((isID ? 'Gagal memberi akses: ' : 'Failed to grant access: ') + msg);
    } finally {
      setIsAccountSubmitting(false);
    }
  };

  const getAccount = (empId) => (employeeAccounts || []).find(acc => acc.id === empId);

  return (
    <div className="page-container">
      <div className="header-actions no-print" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '350px' }}>
          <input
            type="text"
            placeholder={isID ? "Cari karyawan..." : "Search employee..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            style={{ width: '100%', padding: '12px 20px 12px 50px', borderRadius: '15px' }}
          />
          <Search size={20} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
        
        {canWrite && (
          <button 
            className="btn btn-primary"
            onClick={() => {
              setSelectedEmployee(null);
              setSubmitError('');
              setFormData({
                name: '', address: '', phone: '', nik: '', npwp: '',
                position: '', email: '', accountNumber: '', bankName: ''
              });
              setIsAddModalOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 25px' }}
          >
            <UserPlus size={20} />
            {isID ? 'Tambahkan Karyawan' : 'Add Employee'}
          </button>
        )}
      </div>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-container"><table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '20px' }}>{isID ? 'Nama & Jabatan' : 'Name & Position'}</th>
              <th style={{ padding: '20px' }}>{isID ? 'Kontak' : 'Contact'}</th>
              <th style={{ padding: '20px' }}>{isID ? 'Identitas (NIK/NPWP)' : 'Identity (NIK/NPWP)'}</th>
              <th style={{ padding: '20px' }}>{isID ? 'Rekening Bank' : 'Bank Account'}</th>
              <th style={{ padding: '20px' }}>{isID ? 'Akses Sistem' : 'System Access'}</th>
              <th style={{ padding: '20px' }}>{isID ? 'Aksi' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredEmployees.map((emp) => {
                const account = getAccount(emp.id);
                const isSelf = user && user.employeeId === emp.id;
                return (
                  <motion.tr 
                    key={emp.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ borderBottom: '1px solid var(--border)' }}
                    className="table-row-hover"
                  >
                    <td style={{ padding: '20px' }}>
                      <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text)' }}>{emp.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>{emp.position || '-'}</div>
                    </td>
                    <td style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', marginBottom: '4px' }}>
                        <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                        {emp.email || '-'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                        <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                        {emp.phone || '-'}
                      </div>
                    </td>
                    <td style={{ padding: '20px' }}>
                      <div style={{ fontSize: '0.85rem', marginBottom: '4px' }}>NIK: <span style={{ color: 'var(--text-muted)' }}>{emp.nik || '-'}</span></div>
                      <div style={{ fontSize: '0.85rem' }}>NPWP: <span style={{ color: 'var(--text-muted)' }}>{emp.npwp || '-'}</span></div>
                    </td>
                    <td style={{ padding: '20px' }}>
                      <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{emp.bankName || '-'}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{emp.accountNumber || '-'}</div>
                    </td>
                    <td style={{ padding: '20px' }}>
                      {account ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontSize: '0.85rem', background: 'var(--success-bg)', padding: '6px 12px', borderRadius: '100px', width: 'fit-content' }}>
                            <ShieldCheck size={14} />
                            {account.username}
                          </div>
                          {canWrite && !isSelf ? (
                            <>
                              <button 
                                title={isID ? "Edit Akses" : "Edit Access"}
                                onClick={() => {
                                  setSelectedEmployee(emp);
                                  let perms = {};
                                  if (account.role && account.role.startsWith('{')) {
                                    try { perms = JSON.parse(account.role); } catch(e) {}
                                  } else {
                                    const rm = account.role;
                                    if (rm === 'marketing') perms = { marketing: 'write' };
                                    else if (rm === 'accounting') perms = { accounting: 'write' };
                                    else if (rm === 'executor') perms = { executor: 'write' };
                                    else if (rm === 'admin') perms = { admin: 'write', procurement: 'write' };
                                    else if (rm === 'hrd') perms = { hrd: 'write' };
                                  }
                                  setAccountData({ username: account.username, password: '', permissions: perms });
                                  setIsEditAccount(true);
                                  setIsAccountModalOpen(true);
                                }}
                                className="btn-icon" 
                                style={{ padding: '6px', width: '32px', height: '32px' }}
                              >
                                <Settings2 size={14} />
                              </button>
                              <button 
                                title={isID ? "Hapus Akses" : "Remove Access"}
                                onClick={async () => {
                                  const confirmed = await confirm(
                                    isID ? `Hapus akses sistem untuk ${emp.name}?` : `Remove system access for ${emp.name}?`,
                                    {
                                      title: isID ? "Hapus Akses" : "Remove Access",
                                      confirmText: isID ? "Hapus" : "Remove",
                                      cancelText: isID ? "Batal" : "Cancel",
                                      isDanger: true
                                    }
                                  );
                                  if (confirmed) {
                                    deleteEmployeeAccount(emp.id);
                                  }
                                }}
                                className="btn-icon" 
                                style={{ padding: '6px', width: '32px', height: '32px', color: 'var(--danger)', background: 'var(--danger-bg)' }}
                              >
                                <X size={14} />
                              </button>
                            </>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {isSelf ? (isID ? 'Akun Anda' : 'Your Account') : (isID ? 'Hanya Baca' : 'Read Only')}
                            </span>
                          )}
                        </div>
                      ) : (
                        canWrite ? (
                          <button 
                            onClick={() => {
                              setSelectedEmployee(emp);
                              setIsEditAccount(false);
                              setAccountData({ username: '', password: '', permissions: {} });
                              setIsAccountModalOpen(true);
                            }}
                            className="btn-text" 
                            style={{ fontSize: '0.8rem', color: 'var(--secondary)', textDecoration: 'underline' }}
                          >
                            {isID ? 'Beri Akses' : 'Grant Access'}
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>-</span>
                        )
                      )}
                    </td>
                    <td style={{ padding: '20px' }}>
                      {canWrite && !isSelf ? (
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button 
                            className="btn-icon" 
                            onClick={() => {
                              setSelectedEmployee(emp);
                              setFormData({ ...emp });
                              setIsAddModalOpen(true);
                            }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="btn-icon" 
                            style={{ color: 'var(--danger)', background: 'var(--danger-bg)' }}
                            onClick={async () => {
                              const confirmed = await confirm(
                                isID ? `Hapus karyawan ${emp.name}?` : `Delete employee ${emp.name}?`,
                                {
                                  title: isID ? "Hapus Karyawan" : "Delete Employee",
                                  confirmText: isID ? "Hapus" : "Delete",
                                  cancelText: isID ? "Batal" : "Cancel",
                                  isDanger: true
                                }
                              );
                              if (confirmed) {
                                deleteEmployee(emp.id);
                              }
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {isSelf ? (isID ? 'Akun Anda' : 'Your Account') : '-'}
                        </span>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table></div>
        {filteredEmployees.length === 0 && (
          <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
            <Users size={64} style={{ opacity: 0.1, marginBottom: '20px' }} />
            <p>{isID ? 'Belum ada data karyawan.' : 'No employee data available.'}</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="modal-content" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>{selectedEmployee ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}</h3>
              <button className="close-btn" onClick={() => setIsAddModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '30px' }}>
              <div className="grid-responsive-2">
                <div className="input-group">
                  <label>Nama Lengkap</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Masukkan nama lengkap" />
                </div>
                <div className="input-group">
                  <label>Jabatan</label>
                  <input required type="text" value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} placeholder="Contoh: Marketing, Accounting, dll" />
                </div>
                <div className="input-group">
                  <label>NIK</label>
                  <input required type="text" value={formData.nik} onChange={e => setFormData({ ...formData, nik: e.target.value })} placeholder="Nomor Induk Kependudukan" />
                </div>
                <div className="input-group">
                  <label>NPWP (Opsional)</label>
                  <input type="text" value={formData.npwp} onChange={e => setFormData({ ...formData, npwp: e.target.value })} placeholder="Nomor Pokok Wajib Pajak" />
                </div>
                <div className="input-group">
                  <label>Nomor Telepon</label>
                  <input required type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="08xxxxxxxxxx" />
                </div>
                <div className="input-group">
                  <label>Alamat Email</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@perusahaan.com" />
                </div>
                <div className="input-group">
                  <label>Nama Bank</label>
                  <input required type="text" value={formData.bankName} onChange={e => setFormData({ ...formData, bankName: e.target.value })} placeholder="Contoh: BCA, Mandiri, BRI" />
                </div>
                <div className="input-group">
                  <label>Nomor Rekening</label>
                  <input required type="text" value={formData.accountNumber} onChange={e => setFormData({ ...formData, accountNumber: e.target.value })} placeholder="Nomor rekening bank" />
                </div>
                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label>Alamat Lengkap</label>
                  <textarea required value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Alamat sesuai KTP" style={{ minHeight: '80px' }} />
                </div>
              </div>
              {submitError && (
                <div style={{ marginTop: '16px', padding: '12px 16px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '10px', color: 'var(--danger)', fontSize: '0.85rem' }}>
                  ⚠️ {submitError}
                </div>
              )}
              <div style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 1 }}>
                  {isSubmitting ? 'Memproses...' : (selectedEmployee ? 'Simpan Perubahan' : 'Tambahkan Karyawan')}
                </button>
                <button type="button" disabled={isSubmitting} className="btn btn-secondary" onClick={() => { setIsAddModalOpen(false); setSubmitError(''); }} style={{ flex: 1 }}>Batal</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Account Creation Modal */}
      {isAccountModalOpen && (
        <div className="modal-overlay">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>{isEditAccount ? (isID ? 'Edit Akses Sistem' : 'Edit System Access') : (isID ? 'Beri Akses Sistem' : 'Grant System Access')}</h3>
              <button className="close-btn" onClick={() => { setIsAccountModalOpen(false); setIsEditAccount(false); }}><X size={24} /></button>
            </div>
            <div style={{ padding: '20px 30px', background: 'var(--secondary-bg)', borderBottom: '1px solid var(--border)' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Karyawan: <strong style={{ color: 'var(--secondary)' }}>{selectedEmployee?.name}</strong></p>
            </div>
            <form onSubmit={handleCreateAccount} style={{ padding: '30px' }}>
              <div className="input-group">
                <label>Username</label>
                <div style={{ position: 'relative' }}>
                  <input required type="text" value={accountData.username} onChange={e => setAccountData({ ...accountData, username: e.target.value })} placeholder="Pilih username unik" style={{ paddingLeft: '45px' }} />
                  <Users size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>
              <div className="input-group" style={{ marginTop: '20px' }}>
                <label>Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    required={!isEditAccount} 
                    type="password" 
                    value={accountData.password} 
                    onChange={e => setAccountData({ ...accountData, password: e.target.value })} 
                    placeholder={isEditAccount ? (isID ? "Kosongkan jika tidak ingin mengubah password" : "Leave blank if you do not want to change password") : "Minimal 6 karakter"} 
                    style={{ paddingLeft: '45px' }} 
                  />
                  <Key size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>
              <div className="input-group" style={{ marginTop: '20px' }}>
                <label style={{ display: 'block', marginBottom: '15px', fontWeight: 'bold' }}>Hak Akses Sistem (System Permissions)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { key: 'marketing', label: 'Marketing (Pemasaran)' },
                    { key: 'admin', label: 'Admin Office' },
                    { key: 'procurement', label: 'Procurement (Pengadaan)' },
                    { key: 'executor', label: 'Executor (Pelaksana)' },
                    { key: 'accounting', label: 'Accounting (Akuntansi)' },
                    { key: 'hrd', label: 'HRD' },
                    { key: 'systemControl', label: 'System Control (Admin Sistem)', warning: true }
                  ].map(mod => {
                    const hasPerm = accountData.permissions[mod.key] && accountData.permissions[mod.key] !== 'none';
                    const isWrite = accountData.permissions[mod.key] === 'write';
                    
                    return (
                      <div key={mod.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input 
                            type="checkbox" 
                            checked={!!hasPerm}
                            onChange={(e) => {
                              const newPerms = { ...accountData.permissions };
                              if (e.target.checked) newPerms[mod.key] = 'read';
                              else delete newPerms[mod.key];
                              setAccountData({ ...accountData, permissions: newPerms });
                            }}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                          <span style={{ fontWeight: '600', color: mod.warning ? 'var(--danger)' : 'var(--text)' }}>
                            {mod.label}
                          </span>
                        </div>
                        {hasPerm && (
                          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); const newPerms = { ...accountData.permissions }; newPerms[mod.key] = 'read'; setAccountData({ ...accountData, permissions: newPerms }); }}
                              style={{ padding: '6px 12px', fontSize: '0.8rem', background: !isWrite ? 'var(--secondary)' : 'transparent', color: !isWrite ? '#000' : 'var(--text-muted)', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                            >
                              Read Only
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); const newPerms = { ...accountData.permissions }; newPerms[mod.key] = 'write'; setAccountData({ ...accountData, permissions: newPerms }); }}
                              style={{ padding: '6px 12px', fontSize: '0.8rem', background: isWrite ? 'var(--success)' : 'transparent', color: isWrite ? '#fff' : 'var(--text-muted)', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                            >
                              Read & Write
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              {createAccountError && (
                <div style={{ marginTop: '16px', padding: '12px 16px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '10px', color: 'var(--danger)', fontSize: '0.85rem' }}>
                  ⚠️ {createAccountError}
                </div>
              )}
              <div style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
                <button type="submit" disabled={isAccountSubmitting} className="btn btn-primary" style={{ flex: 1 }}>
                  {isAccountSubmitting ? (isID ? 'Memproses...' : 'Processing...') : (isEditAccount ? (isID ? 'Simpan Perubahan' : 'Save Changes') : (isID ? 'Beri Akses' : 'Grant Access'))}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default HRD;

