'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import TopBar from '@/app/components/TopBar';
import SelectDropdown from '@/app/components/SelectDropdown';
import { Search, UserX, AlertTriangle, Shield } from 'lucide-react';
import { auth, fetchArray } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL;
const ROWS_PER_PAGE = 10;

interface ApiUser {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string | null;
  status: string;
  roles: string[];
  lastLogin: string | null;
}

function Toast({ msg, type, onDone }: { msg: string; type: 'success' | 'error'; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 9999, padding: '14px 20px', borderRadius: 12, fontSize: 13.5, fontWeight: 600, fontFamily: "'Open Sans',sans-serif", boxShadow: '0 8px 24px rgba(0,0,0,0.12)', background: type === 'success' ? '#ecfdf5' : '#fef2f2', color: type === 'success' ? '#059669' : '#dc2626', border: `1px solid ${type === 'success' ? '#a7f3d0' : '#fecaca'}` }}>
      {msg}
    </div>
  );
}

export default function DeactivateUser() {
  const router = useRouter();
  const [activeMenu, setActiveMenu]     = useState('deactivate-user');
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [users, setUsers]               = useState<ApiUser[]>([]);
  const [deactivated, setDeactivated]   = useState<ApiUser[]>([]);
  const [currentPage, setCurrentPage]   = useState(1);
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [searchTerm, setSearchTerm]     = useState('');
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [reason, setReason]             = useState('');
  const [notes, setNotes]               = useState('');
  const [toast, setToast]               = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchArray(`${API}/users`);
      setUsers(data.filter((u: ApiUser) => u.status.toLowerCase() !== 'inactive'));
      setDeactivated(data.filter((u: ApiUser) => u.status.toLowerCase() === 'inactive'));
    } catch { setToast({ msg: 'Failed to load users', type: 'error' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeactivate = async () => {
    if (!selectedUser || !reason) return;
    setSubmitting(true);
    try {
      const res  = await fetch(`${API}/users/${selectedUser.id}/deactivate`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.getToken()}` },
        body:    JSON.stringify({ reason, notes }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ msg: `${selectedUser.name} has been deactivated`, type: 'success' });
        setSelectedUser(null);
        setReason('');
        setNotes('');
        fetchUsers();
      } else {
        setToast({ msg: data.message || 'Failed to deactivate', type: 'error' });
      }
    } catch { setToast({ msg: 'Server error', type: 'error' }); }
    finally { setSubmitting(false); }
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
    return d.toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;}
        .du-root{display:flex;height:100vh;background:#fff;overflow:hidden;font-family:'Open Sans',sans-serif;}
        .du-main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .du-scroll{flex:1;overflow-y:auto;padding:28px 32px;scrollbar-width:thin;scrollbar-color:#e2e8f0 transparent;}
        .du-scroll::-webkit-scrollbar{width:6px;}
        .du-scroll::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:3px;}
        .du-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:28px;}
        .du-card{background:#fff;border:1px solid #e8ecf1;border-radius:16px;padding:22px;box-shadow:0 2px 10px rgba(0,0,0,0.04);}
        .du-search-wrap{position:relative;margin-bottom:12px;}
        .du-search-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:#b0bece;pointer-events:none;}
        .du-input{width:100%;height:38px;padding:0 12px 0 34px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:'Open Sans',sans-serif;color:#1a2332;background:#fff;outline:none;}
        .du-input:focus{border-color:#2db9a3;}
        .du-user-list{max-height:380px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;}
        .du-user-item{padding:12px;border:1px solid #e8ecf1;border-radius:10px;cursor:pointer;transition:all 0.15s;display:flex;align-items:center;gap:12px;}
        .du-user-item:hover{background:#f8fafc;border-color:#d0dce6;}
        .du-user-item.selected{border-color:#e55353;background:rgba(229,83,83,0.04);}
        .du-avatar{width:36px;height:36px;border-radius:50%;background:#2db9a3;color:#fff;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .du-select,.du-textarea,.du-plain-input{width:100%;padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:'Open Sans',sans-serif;color:#1a2332;background:#fff;outline:none;transition:border-color 0.18s;}
        .du-select:focus,.du-textarea:focus,.du-plain-input:focus{border-color:#2db9a3;}
        .du-select{cursor:pointer;height:40px;}
        .du-textarea{min-height:80px;resize:none;}
        .du-warning{background:rgba(229,83,83,0.05);border:1px solid rgba(229,83,83,0.3);border-radius:8px;padding:12px 14px;display:flex;gap:10px;margin-bottom:14px;}
        .du-btn{width:100%;height:42px;border-radius:9px;border:none;font-size:13px;font-weight:600;font-family:'Open Sans',sans-serif;cursor:pointer;transition:all 0.18s;}
        .du-btn-deactivate{background:#e55353;color:#fff;}
        .du-btn-deactivate:hover:not(:disabled){background:#d44;}
        .du-btn-deactivate:disabled{opacity:0.5;cursor:not-allowed;}
        .du-deact-table{background:#fff;border:1px solid #e8ecf1;border-radius:16px;overflow:hidden;display:flex;flex-direction:column;min-height:380px;}
        table{width:100%;border-collapse:collapse;font-family:'Open Sans',sans-serif;flex:1;}
        thead tr{background:#f8fafc;border-bottom:1px solid #edf0f5;}
        thead th{padding:11px 18px;text-align:left;font-size:10.5px;font-weight:600;color:#a0aec0;text-transform:uppercase;letter-spacing:0.08em;}
        tbody tr{border-bottom:1px solid #f4f6f9;}
        tbody tr:last-child{border-bottom:none;}
        tbody tr:hover{background:#fafbfd;}
        tbody td{padding:13px 18px;font-size:13px;color:#1e293b;vertical-align:middle;}
        .du-refresh-btn{display:flex;align-items:center;gap:6px;padding:7px 14px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;font-size:13px;font-family:'Open Sans',sans-serif;color:#64748b;cursor:pointer;}
        .du-refresh-btn:hover{background:#f5f7fa;}
        .du-pagination-bar{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-top:1px solid #f0f3f7;}
        .du-pagination-info{font-size:13px;color:#94a3b8;}
        .du-pagination-info strong{color:#475569;font-weight:600;}
        .du-pagination-controls{display:flex;align-items:center;gap:10px;}
        .du-pagination-btn{display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:6px;border:1px solid #e2e8f0;background:#fff;color:#64748b;cursor:pointer;font-size:12px;font-weight:600;transition:all 0.18s;}
        .du-pagination-btn:hover:not(:disabled){background:#f1f5f9;border-color:#cbd5e1;color:#475569;}
        .du-pagination-btn:disabled{opacity:0.5;cursor:not-allowed;}
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <div className="du-root">
        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={() => { auth.clear(); router.push('/'); }} />
        <div className="du-main">
          <TopBar title="Deactivate User" />
          <div className="du-scroll">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2332', margin: '0 0 4px' }}>Deactivate User</h1>
                <p style={{ fontSize: 13, color: '#8a9ab0', margin: 0 }}>Deactivate user accounts and revoke system access</p>
              </div>
            </div>

            <div className="du-grid">
              {/* Left — User List */}
              <div className="du-card">
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a2332', margin: '0 0 14px' }}>Active Users</h2>
                <div className="du-search-wrap">
                  <Search size={14} className="du-search-icon" />
                  <input className="du-input" placeholder="Search by name or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="du-user-list">
                  {loading ? (
                    <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>Loading...</p>
                  ) : filtered.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>No users found.</p>
                  ) : filtered.map(u => (
                    <div key={u.id} className={`du-user-item${selectedUser?.id === u.id ? ' selected' : ''}`} onClick={() => setSelectedUser(u)}>
                      <div className="du-avatar">{getInitials(u.name)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2332' }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: '#8a9ab0' }}>{u.employeeId} · {u.roles[0] ?? 'User'} · {u.department ?? '—'}</div>
                      </div>
                      <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: '#e8f9f6', color: '#1a7a6c', fontWeight: 600 }}>{u.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — Deactivate Form */}
              <div className="du-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <UserX size={20} color="#e55353" />
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a2332', margin: 0 }}>Deactivate Account</h2>
                </div>

                {selectedUser ? (
                  <>
                    <div style={{ background: 'rgba(229,83,83,0.05)', border: '1px solid rgba(229,83,83,0.3)', borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Selected User</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2332' }}>{selectedUser.name}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{selectedUser.employeeId} · {selectedUser.roles[0] ?? 'User'}</div>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <SelectDropdown
                        label="Reason for Deactivation *"
                        options={['Terminated', 'Resigned', 'Policy Violation', 'Security Concern', 'Role Change']}
                        value={reason}
                        onChange={(value) => setReason(value)}
                        placeholder="Select reason..."
                      />
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Additional Notes</label>
                      <textarea className="du-textarea" placeholder="Enter details..." value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>

                    <div className="du-warning">
                      <AlertTriangle size={15} color="#e55353" style={{ flexShrink: 0, marginTop: 1 }} />
                      <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>This will immediately revoke all access, terminate active sessions, and log the action in the audit trail.</p>
                    </div>

                    <button className="du-btn du-btn-deactivate" disabled={!reason || submitting} onClick={handleDeactivate}>
                      {submitting ? 'Deactivating...' : 'Deactivate Account'}
                    </button>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <Shield size={36} color="#d0dce6" style={{ marginBottom: 12 }} />
                    <p style={{ fontSize: 13, color: '#94a3b8' }}>Select a user from the list to deactivate</p>
                  </div>
                )}
              </div>
            </div>

            {/* Previously Deactivated */}
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a2332', margin: '0 0 14px' }}>Previously Deactivated</h2>
            <div className="du-deact-table">
              <table>
                <thead>
                  <tr>{['Name', 'Employee ID', 'Role', 'Department', 'Status'].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {deactivated.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>No deactivated users.</td></tr>
                  ) : (() => {
                    const totalPages = Math.max(1, Math.ceil(deactivated.length / ROWS_PER_PAGE));
                    const safePage = Math.max(1, Math.min(currentPage, totalPages));
                    const start = (safePage - 1) * ROWS_PER_PAGE;
                    const paged = deactivated.slice(start, start + ROWS_PER_PAGE);
                    return paged.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1a2332' }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: '#8a9ab0' }}>{u.email}</div>
                      </td>
                      <td style={{ color: '#2db9a3', fontWeight: 600 }}>{u.employeeId}</td>
                      <td>{u.roles[0] ?? '—'}</td>
                      <td style={{ color: '#64748b' }}>{u.department ?? '—'}</td>
                      <td>
                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#fef9ec', color: '#b7791f', fontWeight: 600 }}>
                          Inactive
                        </span>
                      </td>
                    </tr>
                  ));})()}
                </tbody>
              </table>
              {deactivated.length > 0 && (() => {
                const totalPages = Math.max(1, Math.ceil(deactivated.length / ROWS_PER_PAGE));
                const safePage = Math.max(1, Math.min(currentPage, totalPages));
                return (
                  <div className="du-pagination-bar">
                    <span className="du-pagination-info">
                      Showing <strong>{deactivated.length === 0 ? 0 : (safePage - 1) * ROWS_PER_PAGE + 1}–{Math.min(safePage * ROWS_PER_PAGE, deactivated.length)}</strong> of <strong>{deactivated.length}</strong>
                    </span>
                    <div className="du-pagination-controls">
                      <button className="du-pagination-btn" disabled={safePage <= 1} onClick={() => setCurrentPage(safePage - 1)}>←</button>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#475569', minWidth: 40, textAlign: 'center' }}>{safePage} / {totalPages}</span>
                      <button className="du-pagination-btn" disabled={safePage >= totalPages} onClick={() => setCurrentPage(safePage + 1)}>→</button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
