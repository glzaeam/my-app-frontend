'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import { Bell, Users, Edit2, Archive, Plus, Shield } from 'lucide-react';

export default function AllRoles() {
  const [activeMenu, setActiveMenu] = useState('all-roles');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [archivingRole, setArchivingRole] = useState<any>(null);
  const [formData, setFormData] = useState({ roleName: '', level: '', description: '' });
  const router = useRouter();

  const roles = [
    {
      id: 1, name: 'System Admin', level: 'Level 1', usersAssigned: 2,
      users: ['SJ', 'AK'],
      modules: ['Dashboard', 'Authentication', 'Roles', 'Permissions', 'Security', 'Audit', 'Users'],
      accent: '#2db9a3', iconBg: 'rgba(45,185,163,0.1)',
    },
    {
      id: 2, name: 'Branch Manager', level: 'Level 2', usersAssigned: 3,
      users: ['MC', 'RP', 'TL'],
      modules: ['Dashboard', 'Authentication', 'Security Monitoring', 'Audit Logs'],
      accent: '#6366f1', iconBg: 'rgba(99,102,241,0.1)',
    },
    {
      id: 3, name: 'Auditor', level: 'Level 3', usersAssigned: 2,
      users: ['ED', 'KW'],
      modules: ['Dashboard', 'Authentication', 'Audit (Read-Only)'],
      accent: '#f59e0b', iconBg: 'rgba(245,158,11,0.1)',
    },
    {
      id: 4, name: 'Bank Teller', level: 'Level 4', usersAssigned: 4,
      users: ['JW', 'LS', 'MB'],
      modules: ['Dashboard', 'Authentication'],
      accent: '#06b6d4', iconBg: 'rgba(6,182,212,0.1)',
    },
  ];

  const handleLogout = () => router.push('/');

  const handleCreateRoleClick = () => setShowModal(true);
  
  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ roleName: '', level: '', description: '' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateRole = () => {
    console.log('Creating role:', formData);
    handleCloseModal();
  };

  const handleEditClick = (role: any) => {
    setEditingRole(role);
    setFormData({ roleName: role.name, level: role.level, description: '' });
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingRole(null);
    setFormData({ roleName: '', level: '', description: '' });
  };

  const handleSaveChanges = () => {
    console.log('Saving changes for role:', editingRole.id, formData);
    handleCloseEditModal();
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArchiveClick = (role: any) => {
    setArchivingRole(role);
    setShowArchiveModal(true);
  };

  const handleCloseArchiveModal = () => {
    setShowArchiveModal(false);
    setArchivingRole(null);
  };

  const handleConfirmArchive = () => {
    console.log('Archiving role:', archivingRole.id);
    handleCloseArchiveModal();
  };

  const avatarGradients = [
    'linear-gradient(135deg,#2db9a3,#6366f1)',
    'linear-gradient(135deg,#f59e0b,#ef4444)',
    'linear-gradient(135deg,#06b6d4,#2db9a3)',
    'linear-gradient(135deg,#8b5cf6,#6366f1)',
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ar-root { display: flex; height: 100vh; background: #ffffff; overflow: hidden; font-family: 'Plus Jakarta Sans', sans-serif; }
        .ar-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

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

        .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 28px; }
        .page-header-left {}
        .eyebrow { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #2db9a3; background: rgba(45,185,163,0.08); padding: 4px 10px; border-radius: 20px; margin-bottom: 10px; }
        .eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: #2db9a3; }
        .page-header h1 { font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 4px; letter-spacing: -0.03em; }
        .page-header p { font-size: 14px; color: #94a3b8; font-weight: 400; }

        .create-btn { display: inline-flex; align-items: center; gap: 7px; padding: 10px 20px; border-radius: 10px; border: none; background: #2db9a3; color: #fff; font-size: 13.5px; font-weight: 700; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.18s; box-shadow: 0 2px 10px rgba(45,185,163,0.3); white-space: nowrap; }
        .create-btn:hover { background: #28a593; box-shadow: 0 4px 16px rgba(45,185,163,0.4); transform: translateY(-1px); }

        .roles-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(460px, 1fr)); gap: 18px; }

        .role-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 18px; padding: 24px; position: relative; overflow: hidden; }
        .role-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--accent); border-radius: 18px 18px 0 0; }

        .role-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
        .role-card-left { display: flex; align-items: center; gap: 14px; }
        .role-icon-wrap { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: var(--icon-bg); color: var(--accent); flex-shrink: 0; }
        .role-name { font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 4px; letter-spacing: -0.02em; }
        .role-level-badge { display: inline-flex; align-items: center; font-size: 11.5px; font-weight: 700; color: var(--accent); background: var(--icon-bg); padding: 2px 9px; border-radius: 20px; }

        .role-actions { display: flex; gap: 6px; }
        .action-btn { width: 32px; height: 32px; border: 1.5px solid #e2e8f0; background: #fff; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #94a3b8; transition: all 0.15s; }
        .action-btn:hover { border-color: #2db9a3; color: #2db9a3; background: #f0fdf9; }
        .action-btn.archive:hover { border-color: #fca5a5; color: #f59e0b; background: #fef3c7; }

        .edit-modal-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 999; align-items: center; justify-content: center; }
        .edit-modal-overlay.active { display: flex; }
        .edit-modal-content { background: #fff; border-radius: 18px; padding: 32px; width: 90%; max-width: 600px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); position: relative; animation: slideUp 0.3s ease; }
        .edit-modal-close { position: absolute; top: 24px; right: 24px; width: 32px; height: 32px; border: none; background: #f1f5f9; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; transition: all 0.15s; }
        .edit-modal-close:hover { background: #e2e8f0; color: #334155; }
        .edit-modal-header { margin-bottom: 28px; }
        .edit-modal-title { font-size: 20px; font-weight: 800; color: #1a2332; margin-bottom: 6px; letter-spacing: -0.02em; }
        .edit-modal-subtitle { font-size: 14px; color: #94a3b8; font-weight: 400; }
        .edit-modal-field { margin-bottom: 20px; }
        .edit-modal-label { display: block; font-size: 13px; font-weight: 700; color: #1a2332; margin-bottom: 8px; }
        .edit-modal-input, .edit-modal-textarea { width: 100%; padding: 11px 14px; font-size: 13px; font-weight: 400; color: #1a2332; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 12px; font-family: 'Plus Jakarta Sans', sans-serif; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
        .edit-modal-input::placeholder, .edit-modal-textarea::placeholder { color: #cbd5e1; }
        .edit-modal-input:focus, .edit-modal-textarea:focus { border-color: #2db9a3; box-shadow: 0 0 0 3px rgba(45,185,163,0.1); }
        .edit-modal-textarea { resize: vertical; min-height: 100px; font-family: 'Plus Jakarta Sans', sans-serif; }
        .edit-modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px; }
        .edit-modal-btn-cancel { padding: 11px 28px; border-radius: 10px; border: 1.5px solid #e2e8f0; background: #fff; color: #64748b; cursor: pointer; font-size: 13.5px; font-weight: 600; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.18s; }
        .edit-modal-btn-cancel:hover { border-color: #cbd5e1; background: #f8fafc; }
        .edit-modal-btn-save { padding: 11px 28px; border-radius: 10px; border: none; background: #2db9a3; color: #fff; cursor: pointer; font-size: 13.5px; font-weight: 700; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.18s; box-shadow: 0 2px 10px rgba(45,185,163,0.3); }
        .edit-modal-btn-save:hover { background: #28a593; box-shadow: 0 4px 16px rgba(45,185,163,0.4); transform: translateY(-1px); }

        .archive-confirm-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 999; align-items: center; justify-content: center; }
        .archive-confirm-overlay.active { display: flex; }
        .archive-confirm-content { background: #fff; border-radius: 18px; padding: 32px; width: 90%; max-width: 520px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); position: relative; animation: slideUp 0.3s ease; text-align: center; }
        .archive-confirm-title { font-size: 20px; font-weight: 800; color: #1a2332; margin-bottom: 16px; letter-spacing: -0.02em; }
        .archive-confirm-text { font-size: 14px; color: #64748b; margin-bottom: 32px; line-height: 1.6; }
        .archive-confirm-footer { display: flex; justify-content: center; gap: 12px; }
        .archive-confirm-btn-cancel { padding: 11px 28px; border-radius: 10px; border: 1.5px solid #e2e8f0; background: #fff; color: #64748b; cursor: pointer; font-size: 13.5px; font-weight: 600; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.18s; }
        .archive-confirm-btn-cancel:hover { border-color: #cbd5e1; background: #f8fafc; }
        .archive-confirm-btn-archive { padding: 11px 28px; border-radius: 10px; border: none; background: #ef4444; color: #fff; cursor: pointer; font-size: 13.5px; font-weight: 700; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.18s; box-shadow: 0 2px 10px rgba(239,68,68,0.3); }
        .archive-confirm-btn-archive:hover { background: #dc2626; box-shadow: 0 4px 16px rgba(239,68,68,0.4); transform: translateY(-1px); }

        .divider { height: 1px; background: #f1f5f9; margin: 16px 0; }

        .users-label { display: flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 10px; }
        .user-avatars { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .u-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; font-weight: 800; border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.12); }
        .user-count-badge { font-size: 12px; font-weight: 600; color: #94a3b8; margin-left: 4px; }

        .modules-label { font-size: 11.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 10px; display: block; }
        .module-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .module-tag { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 6px; background: var(--icon-bg); color: var(--accent); border: 1px solid var(--accent-border); white-space: nowrap; }

        /* Modal */
        .modal-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 999; align-items: center; justify-content: center; }
        .modal-overlay.active { display: flex; }
        .modal-content { background: #fff; border-radius: 18px; padding: 32px; width: 90%; max-width: 600px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); position: relative; animation: slideUp 0.3s ease; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .modal-close { position: absolute; top: 24px; right: 24px; width: 32px; height: 32px; border: none; background: #f1f5f9; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; transition: all 0.15s; }
        .modal-close:hover { background: #e2e8f0; color: #334155; }
        .modal-header { margin-bottom: 28px; }
        .modal-title { font-size: 20px; font-weight: 800; color: #1a2332; margin-bottom: 6px; letter-spacing: -0.02em; }
        .modal-subtitle { font-size: 14px; color: #94a3b8; font-weight: 400; }
        .modal-field { margin-bottom: 20px; }
        .modal-label { display: block; font-size: 13px; font-weight: 700; color: #1a2332; margin-bottom: 8px; }
        .modal-input, .modal-textarea { width: 100%; padding: 11px 14px; font-size: 13px; font-weight: 400; color: #1a2332; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 12px; font-family: 'Plus Jakarta Sans', sans-serif; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
        .modal-input::placeholder, .modal-textarea::placeholder { color: #cbd5e1; }
        .modal-input:focus, .modal-textarea:focus { border-color: #2db9a3; box-shadow: 0 0 0 3px rgba(45,185,163,0.1); }
        .modal-textarea { resize: vertical; min-height: 100px; font-family: 'Plus Jakarta Sans', sans-serif; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px; }
        .modal-btn-cancel { padding: 11px 28px; border-radius: 10px; border: 1.5px solid #e2e8f0; background: #fff; color: #64748b; cursor: pointer; font-size: 13.5px; font-weight: 600; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.18s; }
        .modal-btn-cancel:hover { border-color: #cbd5e1; background: #f8fafc; }
        .modal-btn-create { padding: 11px 28px; border-radius: 10px; border: none; background: #2db9a3; color: #fff; cursor: pointer; font-size: 13.5px; font-weight: 700; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.18s; box-shadow: 0 2px 10px rgba(45,185,163,0.3); }
        .modal-btn-create:hover { background: #28a593; box-shadow: 0 4px 16px rgba(45,185,163,0.4); transform: translateY(-1px); }

        @media (max-width: 768px) { .topbar { padding: 0 18px; } .main-content { padding: 18px; } .roles-grid { grid-template-columns: 1fr; } .page-header { flex-direction: column; align-items: flex-start; gap: 14px; } .modal-content { width: 95%; padding: 24px; } }
      `}</style>

      <div className="ar-root">
        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={handleLogout} />
        <div className="ar-content">
          <div className="topbar">
            <span className="topbar-title">Role Management</span>
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
              <div className="page-header-left">
                <div className="eyebrow"><span className="eyebrow-dot" />Role Management</div>
                <h1>All Roles</h1>
                <p>Manage system roles, permissions, and access levels</p>
              </div>
              <button className="create-btn" onClick={handleCreateRoleClick}><Plus size={15} /> Create New Role</button>
            </div>

            <div className="roles-grid">
              {roles.map((role, ri) => (
                <div key={role.id} className="role-card" style={{ '--accent': role.accent, '--icon-bg': role.iconBg, '--accent-border': role.accent + '30' } as React.CSSProperties}>
                  <div className="role-card-header">
                    <div className="role-card-left">
                      <div className="role-icon-wrap"><Shield size={20} /></div>
                      <div>
                        <div className="role-name">{role.name}</div>
                        <span className="role-level-badge">{role.level}</span>
                      </div>
                    </div>
                    <div className="role-actions">
                      <button className="action-btn" onClick={() => handleEditClick(role)}><Edit2 size={14} /></button>
                      <button className="action-btn archive" onClick={() => handleArchiveClick(role)}><Archive size={14} /></button>
                    </div>
                  </div>

                  <div className="divider" />

                  <div style={{ marginBottom: 16 }}>
                    <div className="users-label"><Users size={13} />{role.usersAssigned} users assigned</div>
                    <div className="user-avatars">
                      {role.users.map((u, i) => (
                        <div key={i} className="u-avatar" style={{ background: avatarGradients[i % avatarGradients.length] }}>{u}</div>
                      ))}
                      <span className="user-count-badge">+{role.usersAssigned} total</span>
                    </div>
                  </div>

                  <div>
                    <span className="modules-label">Permissions</span>
                    <div className="module-tags">
                      {role.modules.map((m, i) => (
                        <span key={i} className="module-tag">{m}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Role Modal */}
      <div className={`modal-overlay ${showModal ? 'active' : ''}`} onClick={handleCloseModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={handleCloseModal}>✕</button>
          
          <div className="modal-header">
            <div className="modal-title">Create New Role</div>
            <div className="modal-subtitle">Define a new role for the system</div>
          </div>

          <div className="modal-field">
            <label className="modal-label">Role Name</label>
            <input
              type="text"
              name="roleName"
              className="modal-input"
              placeholder="e.g. Compliance Officer"
              value={formData.roleName}
              onChange={handleInputChange}
            />
          </div>

          <div className="modal-field">
            <label className="modal-label">Level</label>
            <input
              type="text"
              name="level"
              className="modal-input"
              placeholder="e.g. Level 3"
              value={formData.level}
              onChange={handleInputChange}
            />
          </div>

          <div className="modal-field">
            <label className="modal-label">Description</label>
            <textarea
              name="description"
              className="modal-textarea"
              placeholder="Role description..."
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>

          <div className="modal-footer">
            <button className="modal-btn-cancel" onClick={handleCloseModal}>Cancel</button>
            <button className="modal-btn-create" onClick={handleCreateRole}>Create Role</button>
          </div>
        </div>
      </div>

      {/* Edit Role Modal */}
      <div className={`edit-modal-overlay ${showEditModal ? 'active' : ''}`} onClick={handleCloseEditModal}>
        <div className="edit-modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="edit-modal-close" onClick={handleCloseEditModal}>✕</button>
          
          <div className="edit-modal-header">
            <div className="edit-modal-title">Edit Role</div>
            <div className="edit-modal-subtitle">Update role details</div>
          </div>

          <div className="edit-modal-field">
            <label className="edit-modal-label">Role Name</label>
            <input
              type="text"
              name="roleName"
              className="edit-modal-input"
              value={formData.roleName}
              onChange={handleEditInputChange}
            />
          </div>

          <div className="edit-modal-field">
            <label className="edit-modal-label">Description</label>
            <textarea
              name="description"
              className="edit-modal-textarea"
              placeholder="Role description..."
              value={formData.description}
              onChange={handleEditInputChange}
            />
          </div>

          <div className="edit-modal-footer">
            <button className="edit-modal-btn-cancel" onClick={handleCloseEditModal}>Cancel</button>
            <button className="edit-modal-btn-save" onClick={handleSaveChanges}>Save Changes</button>
          </div>
        </div>
      </div>

      {/* Archive Role Confirmation Modal */}
      <div className={`archive-confirm-overlay ${showArchiveModal ? 'active' : ''}`} onClick={handleCloseArchiveModal}>
        <div className="archive-confirm-content" onClick={(e) => e.stopPropagation()}>
          <div className="archive-confirm-title">Archive Role</div>
          <div className="archive-confirm-text">
            Are you sure you want to archive the "{archivingRole?.name}" role? This action cannot be undone and will affect all users assigned to this role.
          </div>
          <div className="archive-confirm-footer">
            <button className="archive-confirm-btn-cancel" onClick={handleCloseArchiveModal}>Cancel</button>
            <button className="archive-confirm-btn-archive" onClick={handleConfirmArchive}>Archive Role</button>
          </div>
        </div>
      </div>
    </>
  );
}