'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import { Bell, Download, FileText, FileSpreadsheet, ChevronLeft, ChevronRight } from 'lucide-react';

const recentExports = [
  { id:1, name:'Audit Logs — January 2024',        format:'PDF',  size:'2.4 MB',  date:'Jan 15, 14:10', user:'Emily Davis',   status:'completed' },
  { id:2, name:'Failed Login Report — Week 3',      format:'CSV',  size:'156 KB',  date:'Jan 14, 09:30', user:'Sarah Johnson', status:'completed' },
  { id:3, name:'User Activity Summary — Q4 2023',  format:'PDF',  size:'5.1 MB',  date:'Jan 12, 16:45', user:'Emily Davis',   status:'completed' },
  { id:4, name:'Permission Changes — December',     format:'CSV',  size:'89 KB',   date:'Jan 10, 11:20', user:'Sarah Johnson', status:'completed' },
  { id:5, name:'Security Incident Report — Jan',   format:'PDF',  size:'1.8 MB',  date:'Jan 8, 14:00',  user:'Michael Chen',  status:'completed' },
  { id:6, name:'Compliance Summary — Q4 2023',     format:'PDF',  size:'3.2 MB',  date:'Jan 6, 10:15',  user:'Emily Davis',   status:'completed' },
  { id:7, name:'User Access Report — December',    format:'XLSX', size:'420 KB',  date:'Jan 4, 08:45',  user:'Sarah Johnson', status:'completed' },
  { id:8, name:'Transaction Trail — Week 1',       format:'CSV',  size:'234 KB',  date:'Jan 2, 13:00',  user:'Michael Chen',  status:'completed' },
];

const reportTemplates = [
  { name:'Audit Log Report',          desc:'Complete activity logs with filters',       icon:FileText,        formats:['PDF','CSV'],        accent:'#2db9a3' },
  { name:'Security Incident Report',  desc:'Failed logins, blocked IPs, threats',       icon:FileText,        formats:['PDF'],              accent:'#ef4444' },
  { name:'User Access Report',        desc:'User roles, permissions, last login',        icon:FileSpreadsheet, formats:['PDF','CSV','XLSX'],  accent:'#6366f1' },
  { name:'Compliance Summary',        desc:'MFA enrollment, password policy status',    icon:FileText,        formats:['PDF'],              accent:'#f59e0b' },
  { name:'Transaction Trail Export',  desc:'All system transactions with details',      icon:FileSpreadsheet, formats:['CSV','XLSX'],       accent:'#8b5cf6' },
  { name:'Device & Session Report',   desc:'Active devices and sessions per user',      icon:FileText,        formats:['PDF','CSV'],        accent:'#06b6d4' },
];

const formatCfg: Record<string,{color:string;bg:string}> = {
  PDF:  { color:'#dc2626', bg:'#fee2e2' },
  CSV:  { color:'#059669', bg:'#dcfce7' },
  XLSX: { color:'#2563eb', bg:'#dbeafe' },
};

const ROWS_PER_PAGE = 5;

export default function ExportReports() {
  const [dateRange,       setDateRange]       = useState('last-30');
  const [selectedFormat,  setSelectedFormat]  = useState('PDF');
  const [activeMenu,      setActiveMenu]      = useState('export-reports');
  const [sidebarOpen,     setSidebarOpen]     = useState(true);
  const [page,            setPage]            = useState(1);
  const router = useRouter();

  const totalPages = Math.max(1, Math.ceil(recentExports.length / ROWS_PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = recentExports.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .er-root    { display: flex; height: 100vh; background: #ffffff; overflow: hidden; font-family: 'Open Sans', sans-serif; }
        .er-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

        /* ── Topbar ── */
        .topbar { height: 66px; background: #fff; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .topbar-title { font-size: 16px; font-weight: 700; color: #0f172a; letter-spacing: -0.01em; }
        .topbar-right { display: flex; align-items: center; gap: 14px; }
        .notif-btn { width: 38px; height: 38px; border-radius: 10px; border: 1.5px solid #e2e8f0; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; transition: all 0.18s; position: relative; }
        .notif-btn:hover { border-color: #2db9a3; color: #2db9a3; background: #f0fdf9; }
        .notif-dot { position: absolute; top: 8px; right: 8px; width: 7px; height: 7px; background: #ef4444; border-radius: 50%; border: 1.5px solid #fff; }
        .profile-pill { display: flex; align-items: center; gap: 10px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 40px; padding: 5px 14px 5px 5px; cursor: pointer; transition: all 0.18s; }
        .profile-pill:hover { border-color: #2db9a3; background: #f0fdf9; }
        .profile-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #2db9a3, #6366f1); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; font-weight: 800; }
        .profile-name { font-size: 13px; font-weight: 600; color: #1e293b; }

        /* ── Main ── */
        .main-content { flex: 1; overflow-y: auto; padding: 32px 36px; scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
        .main-content::-webkit-scrollbar { width: 6px; }
        .main-content::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }

        /* ── Page header ── */
        .page-header { margin-bottom: 28px; }
        .eyebrow { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #2db9a3; background: rgba(45,185,163,0.08); padding: 4px 10px; border-radius: 20px; margin-bottom: 10px; }
        .eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: #2db9a3; }
        .page-header h1 { font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 4px; letter-spacing: -0.03em; }
        .page-header p { font-size: 14px; color: #94a3b8; font-weight: 400; }

        /* ── Section label ── */
        .section-label { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 16px; letter-spacing: -0.01em; margin-top: 40px; }
        .section-label:first-of-type { margin-top: 0; }

        /* ── Generate card ── */
        .gen-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 18px; padding: 24px; margin-bottom: 48px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); }
        .gen-grid { display: grid; grid-template-columns: 1fr 1fr auto; gap: 14px; align-items: end; }

        .field-label { font-size: 11.5px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 7px; display: block; }
        .field-select { width: 100%; padding: 10px 36px 10px 14px; border-radius: 10px; border: 1.5px solid #e2e8f0; font-size: 13.5px; color: #1e293b; background: #f8fafc; cursor: pointer; font-family: 'Open Sans', sans-serif; font-weight: 500; outline: none; transition: all 0.18s; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; }
        .field-select:focus { border-color: #2db9a3; background-color: #fff; box-shadow: 0 0 0 3px rgba(45,185,163,0.1); }

        .gen-btn { display: inline-flex; align-items: center; gap: 8px; padding: 11px 22px; border-radius: 10px; border: none; background: #2db9a3; color: #fff; font-size: 13.5px; font-weight: 700; cursor: pointer; font-family: 'Open Sans', sans-serif; white-space: nowrap; transition: all 0.18s; box-shadow: 0 2px 10px rgba(45,185,163,0.3); }
        .gen-btn:hover { background: #28a593; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(45,185,163,0.4); }

        /* ── Templates grid ── */
        .templates-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; margin-bottom: 48px; }

        .template-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 20px; position: relative; overflow: hidden; }
        .template-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--tc-accent); border-radius: 16px 16px 0 0; }

        .tc-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: var(--tc-icon-bg); color: var(--tc-accent); margin-bottom: 14px; }
        .tc-name { font-size: 13.5px; font-weight: 700; color: #0f172a; margin-bottom: 5px; letter-spacing: -0.01em; }
        .tc-desc { font-size: 12.5px; color: #94a3b8; margin-bottom: 14px; line-height: 1.5; font-weight: 400; }
        .format-badges { display: flex; gap: 5px; flex-wrap: wrap; }
        .format-pill { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; }

        /* ── Recent exports table card — redesigned to match screenshot ── */
        .table-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }

        .table-card-header {
          padding: 18px 24px 16px;
          display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px solid #f1f5f9;
        }
        .table-card-header h2 { font-size: 15px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em; }
        .table-card-header p  { font-size: 12.5px; color: #94a3b8; margin-top: 2px; }

        /* Table — centered headers + cells, clean rows like screenshot */
        .er-table { width: 100%; border-collapse: collapse; min-width: 640px; }

        .er-table thead tr { background: #f8fafc; }
        .er-table thead th {
          padding: 13px 20px;
          text-align: center;
          font-size: 10.5px; font-weight: 700; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 0.09em;
          border-top: 1px solid #edf2f7;
          border-bottom: 1px solid #edf2f7;
          white-space: nowrap;
        }
        .er-table thead th:last-child  { padding-right: 24px; }

        .er-table tbody tr { border-bottom: 1px solid #f1f5f9; transition: background 0.13s; }
        .er-table tbody tr:last-child { border-bottom: none; }
        .er-table tbody tr:hover { background: #fafbfd; }

        .er-table tbody td {
          padding: 18px 20px;
          font-size: 13px; color: #1e293b; font-weight: 500;
          vertical-align: middle; text-align: center;
        }
        .er-table tbody td:first-child { padding-left: 24px; }
        .er-table tbody td:last-child  { padding-right: 24px; }

        .report-name { font-weight: 700; color: #0f172a; font-size: 13px; }
        .size-text   { font-size: 12.5px; color: #64748b; font-weight: 400; }
        .date-text   { font-size: 12px; color: #94a3b8; font-weight: 400; white-space: nowrap; font-family: 'Menlo', 'Monaco', monospace; }
        .user-text   { font-size: 13px; color: #475569; font-weight: 500; }

        .dl-btn { display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; font-weight: 700; color: #2db9a3; background: rgba(45,185,163,0.08); padding: 6px 14px; border-radius: 8px; border: none; cursor: pointer; font-family: 'Open Sans', sans-serif; transition: all 0.15s; }
        .dl-btn:hover { background: rgba(45,185,163,0.15); }

        /* ── Pagination ── */
        .er-pagination {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 24px; border-top: 1px solid #f1f5f9;
          flex-wrap: wrap; gap: 10px;
        }
        .er-pag-info { font-size: 12.5px; color: #94a3b8; }
        .er-pag-info strong { color: #1e293b; font-weight: 700; }
        .er-pag-btns { display: flex; align-items: center; gap: 6px; }
        .er-pag-btn {
          width: 32px; height: 32px; border-radius: 8px;
          border: 1px solid #e2e8f0; background: #fff;
          color: #475569; font-size: 13px; font-weight: 500;
          font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .er-pag-btn:hover:not(:disabled):not(.er-pag-active) { background: #f1f5f9; border-color: #c8d0dc; }
        .er-pag-btn.er-pag-active { background: #2db9a3; color: #fff; border-color: #2db9a3; font-weight: 700; }
        .er-pag-btn:disabled { opacity: 0.38; cursor: not-allowed; }

        @media (max-width: 768px) {
          .topbar { padding: 0 18px; }
          .main-content { padding: 18px; }
          .gen-grid { grid-template-columns: 1fr; }
          .templates-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="er-root">
        <Sidebar
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onLogout={() => router.push('/')}
        />

        <div className="er-content">
          {/* Topbar */}
          <div className="topbar">
            <span className="topbar-title">Audit Logs</span>
            <div className="topbar-right">
              <button className="notif-btn">
                <Bell size={17} />
                <div className="notif-dot" />
              </button>
              <button onClick={() => router.push('/my-profile')} className="profile-pill" style={{ border: 'none' }}>
                <div className="profile-avatar">SJ</div>
                <span className="profile-name">Sarah Johnson</span>
              </button>
            </div>
          </div>

          {/* Main */}
          <div className="main-content">

            {/* Header */}
            <div className="page-header">
              <div className="eyebrow"><span className="eyebrow-dot" />Audit Logs</div>
              <h1>Export Reports</h1>
              <p>Generate and download audit reports</p>
            </div>

            {/* Generate */}
            <div className="section-label">Generate New Report</div>
            <div className="gen-card">
              <div className="gen-grid">
                <div>
                  <label className="field-label">Date Range</label>
                  <select className="field-select" value={dateRange} onChange={e => setDateRange(e.target.value)}>
                    <option value="today">Today</option>
                    <option value="last-7">Last 7 Days</option>
                    <option value="last-30">Last 30 Days</option>
                    <option value="last-90">Last 90 Days</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">Format</label>
                  <select className="field-select" value={selectedFormat} onChange={e => setSelectedFormat(e.target.value)}>
                    <option value="PDF">PDF Document</option>
                    <option value="CSV">CSV Spreadsheet</option>
                    <option value="XLSX">Excel Workbook</option>
                  </select>
                </div>
                <button className="gen-btn">
                  <Download size={15} />
                  Generate Report
                </button>
              </div>
            </div>

            {/* Templates */}
            <div className="section-label">Report Templates</div>
            <div className="templates-grid">
              {reportTemplates.map(t => {
                const Icon = t.icon;
                return (
                  <div
                    key={t.name}
                    className="template-card"
                    style={{ '--tc-accent': t.accent, '--tc-icon-bg': t.accent + '18' } as React.CSSProperties}
                  >
                    <div className="tc-icon"><Icon size={18} /></div>
                    <div className="tc-name">{t.name}</div>
                    <div className="tc-desc">{t.desc}</div>
                    <div className="format-badges">
                      {t.formats.map(f => {
                        const fc = formatCfg[f] || { color: '#64748b', bg: '#f1f5f9' };
                        return (
                          <span key={f} className="format-pill" style={{ background: fc.bg, color: fc.color }}>
                            {f}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Recent Exports — redesigned table ── */}
            <div className="table-card">
              <div className="table-card-header">
                <div>
                  <h2>Recent Exports</h2>
                  <p>{recentExports.length} recent exports</p>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="er-table">
                  <thead>
                    <tr>
                      <th>Report Name</th>
                      <th>Format</th>
                      <th>Size</th>
                      <th>Generated</th>
                      <th>By</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(e => {
                      const fc = formatCfg[e.format] || { color: '#64748b', bg: '#f1f5f9' };
                      return (
                        <tr key={e.id}>
                          <td><span className="report-name">{e.name}</span></td>
                          <td>
                            <span style={{ background: fc.bg, color: fc.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, display: 'inline-block' }}>
                              {e.format}
                            </span>
                          </td>
                          <td><span className="size-text">{e.size}</span></td>
                          <td><span className="date-text">{e.date}</span></td>
                          <td><span className="user-text">{e.user}</span></td>
                          <td>
                            <button className="dl-btn">
                              <Download size={13} />
                              Download
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="er-pagination">
                <span className="er-pag-info">
                  Showing{' '}
                  <strong>
                    {recentExports.length === 0 ? 0 : (safePage - 1) * ROWS_PER_PAGE + 1}–{Math.min(safePage * ROWS_PER_PAGE, recentExports.length)}
                  </strong>{' '}
                  of <strong>{recentExports.length}</strong> exports
                </span>
                <div className="er-pag-btns">
                  <button
                    className="er-pag-btn"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      className={`er-pag-btn${safePage === p ? ' er-pag-active' : ''}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    className="er-pag-btn"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}