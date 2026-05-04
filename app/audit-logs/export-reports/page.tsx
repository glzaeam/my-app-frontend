'use client';
import DashboardLayout from '@/app/components/DashboardLayout';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Download, FileText, FileSpreadsheet,
  ChevronDown, Activity, CheckCircle, XCircle, Clock,
} from 'lucide-react';
import { auth } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL;

interface ExportRecord {
  name: string;
  format: string;
  dateRange: string;
  type: string;
  generatedAt: string;
  generatedBy: string;
  url?: string;
}

function CustomSelect({
  options, value, onChange, label,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (val: string) => void;
  label?: string;
}) {
  const [open, setOpen]   = useState(false);
  const [pos, setPos]     = useState({ top: 0, left: 0, width: 0 });
  const triggerRef        = useRef<HTMLButtonElement>(null);
  const dropdownRef       = useRef<HTMLDivElement>(null);
  const selected          = options.find(o => o.value === value);

  const updatePos = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
  };

  const handleToggle = () => { updatePos(); setOpen(v => !v); };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !dropdownRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const sync = () => updatePos();
    window.addEventListener('scroll', sync, true);
    window.addEventListener('resize', sync);
    return () => { window.removeEventListener('scroll', sync, true); window.removeEventListener('resize', sync); };
  }, [open]);

  return (
    <div>
      {label && (
        <label style={{ fontSize: 11, fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, display: 'block' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <button ref={triggerRef} type="button" onClick={handleToggle}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${open ? '#1D9E75' : 'rgba(0,0,0,0.15)'}`, fontSize: 13, color: '#1a2332', background: '#ffffff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 400, outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'border-color 0.15s' }}>
          <span>{selected?.label ?? options[0]?.label}</span>
          <ChevronDown size={14} style={{ color: '#94a3b8', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
        </button>
        {open && typeof window !== 'undefined' && createPortal(
          <div ref={dropdownRef} style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 999999, overflow: 'hidden' }}>
            {options.map(opt => {
              const isSel = opt.value === value;
              return (
                <button key={opt.value} type="button"
                  onMouseDown={e => { e.preventDefault(); onChange(opt.value); setOpen(false); }}
                  style={{ width: '100%', padding: '10px 14px', fontSize: 13, color: isSel ? '#1D9E75' : '#1a2332', background: isSel ? 'rgba(29,158,117,0.07)' : 'transparent', fontWeight: isSel ? 500 : 400, fontFamily: 'inherit', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'block', lineHeight: 1.5 }}
                  onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.03)'; }}
                  onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                  {opt.label}
                </button>
              );
            })}
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}

const formatCfg: Record<string, { color: string; bg: string; border: string }> = {
  PDF:  { color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' },
  CSV:  { color: '#059669', bg: '#dcfce7', border: '#6ee7b7' },
  XLSX: { color: '#2563eb', bg: '#dbeafe', border: '#93c5fd' },
};

const reportTemplates = [
  { name: 'Activity Log Report',      desc: 'All system actions with user, module, and status', icon: FileText,        formats: ['PDF', 'CSV'], type: 'activity',     accent: '#1D9E75', accentBg: '#E1F5EE' },
  { name: 'Transaction Trail Export', desc: 'All TXN-ID records for compliance tracing',        icon: FileSpreadsheet, formats: ['PDF', 'CSV'], type: 'transactions', accent: '#7c3aed', accentBg: '#ede9fe' },
  { name: 'Security Report',          desc: 'Failed logins, alerts, and device events',          icon: FileText,        formats: ['PDF', 'CSV'], type: 'activity',     accent: '#dc2626', accentBg: '#fee2e2' },
  { name: 'User Access Summary',      desc: 'Role assignments and permission changes',           icon: FileSpreadsheet, formats: ['PDF', 'CSV'], type: 'activity',     accent: '#4f46e5', accentBg: '#e0e7ff' },
  { name: 'Compliance Summary',       desc: 'MFA, password policy, and session audit',          icon: FileText,        formats: ['PDF', 'CSV'], type: 'activity',     accent: '#d97706', accentBg: '#fef3c7' },
];

const ROWS_PER_PAGE = 10;

export default function ExportReports() {
  const router = useRouter();  const [dateRange, setDateRange]     = useState('last-30');
  const [reportType, setReportType]   = useState('activity');
  const [format, setFormat]           = useState('CSV');
  const [generating, setGenerating]   = useState(false);
  const [exports, setExports]         = useState<ExportRecord[]>([]);
  const [summary, setSummary]         = useState({ total: 0, success: 0, failed: 0, today: 0 });
  const [page, setPage]               = useState(1);

  const fetchSummary = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/audit/summary`, { headers: { Authorization: `Bearer ${auth.getToken()}` } });
      const data = await res.json();
      setSummary(data);
    } catch {}
  }, []);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  useEffect(() => {
    const saved = localStorage.getItem('nexum_exports');
    if (saved) setExports(JSON.parse(saved));
  }, []);

  const saveExports = (list: ExportRecord[]) => {
    setExports(list);
    localStorage.setItem('nexum_exports', JSON.stringify(list));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      let res: Response;
      if (format === 'PDF') {
        const params = new URLSearchParams({ dateRange, type: reportType, tzOffset: (-new Date().getTimezoneOffset()).toString() });
        res = await fetch(`${API}/audit/export/pdf?${params}`, { headers: { Authorization: `Bearer ${auth.getToken()}` } });
      } else {
        const params = new URLSearchParams({ format: format.toLowerCase(), dateRange, type: reportType });
        res = await fetch(`${API}/audit/export?${params}`, { headers: { Authorization: `Bearer ${auth.getToken()}` } });
      }
      if (!res.ok) { alert('Export failed'); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${reportType}-report-${dateRange}.${format.toLowerCase()}`;
      a.click();
      URL.revokeObjectURL(url);
      const newExport: ExportRecord = {
        name:        `${reportType === 'transactions' ? 'Transaction Trail' : 'Activity Log'} — ${dateRange}`,
        format, dateRange, type: reportType,
        generatedAt: new Date().toISOString(), generatedBy: 'Admin',
      };
      saveExports([newExport, ...exports].slice(0, 20));
    } catch { alert('Export failed — check API connection'); }
    finally { setGenerating(false); }
  };

  const handleTemplateDownload = async (template: typeof reportTemplates[0], fmt = 'PDF') => {
    let res: Response;
    if (fmt === 'PDF') {
      const params = new URLSearchParams({ dateRange: 'last-30', type: template.type, tzOffset: (-new Date().getTimezoneOffset()).toString() });
      res = await fetch(`${API}/audit/export/pdf?${params}`, { headers: { Authorization: `Bearer ${auth.getToken()}` } });
    } else {
      const params = new URLSearchParams({ format: 'csv', dateRange: 'last-30', type: template.type });
      res = await fetch(`${API}/audit/export?${params}`, { headers: { Authorization: `Bearer ${auth.getToken()}` } });
    }
    if (!res.ok) return;
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${template.type}-report-last-30.${fmt.toLowerCase()}`;
    a.click();
    URL.revokeObjectURL(url);
    const newExport: ExportRecord = {
      name: `${template.name} — Last 30 Days`, format: fmt,
      dateRange: 'last-30', type: template.type,
      generatedAt: new Date().toISOString(), generatedBy: 'Admin',
    };
    saveExports([newExport, ...exports].slice(0, 20));
  };

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    const utcString = iso.endsWith('Z') ? iso : iso + 'Z';
    return new Date(utcString).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  };

  const totalPages = Math.max(1, Math.ceil(exports.length / ROWS_PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = exports.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);

  const stats = [
    { label: 'Total logs',   value: summary.total,   icon: Activity,    color: '#4f46e5', bg: '#e0e7ff' },
    { label: 'Successful',   value: summary.success, icon: CheckCircle, color: '#059669', bg: '#dcfce7' },
    { label: 'Failed',       value: summary.failed,  icon: XCircle,     color: '#dc2626', bg: '#fee2e2' },
    { label: "Today's logs", value: summary.today,   icon: Clock,       color: '#1D9E75', bg: '#E1F5EE' },
  ];

  const card: React.CSSProperties = {
    background: '#ffffff',
    border: '0.5px solid rgba(0,0,0,0.08)',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 500,
    color: '#0f172a',
    marginBottom: 12,
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#ffffff', overflow: 'hidden', fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
      

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        

        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}>

          {/* Page Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Export Reports</h1>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Generate and download audit reports in PDF or CSV format</p>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {stats.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} style={{ ...card, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} style={{ color: s.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 600, color: '#0f172a', letterSpacing: '-0.02em' }}>{s.value.toLocaleString()}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Generate */}
          <p style={sectionLabel}>Generate new report</p>
          <div style={{ ...card, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
              <CustomSelect label="Report type" options={[{ value: 'activity', label: 'Activity logs' }, { value: 'transactions', label: 'Transaction trail' }]} value={reportType} onChange={setReportType} />
              <CustomSelect label="Date range" options={[{ value: 'today', label: 'Today' }, { value: 'last-7', label: 'Last 7 days' }, { value: 'last-30', label: 'Last 30 days' }, { value: 'last-90', label: 'Last 90 days' }]} value={dateRange} onChange={setDateRange} />
              <CustomSelect label="Format" options={[{ value: 'PDF', label: 'PDF report' }, { value: 'CSV', label: 'CSV spreadsheet' }]} value={format} onChange={setFormat} />
              <div>
                <div style={{ fontSize: 11, marginBottom: 6, visibility: 'hidden' }}>.</div>
                <button onClick={handleGenerate} disabled={generating}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 8, border: 'none', background: generating ? '#9ca3af' : '#1D9E75', color: '#fff', fontSize: 13, fontWeight: 500, cursor: generating ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'background 0.15s' }}>
                  <Download size={14} />
                  {generating ? 'Generating…' : 'Generate & download'}
                </button>
              </div>
            </div>
          </div>

          {/* Templates */}
          <p style={sectionLabel}>Quick export templates</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, marginBottom: 24 }}>
            {reportTemplates.map(t => {
              const Icon = t.icon;
              return (
                <div key={t.name} style={{ ...card, padding: 18, borderTop: `2.5px solid ${t.accent}`, borderRadius: '0 0 12px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: t.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} style={{ color: t.accent }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', marginBottom: 3 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>{t.desc}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                    {t.formats.map(f => {
                      const fc = formatCfg[f] ?? { color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' };
                      return (
                        <button key={f} onClick={() => handleTemplateDownload(t, f)}
                          style={{ fontSize: 11, fontWeight: 500, padding: '4px 12px', borderRadius: 20, background: fc.bg, color: fc.color, border: `1px solid ${fc.border}`, cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                          {f}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Exports */}
          <p style={sectionLabel}>Recent exports</p>
          <div style={{ ...card, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>Export history</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: '#1D9E75', background: '#E1F5EE', padding: '3px 10px', borderRadius: 20 }}>
                {exports.length} exports
              </span>
            </div>

            {exports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 13 }}>
                No exports yet — generate a report above.
              </div>
            ) : (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ background: '#ffffff' }}>
                      {['Report name', 'Format', 'Type', 'Date range', 'Generated at', 'By'].map(h => (
                        <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 10.5, fontWeight: 500, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((e, i) => {
                      const fc = formatCfg[e.format] ?? { color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' };
                      return (
                        <tr key={i} style={{ borderTop: i === 0 ? 'none' : '0.5px solid rgba(0,0,0,0.05)' }}>
                          <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{e.name}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ background: fc.bg, color: fc.color, border: `1px solid ${fc.border}`, fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20 }}>{e.format}</span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 12.5, color: '#64748b' }}>{e.type === 'transactions' ? 'Transaction trail' : 'Activity logs'}</td>
                          <td style={{ padding: '12px 16px', fontSize: 12.5, color: '#64748b' }}>{e.dateRange}</td>
                          <td style={{ padding: '12px 16px', fontSize: 12.5, color: '#94a3b8' }}>{formatDate(e.generatedAt)}</td>
                          <td style={{ padding: '12px 16px', fontSize: 12.5, color: '#475569' }}>{e.generatedBy}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '0.5px solid rgba(0,0,0,0.06)', background: '#ffffff' }}>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>
                    Showing <strong style={{ color: '#475569', fontWeight: 500 }}>{(safePage - 1) * ROWS_PER_PAGE + 1}–{Math.min(safePage * ROWS_PER_PAGE, exports.length)}</strong> of <strong style={{ color: '#475569', fontWeight: 500 }}>{exports.length}</strong>
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                      style={{ width: 30, height: 30, borderRadius: 7, border: '0.5px solid rgba(0,0,0,0.15)', background: '#fff', cursor: safePage === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', opacity: safePage === 1 ? 0.4 : 1, fontSize: 16 }}>‹</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} onClick={() => setPage(p)}
                        style={{ width: 30, height: 30, borderRadius: 7, fontSize: 13, border: safePage === p ? 'none' : '0.5px solid rgba(0,0,0,0.15)', background: safePage === p ? '#1D9E75' : '#fff', color: safePage === p ? '#fff' : '#64748b', cursor: 'pointer', fontWeight: safePage === p ? 500 : 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {p}
                      </button>
                    ))}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                      style={{ width: 30, height: 30, borderRadius: 7, border: '0.5px solid rgba(0,0,0,0.15)', background: '#fff', cursor: safePage === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', opacity: safePage === totalPages ? 0.4 : 1, fontSize: 16 }}>›</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

