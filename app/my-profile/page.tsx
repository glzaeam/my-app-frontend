'use client';

import { useState } from 'react';
import Sidebar from '@/app/components/Sidebar';
import { Shield, Mail, Building, MapPin, KeyRound, Edit3, Bell, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

const MyProfile = () => {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState('my-profile');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  // Mock user data
  const user = {
    name: 'Sarah Johnson',
    employeeId: 'ADM001',
    email: 'sarah.johnson@bank.com',
    department: 'IT Security',
    branch: 'Headquarters',
    role: 'System Admin',
    mfaEnabled: true,
  };

  const [editForm, setEditForm] = useState({
    name: user.name,
    email: user.email,
    department: user.department,
    branch: user.branch,
  });

  const fields = [
    { label: 'Full Name', value: user.name, icon: Shield },
    { label: 'Employee ID', value: user.employeeId, icon: KeyRound },
    { label: 'Email', value: user.email, icon: Mail },
    { label: 'Department', value: user.department, icon: Building },
    { label: 'Branch', value: user.branch, icon: MapPin },
  ];

  const openEdit = () => {
    setEditForm({
      name: user.name,
      email: user.email,
      department: user.department,
      branch: user.branch,
    });
    setEditOpen(true);
  };

  const handleSave = () => {
    setEditOpen(false);
  };

  return (
    <>
      <style>{`
        .profile-root {
          display: flex;
          height: 100vh;
          background: #ffffff;
          overflow: hidden;
          font-family: 'Open Sans', sans-serif;
        }

        .profile-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .topbar {
          height: 66px;
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          flex-shrink: 0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .topbar-title {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.01em;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .notif-btn {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          transition: all 0.18s;
          position: relative;
        }

        .notif-btn:hover {
          border-color: #2db9a3;
          color: #2db9a3;
          background: #f0fdf9;
        }

        .notif-dot {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 7px;
          height: 7px;
          background: #ef4444;
          border-radius: 50%;
          border: 1.5px solid #fff;
        }

        .profile-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 40px;
          padding: 5px 14px 5px 5px;
          cursor: pointer;
          transition: all 0.18s;
        }

        .profile-pill:hover {
          border-color: #2db9a3;
          background: #f0fdf9;
        }

        .profile-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2db9a3, #6366f1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 11px;
          font-weight: 800;
        }

        .profile-name {
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
        }

        .main-content {
          flex: 1;
          overflow-y: auto;
          padding: 32px 36px;
          scrollbar-width: thin;
          scrollbar-color: #e2e8f0 transparent;
        }

        .main-content::-webkit-scrollbar {
          width: 6px;
        }

        .main-content::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 3px;
        }

        .page-header {
          margin-bottom: 28px;
        }

        .page-header h1 {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 4px 0;
          letter-spacing: -0.03em;
        }

        .page-header p {
          font-size: 14px;
          color: #94a3b8;
          margin: 0;
        }

        .section-card {
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid #f1f5f9;
        }

        .avatar-large {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          background: linear-gradient(135deg, #2db9a3, #6366f1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 24px;
          font-weight: 800;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(45, 185, 163, 0.2);
        }

        .user-header-info h2 {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 6px 0;
        }

        .status-badge {
          display: inline-block;
          background: #d1fae5;
          color: #065f46;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .fields-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }

        .field-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 12px;
          transition: all 0.18s;
        }

        .field-item:hover {
          background: #f8fafc;
        }

        .field-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #f0f9f7;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2db9a3;
          flex-shrink: 0;
        }

        .field-content {
          flex: 1;
        }

        .field-label {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 2px;
        }

        .field-value {
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
        }

        .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 24px;
          border-top: 1px solid #f1f5f9;
        }

        .mfa-section {
          flex: 1;
        }

        .mfa-label {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 4px;
        }

        .mfa-status {
          display: inline-block;
          background: #d1fae5;
          color: #065f46;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .edit-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #2db9a3;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s;
        }

        .edit-btn:hover {
          background: #24a193;
          box-shadow: 0 4px 12px rgba(45, 185, 163, 0.3);
        }

        .modal-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 50;
          align-items: center;
          justify-content: center;
          padding-left: 300px;
        }

        .modal-overlay.open {
          display: flex;
        }

        .modal-content {
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
          max-width: 500px;
          width: 90%;
          padding: 28px;
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header h3 {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px 0;
        }

        .modal-header p {
          font-size: 13px;
          color: #94a3b8;
          margin: 0;
        }

        .modal-body {
          margin: 20px 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-label {
          font-size: 12px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .form-input {
          padding: 10px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 13px;
          font-family: 'Open Sans', sans-serif;
          color: #0f172a;
          transition: all 0.18s;
        }

        .form-input:focus {
          outline: none;
          border-color: #2db9a3;
          box-shadow: 0 0 0 3px rgba(45, 185, 163, 0.1);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .modal-footer {
          display: flex;
          gap: 12px;
          margin-top: 24px;
          justify-content: flex-end;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s;
          font-family: 'Open Sans', sans-serif;
        }

        .btn-cancel {
          background: #f1f5f9;
          color: #64748b;
          border: 1.5px solid #e2e8f0;
        }

        .btn-cancel:hover {
          background: #e2e8f0;
        }

        .btn-save {
          background: #2db9a3;
          color: #fff;
        }

        .btn-save:hover {
          background: #24a193;
          box-shadow: 0 4px 12px rgba(45, 185, 163, 0.3);
        }

        @media (max-width: 768px) {
          .main-content {
            padding: 16px;
          }

          .page-header h1 {
            font-size: 20px;
          }

          .card-footer {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }

          .edit-btn {
            width: 100%;
            justify-content: center;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .modal-content {
            width: 95%;
            padding: 20px;
          }
        }
      `}</style>

      <div className="profile-root">
        <Sidebar
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onLogout={() => router.push('/')}
        />

        <div className="profile-content">
          <div className="topbar">
            <span className="topbar-title">My Profile</span>
            <div className="topbar-right">
              <button className="notif-btn">
                <Bell size={17} />
                <div className="notif-dot" />
              </button>
              <button className="profile-pill">
                <div className="profile-avatar">SJ</div>
                <span className="profile-name">Sarah Johnson</span>
              </button>
            </div>
          </div>

          <div className="main-content">
            <div className="page-header">
              <h1>My Profile</h1>
              <p>Your account information</p>
            </div>

            <div className="section-card">
              <div className="card-header">
                <div className="avatar-large">{user.name.split(' ').map((n) => n[0]).join('')}</div>
                <div className="user-header-info">
                  <h2>{user.name}</h2>
                  <span className="status-badge">{user.role}</span>
                </div>
              </div>

              <div className="fields-list">
                {fields.map((field) => {
                  const IconComponent = field.icon;
                  return (
                    <div key={field.label} className="field-item">
                      <div className="field-icon">
                        <IconComponent size={18} />
                      </div>
                      <div className="field-content">
                        <div className="field-label">{field.label}</div>
                        <div className="field-value">{field.value}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="card-footer">
                <div className="mfa-section">
                  <div className="mfa-label">MFA Status</div>
                  <span className="mfa-status">{user.mfaEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                <button className="edit-btn" onClick={openEdit}>
                  <Edit3 size={16} />
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`modal-overlay ${editOpen ? 'open' : ''}`} onClick={() => setEditOpen(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Edit Profile</h3>
            <p>Update your profile information</p>
          </div>

          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Department</label>
                <input
                  type="text"
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Branch</label>
                <input
                  type="text"
                  value={editForm.branch}
                  onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-cancel" onClick={() => setEditOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-save" onClick={handleSave}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MyProfile;
