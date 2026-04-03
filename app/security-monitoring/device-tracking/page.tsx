'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import TopBar from '@/app/components/TopBar';
import { Smartphone, Monitor, Tablet, Search, Shield, XCircle, Filter, Activity, CheckCircle, AlertTriangle } from 'lucide-react';

const devices = [
  { id:1, user:'Sarah Johnson',  employeeId:'ADM001', device:'MacBook Pro 14"',      type:'desktop', os:'macOS Sonoma', browser:'Chrome 120',    ip:'192.168.1.45',   lastUsed:'2 min ago',   status:'active',     trusted:true  },
  { id:2, user:'Sarah Johnson',  employeeId:'ADM001', device:'iPhone 15 Pro',        type:'mobile',  os:'iOS 17.2',     browser:'Safari',          ip:'192.168.1.50',   lastUsed:'1 hour ago',  status:'active',     trusted:true  },
  { id:3, user:'Michael Chen',   employeeId:'MGR001', device:'Dell XPS 15',          type:'desktop', os:'Windows 11',   browser:'Edge 120',        ip:'10.0.12.88',     lastUsed:'5 min ago',   status:'active',     trusted:true  },
  { id:4, user:'Michael Chen',   employeeId:'MGR001', device:'Samsung Galaxy S24',   type:'mobile',  os:'Android 14',   browser:'Chrome Mobile',   ip:'10.0.12.90',     lastUsed:'1 day ago',   status:'inactive',   trusted:true  },
  { id:5, user:'Emily Davis',    employeeId:'AUD001', device:'ThinkPad X1 Carbon',   type:'desktop', os:'Windows 11',   browser:'Firefox 121',     ip:'10.0.12.34',     lastUsed:'15 min ago',  status:'active',     trusted:true  },
  { id:6, user:'James Wilson',   employeeId:'TEL001', device:'HP ProDesk 400',       type:'desktop', os:'Windows 10',   browser:'Chrome 120',      ip:'10.0.8.15',      lastUsed:'1 min ago',   status:'active',     trusted:true  },
  { id:7, user:'James Wilson',   employeeId:'TEL001', device:'Unknown Android',      type:'mobile',  os:'Android 13',   browser:'Chrome Mobile',   ip:'45.33.32.156',   lastUsed:'2 days ago',  status:'suspicious', trusted:false },
];

const statusCfg: Record<string, { color: string; bg: string; dot: string; label: string }> = {
  active:     { color:'#059669', bg:'#dcfce7', dot:'#10b981', label:'Active'     },
  inactive:   { color:'#d97706', bg:'#fef3c7', dot:'#f59e0b', label:'Inactive'   },
  suspicious: { color:'#dc2626', bg:'#fee2e2', dot:'#ef4444', label:'Suspicious' },
};

const browserColor: Record<string, { color: string; bg: string }> = {
  Chrome:  { color:'#2db9a3', bg:'rgba(45,185,163,0.1)'  },
  Safari:  { color:'#6366f1', bg:'rgba(99,102,241,0.1)'  },
  Firefox: { color:'#f59e0b', bg:'rgba(245,158,11,0.1)'  },
  Edge:    { color:'#06b6d4', bg:'rgba(6,182,212,0.1)'   },
};

const getBrowserStyle = (browser: string) => {
  const key = Object.keys(browserColor).find(k => browser.startsWith(k));
  return key ? browserColor[key] : { color:'#94a3b8', bg:'#f1f5f9' };
};

export default function DeviceTracking() {
  const [activeMenu, setActiveMenu] = useState('device-tracking');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const router = useRouter();

  const filtered = devices.filter(d => {
    if (typeFilter !== 'all' && d.type !== typeFilter) return false;
    if (searchTerm && !d.user.toLowerCase().includes(searchTerm.toLowerCase()) && !d.employeeId.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleLogout = () => router.push('/');

  const stats = [
    { label:'Total Devices', value: devices.length,                                        accent:'#6366f1', iconBg:'rgba(99,102,241,0.1)',  icon:<Monitor size={20}/> },
    { label:'Active Now',    value: devices.filter(d=>d.status==='active').length,          accent:'#2db9a3', iconBg:'rgba(45,185,163,0.1)',  icon:<Activity size={20}/> },
    { label:'Trusted',       value: devices.filter(d=>d.trusted).length,                   accent:'#059669', iconBg:'rgba(5,150,105,0.1)',   icon:<Shield size={20}/> },
    { label:'Suspicious',    value: devices.filter(d=>d.status==='suspicious').length,      accent:'#ef4444', iconBg:'rgba(239,68,68,0.1)',   icon:<AlertTriangle size={20}/> },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .dt-root { display:flex; height:100vh; background:#ffffff; overflow:hidden; font-family:'Open Sans',sans-serif; }
        .dt-content { flex:1; display:flex; flex-direction:column; overflow:hidden; }
        .main-content { flex:1; overflow-y:auto; padding:32px 36px; scrollbar-width:thin; scrollbar-color:#e2e8f0 transparent; }
        .main-content::-webkit-scrollbar { width:6px; }
        .main-content::-webkit-scrollbar-thumb { background:#e2e8f0; border-radius:3px; }
        .page-header { margin-bottom:28px; }
        .eyebrow { display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#2db9a3; background:rgba(45,185,163,0.08); padding:4px 10px; border-radius:20px; margin-bottom:10px; }
        .eyebrow-dot { width:6px; height:6px; border-radius:50%; background:#2db9a3; }
        .page-header h1 { font-size:26px; font-weight:800; color:#0f172a; margin-bottom:4px; letter-spacing:-0.03em; }
        .page-header p { font-size:14px; color:#94a3b8; }
        .stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:16px; margin-bottom:24px; }
        .stat-card { background:#fff; border:1.5px solid #e2e8f0; border-radius:16px; padding:18px 20px; position:relative; overflow:hidden; }
        .stat-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; }
        .stat-icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; background:var(--icon-bg); color:var(--accent); }
        .stat-label { font-size:11.5px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.07em; margin-bottom:4px; }
        .stat-value { font-size:30px; font-weight:800; color:#0f172a; letter-spacing:-0.03em; }
        .controls-bar { display:flex; align-items:center; gap:12px; margin-bottom:18px; flex-wrap:wrap; }
        .search-wrap { position:relative; flex:1; min-width:200px; max-width:340px; }
        .search-input { width:100%; padding:8px 14px 8px 38px; border-radius:10px; border:1.5px solid #e2e8f0; font-size:13px; color:#1e293b; background:#fff; font-family:'Open Sans',sans-serif; outline:none; transition:all 0.18s; }
        .search-input::placeholder { color:#94a3b8; }
        .search-input:focus { border-color:#2db9a3; box-shadow:0 0 0 3px rgba(45,185,163,0.1); }
        .filter-dropdown { padding:8px 12px; border-radius:10px; border:1.5px solid #e2e8f0; background:#fff; font-size:13px; font-weight:400; color:#94a3b8; font-family:'Open Sans',sans-serif; cursor:pointer; transition:all 0.15s; outline:none; }
        .filter-dropdown:hover { border-color:#2db9a3; }
        .filter-dropdown:focus { border-color:#2db9a3; box-shadow:0 0 0 3px rgba(45,185,163,0.1); }
        .filter-dropdown option { padding:8px; background:#fff; color:#0f172a; }
        .devices-list { display:flex; flex-direction:column; gap:12px; }
        .device-card { background:#fff; border:1.5px solid #e2e8f0; border-radius:16px; padding:18px 22px; display:flex; align-items:center; gap:16px; transition:all 0.2s; }
        .device-card:hover { box-shadow:0 6px 24px rgba(0,0,0,0.06); }
        .device-card.suspicious { border-color:#fca5a5; background:#fffafa; }
        .device-icon-wrap { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .device-main { flex:1; min-width:0; }
        .device-name-row { display:flex; align-items:center; gap:8px; margin-bottom:5px; }
        .device-name { font-size:14px; font-weight:700; color:#0f172a; }
        .device-meta { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .device-user { font-size:12.5px; font-weight:600; color:#475569; }
        .device-emp { font-size:12px; color:#94a3b8; }
        .browser-tag { display:inline-flex; align-items:center; gap:4px; font-size:12px; font-weight:600; padding:2px 9px; border-radius:6px; white-space:nowrap; }
        .browser-dot { width:5px; height:5px; border-radius:50%; flex-shrink:0; }
        .os-text { font-size:12px; color:#94a3b8; }
        .device-right { display:flex; flex-direction:column; align-items:flex-end; gap:6px; flex-shrink:0; }
        .status-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700; white-space:nowrap; }
        .status-dot { width:5px; height:5px; border-radius:50%; flex-shrink:0; }
        .ip-mono { font-family:'Menlo','Monaco',monospace; font-size:12px; color:#64748b; }
        .last-used { font-size:12px; color:#94a3b8; }
        .trust-badge { display:inline-flex; align-items:center; gap:5px; font-size:11.5px; font-weight:700; padding:2px 9px; border-radius:20px; }
        .revoke-btn { padding:6px 14px; border-radius:8px; border:1.5px solid #fecaca; background:#fff; color:#ef4444; font-size:12.5px; font-weight:700; cursor:pointer; font-family:'Open Sans',sans-serif; transition:all 0.15s; }
        .revoke-btn:hover { background:#fee2e2; border-color:#fca5a5; }
        @media (max-width:768px) { .topbar { padding:0 18px; } .main-content { padding:18px; } .device-card { flex-wrap:wrap; } }
      `}</style>

      <div className="dt-root">
        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={handleLogout} />
        <div className="dt-content">
          <TopBar title="Device Tracking" />
          <div className="main-content">
            <div className="page-header">
              <div className="eyebrow"><span className="eyebrow-dot"/>Security Monitoring</div>
              <h1>Device Tracking</h1>
              <p>Monitor and manage registered devices across all users</p>
            </div>
            <div className="stats-grid">
              {stats.map((s,i) => (
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
                <input className="search-input" type="text" placeholder="Search by user or ID..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:0,position:'relative'}}>
                <div style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}>
                  <Filter size={13} style={{color:'#94a3b8'}}/>
                </div>
                <select className="filter-dropdown" value={typeFilter} onChange={(e)=>setTypeFilter(e.target.value)} style={{paddingLeft:32}}>
                  <option value="all">All Types</option>
                  <option value="desktop">Desktop</option>
                  <option value="mobile">Mobile</option>
                </select>
              </div>
            </div>
            <div className="devices-list">
              {filtered.map(d => {
                const s = statusCfg[d.status];
                const bs = getBrowserStyle(d.browser);
                const Icon = d.type==='mobile' ? Smartphone : d.type==='tablet' ? Tablet : Monitor;
                const iconColor = d.status==='suspicious' ? '#ef4444' : '#2db9a3';
                const iconBg = d.status==='suspicious' ? 'rgba(239,68,68,0.1)' : 'rgba(45,185,163,0.1)';
                return (
                  <div key={d.id} className={`device-card ${d.status==='suspicious'?'suspicious':''}`}>
                    <div className="device-icon-wrap" style={{background:iconBg,color:iconColor}}><Icon size={20}/></div>
                    <div className="device-main">
                      <div className="device-name-row">
                        <span className="device-name">{d.device}</span>
                        {d.trusted
                          ? <Shield size={13} style={{color:'#2db9a3'}}/>
                          : <XCircle size={13} style={{color:'#ef4444'}}/>}
                        <span className="trust-badge" style={d.trusted?{background:'#dcfce7',color:'#059669'}:{background:'#fee2e2',color:'#dc2626'}}>
                          {d.trusted ? <><CheckCircle size={11}/> Trusted</> : <><XCircle size={11}/> Untrusted</>}
                        </span>
                      </div>
                      <div className="device-meta">
                        <span className="device-user">{d.user}</span>
                        <span className="device-emp">{d.employeeId}</span>
                        <span className="browser-tag" style={{background:bs.bg,color:bs.color}}>
                          <span className="browser-dot" style={{background:bs.color}}/>{d.browser}
                        </span>
                        <span className="os-text">{d.os}</span>
                      </div>
                    </div>
                    <div className="device-right">
                      <span className="status-badge" style={{background:s.bg,color:s.color}}>
                        <span className="status-dot" style={{background:s.dot}}/>{s.label}
                      </span>
                      <span className="ip-mono">{d.ip}</span>
                      <span className="last-used">{d.lastUsed}</span>
                      <button className="revoke-btn">Revoke</button>
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