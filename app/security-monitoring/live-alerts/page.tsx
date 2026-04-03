'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import { Bell, AlertTriangle, Eye, Lock, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';

const alerts = [
  { type:'critical', title:'Brute Force Attack Detected',   desc:'Multiple failed login attempts from IP 192.168.1.105',       time:'2 min ago',   icon: AlertTriangle },
  { type:'warning',  title:'Unusual Login Location',         desc:'Employee MGR001 logged in from unrecognized location',        time:'15 min ago',  icon: Eye           },
  { type:'info',     title:'New Device Registered',          desc:'Employee TEL001 registered a new mobile device',             time:'1 hour ago',  icon: Lock          },
  { type:'critical', title:'Account Locked',                 desc:'Employee ID EMP042 locked after 5 failed attempts',          time:'2 hours ago', icon: AlertTriangle },
  { type:'warning',  title:'Session Timeout Override',       desc:'Admin extended session beyond policy limit',                  time:'3 hours ago', icon: Eye           },
];

const failedLogins = [
  { time:'14:32:05', employeeId:'Unknown', ip:'192.168.1.105', attempts:5, status:'Blocked'    },
  { time:'14:15:33', employeeId:'EMP042',  ip:'10.0.0.45',     attempts:5, status:'Locked'     },
  { time:'13:55:22', employeeId:'Unknown', ip:'203.0.113.42',  attempts:3, status:'Monitoring' },
  { time:'13:30:05', employeeId:'TEL003',  ip:'172.16.0.12',   attempts:2, status:'Monitoring' },
];

const alertCfg: Record<string, { color:string; bg:string; border:string; dot:string; iconBg:string }> = {
  critical: { color:'#dc2626', bg:'#fff5f5', border:'#fca5a5', dot:'#ef4444', iconBg:'rgba(239,68,68,0.1)' },
  warning:  { color:'#d97706', bg:'#fffbeb', border:'#fde68a', dot:'#f59e0b', iconBg:'rgba(245,158,11,0.1)' },
  info:     { color:'#2db9a3', bg:'#f0fdf9', border:'#a7f3d0', dot:'#10b981', iconBg:'rgba(45,185,163,0.1)'  },
};

const flStatusCfg: Record<string, { color:string; bg:string; dot:string }> = {
  Blocked:    { color:'#dc2626', bg:'#fee2e2', dot:'#ef4444' },
  Locked:     { color:'#d97706', bg:'#fef3c7', dot:'#f59e0b' },
  Monitoring: { color:'#2563eb', bg:'#dbeafe', dot:'#3b82f6' },
};

export default function LiveAlerts() {
  const [activeMenu, setActiveMenu] = useState('live-alerts');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const router = useRouter();
  const criticalCount = alerts.filter(a=>a.type==='critical').length;
  const totalPages = Math.ceil(failedLogins.length / itemsPerPage);
  const paged = failedLogins.slice((currentPage-1)*itemsPerPage, currentPage*itemsPerPage);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        .la-root{display:flex;height:100vh;background:#ffffff;overflow:hidden;font-family:'Open Sans',sans-serif;}
        .la-content{flex:1;display:flex;flex-direction:column;overflow:hidden;}
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
        .section-title{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
        .section-title h2{font-size:15px;font-weight:700;color:#0f172a;}
        .live-badge{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:#059669;background:#dcfce7;padding:5px 12px;border-radius:20px;}
        .live-dot{width:6px;height:6px;background:#10b981;border-radius:50%;animation:blink 2s ease-in-out infinite;}
        @keyframes blink{0%,100%{opacity:1;}50%{opacity:0.3;}}
        .alerts-list{display:flex;flex-direction:column;gap:10px;margin-bottom:28px;}
        .alert-card{background:#fff;border:1.5px solid var(--a-border);border-left:3px solid var(--a-color);border-radius:14px;padding:16px 20px;display:flex;align-items:flex-start;gap:14px;transition:box-shadow 0.2s;}
        .alert-card:hover{box-shadow:0 4px 16px rgba(0,0,0,0.06);}
        .alert-icon-wrap{width:36px;height:36px;border-radius:10px;background:var(--a-icon-bg);color:var(--a-color);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .alert-body{flex:1;}
        .alert-header-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;}
        .alert-title{font-size:13.5px;font-weight:700;color:#0f172a;}
        .alert-type-badge{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:2px 9px;border-radius:20px;text-transform:capitalize;}
        .alert-time{font-size:11.5px;color:#94a3b8;}
        .alert-desc{font-size:12.5px;color:#64748b;}
        .table-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:18px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.04);}
        .table-card-header{padding:18px 24px 14px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f1f5f9;}
        .table-card-header h2{font-size:15px;font-weight:700;color:#0f172a;}
        .table-card-header p{font-size:12.5px;color:#94a3b8;margin-top:2px;}
        .count-red{font-size:12px;font-weight:700;color:#ef4444;background:rgba(239,68,68,0.1);padding:4px 12px;border-radius:20px;}
        .fl2-table{width:100%;border-collapse:collapse;}
        .fl2-table thead tr{background:#f8fafc;border-bottom:1.5px solid #f1f5f9;}
        .fl2-table thead th{padding:11px 16px;text-align:center;font-size:10.5px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:0.09em;white-space:nowrap;}
        .fl2-table tbody tr{border-bottom:1px solid #f8fafc;transition:background 0.13s;}
        .fl2-table tbody tr:last-child{border-bottom:none;}
        .fl2-table tbody tr:hover{background:#fafbfd;}
        .fl2-table tbody td{padding:13px 16px;font-size:13px;color:#1e293b;font-weight:500;vertical-align:middle;text-align:center;}
        .time-text{font-size:12px;color:#94a3b8;font-family:'Menlo','Monaco',monospace;}
        .emp-chip{font-family:'Menlo','Monaco',monospace;font-size:11.5px;font-weight:700;color:#475569;background:#f1f5f9;padding:3px 8px;border-radius:6px;border:1px solid #e2e8f0;}
        .ip-m{font-family:'Menlo','Monaco',monospace;font-size:11.5px;color:#475569;}
        .att-val{font-size:14px;font-weight:400;color:#0f172a;}
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
      <div className="la-root">
        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={()=>router.push('/')}/>
        <div className="la-content">
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
              <h1>Live Alerts</h1>
              <p>Real-time security alerts and threat detection</p>
            </div>
            <div className="section-title">
              <h2>Active Alerts</h2>
              <div className="live-badge"><div className="live-dot"/>Live</div>
            </div>
            <div className="alerts-list">
              {alerts.map((a,i)=>{
                const cfg=alertCfg[a.type]||alertCfg.info;
                const Icon=a.icon;
                return (
                  <div key={i} className="alert-card" style={{'--a-color':cfg.color,'--a-border':cfg.border,'--a-icon-bg':cfg.iconBg} as any}>
                    <div className="alert-icon-wrap"><Icon size={16}/></div>
                    <div className="alert-body">
                      <div className="alert-header-row">
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <span className="alert-title">{a.title}</span>
                          <span className="alert-type-badge" style={{background:cfg.bg,color:cfg.color}}>{a.type}</span>
                        </div>
                        <span className="alert-time">{a.time}</span>
                      </div>
                      <p className="alert-desc">{a.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="table-card">
              <div className="table-card-header">
                <div><h2>Failed Login Attempts</h2><p>{failedLogins.length} incidents today</p></div>
                <span className="count-red">{failedLogins.filter(l=>l.status==='Blocked'||l.status==='Locked').length} blocked/locked</span>
              </div>
              <table className="fl2-table">
                <thead><tr><th>Time</th><th>Employee ID</th><th>IP Address</th><th>Attempts</th><th>Status</th></tr></thead>
                <tbody>
                  {paged.map((l,i)=>{
                    const sc=flStatusCfg[l.status]||flStatusCfg.Monitoring;
                    return (
                      <tr key={i}>
                        <td><span className="time-text">{l.time}</span></td>
                        <td>{l.employeeId}</td>
                        <td><span className="ip-m">{l.ip}</span></td>
                        <td><span className="att-val">{l.attempts}</span></td>
                        <td><span className="badge" style={{background:sc.bg,color:sc.color}}><span className="badge-dot" style={{background:sc.dot}}/>{l.status}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="pagination-bar">
                <span className="pagination-info">Showing <strong>{(currentPage-1)*itemsPerPage+1}–{Math.min(currentPage*itemsPerPage,failedLogins.length)}</strong> of <strong>{failedLogins.length}</strong></span>
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