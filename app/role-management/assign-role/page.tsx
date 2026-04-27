'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import TopBar from '@/app/components/TopBar';
import SelectDropdown from '@/app/components/SelectDropdown';
import { Search, User, ChevronRight, RefreshCw } from 'lucide-react';
import { auth } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL;

interface ApiUser {
  id: string;
  name: string;
  employeeId: string;
  department: string | null;
  roles: string[];
}

interface ApiRole {
  id: string;
  name: string;
}

const GRADIENTS = [
  'linear-gradient(135deg,#2db9a3,#6366f1)',
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#06b6d4,#2db9a3)',
  'linear-gradient(135deg,#8b5cf6,#ec4899)',
  'linear-gradient(135deg,#f59e0b,#06b6d4)',
];

function Toast({ msg, type, onDone }: { msg: string; type: 'success' | 'error'; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, padding:'14px 20px', borderRadius:12, fontSize:13.5, fontWeight:600, fontFamily:"'Open Sans',sans-serif", boxShadow:'0 8px 24px rgba(0,0,0,0.12)', background:type==='success'?'#ecfdf5':'#fef2f2', color:type==='success'?'#059669':'#dc2626', border:`1px solid ${type==='success'?'#a7f3d0':'#fecaca'}` }}>
      {msg}
    </div>
  );
}

export default function AssignRole() {
  const router = useRouter();
  const [activeMenu, setActiveMenu]     = useState('assign-role');
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [users, setUsers]               = useState<ApiUser[]>([]);
  const [roles, setRoles]               = useState<ApiRole[]>([]);
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [newRoleId, setNewRoleId]       = useState('');
  const [newRoleName, setNewRoleName]   = useState('');
  const [searchTerm, setSearchTerm]     = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [lastTxn, setLastTxn]           = useState<string | null>(null);
  const [toast, setToast]               = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [uRes, rRes] = await Promise.all([
        fetch(`${API}/users`, { headers: { Authorization: `Bearer ${auth.getToken()}` } }),
        fetch(`${API}/roles`, { headers: { Authorization: `Bearer ${auth.getToken()}` } }),
      ]);
      setUsers(await uRes.json());
      setRoles(await rRes.json());
    } catch { setToast({ msg: 'Failed to load data', type: 'error' }); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssign = async () => {
    if (!selectedUser || !newRoleId) return;
    setSubmitting(true);
    try {
      const res  = await fetch(`${API}/roles/assign`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.getToken()}` },
        body: JSON.stringify({
          userId:  selectedUser.id,
          roleId:  newRoleId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLastTxn(data.txnId);
        setToast({ msg: `Role assigned to ${selectedUser.name} — TXN: ${data.txnId}`, type: 'success' });
        setSelectedUser(null);
        setNewRoleId('');
        setNewRoleName('');
        fetchData();
      } else setToast({ msg: data.message || 'Failed to assign', type: 'error' });
    } catch { setToast({ msg: 'Server error', type: 'error' }); }
    finally { setSubmitting(false); }
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap');
        *{box-sizing:border-box;}
        .asr-root{display:flex;height:100vh;background:#fff;overflow:hidden;font-family:'Open Sans',sans-serif;}
        .asr-main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .asr-scroll{flex:1;overflow-y:auto;padding:28px 32px;scrollbar-width:thin;scrollbar-color:#2db9a3 transparent;min-height:0;}
        .asr-scroll::-webkit-scrollbar{width:6px;}
        .asr-scroll::-webkit-scrollbar-track{background:transparent;}
        .asr-scroll::-webkit-scrollbar-thumb{background:#2db9a3;border-radius:3px;}
        .content-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;height:fit-content;}
        .card{background:#fff;border:1.5px solid #e2e8f0;border-radius:18px;overflow:hidden;}
        .card-header{padding:18px 22px 14px;border-bottom:1px solid #f1f5f9;}
        .card-title{font-size:14px;font-weight:600;color:#0f172a;margin-bottom:12px;}
        .search-wrap{position:relative;}
        .search-input{width:100%;padding:9px 14px 9px 36px;border-radius:10px;border:1.5px solid #e2e8f0;font-size:13px;color:#1e293b;background:#f8fafc;font-family:'Open Sans',sans-serif;outline:none;}
        .search-input:focus{border-color:#2db9a3;}
        .user-list{overflow-y:auto;max-height:460px;}
        .user-item{display:flex;align-items:center;gap:12px;padding:13px 22px;cursor:pointer;border-bottom:1px solid #f8fafc;transition:background 0.13s;position:relative;}
        .user-item:hover{background:#fafbfc;}
        .user-item.active{background:rgba(45,185,163,0.05);}
        .user-item.active::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:#2db9a3;border-radius:0 2px 2px 0;}
        .u-avatar{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:600;flex-shrink:0;}
        .assign-panel{padding:22px;}
        .field-label{font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;display:block;}
        .assign-btn{width:100%;padding:11px;border-radius:10px;border:none;background:#2db9a3;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:'Open Sans',sans-serif;margin-top:16px;}
        .assign-btn:disabled{opacity:0.5;cursor:not-allowed;}
        .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:52px 20px;text-align:center;}
        .txn-box{background:#f0fdf9;border:1px solid #a7f3d0;border-radius:10px;padding:12px 14px;margin-top:16px;}
        .refresh-btn{display:flex;align-items:center;gap:6px;padding:7px 14px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;font-size:13px;font-family:'Open Sans',sans-serif;color:#64748b;cursor:pointer;}
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <div className="asr-root">
        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={() => { auth.clear(); router.push('/'); }} />
        <div className="asr-main">
          <TopBar title="Role Management" />
          <div className="asr-scroll">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
              <div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#2db9a3', background:'rgba(45,185,163,0.08)', padding:'4px 10px', borderRadius:20, marginBottom:8 }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:'#2db9a3' }}/>Role Management
                </div>
                <h1 style={{ fontSize:22, fontWeight:700, color:'#1a2332', margin:'0 0 4px' }}>Assign Role</h1>
                <p style={{ fontSize:13, color:'#8a9ab0', margin:0 }}>Assign or change roles — logged in Audit Logs with a TXN ID</p>
              </div>
              <button className="refresh-btn" onClick={fetchData}><RefreshCw size={13}/> Refresh</button>
            </div>

            <div className="content-grid">
              {/* User List */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Select User</div>
                  <div className="search-wrap">
                    <Search size={14} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
                    <input className="search-input" placeholder="Search by name or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                  </div>
                </div>
                <div className="user-list">
                  {filtered.length === 0 ? (
                    <div className="empty-state"><p style={{ fontSize:13, color:'#94a3b8' }}>No users found.</p></div>
                  ) : filtered.map((u, i) => (
                    <div key={u.id} className={`user-item${selectedUser?.id===u.id?' active':''}`} onClick={() => { setSelectedUser(u); setNewRoleId(''); setNewRoleName(''); }}>
                      <div className="u-avatar" style={{ background:GRADIENTS[i%GRADIENTS.length] }}>{getInitials(u.name)}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>{u.name}</div>
                        <div style={{ fontSize:11, color:'#94a3b8' }}>{u.employeeId} · {u.department || '—'}</div>
                      </div>
                      <span style={{ fontSize:11, padding:'3px 9px', borderRadius:20, background:'rgba(45,185,163,0.1)', color:'#2db9a3', fontWeight:700 }}>{u.roles[0] || 'No role'}</span>
                      <ChevronRight size={14} style={{ color:'#94a3b8' }}/>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assign Panel */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Assign New Role</div>
                </div>
                {selectedUser ? (
                  <div className="assign-panel">
                    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px', background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:12, marginBottom:18 }}>
                      <div className="u-avatar" style={{ width:44, height:44, fontSize:14, background:GRADIENTS[users.findIndex(u=>u.id===selectedUser.id)%GRADIENTS.length] }}>{getInitials(selectedUser.name)}</div>
                      <div>
                        <div style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{selectedUser.name}</div>
                        <div style={{ fontSize:12, color:'#94a3b8' }}>{selectedUser.employeeId}</div>
                      </div>
                    </div>

                    <div style={{ marginBottom:24 }}>
                      <label className="field-label">Current Role</label>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700, padding:'6px 14px', borderRadius:20, background:'rgba(45,185,163,0.1)', color:'#2db9a3' }}>
                        {selectedUser.roles[0] || 'No role assigned'}
                      </span>
                    </div>

                    <div style={{ marginBottom:16 }}>
                      <label className="field-label">New Role</label>
                      <SelectDropdown
                        options={roles.map(r => r.name)}
                        value={newRoleName}
                        onChange={name => {
                          setNewRoleName(name);
                          const found = roles.find(r => r.name === name);
                          setNewRoleId(found?.id ?? '');
                        }}
                        placeholder="Select role..."
                      />
                    </div>

                    <button className="assign-btn" onClick={handleAssign} disabled={!newRoleId || submitting}>
                      {submitting ? 'Assigning...' : 'Assign Role'}
                    </button>

                    {lastTxn && (
                      <div className="txn-box">
                        <div style={{ fontSize:11, fontWeight:700, color:'#059669', marginBottom:4 }}>✅ Last Assignment</div>
                        <div style={{ fontSize:12, color:'#064e3b', fontFamily:'monospace' }}>TXN: {lastTxn}</div>
                        <div style={{ fontSize:11, color:'#6ee7b7', marginTop:2 }}>Logged in Audit Logs & Transaction Trail</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="empty-state">
                    <User size={32} color="#d0dce6" style={{ marginBottom:10 }}/>
                    <p style={{ fontSize:13, color:'#94a3b8' }}>Select a user from the list</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
