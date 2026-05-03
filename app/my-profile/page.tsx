'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar from '@/app/components/Sidebar';
import TopBar from '@/app/components/TopBar';
import {
  Edit3, User, KeyRound, Mail, Building, MapPin,
  ShieldCheck, Camera, Eye, EyeOff, Loader2, X,
  Activity, Lock, CheckCircle2, AlertCircle, Clock, ShieldOff,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL;
const CLOUDINARY_CLOUD  = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD ?? 'dv42otyiv';
const CLOUDINARY_PRESET = 'nexum_profiles';

function getHDImageUrl(url: string | null | undefined, size = 400): string | null {
  if (!url) return null;
  return url.replace('/upload/', `/upload/w_${size},h_${size},c_fill,q_auto:best,f_auto/`);
}

async function uploadToCloudinary(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUDINARY_PRESET);
  fd.append('folder', 'nexum/profiles');
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error('Upload failed');
  return (await res.json()).secure_url as string;
}

interface UserProfile {
  id: string; name: string; employeeId: string; email: string;
  department: string | null; status: string; mfaEnabled: boolean;
  roles: string[]; profileImageUrl?: string | null;
}

// ✅ Password policy fetched from backend
interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecial: boolean;
}

function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '#e4e6eb' };
  let s = 0;
  if (pw.length >= 8)  s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { score: 1, label: 'Weak',        color: '#ef4444' };
  if (s <= 2) return { score: 2, label: 'Fair',        color: '#f59e0b' };
  if (s <= 3) return { score: 3, label: 'Good',        color: '#3b82f6' };
  if (s <= 4) return { score: 4, label: 'Strong',      color: '#10b981' };
  return               { score: 5, label: 'Very Strong', color: '#059669' };
}

function StrengthBar({ password }: { password: string }) {
  const { score, label, color } = getStrength(password);
  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= score ? color : '#e4e6eb', transition: 'background .3s' }} />
        ))}
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color, fontFamily: "'Outfit',sans-serif" }}>{label}</div>
    </div>
  );
}

function PasswordRule({ met, text }: { met: boolean; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: met ? '#15803d' : '#9ca3af', fontFamily: "'Outfit',sans-serif", marginBottom: 3 }}>
      {met
        ? <CheckCircle2 size={13} color="#15803d" />
        : <div style={{ width: 13, height: 13, borderRadius: '50%', border: '1.5px solid #d1d5db', flexShrink: 0 }} />}
      {text}
    </div>
  );
}

function Toast({ msg, type, onDone }: { msg: string; type: 'success' | 'error'; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 99999, padding: '12px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600, fontFamily: "'Outfit',sans-serif", boxShadow: '0 8px 32px rgba(0,0,0,0.13)', background: type === 'success' ? '#f0fdf4' : '#fff1f2', color: type === 'success' ? '#15803d' : '#dc2626', border: `1px solid ${type === 'success' ? '#bbf7d0' : '#fecdd3'}`, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: type === 'success' ? '#15803d' : '#dc2626', flexShrink: 0 }} />
      {msg}
    </div>
  );
}

function capitalizeFirst(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

const MyProfile = () => {
  const router = useRouter();
  const { refreshUser }               = useAuth();
  const [activeMenu, setActiveMenu]   = useState('my-profile');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab]     = useState<'about'|'security'|'activity'>('about');
  const [editOpen, setEditOpen]       = useState(false);
  const [pwOpen, setPwOpen]           = useState(false);
  const [profile, setProfile]         = useState<UserProfile | null>(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [toast, setToast]             = useState<{ msg: string; type: 'success'|'error' } | null>(null);
  const fileInputRef                  = useRef<HTMLInputElement>(null);
  const avatarInputRef                = useRef<HTMLInputElement>(null);

  const [editForm, setEditForm]         = useState({ firstName: '', lastName: '', email: '', department: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl]     = useState<string | null>(null);

  const [pwForm, setPwForm]   = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw]   = useState({ current: false, newPw: false, confirm: false });
  const [pwError, setPwError] = useState<string | null>(null);

  const [activities, setActivities] = useState<any[]>([]);
  const [actSummary, setActSummary] = useState({ totalLogins: 0, lastLogin: null as string | null, deviceCount: 0 });
  const [actLoading, setActLoading] = useState(false);

  // ✅ Password policy from backend — used to show real requirements in Change Password modal
  const [pwPolicy, setPwPolicy] = useState<PasswordPolicy>({
    minLength: 8, requireUppercase: false, requireLowercase: false,
    requireNumbers: false, requireSpecial: false,
  });

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${auth.getToken()}` } });
      setProfile(await res.json());
    } catch { setToast({ msg: 'Failed to load profile', type: 'error' }); }
    finally  { setLoading(false); }
  }, []);

  const fetchActivity = useCallback(async () => {
    setActLoading(true);
    try {
      const res  = await fetch(`${API}/audit/my-activity?limit=20`, { headers: { Authorization: `Bearer ${auth.getToken()}` } });
      const data = await res.json();
      setActivities(data.activities ?? []);
      setActSummary(data.summary ?? { totalLogins: 0, lastLogin: null, deviceCount: 0 });
    } catch {}
    finally { setActLoading(false); }
  }, []);

  // ✅ Fetch password policy so Change Password modal shows real requirements
  const fetchPwPolicy = useCallback(async () => {
    try {
      const res = await fetch(`${API}/password-policy`, { headers: { Authorization: `Bearer ${auth.getToken()}` } });
      if (!res.ok) return;
      const data = await res.json();
      setPwPolicy({
        minLength:        data.minLength        ?? data.MinLength        ?? 8,
        requireUppercase: data.requireUppercase ?? data.RequireUppercase ?? false,
        requireLowercase: data.requireLowercase ?? data.RequireLowercase ?? false,
        requireNumbers:   data.requireNumbers   ?? data.RequireNumbers   ?? false,
        requireSpecial:   data.requireSpecial   ?? data.RequireSpecial   ?? false,
      });
    } catch {}
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchActivity();
    fetchPwPolicy();
  }, [fetchProfile, fetchActivity, fetchPwPolicy]);

  // ✅ Validate new password against fetched policy
  const validatePassword = (pw: string): string | null => {
    if (pw.length < pwPolicy.minLength)              return `Password must be at least ${pwPolicy.minLength} characters.`;
    if (pwPolicy.requireUppercase && !/[A-Z]/.test(pw)) return 'Password must contain at least one uppercase letter.';
    if (pwPolicy.requireLowercase && !/[a-z]/.test(pw)) return 'Password must contain at least one lowercase letter.';
    if (pwPolicy.requireNumbers   && !/[0-9]/.test(pw)) return 'Password must contain at least one number.';
    if (pwPolicy.requireSpecial   && !/[^A-Za-z0-9]/.test(pw)) return 'Password must contain at least one special character.';
    return null;
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const openEdit = () => {
    if (!profile) return;
    const parts = profile.name.split(' ');
    setEditForm({ firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') ?? '', email: profile.email, department: profile.department ?? '' });
    setPreviewUrl(profile.profileImageUrl ?? null);
    setSelectedFile(null);
    setEditOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file));
  };

  const handleQuickAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !profile) return;
    setSaving(true);
    try {
      const url = await uploadToCloudinary(file);
      await fetch(`${API}/users/${profile.id}/profile-image`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.getToken()}` },
        body: JSON.stringify({ profileImageUrl: url }),
      });
      setToast({ msg: 'Profile photo updated!', type: 'success' });
      await fetchProfile(); await refreshUser();
    } catch { setToast({ msg: 'Photo upload failed.', type: 'error' }); }
    finally  { setSaving(false); if (avatarInputRef.current) avatarInputRef.current.value = ''; }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      let imageUrl = profile.profileImageUrl ?? null;
      if (selectedFile) {
        setUploading(true);
        try { imageUrl = await uploadToCloudinary(selectedFile); }
        catch { setToast({ msg: 'Image upload failed.', type: 'error' }); setSaving(false); setUploading(false); return; }
        setUploading(false);
        await fetch(`${API}/users/${profile.id}/profile-image`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.getToken()}` },
          body: JSON.stringify({ profileImageUrl: imageUrl }),
        });
      }
      const res  = await fetch(`${API}/users/${profile.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.getToken()}` },
        body: JSON.stringify({ name: `${editForm.firstName} ${editForm.lastName}`.trim(), email: editForm.email, department: editForm.department }),
      });
      const data = await res.json();
      if (data.success) {
        setEditOpen(false); setSelectedFile(null);
        setToast({ msg: 'Profile updated!', type: 'success' });
        await fetchProfile(); await refreshUser();
      } else setToast({ msg: data.message || 'Update failed', type: 'error' });
    } catch { setToast({ msg: 'Server error', type: 'error' }); }
    finally  { setSaving(false); }
  };

  const handleChangePassword = async () => {
    setPwError(null);
    if (!pwForm.current) return setPwError('Enter your current password.');
    // ✅ Validate against real policy from backend
    const policyErr = validatePassword(pwForm.newPw);
    if (policyErr) return setPwError(policyErr);
    if (pwForm.newPw !== pwForm.confirm) return setPwError('Passwords do not match.');
    if (!profile) return;
    setSaving(true);
    try {
      const res  = await fetch(`${API}/users/${profile.id}/change-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.getToken()}` },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPw }),
      });
      const data = await res.json();
      if (data.success) {
        setPwOpen(false); setPwForm({ current: '', newPw: '', confirm: '' });
        setToast({ msg: 'Password changed!', type: 'success' });
      } else setPwError(data.message || 'Failed to change password.');
    } catch { setPwError('Server error.'); }
    finally  { setSaving(false); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .pr-root   { display:flex; height:100vh; background:#ffffff; font-family:'Outfit',sans-serif; overflow:hidden; }
        .pr-main   { flex:1; display:flex; flex-direction:column; overflow:hidden; }
        .pr-scroll { flex:1; overflow-y:auto; scrollbar-width:thin; scrollbar-color:#d1d5db transparent; }
        .pr-cover-wrap { background:#fff; border-bottom:1px solid #e4e6eb; margin-bottom:16px; box-shadow:0 2px 8px rgba(0,0,0,.06); }
        .pr-cover-img  { width:100%; height:240px; background:linear-gradient(130deg,#0d9488 0%,#0ea5e9 45%,#6366f1 100%); display:block; position:relative; overflow:hidden; }
        .pr-identity-bar { max-width:1080px; margin:0 auto; padding:0 28px; display:flex; align-items:flex-end; justify-content:space-between; gap:16px; flex-wrap:wrap; }
        .pr-identity-left { display:flex; align-items:flex-end; gap:16px; }
        .pr-avatar-wrap { margin-top:-48px; position:relative; flex-shrink:0; cursor:pointer; }
        .pr-avatar { width:180px; height:180px; border-radius:50%; border:4px solid #fff; box-shadow:0 4px 16px rgba(0,0,0,.16); background:linear-gradient(135deg,#0d9488,#818cf8); display:flex; align-items:center; justify-content:center; font-size:60px; font-weight:700; color:#fff; overflow:hidden; transition:filter .2s; }
        .pr-avatar img { width:100%; height:100%; object-fit:cover; }
        .pr-avatar-wrap:hover .pr-avatar { filter:brightness(.85); }
        .pr-cam-btn { position:absolute; bottom:4px; right:4px; width:44px; height:44px; border-radius:50%; background:#e4e6eb; border:3px solid #fff; display:flex; align-items:center; justify-content:center; color:#050505; z-index:2; box-shadow:0 1px 5px rgba(0,0,0,.2); transition:background .15s, transform .15s; }
        .pr-avatar-wrap:hover .pr-cam-btn { background:#cfd2d9; transform:scale(1.1); }
        .pr-name-block { padding-bottom:10px; }
        .pr-name { font-size:24px; font-weight:800; color:#050505; letter-spacing:-.025em; margin:0 0 5px; }
        .pr-sub  { font-size:14px; color:#65676b; font-weight:500; display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .pr-sep  { width:4px; height:4px; border-radius:50%; background:#c9ccd1; flex-shrink:0; }
        .pr-actions { display:flex; align-items:center; gap:10px; padding-bottom:10px; flex-wrap:wrap; }
        .btn-primary   { display:inline-flex; align-items:center; gap:7px; background:#0d9488; color:#fff; border:none; padding:9px 20px; border-radius:8px; font-size:14px; font-weight:600; font-family:'Outfit',sans-serif; cursor:pointer; transition:all .18s; box-shadow:0 2px 6px rgba(13,148,136,.3); }
        .btn-primary:hover   { background:#0b7e74; }
        .btn-secondary { display:inline-flex; align-items:center; gap:7px; background:#e4e6eb; color:#050505; border:none; padding:9px 18px; border-radius:8px; font-size:14px; font-weight:600; font-family:'Outfit',sans-serif; cursor:pointer; transition:background .15s; }
        .btn-secondary:hover { background:#d8dadf; }
        .pr-tabs { max-width:1080px; margin:10px auto 0; padding:0 28px; display:flex; align-items:center; gap:2px; border-top:1px solid #e4e6eb; }
        .pr-tab  { padding:12px 18px; font-size:15px; font-weight:600; color:#65676b; border:none; background:none; cursor:pointer; border-bottom:3px solid transparent; margin-bottom:-1px; transition:all .18s; font-family:'Outfit',sans-serif; }
        .pr-tab.active { color:#0d9488; border-bottom-color:#0d9488; }
        .pr-tab:hover:not(.active) { background:#f2f2f2; border-radius:8px 8px 0 0; color:#050505; }
        .pr-body { max-width:1080px; margin:0 auto; padding:16px 28px 48px; display:grid; grid-template-columns:340px 1fr; gap:16px; align-items:start; }
        .card { background:#fff; border-radius:12px; border:1px solid #e4e6eb; padding:18px; margin-bottom:16px; box-shadow:0 2px 8px rgba(0,0,0,.06), 0 0 1px rgba(0,0,0,.04); }
        .card:last-child { margin-bottom:0; }
        .card-title { font-size:17px; font-weight:700; color:#050505; margin:0 0 14px; }
        .info-row { display:flex; align-items:center; gap:12px; padding:9px 0; border-bottom:1px solid #f0f2f5; }
        .info-row:last-child  { border-bottom:none; padding-bottom:0; }
        .info-row:first-of-type { padding-top:0; }
        .i-icon  { width:36px; height:36px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
        .i-label { font-size:11px; font-weight:700; color:#8a8d91; text-transform:uppercase; letter-spacing:.07em; margin-bottom:2px; }
        .i-value { font-size:14px; font-weight:600; color:#050505; word-break:break-all; }
        .sec-row { display:flex; align-items:center; justify-content:space-between; padding:14px 0; border-bottom:1px solid #f0f2f5; gap:12px; }
        .sec-row:last-child { border-bottom:none; padding-bottom:0; }
        .badge    { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:12px; font-size:11.5px; font-weight:700; }
        .bg-green { background:#dcfce7; color:#15803d; }
        .bg-amber { background:#fef9c3; color:#92400e; }
        .bg-blue  { background:#dbeafe; color:#1d4ed8; }
        .detail-card  { background:#fff; border-radius:12px; border:1px solid #e4e6eb; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,.06), 0 0 1px rgba(0,0,0,.04); }
        .detail-title { font-size:17px; font-weight:700; color:#050505; margin:0 0 16px; }
        .detail-grid  { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .d-item  { padding:13px 14px; border-radius:9px; background:#f7f8fa; border:1px solid #eaecef; }
        .d-label { font-size:10.5px; font-weight:700; color:#8a8d91; text-transform:uppercase; letter-spacing:.07em; margin-bottom:4px; }
        .d-value { font-size:14px; font-weight:600; color:#050505; }
        .s-pill { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:20px; font-size:12px; font-weight:700; }
        .s-dot  { width:7px; height:7px; border-radius:50%; animation:blink 2s ease infinite; }
        @keyframes blink { 0%,100%{opacity:1}50%{opacity:.3} }
        .act-item { display:flex; align-items:flex-start; gap:13px; padding:12px 0; border-bottom:1px solid #f0f2f5; }
        .act-item:last-child { border-bottom:none; }
        .act-icon { width:38px; height:38px; border-radius:10px; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
        .act-text { font-size:14px; font-weight:600; color:#050505; margin-bottom:2px; }
        .act-sub  { font-size:12px; color:#65676b; }
        .act-time { font-size:11.5px; color:#9ca3af; margin-left:auto; white-space:nowrap; padding-top:2px; display:flex; align-items:center; gap:4px; }
        .overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,.48); backdrop-filter:blur(4px); z-index:9999; align-items:center; justify-content:center; }
        .overlay.open { display:flex; }
        .modal { background:#fff; border-radius:16px; width:90%; max-width:480px; box-shadow:0 24px 60px rgba(0,0,0,.18); animation:mIn .22s cubic-bezier(.34,1.56,.64,1); overflow:hidden; }
        @keyframes mIn { from{opacity:0;transform:scale(.92) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .m-head { padding:20px 20px 0; display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:16px; }
        .m-title{ font-size:18px; font-weight:700; color:#050505; margin:0 0 2px; }
        .m-sub  { font-size:12.5px; color:#65676b; margin:0; }
        .m-x    { width:30px; height:30px; border-radius:50%; background:#e4e6eb; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#65676b; transition:background .15s; }
        .m-x:hover { background:#cfd2d9; }
        .m-body { padding:0 20px 4px; }
        .m-foot { padding:14px 20px 20px; display:flex; justify-content:flex-end; gap:10px; border-top:1px solid #f0f2f5; margin-top:16px; }
        .av-strip { display:flex; align-items:center; gap:16px; padding:14px; background:#f7f8fa; border-radius:12px; border:1.5px dashed #d1d5db; margin-bottom:18px; transition:border-color .2s; }
        .av-strip:hover { border-color:#0d9488; background:#f0fdfa; }
        .av-thumb { width:68px; height:68px; border-radius:50%; background:linear-gradient(135deg,#0d9488,#818cf8); display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:700; color:#fff; overflow:hidden; flex-shrink:0; border:3px solid #fff; box-shadow:0 2px 8px rgba(0,0,0,.1); }
        .av-thumb img { width:100%; height:100%; object-fit:cover; }
        .up-btn { display:inline-flex; align-items:center; gap:6px; padding:7px 13px; background:#fff; border:1.5px solid #d1d5db; border-radius:8px; font-size:12px; font-weight:600; color:#0d9488; cursor:pointer; font-family:'Outfit',sans-serif; transition:all .15s; }
        .up-btn:hover { background:#f0fdfa; border-color:#0d9488; }
        .f-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px; }
        .f-grp { display:flex; flex-direction:column; margin-bottom:12px; }
        .f-grp:last-child { margin-bottom:0; }
        .f-lbl { font-size:12px; font-weight:700; color:#374151; margin-bottom:5px; }
        .f-inp { height:40px; padding:0 12px; border:1.5px solid #e4e6eb; border-radius:9px; font-size:13.5px; font-family:'Outfit',sans-serif; color:#050505; background:#fff; outline:none; transition:border-color .15s, box-shadow .15s; width:100%; }
        .f-inp:focus { border-color:#0d9488; box-shadow:0 0 0 3px rgba(13,148,136,.1); }
        .btn-save { padding:9px 22px; border-radius:9px; border:none; background:#0d9488; color:#fff; font-size:13.5px; font-weight:600; font-family:'Outfit',sans-serif; cursor:pointer; display:flex; align-items:center; gap:7px; transition:all .15s; box-shadow:0 2px 6px rgba(13,148,136,.25); }
        .btn-save:hover { background:#0b7e74; }
        .btn-save:disabled { opacity:.6; cursor:not-allowed; }
        .btn-cxl  { padding:9px 18px; border-radius:9px; border:1.5px solid #e4e6eb; background:#fff; color:#374151; font-size:13.5px; font-weight:600; font-family:'Outfit',sans-serif; cursor:pointer; transition:all .15s; }
        .btn-cxl:hover { background:#f7f8fa; }
        .btn-pw   { padding:9px 22px; border-radius:9px; border:none; background:#6366f1; color:#fff; font-size:13.5px; font-weight:600; font-family:'Outfit',sans-serif; cursor:pointer; display:flex; align-items:center; gap:7px; transition:all .15s; }
        .btn-pw:hover { background:#4f46e5; }
        .btn-pw:disabled { opacity:.6; cursor:not-allowed; }
        .pw-wrap { position:relative; }
        .pw-wrap .f-inp { padding-right:40px; }
        .pw-eye { position:absolute; right:11px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:#9ca3af; display:flex; align-items:center; padding:0; }
        .pw-eye:hover { color:#374151; }
        .pw-err { font-size:12.5px; color:rgb(252,165,165); background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); border-radius:12px; padding:12px 16px; margin-bottom:14px; display:flex; align-items:center; gap:8px; }
        .pw-rules { background:#ffffff; border-radius:10px; padding:12px 14px; margin-top:10px; border:1px solid #e4e6eb; }
        .spin { animation:spin 1s linear infinite; }
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @media(max-width:820px) {
          .pr-body { grid-template-columns:1fr; }
          .pr-avatar { width:140px; height:140px; font-size:48px; }
          .pr-name { font-size:20px; }
          .pr-cover-img { height:160px; }
        }
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <div className="pr-root">
        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu}
          sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
          onLogout={() => { auth.clear(); router.push('/'); }} />

        <div className="pr-main">
          <TopBar title="My Profile" />
          <div className="pr-scroll">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#65676b', fontSize: 14 }}>Loading profile…</div>
            ) : !profile ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#dc2626', fontSize: 14 }}>Failed to load profile.</div>
            ) : (
              <>
                <div className="pr-cover-wrap">
                  <div className="pr-cover-img">
                    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: .07 }} xmlns="http://www.w3.org/2000/svg">
                      <defs><pattern id="dp" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1.5" fill="#fff" />
                      </pattern></defs>
                      <rect width="100%" height="100%" fill="url(#dp)" />
                    </svg>
                  </div>
                  <div className="pr-identity-bar">
                    <div className="pr-identity-left">
                      <div className="pr-avatar-wrap" onClick={() => avatarInputRef.current?.click()}>
                        <div className="pr-avatar">
                          {profile.profileImageUrl
                            ? <img src={getHDImageUrl(profile.profileImageUrl, 400) || ''} alt="Profile" />
                            : getInitials(profile.name)}
                        </div>
                        <div className="pr-cam-btn">
                          {saving ? <Loader2 size={15} className="spin" /> : <Camera size={15} />}
                        </div>
                        <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleQuickAvatarChange} />
                      </div>
                      <div className="pr-name-block">
                        <h1 className="pr-name">{profile.name}</h1>
                        <div className="pr-sub">
                          <span>{profile.roles[0] ?? 'User'}</span>
                          <div className="pr-sep" />
                          <span>{profile.department ?? 'No department'}</span>
                          <div className="pr-sep" />
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={13} />Davao City</span>
                        </div>
                      </div>
                    </div>
                    <div className="pr-actions">
                      <button className="btn-primary" onClick={openEdit}><Edit3 size={15} />Edit Profile</button>
                      <button className="btn-secondary" onClick={() => setPwOpen(true)}><KeyRound size={15} />Change Password</button>
                    </div>
                  </div>
                  <div className="pr-tabs">
                    {(['about', 'security', 'activity'] as const).map(t => (
                      <button key={t} className={`pr-tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pr-body">
                  {activeTab === 'about' && (
                    <>
                      <div>
                        <div className="card">
                          <div className="card-title">Account Info</div>
                          {([
                            { icon: User,        label: 'Full Name',   value: profile.name,              bg: '#f0fdf4', color: '#15803d' },
                            { icon: KeyRound,    label: 'Employee ID', value: profile.employeeId,        bg: '#faf5ff', color: '#7c3aed' },
                            { icon: Mail,        label: 'Email',       value: profile.email,             bg: '#eff6ff', color: '#1d4ed8' },
                            { icon: Building,    label: 'Department',  value: profile.department ?? '—', bg: '#fff7ed', color: '#c2410c' },
                            { icon: ShieldCheck, label: 'Role',        value: profile.roles[0] ?? '—',   bg: '#f0fdf4', color: '#15803d' },
                          ] as const).map(f => {
                            const Icon = f.icon as React.ElementType;
                            return (
                              <div key={f.label} className="info-row">
                                <div className="i-icon" style={{ background: f.bg }}><Icon size={16} color={f.color} /></div>
                                <div><div className="i-label">{f.label}</div><div className="i-value">{f.value}</div></div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="detail-card">
                        <div className="detail-title">Profile Overview</div>
                        <div className="detail-grid">
                          {[
                            { label: 'Status',      value: <span className="s-pill" style={{ background: '#dcfce7', color: '#15803d' }}><div className="s-dot" style={{ background: '#16a34a' }} />{profile.status}</span> },
                            { label: 'Role',        value: <span className="badge bg-blue">{profile.roles[0] ?? '—'}</span> },
                            { label: 'Department',  value: profile.department ?? '—' },
                            { label: 'Employee ID', value: <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#7c3aed', fontWeight: 700 }}>{profile.employeeId}</span> },
                            { label: 'MFA',         value: <span className={`badge ${profile.mfaEnabled ? 'bg-green' : 'bg-amber'}`}>{profile.mfaEnabled ? 'Enabled' : 'Disabled'}</span> },
                            { label: 'Email',       value: <span style={{ fontSize: 13 }}>{profile.email}</span> },
                          ].map(item => (
                            <div key={item.label} className="d-item">
                              <div className="d-label">{item.label}</div>
                              <div className="d-value">{item.value}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ height: 1, background: '#e4e6eb', margin: '18px 0' }} />
                        <div style={{ fontSize: 13, color: '#65676b', lineHeight: 1.7 }}>
                          <div style={{ fontWeight: 700, color: '#050505', marginBottom: 6, fontSize: 14 }}>Quick Tips</div>
                          <p style={{ margin: '0 0 5px' }}>• Enable <strong>MFA</strong> for extra account security.</p>
                          <p style={{ margin: '0 0 5px' }}>• Keep your <strong>email</strong> up to date for notifications.</p>
                          <p style={{ margin: 0 }}>• Change your password every 90 days.</p>
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === 'security' && (
                    <>
                      <div>
                        <div className="card">
                          <div className="card-title">Security Settings</div>
                          <div className="sec-row">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="i-icon" style={{ background: profile.mfaEnabled ? '#f0fdf4' : '#fef9c3' }}>
                                {profile.mfaEnabled ? <ShieldCheck size={17} color="#15803d" /> : <ShieldOff size={17} color="#d97706" />}
                              </div>
                              <div>
                                <div className="i-label">Two-Factor Auth (MFA)</div>
                                <div className="i-value">{profile.mfaEnabled ? 'Your account is protected' : 'Disabled by administrator'}</div>
                              </div>
                            </div>
                            <span className={`badge ${profile.mfaEnabled ? 'bg-green' : 'bg-amber'}`}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: profile.mfaEnabled ? '#16a34a' : '#d97706' }} />
                              {profile.mfaEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                          <div className="sec-row">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="i-icon" style={{ background: '#ede9fe' }}><KeyRound size={17} color="#7c3aed" /></div>
                              <div><div className="i-label">Password</div><div className="i-value">••••••••••</div></div>
                            </div>
                            <button onClick={() => setPwOpen(true)} style={{ padding: '5px 14px', borderRadius: 7, border: '1.5px solid #ede9fe', background: '#fff', color: '#7c3aed', fontSize: 12, fontWeight: 700, fontFamily: "'Outfit',sans-serif", cursor: 'pointer' }}>
                              Change
                            </button>
                          </div>
                          <div className="sec-row">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="i-icon" style={{ background: '#eff6ff' }}><Mail size={17} color="#1d4ed8" /></div>
                              <div><div className="i-label">Recovery Email</div><div className="i-value">{profile.email}</div></div>
                            </div>
                            <span className="badge bg-green"><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />Verified</span>
                          </div>
                        </div>
                      </div>
                      <div className="detail-card">
                        <div className="detail-title">Security Overview</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {[
                            { label: 'Account Status',   value: profile.status,                                     good: true },
                            { label: 'MFA / 2FA',        value: profile.mfaEnabled ? 'Enabled' : 'Not configured', good: profile.mfaEnabled },
                            { label: 'Email Verified',   value: 'Verified',                                         good: true },
                            { label: 'Session Security', value: 'JWT Token Active',                                 good: true },
                          ].map(r => (
                            <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 9, background: '#f7f8fa', border: '1px solid #eaecef' }}>
                              <span style={{ fontSize: 13.5, fontWeight: 600, color: '#050505' }}>{r.label}</span>
                              <span className={`badge ${r.good ? 'bg-green' : 'bg-amber'}`}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: r.good ? '#16a34a' : '#d97706' }} />
                                {r.value}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div style={{ height: 1, background: '#e4e6eb', margin: '18px 0' }} />
                        <div style={{ fontSize: 13, color: '#65676b', lineHeight: 1.7 }}>
                          <div style={{ fontWeight: 700, color: '#050505', marginBottom: 6, fontSize: 14 }}>Security Tips</div>
                          <p style={{ margin: '0 0 5px' }}>• Never share your password with anyone.</p>
                          <p style={{ margin: '0 0 5px' }}>• Enable MFA for maximum account protection.</p>
                          <p style={{ margin: 0 }}>• Use a unique password for this account.</p>
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === 'activity' && (
                    <>
                      <div>
                        <div className="card">
                          <div className="card-title">Recent Activity</div>
                          {actLoading ? (
                            <div style={{ textAlign: 'center', padding: '30px 0', color: '#65676b' }}>Loading...</div>
                          ) : activities.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '30px 0', color: '#9ca3af', fontSize: 13 }}>No activity yet.</div>
                          ) : activities.map((a, i) => {
                            const isLogin    = a.action?.toLowerCase().includes('login');
                            const isSuccess  = a.status === 'Success';
                            const isFailed   = a.status === 'Failed';
                            const isPassword = a.action?.toLowerCase().includes('password');
                            const isProfile  = a.action?.toLowerCase().includes('profile') || a.action?.toLowerCase().includes('update');
                            const isMfa      = a.action?.toLowerCase().includes('mfa') || a.action?.toLowerCase().includes('otp');
                            const iconColor  = isSuccess ? '#15803d' : isFailed ? '#dc2626' : '#1d4ed8';
                            const iconBg     = isSuccess ? '#dcfce7'  : isFailed ? '#fee2e2'  : '#eff6ff';
                            const Icon       = isPassword ? KeyRound : isProfile ? Edit3 : isMfa ? ShieldCheck : isLogin ? (isSuccess ? CheckCircle2 : AlertCircle) : Activity;
                            const date       = new Date(a.createdAt);
                            const now        = new Date();
                            const diffMins   = Math.floor((now.getTime() - date.getTime()) / 60000);
                            const diffHrs    = Math.floor(diffMins / 60);
                            const diffDays   = Math.floor(diffHrs / 24);
                            const timeStr    = diffMins < 1 ? 'Just now' : diffMins < 60 ? `${diffMins}m ago` : diffHrs < 24 ? `${diffHrs}h ago` : diffDays < 7 ? `${diffDays}d ago` : date.toLocaleDateString();
                            return (
                              <div key={i} className="act-item">
                                <div className="act-icon" style={{ background: iconBg }}><Icon size={17} color={iconColor} /></div>
                                <div style={{ flex: 1 }}>
                                  <div className="act-text">{a.action}</div>
                                  <div className="act-sub">
                                    {a.module && <span style={{ marginRight: 8 }}>{a.module}</span>}
                                    {a.ipAddress && <span style={{ color: '#9ca3af' }}>{a.ipAddress}</span>}
                                  </div>
                                </div>
                                <div className="act-time"><Clock size={11} />{timeStr}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="detail-card">
                        <div className="detail-title">Activity Summary</div>
                        <div className="detail-grid">
                          {[
                            { label: 'Total Logins',  value: actSummary.totalLogins.toString() },
                            { label: 'Last Login',    value: actSummary.lastLogin ? new Date(actSummary.lastLogin).toLocaleString() : '—' },
                            { label: 'Devices Used',  value: actSummary.deviceCount.toString() },
                            { label: 'Location',      value: 'Davao City, PH' },
                          ].map(s => (
                            <div key={s.label} className="d-item">
                              <div className="d-label">{s.label}</div>
                              <div className="d-value">{s.value}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ height: 1, background: '#e4e6eb', margin: '18px 0' }} />
                        <div style={{ fontSize: 13, color: '#65676b' }}>
                          Activity data pulled from your real audit logs. Unusual login attempts are flagged automatically.
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <div className={`overlay ${editOpen ? 'open' : ''}`} onClick={() => setEditOpen(false)}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="m-head">
            <div><div className="m-title">Edit Profile</div><div className="m-sub">Update your personal information</div></div>
            <button className="m-x" onClick={() => setEditOpen(false)}><X size={14} /></button>
          </div>
          <div className="m-body">
            <div className="av-strip">
              <div className="av-thumb">
                {previewUrl ? <img src={getHDImageUrl(previewUrl, 400) || previewUrl} alt="Preview" /> : profile ? getInitials(profile.name) : ''}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#050505', marginBottom: 2 }}>Profile Photo</div>
                <div style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 8 }}>{selectedFile ? `📄 ${selectedFile.name}` : 'JPG, PNG or GIF · Max 5 MB'}</div>
                <button className="up-btn" onClick={() => fileInputRef.current?.click()}><Camera size={13} />{selectedFile ? 'Replace' : 'Upload Photo'}</button>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
              </div>
            </div>
            <div className="f-row">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label className="f-lbl">First Name</label>
                <input className="f-inp" value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: capitalizeFirst(e.target.value) })} placeholder="First name" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label className="f-lbl">Last Name</label>
                <input className="f-inp" value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: capitalizeFirst(e.target.value) })} placeholder="Last name" />
              </div>
            </div>
            <div className="f-grp">
              <label className="f-lbl">Email Address</label>
              <input type="email" className="f-inp" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} placeholder="you@company.com" />
            </div>
            <div className="f-grp">
              <label className="f-lbl">Department</label>
              <input className="f-inp" value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })} placeholder="e.g. Engineering" />
            </div>
          </div>
          <div className="m-foot">
            <button className="btn-cxl" onClick={() => setEditOpen(false)}>Cancel</button>
            <button className="btn-save" onClick={handleSaveProfile} disabled={saving}>
              {uploading ? <><Loader2 size={14} className="spin" />Uploading…</> : saving ? <><Loader2 size={14} className="spin" />Saving…</> : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal — shows real policy requirements from backend */}
      <div className={`overlay ${pwOpen ? 'open' : ''}`} onClick={() => { setPwOpen(false); setPwError(null); setPwForm({ current: '', newPw: '', confirm: '' }); }}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="m-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={19} color="#7c3aed" />
              </div>
              <div>
                <div className="m-title">Change Password</div>
                <div className="m-sub">Must meet the system password policy</div>
              </div>
            </div>
            <button className="m-x" onClick={() => { setPwOpen(false); setPwError(null); setPwForm({ current: '', newPw: '', confirm: '' }); }}><X size={14} /></button>
          </div>
          <div className="m-body">
            {pwError && <div className="pw-err"><AlertCircle size={14} />{pwError}</div>}
            <div className="f-grp">
              <label className="f-lbl">Current Password</label>
              <div className="pw-wrap">
                <input type={showPw.current ? 'text' : 'password'} className="f-inp" value={pwForm.current} onChange={e => setPwForm({ ...pwForm, current: e.target.value })} placeholder="Enter current password" />
                <button type="button" className="pw-eye" onClick={() => setShowPw({ ...showPw, current: !showPw.current })}>
                  {showPw.current ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="f-grp">
              <label className="f-lbl">New Password</label>
              <div className="pw-wrap">
                <input type={showPw.newPw ? 'text' : 'password'} className="f-inp" value={pwForm.newPw} onChange={e => setPwForm({ ...pwForm, newPw: e.target.value })} placeholder="Create a strong password" />
                <button type="button" className="pw-eye" onClick={() => setShowPw({ ...showPw, newPw: !showPw.newPw })}>
                  {showPw.newPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <StrengthBar password={pwForm.newPw} />
            </div>
            <div className="f-grp">
              <label className="f-lbl">Confirm Password</label>
              <div className="pw-wrap">
                <input type={showPw.confirm ? 'text' : 'password'} className="f-inp" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} placeholder="Re-enter new password" />
                <button type="button" className="pw-eye" onClick={() => setShowPw({ ...showPw, confirm: !showPw.confirm })}>
                  {showPw.confirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {pwForm.confirm && (
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: pwForm.newPw === pwForm.confirm ? 'hsl(170,60%,50%)' : 'rgb(252,165,165)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {pwForm.newPw === pwForm.confirm
                    ? <><CheckCircle2 size={14} color="hsl(170,60%,50%)" />Passwords match</>
                    : <><AlertCircle  size={14} color="rgb(252,165,165)" />Passwords do not match</>}
                </div>
              )}
            </div>

            {/* ✅ Password rules pulled from real backend policy */}
            {pwForm.newPw && (
              <div className="pw-rules">
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>Password Requirements</div>
                <PasswordRule met={pwForm.newPw.length >= pwPolicy.minLength}         text={`At least ${pwPolicy.minLength} characters`} />
                {pwPolicy.requireUppercase && <PasswordRule met={/[A-Z]/.test(pwForm.newPw)}         text="One uppercase letter (A-Z)" />}
                {pwPolicy.requireLowercase && <PasswordRule met={/[a-z]/.test(pwForm.newPw)}         text="One lowercase letter (a-z)" />}
                {pwPolicy.requireNumbers   && <PasswordRule met={/[0-9]/.test(pwForm.newPw)}         text="One number (0-9)" />}
                {pwPolicy.requireSpecial   && <PasswordRule met={/[^A-Za-z0-9]/.test(pwForm.newPw)} text="One special character (!@#$...)" />}
              </div>
            )}
          </div>
          <div className="m-foot">
            <button className="btn-cxl" onClick={() => { setPwOpen(false); setPwError(null); setPwForm({ current: '', newPw: '', confirm: '' }); }}>Cancel</button>
            <button className="btn-pw" onClick={handleChangePassword} disabled={saving}>
              {saving ? <><Loader2 size={14} className="spin" />Updating…</> : 'Update Password'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MyProfile;