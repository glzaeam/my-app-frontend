'use client';
import DashboardLayout from '@/app/components/DashboardLayout';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Pencil, Archive, Shield, Save } from 'lucide-react';
import { auth, fetchArray } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL;

interface Role    { id: string; name: string; userCount: number; }
interface Module  { id: string; name: string; description: string | null; }
interface PermRow { roleId: string; role: string; moduleId: string; module: string; canView: boolean; canEdit: boolean; canDelete: boolean; }

type LocalMatrix = Record<string, Record<string, { canView: boolean; canEdit: boolean; canDelete: boolean }>>;

function Toast({ msg, type, onDone }: { msg: string; type: 'success' | 'error'; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      padding: '14px 20px', borderRadius: 12, fontSize: 13.5, fontWeight: 600,
      fontFamily: "'Open Sans',sans-serif", boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      background: type === 'success' ? '#ecfdf5' : '#fef2f2',
      color:      type === 'success' ? '#059669'  : '#dc2626',
      border:     `1px solid ${type === 'success' ? '#a7f3d0' : '#fecaca'}`
    }}>
      {msg}
    </div>
  );
}

const ACCENTS = ['#2db9a3', '#6366f1', '#f59e0b', '#06b6d4'];

export default function PermissionMatrix() {
  const router = useRouter();
  const [roles,       setRoles]       = useState<Role[]>([]);
  const [modules,     setModules]     = useState<Module[]>([]);
  const [matrix,      setMatrix]      = useState<LocalMatrix>({});
  const [activeRole,  setActiveRole]  = useState<Role | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [dirty,       setDirty]       = useState(false);
  const [toast,       setToast]       = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesData, modsData, permData] = await Promise.all([
        fetchArray(`${API}/roles`),
        fetchArray(`${API}/permissions/modules`),
        fetchArray(`${API}/permissions/matrix`),
      ]);

      setRoles(rolesData);
      setModules(modsData);

      const m: LocalMatrix = {};
      modsData.forEach((mod: Module) => {
        m[mod.id] = {};
        rolesData.forEach((role: Role) => {
          m[mod.id][role.id] = { canView: false, canEdit: false, canDelete: false };
        });
      });
      permData.forEach((p: PermRow) => {
        if (m[p.moduleId]) {
          m[p.moduleId][p.roleId] = {
            canView:   p.canView,
            canEdit:   p.canEdit,
            canDelete: p.canDelete,
          };
        }
      });

      setMatrix(m);
      if (rolesData.length > 0 && !activeRole) setActiveRole(rolesData[0]);
    } catch {
      setToast({ msg: 'Failed to load permissions', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const toggle = (moduleId: string, field: 'canView' | 'canEdit' | 'canDelete') => {
    if (!activeRole) return;

    setMatrix(prev => {
      const current = prev[moduleId]?.[activeRole.id] ?? { canView: false, canEdit: false, canDelete: false };
      const updated  = { ...current, [field]: !current[field] };

      if (field === 'canView' && !updated.canView) {
        updated.canEdit   = false;
        updated.canDelete = false;
      }

      if ((field === 'canEdit' || field === 'canDelete') && updated[field]) {
        updated.canView = true;
      }

      return {
        ...prev,
        [moduleId]: {
          ...prev[moduleId],
          [activeRole.id]: updated,
        },
      };
    });

    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = modules.flatMap(mod =>
        roles.map(role => ({
          roleId:    role.id,
          moduleId:  mod.id,
          canView:   matrix[mod.id]?.[role.id]?.canView   ?? false,
          canEdit:   matrix[mod.id]?.[role.id]?.canEdit   ?? false,
          canDelete: matrix[mod.id]?.[role.id]?.canDelete ?? false,
        }))
      );

      const res  = await fetch(`${API}/permissions/matrix`, {
        method:  'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${auth.getToken()}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await res.json();

      if (data.success) {
        setToast({
          msg:  `Saved — ${data.changesCount} change(s) applied. Users will see updates on next login.`,
          type: 'success',
        });
        setDirty(false);
      } else {
        setToast({ msg: data.message || 'Save failed', type: 'error' });
      }
    } catch {
      setToast({ msg: 'Server error while saving', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const countGranted = (roleId: string) =>
    modules.reduce((acc, mod) => {
      const p = matrix[mod.id]?.[roleId];
      if (!p) return acc;
      return acc + (p.canView ? 1 : 0);
    }, 0);

  const totalModules = modules.length;

  return (
    <DashboardLayout activeMenu="permission-matrix" title="Permission Matrix">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        <div className="pm-scroll" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
              Loading permissions...
            </div>
          ) : roles.length === 0 ? (
            <div className="empty-state">No roles found</div>
          ) : (
            <>
              {/* Header */}
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1a2332', margin: 0 }}>
                  Role Permissions
                </h2>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>
                  Select a role to view and edit its module access. Changes apply on next login.
                </p>
              </div>

              {/* Role cards */}
              <div className="roles-grid">
                {roles.map((role, idx) => {
                  const granted  = countGranted(role.id);
                  const isActive = activeRole?.id === role.id;
                  const accent   = ACCENTS[idx % ACCENTS.length];
                  const pct      = totalModules ? (granted / totalModules) * 100 : 0;

                  return (
                    <div
                      key={role.id}
                      className="role-card"
                      onClick={() => setActiveRole(role)}
                      style={{
                        borderColor: isActive ? accent : '#e2e8f0',
                        borderWidth: isActive ? '2px' : '1.5px',
                        boxShadow:   isActive ? `0 0 0 3px ${accent}22` : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent, flexShrink: 0 }} />
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1a2332', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {role.name}
                        </div>
                      </div>

                      <div style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 500 }}>
                        {granted} / {totalModules} modules accessible
                      </div>

                      <div style={{ marginTop: '8px', height: '4px', borderRadius: '2px', background: '#f1f5f9', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: '2px', background: accent,
                          width: `${pct}%`, transition: 'width 0.3s ease',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Permission panel for selected role */}
              {activeRole && (
                <div className="panel">
                  <div className="panel-header">
                    <Shield size={18} color="#2db9a3" />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#1a2332' }}>
                      {activeRole.name}
                    </span>
                    <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: 'auto' }}>
                      {countGranted(activeRole.id)} of {totalModules} modules accessible
                    </span>
                  </div>

                  <div>
                    {modules.map((mod, idx) => {
                      const p      = matrix[mod.id]?.[activeRole.id] ?? { canView: false, canEdit: false, canDelete: false };
                      const accent = ACCENTS[idx % ACCENTS.length];

                      return (
                        <div key={mod.id} className="mod-row">
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a2332' }}>
                              {mod.name}
                            </div>
                            {mod.description && (
                              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                                {mod.description}
                              </div>
                            )}
                          </div>

                          <div className="toggle-group">
                            {([
                              { key: 'canView',   label: 'View',    icon: Eye     },
                              { key: 'canEdit',   label: 'Edit',    icon: Pencil  },
                              { key: 'canDelete', label: 'Archive', icon: Archive },
                            ] as const).map(({ key, label, icon: Icon }) => {
                              const on = p[key];
                              return (
                                <button
                                  key={key}
                                  onClick={() => toggle(mod.id, key)}
                                  style={{
                                    display:     'flex',
                                    alignItems:  'center',
                                    gap:         '5px',
                                    padding:     '6px 12px',
                                    borderRadius: '8px',
                                    border:      on ? 'none' : '1.5px solid #e2e8f0',
                                    background:  on ? accent : '#fff',
                                    fontSize:    '12px',
                                    fontWeight:  600,
                                    cursor:      'pointer',
                                    fontFamily:  "'Open Sans', sans-serif",
                                    color:       on ? '#fff' : '#94a3b8',
                                    transition:  'all 0.15s',
                                  }}
                                >
                                  <Icon size={12} /> {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Save button — only shows when there are unsaved changes */}
              {!loading && dirty && (
                <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button
                    onClick={() => { fetchAll(); setDirty(false); }}
                    style={{
                      padding: '10px 20px', borderRadius: 10,
                      border: '1.5px solid #e2e8f0', background: '#fff',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      color: '#64748b', fontFamily: "'Open Sans', sans-serif",
                    }}
                  >
                    Discard
                  </button>
                  <button
                    className="save-btn"
                    onClick={handleSave}
                    disabled={saving}
                    style={{ background: '#2db9a3' }}
                  >
                    <Save size={14} />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .pm-scroll { scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
        .pm-scroll::-webkit-scrollbar { width: 6px; }
        .pm-scroll::-webkit-scrollbar-track { background: transparent; }
        .pm-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
        .roles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }
        .role-card {
          background: #fff;
          border-style: solid;
          border-radius: 14px;
          padding: 14px 16px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .role-card:hover { background: #fafafa; transform: translateY(-1px); }
        .panel {
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .panel-header {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid #f1f5f9;
          background: #fafafa;
        }
        .mod-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 20px;
          border-bottom: 1px solid #f8fafc;
          transition: background 0.12s;
        }
        .mod-row:last-child { border-bottom: none; }
        .mod-row:hover { background: #fafaf9; }
        .toggle-group { display: flex; gap: 8px; flex-shrink: 0; }
        .empty-state {
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 18px;
          padding: 48px;
          text-align: center;
          color: #94a3b8;
        }
        .save-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 10px 22px;
          border-radius: 10px;
          border: none;
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Open Sans', sans-serif;
          transition: opacity 0.15s;
        }
        .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .save-btn:not(:disabled):hover { opacity: 0.88; }
        @media (max-width: 768px) {
          .pm-scroll { padding: 16px !important; }
          .toggle-group { flex-wrap: wrap; }
          .mod-row { flex-direction: column; align-items: flex-start; gap: 10px; }
        }
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </DashboardLayout>
  );
}