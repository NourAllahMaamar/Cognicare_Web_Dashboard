import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { API_BASE_URL } from '../../config';
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

  // All organizations state (for management tab)
  const [organizations, setOrganizations] = useState([]);
  const [loadingAllOrgs, setLoadingAllOrgs] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [orgFormData, setOrgFormData] = useState({
    organizationName: '',
    leaderFullName: '',
    leaderEmail: '',
    leaderPhone: '',
    leaderPassword: ''
  });
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [orgMembers, setOrgMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [pendingOrgInvitations, setPendingOrgInvitations] = useState([]);
  const [loadingPendingInvites, setLoadingPendingInvites] = useState(false);

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
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
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
      let response = await fetch(`${API_BASE_URL}/users`, {
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
        response = await fetch(`${API_BASE_URL}/users`, {
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
      setError(t('dashboard.messages.fetchUsersFailed'));
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
      let response = await fetch(`${API_BASE_URL}/organization/admin/pending-requests`, {
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
        response = await fetch(`${API_BASE_URL}/organization/admin/pending-requests`, {
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
      setError(t('dashboard.messages.fetchPendingOrgsFailed'));
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoadingOrganizations(false);
    }
  }, [handleSessionExpired, refreshAccessToken]);

  // Fetch all organizations
  const fetchAllOrganizations = useCallback(async (token) => {
    setLoadingAllOrgs(true);
    try {
      let authToken = token || localStorage.getItem('adminToken');
      let response = await fetch(`${API_BASE_URL}/organization/all`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (!newToken) {
          handleSessionExpired();
          return;
        }

        authToken = newToken;
        response = await fetch(`${API_BASE_URL}/organization/all`, {
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
        setOrganizations(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch organizations:', err);
      setError(t('dashboard.messages.fetchOrgsFailed'));
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoadingAllOrgs(false);
    }
  }, [handleSessionExpired, refreshAccessToken]);

  // Fetch pending organization invitations
  const fetchPendingOrgInvitations = useCallback(async (token) => {
    setLoadingPendingInvites(true);
    try {
      let authToken = token || localStorage.getItem('adminToken');
      let response = await fetch(`${API_BASE_URL}/organization/admin/pending-invitations`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (!newToken) {
          handleSessionExpired();
          return;
        }

        authToken = newToken;
        response = await fetch(`${API_BASE_URL}/organization/admin/pending-invitations`, {
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
        setPendingOrgInvitations(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch pending org invitations:', err);
    } finally {
      setLoadingPendingInvites(false);
    }
  }, [handleSessionExpired, refreshAccessToken]);

  // Fetch organization members (staff and families)
  const fetchOrgMembers = useCallback(async (orgId) => {
    setLoadingMembers(true);
    try {
      const token = localStorage.getItem('adminToken');
      const [staffRes, familiesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/organization/${orgId}/staff`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/organization/${orgId}/families`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (staffRes.ok && familiesRes.ok) {
        const staff = await staffRes.json();
        const families = await familiesRes.json();
        setOrgMembers({ staff: staff || [], families: families || [] });
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

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
      fetchAllOrganizations(token);
      fetchPendingOrgInvitations(token);
    } catch {
      navigate('/admin/login');
    }
  }, [navigate, fetchUsers, fetchPendingOrganizations, fetchAllOrganizations, fetchPendingOrgInvitations]);

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
    setLoadingAllOrgs(true);
    setLoadingPendingInvites(true);
    try {
      await Promise.all([
        fetchUsers(token),
        fetchPendingOrganizations(token),
        fetchAllOrganizations(token),
        fetchPendingOrgInvitations(token)
      ]);
      setSuccessMessage(t('dashboard.messages.refreshed'));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to refresh data:', error);
      setError(t('dashboard.messages.refreshFailed'));
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
      setLoadingOrganizations(false);
      setLoadingAllOrgs(false);
      setLoadingPendingInvites(false);
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
      setError(t('dashboard.messages.rejectionReasonRequired'));
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/organization/admin/review/${reviewingOrg._id}`, {
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

      setSuccessMessage(t('dashboard.messages.orgReviewSuccess', { status: reviewDecision }));
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
      const response = await fetch(`${API_BASE_URL}/users`, {
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
      const response = await fetch(`${API_BASE_URL}/users/${editingUser._id}`, {
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
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
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

  // Organization CRUD operations
  const handleOrgInputChange = (e) => {
    setOrgFormData({
      ...orgFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const token = localStorage.getItem('adminToken');

      // Send organization leader invitation (creates pending invitation)
      const response = await fetch(`${API_BASE_URL}/organization/admin/invite-leader`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          organizationName: orgFormData.organizationName,
          leaderFullName: orgFormData.leaderFullName,
          leaderEmail: orgFormData.leaderEmail,
          leaderPhone: orgFormData.leaderPhone,
          leaderPassword: orgFormData.leaderPassword
        })
      });

      if (response.status === 401) {
        handleSessionExpired();
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send organization invitation');
      }

      const data = await response.json();

      // Check if email was sent successfully or if there was a warning
      if (data.message && data.message.includes('email failed')) {
        setSuccessMessage('⚠️ ' + data.message);
        setTimeout(() => setSuccessMessage(''), 10000); // Longer timeout for warnings
      } else {
        setSuccessMessage(t('dashboard.messages.orgInviteSuccess'));
        setTimeout(() => setSuccessMessage(''), 5000);
      }

      setShowOrgModal(false);
      setOrgFormData({
        organizationName: '',
        leaderFullName: '',
        leaderEmail: '',
        leaderPhone: '',
        leaderPassword: ''
      });
      fetchPendingOrgInvitations(token);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateOrg = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/organization/${editingOrg._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          organizationName: orgFormData.organizationName,
          description: orgFormData.description
        })
      });

      if (response.status === 401) {
        handleSessionExpired();
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update organization');
      }

      setSuccessMessage(t('dashboard.messages.orgUpdateSuccess'));
      setShowOrgModal(false);
      setEditingOrg(null);
      setOrgFormData({ organizationName: '', description: '', leaderEmail: '' });
      fetchAllOrganizations(token);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteOrg = async (orgId) => {
    if (!window.confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/organization/${orgId}`, {
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
        throw new Error(data.message || 'Failed to delete organization');
      }

      setSuccessMessage(t('dashboard.messages.orgDeleteSuccess'));
      fetchAllOrganizations(token);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const openEditOrgModal = (org) => {
    setEditingOrg(org);
    setOrgFormData({
      organizationName: org.name,
      description: org.description || '',
      leaderEmail: org.leaderId?.email || ''
    });
    setShowOrgModal(true);
  };

  const closeOrgModal = () => {
    setShowOrgModal(false);
    setEditingOrg(null);
    setOrgFormData({
      organizationName: '',
      leaderFullName: '',
      leaderEmail: '',
      leaderPhone: '',
      leaderPassword: ''
    });
    setError('');
  };

  const handleCancelInvitation = async (invitationId) => {
    if (!window.confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/organization/admin/invitations/${invitationId}`, {
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
        throw new Error(data.message || 'Failed to cancel invitation');
      }

      setSuccessMessage(t('dashboard.messages.inviteCancelSuccess'));
      fetchPendingOrgInvitations(token);
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
    volunteers: users.filter(u => u.role === 'volunteer').length,
    organizations: organizations.length,
    orgLeaders: users.filter(u => u.role === 'organization_leader').length,
    pendingInvites: pendingOrgInvitations.length,
    pendingReviews: pendingOrganizations.length
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="dashboard-title">
              <img src="/src/assets/logo.png" alt="CogniCare Logo" className="header-logo" onError={(e) => { e.target.style.display = 'none'; }} />
              <span>CogniCare</span>
            </h1>
            <p className="dashboard-subtitle-main">{t('dashboard.subtitle')}</p>
          </div>
          <div className="header-right">
            <LanguageSwitcher />
            <div className="user-info">
              <span className="user-greeting">{t('dashboard.welcome')}, {user.fullName?.split(' ')[0]}</span>
              <button onClick={handleRefresh} className="refresh-button" title={t('dashboard.refresh')}>
                🔄 {t('dashboard.refresh')}
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
            className={`tab-btn ${activeTab === 'manage-orgs' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('manage-orgs');
              if (organizations.length === 0) {
                const token = localStorage.getItem('adminToken');
                fetchAllOrganizations(token);
              }
            }}
          >
            🏢 {t('dashboard.tabs.manageOrgs')}
          </button>
          <button
            className={`tab-btn ${activeTab === 'pending-invites' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending-invites')}
          >
            📧 {t('dashboard.tabs.pendingInvites')}
            {pendingOrgInvitations.length > 0 && (
              <span className="pending-badge">{pendingOrgInvitations.length}</span>
            )}
          </button>
          <button
            className={`tab-btn ${activeTab === 'organizations' ? 'active' : ''}`}
            onClick={() => setActiveTab('organizations')}
          >
            {t('dashboard.tabs.pendingReviews')}
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
                  <h3>{t('dashboard.organizations.title')}</h3>
                  <p className="stat-value">{stats.organizations}</p>
                  <span className="stat-change">{stats.orgLeaders} {t('dashboard.stats.orgLeaders')}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-info">
                  <h3>{t('dashboard.tabs.pendingReviews')}</h3>
                  <p className="stat-value">{stats.pendingInvites + stats.pendingReviews}</p>
                  <span className={`stat-change ${(stats.pendingInvites + stats.pendingReviews) > 0 ? 'pending' : ''}`}>
                    {stats.pendingInvites} {t('dashboard.tabs.pendingInvites')}, {stats.pendingReviews} {t('dashboard.tabs.pendingReviews')}
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
                  <button className="action-card" onClick={() => {
                    setActiveTab('manage-orgs');
                    if (organizations.length === 0) {
                      const token = localStorage.getItem('adminToken');
                      fetchAllOrganizations(token);
                    }
                  }}>
                    <span className="action-icon">🏢</span>
                    <span>{t('dashboard.tabs.manageOrgs')}</span>
                  </button>
                  <button className="action-card" onClick={() => setActiveTab('organizations')}>
                    <span className="action-icon">📋</span>
                    <span>{t('dashboard.tabs.pendingReviews')}</span>
                  </button>
                </div>
              </section>

              <section className="dashboard-section">
                <h3 className="section-title">📊 {t('dashboard.recentActivity.title')}</h3>
                <div className="activity-list">
                  <div className="activity-item">
                    <span className="activity-icon">👥</span>
                    <div className="activity-info">
                      <p className="activity-text">{stats.total} {t('dashboard.recentActivity.totalUsers')}</p>
                      <span className="activity-time">{t('dashboard.tabs.overview')}</span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <span className="activity-icon">🏢</span>
                    <div className="activity-info">
                      <p className="activity-text">{stats.organizations} {t('dashboard.recentActivity.activeOrgs')}</p>
                      <span className="activity-time">{t('dashboard.organizations.status')}</span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <span className="activity-icon">⏳</span>
                    <div className="activity-info">
                      <p className="activity-text">
                        {pendingOrganizations.length > 0
                          ? `${pendingOrganizations.length} ${t('dashboard.recentActivity.awaitingReview')}`
                          : t('dashboard.recentActivity.noPending')}
                      </p>
                      <span className="activity-time">{t('dashboard.recentActivity.reviewQueue')}</span>
                    </div>
                  </div>
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
              <div className="user-grid">
                {users.map(u => (
                  <div key={u._id} className="profile-card user-profile-card">
                    <span className={`card-role-badge role-${u.role}`}>
                      {u.roleMapping?.[u.role] || u.role}
                    </span>
                    <div className="card-header">
                      <div className="card-avatar">
                        {u.fullName?.[0]?.toUpperCase()}
                      </div>
                      <h4 className="card-name">{u.fullName}</h4>
                      <a href={`mailto:${u.email}`} className="card-email">{u.email}</a>
                    </div>

                    <div className="card-body">
                      <div className="card-info-item">
                        <span className="card-info-label">📞</span>
                        <span>{u.phone || '—'}</span>
                      </div>
                      <div className="card-info-item">
                        <span className="card-info-label">📅</span>
                        <span>{new Date(u.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : (i18n.language === 'fr' ? 'fr-FR' : 'en-US'))}</span>
                      </div>
                    </div>

                    <div className="card-footer">
                      <div className="card-date">{t('dashboard.users.joined')}</div>
                      <div className="card-actions">
                        <button
                          className="card-action-btn edit"
                          onClick={() => openEditModal(u)}
                          title={t('dashboard.users.edit')}
                        >
                          ✏️
                        </button>
                        <button
                          className="card-action-btn delete"
                          onClick={() => handleDeleteUser(u._id)}
                          title={t('dashboard.users.delete')}
                          disabled={u.role === 'admin'}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Manage Organizations Tab */}
        {activeTab === 'manage-orgs' && (
          <div className="users-section">
            <div className="users-header">
              <h3 className="section-title">🏢 {t('dashboard.organizations.title')}</h3>
              <button className="add-user-btn" onClick={() => setShowOrgModal(true)}>
                ➕ {t('dashboard.organizations.addNew')}
              </button>
            </div>

            {loadingAllOrgs ? (
              <div className="loading-container">
                <div className="spinner-large"></div>
              </div>
            ) : (
              <div className="org-grid">
                {organizations.map(org => (
                  <div key={org._id} className="profile-card org-profile-card">
                    <div className="card-header">
                      <div className="card-avatar">🏢</div>
                      <h4 className="card-name">{org.name}</h4>
                      <div className={`status-badge status-${org.status || 'approved'}`}>
                        {t(`dashboard.roles.${org.status || 'approved'}`)}
                      </div>
                    </div>

                    <div className="card-body">
                      <div className="card-info-item">
                        <span className="card-info-label">👤</span>
                        <span>{org.leaderId?.fullName || t('dashboard.organizations.noLeader')}</span>
                      </div>

                      <div className="card-stats">
                        <div className="card-stat-box">
                          <span className="card-stat-value">{org.staffIds?.length || 0}</span>
                          <span className="card-stat-label">{t('dashboard.stats.volunteers')}</span>
                        </div>
                        <div className="card-stat-box">
                          <span className="card-stat-value">{org.childIds?.length || 0}</span>
                          <span className="card-stat-label">{t('dashboard.stats.familyAccounts')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="card-footer">
                      <div className="card-date">{new Date(org.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : (i18n.language === 'fr' ? 'fr-FR' : 'en-US'))}</div>
                      <div className="card-actions">
                        <button
                          className="card-action-btn edit"
                          onClick={() => openEditOrgModal(org)}
                          title={t('dashboard.organizations.edit')}
                        >
                          ✏️
                        </button>
                        <button
                          className="card-action-btn review"
                          onClick={() => {
                            setSelectedOrg(org);
                            fetchOrgMembers(org._id);
                          }}
                          title={t('dashboard.organizations.viewMembers')}
                        >
                          👥
                        </button>
                        <button
                          className="card-action-btn delete"
                          onClick={() => handleDeleteOrg(org._id)}
                          title={t('dashboard.organizations.delete')}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pending Invitations Tab */}
        {activeTab === 'pending-invites' && (
          <div className="users-section">
            <div className="users-header">
              <h3 className="section-title">📧 {t('dashboard.invitations.title')}</h3>
              <button
                className="add-user-btn"
                onClick={() => fetchPendingOrgInvitations()}
                disabled={loadingPendingInvites}
              >
                🔄 {t('dashboard.refresh')}
              </button>
            </div>

            {loadingPendingInvites ? (
              <div className="loading-container">
                <div className="spinner-large"></div>
              </div>
            ) : pendingOrgInvitations.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                <p>{t('dashboard.invitations.noInvites')}</p>
              </div>
            ) : (
              <div className="user-grid">
                {pendingOrgInvitations.map(invite => (
                  <div key={invite._id} className="profile-card">
                    <div className="card-header">
                      <div className="card-avatar">
                        🏢
                        <span className="card-role-badge status-pending" style={{ background: '#f59e0b', color: 'white' }}>
                          {t('roles.pending')}
                        </span>
                      </div>
                      <h4 className="card-name">{invite.organizationName}</h4>
                      <p className="card-email">{t('dashboard.invitations.sentDate')}: {new Date(invite.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : (i18n.language === 'fr' ? 'fr-FR' : 'en-US'))}</p>
                    </div>

                    <div className="card-body">
                      <div className="card-info-item">
                        <span className="card-info-label">👤</span>
                        <span>{invite.leaderFullName}</span>
                      </div>
                      <div className="card-info-item">
                        <span className="card-info-label">📧</span>
                        <span style={{ fontSize: '0.85rem', wordBreak: 'break-word' }}>{invite.leaderEmail}</span>
                      </div>
                      <div className="card-info-item">
                        <span className="card-info-label">📞</span>
                        <span>{invite.leaderPhone || t('orgDashboard.families.noPhone')}</span>
                      </div>
                    </div>

                    <div className="card-footer">
                      <div className="card-date">{t('dashboard.invitations.pending')}</div>
                      <div className="card-actions">
                        <button
                          className="card-action-btn delete"
                          onClick={() => handleCancelInvitation(invite._id)}
                          title={t('dashboard.invitations.cancel')}
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pending Organizations Tab */}
        {activeTab === 'organizations' && (
          <div className="organizations-section">
            <div className="section-header">
              <h2>{t('dashboard.organizations.pendingTitle')}</h2>
              <button
                onClick={refreshOrganizations}
                className="refresh-button"
                disabled={loadingOrganizations}
              >
                🔄 {t('dashboard.refresh')}
              </button>
            </div>

            {loadingOrganizations && (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <span>{t('dashboard.organizations.loading')}</span>
              </div>
            )}

            {!loadingOrganizations && pendingOrganizations.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">✅</div>
                <h3>{t('dashboard.organizations.noPending')}</h3>
                <p>{t('dashboard.organizations.noPendingSub')}</p>
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
                        <p className="org-status pending">{t('dashboard.organizations.pendingReview')}</p>
                      </div>
                    </div>

                    <div className="org-details">
                      <div className="detail-row">
                        <span className="label">{t('dashboard.organizations.leader')}:</span>
                        <span className="value">{org.leaderFullName}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">{t('dashboard.modal.email')}:</span>
                        <span className="value">{org.leaderEmail}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">{t('dashboard.organizations.created')}:</span>
                        <span className="value">
                          {new Date(org.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : (i18n.language === 'fr' ? 'fr-FR' : 'en-US'), {
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
                          <span className="label">{t('dashboard.organizations.description')}:</span>
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
                        ✅ {t('dashboard.organizations.approve')}
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
                        ❌ {t('dashboard.organizations.reject')}
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
                {reviewDecision === 'approved' ? `✅ ${t('dashboard.organizations.approveTitle')}` : `❌ ${t('dashboard.organizations.rejectTitle')}`}
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
                <p><strong>{t('dashboard.organizations.leader')}:</strong> {reviewingOrg.leaderFullName}</p>
                <p><strong>{t('dashboard.modal.email')}:</strong> {reviewingOrg.leaderEmail}</p>
                {reviewingOrg.description && (
                  <p><strong>{t('dashboard.organizations.description')}:</strong> {reviewingOrg.description}</p>
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
                    ✅ {t('dashboard.organizations.approveThisOrg')}
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
                    ❌ {t('dashboard.organizations.rejectThisOrg')}
                  </span>
                </label>
              </div>

              {reviewDecision === 'rejected' && (
                <div className="rejection-reason">
                  <label htmlFor="rejectionReason">
                    <strong>{t('dashboard.organizations.reasonForRejection')}</strong>
                  </label>
                  <textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder={t('dashboard.organizations.rejectionPlaceholder')}
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
                {t('dashboard.modal.cancel')}
              </button>
              <button
                type="button"
                className={`submit-btn ${reviewDecision === 'rejected' ? 'reject-btn' : 'approve-btn'}`}
                onClick={handleSubmitReview}
              >
                {reviewDecision === 'approved' ? `✅ ${t('dashboard.organizations.approve')}` : `❌ ${t('dashboard.organizations.reject')}`}
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

      {/* Organization Create/Edit Modal */}
      {showOrgModal && (
        <div className="modal-overlay" onClick={closeOrgModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingOrg ? t('dashboard.organizations.edit') : t('dashboard.organizations.createOrgLeader')}</h3>
              <button className="close-btn" onClick={closeOrgModal}>✕</button>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            {/* Info Banner - Only show when creating */}
            {!editingOrg && (
              <div style={{
                padding: '0 1.5rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  background: 'rgba(100, 200, 255, 0.15)',
                  border: '1px solid rgba(100, 200, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  fontSize: '0.8rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  lineHeight: '1.5'
                }}>
                  <strong>📧 {t('dashboard.organizations.leadershipInvite')}</strong> {t('dashboard.organizations.leadershipInviteDetail')}
                </div>
              </div>
            )}

            <form onSubmit={editingOrg ? handleUpdateOrg : handleCreateOrg}>
              <div className="form-group">
                <label htmlFor="organizationName">{t('dashboard.organizations.orgName')}</label>
                <input
                  type="text"
                  id="organizationName"
                  name="organizationName"
                  value={orgFormData.organizationName}
                  onChange={handleOrgInputChange}
                  required
                />
              </div>

              {!editingOrg && (
                <>
                  <div className="form-group">
                    <label htmlFor="leaderFullName">{t('dashboard.organizations.leaderName')}</label>
                    <input
                      type="text"
                      id="leaderFullName"
                      name="leaderFullName"
                      value={orgFormData.leaderFullName}
                      onChange={handleOrgInputChange}
                      placeholder="e.g., John Doe"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="leaderEmail">{t('dashboard.organizations.leaderEmail')}</label>
                    <input
                      type="email"
                      id="leaderEmail"
                      name="leaderEmail"
                      value={orgFormData.leaderEmail}
                      onChange={handleOrgInputChange}
                      placeholder="leader@example.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="leaderPhone">{t('dashboard.organizations.leaderPhone')}</label>
                    <input
                      type="tel"
                      id="leaderPhone"
                      name="leaderPhone"
                      value={orgFormData.leaderPhone}
                      onChange={handleOrgInputChange}
                      placeholder="+1234567890"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="leaderPassword">{t('dashboard.organizations.initialPassword')}</label>
                    <input
                      type="password"
                      id="leaderPassword"
                      name="leaderPassword"
                      value={orgFormData.leaderPassword}
                      onChange={handleOrgInputChange}
                      placeholder={t('dashboard.organizations.passwordHelp')}
                      required
                      minLength={8}
                    />
                  </div>
                </>
              )}

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={closeOrgModal}>
                  {t('dashboard.modal.cancel')}
                </button>
                <button type="submit" className="submit-btn">
                  {editingOrg ? `✓ ${t('dashboard.organizations.edit')}` : `📧 ${t('dashboard.organizations.sendInvitation')}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Organization Members Modal */}
      {selectedOrg && (
        <div className="modal-overlay" onClick={() => setSelectedOrg(null)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>👥 {t('dashboard.organizations.membersOf')} {selectedOrg.name}</h3>
              <button className="close-btn" onClick={() => setSelectedOrg(null)}>✕</button>
            </div>

            {loadingMembers ? (
              <div className="loading-container">
                <div className="spinner-large"></div>
              </div>
            ) : (
              <div style={{ padding: '0 2rem 2rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ color: 'white', marginBottom: '1rem' }}>{t('orgDashboard.tabs.staff')} ({orgMembers.staff?.length || 0})</h4>
                  {orgMembers.staff?.length > 0 ? (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '1rem'
                    }}>
                      {orgMembers.staff.map(member => (
                        <div key={member._id} style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '1rem',
                          borderRadius: '10px',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          <div style={{ fontWeight: 600, color: 'white', marginBottom: '0.25rem' }}>{member.fullName}</div>
                          <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '0.5rem' }}>{member.email}</div>
                          <span className={`role-badge role-${member.role}`} style={{ display: 'inline-block' }}>
                            {t(`dashboard.roles.${member.role}`)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{t('dashboard.organizations.noStaff')}</p>
                  )}
                </div>

                <div>
                  <h4 style={{ color: 'white', marginBottom: '1rem' }}>{t('orgDashboard.tabs.families')} ({orgMembers.families?.length || 0})</h4>
                  {orgMembers.families?.length > 0 ? (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '1rem'
                    }}>
                      {orgMembers.families.map(member => (
                        <div key={member._id} style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '1rem',
                          borderRadius: '10px',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          <div style={{ fontWeight: 600, color: 'white', marginBottom: '0.25rem' }}>{member.fullName}</div>
                          <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '0.5rem' }}>{member.email}</div>
                          <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                            {t('orgDashboard.tabs.children')}: {member.childrenIds?.length || 0}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{t('dashboard.organizations.noFamilies')}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
