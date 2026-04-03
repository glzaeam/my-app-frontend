'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import {
  Search, Filter, UserPlus, Users, Pencil,
  Trash2, KeyRound, MoreHorizontal, Bell, User,
  ChevronLeft, ChevronRight, X, AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ─── Data ─────────────────────────────────────────────────────────────────────

const initialUsers = [
  { id: 'ADM001', name: 'Sarah Johnson',  email: 'sarah.johnson@bank.com',  role: 'System Admin',   department: 'IT Security',     branch: 'Headquarters',    status: 'active',   lastLogin: '2 min ago',   mfa: true  },
  { id: 'MGR001', name: 'Michael Chen',   email: 'michael.chen@bank.com',   role: 'Branch Manager', department: 'Operations',       branch: 'Downtown Branch', status: 'active',   lastLogin: '5 min ago',   mfa: true  },
  { id: 'AUD001', name: 'Emily Davis',    email: 'emily.davis@bank.com',    role: 'Auditor',        department: 'Compliance',       branch: 'Headquarters',    status: 'active',   lastLogin: '15 min ago',  mfa: false },
  { id: 'TEL001', name: 'James Wilson',   email: 'james.wilson@bank.com',   role: 'Bank Teller',    department: 'Customer Service', branch: 'Main St Branch',  status: 'active',   lastLogin: '1 min ago',   mfa: false },
  { id: 'TEL002', name: 'Lisa Stone',     email: 'lisa.stone@bank.com',     role: 'Bank Teller',    department: 'Customer Service', branch: 'East Branch',     status: 'active',   lastLogin: '30 min ago',  mfa: false },
  { id: 'TEL003', name: 'Mark Brown',     email: 'mark.brown@bank.com',     role: 'Bank Teller',    department: 'Customer Service', branch: 'West Branch',     status: 'active',   lastLogin: '1 hour ago',  mfa: false },
  { id: 'MGR002', name: 'Rachel Park',    email: 'rachel.park@bank.com',    role: 'Branch Manager', department: 'Operations',       branch: 'East Branch',     status: 'active',   lastLogin: '2 hours ago', mfa: true  },
  { id: 'EMP042', name: 'Robert Lee',     email: 'robert.lee@bank.com',     role: 'Bank Teller',    department: 'Customer Service', branch: 'East Branch',     status: 'locked',   lastLogin: '3 hours ago', mfa: false },
  { id: 'EMP029', name: 'David Park',     email: 'david.park@bank.com',     role: 'Bank Teller',    department: 'Customer Service', branch: 'Downtown Branch', status: 'inactive', lastLogin: '5 days ago',  mfa: false },
];

type UserType = typeof initialUsers[0];
const ROWS_PER_PAGE = 5;

// ─── Inline: Confirm Dialog ───────────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = 'Confirm', onConfirm }: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={() => onOpenChange(false)}
    >
      <div
        style={{ background: '#fff', borderRadius: 16, padding: '28px 28px 24px', width: 420, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', fontFamily: "'Open Sans',sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={18} color="#e55353" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1a2332', marginBottom: 6 }}>{title}</div>
            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{description}</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={() => onOpenChange(false)} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 13, fontWeight: 600, fontFamily: "'Open Sans',sans-serif", cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={() => { onConfirm(); onOpenChange(false); }} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#e55353', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: "'Open Sans',sans-serif", cursor: 'pointer' }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Inline: Action Dialog ────────────────────────────────────────────────────

interface ActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  children: React.ReactNode;
}

function ActionDialog({ open, onOpenChange, title, description, confirmLabel = 'Save', onConfirm, children }: ActionDialogProps) {
  if (!open) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={() => onOpenChange(false)}
    >
      <div
        style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', width: 500, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', fontFamily: "'Open Sans',sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1a2332' }}>{title}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>{description}</div>
          </div>
          <button onClick={() => onOpenChange(false)} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          {children}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={() => onOpenChange(false)} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 13, fontWeight: 600, fontFamily: "'Open Sans',sans-serif", cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={() => { onConfirm(); onOpenChange(false); }} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#2db9a3', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: "'Open Sans',sans-serif", cursor: 'pointer' }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Inline: Dropdown Menu ────────────────────────────────────────────────────

interface DropdownItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

function InlineDropdown({ items }: { items: DropdownItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button className="ua-action-btn" onClick={() => setOpen((o) => !o)}>
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '110%', zIndex: 200, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.10)', minWidth: 168, padding: '4px 0', fontFamily: "'Open Sans',sans-serif" }}>
          {items.map((item, i) => (
            <div key={i}>
              {item.danger && i > 0 && <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />}
              <button
                onClick={() => { item.onClick(); setOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: item.danger ? '#e55353' : '#1e293b', fontFamily: "'Open Sans',sans-serif", textAlign: 'left', transition: 'background 0.13s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = item.danger ? '#fef2f2' : '#f8fafc')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                {item.icon}
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Shared field styles ──────────────────────────────────────────────────────

const fInput: React.CSSProperties = { width: '100%', height: 38, padding: '0 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontFamily: "'Open Sans',sans-serif", color: '#1a2332', background: '#fff', outline: 'none' };
const fLabel: React.CSSProperties = { fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6, color: '#374151', fontFamily: "'Open Sans',sans-serif" };

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UserAccounts() {
  const { toast } = useToast();
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState('user-accounts');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<UserType | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '', department: '', branch: '' });
  const [page, setPage] = useState(1);

  const handleLogout = () => router.push('/');

  const filtered = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.id.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);

  const handleDelete = () => {
    const user = users.find((u) => u.id === deleteTarget);
    setUsers((prev) => prev.filter((u) => u.id !== deleteTarget));
    toast({ title: 'User Removed', description: `${user?.name} has been deactivated and removed.` });
    setDeleteTarget(null);
  };

  const handleEdit = () => {
    if (!editTarget) return;
    setUsers((prev) => prev.map((u) => u.id === editTarget.id ? { ...u, ...editForm } : u));
    toast({ title: 'User Updated', description: `${editForm.name}'s profile has been updated.` });
    setEditTarget(null);
  };

  const openEdit = (user: UserType) => {
    setEditForm({ name: user.name, email: user.email, role: user.role, department: user.department, branch: user.branch });
    setEditTarget(user);
  };

  const handleResetPassword = (user: UserType) => {
    toast({ title: 'Password Reset', description: `A reset link was sent to ${user.email}.` });
  };

  const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').slice(0, 2);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .ua-root { display:flex; height:100vh; background:#ffffff; overflow:hidden; font-family:'Open Sans',sans-serif; }
        .ua-main { flex:1; display:flex; flex-direction:column; overflow:hidden; }
        .ua-topbar { height:64px; background:#fff; border-bottom:1px solid #e8ecf1; display:flex; align-items:center; justify-content:space-between; padding:0 32px; flex-shrink:0; box-shadow:0 1px 4px rgba(0,0,0,0.06); }
        .ua-topbar-title { font-size:16px; font-weight:600; color:#1a2332; margin:0; }
        .ua-topbar-right { display:flex; align-items:center; gap:12px; }
        .ua-notif-btn { width:38px; height:38px; border-radius:8px; border:1px solid #e8ecf1; background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#8a9ab0; transition:all 0.18s; }
        .ua-notif-btn:hover { background:#f5f7fa; color:#2db9a3; }
        .ua-profile-btn { display:flex; align-items:center; gap:8px; padding:6px 14px; border-radius:8px; border:1px solid #e8ecf1; background:#fff; cursor:pointer; color:#1a2332; font-weight:500; font-size:13px; font-family:'Open Sans',sans-serif; transition:all 0.18s; }
        .ua-profile-btn:hover { background:#f5f7fa; }
        .ua-scroll { flex:1; overflow-y:auto; padding:28px 32px; }
        .ua-page-header { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:24px; }
        .ua-page-header h1 { font-size:22px; font-weight:700; color:#1a2332; margin:0 0 4px; }
        .ua-page-header p { font-size:13px; color:#8a9ab0; margin:0; }
        .ua-add-btn { display:flex; align-items:center; gap:7px; padding:9px 18px; background:#2db9a3; color:#fff; border:none; border-radius:9px; font-size:13px; font-weight:600; font-family:'Open Sans',sans-serif; cursor:pointer; transition:background 0.18s,transform 0.1s; white-space:nowrap; }
        .ua-add-btn:hover { background:#24a08d; }
        .ua-add-btn:active { transform:scale(0.97); }
        .ua-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:22px; }
        @media(max-width:900px){ .ua-stats { grid-template-columns:repeat(2,1fr); } }
        .ua-stat-card { background:#fff; border:1px solid #e8ecf1; border-radius:14px; padding:18px 20px; display:flex; align-items:center; gap:14px; }
        .ua-stat-icon { width:42px; height:42px; border-radius:10px; background:#e8f9f6; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .ua-stat-icon.red { background:#fef2f2; }
        .ua-stat-val { font-size:22px; font-weight:700; color:#1a2332; line-height:1; }
        .ua-stat-label { font-size:12px; color:#8a9ab0; margin-top:3px; }
        .ua-filters { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:18px; }
        .ua-search-wrap { position:relative; flex:1; min-width:180px; max-width:280px; }
        .ua-search-icon { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:#b0bece; pointer-events:none; }
        .ua-input { width:100%; height:36px; padding:0 12px 0 34px; border:1px solid #e2e8f0; border-radius:8px; font-size:13px; font-family:'Open Sans',sans-serif; color:#1a2332; background:#fff; outline:none; transition:border-color 0.18s; }
        .ua-input:focus { border-color:#2db9a3; }
        .ua-select { height:36px; padding:0 10px; border:1px solid #e2e8f0; border-radius:8px; font-size:13px; font-family:'Open Sans',sans-serif; color:#1a2332; background:#fff; outline:none; cursor:pointer; }
        .ua-select:focus { border-color:#2db9a3; }
        .ua-count { margin-left:auto; font-size:13px; color:#8a9ab0; white-space:nowrap; }
        .ua-card { background:#fff; border:1px solid #e8ecf1; border-radius:16px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,0.04); }
        .ua-table-wrap { overflow-x:auto; }
        table { width:100%; border-collapse:collapse; min-width:900px; font-family:'Open Sans',sans-serif; }
        thead tr { background:#f8fafc; border-bottom:1px solid #edf0f5; }
        thead th { padding:11px 18px; text-align:left; font-size:10.5px; font-weight:700; color:#a0aec0; text-transform:uppercase; letter-spacing:0.08em; white-space:nowrap; }
        tbody tr { border-bottom:1px solid #f4f6f9; transition:background 0.13s; }
        tbody tr:last-child { border-bottom:none; }
        tbody tr:hover { background:#fafbfd; }
        tbody td { padding:14px 18px; font-size:13px; color:#1e293b; vertical-align:middle; }
        .ua-avatar { width:34px; height:34px; border-radius:50%; background:#2db9a3; color:#fff; font-size:11px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .ua-user-name { font-size:13px; font-weight:600; color:#1a2332; }
        .ua-user-email { font-size:11px; color:#8a9ab0; margin-top:1px; }
        .ua-empid { font-size:12px; font-weight:600; color:#2db9a3; }
        .ua-badge { display:inline-flex; align-items:center; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; white-space:nowrap; }
        .badge-role { background:#e8f9f6; color:#1a7a6c; }
        .badge-active { background:#e8f9f6; color:#1a7a6c; }
        .badge-locked { background:#fef2f2; color:#c0392b; }
        .badge-inactive { background:#fef9ec; color:#b7791f; }
        .badge-mfa-on { background:#e8f9f6; color:#1a7a6c; }
        .badge-mfa-off { background:#fef9ec; color:#b7791f; }
        .badge-dot { width:6px; height:6px; border-radius:50%; margin-right:5px; flex-shrink:0; }
        .dot-active { background:#2db9a3; }
        .dot-locked { background:#e55353; }
        .dot-inactive { background:#e5a623; }
        .ua-action-btn { width:30px; height:30px; border-radius:7px; border:1px solid #e8ecf1; background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#8a9ab0; transition:all 0.15s; }
        .ua-action-btn:hover { background:#f5f7fa; color:#2db9a3; border-color:#d0d9e5; }
        .ua-pagination { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; border-top:1px solid #f0f3f7; flex-wrap:wrap; gap:10px; }
        .ua-pag-info { font-size:12.5px; color:#8a9ab0; }
        .ua-pag-info strong { color:#1a2332; font-weight:600; }
        .ua-pag-btns { display:flex; align-items:center; gap:6px; }
        .ua-pag-btn { width:32px; height:32px; border-radius:8px; border:1px solid #e2e8f0; background:#fff; color:#4a5568; font-size:13px; font-weight:500; font-family:'Open Sans',sans-serif; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.15s; }
        .ua-pag-btn:hover:not(:disabled):not(.active) { background:#f0f3f7; border-color:#c8d0dc; }
        .ua-pag-btn.active { background:#2db9a3; color:#fff; border-color:#2db9a3; font-weight:700; }
        .ua-pag-btn:disabled { opacity:0.4; cursor:not-allowed; }
      `}</style>

      <div className="ua-root">
        <Sidebar
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onLogout={handleLogout}
        />

        <div className="ua-main">
          <div className="ua-topbar">
            <h1 className="ua-topbar-title">User Accounts</h1>
            <div className="ua-topbar-right">
              <button className="ua-notif-btn"><Bell size={18} /></button>
              <button className="ua-profile-btn" onClick={() => router.push('/my-profile')}>
                <User size={18} style={{ color: '#2db9a3' }} />
                Sarah Johnson
              </button>
            </div>
          </div>

          <div className="ua-scroll">
            <div className="ua-page-header">
              <div>
                <h1>User Accounts</h1>
                <p>Manage all system users</p>
              </div>
              <button className="ua-add-btn" onClick={() => toast({ title: 'Navigate', description: 'Redirecting to Add User page...' })}>
                <UserPlus size={15} /> Add User
              </button>
            </div>

            <div className="ua-stats">
              {[
                { label: 'Total Users', value: users.length,                                      red: false },
                { label: 'Active',      value: users.filter((u) => u.status === 'active').length,  red: false },
                { label: 'Locked',      value: users.filter((u) => u.status === 'locked').length,  red: true  },
                { label: 'MFA Enabled', value: users.filter((u) => u.mfa).length,                 red: false },
              ].map((s) => (
                <div key={s.label} className="ua-stat-card">
                  <div className={`ua-stat-icon${s.red ? ' red' : ''}`}>
                    <Users size={18} color={s.red ? '#e55353' : '#2db9a3'} />
                  </div>
                  <div>
                    <div className="ua-stat-val">{s.value}</div>
                    <div className="ua-stat-label">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="ua-filters">
              <div className="ua-search-wrap">
                <Search size={14} className="ua-search-icon" />
                <input className="ua-input" placeholder="Search users..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} />
              </div>
              <Filter size={14} style={{ color: '#b0bece', flexShrink: 0 }} />
              <select className="ua-select" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
                <option value="all">All Roles</option>
                <option value="System Admin">System Admin</option>
                <option value="Branch Manager">Branch Manager</option>
                <option value="Auditor">Auditor</option>
                <option value="Bank Teller">Bank Teller</option>
              </select>
              <select className="ua-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="locked">Locked</option>
                <option value="inactive">Inactive</option>
              </select>
              <span className="ua-count">{filtered.length} users</span>
            </div>

            <div className="ua-card">
              <div className="ua-table-wrap">
                <table>
                  <thead>
                    <tr>
                      {['User', 'Employee ID', 'Role', 'Department', 'Branch', 'MFA', 'Status', 'Last Login', ''].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="ua-avatar">{getInitials(u.name)}</div>
                            <div>
                              <div className="ua-user-name">{u.name}</div>
                              <div className="ua-user-email">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className="ua-empid">{u.id}</span></td>
                        <td><span className="ua-badge badge-role">{u.role}</span></td>
                        <td style={{ color: '#64748b' }}>{u.department}</td>
                        <td style={{ color: '#64748b' }}>{u.branch}</td>
                        <td>
                          <span className={`ua-badge ${u.mfa ? 'badge-mfa-on' : 'badge-mfa-off'}`}>
                            {u.mfa ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>
                        <td>
                          <span className={`ua-badge ${u.status === 'active' ? 'badge-active' : u.status === 'locked' ? 'badge-locked' : 'badge-inactive'}`}>
                            <span className={`badge-dot ${u.status === 'active' ? 'dot-active' : u.status === 'locked' ? 'dot-locked' : 'dot-inactive'}`} />
                            {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                          </span>
                        </td>
                        <td style={{ color: '#94a3b8', fontSize: 12 }}>{u.lastLogin}</td>
                        <td>
                          <InlineDropdown
                            items={[
                              { label: 'Edit User',      icon: <Pencil size={14} />,   onClick: () => openEdit(u) },
                              { label: 'Reset Password', icon: <KeyRound size={14} />, onClick: () => handleResetPassword(u) },
                              { label: 'Deactivate',     icon: <Trash2 size={14} />,   onClick: () => setDeleteTarget(u.id), danger: true },
                            ]}
                          />
                        </td>
                      </tr>
                    ))}
                    {paginated.length === 0 && (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', color: '#b0bece', padding: '32px 0', fontSize: 13 }}>
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="ua-pagination">
                <span className="ua-pag-info">
                  Showing <strong>{filtered.length === 0 ? 0 : (safePage - 1) * ROWS_PER_PAGE + 1}–{Math.min(safePage * ROWS_PER_PAGE, filtered.length)}</strong> of <strong>{filtered.length}</strong> records
                </span>
                <div className="ua-pag-btns">
                  <button className="ua-pag-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} className={`ua-pag-btn${safePage === p ? ' active' : ''}`} onClick={() => setPage(p)}>
                      {p}
                    </button>
                  ))}
                  <button className="ua-pag-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Deactivate User"
        description={`Are you sure you want to deactivate ${users.find((u) => u.id === deleteTarget)?.name}? Their access will be immediately revoked.`}
        confirmLabel="Deactivate"
        onConfirm={handleDelete}
      />

      <ActionDialog
        open={!!editTarget}
        onOpenChange={(open) => { if (!open) setEditTarget(null); }}
        title="Edit User"
        description="Update user account details"
        confirmLabel="Save Changes"
        onConfirm={handleEdit}
      >
        <div>
          <label style={fLabel}>Full Name</label>
          <input style={fInput} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
        </div>
        <div>
          <label style={fLabel}>Email</label>
          <input style={fInput} value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={fLabel}>Role</label>
            <select style={{ ...fInput, cursor: 'pointer' }} value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
              {['System Admin', 'Branch Manager', 'Auditor', 'Bank Teller'].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={fLabel}>Department</label>
            <input style={fInput} value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} />
          </div>
        </div>
        <div>
          <label style={fLabel}>Branch</label>
          <input style={fInput} value={editForm.branch} onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })} />
        </div>
      </ActionDialog>
    </>
  );
}