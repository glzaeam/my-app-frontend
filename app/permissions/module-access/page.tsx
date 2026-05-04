'use client';
import DashboardLayout from '@/app/components/DashboardLayout';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Unlock, Eye } from 'lucide-react';
import { auth, fetchArray } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL;
const ROWS_PER_PAGE = 10;

interface Role    { id: string; name: string; }
interface Module  { id: string; name: string; description: string | null; }
interface PermRow { roleId: string; moduleId: string; canView: boolean; canEdit: boolean; canDelete: boolean; }

type AccessLevel = 'full' | 'edit' | 'view' | 'none';

function getAccessLevel(canView: boolean, canEdit: boolean, canDelete: boolean): AccessLevel {
  if (canView && canEdit && canDelete) return 'full';
  if (canView && canEdit)              return 'edit';
  if (canView)                         return 'view';
  return 'none';
}

const accessConfig: Record<AccessLevel, { label: string; color: string; bg: string; dot: string }> = {
  full: { label: 'Full Access', color: '#059669', bg: '#dcfce7', dot: '#10b981' },
  edit: { label: 'Edit',        color: '#2db9a3', bg: '#f0fdf9', dot: '#2db9a3' },
  view: { label: 'View Only',   color: '#d97706', bg: '#fef3c7', dot: '#f59e0b' },
  none: { label: 'No Access',   color: '#94a3b8', bg: '#f1f5f9', dot: '#cbd5e1' },
};

const ROLE_ACCENTS = ['#2db9a3','#6366f1','#f59e0b','#06b6d4','#ef4444','#8b5cf6'];

export default function ModuleAccess() {
  const router = useRouter();  const [roles, setRoles]             = useState<Role[]>([]);
  const [modules, setModules]         = useState<Module[]>([]);
  const [perms, setPerms]             = useState<PermRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading]         = useState(true);

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
      setPerms(permData);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getAccess = (moduleId: string, roleId: string): AccessLevel => {
    const p = perms.find(x => x.moduleId === moduleId && x.roleId === roleId);
    if (!p) return 'none';
    return getAccessLevel(p.canView, p.canEdit, p.canDelete);
  };

  return (
    <DashboardLayout title="Module Access" activeMenu="module-access">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        .ma-root{display:flex;height:100vh;background:#fff;overflow:hidden;font-family:'Open Sans',sans-serif;}
        .ma-main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .ma-scroll{flex:1;overflow-y:auto;padding:28px 32px;scrollbar-width:thin;scrollbar-color:#e2e8f0 transparent;}
        .ma-scroll::-webkit-scrollbar{width:6px;}
        .ma-scroll::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:3px;}
        .table-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:18px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.04);margin-bottom:20px;}
        table{width:100%;border-collapse:collapse;}
        thead tr{background:#f8fafc;border-bottom:1.5px solid #f1f5f9;}
        thead th{padding:12px 18px;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.09em;white-space:nowrap;color:#94a3b8;text-align:center;}
        thead th:first-child{text-align:left;}
        tbody tr{border-bottom:1px solid #f8fafc;transition:background 0.13s;}
        tbody tr:last-child{border-bottom:none;}
        tbody tr:hover{background:#fafbfd;}
        tbody td{padding:13px 18px;font-size:13px;color:#1e293b;font-weight:500;vertical-align:middle;text-align:center;}
        tbody td:first-child{text-align:left;}
        .access-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 11px;border-radius:20px;font-size:12px;font-weight:700;white-space:nowrap;}
        .badge-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0;}
        .legend{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:14px 20px;border-top:1px solid #f1f5f9;background:#fafbfc;}
        .legend-label{font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-right:8px;}
        .legend-item{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;}

        .info-box{background:#f0fdf9;border:1px solid #a7f3d0;border-radius:10px;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#059669;}
      `}</style>

      
        
        
          
          <div className="ma-scroll">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22 }}>
              <div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#2db9a3', background:'rgba(45,185,163,0.08)', padding:'4px 10px', borderRadius:20, marginBottom:8 }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:'#2db9a3' }}/>Permissions
                </div>
                <h1 style={{ fontSize:22, fontWeight:700, color:'#1a2332', margin:'0 0 4px' }}>Module Access</h1>
                <p style={{ fontSize:13, color:'#8a9ab0', margin:0 }}>Read-only summary of Permission Matrix — determines Sidebar visibility per role</p>
              </div>

            </div>

            <div className="info-box">
              💡 This view is derived from the <strong>Permission Matrix</strong>. To change access levels, go to Permission Matrix and toggle View / Edit / Delete for each role.
            </div>

            {loading ? (
              <p style={{ textAlign:'center', color:'#94a3b8', padding:'40px 0' }}>Loading...</p>
            ) : (
              <div className="table-card">
                <table>
                  <thead>
                    <tr>
                      <th style={{ textAlign:'left' }}>Module</th>
                      {roles.map((r, i) => (
                        <th key={r.id} style={{ color: ROLE_ACCENTS[i % ROLE_ACCENTS.length] }}>{r.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map(mod => (
                      <tr key={mod.id}>
                        <td>
                          <div style={{ fontSize:13.5, fontWeight:700, color:'#0f172a' }}>{mod.name}</div>
                          {mod.description && <div style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>{mod.description}</div>}
                        </td>
                        {roles.map(role => {
                          const level = getAccess(mod.id, role.id);
                          const cfg   = accessConfig[level];
                          return (
                            <td key={role.id}>
                              <span className="access-badge" style={{ background:cfg.bg, color:cfg.color }}>
                                <span className="badge-dot" style={{ background:cfg.dot }}/>
                                {cfg.label}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="legend">
                  <span className="legend-label">Legend:</span>
                  {(Object.entries(accessConfig) as [AccessLevel, typeof accessConfig[AccessLevel]][]).map(([k, v]) => (
                    <span key={k} className="legend-item" style={{ background:v.bg, color:v.color }}>
                      <span style={{ width:5, height:5, borderRadius:'50%', background:v.dot, display:'inline-block' }}/>
                      {v.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
    </DashboardLayout>
  );
}


