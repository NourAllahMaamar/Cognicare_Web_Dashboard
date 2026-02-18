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
  const [fraudAnalysisResult, setFraudAnalysisResult] = useState(null);
  const [loadingFraudAnalysis, setLoadingFraudAnalysis] = useState(false);
  const [rescanLoading, setRescanLoading] = useState(false);
  const [rescanError, setRescanError] = useState(null);

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

  // Fraud detection state
  const [fraudStats, setFraudStats] = useState({
    totalSubmissions: 0,
    highRiskPercentage: 0,
    pendingReviews: 0,
    averageFraudScore: 0,
    approvedCount: 0,
    rejectedCount: 0
  });
  const [highRiskAnalyses, setHighRiskAnalyses] = useState([]);
  const [pendingAnalyses, setPendingAnalyses] = useState([]);
  const [loadingFraudData, setLoadingFraudData] = useState(false);
  const [aiHealthStatus, setAiHealthStatus] = useState(null);
  const [showReviewAnalysisModal, setShowReviewAnalysisModal] = useState(false);
  const [reviewingAnalysis, setReviewingAnalysis] = useState(null);
  const [analysisReviewNotes, setAnalysisReviewNotes] = useState('');
  const [fraudSearchTerm, setFraudSearchTerm] = useState('');
  const [fraudRiskFilter, setFraudRiskFilter] = useState('all'); // all, LOW, MEDIUM, HIGH
  const [fraudStatusFilter, setFraudStatusFilter] = useState('all'); // all, pending, approved, rejected

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
  }, [handleSessionExpired, refreshAccessToken, t]);

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
  }, [handleSessionExpired, refreshAccessToken, t]);

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
  }, [handleSessionExpired, refreshAccessToken, t]);

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

  // Fetch fraud detection stats
  const fetchFraudStats = useCallback(async (token) => {
    try {
      let authToken = token || localStorage.getItem('adminToken');
      let response = await fetch(`${API_BASE_URL}/org-scan-ai/admin/stats`, {
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
        response = await fetch(`${API_BASE_URL}/org-scan-ai/admin/stats`, {
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
        setFraudStats(data || {
          totalSubmissions: 0,
          highRiskPercentage: 0,
          pendingReviews: 0,
          averageFraudScore: 0,
          approvedCount: 0,
          rejectedCount: 0
        });
      }
    } catch (err) {
      console.error('Failed to fetch fraud stats:', err);
    }
  }, [handleSessionExpired, refreshAccessToken]);

  // Fetch high-risk fraud analyses
  const fetchHighRiskAnalyses = useCallback(async (token) => {
    try {
      let authToken = token || localStorage.getItem('adminToken');
      let response = await fetch(`${API_BASE_URL}/org-scan-ai/admin/high-risk`, {
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
        response = await fetch(`${API_BASE_URL}/org-scan-ai/admin/high-risk`, {
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
        setHighRiskAnalyses(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch high-risk analyses:', err);
    }
  }, [handleSessionExpired, refreshAccessToken]);

  // Fetch pending fraud analyses
  const fetchPendingAnalyses = useCallback(async (token) => {
    try {
      let authToken = token || localStorage.getItem('adminToken');
      let response = await fetch(`${API_BASE_URL}/org-scan-ai/admin/pending`, {
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
        response = await fetch(`${API_BASE_URL}/org-scan-ai/admin/pending`, {
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
        setPendingAnalyses(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch pending analyses:', err);
    }
  }, [handleSessionExpired, refreshAccessToken]);

  // Fetch AI health status
  const fetchAIHealthStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/org-scan-ai/health`);

      if (response.ok) {
        const data = await response.json();
        setAiHealthStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch AI health status:', err);
    }
  }, []);

  // Fetch all fraud detection data
  const fetchAllFraudData = useCallback(async (token) => {
    setLoadingFraudData(true);
    try {
      await Promise.all([
        fetchFraudStats(token),
        fetchHighRiskAnalyses(token),
        fetchPendingAnalyses(token),
        fetchAIHealthStatus()
      ]);
    } catch (err) {
      console.error('Failed to fetch fraud data:', err);
    } finally {
      setLoadingFraudData(false);
    }
  }, [fetchFraudStats, fetchHighRiskAnalyses, fetchPendingAnalyses, fetchAIHealthStatus]);

  // Handle approve fraud analysis  
  const handleApproveFraudAnalysis = async () => {
    if (!reviewingAnalysis) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/org-scan-ai/analysis/${reviewingAnalysis._id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          notes: analysisReviewNotes || 'Approved by admin'
        })
      });

      if (response.status === 401) {
        handleSessionExpired();
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to approve analysis');
      }

      setSuccessMessage('Organization fraud analysis approved successfully');
      setShowReviewAnalysisModal(false);
      setReviewingAnalysis(null);
      setAnalysisReviewNotes('');

      // Refresh fraud data
      await fetchAllFraudData(token);

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  // Handle reject fraud analysis
  const handleRejectFraudAnalysis = async () => {
    if (!reviewingAnalysis) return;

    if (!analysisReviewNotes.trim()) {
      setError('Review notes are required when rejecting');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/org-scan-ai/analysis/${reviewingAnalysis._id}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          notes: analysisReviewNotes
        })
      });

      if (response.status === 401) {
        handleSessionExpired();
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to reject analysis');
      }

      setSuccessMessage('Organization fraud analysis rejected');
      setShowReviewAnalysisModal(false);
      setReviewingAnalysis(null);
      setAnalysisReviewNotes('');

      // Refresh fraud data
      await fetchAllFraudData(token);

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

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
      fetchAllFraudData(token);
    } catch {
      navigate('/admin/login');
    }
  }, [navigate, fetchUsers, fetchPendingOrganizations, fetchAllOrganizations, fetchPendingOrgInvitations, fetchAllFraudData]);

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
    setLoadingFraudData(true);
    try {
      await Promise.all([
        fetchUsers(token),
        fetchPendingOrganizations(token),
        fetchAllOrganizations(token),
        fetchPendingOrgInvitations(token),
        fetchAllFraudData(token)
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
      setLoadingFraudData(false);
    }
  };

  // Refresh pending organizations
  const refreshOrganizations = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    await fetchPendingOrganizations(token);
  };

  // Fetch existing fraud analysis for an organization
  const fetchFraudAnalysisForOrg = async (organizationId) => {
    setLoadingFraudAnalysis(true);
    setFraudAnalysisResult(null);
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/org-scan-ai/organization/${organizationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        handleSessionExpired();
        return;
      }

      if (response.ok) {
        const analyses = await response.json();
        // Get the most recent analysis
        if (analyses && analyses.length > 0) {
          setFraudAnalysisResult(analyses[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch fraud analysis:', err);
    } finally {
      setLoadingFraudAnalysis(false);
    }
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
      setFraudAnalysisResult(null);
      setRescanLoading(false);
      setRescanError(null);

      // Refresh the pending organizations list
      await fetchPendingOrganizations(token);
      // Refresh fraud data to show new analysis
      await fetchAllFraudData(token);

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
            onClick={() => {
              setActiveTab('organizations');
              const token = localStorage.getItem('adminToken');
              fetchAllFraudData(token);
            }}
          >
            🛡️ {t('dashboard.tabs.pendingReviews')} & Fraud Detection
            {(pendingOrganizations.length + fraudStats.pendingReviews) > 0 && (
              <span className="pending-badge">{pendingOrganizations.length + fraudStats.pendingReviews}</span>
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
            {/* AI Health Status Banner */}
            {aiHealthStatus && (
              <div className={`ai-health-banner ${aiHealthStatus.status === 'OK' ? 'status-ok' : 'status-degraded'}`}>
                <div className="health-icon">{aiHealthStatus.status === 'OK' ? '✅' : '⚠️'}</div>
                <div className="health-info">
                  <strong>AI Services Status: {aiHealthStatus.status}</strong>
                  <div className="health-details">
                    <span>Gemini AI: {aiHealthStatus.gemini?.available ? '✓ Online' : '✗ Offline'}</span>
                    <span>Embedding Model: {aiHealthStatus.similarity?.available ? '✓ Ready' : '✗ Not Ready'}</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Last checked: {new Date(aiHealthStatus.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Fraud Stats Grid */}
            <div className="stats-grid fraud-stats" style={{ marginBottom: '2rem' }}>
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <h3>Total Submissions</h3>
                  <p className="stat-value">{fraudStats.totalSubmissions || 0}</p>
                  <span className="stat-label">Organizations analyzed</span>
                </div>
              </div>

              <div className="stat-card high-risk">
                <div className="stat-icon">🚨</div>
                <div className="stat-info">
                  <h3>High Risk</h3>
                  <p className="stat-value">{Math.round((fraudStats.highRiskPercentage || 0) * 100)}%</p>
                  <span className="stat-label">Fraud risk &gt; 60%</span>
                </div>
              </div>

              <div className="stat-card pending">
                <div className="stat-icon">⏳</div>
                <div className="stat-info">
                  <h3>Pending Reviews</h3>
                  <p className="stat-value">{fraudStats.pendingReviews || 0}</p>
                  <span className="stat-label">Awaiting admin action</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📈</div>
                <div className="stat-info">
                  <h3>Average Score</h3>
                  <p className="stat-value">{((fraudStats.averageFraudScore || 0) * 100).toFixed(1)}</p>
                  <span className="stat-label">Mean fraud risk score</span>
                </div>
              </div>

              <div className="stat-card approved">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <h3>Approved</h3>
                  <p className="stat-value">{fraudStats.approvedCount || 0}</p>
                  <span className="stat-label">Verified organizations</span>
                </div>
              </div>

              <div className="stat-card rejected">
                <div className="stat-icon">❌</div>
                <div className="stat-info">
                  <h3>Rejected</h3>
                  <p className="stat-value">{fraudStats.rejectedCount || 0}</p>
                  <span className="stat-label">Fraudulent submissions</span>
                </div>
              </div>
            </div>

            <div className="section-header">
              <h2>📋 {t('dashboard.organizations.pendingTitle')}</h2>
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
                        onClick={async () => {
                          setReviewingOrg(org);
                          setReviewDecision('approved');
                          setRejectionReason('');
                          setShowReviewModal(true);
                          // Fetch fraud analysis for this organization
                          await fetchFraudAnalysisForOrg(org._id);
                        }}
                      >
                        ✅ {t('dashboard.organizations.approve')}
                      </button>
                      <button
                        className="btn-reject"
                        onClick={async () => {
                          setReviewingOrg(org);
                          setReviewDecision('rejected');
                          setRejectionReason('');
                          setShowReviewModal(true);
                          // Fetch fraud analysis for this organization
                          await fetchFraudAnalysisForOrg(org._id);
                        }}
                      >
                        ❌ {t('dashboard.organizations.reject')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Fraud Detection Table Section */}
            <div className="fraud-detection-section" style={{ marginTop: '3rem' }}>
              <div className="section-header">
                <h2>🛡️ AI Fraud Detection Analysis</h2>
              </div>

              {/* Filters */}
              <div className="fraud-filters">
                <input
                  type="text"
                  placeholder="🔍 Search by organization or leader email..."
                  className="fraud-search"
                  value={fraudSearchTerm}
                  onChange={(e) => setFraudSearchTerm(e.target.value)}
                />
                <select
                  className="fraud-filter"
                  value={fraudRiskFilter}
                  onChange={(e) => setFraudRiskFilter(e.target.value)}
                >
                  <option value="all">All Risk Levels</option>
                  <option value="HIGH">🔴 High Risk</option>
                  <option value="MEDIUM">🟡 Medium Risk</option>
                  <option value="LOW">🟢 Low Risk</option>
                </select>
                <select
                  className="fraud-filter"
                  value={fraudStatusFilter}
                  onChange={(e) => setFraudStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">⏳ Pending</option>
                  <option value="approved">✅ Approved</option>
                  <option value="rejected">❌ Rejected</option>
                </select>
              </div>

              {loadingFraudData ? (
                <div className="loading-container">
                  <div className="spinner-large"></div>
                  <p>Loading fraud detection data...</p>
                </div>
              ) : (
                <>
                  {/* All Fraud Analyses Section */}
                  {(() => {
                    // Combine pending and high-risk analyses, remove duplicates
                    const allAnalyses = [...pendingAnalyses, ...highRiskAnalyses];
                    const uniqueAnalyses = allAnalyses.filter((analysis, index, self) =>
                      index === self.findIndex((a) => a._id === analysis._id)
                    );

                    // Apply filters
                    const filteredAnalyses = uniqueAnalyses.filter(analysis => {
                      const matchesSearch = !fraudSearchTerm || 
                        analysis.organizationId?.name?.toLowerCase().includes(fraudSearchTerm.toLowerCase()) ||
                        analysis.organizationId?.leaderId?.email?.toLowerCase().includes(fraudSearchTerm.toLowerCase()) ||
                        analysis.extractedFields?.organizationName?.toLowerCase().includes(fraudSearchTerm.toLowerCase());
                      
                      const matchesRisk = fraudRiskFilter === 'all' || analysis.fraudRiskLevel === fraudRiskFilter;
                      
                      const matchesStatus = fraudStatusFilter === 'all' || 
                        (fraudStatusFilter === 'pending' && !analysis.isRejected && !analysis.reviewedAt) ||
                        (fraudStatusFilter === 'approved' && analysis.reviewedAt && !analysis.isRejected) ||
                        (fraudStatusFilter === 'rejected' && analysis.isRejected);
                      
                      return matchesSearch && matchesRisk && matchesStatus;
                    });

                    return filteredAnalyses.length > 0 ? (
                      <div className="fraud-section">
                        <h3 className="section-title">
                          <span>📋 All Fraud Analyses ({filteredAnalyses.length})</span>
                        </h3>
                        <div className="fraud-table-container">
                          <table className="fraud-table">
                            <thead>
                              <tr>
                                <th>Organization</th>
                                <th>Leader</th>
                                <th>Risk Score</th>
                                <th>Risk Level</th>
                                <th>Flags</th>
                                <th>Similarity</th>
                                <th>Status</th>
                                <th>Submitted</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredAnalyses.map(analysis => (
                                <tr key={analysis._id} className={`risk-${analysis.fraudRiskLevel?.toLowerCase()}`}>
                                  <td>
                                    <div className="org-cell">
                                      <strong>{analysis.organizationId?.name || analysis.extractedFields?.organizationName || 'N/A'}</strong>
                                      {analysis.extractedFields?.registrationNumber && (
                                        <small>Reg: {analysis.extractedFields.registrationNumber}</small>
                                      )}
                                    </div>
                                  </td>
                                  <td>
                                    <div className="leader-cell">
                                      <div>{analysis.organizationId?.leaderId?.fullName || 'N/A'}</div>
                                      <small>{analysis.organizationId?.leaderId?.email || ''}</small>
                                    </div>
                                  </td>
                                  <td>
                                    <div className={`risk-score risk-${analysis.fraudRiskLevel?.toLowerCase()}`}>
                                      {((analysis.fraudRiskScore || 0) * 100).toFixed(1)}%
                                    </div>
                                  </td>
                                  <td>
                                    <span className={`risk-badge risk-${analysis.fraudRiskLevel?.toLowerCase()}`}>
                                      {analysis.fraudRiskLevel === 'HIGH' && '🔴'}
                                      {analysis.fraudRiskLevel === 'MEDIUM' && '🟡'}
                                      {analysis.fraudRiskLevel === 'LOW' && '🟢'}
                                      {' '}{analysis.fraudRiskLevel || 'N/A'}
                                    </span>
                                  </td>
                                  <td>
                                    <div className="flags-cell">
                                      {analysis.flags && analysis.flags.length > 0 ? (
                                        <span className="flag-count">{analysis.flags.length} flags</span>
                                      ) : (
                                        <span className="no-flags">None</span>
                                      )}
                                    </div>
                                  </td>
                                  <td>
                                    <div className="similarity-cell">
                                      {analysis.similarityScore !== undefined && analysis.similarityScore !== null 
                                        ? `${(analysis.similarityScore * 100).toFixed(1)}%`
                                        : 'N/A'}
                                    </div>
                                  </td>
                                  <td>
                                    <span className={`status-badge ${
                                      analysis.isRejected ? 'rejected' : 
                                      analysis.reviewedAt ? 'approved' : 
                                      'pending'
                                    }`}>
                                      {analysis.isRejected ? '❌ Rejected' : 
                                       analysis.reviewedAt ? '✅ Approved' : 
                                       '⏳ Pending'}
                                    </span>
                                  </td>
                                  <td>
                                    <small>{new Date(analysis.createdAt).toLocaleDateString()}</small>
                                  </td>
                                  <td>
                                    <button
                                      className="review-btn"
                                      onClick={() => {
                                        setReviewingAnalysis(analysis);
                                        setShowReviewAnalysisModal(true);
                                        setAnalysisReviewNotes('');
                                      }}
                                    >
                                      📋 Review
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="empty-state">
                        <div className="empty-icon">🔍</div>
                        <h3>No fraud analyses found</h3>
                        <p>No fraud detection results match your filters</p>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        )}

        {/* Fraud Detection Tab - REMOVED: Now merged with Pending Reviews tab */}
      </main>

      {/* Fraud Analysis Review Modal */}
      {showReviewAnalysisModal && reviewingAnalysis && (
        <div className="modal-overlay" onClick={() => setShowReviewAnalysisModal(false)}>
          <div className="modal-content fraud-review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🛡️ Fraud Analysis Review</h3>
              <button className="close-btn" onClick={() => setShowReviewAnalysisModal(false)}>✕</button>
            </div>

            <div className="fraud-review-content">
              {/* Organization Info */}
              <div className="review-section">
                <h4>🏢 Organization Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Organization Name:</label>
                    <span>{reviewingAnalysis.organizationId?.name || reviewingAnalysis.extractedFields?.organizationName || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>Leader:</label>
                    <span>{reviewingAnalysis.organizationId?.leaderId?.fullName || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>Email:</label>
                    <span>{reviewingAnalysis.organizationId?.leaderId?.email || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>Submitted:</label>
                    <span>{new Date(reviewingAnalysis.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="review-section risk-assessment">
                <h4>📊 Risk Assessment</h4>
                <div className="risk-overview">
                  <div className={`risk-score-large risk-${reviewingAnalysis.fraudRiskLevel?.toLowerCase()}`}>
                    <div className="score-value">
                      {((reviewingAnalysis.fraudRiskScore || 0) * 100).toFixed(1)}%
                    </div>
                    <div className="score-label">
                      {reviewingAnalysis.fraudRiskLevel === 'HIGH' && '🔴 HIGH RISK'}
                      {reviewingAnalysis.fraudRiskLevel === 'MEDIUM' && '🟡 MEDIUM RISK'}
                      {reviewingAnalysis.fraudRiskLevel === 'LOW' && '🟢 LOW RISK'}
                      {!reviewingAnalysis.fraudRiskLevel && 'N/A'}
                    </div>
                  </div>
                  <div className="risk-breakdown">
                    <div className="breakdown-item">
                      <span className="break down-label">Document Inconsistency (40%):</span>
                      <span className="breakdown-value">{((reviewingAnalysis.fraudRiskScore || 0) * 0.4 * 100).toFixed(1)}%</span>
                    </div>
                    <div className="breakdown-item">
                      <span className="breakdown-label">Template Similarity (30%):</span>
                      <span className="breakdown-value">{((reviewingAnalysis.similarityScore || 0) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="breakdown-item">
                      <span className="breakdown-label">Domain Risk (30%):</span>
                      <span className="breakdown-value">-</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Extracted Fields */}
              {reviewingAnalysis.extractedFields && (
                <div className="review-section">
                  <h4>🤖 AI-Extracted Information</h4>
                  <div className="info-grid">
                    {reviewingAnalysis.extractedFields.organizationName && (
                      <div className="info-item">
                        <label>Organization Name:</label>
                        <span>{reviewingAnalysis.extractedFields.organizationName}</span>
                      </div>
                    )}
                    {reviewingAnalysis.extractedFields.registrationNumber && (
                      <div className="info-item">
                        <label>Registration Number:</label>
                        <span>{reviewingAnalysis.extractedFields.registrationNumber}</span>
                      </div>
                    )}
                    {reviewingAnalysis.extractedFields.expiryDate && (
                      <div className="info-item">
                        <label>Expiry Date:</label>
                        <span>{reviewingAnalysis.extractedFields.expiryDate}</span>
                      </div>
                    )}
                    {reviewingAnalysis.extractedFields.issuingAuthority && (
                      <div className="info-item">
                        <label>Issuing Authority:</label>
                        <span>{reviewingAnalysis.extractedFields.issuingAuthority}</span>
                      </div>
                    )}
                    {reviewingAnalysis.extractedFields.address && (
                      <div className="info-item">
                        <label>Address:</label>
                        <span>{reviewingAnalysis.extractedFields.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Fraud Flags */}
              {reviewingAnalysis.flags && reviewingAnalysis.flags.length > 0 && (
                <div className="review-section flags-section">
                  <h4>🚩 Fraud Flags Detected</h4>
                  <div className="flags-list-detailed">
                    {reviewingAnalysis.flags.map((flag, idx) => (
                      <div key={idx} className="flag-item-detailed">
                        <span className="flag-icon">⚠️</span>
                        <span className="flag-text">{flag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Raw Response */}
              {reviewingAnalysis.aiRawResponse && (
                <details className="review-section ai-raw-section">
                  <summary>🔍 AI Raw Response (Click to expand)</summary>
                  <pre className="ai-raw-response">{JSON.stringify(reviewingAnalysis.aiRawResponse, null, 2)}</pre>
                </details>
              )}

              {/* Review Notes Input */}
              <div className="review-section">
                <h4>📝 Review Notes</h4>
                <textarea
                  className="review-notes-input"
                  placeholder={reviewingAnalysis.isRejected ? "Review notes (view only - already reviewed)" : "Add your review notes here... (required for rejection, optional for approval)"}
                  value={reviewingAnalysis.reviewNotes || analysisReviewNotes}
                  onChange={(e) => setAnalysisReviewNotes(e.target.value)}
                  rows={4}
                  disabled={reviewingAnalysis.isRejected || reviewingAnalysis.reviewedAt}
                />
                {reviewingAnalysis.reviewedAt && (
                  <div className="review-meta">
                    <small>Reviewed on {new Date(reviewingAnalysis.reviewedAt).toLocaleString()}</small>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowReviewAnalysisModal(false)}
              >
                Close
              </button>
              {!reviewingAnalysis.isRejected && !reviewingAnalysis.reviewedAt && (
                <>
                  <button
                    type="button"
                    className="reject-btn"
                    onClick={handleRejectFraudAnalysis}
                  >
                    ❌ Reject Organization
                  </button>
                  <button
                    type="button"
                    className="approve-btn"
                    onClick={handleApproveFraudAnalysis}
                  >
                    ✅ Approve Organization
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit User Modal (continues from line 1700...) */}

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

              {/* AI Fraud Detection Results */}
              <div className="certificate-upload-section">
                <h4>🛡️ AI Fraud Detection Results</h4>
                {reviewingOrg.certificateUrl && (
                  <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
                    <a href={reviewingOrg.certificateUrl} target="_blank" rel="noopener noreferrer" className="certificate-link">
                      📄 View Certificate
                    </a>
                  </p>
                )}
                
                {loadingFraudAnalysis ? (
                  <div className="fraud-result" style={{ padding: '2rem', textAlign: 'center' }}>
                    <div className="spinner-small"></div>
                    <p>Loading AI analysis results...</p>
                  </div>
                ) : fraudAnalysisResult ? (
                  <div className={`fraud-result risk-${fraudAnalysisResult.fraudRiskLevel?.toLowerCase()}`}>
                    <div className="result-header">
                      <h5>
                        {fraudAnalysisResult.fraudRiskLevel === 'HIGH' && '🔴'}
                        {fraudAnalysisResult.fraudRiskLevel === 'MEDIUM' && '🟡'}
                        {fraudAnalysisResult.fraudRiskLevel === 'LOW' && '🟢'}
                        {' '}AI Analysis: {fraudAnalysisResult.fraudRiskLevel} Risk
                      </h5>
                      <span className="risk-score">
                        {(fraudAnalysisResult.fraudRiskScore * 100).toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="result-details">
                      <div className="detail-item">
                        <span className="label">Similarity Score:</span>
                        <span className="value">{(fraudAnalysisResult.similarityScore * 100).toFixed(1)}%</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Flags Detected:</span>
                        <span className="value">{fraudAnalysisResult.flags?.length || 0}</span>
                      </div>
                    </div>

                    {fraudAnalysisResult.flags && fraudAnalysisResult.flags.length > 0 && (
                      <div className="flags-list">
                        <strong>⚠️ Fraud Flags:</strong>
                        <ul>
                          {fraudAnalysisResult.flags.map((flag, idx) => (
                            <li key={idx}>{flag}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {fraudAnalysisResult.extractedFields && (
                      <details className="extracted-data">
                        <summary>📋 Extracted Information</summary>
                        <div className="extracted-grid">
                          {fraudAnalysisResult.extractedFields.name && (
                            <div><strong>Name:</strong> {fraudAnalysisResult.extractedFields.name}</div>
                          )}
                          {fraudAnalysisResult.extractedFields.registrationNumber && (
                            <div><strong>Reg #:</strong> {fraudAnalysisResult.extractedFields.registrationNumber}</div>
                          )}
                          {fraudAnalysisResult.extractedFields.issuingAuthority && (
                            <div><strong>Authority:</strong> {fraudAnalysisResult.extractedFields.issuingAuthority}</div>
                          )}
                          {fraudAnalysisResult.extractedFields.expirationDate && (
                            <div><strong>Expiry:</strong> {fraudAnalysisResult.extractedFields.expirationDate}</div>
                          )}
                        </div>
                      </details>
                    )}
                    
                    {fraudAnalysisResult.createdAt && (
                      <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: '1rem' }}>
                        Analyzed: {new Date(fraudAnalysisResult.createdAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                ) : reviewingOrg.certificateUrl ? (
                  <div className="fraud-result" style={{ padding: '1.5rem', backgroundColor: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.3)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <p style={{ margin: 0, color: 'rgba(255, 193, 7, 1)' }}>
                      ⚠️ Certificate uploaded but AI analysis not available
                    </p>
                    {rescanError && (
                      <p style={{ margin: 0, color: 'rgba(255, 100, 100, 1)', fontSize: '0.85rem' }}>
                        ❌ {rescanError}
                      </p>
                    )}
                    <button
                      onClick={async () => {
                        const token = localStorage.getItem('adminToken');
                        setRescanLoading(true);
                        setRescanError(null);
                        try {
                          await fetch(`${API_BASE_URL}/org-scan-ai/rescan/${reviewingOrg._id}`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` },
                          }).then(async (res) => {
                            if (!res.ok) {
                              const body = await res.json();
                              throw new Error(body?.message || 'Rescan failed');
                            }
                          });
                          await fetchFraudAnalysisForOrg(reviewingOrg._id);
                        } catch (err) {
                          setRescanError(err.message || 'Failed to rescan');
                        } finally {
                          setRescanLoading(false);
                        }
                      }}
                      disabled={rescanLoading}
                      style={{
                        alignSelf: 'flex-start',
                        padding: '0.5rem 1.2rem',
                        backgroundColor: rescanLoading ? 'rgba(255,255,255,0.1)' : 'rgba(255, 193, 7, 0.2)',
                        border: '1px solid rgba(255, 193, 7, 0.6)',
                        borderRadius: '8px',
                        color: 'rgba(255, 193, 7, 1)',
                        cursor: rescanLoading ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                      }}
                    >
                      {rescanLoading ? '🔄 Scanning...' : '🤖 Rescan with AI'}
                    </button>
                  </div>
                ) : (
                  <div className="fraud-result" style={{ padding: '1.5rem', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)' }}>
                      ℹ️ No certificate was uploaded during organization creation
                    </p>
                  </div>
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
