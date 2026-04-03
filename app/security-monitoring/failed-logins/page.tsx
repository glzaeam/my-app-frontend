'use client';
// ─── FailedLogins ──────────────────────────────────────────────────
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import { Bell, AlertTriangle, Ban, Lock, ShieldAlert, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

const failedLogins = [
  { date:'Jan 15, 14:32', employeeId:'Unknown', ip:'203.45.67.89',    location:'Moscow, Russia',    attempts:12, method:'Brute Force',          status:'blocked',    risk:'critical' },
  { date:'Jan 15, 14:15', employeeId:'EMP042',  ip:'10.0.0.45',       location:'East Branch',       attempts:5,  method:'Wrong Password',        status:'locked',     risk:'high'     },
  { date:'Jan 15, 13:55', employeeId:'Unknown', ip:'185.220.101.42',  location:'Tor Exit Node',     attempts:8,  method:'Credential Stuffing',   status:'blocked',    risk:'critical' },
  { date:'Jan 15, 13:30', employeeId:'TEL003',  ip:'172.16.0.12',     location:'West Branch',       attempts:3,  method:'Wrong Password',        status:'monitoring', risk:'medium'   },
  { date:'Jan 15, 12:45', employeeId:'Unknown', ip:'91.234.56.78',    location:'Beijing, China',    attempts:15, method:'Brute Force',           status:'blocked',    risk:'critical' },
  { date:'Jan 15, 12:20', employeeId:'MGR002',  ip:'10.0.12.90',      location:'Downtown Branch',   attempts:2,  method:'Wrong Password',        status:'monitoring', risk:'low'      },
  { date:'Jan 15, 11:55', employeeId:'Unknown', ip:'45.33.32.156',    location:'Unknown VPN',       attempts:7,  method:'Credential Stuffing',   status:'blocked',    risk:'high'     },
];

const riskCfg: Record<string, { color:string; bg:string; dot:string }> = {
  critical: { color:'#dc2626', bg:'#fee2e2', dot:'#ef4444' },
  high:     { color:'#ea580c', bg:'#ffedd5', dot:'#f97316' },
  medium:   { color:'#d97706', bg:'#fef3c7', dot:'#f59e0b' },
  low:      { color:'#059669', bg:'#dcfce7', dot:'#10b981' },
};
const statusCfg2: Record<string, { color:string; bg:string; dot:string }> = {
  blocked:    { color:'#dc2626', bg:'#fee2e2', dot:'#ef4444' },
  locked:     { color:'#d97706', bg:'#fef3c7', dot:'#f59e0b' },
  monitoring: { color:'#2563eb', bg:'#dbeafe', dot:'#3b82f6' },
};

export function FailedLoginsPage() {
  const [activeMenu, setActiveMenu] = useState('failed-logins');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [riskFilter, setRiskFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const router = useRouter();

  const filtered = failedLogins.filter(l => {
    if (riskFilter !== 'all' && l.risk !== riskFilter) return false;
    if (searchTerm && !l.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) && !l.ip.includes(searchTerm)) return false;
    return true;
  });
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paged = filtered.slice((currentPage-1)*itemsPerPage, currentPage*itemsPerPage);
  const stats2 = [
    { label:'Total Failed',      value:failedLogins.length,                                    accent:'#6366f1', iconBg:'rgba(99,102,241,0.1)',  icon:<AlertTriangle size={20}/> },
    { label:'IPs Blocked',       value:failedLogins.filter(l=>l.status==='blocked').length,    accent:'#ef4444', iconBg:'rgba(239,68,68,0.1)',   icon:<Ban size={20}/> },
    { label:'Accounts Locked',   value:failedLogins.filter(l=>l.status==='locked').length,     accent:'#f59e0b', iconBg:'rgba(245,158,11,0.1)',  icon:<Lock size={20}/> },
    { label:'Critical Threats',  value:failedLogins.filter(l=>l.risk==='critical').length,     accent:'#dc2626', iconBg:'rgba(220,38,38,0.1)',   icon:<ShieldAlert size={20}/> },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        .fl-root{display:flex;height:100vh;background:#ffffff;overflow:hidden;font-family:'Open Sans',sans-serif;}
        .fl-content{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .topbar{height:66px;background:#fff;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;padding:0 32px;flex-shrink:0;box-shadow:0 1px 3px rgba(0,0,0,0.04);}
        .topbar-title{font-size:16px;font-weight:700;color:#0f172a;letter-spacing:-0.01em;}
        .topbar-right{display:flex;align-items:center;gap:14px;}
        .notif-btn{width:38px;height:38px;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#64748b;transition:all 0.18s;position:relative;}
        .notif-btn:hover{border-color:#2db9a3;color:#2db9a3;background:#f0fdf9;}
        .notif-dot{position:absolute;top:8px;right:8px;width:7px;height:7px;background:#ef4444;border-radius:50%;border:1.5px solid #fff;}
        .profile-pill{display:flex;align-items:center;gap:10px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:40px;padding:5px 14px 5px 5px;cursor:pointer;transition:all 0.18s;}
        .profile-pill:hover{border-color:#2db9a3;background:#f0fdf9;}
        .profile-avatar{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#2db9a3,#6366f1);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:800;}
        .profile-name{font-size:13px;font-weight:600;color:#1e293b;}
        .main-content{flex:1;overflow-y:auto;padding:32px 36px;scrollbar-width:thin;scrollbar-color:#e2e8f0 transparent;}
        .main-content::-webkit-scrollbar{width:6px;}
        .main-content::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:3px;}
        .page-header{margin-bottom:28px;}
        .eyebrow{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#2db9a3;background:rgba(45,185,163,0.08);padding:4px 10px;border-radius:20px;margin-bottom:10px;}
        .eyebrow-dot{width:6px;height:6px;border-radius:50%;background:#2db9a3;}
        .page-header h1{font-size:26px;font-weight:800;color:#0f172a;margin-bottom:4px;letter-spacing:-0.03em;}
        .page-header p{font-size:14px;color:#94a3b8;}
        .stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:24px;}
        .stat-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;padding:18px 20px;position:relative;overflow:hidden;}
        .stat-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;}
        .stat-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:var(--icon-bg);color:var(--accent);}
        .stat-label{font-size:11.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:4px;}
        .stat-value{font-size:30px;font-weight:800;color:#0f172a;letter-spacing:-0.03em;}
        .controls-bar{display:flex;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap;}
        .search-wrap{position:relative;flex:1;min-width:200px;max-width:340px;}
        .search-input{width:100%;padding:8px 14px 8px 38px;border-radius:10px;border:1.5px solid #e2e8f0;font-size:13px;color:#1e293b;background:#fff;font-family:'Open Sans',sans-serif;outline:none;transition:all 0.18s;}
        .search-input::placeholder{color:#94a3b8;}
        .search-input:focus{border-color:#2db9a3;box-shadow:0 0 0 3px rgba(45,185,163,0.1);}
        .filter-dropdown{padding:8px 12px;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;font-size:13px;font-weight:400;color:#94a3b8;font-family:'Open Sans',sans-serif;cursor:pointer;transition:all 0.15s;outline:none;}
        .filter-dropdown:hover{border-color:#2db9a3;}
        .filter-dropdown:focus{border-color:#2db9a3;box-shadow:0 0 0 3px rgba(45,185,163,0.1);}
        .filter-dropdown option{padding:8px;background:#fff;color:#0f172a;}
        .table-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:18px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.04);}
        .table-card-header{padding:18px 24px 14px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f1f5f9;}
        .table-card-header h2{font-size:15px;font-weight:700;color:#0f172a;}
        .table-card-header p{font-size:12.5px;color:#94a3b8;margin-top:2px;}
        .count-badge{font-size:12px;font-weight:700;color:#ef4444;background:rgba(239,68,68,0.1);padding:4px 12px;border-radius:20px;}
        .fl-table{width:100%;border-collapse:collapse;}
        .fl-table thead tr{background:#f8fafc;border-bottom:1.5px solid #f1f5f9;}
        .fl-table thead th{padding:11px 16px;text-align:center;font-size:10.5px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:0.09em;white-space:nowrap;}
        .fl-table tbody tr{border-bottom:1px solid #f8fafc;transition:background 0.13s;}
        .fl-table tbody tr:last-child{border-bottom:none;}
        .fl-table tbody tr:hover{background:#fafbfd;}
        .fl-table tbody td{padding:13px 16px;font-size:13px;color:#1e293b;font-weight:500;vertical-align:middle;text-align:center;}
        .date-text{font-size:12px;color:#94a3b8;font-weight:400;white-space:nowrap;}
        .emp-chip{font-family:'Menlo','Monaco',monospace;font-size:11.5px;font-weight:700;color:#475569;background:#f1f5f9;padding:3px 8px;border-radius:6px;border:1px solid #e2e8f0;}
        .ip-mono{font-family:'Menlo','Monaco',monospace;font-size:11.5px;color:#475569;}
        .loc-text{font-size:12.5px;color:#64748b;}
        .attempts-val{font-size:14px;font-weight:400;color:#0f172a;}
        .method-text{font-size:12.5px;color:#64748b;}
        .badge{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;white-space:nowrap;}
        .badge-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0;}
        .pagination-bar{display:flex;align-items:center;justify-content:space-between;padding:14px 24px;border-top:1px solid #f1f5f9;background:#fafbfc;}
        .pagination-info{font-size:13px;color:#94a3b8;font-weight:500;}
        .pagination-info strong{color:#475569;font-weight:700;}
        .pagination-controls{display:flex;align-items:center;gap:4px;}
        .pg-btn{width:34px;height:34px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:#64748b;font-family:'Open Sans',sans-serif;transition:all 0.15s;}
        .pg-btn:hover:not(:disabled){border-color:#2db9a3;color:#2db9a3;background:#f0fdf9;}
        .pg-btn:disabled{opacity:0.35;cursor:not-allowed;}
        .pg-btn.active{background:#2db9a3;border-color:#2db9a3;color:#fff;box-shadow:0 2px 10px rgba(45,185,163,0.35);}
      `}</style>
      <div className="fl-root">
        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={()=>router.push('/')}/>
        <div className="fl-content">
          <div className="topbar">
            <span className="topbar-title">Security Monitoring</span>
            <div className="topbar-right">
              <button className="notif-btn"><Bell size={17}/><div className="notif-dot"/></button>
              <button onClick={()=>router.push('/my-profile')} className="profile-pill" style={{border:'none'}}>
                <div className="profile-avatar">SJ</div><span className="profile-name">Sarah Johnson</span>
              </button>
            </div>
          </div>
          <div className="main-content">
            <div className="page-header">
              <div className="eyebrow"><span className="eyebrow-dot"/>Security Monitoring</div>
              <h1>Failed Logins</h1>
              <p>Track and investigate failed login attempts across your system</p>
            </div>
            <div className="stats-grid">
              {stats2.map((s,i)=>(
                <div key={i} className="stat-card" style={{'--accent':s.accent,'--icon-bg':s.iconBg} as any}>
                  <div className="stat-top">
                    <div><div className="stat-label">{s.label}</div><div className="stat-value">{s.value}</div></div>
                    <div className="stat-icon">{s.icon}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="controls-bar">
              <div className="search-wrap">
                <Search size={14} style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:'#94a3b8',pointerEvents:'none'}}/>
                <input className="search-input" placeholder="Search by ID or IP..." value={searchTerm} onChange={e=>{setSearchTerm(e.target.value);setCurrentPage(1);}}/>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:0,position:'relative'}}>
                <div style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}>
                  <Filter size={13} style={{color:'#94a3b8'}}/>
                </div>
                <select className="filter-dropdown" value={riskFilter} onChange={(e)=>{setRiskFilter(e.target.value);setCurrentPage(1);}} style={{paddingLeft:32}}>     
                  <option value="all">All Risk Levels</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <div className="table-card">
              <div className="table-card-header">
                <div><h2>Failed Login Log</h2><p>{filtered.length} records found</p></div>
                <span className="count-badge">{failedLogins.filter(l=>l.risk==='critical').length} critical</span>
              </div>
              <table className="fl-table">
                <thead><tr><th>Date & Time</th><th>Emp ID</th><th>IP Address</th><th>Location</th><th>Attempts</th><th>Method</th><th>Status</th><th>Risk</th></tr></thead>
                <tbody>
                  {paged.map((l,i)=>{
                    const rc=riskCfg[l.risk]||riskCfg.medium;
                    const sc=statusCfg2[l.status]||statusCfg2.monitoring;
                    return (
                      <tr key={i}>
                        <td><span className="date-text">{l.date}</span></td>
                        <td>{l.employeeId}</td>
                        <td><span className="ip-mono">{l.ip}</span></td>
                        <td><span className="loc-text">{l.location}</span></td>
                        <td><span className="attempts-val">{l.attempts}</span></td>
                        <td><span className="method-text">{l.method}</span></td>
                        <td><span className="badge" style={{background:sc.bg,color:sc.color}}><span className="badge-dot" style={{background:sc.dot}}/>{l.status}</span></td>
                        <td><span className="badge" style={{background:rc.bg,color:rc.color}}><span className="badge-dot" style={{background:rc.dot}}/>{l.risk}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="pagination-bar">
                <span className="pagination-info">Showing <strong>{(currentPage-1)*itemsPerPage+1}–{Math.min(currentPage*itemsPerPage,filtered.length)}</strong> of <strong>{filtered.length}</strong></span>
                <div className="pagination-controls">
                  <button className="pg-btn" onClick={()=>setCurrentPage(p=>Math.max(p-1,1))} disabled={currentPage===1}><ChevronLeft size={15}/></button>
                  {Array.from({length:totalPages},(_,i)=>i+1).map(p=><button key={p} className={`pg-btn ${currentPage===p?'active':''}`} onClick={()=>setCurrentPage(p)}>{p}</button>)}
                  <button className="pg-btn" onClick={()=>setCurrentPage(p=>Math.min(p+1,totalPages))} disabled={currentPage===totalPages}><ChevronRight size={15}/></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default FailedLoginsPage;