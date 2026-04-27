'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import TopBar from '@/app/components/TopBar';
import {
  Search, Filter, UserPlus, Users, Pencil,
  Trash2, KeyRound, MoreHorizontal, ChevronLeft,
  ChevronRight, X, AlertTriangle, RefreshCw, ChevronDown,
} from 'lucide-react';
import { auth } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL;
const ROWS_PER_PAGE = 8;

interface ApiUser {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string | null;
  status: string;
  mfaEnabled: boolean;
  lastLogin: string | null;
  roles: string[];
}

// ── Custom Select ─────────────────────────────────────────────
function CustomSelect({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);
  const displayLabel = selected ? selected.label : options[0]?.label ?? 'Select';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', width: 160 }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: 20,
          border: `1.5px solid ${open ? '#2db9a3' : '#e2e8f0'}`,
          fontSize: 13,
          color: open ? '#2db9a3' : '#64748b',
          background: open ? '#f0fdf9' : '#fff',
          cursor: 'pointer',
          fontFamily: "'Open Sans', sans-serif",
          fontWeight: 600,
          outline: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          transition: 'all 0.18s',
        }}
      >
        <Filter size={14} style={{ flexShrink: 0, color: open ? '#2db9a3' : '#94a3b8' }} />
        <span style={{ flex: 1, textAlign: 'left' }}>{displayLabel}</span>
        <ChevronDown
          size={14}
          style={{
            flexShrink: 0,
            color: open ? '#2db9a3' : '#94a3b8',
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 5px)',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
            zIndex: 9999,
            overflow: 'hidden',
          }}
        >
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                width: '100%',
                padding: '9px 12px',
                fontSize: 13,
                color: opt.value === value ? '#2db9a3' : '#1e293b',
                background: opt.value === value ? 'rgba(45,185,163,0.08)' : '#fff',
                fontWeight: opt.value === value ? 700 : 500,
                fontFamily: "'Open Sans', sans-serif",
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'block',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.background = opt.value === value ? 'rgba(45,185,163,0.12)' : '#f8fafc';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.background = opt.value === value ? 'rgba(45,185,163,0.08)' : '#fff';
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────
function ConfirmDialog({ open, onClose, title, description, confirmLabel = 'Confirm', onConfirm, danger = true }: {
  open: boolean; onClose: () => void; title: string; description: string;
  confirmLabel?: string; onConfirm: () => void; danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div style={{ position:'fixed',inset:0,zIndex:1000,background:'rgba(15,23,42,0.45)',display:'flex',alignItems:'center',justifyContent:'center' }}
      onClick={onClose}>
      <div style={{ background:'#fff',borderRadius:16,padding:'28px 28px 24px',width:420,maxWidth:'90vw',boxShadow:'0 20px 60px rgba(0,0,0,0.18)',fontFamily:"'Open Sans',sans-serif" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex',gap:14,alignItems:'flex-start',marginBottom:20 }}>
          <div style={{ width:40,height:40,borderRadius:10,background:danger?'#fef2f2':'#e8f9f6',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <AlertTriangle size={18} color={danger?'#e55353':'#2db9a3'} />
          </div>
          <div>
            <div style={{ fontWeight:700,fontSize:15,color:'#1a2332',marginBottom:6 }}>{title}</div>
            <div style={{ fontSize:13,color:'#64748b',lineHeight:1.6 }}>{description}</div>
          </div>
        </div>
        <div style={{ display:'flex',justifyContent:'flex-end',gap:10 }}>
          <button onClick={onClose} style={{ padding:'8px 18px',borderRadius:8,border:'1px solid #e2e8f0',background:'#fff',color:'#475569',fontSize:13,fontWeight:600,fontFamily:"'Open Sans',sans-serif",cursor:'pointer' }}>Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }} style={{ padding:'8px 18px',borderRadius:8,border:'none',background:danger?'#e55353':'#2db9a3',color:'#fff',fontSize:13,fontWeight:600,fontFamily:"'Open Sans',sans-serif",cursor:'pointer' }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Dialog ───────────────────────────────────────────────
function EditDialog({ open, onClose, user, onSaved }: {
  open: boolean; onClose: () => void; user: ApiUser | null; onSaved: () => void;
}) {
  const [form, setForm] = useState({ name:'', email:'', role:'', department:'', status:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    if (user) setForm({ name: user.name, email: user.email, role: user.roles[0] ?? '', department: user.department ?? '', status: user.status });
  }, [user]);

  if (!open || !user) return null;

  const fInput: React.CSSProperties = { width:'100%',height:38,padding:'0 12px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:13,fontFamily:"'Open Sans',sans-serif",color:'#1a2332',background:'#fff',outline:'none' };
  const fLabel: React.CSSProperties = { fontSize:13,fontWeight:600,display:'block',marginBottom:6,color:'#374151',fontFamily:"'Open Sans',sans-serif" };

  const handleSave = async () => {
    setError(null); setLoading(true);
    try {
      const res  = await fetch(`${API}/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${auth.getToken()}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) { onSaved(); onClose(); }
      else setError(data.message || 'Update failed');
    } catch { setError('Server error'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position:'fixed',inset:0,zIndex:1000,background:'rgba(15,23,42,0.45)',display:'flex',alignItems:'center',justifyContent:'center' }}
      onClick={onClose}>
      <div style={{ background:'#fff',borderRadius:16,padding:'24px 28px',width:500,maxWidth:'90vw',boxShadow:'0 20px 60px rgba(0,0,0,0.18)',fontFamily:"'Open Sans',sans-serif" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:20 }}>
          <div>
            <div style={{ fontWeight:700,fontSize:16,color:'#1a2332' }}>Edit User</div>
            <div style={{ fontSize:12,color:'#94a3b8',marginTop:3 }}>Update user account details</div>
          </div>
          <button onClick={onClose} style={{ width:28,height:28,borderRadius:7,border:'1px solid #e2e8f0',background:'#f8fafc',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#94a3b8' }}><X size={14}/></button>
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:14,marginBottom:20 }}>
          <div><label style={fLabel}>Full Name</label><input style={fInput} value={form.name} onChange={e => setForm({...form,name:e.target.value})} /></div>
          <div><label style={fLabel}>Email</label><input style={fInput} value={form.email} onChange={e => setForm({...form,email:e.target.value})} /></div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>
            <div>
              <label style={fLabel}>Role</label>
              <select style={{...fInput,cursor:'pointer'}} value={form.role} onChange={e => setForm({...form,role:e.target.value})}>
                {['Admin','Manager','Auditor','User'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={fLabel}>Status</label>
              <select style={{...fInput,cursor:'pointer'}} value={form.status} onChange={e => setForm({...form,status:e.target.value})}>
                {['Active','Inactive','Locked'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div><label style={fLabel}>Department</label><input style={fInput} value={form.department} onChange={e => setForm({...form,department:e.target.value})} /></div>
        </div>
        {error && <div style={{ fontSize:13,color:'#e55353',marginBottom:12 }}>⚠️ {error}</div>}
        <div style={{ display:'flex',justifyContent:'flex-end',gap:10 }}>
          <button onClick={onClose} style={{ padding:'8px 18px',borderRadius:8,border:'1px solid #e2e8f0',background:'#fff',color:'#475569',fontSize:13,fontWeight:600,fontFamily:"'Open Sans',sans-serif",cursor:'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={loading} style={{ padding:'8px 18px',borderRadius:8,border:'none',background:'#2db9a3',color:'#fff',fontSize:13,fontWeight:600,fontFamily:"'Open Sans',sans-serif",cursor:'pointer' }}>{loading?'Saving...':'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Dropdown Menu ─────────────────────────────────────────────
function InlineDropdown({ items }: { items: { label:string; icon:React.ReactNode; onClick:()=>void; danger?:boolean }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} style={{ position:'relative',display:'inline-block' }}>
      <button className="ua-action-btn" onClick={() => setOpen(o => !o)}><MoreHorizontal size={15}/></button>
      {open && (
        <div style={{ position:'absolute',right:0,top:'110%',zIndex:200,background:'#fff',border:'1px solid #e2e8f0',borderRadius:10,boxShadow:'0 8px 24px rgba(0,0,0,0.10)',minWidth:168,padding:'4px 0',fontFamily:"'Open Sans',sans-serif" }}>
          {items.map((item,i) => (
            <div key={i}>
              {item.danger && i>0 && <div style={{ height:1,background:'#f1f5f9',margin:'4px 0' }}/>}
              <button onClick={() => { item.onClick(); setOpen(false); }}
                style={{ display:'flex',alignItems:'center',gap:9,width:'100%',padding:'8px 14px',background:'none',border:'none',cursor:'pointer',fontSize:13,fontWeight:500,color:item.danger?'#e55353':'#1e293b',fontFamily:"'Open Sans',sans-serif",textAlign:'left' }}
                onMouseEnter={e => e.currentTarget.style.background=item.danger?'#fef2f2':'#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background='none'}>
                {item.icon}{item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────
function Toast({ msg, type, onDone }: { msg:string; type:'success'|'error'; onDone:()=>void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position:'fixed',bottom:24,right:24,zIndex:9999,padding:'14px 20px',borderRadius:12,fontSize:13.5,fontWeight:600,fontFamily:"'Open Sans',sans-serif",boxShadow:'0 8px 24px rgba(0,0,0,0.12)',background:type==='success'?'#ecfdf5':'#fef2f2',color:type==='success'?'#059669':'#dc2626',border:`1px solid ${type==='success'?'#a7f3d0':'#fecaca'}` }}>
      {msg}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function UserAccounts() {
  const router = useRouter();
  const [activeMenu, setActiveMenu]   = useState('user-accounts');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [users, setUsers]             = useState<ApiUser[]>([]);
  const [loading, setLoading]         = useState(true);
  const [searchTerm, setSearchTerm]   = useState('');
  // ── FIXED: default to 'all' so "All Roles" / "All Status" shows on load ──
  const [roleFilter, setRoleFilter]     = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage]               = useState(1);
  const [editTarget, setEditTarget]   = useState<ApiUser|null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<ApiUser|null>(null);
  const [resetTarget, setResetTarget] = useState<ApiUser|null>(null);
  const [toast, setToast]             = useState<{msg:string;type:'success'|'error'}|null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/users`, { headers:{ Authorization:`Bearer ${auth.getToken()}` } });
      const data = await res.json();
      setUsers(data);
    } catch { setToast({ msg:'Failed to load users', type:'error' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      const res  = await fetch(`${API}/users/${deactivateTarget.id}/deactivate`, {
        method: 'PUT',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${auth.getToken()}` },
        body: JSON.stringify({ reason: 'Deactivated by admin' }),
      });
      const data = await res.json();
      if (data.success) { setToast({ msg:`${deactivateTarget.name} deactivated`, type:'success' }); fetchUsers(); }
      else setToast({ msg: data.message||'Failed', type:'error' });
    } catch { setToast({ msg:'Server error', type:'error' }); }
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    try {
      const res  = await fetch(`${API}/users/${resetTarget.id}/reset-password`, {
        method: 'POST',
        headers: { Authorization:`Bearer ${auth.getToken()}` },
      });
      const data = await res.json();
      if (data.success) setToast({ msg:`Reset link sent to ${resetTarget.email}`, type:'success' });
      else setToast({ msg: data.message||'Failed', type:'error' });
    } catch { setToast({ msg:'Server error', type:'error' }); }
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
    return d.toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  };

  const filtered = users.filter(u => {
    if (roleFilter !== 'all' && !u.roles.includes(roleFilter)) return false;
    if (statusFilter !== 'all' && u.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.employeeId.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage-1)*ROWS_PER_PAGE, safePage*ROWS_PER_PAGE);

  const statusCfg: Record<string,{bg:string;color:string;dot:string}> = {
    active:   { bg:'#e8f9f6', color:'#1a7a6c', dot:'#2db9a3' },
    inactive: { bg:'#fef9ec', color:'#b7791f', dot:'#e5a623' },
    locked:   { bg:'#fef2f2', color:'#c0392b', dot:'#e55353' },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;}
        .ua-root{display:flex;height:100vh;background:#fff;overflow:hidden;font-family:'Open Sans',sans-serif;}
        .ua-main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .ua-scroll{flex:1;overflow-y:auto;padding:28px 32px;scrollbar-width:thin;scrollbar-color:#e2e8f0 transparent;}
        .ua-scroll::-webkit-scrollbar{width:6px;}
        .ua-scroll::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:3px;}
        .ua-page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;}
        .ua-page-header h1{font-size:22px;font-weight:600;color:#1a2332;margin:0 0 4px;}
        .ua-page-header p{font-size:13px;color:#8a9ab0;margin:0;}
        .ua-add-btn{display:flex;align-items:center;gap:7px;padding:9px 18px;background:#2db9a3;color:#fff;border:none;border-radius:9px;font-size:13px;font-weight:600;font-family:'Open Sans',sans-serif;cursor:pointer;transition:background 0.18s;}
        .ua-add-btn:hover{background:#24a08d;}
        .ua-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;}
        .ua-stat-card{background:#fff;border:1px solid #e8ecf1;border-radius:14px;padding:18px 20px;display:flex;align-items:center;gap:14px;}
        .ua-stat-icon{width:42px;height:42px;border-radius:10px;background:#e8f9f6;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .ua-stat-icon.red{background:#fef2f2;}
        .ua-stat-val{font-size:22px;font-weight:700;color:#1a2332;line-height:1;}
        .ua-stat-label{font-size:12px;color:#8a9ab0;margin-top:3px;}
        .ua-filters{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:18px;}
        .ua-search-wrap{position:relative;flex:1;min-width:180px;max-width:280px;}
        .ua-search-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:#b0bece;pointer-events:none;}
        .ua-input{width:100%;height:36px;padding:0 12px 0 34px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:'Open Sans',sans-serif;color:#1a2332;background:#fff;outline:none;}
        .ua-input:focus{border-color:#2db9a3;}
        .ua-count{margin-left:auto;font-size:13px;color:#8a9ab0;white-space:nowrap;}
        .ua-card{background:#fff;border:1px solid #e8ecf1;border-radius:16px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.04);}
        .ua-table-wrap{overflow-x:auto;}
        table{width:100%;border-collapse:collapse;min-width:900px;font-family:'Open Sans',sans-serif;}
        thead tr{background:#f8fafc;border-bottom:1px solid #edf0f5;}
        thead th{padding:11px 18px;text-align:left;font-size:10.5px;font-weight:600;color:#a0aec0;text-transform:uppercase;letter-spacing:0.08em;white-space:nowrap;}
        tbody tr{border-bottom:1px solid #f4f6f9;transition:background 0.13s;}
        tbody tr:last-child{border-bottom:none;}
        tbody tr:hover{background:#fafbfd;}
        tbody td{padding:14px 18px;font-size:13px;color:#1e293b;vertical-align:middle;}
        .ua-avatar{width:34px;height:34px;border-radius:50%;background:#2db9a3;color:#fff;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .ua-user-name{font-size:13px;font-weight:600;color:#1a2332;}
        .ua-user-email{font-size:11px;color:#8a9ab0;margin-top:1px;}
        .ua-empid{font-size:12px;font-weight:600;color:#2db9a3;}
        .ua-badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap;}
        .badge-dot{width:6px;height:6px;border-radius:50%;margin-right:5px;flex-shrink:0;}
        .ua-action-btn{width:30px;height:30px;border-radius:7px;border:1px solid #e8ecf1;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#8a9ab0;transition:all 0.15s;}
        .ua-action-btn:hover{background:#f5f7fa;color:#2db9a3;border-color:#d0d9e5;}
        .ua-pagination{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-top:1px solid #f0f3f7;flex-wrap:wrap;gap:10px;}
        .ua-pag-info{font-size:12.5px;color:#8a9ab0;}
        .ua-pag-info strong{color:#1a2332;font-weight:600;}
        .ua-pag-btns{display:flex;align-items:center;gap:10px;}
        .ua-pag-btn{width:32px;height:32px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;color:#4a5568;font-size:13px;font-weight:500;font-family:'Open Sans',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s;}
        .ua-pag-btn:hover:not(:disabled){background:#f0fdf9;color:#2db9a3;border-color:#2db9a3;}
        .ua-pag-btn:disabled{opacity:0.4;cursor:not-allowed;}
        .ua-pag-counter{font-size:13px;color:#4a5568;font-weight:500;min-width:45px;text-align:center;}
        .ua-refresh-btn{display:flex;align-items:center;gap:6px;padding:7px 14px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;font-size:13px;font-family:'Open Sans',sans-serif;color:#64748b;cursor:pointer;}
        .ua-refresh-btn:hover{background:#f5f7fa;}
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <div className="ua-root">
        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={() => { auth.clear(); router.push('/'); }} />
        <div className="ua-main">
          <TopBar title="User Accounts" />
          <div className="ua-scroll">
            <div className="ua-page-header">
              <div><h1>User Accounts</h1><p>Manage all system users</p></div>
              <button className="ua-add-btn" onClick={() => router.push('/users-accounts/add-user')}><UserPlus size={15}/> Add User</button>
            </div>

            <div className="ua-stats">
              {[
                { label:'Total Users',  value: users.length, red:false },
                { label:'Active',       value: users.filter(u => u.status.toLowerCase()==='active').length,   red:false },
                { label:'Inactive',     value: users.filter(u => u.status.toLowerCase()==='inactive').length, red:true  },
                { label:'MFA Enabled',  value: users.filter(u => u.mfaEnabled).length,                       red:false },
              ].map(s => (
                <div key={s.label} className="ua-stat-card">
                  <div className={`ua-stat-icon${s.red?' red':''}`}><Users size={18} color={s.red?'#e55353':'#2db9a3'}/></div>
                  <div><div className="ua-stat-val">{s.value}</div><div className="ua-stat-label">{s.label}</div></div>
                </div>
              ))}
            </div>

            <div className="ua-filters">
              <div className="ua-search-wrap">
                <Search size={14} className="ua-search-icon"/>
                <input className="ua-input" placeholder="Search users..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }}/>
              </div>

              {/* Role filter — CustomSelect with "All Roles" as default */}
              <CustomSelect
                options={[
                  { value: 'all',     label: 'All Roles' },
                  { value: 'Admin',   label: 'Admin' },
                  { value: 'Manager', label: 'Manager' },
                  { value: 'Auditor', label: 'Auditor' },
                  { value: 'User',    label: 'User' },
                ]}
                value={roleFilter}
                onChange={val => { setRoleFilter(val); setPage(1); }}
              />

              {/* Status filter — CustomSelect with "All Status" as default */}
              <CustomSelect
                options={[
                  { value: 'all',      label: 'All Status' },
                  { value: 'active',   label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'locked',   label: 'Locked' },
                ]}
                value={statusFilter}
                onChange={val => { setStatusFilter(val); setPage(1); }}
              />

              <span className="ua-count">{filtered.length} users</span>
            </div>

            <div className="ua-card">
              <div className="ua-table-wrap">
                <table>
                  <thead>
                    <tr>{['User','Employee ID','Role','Department','MFA','Status','Last Login','Actions'].map(h => <th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={8} style={{ textAlign:'center',padding:'40px 0',color:'#94a3b8',fontSize:13 }}>Loading users...</td></tr>
                    ) : paginated.length === 0 ? (
                      <tr><td colSpan={8} style={{ textAlign:'center',padding:'40px 0',color:'#94a3b8',fontSize:13 }}>No users found.</td></tr>
                    ) : paginated.map(u => {
                      const s = statusCfg[u.status.toLowerCase()] ?? statusCfg.inactive;
                      return (
                        <tr key={u.id}>
                          <td>
                            <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                              <div className="ua-avatar">{getInitials(u.name)}</div>
                              <div><div className="ua-user-name">{u.name}</div><div className="ua-user-email">{u.email}</div></div>
                            </div>
                          </td>
                          <td><span className="ua-empid">{u.employeeId}</span></td>
                          <td><span className="ua-badge" style={{ background:'#e8f9f6',color:'#1a7a6c' }}>{u.roles[0] ?? '—'}</span></td>
                          <td style={{ color:'#64748b' }}>{u.department || '—'}</td>
                          <td><span className="ua-badge" style={{ background:u.mfaEnabled?'#e8f9f6':'#fef9ec',color:u.mfaEnabled?'#1a7a6c':'#b7791f' }}>{u.mfaEnabled?'Enabled':'Disabled'}</span></td>
                          <td>
                            <span className="ua-badge" style={{ background:s.bg,color:s.color }}>
                              <span className="badge-dot" style={{ background:s.dot }}/>
                              {u.status.charAt(0).toUpperCase()+u.status.slice(1)}
                            </span>
                          </td>
                          <td style={{ color:'#94a3b8',fontSize:12 }}>{u.lastLogin ? formatDate(u.lastLogin) : '—'}</td>
                          <td>
                            <InlineDropdown items={[
                              { label:'Edit',           icon:<Pencil size={13}/>,   onClick:() => setEditTarget(u) },
                              { label:'Reset Password', icon:<KeyRound size={13}/>, onClick:() => setResetTarget(u), danger:false },
                              { label:'Deactivate',     icon:<Trash2 size={13}/>,   onClick:() => setDeactivateTarget(u), danger:true },
                            ]}/>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="ua-pagination">
                <span className="ua-pag-info">
                  Showing <strong>{filtered.length===0?0:(safePage-1)*ROWS_PER_PAGE+1}–{Math.min(safePage*ROWS_PER_PAGE,filtered.length)}</strong> of <strong>{filtered.length}</strong>
                </span>
                <div className="ua-pag-btns">
                  <button className="ua-pag-btn" onClick={() => setPage(p => Math.max(1,p-1))} disabled={safePage===1}><ChevronLeft size={14}/></button>
                  <span className="ua-pag-counter">{safePage} / {totalPages}</span>
                  <button className="ua-pag-btn" onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={safePage===totalPages}><ChevronRight size={14}/></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditDialog open={!!editTarget} onClose={() => setEditTarget(null)} user={editTarget} onSaved={() => { fetchUsers(); setToast({ msg:'User updated', type:'success' }); }}/>
      <ConfirmDialog open={!!deactivateTarget} onClose={() => setDeactivateTarget(null)} title="Deactivate User" description={`Deactivate ${deactivateTarget?.name}? Their access will be immediately revoked.`} confirmLabel="Deactivate" onConfirm={handleDeactivate}/>
      <ConfirmDialog open={!!resetTarget} onClose={() => setResetTarget(null)} title="Reset Password" description={`Send a password reset link to ${resetTarget?.email}?`} confirmLabel="Send Reset Link" onConfirm={handleResetPassword} danger={false}/>
    </>
  );
}
