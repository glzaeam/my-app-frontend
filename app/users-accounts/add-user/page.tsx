'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import { Bell, User, UserPlus, Info } from 'lucide-react';

export default function AddUser() {
  const [formData, setFormData] = useState({
    fullName: '',
    employeeId: '',
    email: '',
    department: '',
    branch: '',
    role: '',
    password: '',
    confirmPassword: '',
  });

  const [activeMenu, setActiveMenu] = useState('add-user');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();

  const departments = ['IT Security', 'Operations', 'Compliance', 'Customer Service', 'Finance', 'HR'];
  const branches = ['Headquarters', 'Downtown Branch', 'Main St Branch', 'East Branch', 'West Branch'];
  const roles = ['Bank Teller', 'Branch Manager', 'Auditor', 'System Admin'];

  const handleLogout = () => {
    router.push('/');
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <style>{`
        .dashboard-container {
          display: flex;
          height: 100vh;
          background: #f8fafc;
          overflow: hidden;
        }

        .dashboard-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .topbar {
          height: 64px;
          background: #ffffff;
          border-bottom: 1px solid #e8ecf1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          flex-shrink: 0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .notification-btn {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          border: 1px solid #e8ecf1;
          background: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7c93;
          transition: all 0.2s;
          position: relative;
        }

        .notification-btn:hover {
          background: #f5f7fa;
          color: #2db9a3;
        }

        .notification-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #ff4757;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
        }

        .profile-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid #e8ecf1;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          color: #1a2332;
          font-weight: 500;
          font-size: 14px;
        }

        .profile-btn:hover {
          background: #f5f7fa;
        }

        .main-content {
          flex: 1;
          overflow-y: auto;
          padding: 32px;
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .page-header {
          margin-bottom: 24px;
        }

        .page-header h1 {
          font-size: 24px;
          font-weight: 600;
          color: #1a2332;
          margin: 0;
        }

        .page-header p {
          font-size: 13px;
          color: #8a9ab0;
          margin: 4px 0 0 0;
        }

        .form-card {
          background: #ffffff;
          border: 1px solid #e8ecf1;
          border-radius: 8px;
          padding: 24px;
          max-width: 800px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          margin: 0 auto;
        }

        .form-section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .form-section-header h2 {
          font-size: 16px;
          font-weight: 600;
          color: #1a2332;
          margin: 0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-label {
          font-size: 13px;
          font-weight: 500;
          color: #1a2332;
          margin-bottom: 8px;
        }

        .form-input,
        .form-select {
          padding: 10px 12px;
          border: 1px solid #e8ecf1;
          border-radius: 6px;
          background: #ffffff;
          color: #1a2332;
          font-size: 13px;
          transition: all 0.2s;
          font-family: inherit;
        }

        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: #2db9a3;
          box-shadow: 0 0 0 3px rgba(45, 185, 163, 0.1);
        }

        .form-input::placeholder {
          color: #8a9ab0;
        }

        .info-box {
          background: #f0f8f6;
          border: 1px solid #c8e6e0;
          border-radius: 6px;
          padding: 12px;
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }

        .info-box-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .info-box-title {
          font-size: 12px;
          font-weight: 500;
          color: #1a2332;
        }

        .info-box-text {
          font-size: 12px;
          color: #8a9ab0;
          line-height: 1.4;
        }

        .button-group {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }

        .btn {
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-cancel {
          background: #ffffff;
          color: #8a9ab0;
          border: 1px solid #e8ecf1;
        }

        .btn-cancel:hover {
          background: #f8fafc;
          border-color: #d0dce6;
        }

        .btn-create {
          background: #2db9a3;
          color: white;
        }

        .btn-create:hover {
          opacity: 0.9;
        }

        @media (max-width: 768px) {
          .main-content {
            padding: 16px;
          }

          .form-card {
            padding: 16px;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .button-group {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }
        }
      `}</style>

      <div className="dashboard-container">
        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={handleLogout} />

        <div className="dashboard-content">
          <div className="topbar">
            <h1 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1a2332' }}>Users & Accounts</h1>
            <div className="topbar-right">
              <button className="notification-btn">
                <Bell size={20} />
                <span className="notification-badge">3</span>
              </button>
              <button className="profile-btn" onClick={() => router.push('/my-profile')}>
                <User size={24} style={{ color: '#2db9a3' }} />
                Sarah Johnson
              </button>
            </div>
          </div>

          <div className="main-content">
            <div className="animate-fade-in">
              <div className="page-header">
                <h1>Add User</h1>
                <p>Create a new user account in the system</p>
              </div>

              <div className="form-card">
                <div className="form-section-header">
                  <UserPlus size={20} style={{ color: '#2db9a3' }} />
                  <h2>New User Details</h2>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input type="text" value={formData.fullName} onChange={(e) => updateField('fullName', e.target.value)} placeholder="Enter full name" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Employee ID</label>
                    <input type="text" value={formData.employeeId} onChange={(e) => updateField('employeeId', e.target.value)} placeholder="e.g., TEL005" className="form-input" />
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Email Address</label>
                    <input type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} placeholder="employee@bank.com" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select value={formData.department} onChange={(e) => updateField('department', e.target.value)} className="form-select">
                      <option value="">Select department</option>
                      {departments.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assigned Branch</label>
                    <select value={formData.branch} onChange={(e) => updateField('branch', e.target.value)} className="form-select">
                      <option value="">Select branch</option>
                      {branches.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Role</label>
                    <select value={formData.role} onChange={(e) => updateField('role', e.target.value)} className="form-select">
                      <option value="">Select role</option>
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Temporary Password</label>
                    <input type="password" value={formData.password} onChange={(e) => updateField('password', e.target.value)} placeholder="Min 12 characters" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm Password</label>
                    <input type="password" value={formData.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} placeholder="Re-enter password" className="form-input" />
                  </div>
                </div>

                <div className="info-box">
                  <Info size={18} style={{ color: '#2db9a3', flexShrink: 0, marginTop: '2px' }} />
                  <div className="info-box-content">
                    <p className="info-box-title">Account Activation</p>
                    <p className="info-box-text">The user will receive an email with login instructions. They will be required to change their temporary password on first login.</p>
                  </div>
                </div>

                <div className="button-group">
                  <button className="btn btn-cancel" onClick={() => router.push('/users-and-accounts/user-accounts')}>
                    Cancel
                  </button>
                  <button className="btn btn-create">Create User</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
