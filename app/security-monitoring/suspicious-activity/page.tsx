'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import { Bell, AlertTriangle, Eye, Clock, MapPin, Globe } from 'lucide-react';

const activities = [
  { id:1, severity:'critical', title:'Brute Force Attack',             desc:'15 failed attempts in 2 minutes from single IP',          ip:'203.45.67.89',   location:'Moscow, Russia',      time:'2 min ago',   user:'Unknown',                  action:'Auto-blocked'  },
  { id:2, severity:'critical', title:'Credential Stuffing Detected',   desc:'Multiple user IDs attempted from Tor exit node',          ip:'185.220.101.42', location:'Tor Network',         time:'15 min ago',  user:'Unknown',                  action:'Auto-blocked'  },
  { id:3, severity:'high',     title:'Unusual Login Location',         desc:'Employee logged in from unrecognized country',            ip:'45.33.32.156',   location:'Lagos, Nigeria',      time:'1 hour ago',  user:'EMP029 — David Park',      action:'Under Review'  },
  { id:4, severity:'high',     title:'After-Hours Access',             desc:'Bank Teller accessed system at 3:22 AM',                  ip:'10.0.8.99',      location:'Main St Branch',      time:'5 hours ago', user:'TEL004 — Anna Lee',        action:'Flagged'       },
  { id:5, severity:'medium',   title:'Multiple Password Resets',       desc:'3 password resets requested within 1 hour',               ip:'10.0.0.45',      location:'East Branch',         time:'3 hours ago', user:'EMP042 — Robert Lee',      action:'Monitoring'    },
  { id:6, severity:'medium',   title:'Permission Escalation Attempt',  desc:'User attempted to access admin-only module',              ip:'172.16.0.12',    location:'West Branch',         time:'4 hours ago', user:'TEL003 — Mark Brown',      action:'Denied & Logged'},
  { id:7, severity:'low',      title:'New Device Login',               desc:'First login from a new mobile device',                    ip:'10.0.12.88',     location:'Downtown Branch',     time:'6 hours ago', user:'MGR001 — Michael Chen',    action:'Verified'      },
];

const severityCfg: Record<string, { color:string; bg:string; border:string; dot:string; iconBg:string }> = {
  critical: { color:'#dc2626', bg:'#fff5f5', border:'#fca5a5', dot:'#ef4444', iconBg:'rgba(239,68,68,0.1)' },
  high:     { color:'#ea580c', bg:'#fff7ed', border:'#fed7aa', dot:'#f97316', iconBg:'rgba(249,115,22,0.1)' },
  medium:   { color:'#d97706', bg:'#fffbeb', border:'#fde68a', dot:'#f59e0b', iconBg:'rgba(245,158,11,0.1)' },
  low:      { color:'#2db9a3', bg:'#f0fdf9', border:'#a7f3d0', dot:'#10b981', iconBg:'rgba(45,185,163,0.1)'  },
};

const actionCfg: Record<string, { color:string; bg:string }> = {
  'Auto-blocked':   { color:'#dc2626', bg:'#fee2e2' },
  'Verified':       { color:'#059669', bg:'#dcfce7' },
  'Under Review':   { color:'#d97706', bg:'#fef3c7' },
  'Flagged':        { color:'#d97706', bg:'#fef3c7' },
  'Monitoring':     { color:'#2563eb', bg:'#dbeafe' },
  'Denied & Logged':{ color:'#6366f1', bg:'#ede9fe' },
};

export default function SuspiciousActivity() {
  const [activeMenu, setActiveMenu] = useState('suspicious-activity');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('all');
  const router = useRouter();

  const filtered = activities.filter(a => severityFilter==='all' || a.severity===severityFilter);
  const criticalCount = activities.filter(a=>a.severity==='critical').length;

  const statCards = [
    { label:'Critical', value:activities.filter(a=>a.severity==='critical').length, accent:'#dc2626', iconBg:'rgba(220,38,38,0.1)' },
    { label:'High',     value:activities.filter(a=>a.severity==='high').length,     accent:'#ea580c', iconBg:'rgba(234,88,12,0.1)'  },
    { label:'Medium',   value:activities.filter(a=>a.severity==='medium').length,   accent:'#d97706', iconBg:'rgba(217,119,6,0.1)'  },
    { label:'Low',      value:activities.filter(a=>a.severity==='low').length,      accent:'#2db9a3', iconBg:'rgba(45,185,163,0.1)' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        .sa-root{display:flex;height:100vh;background:#ffffff;overflow:hidden;font-family:'Open Sans',sans-serif;}
        .sa-content{flex:1;display:flex;flex-direction:column;overflow:hidden;}
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
        .page-header-row{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:28px;}
        .eyebrow{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#2db9a3;background:rgba(45,185,163,0.08);padding:4px 10px;border-radius:20px;margin-bottom:10px;}
        .eyebrow-dot{width:6px;height:6px;border-radius:50%;background:#2db9a3;}
        .page-header-row h1{font-size:26px;font-weight:800;color:#0f172a;margin-bottom:4px;letter-spacing:-0.03em;}
        .page-header-row p{font-size:14px;color:#94a3b8;}
        .critical-badge{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;font-weight:700;padding:6px 14px;border-radius:20px;background:#fee2e2;color:#dc2626;}
        .stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin-bottom:24px;}
        .stat-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:16px 18px;display:flex;align-items:center;gap:14px;}
        .stat-icon{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:var(--icon-bg);color:var(--accent);flex-shrink:0;}
        .stat-val{font-size:26px;font-weight:800;color:var(--accent);letter-spacing:-0.03em;line-height:1;}
        .stat-label{font-size:11.5px;font-weight:600;color:#94a3b8;text-transform:capitalize;}
        .controls-bar{display:flex;align-items:center;gap:12px;margin-bottom:18px;}
        .filter-dropdown{padding:8px 12px;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;font-size:13px;font-weight:400;color:#94a3b8;font-family:'Open Sans',sans-serif;cursor:pointer;transition:all 0.15s;outline:none;}
        .filter-dropdown:hover{border-color:#2db9a3;}
        .filter-dropdown:focus{border-color:#2db9a3;box-shadow:0 0 0 3px rgba(45,185,163,0.1);}
        .filter-dropdown option{padding:8px;background:#fff;color:#0f172a;}
        .activities-list{display:flex;flex-direction:column;gap:12px;}
        .activity-card{background:#fff;border:1.5px solid var(--a-border);border-left:3px solid var(--a-color);border-radius:16px;padding:18px 22px;transition:all 0.2s;}
        .activity-card:hover{box-shadow:0 6px 24px rgba(0,0,0,0.06);}
        .activity-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;}
        .activity-title-row{display:flex;align-items:center;gap:10px;}
        .activity-icon{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:var(--a-icon-bg);color:var(--a-color);flex-shrink:0;}
        .activity-title{font-size:14px;font-weight:700;color:#0f172a;}
        .sev-badge{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:2px 9px;border-radius:20px;text-transform:capitalize;}
        .sev-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0;}
        .time-row{display:flex;align-items:center;gap:5px;font-size:12px;color:#94a3b8;white-space:nowrap;}
        .activity-desc{font-size:13px;color:#64748b;margin-bottom:12px;line-height:1.5;}
        .activity-meta{display:flex;align-items:center;gap:16px;flex-wrap:wrap;}
        .meta-item{display:flex;align-items:center;gap:5px;font-size:12px;color:#64748b;}
        .meta-mono{font-family:'Menlo','Monaco',monospace;font-size:11.5px;}
        .action-badge{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;margin-left:auto;}
        @media(max-width:768px){.topbar{padding:0 18px;}.main-content{padding:18px;}.page-header-row{flex-direction:column;align-items:flex-start;gap:12px;}}
      `}</style>
      <div className="sa-root">
        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={()=>router.push('/')}/>
        <div className="sa-content">
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
            <div className="page-header-row">
              <div>
                <div className="eyebrow"><span className="eyebrow-dot"/>Security Monitoring</div>
                <h1>Suspicious Activity</h1>
                <p>Investigate flagged security events and threats</p>
              </div>
              <span className="critical-badge"><AlertTriangle size={13}/>{criticalCount} Critical Alerts</span>
            </div>
            <div className="stats-grid">
              {statCards.map((s,i)=>(
                <div key={i} className="stat-card" style={{'--accent':s.accent,'--icon-bg':s.iconBg} as any}>
                  <div className="stat-icon"><AlertTriangle size={18}/></div>
                  <div><div className="stat-val">{s.value}</div><div className="stat-label">{s.label}</div></div>
                </div>
              ))}
            </div>
            <div className="controls-bar">
              <div style={{display:'flex',alignItems:'center',gap:0,position:'relative'}}>
                <div style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}>
                  <AlertTriangle size={13} style={{color:'#94a3b8'}}/>
                </div>
                <select className="filter-dropdown" value={severityFilter} onChange={(e)=>setSeverityFilter(e.target.value)} style={{paddingLeft:32}}>
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <span style={{fontSize:13,color:'#94a3b8',marginLeft:'auto'}}>{filtered.length} events</span>
            </div>
            <div className="activities-list">
              {filtered.map(a=>{
                const cfg=severityCfg[a.severity]||severityCfg.medium;
                const ac=actionCfg[a.action]||{color:'#64748b',bg:'#f1f5f9'};
                return (
                  <div key={a.id} className="activity-card" style={{'--a-color':cfg.color,'--a-border':cfg.border,'--a-icon-bg':cfg.iconBg} as any}>
                    <div className="activity-top">
                      <div className="activity-title-row">
                        <div className="activity-icon"><AlertTriangle size={16}/></div>
                        <span className="activity-title">{a.title}</span>
                        <span className="sev-badge" style={{background:cfg.bg,color:cfg.color}}>
                          <span className="sev-dot" style={{background:cfg.dot}}/>{a.severity}
                        </span>
                      </div>
                      <div className="time-row"><Clock size={12}/>{a.time}</div>
                    </div>
                    <p className="activity-desc">{a.desc}</p>
                    <div className="activity-meta">
                      <span className="meta-item"><Eye size={12}/>{a.user}</span>
                      <span className="meta-item meta-mono"><Globe size={12}/>{a.ip}</span>
                      <span className="meta-item"><MapPin size={12}/>{a.location}</span>
                      <span className="action-badge" style={{background:ac.bg,color:ac.color}}>{a.action}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}