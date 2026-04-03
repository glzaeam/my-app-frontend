'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import { Bell, User, Search, UserX, AlertTriangle, Shield } from 'lucide-react';

const activeUsers = [
  { id: 'ADM001', name: 'Sarah Johnson', role: 'System Admin', department: 'IT Security', branch: 'Headquarters', lastLogin: '2 min ago', status: 'active' },
  { id: 'MGR001', name: 'Michael Chen', role: 'Branch Manager', department: 'Operations', branch: 'Downtown Branch', lastLogin: '5 min ago', status: 'active' },
  { id: 'AUD001', name: 'Emily Davis', role: 'Auditor', department: 'Compliance', branch: 'Headquarters', lastLogin: '15 min ago', status: 'active' },
  { id: 'TEL001', name: 'James Wilson', role: 'Bank Teller', department: 'Customer Service', branch: 'Main St Branch', lastLogin: '1 min ago', status: 'active' },
  { id: 'TEL002', name: 'Lisa Stone', role: 'Bank Teller', department: 'Customer Service', branch: 'East Branch', lastLogin: '30 min ago', status: 'active' },
  { id: 'EMP042', name: 'Robert Lee', role: 'Bank Teller', department: 'Customer Service', branch: 'East Branch', lastLogin: '3 hours ago', status: 'locked' },
];

const deactivatedUsers = [
  { id: 'EMP029', name: 'David Park', role: 'Bank Teller', deactivatedOn: '2024-01-10', reason: 'Terminated — policy violation', deactivatedBy: 'Sarah Johnson' },
  { id: 'EMP015', name: 'Tom Harris', role: 'Bank Teller', deactivatedOn: '2023-12-20', reason: 'Resigned', deactivatedBy: 'Sarah Johnson' },
];

export default function DeactivateUser() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [activeMenu, setActiveMenu] = useState('deactivate-user');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();

  const handleLogout = () => {
    router.push('/');
  };

  const filtered = activeUsers.filter((u) => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.id.toLowerCase().includes(searchTerm.toLowerCase()));

  const selectedUserData = activeUsers.find((u) => u.id === selectedUser);

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

        .grid-layout {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .card {
          background: #ffffff;
          border: 1px solid #e8ecf1;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .card-header h2 {
          font-size: 16px;
          font-weight: 600;
          color: #1a2332;
          margin: 0;
        }

        .user-list {
          space-y: 8px;
        }

        .search-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e8ecf1;
          border-radius: 6px;
          background: #ffffff;
          color: #1a2332;
          font-size: 13px;
          margin-bottom: 12px;
          transition: all 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: #2db9a3;
          box-shadow: 0 0 0 3px rgba(45, 185, 163, 0.1);
        }

        .user-list-container {
          max-height: 350px;
          overflow-y: auto;
        }

        .user-item {
          padding: 12px;
          border: 1px solid #e8ecf1;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 8px;
        }

        .user-item:hover {
          background: #f8fafc;
          border-color: #d0dce6;
        }

        .user-item.selected {
          border-color: #ff4757;
          background: rgba(255, 71, 87, 0.05);
        }

        .user-item-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .user-item-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #2db9a3;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .user-item-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .user-item-name {
          font-size: 13px;
          font-weight: 500;
          color: #1a2332;
        }

        .user-item-meta {
          font-size: 12px;
          color: #8a9ab0;
        }

        .status-badge {
          font-size: 10px;
          padding: 3px 8px;
          border-radius: 3px;
          font-weight: 500;
        }

        .status-active {
          background: #d4edda;
          color: #155724;
        }

        .status-locked {
          background: #f8d7da;
          color: #721c24;
        }

        .form-group {
          margin-bottom: 12px;
        }

        .form-label {
          font-size: 13px;
          font-weight: 500;
          color: #1a2332;
          margin-bottom: 6px;
          display: block;
        }

        .form-input,
        .form-select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e8ecf1;
          border-radius: 6px;
          background: #ffffff;
          color: #1a2332;
          font-size: 13px;
          transition: all 0.2s;
          font-family: inherit;
        }

        .form-select {
          cursor: pointer;
        }

        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: #2db9a3;
          box-shadow: 0 0 0 3px rgba(45, 185, 163, 0.1);
        }

        .form-textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e8ecf1;
          border-radius: 6px;
          background: #ffffff;
          color: #1a2332;
          font-size: 13px;
          min-height: 80px;
          resize: none;
          font-family: inherit;
          transition: all 0.2s;
        }

        .form-textarea:focus {
          outline: none;
          border-color: #2db9a3;
          box-shadow: 0 0 0 3px rgba(45, 185, 163, 0.1);
        }

        .selected-user-box {
          background: rgba(255, 71, 87, 0.05);
          border: 1px solid #ff4757;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 12px;
        }

        .selected-user-label {
          font-size: 11px;
          color: #8a9ab0;
          text-transform: uppercase;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .selected-user-name {
          font-size: 13px;
          font-weight: 500;
          color: #1a2332;
          margin-bottom: 4px;
        }

        .selected-user-meta {
          font-size: 12px;
          color: #8a9ab0;
        }

        .empty-state {
          text-align: center;
          padding: 32px 20px;
        }

        .empty-state-icon {
          color: #8a9ab0;
          width: 32px;
          height: 32px;
          margin: 0 auto 12px;
        }

        .empty-state-text {
          font-size: 13px;
          color: #8a9ab0;
        }

        .warning-box {
          background: rgba(255, 71, 87, 0.05);
          border: 1px solid #ff4757;
          border-radius: 6px;
          padding: 12px;
          display: flex;
          gap: 10px;
          margin-bottom: 12px;
        }

        .warning-icon {
          color: #ff4757;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .warning-text {
          font-size: 12px;
          color: #8a9ab0;
        }

        .btn {
          width: 100%;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-deactivate {
          background: #ff4757;
          color: white;
        }

        .btn-deactivate:hover {
          opacity: 0.9;
        }

        .deactivated-section {
          margin-top: 32px;
        }

        .deactivated-section h2 {
          font-size: 16px;
          font-weight: 600;
          color: #1a2332;
          margin-bottom: 16px;
        }

        .table-container {
          background: #ffffff;
          border: 1px solid #e8ecf1;
          border-radius: 8px;
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        thead {
          background: #f8fafc;
        }

        th {
          text-align: center;
          padding: 12px 20px;
          font-size: 12px;
          font-weight: 500;
          color: #8a9ab0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #e8ecf1;
        }

        td {
          padding: 12px 20px;
          border-bottom: 1px solid #e8ecf1;
          font-size: 13px;
          color: #1a2332;
          text-align: center;
        }

        tbody tr:nth-child(even) {
          background: #fafbfc;
        }

        tbody tr:hover {
          background: #f5f7fa;
        }

        .employee-id {
          font-family: 'Courier New', monospace;
          color: #1a2332;
          font-size: 13px;
        }

        .deactivated-date {
          font-family: 'Courier New', monospace;
          color: #8a9ab0;
          font-size: 12px;
        }

        @media (max-width: 768px) {
          .main-content {
            padding: 16px;
          }

          .grid-layout {
            grid-template-columns: 1fr;
          }

          .card {
            padding: 16px;
          }

          .user-list-container {
            max-height: none;
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
                <h1>Deactivate User</h1>
                <p>Deactivate user accounts and revoke system access</p>
              </div>

              <div className="grid-layout">
                <div className="card">
                  <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1a2332', marginBottom: '12px' }}>Active Users</h2>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#8a9ab0' }} />
                    <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name or ID..." className="search-input" style={{ paddingLeft: '36px' }} />
                  </div>
                  <div className="user-list-container">
                    {filtered.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => setSelectedUser(u.id)}
                        className={`user-item ${selectedUser === u.id ? 'selected' : ''}`}
                      >
                        <div className="user-item-inner">
                          <div className="user-item-left">
                            <div className="avatar">{u.name.split(' ').map((n) => n[0]).join('')}</div>
                            <div className="user-item-info">
                              <p className="user-item-name">{u.name}</p>
                              <p className="user-item-meta">
                                {u.id} · {u.role} · {u.branch}
                              </p>
                            </div>
                          </div>
                          <span className={`status-badge status-${u.status}`}>{u.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <UserX size={20} style={{ color: '#ff4757' }} />
                    <h2>Deactivate Account</h2>
                  </div>
                  {selectedUserData ? (
                    <div>
                      <div className="selected-user-box">
                        <p className="selected-user-label">Selected User</p>
                        <p className="selected-user-name">{selectedUserData.name}</p>
                        <p className="selected-user-meta">
                          {selectedUserData.id} · {selectedUserData.role}
                        </p>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Reason for Deactivation</label>
                        <select value={reason} onChange={(e) => setReason(e.target.value)} className="form-select">
                          <option value="">Select reason...</option>
                          <option value="terminated">Terminated</option>
                          <option value="resigned">Resigned</option>
                          <option value="policy_violation">Policy Violation</option>
                          <option value="security_concern">Security Concern</option>
                          <option value="role_change">Role Change</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Additional Notes</label>
                        <textarea className="form-textarea" placeholder="Enter details..." />
                      </div>
                      <div className="warning-box">
                        <AlertTriangle size={16} className="warning-icon" />
                        <p className="warning-text">This will immediately revoke all access, terminate active sessions, and log the action in the audit trail.</p>
                      </div>
                      <button className="btn btn-deactivate">Deactivate Account</button>
                    </div>
                  ) : (
                    <div className="empty-state">
                      <Shield size={32} className="empty-state-icon" />
                      <p className="empty-state-text">Select a user to deactivate</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="deactivated-section">
                <h2>Previously Deactivated</h2>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        {['Employee ID', 'Name', 'Former Role', 'Deactivated On', 'Reason', 'Deactivated By'].map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {deactivatedUsers.map((u) => (
                        <tr key={u.id}>
                          <td className="employee-id">{u.id}</td>
                          <td style={{ fontWeight: '500' }}>{u.name}</td>
                          <td style={{ color: '#8a9ab0' }}>{u.role}</td>
                          <td className="deactivated-date">{u.deactivatedOn}</td>
                          <td style={{ color: '#8a9ab0' }}>{u.reason}</td>
                          <td style={{ color: '#8a9ab0' }}>{u.deactivatedBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
