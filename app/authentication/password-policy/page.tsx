'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import { Bell, Lock, RotateCw, CheckCircle, Circle, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PasswordPolicy() {
  const [activeMenu, setActiveMenu] = useState('password-policy');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [special, setSpecial] = useState(true);
  const [commonPasswords, setCommonPasswords] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const router = useRouter();

  const policyData = [
    { role: 'System Admin',    minLength: '16 chars', expiry: '60 days',  history: 'Last 10', mfa: 'Yes' },
    { role: 'Branch Manager',  minLength: '12 chars', expiry: '90 days',  history: 'Last 5',  mfa: 'Yes' },
    { role: 'Auditor',         minLength: '12 chars', expiry: '90 days',  history: 'Last 5',  mfa: 'No'  },
    { role: 'Bank Teller',     minLength: '10 chars', expiry: '90 days',  history: 'Last 3',  mfa: 'No'  },
    { role: 'Customer Service',minLength: '10 chars', expiry: '120 days', history: 'Last 3',  mfa: 'No'  },
    { role: 'Data Analyst',    minLength: '12 chars', expiry: '90 days',  history: 'Last 5',  mfa: 'Yes' },
  ];

  const totalPages = Math.ceil(policyData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPolicyData = policyData.slice(startIndex, startIndex + itemsPerPage);
  const handleLogout = () => router.push('/');

  const complexityRules = [
    { label: 'Uppercase letters (A–Z)',    value: uppercase,       set: setUppercase       },
    { label: 'Lowercase letters (a–z)',    value: lowercase,       set: setLowercase       },
    { label: 'Numbers (0–9)',              value: numbers,         set: setNumbers         },
    { label: 'Special characters (!@#$%)', value: special,         set: setSpecial         },
    { label: 'Block common passwords',     value: commonPasswords, set: setCommonPasswords },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .pp-root { display: flex; height: 100vh; background: #ffffff; overflow: hidden; font-family: 'Open Sans', sans-serif; }
        .pp-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

        .topbar { height: 66px; background: #fff; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .topbar-title { font-size: 16px; font-weight: 700; color: #0f172a; letter-spacing: -0.01em; }
        .topbar-right { display: flex; align-items: center; gap: 14px; }
        .notif-btn { width: 38px; height: 38px; border-radius: 10px; border: 1.5px solid #e2e8f0; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; transition: all 0.18s; position: relative; }
        .notif-btn:hover { border-color: #2db9a3; color: #2db9a3; background: #f0fdf9; }
        .notif-dot { position: absolute; top: 8px; right: 8px; width: 7px; height: 7px; background: #ef4444; border-radius: 50%; border: 1.5px solid #fff; }
        .profile-pill { display: flex; align-items: center; gap: 10px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 40px; padding: 5px 14px 5px 5px; cursor: pointer; transition: all 0.18s; }
        .profile-pill:hover { border-color: #2db9a3; background: #f0fdf9; }
        .profile-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #2db9a3 0%, #6366f1 100%); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; font-weight: 800; }
        .profile-name { font-size: 13px; font-weight: 600; color: #1e293b; }

        .main-content { flex: 1; overflow-y: auto; padding: 32px 36px; scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
        .main-content::-webkit-scrollbar { width: 6px; }
        .main-content::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }

        .page-header { margin-bottom: 28px; }
        .eyebrow { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #2db9a3; background: rgba(45,185,163,0.08); padding: 4px 10px; border-radius: 20px; margin-bottom: 10px; }
        .eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: #2db9a3; }
        .page-header h1 { font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 4px; letter-spacing: -0.03em; }
        .page-header p { font-size: 14px; color: #94a3b8; font-weight: 400; }

        .top-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 18px; margin-bottom: 18px; }

        .card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 18px; padding: 24px; transition: box-shadow 0.2s; }
        .card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.06); }
        .card-title { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 20px; letter-spacing: -0.01em; }
        .card-title-icon { width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center; justify-content: center; background: rgba(45,185,163,0.1); color: #2db9a3; flex-shrink: 0; }

        .field-group { margin-bottom: 16px; }
        .field-label { font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 7px; display: block; }
        .field-desc { font-size: 12px; color: #94a3b8; margin-top: 5px; }
        .field-select { width: 100%; padding: 10px 14px; border-radius: 10px; border: 1.5px solid #e2e8f0; font-size: 13.5px; color: #1e293b; background: #f8fafc; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500; outline: none; transition: all 0.18s; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 36px; }
        .field-select:focus { border-color: #2db9a3; background: #fff; box-shadow: 0 0 0 3px rgba(45,185,163,0.1); }

        /* Complexity rule rows — matches screenshot */
        .rule-row { display: flex; align-items: center; gap: 12px; padding: 15px 2px; border-bottom: 1px solid #f1f5f9; cursor: pointer; user-select: none; }
        .rule-row:last-child { border-bottom: none; padding-bottom: 0; }
        .rule-row:first-of-type { padding-top: 4px; }
        .rule-check { width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .rule-label { font-size: 14px; font-weight: 400; color: #1e293b; flex: 1; }
        .rule-toggle { width: 52px; height: 28px; border-radius: 14px; background: #e2e8f0; position: relative; flex-shrink: 0; border: none; outline: none; cursor: pointer; transition: background 0.25s; }
        .rule-toggle.on { background: #2db9a3; }
        .rule-toggle-thumb { width: 22px; height: 22px; border-radius: 50%; background: #fff; position: absolute; top: 3px; left: 3px; transition: left 0.25s; box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
        .rule-toggle.on .rule-toggle-thumb { left: 27px; }

        .info-box { margin-top: 16px; background: #f0fdf9; border: 1.5px solid #a7f3d0; border-radius: 10px; padding: 12px 16px; }
        .info-box p { font-size: 13px; font-weight: 600; color: #059669; }
        .info-box span { font-size: 12px; color: #34d399; display: block; margin-top: 2px; }

        .table-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 18px; overflow: hidden; margin-bottom: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
        .table-card-header { padding: 20px 28px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; }
        .table-card-header h2 { font-size: 15px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em; }
        .table-card-header p { font-size: 12.5px; color: #94a3b8; margin-top: 2px; }
        .table-count { font-size: 12px; font-weight: 700; color: #2db9a3; background: rgba(45,185,163,0.1); padding: 4px 12px; border-radius: 20px; }

        .policy-table { width: 100%; border-collapse: collapse; margin: 0 auto; }
        .policy-table thead tr { background: #f8fafc; border-bottom: 1.5px solid #f1f5f9; }
        .policy-table thead th { padding: 11px 20px; text-align: center; font-size: 10.5px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.09em; white-space: nowrap; }
        .policy-table tbody tr { border-bottom: 1px solid #f8fafc; transition: background 0.13s; }
        .policy-table tbody tr:last-child { border-bottom: none; }
        .policy-table tbody tr:hover { background: #fafbfd; }
        .policy-table tbody td { padding: 14px 20px; font-size: 13px; color: #1e293b; font-weight: 500; vertical-align: middle; text-align: center; }

        .role-name { font-weight: 700; color: #0f172a; }
        .meta-chip { display: inline-block; font-size: 13px; font-weight: 500; color: #1e293b; white-space: nowrap; }
        .mfa-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; white-space: nowrap; }
        .mfa-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

        .pagination-bar { display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; border-top: 1px solid #f1f5f9; background: #fafbfc; }
        .pagination-info { font-size: 13px; color: #94a3b8; font-weight: 500; }
        .pagination-info strong { color: #475569; font-weight: 700; }
        .pagination-controls { display: flex; align-items: center; gap: 4px; }
        .pg-btn { width: 34px; height: 34px; border-radius: 8px; border: 1.5px solid #e2e8f0; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: #64748b; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.15s; }
        .pg-btn:hover:not(:disabled) { border-color: #2db9a3; color: #2db9a3; background: #f0fdf9; }
        .pg-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .pg-btn.active { background: #2db9a3; border-color: #2db9a3; color: #fff; box-shadow: 0 2px 10px rgba(45,185,163,0.35); }

        .footer-actions { display: flex; justify-content: flex-end; gap: 12px; }
        .btn-cancel { padding: 11px 28px; border-radius: 10px; border: 1.5px solid #e2e8f0; background: #fff; color: #64748b; cursor: pointer; font-size: 13.5px; font-weight: 600; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.18s; }
        .btn-cancel:hover { border-color: #cbd5e1; background: #f8fafc; }
        .btn-save { padding: 11px 28px; border-radius: 10px; border: none; background: #2db9a3; color: #fff; cursor: pointer; font-size: 13.5px; font-weight: 700; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.18s; box-shadow: 0 2px 10px rgba(45,185,163,0.3); }
        .btn-save:hover { background: #28a593; box-shadow: 0 4px 16px rgba(45,185,163,0.4); transform: translateY(-1px); }

        @media (max-width: 768px) { .topbar { padding: 0 18px; } .main-content { padding: 18px; } .top-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="pp-root">
        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={handleLogout} />
        <div className="pp-content">
          <div className="topbar">
            <span className="topbar-title">Password Policy</span>
            <div className="topbar-right">
              <button className="notif-btn"><Bell size={17} /><div className="notif-dot" /></button>
              <button onClick={() => router.push('/my-profile')} className="profile-pill" style={{ border: 'none' }}>
                <div className="profile-avatar">SJ</div>
                <span className="profile-name">Sarah Johnson</span>
              </button>
            </div>
          </div>

          <div className="main-content">
            <div className="page-header">
              <div className="eyebrow"><span className="eyebrow-dot" />Security</div>
              <h1>Password Policy</h1>
              <p>Define password complexity and rotation rules for all roles.</p>
            </div>

            <div className="top-grid">
              {/* Complexity Requirements */}
              <div className="card">
                <div className="card-title">
                  <div className="card-title-icon"><Lock size={16} /></div>
                  Complexity Requirements
                </div>
                <div className="field-group">
                  <label className="field-label">Minimum Password Length</label>
                  <select className="field-select" defaultValue="12">
                    <option value="8">8 characters</option>
                    <option value="10">10 characters</option>
                    <option value="12">12 characters</option>
                    <option value="16">16 characters</option>
                  </select>
                </div>
                {complexityRules.map((rule, i) => (
                  <div key={i} className="rule-row" onClick={() => rule.set(v => !v)}>
                    <div className="rule-check">
                      {rule.value
                        ? <CheckCircle size={20} style={{ color: '#2db9a3' }} />
                        : <Circle size={20} style={{ color: '#cbd5e1' }} />
                      }
                    </div>
                    <span className="rule-label">{rule.label}</span>
                    <button
                      className={`rule-toggle ${rule.value ? 'on' : ''}`}
                      onClick={e => { e.stopPropagation(); rule.set(v => !v); }}
                    >
                      <div className="rule-toggle-thumb" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Rotation & History */}
              <div className="card">
                <div className="card-title">
                  <div className="card-title-icon"><RotateCw size={16} /></div>
                  Rotation &amp; History
                </div>
                <div className="field-group">
                  <label className="field-label">Password Expiry</label>
                  <select className="field-select" defaultValue="90">
                    <option value="30">30 days</option>
                    <option value="60">60 days</option>
                    <option value="90">90 days</option>
                    <option value="180">180 days</option>
                  </select>
                  <p className="field-desc">Users must change passwords after this period</p>
                </div>
                <div className="field-group">
                  <label className="field-label">Password History</label>
                  <select className="field-select" defaultValue="5">
                    <option value="3">Remember last 3 passwords</option>
                    <option value="5">Remember last 5 passwords</option>
                    <option value="10">Remember last 10 passwords</option>
                    <option value="0">Disable</option>
                  </select>
                  <p className="field-desc">Prevents reusing recent passwords</p>
                </div>
                <div className="info-box">
                  <p>Password Strength Meter: Enabled</p>
                  <span>Visual feedback shown during password creation</span>
                </div>
              </div>
            </div>

            {/* Policy by Role Table */}
            <div className="table-card">
              <div className="table-card-header">
                <div>
                  <h2>Policy by Role</h2>
                  <p>Per-role password requirements and MFA enforcement</p>
                </div>
                <span className="table-count">{policyData.length} roles</span>
              </div>

              <table className="policy-table">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Min Length</th>
                    <th>Expiry</th>
                    <th>History</th>
                    <th>MFA Required</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPolicyData.map((row, idx) => (
                    <tr key={idx}>
                      <td><span className="role-name">{row.role}</span></td>
                      <td><span className="meta-chip">{row.minLength}</span></td>
                      <td><span className="meta-chip">{row.expiry}</span></td>
                      <td><span className="meta-chip">{row.history}</span></td>
                      <td>
                        {row.mfa === 'Yes' ? (
                          <span className="mfa-badge" style={{ background: '#dcfce7', color: '#059669' }}>
                            <span className="mfa-dot" style={{ background: '#10b981' }} />Required
                          </span>
                        ) : (
                          <span className="mfa-badge" style={{ background: '#f1f5f9', color: '#94a3b8' }}>
                            <span className="mfa-dot" style={{ background: '#cbd5e1' }} />Not Required
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pagination-bar">
                <span className="pagination-info">
                  Showing <strong>{startIndex + 1}–{Math.min(startIndex + itemsPerPage, policyData.length)}</strong> of <strong>{policyData.length}</strong> roles
                </span>
                <div className="pagination-controls">
                  <button className="pg-btn" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}><ChevronLeft size={15} /></button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button key={page} className={`pg-btn ${currentPage === page ? 'active' : ''}`} onClick={() => setCurrentPage(page)}>{page}</button>
                  ))}
                  <button className="pg-btn" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}><ChevronRight size={15} /></button>
                </div>
              </div>
            </div>

            <div className="footer-actions">
              <button className="btn-cancel">Cancel</button>
              <button className="btn-save">Save Password Policy</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}