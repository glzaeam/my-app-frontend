'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import TopBar from '@/app/components/TopBar';
import { CheckCircle2, XCircle, Clock, X, Filter, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { auth } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL;
const ROWS_PER_PAGE = 10;

interface AccessRequest {
  id: string;
  fullName: string;
  employeeId: string;
  email: string;
  department: string | null;
  branch: string | null;
  requestedRole: string | null;
  status: 'Pending' | 'Approved' | 'Rejected';
  reviewedBy: string | null;
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

function ReviewModal({ request, onClose, onDone }: {
  request: AccessRequest; onClose: () => void; onDone: () => void;
}) {
  const [action, setAction]          = useState<'Approve' | 'Reject' | null>(null);
  const [rejectionReason, setReason] = useState('');
  const [loading, setLoading]        = useState(false);
  const [error, setError]            = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!action) return;
    if (action === 'Reject' && !rejectionReason.trim()) { setError('Please provide a rejection reason.'); return; }
    setError(null); setLoading(true);
    try {
      const res  = await fetch(`${API}/access-requests/${request.id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.getToken()}` },
        body: JSON.stringify({ action, rejectionReason }),
      });
      const data = await res.json();
      if (data.success) { onDone(); onClose(); }
      else setError(data.message || 'Failed.');
    } catch { setError('Server error.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position:'fixed',inset:0,zIndex:1000,background:'rgba(15,23,42,0.45)',display:'flex',alignItems:'center',justifyContent:'center' }} onClick={onClose}>
      <div style={{ background:'#fff',borderRadius:16,padding:'24px 28px',width:480,maxWidth:'90vw',boxShadow:'0 20px 60px rgba(0,0,0,0.18)',fontFamily:"'DM Sans',sans-serif" }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18 }}>
          <div>
            <div style={{ fontWeight:700,fontSize:16,color:'#1a2332' }}>Review Request</div>
            <div style={{ fontSize:12,color:'#94a3b8',marginTop:3 }}>{request.fullName} — {request.employeeId}</div>
          </div>
          <button onClick={onClose} style={{ width:28,height:28,borderRadius:7,border:'1px solid #e2e8f0',background:'#f8fafc',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#94a3b8' }}><X size={14}/></button>
        </div>
        <div style={{ background:'#f8fafc',borderRadius:10,padding:'12px 14px',marginBottom:18,fontSize:13 }}>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
            {[['Email',request.email],['Department',request.department??'—'],['Branch',request.branch??'—'],['Role Requested',request.requestedRole??'—']].map(([k,v]) => (
              <div key={k}><span style={{ color:'#94a3b8',fontSize:11 }}>{k}</span><div style={{ color:'#1a2332',fontWeight:600,fontSize:13 }}>{v}</div></div>
            ))}
          </div>
        </div>
        <div style={{ display:'flex',gap:10,marginBottom:16 }}>
          {(['Approve','Reject'] as const).map(a => (
            <button key={a} onClick={() => setAction(a)}
              style={{ flex:1,height:38,borderRadius:8,border:`2px solid ${action===a?(a==='Approve'?'#2db9a3':'#e55353'):'#e2e8f0'}`,background:action===a?(a==='Approve'?'#e8f9f6':'#fef2f2'):'#fff',color:action===a?(a==='Approve'?'#2db9a3':'#e55353'):'#64748b',fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
              {a==='Approve'?<CheckCircle2 size={14}/>:<XCircle size={14}/>} {a}
            </button>
          ))}
        </div>
        {action==='Reject' && (
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:6 }}>Rejection Reason *</label>
            <textarea value={rejectionReason} onChange={e => setReason(e.target.value)} placeholder="Explain why this request is being rejected..."
              style={{ width:'100%',minHeight:80,padding:'10px 12px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:13,fontFamily:"'DM Sans',sans-serif",resize:'none',outline:'none',color:'#1a2332' }}/>
          </div>
        )}
        {error && <div style={{ fontSize:13,color:'#e55353',marginBottom:12 }}>⚠️ {error}</div>}
        <div style={{ display:'flex',justifyContent:'flex-end',gap:10 }}>
          <button onClick={onClose} style={{ padding:'8px 18px',borderRadius:8,border:'1px solid #e2e8f0',background:'#fff',color:'#475569',fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={!action||loading}
            style={{ padding:'8px 18px',borderRadius:8,border:'none',background:!action?'#e2e8f0':action==='Approve'?'#2db9a3':'#e55353',color:'#fff',fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:!action?'not-allowed':'pointer' }}>
            {loading?'Submitting...':'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ msg, type, onDone }: { msg:string; type:'success'|'error'; onDone:()=>void }) {
  useEffect(() => { const t = setTimeout(onDone,3000); return () => clearTimeout(t); },[onDone]);
  return (
    <div style={{ position:'fixed',bottom:24,right:24,zIndex:9999,padding:'14px 20px',borderRadius:12,fontSize:13.5,fontWeight:600,fontFamily:"'DM Sans',sans-serif",boxShadow:'0 8px 24px rgba(0,0,0,0.12)',background:type==='success'?'#ecfdf5':'#fef2f2',color:type==='success'?'#059669':'#dc2626',border:`1px solid ${type==='success'?'#a7f3d0':'#fecaca'}` }}>
      {msg}
    </div>
  );
}

function FilterDropdown({ options, value, onChange }: { options:{value:string;label:string}[]; value:string; onChange:(val:string)=>void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e:MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown',h); return () => document.removeEventListener('mousedown',h);
  },[]);
  const selectedLabel = options.find(o => o.value===value)?.label ?? 'Select';
  return (
    <div ref={ref} style={{ position:'relative',minWidth:160 }}>
      <button type="button" onClick={() => setOpen(v=>!v)}
        style={{ width:'100%',padding:'10px 14px',borderRadius:20,border:`1.5px solid ${open?'#2db9a3':'#e2e8f0'}`,fontSize:13,fontWeight:600,color:open?'#2db9a3':'#64748b',background:open?'#f0fdf9':'#fff',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",outline:'none',display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,transition:'all 0.18s' }}>
        <Filter size={14} style={{ flexShrink:0,color:open?'#2db9a3':'#94a3b8' }}/>
        <span style={{ flex:1,textAlign:'left' }}>{selectedLabel}</span>
        <ChevronDown size={14} style={{ flexShrink:0,color:open?'#2db9a3':'#94a3b8',transform:open?'rotate(180deg)':'rotate(0deg)',transition:'transform 0.2s' }}/>
      </button>
      {open && (
        <div style={{ position:'absolute',top:'calc(100% + 8px)',left:0,right:0,background:'#fff',border:'1px solid #e2e8f0',borderRadius:10,boxShadow:'0 8px 24px rgba(0,0,0,0.10)',zIndex:300,overflow:'hidden' }}>
          {options.map(opt => (
            <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{ width:'100%',padding:'10px 14px',fontSize:13,color:opt.value===value?'#2db9a3':'#1e293b',background:opt.value===value?'rgba(45,185,163,0.08)':'#fff',fontWeight:opt.value===value?700:500,fontFamily:"'DM Sans',sans-serif",border:'none',cursor:'pointer',textAlign:'left',display:'block' }}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AccessRequestsPage() {
  const router = useRouter();
  const [activeMenu, setActiveMenu]   = useState('access-requests');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [requests, setRequests]       = useState<AccessRequest[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState('');
  const [reviewing, setReviewing]     = useState<AccessRequest | null>(null);
  const [toast, setToast]             = useState<{msg:string;type:'success'|'error'}|null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter ? `${API}/access-requests?status=${filter}` : `${API}/access-requests`;
      const res = await fetch(url,{ headers:{ Authorization:`Bearer ${auth.getToken()}` } });
      const data = await res.json();
      setRequests(data);
    } catch { setToast({ msg:'Failed to load requests',type:'error' }); }
    finally { setLoading(false); }
  },[filter]);

  useEffect(() => { fetchRequests(); },[fetchRequests]);

  const statusCfg = {
    Pending:  { bg:'#fef9ec',color:'#b7791f',dot:'#e5a623',icon:<Clock size={12} color="#e5a623"/> },
    Approved: { bg:'#e8f9f6',color:'#1a7a6c',dot:'#2db9a3',icon:<CheckCircle2 size={12} color="#2db9a3"/> },
    Rejected: { bg:'#fef2f2',color:'#c0392b',dot:'#e55353',icon:<XCircle size={12} color="#e55353"/> },
  };

  const counts = {
    total:    requests.length,
    pending:  requests.filter(r => r.status==='Pending').length,
    approved: requests.filter(r => r.status==='Approved').length,
    rejected: requests.filter(r => r.status==='Rejected').length,
  };

  const totalPages = Math.max(1,Math.ceil(requests.length/ROWS_PER_PAGE));
  const safePage   = Math.max(1,Math.min(currentPage,totalPages));
  const paged      = requests.slice((safePage-1)*ROWS_PER_PAGE, safePage*ROWS_PER_PAGE);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;}
        .ar-root{display:flex;height:100vh;background:#fff;overflow:hidden;font-family:'DM Sans',sans-serif;}
        .ar-main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .ar-scroll{flex:1;overflow-y:auto;padding:28px 32px;scrollbar-width:thin;scrollbar-color:#e2e8f0 transparent;}
        .ar-scroll::-webkit-scrollbar{width:6px;}
        .ar-scroll::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:3px;}
        .ar-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px;}
        .ar-stat{background:#fff;border:1.5px solid #e2e8f0;border-radius:18px;padding:18px 20px;display:flex;align-items:center;gap:14px;box-shadow:0 4px 12px rgba(0,0,0,0.06);}
        .ar-stat-icon{width:42px;height:42px;border-radius:10px;background:rgba(45,185,163,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .ar-stat-val{font-size:22px;font-weight:700;color:#1a2332;line-height:1;}
        .ar-stat-label{font-size:12px;color:#8a9ab0;margin-top:3px;}
        .ar-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:18px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.04);}
        table{width:100%;border-collapse:collapse;font-family:'DM Sans',sans-serif;table-layout:fixed;}
        thead tr{background:#f8fafc;border-bottom:1.5px solid #f1f5f9;}
        thead th{padding:11px 20px;text-align:center;font-size:10.5px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:0.09em;white-space:nowrap;}
        tbody tr{border-bottom:1px solid #f8fafc;transition:background 0.13s;}
        tbody tr:last-child{border-bottom:none;}
        tbody tr:hover{background:#fafbfd;}
        tbody td{padding:13px 20px;font-size:13px;color:#1e293b;font-weight:500;vertical-align:middle;text-align:center;}
        .ar-review-btn{padding:6px 14px;border-radius:7px;border:1px solid #2db9a3;background:#fff;color:#2db9a3;font-size:12px;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all 0.15s;}
        .ar-review-btn:hover{background:#2db9a3;color:#fff;}
        .ar-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;}
        .ar-pagination{display:flex;align-items:center;justify-content:space-between;padding:14px 24px;border-top:1px solid #f1f5f9;background:#fafbfc;flex-wrap:wrap;gap:10px;}
        .ar-pag-info{font-size:13px;color:#94a3b8;}
        .ar-pag-info strong{color:#475569;font-weight:600;}
        .ar-pag-btns{display:flex;align-items:center;gap:4px;}
        .ar-pag-btn{width:34px;height:34px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;color:#4a5568;font-size:13px;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s;}
        .ar-pag-btn:hover:not(:disabled){background:#f0fdf9;color:#2db9a3;border-color:#2db9a3;}
        .ar-pag-btn:disabled{opacity:0.35;cursor:not-allowed;}
        .ar-pag-counter{font-size:13px;color:#475569;font-weight:500;min-width:50px;text-align:center;}
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)}/>}
      {reviewing && <ReviewModal request={reviewing} onClose={() => setReviewing(null)} onDone={() => { fetchRequests(); setToast({ msg:'Request reviewed successfully',type:'success' }); }}/>}

      <div className="ar-root">
        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={() => { auth.clear(); router.push('/'); }}/>
        <div className="ar-main">
          <TopBar title="Access Requests"/>
          <div className="ar-scroll">
            <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:24 }}>
              <div>
                <h1 style={{ fontSize:22,fontWeight:700,color:'#1a2332',margin:'0 0 4px' }}>Access Requests</h1>
                <p style={{ fontSize:13,color:'#8a9ab0',margin:0 }}>Review and manage user access requests</p>
              </div>
            </div>

            <div className="ar-stats">
              {[
                { label:'Total',    value:counts.total,    color:'#2db9a3' },
                { label:'Pending',  value:counts.pending,  color:'#e5a623' },
                { label:'Approved', value:counts.approved, color:'#2db9a3' },
                { label:'Rejected', value:counts.rejected, color:'#e55353' },
              ].map(s => (
                <div key={s.label} className="ar-stat">
                  <div className="ar-stat-icon">
                    <span style={{ fontSize:18,fontWeight:700,color:s.color }}>{s.value}</span>
                  </div>
                  <div><div className="ar-stat-val" style={{ color:s.color }}>{s.value}</div><div className="ar-stat-label">{s.label}</div></div>
                </div>
              ))}
            </div>

            <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:18 }}>
              <FilterDropdown
                options={[{value:'',label:'All Statuses'},{value:'Pending',label:'Pending'},{value:'Approved',label:'Approved'},{value:'Rejected',label:'Rejected'}]}
                value={filter} onChange={setFilter}
              />
              <span style={{ fontSize:13,color:'#8a9ab0' }}>{requests.length} requests</span>
            </div>

            <div className="ar-card">
              <div style={{ overflowX:'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width:'22%',textAlign:'center' }}>Applicant</th>
                      <th style={{ width:'12%',textAlign:'center' }}>Employee ID</th>
                      <th style={{ width:'14%',textAlign:'center' }}>Department</th>
                      <th style={{ width:'14%',textAlign:'center' }}>Role Requested</th>
                      <th style={{ width:'11%',textAlign:'center' }}>Status</th>
                      <th style={{ width:'14%',textAlign:'center' }}>Requested On</th>
                      <th style={{ width:'13%',textAlign:'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} style={{ textAlign:'center',padding:'40px 0',color:'#94a3b8' }}>Loading...</td></tr>
                    ) : requests.length===0 ? (
                      <tr><td colSpan={7} style={{ textAlign:'center',padding:'40px 0',color:'#94a3b8' }}>No requests found.</td></tr>
                    ) : paged.map(r => {
                      const s = statusCfg[r.status];
                      return (
                        <tr key={r.id}>
                          <td style={{ textAlign:'center' }}>
                            <div style={{ display:'flex',flexDirection:'column',alignItems:'center' }}>
                              <span style={{ fontSize:13.5,fontWeight:600,color:'#0f172a' }}>{r.fullName}</span>
                              <span style={{ fontSize:11,color:'#94a3b8' }}>{r.email}</span>
                            </div>
                          </td>
                          <td style={{ color:'#2db9a3',fontWeight:600,textAlign:'center' }}>{r.employeeId}</td>
                          <td style={{ color:'#64748b',textAlign:'center' }}>{r.department??'—'}</td>
                          <td style={{ textAlign:'center' }}>{r.requestedRole??'—'}</td>
                          <td style={{ textAlign:'center' }}>
                            <span className="ar-badge" style={{ background:s.bg,color:s.color }}>
                              {s.icon} {r.status}
                            </span>
                          </td>
                          <td style={{ color:'#94a3b8',fontSize:12,textAlign:'center' }}>
                            {new Date(r.createdAt).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}
                          </td>
                          <td style={{ textAlign:'center' }}>
                            {r.status==='Pending'
                              ? <button className="ar-review-btn" onClick={() => setReviewing(r)}>Review</button>
                              : <span style={{ fontSize:11,color:'#94a3b8' }}>by {r.reviewedBy??'—'}</span>
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {requests.length>0 && (
                <div className="ar-pagination">
                  <span className="ar-pag-info">
                    Showing <strong>{requests.length===0?0:(safePage-1)*ROWS_PER_PAGE+1}–{Math.min(safePage*ROWS_PER_PAGE,requests.length)}</strong> of <strong>{requests.length}</strong>
                  </span>
                  <div className="ar-pag-btns">
                    <button className="ar-pag-btn" disabled={safePage<=1} onClick={() => setCurrentPage(safePage-1)}><ChevronLeft size={15}/></button>
                    <span className="ar-pag-counter">{safePage} / {totalPages}</span>
                    <button className="ar-pag-btn" disabled={safePage>=totalPages} onClick={() => setCurrentPage(safePage+1)}><ChevronRight size={15}/></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}