'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import { Bell, Search, User, ChevronRight } from 'lucide-react';

export default function AssignRole() {
  const [activeMenu, setActiveMenu] = useState('assign-role');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedUser, setSelectedUser] = useState<{ id: number; name: string; department: string; role: string; accent: string; } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const users = [
    { id: 1, name: 'Sarah Johnson', department: 'ADM001 · IT Security',       role: 'System Admin',    accent: '#2db9a3' },
    { id: 2, name: 'Michael Chen',  department: 'MGR001 · Operations',        role: 'Branch Manager',  accent: '#6366f1' },
    { id: 3, name: 'Emily Davis',   department: 'AUD001 · Compliance',        role: 'Auditor',         accent: '#f59e0b' },
    { id: 4, name: 'James Wilson',  department: 'TEL001 · Customer Service',  role: 'Bank Teller',     accent: '#06b6d4' },
    { id: 5, name: 'Lisa Stone',    department: 'TEL002 · Customer Service',  role: 'Bank Teller',     accent: '#06b6d4' },
    { id: 6, name: 'Mark Brown',    department: 'TEL003 · Customer Service',  role: 'Bank Teller',     accent: '#06b6d4' },
  ];

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');
  const handleLogout = () => router.push('/');

  const avatarGradients = ['linear-gradient(135deg,#2db9a3,#6366f1)', 'linear-gradient(135deg,#6366f1,#8b5cf6)', 'linear-gradient(135deg,#f59e0b,#ef4444)', 'linear-gradient(135deg,#06b6d4,#2db9a3)', 'linear-gradient(135deg,#8b5cf6,#ec4899)', 'linear-gradient(135deg,#f59e0b,#06b6d4)'];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .asr-root { display: flex; height: 100vh; background: #ffffff; overflow: hidden; font-family: 'Plus Jakarta Sans', sans-serif; }
        .asr-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

        .topbar { height: 66px; background: #fff; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .topbar-title { font-size: 16px; font-weight: 700; color: #0f172a; letter-spacing: -0.01em; }
        .topbar-right { display: flex; align-items: center; gap: 14px; }
        .notif-btn { width: 38px; height: 38px; border-radius: 10px; border: 1.5px solid #e2e8f0; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; transition: all 0.18s; position: relative; }
        .notif-btn:hover { border-color: #2db9a3; color: #2db9a3; background: #f0fdf9; }
        .notif-dot { position: absolute; top: 8px; right: 8px; width: 7px; height: 7px; background: #ef4444; border-radius: 50%; border: 1.5px solid #fff; }
        .profile-pill { display: flex; align-items: center; gap: 10px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 40px; padding: 5px 14px 5px 5px; cursor: pointer; transition: all 0.18s; }
        .profile-pill:hover { border-color: #2db9a3; background: #f0fdf9; }
        .profile-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #2db9a3 0%, #6366f1 100%); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; font-weight: 800; }
        .profile-name { font-size: 13px; font-weight: 600; color: #1e293b; }

        .main-content { flex: 1; overflow-y: auto; padding: 32px 36px; scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
        .main-content::-webkit-scrollbar { width: 6px; }
        .main-content::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }

        .page-header { margin-bottom: 28px; }
        .eyebrow { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #2db9a3; background: rgba(45,185,163,0.08); padding: 4px 10px; border-radius: 20px; margin-bottom: 10px; }
        .eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: #2db9a3; }
        .page-header h1 { font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 4px; letter-spacing: -0.03em; }
        .page-header p { font-size: 14px; color: #94a3b8; font-weight: 400; }

        .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }

        .card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 18px; overflow: hidden; transition: box-shadow 0.2s; }
        .card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.06); }

        .card-header { padding: 20px 24px 16px; border-bottom: 1px solid #f1f5f9; }
        .card-title { font-size: 14px; font-weight: 700; color: #0f172a; letter-spacing: -0.01em; margin-bottom: 12px; }

        .search-wrap { position: relative; }
        .search-icon-pos { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }
        .search-input { width: 100%; padding: 9px 14px 9px 38px; border-radius: 10px; border: 1.5px solid #e2e8f0; font-size: 13px; color: #1e293b; background: #f8fafc; font-family: 'Plus Jakarta Sans', sans-serif; outline: none; transition: all 0.18s; }
        .search-input::placeholder { color: #94a3b8; }
        .search-input:focus { border-color: #2db9a3; background: #fff; box-shadow: 0 0 0 3px rgba(45,185,163,0.1); }

        .user-list { overflow-y: auto; max-height: 460px; scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
        .user-list::-webkit-scrollbar { width: 4px; }
        .user-list::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }

        .user-item { display: flex; align-items: center; gap: 12px; padding: 13px 24px; cursor: pointer; transition: background 0.15s; border-bottom: 1px solid #f8fafc; position: relative; }
        .user-item:last-child { border-bottom: none; }
        .user-item:hover { background: #fafbfc; }
        .user-item.active { background: rgba(45,185,163,0.05); }
        .user-item.active::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: #2db9a3; border-radius: 0 2px 2px 0; }

        .u-avatar { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; font-weight: 800; flex-shrink: 0; }
        .user-info { flex: 1; min-width: 0; }
        .user-name-text { font-size: 13.5px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
        .user-dept { font-size: 12px; color: #94a3b8; font-weight: 400; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .user-role-badge { display: inline-block; font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 20px; white-space: nowrap; flex-shrink: 0; }
        .select-arrow { color: #94a3b8; flex-shrink: 0; transition: color 0.15s; }
        .user-item.active .select-arrow { color: #2db9a3; }

        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 52px 20px; text-align: center; }
        .empty-icon { width: 48px; height: 48px; background: #f1f5f9; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 14px; color: #94a3b8; }
        .empty-title { font-size: 14px; font-weight: 700; color: #475569; margin-bottom: 4px; }
        .empty-sub { font-size: 13px; color: #94a3b8; }

        /* Assign panel */
        .assign-panel { padding: 24px; }

        .selected-user-card { display: flex; align-items: center; gap: 14px; padding: 16px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; margin-bottom: 20px; }
        .selected-avatar { width: 46px; height: 46px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; font-weight: 800; flex-shrink: 0; }
        .selected-name { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 3px; }
        .selected-dept { font-size: 12px; color: #94a3b8; }

        .current-role-section { margin-bottom: 20px; }
        .field-label { font-size: 11.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; display: block; }
        .current-role-chip { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; padding: 6px 14px; border-radius: 20px; }
        .current-role-dot { width: 6px; height: 6px; border-radius: 50%; }

        .field-group { margin-bottom: 18px; }
        .field-select { width: 100%; padding: 10px 14px; border-radius: 10px; border: 1.5px solid #e2e8f0; font-size: 13.5px; color: #1e293b; background: #f8fafc; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500; outline: none; transition: all 0.18s; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 36px; }
        .field-select:focus { border-color: #2db9a3; background: #fff; box-shadow: 0 0 0 3px rgba(45,185,163,0.1); }

        .assign-btn { width: 100%; padding: 11px; border-radius: 10px; border: none; background: #2db9a3; color: #fff; font-size: 13.5px; font-weight: 700; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.18s; box-shadow: 0 2px 10px rgba(45,185,163,0.3); }
        .assign-btn:hover { background: #28a593; box-shadow: 0 4px 16px rgba(45,185,163,0.4); }

        @media (max-width: 900px) { .content-grid { grid-template-columns: 1fr; } }
        @media (max-width: 768px) { .topbar { padding: 0 18px; } .main-content { padding: 18px; } }
      `}</style>

      <div className="asr-root">
        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={handleLogout} />
        <div className="asr-content">
          <div className="topbar">
            <span className="topbar-title">Assign Role</span>
            <div className="topbar-right">
              <button className="notif-btn"><Bell size={17} /><div className="notif-dot" /></button>
              <button onClick={() => router.push('/my-profile')} className="profile-pill" style={{ border: 'none' }}>
                <div className="profile-avatar">SJ</div>
                <span className="profile-name">Sarah Johnson</span>
              </button>
            </div>
          </div>

          <div className="main-content">
            <div className="page-header">
              <div className="eyebrow"><span className="eyebrow-dot" />Role Management</div>
              <h1>Assign Role</h1>
              <p>Assign or change roles for system users</p>
            </div>

            <div className="content-grid">
              {/* User list */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Select User</div>
                  <div className="search-wrap">
                    <Search size={14} className="search-icon-pos" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input className="search-input" type="text" placeholder="Search by name or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  </div>
                </div>
                <div className="user-list">
                  {filteredUsers.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon"><Search size={20} /></div>
                      <p className="empty-title">No users found</p>
                      <p className="empty-sub">Try adjusting your search terms</p>
                    </div>
                  ) : filteredUsers.map((user, i) => (
                    <div key={user.id} className={`user-item ${selectedUser?.id === user.id ? 'active' : ''}`} onClick={() => setSelectedUser(user)}>
                      <div className="u-avatar" style={{ background: avatarGradients[i % avatarGradients.length] }}>{getInitials(user.name)}</div>
                      <div className="user-info">
                        <div className="user-name-text">{user.name}</div>
                        <div className="user-dept">{user.department}</div>
                      </div>
                      <span className="user-role-badge" style={{ background: user.accent + '15', color: user.accent }}>{user.role}</span>
                      <ChevronRight size={14} className="select-arrow" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Assign panel */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Assign New Role</div>
                </div>
                {selectedUser ? (
                  <div className="assign-panel">
                    <div className="selected-user-card">
                      <div className="selected-avatar" style={{ background: avatarGradients[users.findIndex(u => u.id === selectedUser.id) % avatarGradients.length] }}>
                        {getInitials(selectedUser.name)}
                      </div>
                      <div>
                        <div className="selected-name">{selectedUser.name}</div>
                        <div className="selected-dept">{selectedUser.department}</div>
                      </div>
                    </div>

                    <div className="current-role-section">
                      <label className="field-label">Current Role</label>
                      <span className="current-role-chip" style={{ background: selectedUser.accent + '15', color: selectedUser.accent }}>
                        <span className="current-role-dot" style={{ background: selectedUser.accent }} />
                        {selectedUser.role}
                      </span>
                    </div>

                    <div className="field-group">
                      <label className="field-label">New Role</label>
                      <select className="field-select">
                        <option>— Select a role —</option>
                        <option>System Admin</option>
                        <option>Branch Manager</option>
                        <option>Auditor</option>
                        <option>Bank Teller</option>
                      </select>
                    </div>

                    <button className="assign-btn">Assign Role</button>
                  </div>
                ) : (
                  <div className="empty-state" style={{ padding: '60px 20px' }}>
                    <div className="empty-icon"><User size={22} /></div>
                    <p className="empty-title">Select a user</p>
                    <p className="empty-sub">Choose a user from the list to assign a role</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}