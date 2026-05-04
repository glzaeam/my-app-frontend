'use client';
import DashboardLayout from '@/app/components/DashboardLayout';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Users, ChevronDown } from 'lucide-react';
import { auth } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL;

interface ApiRole {
  id: string;
  name: string;
  description: string | null;
  userCount: number;
  modules: string[];
}

const LEVEL_CONFIG = [
  { accent: '#1D9E75', iconBg: 'rgba(45,185,163,0.15)'  },
  { accent: '#6366f1', iconBg: 'rgba(99,102,241,0.1)'  },
  { accent: '#f59e0b', iconBg: 'rgba(245,158,11,0.1)'  },
  { accent: '#06b6d4', iconBg: 'rgba(6,182,212,0.1)'   },
  { accent: '#ef4444', iconBg: 'rgba(239,68,68,0.1)'   },
  { accent: '#8b5cf6', iconBg: 'rgba(139,92,246,0.1)'  },
];

export default function RoleHierarchy() {
  const router = useRouter();
    const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [roles,       setRoles]       = useState<ApiRole[]>([]);
  const [loading,     setLoading]     = useState(true);

const fetchRoles = useCallback(async () => {
  setLoading(true);
  try {
    const res  = await fetch(`${API}/roles`, { headers: { Authorization: `Bearer ${auth.getToken()}` } });
    const data = await res.json();
    setRoles(Array.isArray(data) ? data : (data.roles ?? data.data ?? []));
  } catch {}
  finally { setLoading(false); }
}, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  return (
    <DashboardLayout title="Role Management" activeMenu="role-hierarchy">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .rh-root { display: flex; height: 100vh; background: #ffffff; overflow: hidden; font-family: 'Open Sans', sans-serif; }
        .rh-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .main-content { flex: 1; overflow-y: auto; padding: 32px 36px; scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
        @media(max-width:768px){
          .main-content{ padding: 24px 20px; }
        }
        @media(max-width:480px){
          .main-content{ padding: 16px 12px; }
        }
        .main-content::-webkit-scrollbar { width: 6px; }
        .main-content::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
        .page-header { margin-bottom: 32px; }
        @media(max-width:480px){
          .page-header{ margin-bottom: 24px; }
        }
        .eyebrow { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #2db9a3; background: rgba(45,185,163,0.08); padding: 4px 10px; border-radius: 20px; margin-bottom: 10px; }
        .eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: #2db9a3; }
        .hierarchy-list { display: flex; flex-direction: column; gap: 0; max-width: 860px; }
        .connector { display: flex; align-items: center; gap: 10px; padding: 6px 0; }
        @media(max-width:480px){
          .connector{ gap: 6px; }
        }
        .connector-line { display: flex; flex-direction: column; align-items: center; }
        .connector-dot { width: 8px; height: 8px; border-radius: 50%; }
        .connector-label { font-size: 11.5px; font-weight: 600; color: #94a3b8; }
        .connector-label span { font-weight: 700; }
        .role-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 18px; padding: 22px 24px; position: relative; overflow: hidden; margin-bottom: 0; }
        @media(max-width:480px){
          .role-card{ padding: 16px 18px; border-radius: 14px; }
        }
        .role-card::before { content: ''; position: absolute; top: 0; left: 0; bottom: 0; width: 4px; background: var(--accent); border-radius: 18px 0 0 18px; }
        .card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; gap: 8px; flex-wrap: wrap; }
        @media(max-width:480px){
          .card-top{ gap: 6px; }
        }
        .card-left { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; }
        @media(max-width:480px){
          .card-left{ gap: 10px; }
        }
        .role-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: var(--icon-bg); color: var(--accent); flex-shrink: 0; }
        .role-name { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 6px; }
        @media(max-width:480px){
          .role-name{ font-size: 14px; }
        }
        .role-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        @media(max-width:480px){
          .role-meta{ gap: 6px; }
        }
        .level-badge { font-size: 11.5px; font-weight: 600; color: var(--accent); background: var(--icon-bg); padding: 2px 10px; border-radius: 20px; }
        .users-badge { display: flex; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 600; color: #64748b; background: #f1f5f9; padding: 2px 10px; border-radius: 20px; }
        .role-desc { font-size: 13px; color: #64748b; line-height: 1.55; margin-bottom: 14px; }
        @media(max-width:480px){
          .role-desc{ font-size: 12px; }
        }
        .modules-wrap { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
        .mod-tag { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 6px; background: var(--icon-bg); color: var(--accent); white-space: nowrap; display: inline-block; }
        @media(max-width:480px){
          .mod-tag{ font-size: 11px; padding: 3px 8px; }
        }
        .no-modules { font-size: 12px; color: #cbd5e1; font-style: italic; margin-bottom: 14px; }
        .manages-section { display: flex; align-items: center; gap: 8px; padding-top: 12px; border-top: 1px solid #f1f5f9; flex-wrap: wrap; }
        .manages-label { font-size: 11.5px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.07em; white-space: nowrap; }
        .manages-chip { font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 20px; background: var(--icon-bg); color: var(--accent); white-space: nowrap; display: inline-block; }
        @media(max-width:480px){
          .manages-chip{ font-size: 11px; padding: 2px 8px; }
        }
        .no-manage { font-size: 12px; color: #cbd5e1; font-style: italic; padding-top: 12px; border-top: 1px solid #f1f5f9; }
      `}</style>

      
        
        
          
          <div className="main-content">
            <div className="page-header">

              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 4, letterSpacing: '-0.03em' }}>Role Hierarchy</h1>
              <p style={{ fontSize: 14, color: '#94a3b8' }}>View role levels, inheritance, and management scope</p>
            </div>

            {loading ? (
              <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>Loading roles...</p>
            ) : roles.length === 0 ? (
              <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>No roles found. Create roles first.</p>
            ) : (
              <div className="hierarchy-list">
                {roles.map((role, idx) => {
                  const cfg    = LEVEL_CONFIG[idx % LEVEL_CONFIG.length];
                  const indent = idx * 28;
                  const nextRoles = roles.slice(idx + 1).map(r => r.name);

                  return (
                    <div key={role.id}>
                      {idx > 0 && (
                        <div
                          className="connector"
                          style={{ marginLeft: indent }}
                        >
                          <div className="connector-line">
                            <div className="connector-dot" style={{ background: cfg.accent, opacity: 0.4, marginBottom: 2 }} />
                            <ChevronDown size={14} style={{ color: cfg.accent, opacity: 0.6 }} />
                            <div className="connector-dot" style={{ background: cfg.accent, opacity: 0.8, marginTop: 2 }} />
                          </div>
                          <span className="connector-label">
                            Reports to <span style={{ color: cfg.accent }}>{roles[idx - 1].name}</span>
                          </span>
                        </div>
                      )}

                      <div style={{ marginLeft: indent, marginBottom: idx < roles.length - 1 ? 0 : 0 }}>
                        <div
                          className="role-card"
                          style={{ '--accent': cfg.accent, '--icon-bg': cfg.iconBg } as React.CSSProperties}
                        >
                          <div className="card-top">
                            <div className="card-left">
                              <div className="role-icon"><Shield size={20} /></div>
                              <div>
                                <div className="role-name">{role.name}</div>
                                <div className="role-meta">
                                  <span className="level-badge">Level {idx + 1}</span>
                                  <span className="users-badge"><Users size={11} />{role.userCount} users</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {role.description && (
                            <p className="role-desc">{role.description}</p>
                          )}

                          {role.modules.length > 0 ? (
                            <div className="modules-wrap">
                              {role.modules.map(m => <span key={m} className="mod-tag">{m}</span>)}
                            </div>
                          ) : (
                            <p className="no-modules">No modules assigned</p>
                          )}

                          {nextRoles.length > 0 ? (
                            <div className="manages-section">
                              <span className="manages-label">Can manage:</span>
                              {nextRoles.map(r => (
                                <span key={r} className="manages-chip">{r}</span>
                              ))}
                            </div>
                          ) : (
                            <p className="no-manage">No management scope</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
    </DashboardLayout>
  );
}


