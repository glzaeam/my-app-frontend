'use client';
import DashboardLayout from '@/app/components/DashboardLayout';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, FileText, ChevronDown } from 'lucide-react';
import { auth, fetchArray } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL;

interface TxnRecord {
  id: string;
  txnId: string;
  action: string;
  module: string | null;
  details: string | null;
  status: string;
  ipAddress: string | null;
  createdAt: string;
  performedBy: string;
  performerEmpId: string;
  targetUser: string;
}

function CustomSelect({ options, value, onChange }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative', width: 180 }}>
      <button type="button" onClick={() => setOpen(v => !v)}
        style={{ width: '100%', padding: '10px 14px', borderRadius: 20, border: `1.5px solid ${open ? '#2db9a3' : '#e2e8f0'}`, fontSize: 13, color: open ? '#2db9a3' : '#64748b', background: open ? '#f0fdf9' : '#fff', cursor: 'pointer', fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)", fontWeight: 600, outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Filter size={14} style={{ flexShrink: 0, color: open ? '#2db9a3' : '#94a3b8' }} />
        <span style={{ flex: 1, textAlign: 'left' }}>{selected?.label ?? options[0]?.label}</span>
        <ChevronDown size={14} style={{ color: open ? '#2db9a3' : '#94a3b8', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 9999, overflow: 'hidden' }}>
          {options.map(opt => (
            <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{ width: '100%', padding: '10px 14px', fontSize: 13, color: opt.value === value ? '#2db9a3' : '#1e293b', background: opt.value === value ? 'rgba(45,185,163,0.08)' : '#fff', fontWeight: opt.value === value ? 700 : 500, fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)", border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const statusCfg: Record<string, { color: string; bg: string; dot: string }> = {
  Success: { color: '#059669', bg: '#dcfce7', dot: '#10b981' },
  Failed:  { color: '#dc2626', bg: '#fecaca', dot: '#ef4444' },
  Warning: { color: '#d97706', bg: '#fef3c7', dot: '#f59e0b' },
};

const ITEMS_PER_PAGE = 10;

const formatDate = (iso: string) => {
  if (!iso) return '—';
  const utcString = iso.endsWith('Z') ? iso : iso + 'Z';
  const d = new Date(utcString);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
  if (isToday) return `Today ${timeStr}`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }) + ' ' + timeStr;
};

export default function TransactionTrailPage() {
  const router = useRouter();  const [records, setRecords]           = useState<TxnRecord[]>([]);
  const [loading, setLoading]           = useState(true);
  const [searchTerm, setSearchTerm]     = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [dateRange, setDateRange]       = useState('all');
  const [currentPage, setCurrentPage]   = useState(1);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm)              params.set('search', searchTerm);
      if (moduleFilter !== 'all')  params.set('module', moduleFilter);
      if (dateRange !== 'all')     params.set('dateRange', dateRange);
      const url = `${API}/audit/transactions?${params}`;
      const data = await fetchArray(url);
      console.log('Transaction Trail Response:', data);
      setRecords(data);
    } catch (err) {
      console.error('Failed to fetch transaction trail:', err);
    }
    finally { setLoading(false); }
  }, [searchTerm, moduleFilter, dateRange]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);


  const modules    = ['all', ...new Set(records.map(r => r.module ?? '').filter(Boolean))];
  const totalPages = Math.max(1, Math.ceil(records.length / ITEMS_PER_PAGE));
  const safePage   = Math.min(currentPage, totalPages);
  const paged      = records.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  return (
    <DashboardLayout title="Transaction Trail" activeMenu="transaction-trail">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        .tt-root{display:flex;height:100vh;background:#fff;overflow:hidden;font-family:var(--font-dm-sans, 'DM Sans', sans-serif);}
        .tt-content{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .main-content{flex:1;overflow-y:auto;padding:32px 36px;scrollbar-width:thin;scrollbar-color:#e2e8f0 transparent;}
        .main-content::-webkit-scrollbar{width:6px;}
        .main-content::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:3px;}
        .controls-bar{display:flex;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap;}
        .search-wrap{position:relative;flex:1;min-width:200px;max-width:320px;}
        .search-input{width:100%;padding:10px 14px 10px 38px;border-radius:10px;border:1.5px solid #e2e8f0;font-size:13px;color:#1e293b;background:#fff;font-family:var(--font-dm-sans, 'DM Sans', sans-serif);outline:none;}
        .search-input:focus{border-color:#2db9a3;}
        .table-card{background:#fff;border:1px solid #e8ecf2;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.05);}
        .tt-table{width:100%;border-collapse:collapse;}
        .tt-table thead tr{background:#f8fafc;border-bottom:1px solid #edf0f5;}
        .tt-table thead th{padding:12px 14px;text-align:center;font-size:10.5px;font-weight:700;color:#9aa5b4;text-transform:uppercase;letter-spacing:0.08em;white-space:nowrap;}
        .tt-table tbody tr{border-bottom:1px solid #f0f3f7;transition:background 0.12s;}
        .tt-table tbody tr:last-child{border-bottom:none;}
        .tt-table tbody tr:hover{background:#fafbfc;}
        .tt-table tbody td{padding:13px 14px;font-size:13px;color:#1e293b;vertical-align:middle;text-align:center;}
        .pagination-bar{display:flex;align-items:center;justify-content:space-between;padding:14px 24px;border-top:1px solid #f0f3f7;}
        .pg-btn{width:34px;height:34px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;color:#475569;transition:all 0.15s;}
        .pg-btn:hover:not(:disabled):not(.active){border-color:#2db9a3;color:#2db9a3;background:#f0fdf9;}
        .pg-btn.active{background:#2db9a3;border-color:#2db9a3;color:#fff;}
        .pg-btn:disabled{opacity:0.35;cursor:not-allowed;}
        .empty-state{text-align:center;padding:60px 20px;color:#94a3b8;}
        .empty-icon{font-size:40px;margin-bottom:12px;}
      `}</style>

      
        
        <div className="tt-content">
          
          <div className="main-content">

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Transaction Trail</h1>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Every significant action with a unique TXN ID — immutable compliance record</p>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#2db9a3', background: 'rgba(45,185,163,0.08)', padding: '8px 16px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={14} />{records.length} transactions
              </span>
            </div>

            <div className="controls-bar">
              <div className="search-wrap">
                <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                <input className="search-input" placeholder="Search by TXN ID, user or action..."
                  value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
              </div>
              <CustomSelect
                options={[{ value: 'all', label: 'All Dates' }, { value: 'today', label: 'Today' }, { value: 'last-7', label: 'Last 7 Days' }, { value: 'last-30', label: 'Last 30 Days' }]}
                value={dateRange} onChange={v => { setDateRange(v); setCurrentPage(1); }} />
              <CustomSelect
                options={modules.map(m => ({ value: m, label: m === 'all' ? 'All Modules' : m }))}
                value={moduleFilter} onChange={v => { setModuleFilter(v); setCurrentPage(1); }} />
            </div>

            {records.length === 0 && !loading ? (
              <div className="table-card">
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>No transactions yet</div>
                  <div style={{ fontSize: 13 }}>Transaction records are created when roles are assigned, users are created, or settings are changed.</div>
                </div>
              </div>
            ) : (
              <div className="table-card">
                <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Transaction Log</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{records.length} records — cannot be edited or deleted</div>
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="tt-table">
                    <thead>
                      <tr>
                        {['TXN ID', 'Date & Time', 'Performed By', 'Target', 'Action', 'Module', 'Details', 'IP', 'Status'].map(h =>
                          <th key={h}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>Loading...</td></tr>
                      ) : paged.map(r => {
                        const sc = statusCfg[r.status] ?? statusCfg.Warning;
                        return (
                          <tr key={r.id}>
                            <td>
                              <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#2db9a3', background: 'rgba(45,185,163,0.08)', padding: '3px 8px', borderRadius: 6 }}>
                                {r.txnId}
                              </span>
                            </td>
                            <td style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>{formatDate(r.createdAt)}</td>
                            <td>
                              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>{r.performedBy}</div>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.performerEmpId}</div>
                            </td>
                            <td style={{ color: '#64748b', fontSize: 12 }}>{r.targetUser}</td>
                            <td style={{ fontWeight: 600, color: '#334155', fontSize: 13 }}>{r.action}</td>
                            <td style={{ color: '#64748b', fontSize: 12 }}>{r.module ?? '—'}</td>
                            <td style={{ color: '#94a3b8', fontSize: 11, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.details ?? ''}>{r.details ?? '—'}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>{r.ipAddress ?? '—'}</td>
                            <td>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>
                                <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.dot }} />
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="pagination-bar">
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>
                    Showing <strong style={{ color: '#475569' }}>{records.length === 0 ? 0 : (safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, records.length)}</strong> of <strong style={{ color: '#475569' }}>{records.length}</strong>
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="pg-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>‹</button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                      <button key={p} className={`pg-btn${safePage === p ? ' active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
                    ))}
                    <button className="pg-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>›</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
    </DashboardLayout>
  );
}

