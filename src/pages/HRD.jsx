import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
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
  const { 
    employees = [], addEmployee, updateEmployee, deleteEmployee,
    employeeAccounts = [], addEmployeeAccount, updateEmployeeAccount, deleteEmployeeAccount,
    t, user, language 
  } = useApp();
  const isID = language === 'id';

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
    role: 'staff'
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
      if (isEditAccount) {
        await updateEmployeeAccount(selectedEmployee.id, accountData);
        toast.success(isID ? 'Akses sistem berhasil diperbarui!' : 'System access successfully updated!');
      } else {
        await addEmployeeAccount({
          id: selectedEmployee.id,
          ...accountData
        });
        toast.success(isID ? 'Akses sistem berhasil diberikan!' : 'System access successfully granted!');
      }
      setIsAccountModalOpen(false);
      setIsEditAccount(false);
      setSelectedEmployee(null);
      setAccountData({ username: '', password: '', role: 'staff' });
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '0.85rem', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '100px', width: 'fit-content' }}>
                            <ShieldCheck size={14} />
                            {account.username}
                          </div>
                          <button 
                            title={isID ? "Reset Akses" : "Reset Access"}
                            onClick={() => {
                              setSelectedEmployee(emp);
                              setAccountData({ username: account.username, password: '', role: account.role });
                              setIsEditAccount(true);
                              setIsAccountModalOpen(true);
                            }}
                            className="btn-icon" 
                            style={{ padding: '6px', width: '32px', height: '32px' }}
                          >
                            <RotateCcw size={14} />
                          </button>
                          <button 
                            title={isID ? "Hapus Akses" : "Remove Access"}
                            onClick={() => {
                              if (confirm(isID ? `Hapus akses sistem untuk ${emp.name}?` : `Remove system access for ${emp.name}?`)) {
                                deleteEmployeeAccount(emp.id);
                              }
                            }}
                            className="btn-icon" 
                            style={{ padding: '6px', width: '32px', height: '32px', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setIsEditAccount(false);
                            setAccountData({ username: '', password: '', role: 'staff' });
                            setIsAccountModalOpen(true);
                          }}
                          className="btn-text" 
                          style={{ fontSize: '0.8rem', color: 'var(--secondary)', textDecoration: 'underline' }}
                        >
                          {isID ? 'Beri Akses' : 'Grant Access'}
                        </button>
                      )}
                    </td>
                    <td style={{ padding: '20px' }}>
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
                          style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }}
                          onClick={() => {
                            if (confirm(isID ? `Hapus karyawan ${emp.name}?` : `Delete employee ${emp.name}?`)) {
                              deleteEmployee(emp.id);
                            }
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
                <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', color: '#ef4444', fontSize: '0.85rem' }}>
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
              <h3>{isEditAccount ? 'Reset Akses Sistem' : 'Beri Akses Sistem'}</h3>
              <button className="close-btn" onClick={() => { setIsAccountModalOpen(false); setIsEditAccount(false); }}><X size={24} /></button>
            </div>
            <div style={{ padding: '20px 30px', background: 'rgba(212, 175, 55, 0.05)', borderBottom: '1px solid var(--border)' }}>
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
                  <input required type="password" value={accountData.password} onChange={e => setAccountData({ ...accountData, password: e.target.value })} placeholder="Minimal 6 karakter" style={{ paddingLeft: '45px' }} />
                  <Key size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>
              <div className="input-group" style={{ marginTop: '20px' }}>
                <label>Role / Akses</label>
                <select 
                  value={accountData.role} 
                  onChange={e => setAccountData({ ...accountData, role: e.target.value })} 
                  style={{ background: 'var(--input-bg)', color: 'var(--text)', border: '2px solid var(--secondary)', borderRadius: '12px', padding: '12px', width: '100%', fontWeight: '600' }}
                >
                  <option value="marketing" style={{ background: 'var(--bg)', color: 'var(--text)' }}>Marketing</option>
                  <option value="accounting" style={{ background: 'var(--bg)', color: 'var(--text)' }}>Accounting</option>
                  <option value="executor" style={{ background: 'var(--bg)', color: 'var(--text)' }}>Executor</option>
                  <option value="admin" style={{ background: 'var(--bg)', color: 'var(--text)' }}>Admin Office</option>
                  <option value="hrd" style={{ background: 'var(--bg)', color: 'var(--text)' }}>HRD</option>
                  <option value="staff" style={{ background: 'var(--bg)', color: 'var(--text)' }}>Staff (View Only)</option>
                </select>
              </div>
              {createAccountError && (
                <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', color: '#ef4444', fontSize: '0.85rem' }}>
                  ⚠️ {createAccountError}
                </div>
              )}
              <div style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
                <button type="submit" disabled={isAccountSubmitting} className="btn btn-primary" style={{ flex: 1 }}>
                  {isAccountSubmitting ? 'Memproses...' : (isEditAccount ? 'Update Akses' : 'Buat Akun')}
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

