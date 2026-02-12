import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import './AdminDashboard.css';

function AdminDashboard() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'family'
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Pending organizations state
  const [pendingOrganizations, setPendingOrganizations] = useState([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const [reviewingOrg, setReviewingOrg] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewDecision, setReviewDecision] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const navigate = useNavigate();

  // Handle session expiration
  const handleSessionExpired = useCallback(() => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  }, [navigate]);

  // Refresh access token
  const refreshAccessToken = useCallback(async () => {
    const refreshToken = localStorage.getItem('adminRefreshToken');
    if (!refreshToken) {
      handleSessionExpired();
      return null;
    }

    try {
      const response = await fetch('http://localhost:3000/api/v1/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('adminToken', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('adminRefreshToken', data.refreshToken);
        }
        return data.accessToken;
      } else {
        handleSessionExpired();
        return null;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      handleSessionExpired();
      return null;
    }
  }, [handleSessionExpired]);

  const fetchUsers = useCallback(async (token) => {
    setLoading(true);
    try {
      let authToken = token || localStorage.getItem('adminToken');
      let response = await fetch('http://localhost:3000/api/v1/users', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // If 401, try to refresh token and retry
      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (!newToken) {
          handleSessionExpired();
          return;
        }
        
        authToken = newToken;
        response = await fetch('http://localhost:3000/api/v1/users', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (response.status === 401) {
          handleSessionExpired();
          return;
        }
      }

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to fetch users');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  }, [handleSessionExpired, refreshAccessToken]);

  // Fetch pending organizations
  const fetchPendingOrganizations = useCallback(async (token) => {
    setLoadingOrganizations(true);
    try {
      let authToken = token || localStorage.getItem('adminToken');
      let response = await fetch('http://localhost:3000/api/v1/organization/admin/pending-requests', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // If 401, try to refresh token and retry
      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (!newToken) {
          handleSessionExpired();
          return;
        }
        
        authToken = newToken;
        response = await fetch('http://localhost:3000/api/v1/organization/admin/pending-requests', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (response.status === 401) {
          handleSessionExpired();
          return;
        }
      }

      if (response.ok) {
        const data = await response.json();
        setPendingOrganizations(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch pending organizations:', err);
      setError('Failed to fetch pending organizations');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoadingOrganizations(false);
    }
  }, [handleSessionExpired, refreshAccessToken]);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('adminToken');
    const userData = localStorage.getItem('adminUser');

    if (!token || !userData) {
      navigate('/admin/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'admin') {
        navigate('/admin/login');
        return;
      }
      setUser(parsedUser);
      fetchUsers(token);
      fetchPendingOrganizations(token);
    } catch {
      navigate('/admin/login');
    }
  }, [navigate, fetchUsers, fetchPendingOrganizations]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const handleRefresh = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    
    setLoading(true);
    setLoadingOrganizations(true);
    try {
      await Promise.all([
        fetchUsers(token),
        fetchPendingOrganizations(token)
      ]);
      setSuccessMessage('Data refreshed successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to refresh data:', error);
      setError('Failed to refresh data');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
      setLoadingOrganizations(false);
    }
  };

  // Refresh pending organizations
  const refreshOrganizations = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    
    await fetchPendingOrganizations(token);
  };

  // Handle organization review
  const handleSubmitReview = async () => {
    if (!reviewingOrg) return;
    
    if (reviewDecision === 'rejected' && !rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:3000/api/v1/organization/admin/review/${reviewingOrg._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          decision: reviewDecision,
          rejectionReason: reviewDecision === 'rejected' ? rejectionReason : undefined
        })
      });

      if (response.status === 401) {
        handleSessionExpired();
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to review organization');
      }

      setSuccessMessage(`Organization ${reviewDecision} successfully!`);
      setShowReviewModal(false);
      setReviewingOrg(null);
      setReviewDecision('');
      setRejectionReason('');
      
      // Refresh the pending organizations list
      await fetchPendingOrganizations(token);
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:3000/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.status === 401) {
        handleSessionExpired();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create user');
      }

      setSuccessMessage(t('dashboard.messages.userCreated'));
      setShowAddUserModal(false);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        role: 'family'
      });
      fetchUsers(token);
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:3000/api/v1/users/${editingUser._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          role: formData.role
        })
      });

      if (response.status === 401) {
        handleSessionExpired();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user');
      }

      setSuccessMessage(t('dashboard.messages.userUpdated'));
      setEditingUser(null);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        role: 'family'
      });
      fetchUsers(token);
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm(t('dashboard.users.deleteConfirm'))) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:3000/api/v1/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        handleSessionExpired();
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete user');
      }

      setSuccessMessage(t('dashboard.messages.userDeleted'));
      fetchUsers(token);
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const openEditModal = (userToEdit) => {
    setEditingUser(userToEdit);
    setFormData({
      fullName: userToEdit.fullName,
      email: userToEdit.email,
      phone: userToEdit.phone || '',
      password: '',
      role: userToEdit.role
    });
  };

  const closeModal = () => {
    setShowAddUserModal(false);
    setEditingUser(null);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      password: '',
      role: 'family'
    });
    setError('');
  };

  // Handle organization review
  // (This function has been integrated into handleSubmitReview)

  if (!user) {
    return (
      <div className="dashboard-loading">
        <div className="spinner-large"></div>
      </div>
    );
  }

  const stats = {
    total: users.length,
    families: users.filter(u => u.role === 'family').length,
    doctors: users.filter(u => u.role === 'doctor').length,
    volunteers: users.filter(u => u.role === 'volunteer').length
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="dashboard-title">🧠 {t('dashboard.title')}</h1>
            <p className="dashboard-subtitle-main">{t('dashboard.subtitle')}</p>
          </div>
          <div className="header-right">
            <LanguageSwitcher />
            <div className="user-info">
              <span className="user-greeting">{t('dashboard.welcome')}, {user.fullName?.split(' ')[0]}</span>
              <button onClick={handleRefresh} className="refresh-button" title="Refresh data">
                🔄 Refresh
              </button>
              <button onClick={handleLogout} className="logout-button">
                {t('dashboard.logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="success-banner">
          <span>✓</span> {successMessage}
        </div>
      )}
      {error && (
        <div className="error-banner">
          <span>⚠</span> {error}
        </div>
      )}

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-tabs">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            {t('dashboard.tabs.overview')}
          </button>
          <button
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            {t('dashboard.tabs.users')}
          </button>
          <button
            className={`tab-btn ${activeTab === 'organizations' ? 'active' : ''}`}
            onClick={() => setActiveTab('organizations')}
          >
            Pending Organizations
            {pendingOrganizations.length > 0 && (
              <span className="pending-badge">{pendingOrganizations.length}</span>
            )}
          </button>
        </div>

        {activeTab === 'overview' && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>{t('dashboard.stats.totalUsers')}</h3>
                  <p className="stat-value">{stats.total}</p>
                  <span className="stat-change positive">{t('dashboard.stats.activeAccounts')}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">👨‍👩‍👧‍👦</div>
                <div className="stat-info">
                  <h3>{t('dashboard.stats.familyAccounts')}</h3>
                  <p className="stat-value">{stats.families}</p>
                  <span className="stat-change">{t('dashboard.stats.regularUsers')}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">👨‍⚕️</div>
                <div className="stat-info">
                  <h3>{t('dashboard.stats.healthcareProviders')}</h3>
                  <p className="stat-value">{stats.doctors}</p>
                  <span className="stat-change">{t('dashboard.stats.medicalProfessionals')}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🤝</div>
                <div className="stat-info">
                  <h3>{t('dashboard.stats.volunteers')}</h3>
                  <p className="stat-value">{stats.volunteers}</p>
                  <span className="stat-change">{t('dashboard.stats.communityHelpers')}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🏢</div>
                <div className="stat-info">
                  <h3>Pending Organizations</h3>
                  <p className="stat-value">{pendingOrganizations.length}</p>
                  <span className={`stat-change ${pendingOrganizations.length > 0 ? 'pending' : ''}`}>
                    {pendingOrganizations.length > 0 ? 'Awaiting Review' : 'All Reviewed'}
                  </span>
                </div>
              </div>
            </div>

            <div className="dashboard-grid">
              <section className="dashboard-section">
                <h3 className="section-title">{t('dashboard.quickActions.title')}</h3>
                <div className="actions-grid">
                  <button className="action-card" onClick={() => {
                    setActiveTab('users');
                    setShowAddUserModal(true);
                  }}>
                    <span className="action-icon">➕</span>
                    <span>{t('dashboard.quickActions.addUser')}</span>
                  </button>
                  <button className="action-card" onClick={() => setActiveTab('users')}>
                    <span className="action-icon">👥</span>
                    <span>{t('dashboard.quickActions.manageUsers')}</span>
                  </button>
                  <button className="action-card" onClick={() => setActiveTab('organizations')}>
                    <span className="action-icon">🏢</span>
                    <span>Review Organizations</span>
                  </button>
                  <button className="action-card">
                    <span className="action-icon">⚙️</span>
                    <span>{t('dashboard.quickActions.settings')}</span>
                  </button>
                </div>
              </section>
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <div className="users-section">
            <div className="users-header">
              <h3 className="section-title">{t('dashboard.users.title')}</h3>
              <button className="add-user-btn" onClick={() => setShowAddUserModal(true)}>
                ➕ {t('dashboard.users.addNew')}
              </button>
            </div>

            {loading ? (
              <div className="loading-container">
                <div className="spinner-large"></div>
              </div>
            ) : (
              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>{t('dashboard.users.name')}</th>
                      <th>{t('dashboard.users.email')}</th>
                      <th>{t('dashboard.users.phone')}</th>
                      <th>{t('dashboard.users.role')}</th>
                      <th>{t('dashboard.users.joined')}</th>
                      <th>{t('dashboard.users.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id}>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar">{u.fullName?.[0]?.toUpperCase()}</div>
                            {u.fullName}
                          </div>
                        </td>
                        <td>{u.email}</td>
                        <td>{u.phone || '—'}</td>
                        <td>
                          <span className={`role-badge role-${u.role}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="edit-btn"
                              onClick={() => openEditModal(u)}
                              title={t('dashboard.users.edit')}
                            >
                              ✏️
                            </button>
                            <button
                              className="delete-btn"
                              onClick={() => handleDeleteUser(u._id)}
                              title={t('dashboard.users.delete')}
                              disabled={u.role === 'admin'}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Pending Organizations Tab */}
        {activeTab === 'organizations' && (
          <div className="organizations-section">
            <div className="section-header">
              <h2>Pending Organization Requests</h2>
              <button 
                onClick={refreshOrganizations} 
                className="refresh-button" 
                disabled={loadingOrganizations}
              >
                🔄 Refresh
              </button>
            </div>

            {loadingOrganizations && (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <span>Loading pending organizations...</span>
              </div>
            )}

            {!loadingOrganizations && pendingOrganizations.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">✅</div>
                <h3>No Pending Requests</h3>
                <p>All organization requests have been reviewed!</p>
              </div>
            )}

            {!loadingOrganizations && pendingOrganizations.length > 0 && (
              <div className="organizations-grid">
                {pendingOrganizations.map(org => (
                  <div key={org._id} className="organization-card">
                    <div className="org-header">
                      <div className="org-icon">🏢</div>
                      <div className="org-info">
                        <h3>{org.organizationName}</h3>
                        <p className="org-status pending">Pending Review</p>
                      </div>
                    </div>
                    
                    <div className="org-details">
                      <div className="detail-row">
                        <span className="label">Organization Leader:</span>
                        <span className="value">{org.leaderFullName}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Email:</span>
                        <span className="value">{org.leaderEmail}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Requested:</span>
                        <span className="value">
                          {new Date(org.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {org.description && (
                        <div className="detail-row description">
                          <span className="label">Description:</span>
                          <span className="value description-text">{org.description}</span>
                        </div>
                      )}
                    </div>

                    <div className="org-actions">
                      <button 
                        className="btn-approve"
                        onClick={() => {
                          setReviewingOrg(org);
                          setReviewDecision('approved');
                          setRejectionReason('');
                          setShowReviewModal(true);
                        }}
                      >
                        ✅ Approve
                      </button>
                      <button 
                        className="btn-reject"
                        onClick={() => {
                          setReviewingOrg(org);
                          setReviewDecision('rejected');
                          setRejectionReason('');
                          setShowReviewModal(true);
                        }}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Organization Review Modal */}
      {showReviewModal && reviewingOrg && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal-content review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {reviewDecision === 'approved' ? '✅ Approve Organization' : '❌ Reject Organization'}
              </h3>
              <button 
                className="close-modal" 
                onClick={() => setShowReviewModal(false)}
              >
                ×
              </button>
            </div>

            <div className="review-content">
              <div className="org-summary">
                <h4>{reviewingOrg.organizationName}</h4>
                <p><strong>Leader:</strong> {reviewingOrg.leaderFullName}</p>
                <p><strong>Email:</strong> {reviewingOrg.leaderEmail}</p>
                {reviewingOrg.description && (
                  <p><strong>Description:</strong> {reviewingOrg.description}</p>
                )}
              </div>

              <div className="decision-section">
                <label>
                  <input
                    type="radio"
                    name="decision"
                    value="approved"
                    checked={reviewDecision === 'approved'}
                    onChange={(e) => setReviewDecision(e.target.value)}
                  />
                  <span className="decision-label approve">
                    ✅ Approve this organization
                  </span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="decision"
                    value="rejected"
                    checked={reviewDecision === 'rejected'}
                    onChange={(e) => setReviewDecision(e.target.value)}
                  />
                  <span className="decision-label reject">
                    ❌ Reject this organization
                  </span>
                </label>
              </div>

              {reviewDecision === 'rejected' && (
                <div className="rejection-reason">
                  <label htmlFor="rejectionReason">
                    <strong>Reason for rejection:</strong>
                  </label>
                  <textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a clear reason for rejection that will help the organization improve their application..."
                    rows={4}
                    required
                  />
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="cancel-btn" 
                onClick={() => setShowReviewModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className={`submit-btn ${reviewDecision === 'rejected' ? 'reject-btn' : 'approve-btn'}`}
                onClick={handleSubmitReview}
              >
                {reviewDecision === 'approved' ? '✅ Approve Organization' : '❌ Reject Organization'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit User Modal */}
      {(showAddUserModal || editingUser) && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingUser ? t('dashboard.modal.editUser') : t('dashboard.modal.addUser')}</h3>
              <button className="close-btn" onClick={closeModal}>✕</button>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <form onSubmit={editingUser ? handleEditUser : handleAddUser}>
              <div className="form-group">
                <label htmlFor="fullName">{t('dashboard.modal.fullName')}</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">{t('dashboard.modal.email')}</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">{t('dashboard.modal.phone')}</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>

              {!editingUser && (
                <div className="form-group">
                  <label htmlFor="password">{t('dashboard.modal.password')}</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="role">{t('dashboard.modal.role')}</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                >
                  <option value="family">{t('dashboard.roles.family')}</option>
                  <option value="doctor">{t('dashboard.roles.doctor')}</option>
                  <option value="volunteer">{t('dashboard.roles.volunteer')}</option>
                  <option value="admin">{t('dashboard.roles.admin')}</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={closeModal}>
                  {t('dashboard.modal.cancel')}
                </button>
                <button type="submit" className="submit-btn">
                  {editingUser ? t('dashboard.modal.update') : t('dashboard.modal.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
