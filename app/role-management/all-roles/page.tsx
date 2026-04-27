'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import TopBar from '@/app/components/TopBar';
import { Users, Edit2, Archive, Plus, Shield, X } from 'lucide-react';
import { auth } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL;

interface ApiRole {
  id: string;
  name: string;
  description: string | null;
  userCount: number;
  modules: string[];
}

const ACCENTS = ['#2db9a3', '#6366f1', '#f59e0b', '#06b6d4', '#ef4444', '#8b5cf6'];

function Toast({ msg, type, onDone }: { msg: string; type: 'success' | 'error'; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 9999, padding: '14px 20px', borderRadius: 12, fontSize: 13.5, fontWeight: 600, fontFamily: "'Open Sans',sans-serif", boxShadow: '0 8px 24px rgba(0,0,0,0.12)', background: type === 'success' ? '#ecfdf5' : '#fef2f2', color: type === 'success' ? '#059669' : '#dc2626', border: `1px solid ${type === 'success' ? '#a7f3d0' : '#fecaca'}` }}>
      {msg}
    </div>
  );
}

export default function AllRoles() {
  const router = useRouter();
  const [activeMenu, setActiveMenu]     = useState('all-roles');
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [roles, setRoles]               = useState<ApiRole[]>([]);
  const [loading, setLoading]           = useState(true);
  const [toast, setToast]               = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Create modal
  const [showCreate, setShowCreate]     = useState(false);
  const [createForm, setCreateForm]     = useState({ name: '', description: '' });
  const [creating, setCreating]         = useState(false);

  // Edit modal
  const [editRole, setEditRole]         = useState<ApiRole | null>(null);
  const [editForm, setEditForm]         = useState({ name: '', description: '' });
  const [saving, setSaving]             = useState(false);

  // Archive modal
  const [archiveRole, setArchiveRole]   = useState<ApiRole | null>(null);
  const [archiving, setArchiving]       = useState(false);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/roles`, { headers: { Authorization: `Bearer ${auth.getToken()}` } });
      const data = await res.json();
      setRoles(data);
    } catch { setToast({ msg: 'Failed to load roles', type: 'error' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const handleCreate = async () => {
    if (!createForm.name.trim()) return;
    setCreating(true);
    try {
      const res  = await fetch(`${API}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.getToken()}` },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ msg: 'Role created successfully', type: 'success' });
        setShowCreate(false);
        setCreateForm({ name: '', description: '' });
        fetchRoles();
      } else setToast({ msg: data.message || 'Failed to create', type: 'error' });
    } catch { setToast({ msg: 'Server error', type: 'error' }); }
    finally { setCreating(false); }
  };

  const handleSave = async () => {
    if (!editRole) return;
    setSaving(true);
    try {
      const res  = await fetch(`${API}/roles/${editRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.getToken()}` },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ msg: 'Role updated', type: 'success' });
        setEditRole(null);
        fetchRoles();
      } else setToast({ msg: data.message || 'Failed to save', type: 'error' });
    } catch { setToast({ msg: 'Server error', type: 'error' }); }
    finally { setSaving(false); }
  };

  const handleArchive = async () => {
    if (!archiveRole) return;
    setArchiving(true);
    try {
      const res  = await fetch(`${API}/roles/${archiveRole.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${auth.getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setToast({ msg: 'Role archived', type: 'success' });
        setArchiveRole(null);
        fetchRoles();
      } else setToast({ msg: data.message || 'Failed to archive', type: 'error' });
    } catch { setToast({ msg: 'Server error', type: 'error' }); }
    finally { setArchiving(false); }
  };

  const modal: React.CSSProperties = { position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const box: React.CSSProperties   = { background: '#fff', borderRadius: 16, padding: '28px 32px', width: 480, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', fontFamily: "'Open Sans',sans-serif" };
  const inp: React.CSSProperties   = { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontFamily: "'Open Sans',sans-serif", outline: 'none', color: '#1a2332' };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap');
        *{box-sizing:border-box;}
        .ar-root{display:flex;height:100vh;background:#fff;overflow:hidden;font-family:'Open Sans',sans-serif;}
        .ar-main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .ar-scroll{flex:1;overflow-y:auto;padding:28px 32px;}
        .roles-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:18px;}
        .role-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:18px;padding:22px 24px;position:relative;overflow:hidden;}
        .role-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--accent);border-radius:18px 18px 0 0;}
        .action-btn{width:32px;height:32px;border:1.5px solid #e2e8f0;background:#fff;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#94a3b8;transition:all 0.15s;}
        .action-btn:hover{border-color:#2db9a3;color:#2db9a3;background:#f0fdf9;}
        .action-btn.del:hover{border-color:#fca5a5;color:#ef4444;background:#fef2f2;}
        .create-btn{display:inline-flex;align-items:center;gap:7px;padding:10px 20px;border-radius:10px;border:none;background:#2db9a3;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:'Open Sans',sans-serif;box-shadow:0 2px 10px rgba(45,185,163,0.3);}
        .create-btn:hover{background:#28a593;}
        .mod-tag{font-size:12px;font-weight:500;padding:4px 10px;border-radius:6px;background:var(--icon-bg);color:var(--accent);}
        .divider{height:1px;background:#f1f5f9;margin:14px 0;}
        .btn-row{display:flex;justify-content:flex-end;gap:10px;margin-top:20px;}
        .btn-cancel{padding:9px 20px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;color:#475569;font-size:13px;font-weight:500;font-family:'Open Sans',sans-serif;cursor:pointer;}
        .btn-primary{padding:9px 20px;border-radius:8px;border:none;background:#2db9a3;color:#fff;font-size:13px;font-weight:600;font-family:'Open Sans',sans-serif;cursor:pointer;}
        .btn-danger{padding:9px 20px;border-radius:8px;border:none;background:#ef4444;color:#fff;font-size:13px;font-weight:600;font-family:'Open Sans',sans-serif;cursor:pointer;}
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <div className="ar-root">
        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={() => { auth.clear(); router.push('/'); }} />
        <div className="ar-main">
          <TopBar title="Role Management" />
          <div className="ar-scroll">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2db9a3', background: 'rgba(45,185,163,0.08)', padding: '4px 10px', borderRadius: 20, marginBottom: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2db9a3' }} />Role Management
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2332', margin: '0 0 4px' }}>All Roles</h1>
                <p style={{ fontSize: 13, color: '#8a9ab0', margin: 0 }}>Manage system roles and access levels</p>
              </div>
              <button className="create-btn" onClick={() => setShowCreate(true)}><Plus size={15} /> Create New Role</button>
            </div>

            {loading ? (
              <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>Loading roles...</p>
            ) : (
              <div className="roles-grid">
                {roles.map((role, ri) => {
                  const accent  = ACCENTS[ri % ACCENTS.length];
                  const iconBg  = accent + '18';
                  return (
                    <div key={role.id} className="role-card" style={{ '--accent': accent, '--icon-bg': iconBg } as React.CSSProperties}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent }}>
                            <Shield size={20} />
                          </div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{role.name}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{role.description || 'No description'}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="action-btn" onClick={() => { setEditRole(role); setEditForm({ name: role.name, description: role.description || '' }); }}><Edit2 size={14} /></button>
                          <button className="action-btn del" onClick={() => setArchiveRole(role)}><Archive size={14} /></button>
                        </div>
                      </div>

                      <div className="divider" />

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                        <Users size={13} color="#94a3b8" />
                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{role.userCount} users assigned</span>
                      </div>

                      {role.modules.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {role.modules.map(m => <span key={m} className="mod-tag">{m}</span>)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={modal} onClick={() => setShowCreate(false)}>
          <div style={box} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#1a2332' }}>Create New Role</div>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={18} /></button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Role Name *</label>
              <input style={inp} placeholder="e.g. Compliance Officer" value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Description</label>
              <textarea style={{ ...inp, minHeight: 80, resize: 'none' }} placeholder="Role description..." value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="btn-row">
              <button className="btn-cancel" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreate} disabled={creating}>{creating ? 'Creating...' : 'Create Role'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editRole && (
        <div style={modal} onClick={() => setEditRole(null)}>
          <div style={box} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#1a2332' }}>Edit Role</div>
              <button onClick={() => setEditRole(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={18} /></button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Role Name *</label>
              <input style={inp} value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Description</label>
              <textarea style={{ ...inp, minHeight: 80, resize: 'none' }} value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="btn-row">
              <button className="btn-cancel" onClick={() => setEditRole(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {archiveRole && (
        <div style={modal} onClick={() => setArchiveRole(null)}>
          <div style={{ ...box, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1a2332', marginBottom: 12 }}>Archive Role</div>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Are you sure you want to archive "{archiveRole.name}"? This action can be undone by an administrator.</p>
            <div className="btn-row" style={{ justifyContent: 'center' }}>
              <button className="btn-cancel" onClick={() => setArchiveRole(null)}>Cancel</button>
              <button className="btn-danger" onClick={handleArchive} disabled={archiving}>{archiving ? 'Archiving...' : 'Archive Role'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
