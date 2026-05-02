'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import TopBar from '@/app/components/TopBar';
import {
  Search, Filter, UserPlus, Users, Pencil,
  KeyRound, ChevronLeft,
  ChevronRight, X, AlertTriangle, ChevronDown,
  Eye, EyeOff, CheckCircle, XCircle,
} from 'lucide-react';
import { auth, fetchArray } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL;
const ROWS_PER_PAGE = 10;

function getStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Weak',       color: '#ef4444' };
  if (score <= 3) return { score, label: 'Fair',       color: '#f59e0b' };
  if (score <= 4) return { score, label: 'Strong',     color: '#3b82f6' };
  return              { score, label: 'Very Strong', color: '#10b981' };
}

interface ApiUser {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string | null;
  status: string;
  mfaEnabled: boolean;
  lastLogin: string | null;
  roles: string[];
}

// ── Filter Select (toolbar — keeps icon) ──────────────────────
function FilterSelect({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);
  const displayLabel = selected ? selected.label : options[0]?.label ?? 'Select';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', width: 160 }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: 20,
          border: `1.5px solid ${open ? '#2db9a3' : '#e2e8f0'}`,
          fontSize: 13,
          color: open ? '#2db9a3' : '#64748b',
          background: open ? '#f0fdf9' : '#fff',
          cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 600,
          outline: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          transition: 'all 0.18s',
        }}
      >
        <Filter size={14} style={{ flexShrink: 0, color: open ? '#2db9a3' : '#94a3b8' }} />
        <span style={{ flex: 1, textAlign: 'left' }}>{displayLabel}</span>
        <ChevronDown size={14} style={{ flexShrink: 0, color: open ? '#2db9a3' : '#94a3b8', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>
      {open && (
        <div style={{ position:'absolute',top:'calc(100% + 5px)',left:0,right:0,background:'#fff',border:'1px solid #e2e8f0',borderRadius:10,boxShadow:'0 8px 24px rgba(0,0,0,0.10)',zIndex:9999,overflow:'hidden' }}>
          {options.map(opt => (
            <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{ width:'100%',padding:'9px 12px',fontSize:13,color:opt.value===value?'#2db9a3':'#1e293b',background:opt.value===value?'rgba(45,185,163,0.08)':'#fff',fontWeight:opt.value===value?700:500,fontFamily:"'DM Sans', sans-serif",border:'none',cursor:'pointer',textAlign:'left',display:'block',transition:'background 0.1s' }}
              onMouseEnter={e => { e.currentTarget.style.background = opt.value===value?'rgba(45,185,163,0.12)':'#f8fafc'; }}
              onMouseLeave={e => { e.currentTarget.style.background = opt.value===value?'rgba(45,185,163,0.08)':'#fff'; }}
            >{opt.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Form Select (modals — matches screenshot style) ───────────
function FormSelect({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);
  const displayLabel = selected?.value ? selected.label : (placeholder ?? 'Select');
  const isPlaceholder = !selected?.value;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          height: 42,
          padding: '0 14px',
          borderRadius: 10,
          border: `1.5px solid ${open ? '#2db9a3' : '#e2e8f0'}`,
          fontSize: 13.5,
          color: isPlaceholder ? '#94a3b8' : '#111827',
          background: '#fff',
          cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: isPlaceholder ? 400 : 500,
          outline: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          transition: 'border-color 0.18s',
          boxShadow: open ? '0 0 0 3px rgba(45,185,163,0.10)' : 'none',
        }}
      >
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayLabel}
        </span>
        <ChevronDown
          size={16}
          style={{
            flexShrink: 0,
            color: open ? '#2db9a3' : '#94a3b8',
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1.5px solid #e2e8f0',
            borderRadius: 12,
            boxShadow: '0 12px 32px rgba(0,0,0,0.10)',
            zIndex: 9999,
            overflow: 'hidden',
            padding: '4px 0',
          }}
        >
          {options.filter(o => o.value !== '').map(opt => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  fontSize: 13.5,
                  color: isSelected ? '#0d9488' : '#1e293b',
                  background: isSelected ? 'rgba(13,148,136,0.07)' : 'transparent',
                  fontWeight: isSelected ? 600 : 400,
                  fontFamily: "'DM Sans', sans-serif",
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'block',
                  transition: 'background 0.12s',
                  letterSpacing: 0,
                }}
                onMouseEnter={e => {
                  if (!isSelected) e.currentTarget.style.background = '#f0fdf9';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = isSelected ? 'rgba(13,148,136,0.07)' : 'transparent';
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────
function ConfirmDialog({ open, onClose, title, description, confirmLabel = 'Confirm', onConfirm, danger = true }: {
  open: boolean; onClose: () => void; title: string; description: string;
  confirmLabel?: string; onConfirm: () => void; danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div style={{ position:'fixed',inset:0,zIndex:1000,background:'rgba(15,23,42,0.45)',display:'flex',alignItems:'center',justifyContent:'center' }} onClick={onClose}>
      <div style={{ background:'#fff',borderRadius:16,padding:'28px 28px 24px',width:420,maxWidth:'90vw',boxShadow:'0 20px 60px rgba(0,0,0,0.18)',fontFamily:"'DM Sans', sans-serif" }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex',gap:14,alignItems:'flex-start',marginBottom:20 }}>
          <div style={{ width:40,height:40,borderRadius:10,background:danger?'#fef2f2':'#e8f9f6',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <AlertTriangle size={18} color={danger?'#e55353':'#2db9a3'} />
          </div>
          <div>
            <div style={{ fontWeight:700,fontSize:15,color:'#1a2332',marginBottom:6 }}>{title}</div>
            <div style={{ fontSize:13,color:'#64748b',lineHeight:1.6 }}>{description}</div>
          </div>
        </div>
        <div style={{ display:'flex',justifyContent:'flex-end',gap:10 }}>
          <button onClick={onClose} style={{ padding:'8px 18px',borderRadius:8,border:'1px solid #e2e8f0',background:'#fff',color:'#475569',fontSize:13,fontWeight:600,fontFamily:"'DM Sans', sans-serif",cursor:'pointer' }}>Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }} style={{ padding:'8px 18px',borderRadius:8,border:'none',background:danger?'#e55353':'#2db9a3',color:'#fff',fontSize:13,fontWeight:600,fontFamily:"'DM Sans', sans-serif",cursor:'pointer' }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Dialog ───────────────────────────────────────────────
function EditDialog({ open, onClose, user, onSaved }: {
  open: boolean; onClose: () => void; user: ApiUser | null; onSaved: () => void;
}) {
  const [form, setForm] = useState({ name:'', email:'', role:'', department:'', status:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    if (user) setForm({ name: user.name, email: user.email, role: user.roles[0] ?? '', department: user.department ?? '', status: user.status });
  }, [user]);

  if (!open || !user) return null;

  const fInput: React.CSSProperties = { width:'100%',height:42,padding:'0 14px',border:'1.5px solid #e2e8f0',borderRadius:10,fontSize:13.5,fontFamily:"'DM Sans', sans-serif",color:'#111827',background:'#fff',outline:'none' };
  const fLabel: React.CSSProperties = { fontSize:12,fontWeight:600,display:'block',marginBottom:6,color:'#374151',fontFamily:"'DM Sans', sans-serif",textTransform:'uppercase',letterSpacing:'0.4px' };

  const handleSave = async () => {
    setError(null); setLoading(true);
    try {
      const res  = await fetch(`${API}/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${auth.getToken()}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) { onSaved(); onClose(); }
      else setError(data.message || 'Update failed');
    } catch { setError('Server error'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position:'fixed',inset:0,zIndex:1000,background:'rgba(15,23,42,0.45)',display:'flex',alignItems:'center',justifyContent:'center' }} onClick={onClose}>
      <div style={{ background:'#fff',borderRadius:16,padding:'24px 28px',width:500,maxWidth:'90vw',boxShadow:'0 20px 60px rgba(0,0,0,0.18)',fontFamily:"'DM Sans', sans-serif" }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:20 }}>
          <div>
            <div style={{ fontWeight:700,fontSize:16,color:'#1a2332' }}>Edit User</div>
            <div style={{ fontSize:12,color:'#94a3b8',marginTop:3 }}>Update user account details</div>
          </div>
          <button onClick={onClose} style={{ width:28,height:28,borderRadius:7,border:'1px solid #e2e8f0',background:'#f8fafc',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#94a3b8' }}><X size={14}/></button>
        </div>

        <div style={{ display:'flex',flexDirection:'column',gap:16,marginBottom:20 }}>
          <div>
            <label style={fLabel}>Full Name</label>
            <input style={fInput} value={form.name} onChange={e => setForm({...form,name:e.target.value})} />
          </div>
          <div>
            <label style={fLabel}>Email</label>
            <input style={fInput} value={form.email} onChange={e => setForm({...form,email:e.target.value})} />
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
            <div>
              <label style={fLabel}>Role</label>
              <FormSelect
                options={[
                  { value: '', label: 'Select role' },
                  { value: 'Admin', label: 'Admin' },
                  { value: 'Manager', label: 'Manager' },
                  { value: 'Auditor', label: 'Auditor' },
                  { value: 'User', label: 'User' },
                ]}
                value={form.role}
                onChange={v => setForm({...form,role:v})}
                placeholder="Select role"
              />
            </div>
            <div>
              <label style={fLabel}>Status</label>
              <FormSelect
                options={[
                  { value: '', label: 'Select status' },
                  { value: 'Active', label: 'Active' },
                  { value: 'Inactive', label: 'Inactive' },
                  { value: 'Locked', label: 'Locked' },
                ]}
                value={form.status}
                onChange={v => setForm({...form,status:v})}
                placeholder="Select status"
              />
            </div>
          </div>
          <div>
            <label style={fLabel}>Department</label>
            <input style={fInput} value={form.department} onChange={e => setForm({...form,department:e.target.value})} />
          </div>
        </div>

        {error && <div style={{ fontSize:13,color:'#e55353',marginBottom:12 }}>⚠️ {error}</div>}
        <div style={{ display:'flex',justifyContent:'flex-end',gap:10 }}>
          <button onClick={onClose} style={{ padding:'8px 18px',borderRadius:8,border:'1px solid #e2e8f0',background:'#fff',color:'#475569',fontSize:13,fontWeight:600,fontFamily:"'DM Sans', sans-serif",cursor:'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={loading} style={{ padding:'8px 18px',borderRadius:8,border:'none',background:'#2db9a3',color:'#fff',fontSize:13,fontWeight:600,fontFamily:"'DM Sans', sans-serif",cursor:'pointer' }}>{loading?'Saving...':'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Icon Action Buttons — Archive removed, only Edit + Reset ──
function ActionButtons({ onEdit, onReset }: {
  onEdit: () => void; onReset: () => void;
}) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
      <button className="ua-icon-btn ua-icon-btn--edit" onClick={onEdit} title="Edit user"><Pencil size={14}/></button>
      <button className="ua-icon-btn ua-icon-btn--reset" onClick={onReset} title="Reset password"><KeyRound size={14}/></button>
    </div>
  );
}

// ── Add User Modal ────────────────────────────────────────────
function AddUserModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [policy, setPolicy] = useState<any>(null);
  const [pwErrors, setPwErrors] = useState<string[]>([]);
  const [validating, setValidating] = useState(false);
  const [formData, setFormData] = useState({
    name: '', employeeId: '', email: '', department: '',
    branch: '', role: '', password: '', confirmPassword: '',
  });

  useEffect(() => {
    if (!open) return;
    fetch(`${API}/password-policy`, { headers: { Authorization: `Bearer ${auth.getToken()}` } })
      .then(r => r.json())
      .then(d => setPolicy({
        minLength:        Math.max(12, d.minLength ?? 12),
        requireUppercase: d.requireUppercase ?? true,
        requireLowercase: d.requireLowercase ?? true,
        requireNumbers:   d.requireNumbers   ?? true,
        requireSpecial:   d.requireSpecial   ?? true,
        blockCommon:      d.blockCommon      ?? true,
      }))
      .catch(() => setPolicy({
        minLength: 12, requireUppercase: true, requireLowercase: true,
        requireNumbers: true, requireSpecial: true, blockCommon: true,
      }));
  }, [open]);

  const update = (field: string, value: string) => {
    setFormData(p => ({ ...p, [field]: value }));
    if (field === 'password') validatePasswordRealtime(value);
  };

  const validatePasswordRealtime = (pw: string) => {
    if (!policy || !pw) { setPwErrors([]); return; }
    const errs: string[] = [];
    if (pw.length < policy.minLength) errs.push(`At least ${policy.minLength} characters`);
    if (pw.length > 128) errs.push('Maximum 128 characters');
    if (policy.requireUppercase && !/[A-Z]/.test(pw)) errs.push('At least 1 uppercase letter');
    if (policy.requireLowercase && !/[a-z]/.test(pw)) errs.push('At least 1 lowercase letter');
    if (policy.requireNumbers && !/[0-9]/.test(pw)) errs.push('At least 1 number');
    if (policy.requireSpecial && !/[^A-Za-z0-9]/.test(pw)) errs.push('At least 1 special character');
    setPwErrors(errs);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!formData.name || !formData.employeeId || !formData.email || !formData.password)
      return setError('Please fill in all required fields.');
    if (formData.password !== formData.confirmPassword)
      return setError('Passwords do not match.');
    if (pwErrors.length > 0)
      return setError('Password does not meet policy requirements.');

    setValidating(true);
    try {
      const valRes  = await fetch(`${API}/password-policy/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: formData.password }),
      });
      const valData = await valRes.json();
      if (!valData.valid) {
        setError(valData.errors?.join(' ') || 'Password does not meet policy.');
        setValidating(false);
        return;
      }
    } catch {}
    setValidating(false);

    setLoading(true);
    try {
      const res = await fetch(`${API}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.getToken()}` },
        body: JSON.stringify({
          name: formData.name, employeeId: formData.employeeId, email: formData.email,
          password: formData.password, department: formData.department,
          branch: formData.branch, role: formData.role,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess(); onClose(); setSuccess(false);
          setFormData({ name:'', employeeId:'', email:'', department:'', branch:'', role:'', password:'', confirmPassword:'' });
        }, 1500);
      } else {
        setError(data.message || 'Failed to create user.');
      }
    } catch {
      setError('Cannot connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setFormData({ name:'', employeeId:'', email:'', department:'', branch:'', role:'', password:'', confirmPassword:'' });
      setError(null); setPwErrors([]);
    }
  };

  if (!open) return null;

  const pw = formData.password;
  const strength = pw ? getStrength(pw) : null;

  const iLabel: React.CSSProperties = { display:'block',fontSize:11,fontWeight:600,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.4px',marginBottom:6 };
  const iInput: React.CSSProperties = { width:'100%',height:42,padding:'0 14px',border:'1.5px solid #e5e7eb',borderRadius:10,fontSize:13.5,color:'#111827',background:'#fff',outline:'none',fontFamily:"'DM Sans', sans-serif" };

  return (
    <div style={{ position:'fixed',inset:0,zIndex:1001,background:'rgba(15,23,42,0.45)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'auto',padding:'20px' }} onClick={handleClose}>
      <div style={{ background:'#fff',borderRadius:16,padding:'28px',width:'100%',maxWidth:600,boxShadow:'0 20px 60px rgba(0,0,0,0.18)',fontFamily:"'DM Sans', sans-serif" }} onClick={e => e.stopPropagation()}>

        {success ? (
          <div style={{ textAlign:'center',padding:'40px 20px' }}>
            <div style={{ marginBottom:20 }}><CheckCircle size={48} color="#10b981" /></div>
            <h2 style={{ fontSize:20,fontWeight:600,color:'#111827',margin:'12px 0 6px' }}>User created!</h2>
            <p style={{ fontSize:13,color:'#6b7280',margin:0 }}>The user account has been successfully created.</p>
          </div>
        ) : (
          <>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:20 }}>
              <UserPlus size={16} color="#0d9488" />
              <span style={{ fontSize:14,fontWeight:600,color:'#111827' }}>Add New User</span>
              <button onClick={handleClose} disabled={loading} style={{ marginLeft:'auto',width:28,height:28,borderRadius:7,border:'1px solid #e2e8f0',background:'#f8fafc',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#94a3b8' }}><X size={14}/></button>
            </div>

            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16 }}>
              <div>
                <label style={iLabel}>Full name <span style={{ color:'#0d9488' }}>*</span></label>
                <input style={iInput} placeholder="John Doe" value={formData.name} onChange={e => update('name', e.target.value)} />
              </div>

              <div>
                <label style={iLabel}>Employee ID <span style={{ color:'#0d9488' }}>*</span></label>
                <input style={iInput} placeholder="EMP-001" value={formData.employeeId} onChange={e => update('employeeId', e.target.value)} />
              </div>

              <div style={{ gridColumn:'1 / -1' }}>
                <label style={iLabel}>Email address <span style={{ color:'#0d9488' }}>*</span></label>
                <input style={iInput} type="email" placeholder="employee@bank.com" value={formData.email} onChange={e => update('email', e.target.value)} />
              </div>

              <div>
                <label style={iLabel}>Department</label>
                <FormSelect
                  options={[
                    { value:'', label:'Select department' },
                    { value:'IT', label:'IT' },
                    { value:'Finance', label:'Finance' },
                    { value:'Operations', label:'Operations' },
                    { value:'HR', label:'HR' },
                    { value:'Compliance', label:'Compliance' },
                    { value:'Customer Service', label:'Customer Service' },
                  ]}
                  value={formData.department}
                  onChange={v => update('department', v)}
                  placeholder="Select department"
                />
              </div>

              <div>
                <label style={iLabel}>Role</label>
                <FormSelect
                  options={[
                    { value:'', label:'Select role' },
                    { value:'Admin', label:'Admin' },
                    { value:'Manager', label:'Manager' },
                    { value:'Auditor', label:'Auditor' },
                    { value:'User', label:'User' },
                  ]}
                  value={formData.role}
                  onChange={v => update('role', v)}
                  placeholder="Select role"
                />
              </div>

              <div>
                <label style={iLabel}>Temporary password <span style={{ color:'#0d9488' }}>*</span></label>
                <div style={{ position:'relative' }}>
                  <input style={{ ...iInput, paddingRight:38 }} type={showPw?'text':'password'} placeholder={`Min ${policy?.minLength??12} – max 128 chars`} value={formData.password} onChange={e => update('password', e.target.value)} />
                  <button type="button" onClick={() => setShowPw(v=>!v)} style={{ position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#9ca3af',display:'flex',alignItems:'center',padding:2 }}>
                    {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                </div>
                {pw && strength && (
                  <>
                    <div style={{ height:3,background:'#f1f5f9',borderRadius:2,marginTop:7,overflow:'hidden' }}>
                      <div style={{ height:'100%',borderRadius:2,transition:'width .3s,background .3s',width:`${(strength.score/6)*100}%`,background:strength.color }}/>
                    </div>
                    <div style={{ display:'flex',justifyContent:'space-between',marginTop:4 }}>
                      <span style={{ fontSize:11,fontWeight:600,color:strength.color }}>{strength.label}</span>
                      <span style={{ fontSize:11,color:'#9ca3af' }}>{pw.length}/128</span>
                    </div>
                  </>
                )}
                {pw && policy && (
                  <div style={{ marginTop:8,background:'#f9fafb',border:'1px solid #f1f5f9',borderRadius:8,padding:'10px 12px' }}>
                    {[
                      { label:`At least ${policy.minLength} characters`, pass: pw.length>=policy.minLength },
                      { label:'Maximum 128 characters', pass: pw.length<=128 },
                      { label:'Uppercase letter (A–Z)', pass: !policy.requireUppercase||/[A-Z]/.test(pw) },
                      { label:'Lowercase letter (a–z)', pass: !policy.requireLowercase||/[a-z]/.test(pw) },
                      { label:'Number (0–9)', pass: !policy.requireNumbers||/[0-9]/.test(pw) },
                      { label:'Special character (e.g. !@#$%^&*)', pass: !policy.requireSpecial||/[^A-Za-z0-9]/.test(pw) },
                    ].map((r,i) => (
                      <div key={i} style={{ display:'flex',alignItems:'center',gap:6,fontSize:12,color:r.pass?'#10b981':'#ef4444',marginBottom:i<5?3:0 }}>
                        {r.pass?<CheckCircle size={12}/>:<XCircle size={12}/>}{r.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={iLabel}>Confirm password <span style={{ color:'#0d9488' }}>*</span></label>
                <div style={{ position:'relative' }}>
                  <input style={{ ...iInput, paddingRight:38 }} type={showConfirm?'text':'password'} placeholder="Repeat password" value={formData.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} />
                  <button type="button" onClick={() => setShowConfirm(v=>!v)} style={{ position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#9ca3af',display:'flex',alignItems:'center',padding:2 }}>
                    {showConfirm?<EyeOff size={14}/>:<Eye size={14}/>}
                  </button>
                </div>
                {formData.confirmPassword && (
                  <div style={{ display:'flex',alignItems:'center',gap:5,fontSize:12,marginTop:6,color:formData.password===formData.confirmPassword?'#10b981':'#ef4444' }}>
                    {formData.password===formData.confirmPassword?<><CheckCircle size={12}/><span>Passwords match</span></>:<><XCircle size={12}/><span>Passwords do not match</span></>}
                  </div>
                )}
              </div>
            </div>

            {error && <div style={{ fontSize:13,color:'#ef4444',background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:'10px 13px',marginBottom:16 }}>⚠ {error}</div>}

            <div style={{ display:'flex',justifyContent:'flex-end',gap:10 }}>
              <button onClick={handleClose} disabled={loading} style={{ height:38,padding:'0 16px',border:'1px solid #e5e7eb',borderRadius:8,background:'#fff',color:'#6b7280',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans', sans-serif" }}>Cancel</button>
              <button onClick={handleSubmit} disabled={loading} style={{ height:38,padding:'0 18px',border:'none',borderRadius:8,background:'#0d9488',color:'#fff',fontSize:13,fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontFamily:"'DM Sans', sans-serif" }}>
                {loading?'Creating...':<><UserPlus size={14}/>Create User</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────
function Toast({ msg, type, onDone }: { msg:string; type:'success'|'error'; onDone:()=>void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position:'fixed',bottom:24,right:24,zIndex:9999,padding:'14px 20px',borderRadius:12,fontSize:13.5,fontWeight:600,fontFamily:"'DM Sans',sans-serif",boxShadow:'0 8px 24px rgba(0,0,0,0.12)',background:type==='success'?'#ecfdf5':'#fef2f2',color:type==='success'?'#059669':'#dc2626',border:`1px solid ${type==='success'?'#a7f3d0':'#fecaca'}` }}>
      {msg}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function UserAccounts() {
  const router = useRouter();
  const [activeMenu, setActiveMenu]   = useState('user-accounts');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [users, setUsers]             = useState<ApiUser[]>([]);
  const [loading, setLoading]         = useState(true);
  const [searchTerm, setSearchTerm]   = useState('');
  const [roleFilter, setRoleFilter]     = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage]               = useState(1);
  const [editTarget, setEditTarget]   = useState<ApiUser|null>(null);
  const [resetTarget, setResetTarget] = useState<ApiUser|null>(null);
  const [toast, setToast]             = useState<{msg:string;type:'success'|'error'}|null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchArray(`${API}/users`);
      setUsers(data);
    } catch { setToast({ msg:'Failed to load users', type:'error' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    try {
      const res  = await fetch(`${API}/users/${resetTarget.id}/reset-password`, {
        method: 'POST',
        headers: { Authorization:`Bearer ${auth.getToken()}` },
      });
      const data = await res.json();
      if (data.success) { 
        setToast({ msg:`Reset link sent to ${resetTarget.email}`, type:'success' }); 
        setResetTarget(null);
      }
      else setToast({ msg: data.message||'Failed', type:'error' });
    } catch { setToast({ msg:'Server error', type:'error' }); }
  };

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
    return d.toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  };

  const filtered = users.filter(u => {
    if (roleFilter !== 'all' && !u.roles.includes(roleFilter)) return false;
    if (statusFilter !== 'all' && u.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.employeeId.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage-1)*ROWS_PER_PAGE, safePage*ROWS_PER_PAGE);

  const statusCfg: Record<string,{bg:string;color:string;dot:string}> = {
    active:   { bg:'#e8f9f6', color:'#1a7a6c', dot:'#2db9a3' },
    inactive: { bg:'#fef9ec', color:'#b7791f', dot:'#e5a623' },
    locked:   { bg:'#fef2f2', color:'#c0392b', dot:'#e55353' },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;}
        .ua-root{display:flex;height:100vh;background:#fff;overflow:hidden;font-family:'DM Sans',sans-serif;}
        .ua-main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .ua-scroll{flex:1;overflow-y:auto;padding:28px 32px;scrollbar-width:thin;scrollbar-color:#e2e8f0 transparent;}
        .ua-scroll::-webkit-scrollbar{width:6px;}
        .ua-scroll::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:3px;}
        .ua-page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;}
        .ua-page-header h1{font-size:22px;font-weight:700;color:#1a2332;margin:0 0 4px;}
        .ua-page-header p{font-size:13px;color:#8a9ab0;margin:0;}
        .ua-add-btn{display:flex;align-items:center;gap:7px;padding:9px 18px;background:#2db9a3;color:#fff;border:none;border-radius:9px;font-size:13px;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;transition:background 0.18s;}
        .ua-add-btn:hover{background:#24a08d;}
        .ua-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px;}
        .ua-stat-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:18px;padding:18px 20px;display:flex;align-items:center;gap:14px;box-shadow:0 4px 12px rgba(0,0,0,0.06);}
        .ua-stat-icon{width:42px;height:42px;border-radius:10px;background:rgba(45,185,163,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .ua-stat-icon.red{background:#fef2f2;}
        .ua-stat-val{font-size:22px;font-weight:700;color:#1a2332;line-height:1;}
        .ua-stat-label{font-size:12px;color:#8a9ab0;margin-top:3px;}
        .ua-filters{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:18px;}
        .ua-search-wrap{position:relative;flex:1;min-width:180px;max-width:280px;}
        .ua-search-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:#b0bece;pointer-events:none;}
        .ua-input{width:100%;height:36px;padding:0 12px 0 34px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:'DM Sans',sans-serif;color:#1a2332;background:#fff;outline:none;}
        .ua-input:focus{border-color:#2db9a3;}
        .ua-count{margin-left:auto;font-size:13px;color:#8a9ab0;white-space:nowrap;}
        .ua-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:18px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.04);}
        .ua-table-wrap{overflow-x:auto;}
        table{width:100%;border-collapse:collapse;min-width:780px;font-family:'DM Sans',sans-serif;table-layout:fixed;}
        thead tr{background:#f8fafc;border-bottom:1.5px solid #f1f5f9;}
        thead th{padding:11px 20px;text-align:center !important;font-size:10.5px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:0.09em;white-space:nowrap;}
        tbody tr{border-bottom:1px solid #f8fafc;transition:background 0.13s;}
        tbody tr:last-child{border-bottom:none;}
        tbody tr:hover{background:#fafbfd;}
        tbody td{padding:13px 20px;font-size:13px;color:#1e293b;font-weight:500;vertical-align:middle;text-align:center !important;}
        .ua-user-cell{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;width:100%;}
        .ua-user-name{font-size:13.5px;font-weight:600;color:#0f172a;margin:0;line-height:1.4;}
        .ua-user-email{font-size:11px;color:#94a3b8;margin:2px 0 0;line-height:1.4;}
        .ua-badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap;}
        .badge-dot{width:6px;height:6px;border-radius:50%;margin-right:5px;flex-shrink:0;}
        .ua-icon-btn{width:30px;height:30px;border-radius:7px;border:1.5px solid #e8ecf1;background:#fff;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:all 0.15s;padding:0;}
        .ua-icon-btn--edit{color:#64748b;}
        .ua-icon-btn--edit:hover{background:#f0fdf9;color:#2db9a3;border-color:#2db9a3;}
        .ua-icon-btn--reset{color:#64748b;}
        .ua-icon-btn--reset:hover{background:#eff6ff;color:#3b82f6;border-color:#93c5fd;}
        .ua-pagination{display:flex;align-items:center;justify-content:space-between;padding:14px 24px;border-top:1px solid #f1f5f9;background:#fafbfc;flex-wrap:wrap;gap:10px;}
        .ua-pag-info{font-size:13px;color:#94a3b8;}
        .ua-pag-info strong{color:#475569;font-weight:600;}
        .ua-pag-btns{display:flex;align-items:center;gap:4px;}
        .ua-pag-btn{width:34px;height:34px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;color:#4a5568;font-size:13px;font-weight:500;font-family:'DM Sans',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s;}
        .ua-pag-btn:hover:not(:disabled){background:#f0fdf9;color:#2db9a3;border-color:#2db9a3;}
        .ua-pag-btn:disabled{opacity:0.35;cursor:not-allowed;}
        .ua-pag-counter{font-size:13px;color:#475569;font-weight:500;min-width:50px;text-align:center;}
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <div className="ua-root">
        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={() => { auth.clear(); router.push('/'); }} />
        <div className="ua-main">
          <TopBar title="User Accounts" />
          <div className="ua-scroll">
            <div className="ua-page-header">
              <div><h1>User Accounts</h1><p>Manage all system users</p></div>
              <button className="ua-add-btn" onClick={() => setShowAddUserModal(true)}><UserPlus size={15}/> Add User</button>
            </div>

            <div className="ua-stats">
              {[
                { label:'Total Users', value: users.length, red:false },
                { label:'Active',      value: users.filter(u => u.status.toLowerCase()==='active').length,   red:false },
                { label:'Inactive',    value: users.filter(u => u.status.toLowerCase()==='inactive').length, red:true  },
                { label:'MFA Enabled', value: users.filter(u => u.mfaEnabled).length,                       red:false },
              ].map(s => (
                <div key={s.label} className="ua-stat-card">
                  <div className={`ua-stat-icon${s.red?' red':''}`}><Users size={18} color={s.red?'#e55353':'#1D9E75'}/></div>
                  <div><div className="ua-stat-val">{s.value}</div><div className="ua-stat-label">{s.label}</div></div>
                </div>
              ))}
            </div>

            <div className="ua-filters">
              <div className="ua-search-wrap">
                <Search size={14} className="ua-search-icon"/>
                <input className="ua-input" placeholder="Search users..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }}/>
              </div>
              <FilterSelect
                options={[
                  { value:'all', label:'All Roles' },
                  { value:'Admin', label:'Admin' },
                  { value:'Manager', label:'Manager' },
                  { value:'Auditor', label:'Auditor' },
                  { value:'User', label:'User' },
                ]}
                value={roleFilter}
                onChange={val => { setRoleFilter(val); setPage(1); }}
              />
              <FilterSelect
                options={[
                  { value:'all', label:'All Status' },
                  { value:'active', label:'Active' },
                  { value:'inactive', label:'Inactive' },
                  { value:'locked', label:'Locked' },
                ]}
                value={statusFilter}
                onChange={val => { setStatusFilter(val); setPage(1); }}
              />
              <span className="ua-count">{filtered.length} users</span>
            </div>

            <div className="ua-card">
              <div className="ua-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width:'26%', textAlign:'center' }}>User</th>
                      <th style={{ width:'13%', textAlign:'center' }}>Role</th>
                      <th style={{ width:'14%', textAlign:'center' }}>Department</th>
                      <th style={{ width:'11%', textAlign:'center' }}>MFA</th>
                      <th style={{ width:'12%', textAlign:'center' }}>Status</th>
                      <th style={{ width:'13%', textAlign:'center' }}>Last Login</th>
                      <th style={{ width:'11%', textAlign:'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} style={{ textAlign:'center',padding:'40px 0',color:'#94a3b8',fontSize:13 }}>Loading users...</td></tr>
                    ) : paginated.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign:'center',padding:'40px 0',color:'#94a3b8',fontSize:13 }}>No users found.</td></tr>
                    ) : paginated.map(u => {
                      const s = statusCfg[u.status.toLowerCase()] ?? statusCfg.inactive;
                      return (
                        <tr key={u.id}>
                          <td style={{ textAlign:'center' }}>
                            <div className="ua-user-cell">
                              <span className="ua-user-name">{u.name}</span>
                              <span className="ua-user-email">{u.email}</span>
                            </div>
                          </td>
                          <td style={{ textAlign:'center', fontSize:13, color:'#334155', fontWeight:400 }}>{u.roles[0]??'—'}</td>
                          <td style={{ textAlign:'center', color:'#64748b', fontWeight:400 }}>{u.department||'—'}</td>
                          <td style={{ textAlign:'center' }}>
                            <span className="ua-badge" style={{ background:u.mfaEnabled?'#e8f9f6':'#fef9ec', color:u.mfaEnabled?'#1a7a6c':'#b7791f' }}>
                              {u.mfaEnabled?'Enabled':'Disabled'}
                            </span>
                          </td>
                          <td style={{ textAlign:'center' }}>
                            <span className="ua-badge" style={{ background:s.bg, color:s.color }}>
                              <span className="badge-dot" style={{ background:s.dot }}/>
                              {u.status.charAt(0).toUpperCase()+u.status.slice(1)}
                            </span>
                          </td>
                          <td style={{ textAlign:'center', color:'#94a3b8', fontSize:12, fontWeight:400 }}>
                            {u.lastLogin?formatDate(u.lastLogin):'—'}
                          </td>
                          <td style={{ textAlign:'center' }}>
                            {/* Archive button removed — only Edit and Reset Password */}
                            <ActionButtons
                              onEdit={() => setEditTarget(u)}
                              onReset={() => setResetTarget(u)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="ua-pagination">
                <span className="ua-pag-info">
                  Showing <strong>{filtered.length===0?0:(safePage-1)*ROWS_PER_PAGE+1}–{Math.min(safePage*ROWS_PER_PAGE,filtered.length)}</strong> of <strong>{filtered.length}</strong>
                </span>
                <div className="ua-pag-btns">
                  <button className="ua-pag-btn" onClick={() => setPage(p => Math.max(1,p-1))} disabled={safePage===1}><ChevronLeft size={15}/></button>
                  <span className="ua-pag-counter">{safePage} / {totalPages}</span>
                  <button className="ua-pag-btn" onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={safePage===totalPages}><ChevronRight size={15}/></button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <EditDialog open={!!editTarget} onClose={() => setEditTarget(null)} user={editTarget} onSaved={() => { fetchUsers(); setToast({ msg:'User updated', type:'success' }); }}/>
      <ConfirmDialog open={!!resetTarget} onClose={() => setResetTarget(null)} title="Reset Password" description={`Send a password reset link to ${resetTarget?.email}?`} confirmLabel="Send Reset Link" onConfirm={handleResetPassword} danger={false}/>
      <AddUserModal open={showAddUserModal} onClose={() => setShowAddUserModal(false)} onSuccess={() => { fetchUsers(); setToast({ msg:'User created successfully', type:'success' }); }}/>
    </>
  );
}