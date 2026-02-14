import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { API_BASE_URL } from '../../config';
import './OrgLeaderDashboard.css';

function OrgLeaderDashboard() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [staff, setStaff] = useState([]);
  const [families, setFamilies] = useState([]);
  const [children, setChildren] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [staffModalMode, setStaffModalMode] = useState('add'); // 'add', 'create', or 'edit'
  const [familyModalMode, setFamilyModalMode] = useState('add'); // 'add', 'create', or 'edit'
  const [staffEmail, setStaffEmail] = useState('');
  const [familyEmail, setFamilyEmail] = useState('');
  const [editingStaff, setEditingStaff] = useState(null);
  const [editingFamily, setEditingFamily] = useState(null);
  const [existingChildren, setExistingChildren] = useState([]);
  const [childrenToDelete, setChildrenToDelete] = useState([]);
  const [newStaff, setNewStaff] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'psychologist'
  });
  const [newFamily, setNewFamily] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    children: []
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  // Refresh access token using refresh token
  const refreshAccessToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('orgLeaderRefreshToken');
      if (!refreshToken) {
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      // Store new tokens
      localStorage.setItem('orgLeaderToken', data.accessToken);
      localStorage.setItem('orgLeaderRefreshToken', data.refreshToken);
      
      return data.accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }, []);

  // Handle session expiration
  const handleSessionExpired = useCallback(() => {
    localStorage.removeItem('orgLeaderToken');
    localStorage.removeItem('orgLeaderRefreshToken');
    localStorage.removeItem('orgLeaderUser');
    navigate('/org/login');
  }, [navigate]);

  const fetchStaff = useCallback(async (token, organizationId) => {
    setLoading(true);
    try {
      let authToken = token || localStorage.getItem('orgLeaderToken');
      let response = await fetch(`${API_BASE_URL}/organization/${organizationId}/staff`, {
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
        response = await fetch(`${API_BASE_URL}/organization/${organizationId}/staff`, {
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
        setStaff(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch staff:', err);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, [handleSessionExpired, refreshAccessToken]);

  const fetchFamilies = useCallback(async (token, organizationId) => {
    try {
      let authToken = token || localStorage.getItem('orgLeaderToken');
      let response = await fetch(`${API_BASE_URL}/organization/${organizationId}/families`, {
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
        response = await fetch(`${API_BASE_URL}/organization/${organizationId}/families`, {
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
        setFamilies(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch families:', err);
      setFamilies([]);
    }
  }, [handleSessionExpired, refreshAccessToken]);

  const fetchChildren = useCallback(async (token, organizationId) => {
    try {
      let authToken = token || localStorage.getItem('orgLeaderToken');
      let response = await fetch(`${API_BASE_URL}/organization/${organizationId}/children`, {
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
        response = await fetch(`${API_BASE_URL}/organization/${organizationId}/children`, {
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
        setChildren(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch children:', err);
      setChildren([]);
    }
  }, [handleSessionExpired, refreshAccessToken]);

  const fetchPendingInvitations = useCallback(async (token) => {
    try {
      let authToken = token || localStorage.getItem('orgLeaderToken');
      let response = await fetch(`${API_BASE_URL}/organization/my-organization/invitations`, {
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
        response = await fetch(`${API_BASE_URL}/organization/my-organization/invitations`, {
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
        setPendingInvitations(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch pending invitations:', err);
      setPendingInvitations([]);
    }
  }, [handleSessionExpired, refreshAccessToken]);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('orgLeaderToken');
    const userData = localStorage.getItem('orgLeaderUser');

    if (!token || !userData) {
      navigate('/org/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'organization_leader') {
        navigate('/org/login');
        return;
      }
      setUser(parsedUser);
      
      // Fetch fresh data from API if organization exists
      if (parsedUser.organization) {
        const orgId = parsedUser.organization.id;
        
        // Fetch all data from API to ensure it's up-to-date
        fetchStaff(token, orgId);
        fetchFamilies(token, orgId);
        fetchChildren(token, orgId);
        fetchPendingInvitations(token);
      } else {
        setLoading(false);
      }
    } catch {
      navigate('/org/login');
    }
  }, [navigate, fetchPendingInvitations, fetchStaff, fetchFamilies, fetchChildren]);

  const handleLogout = () => {
    localStorage.removeItem('orgLeaderToken');
    localStorage.removeItem('orgLeaderUser');
    navigate('/org/login');
  };

  const handleRefresh = async () => {
    const token = localStorage.getItem('orgLeaderToken');
    const organizationId = user?.organization?.id;
    
    if (!token || !organizationId) return;
    
    setLoading(true);
    try {
      // Refresh all data
      await Promise.all([
        fetchStaff(token, organizationId),
        fetchFamilies(token, organizationId),
        fetchChildren(token, organizationId),
        fetchPendingInvitations(token),
      ]);
      setSuccessMessage('Data refreshed successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to refresh data:', error);
      setError('Failed to refresh data');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const organizationId = user?.organization?.id;
    if (!organizationId) {
      setError('Organization not found');
      return;
    }

    try {
      let token = localStorage.getItem('orgLeaderToken');
      
      let response;
      if (staffModalMode === 'create') {
        // Create new staff account
        response = await fetch(`${API_BASE_URL}/organization/${organizationId}/staff/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newStaff)
        });
      } else {
        // Invite existing staff by email - sends invitation
        response = await fetch(`${API_BASE_URL}/organization/my-organization/staff/invite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ email: staffEmail })
        });
      }

      // If 401, try to refresh token and retry
      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (!newToken) {
          handleSessionExpired();
          return;
        }
        
        token = newToken;
        
        // Retry the request
        if (staffModalMode === 'create') {
          response = await fetch(`${API_BASE_URL}/organization/${organizationId}/staff/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newStaff)
          });
        } else {
          response = await fetch(`${API_BASE_URL}/organization/${organizationId}/staff`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ email: staffEmail })
          });
        }
        
        if (response.status === 401) {
          handleSessionExpired();
          return;
        }
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add staff member');
      }

      setSuccessMessage(staffModalMode === 'create' ? 'Staff account created successfully!' : 'Invitation sent successfully! The user will receive an email to accept.');
      setShowAddStaffModal(false);
      setStaffEmail('');
      setNewStaff({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        role: 'psychologist'
      });
      if (staffModalMode === 'create') {
        fetchStaff(token, user?.organization?.id);
      } else {
        // Refresh pending invitations for 'add' mode
        fetchPendingInvitations(token);
      }
      
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditStaff = (staff) => {
    setEditingStaff(staff);
    setNewStaff({
      fullName: staff.fullName || '',
      email: staff.email || '',
      phone: staff.phone || '',
      password: '', // Don't show existing password
      role: staff.role || 'psychologist'
    });
    setStaffModalMode('edit');
    setShowAddStaffModal(true);
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      let token = localStorage.getItem('orgLeaderToken');
      const updateData = {
        fullName: newStaff.fullName,
        email: newStaff.email,
        phone: newStaff.phone,
        role: newStaff.role
      };

      let response = await fetch(`${API_BASE_URL}/organization/my-organization/staff/${editingStaff._id || editingStaff.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      // If 401, try to refresh token and retry
      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (!newToken) {
          handleSessionExpired();
          return;
        }
        
        token = newToken;
        
        // Retry the request with new token
        response = await fetch(`${API_BASE_URL}/organization/my-organization/staff/${editingStaff._id || editingStaff.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updateData)
        });
        
        // If still 401, logout
        if (response.status === 401) {
          handleSessionExpired();
          return;
        }
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update staff member');
      }

      setSuccessMessage('Staff member updated successfully!');
      setShowAddStaffModal(false);
      setEditingStaff(null);
      setNewStaff({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        role: 'psychologist'
      });
      fetchStaff(token, user?.organization?.id);
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveStaff = async (staffId) => {
    if (!window.confirm(t('orgDashboard.staff.removeConfirm'))) {
      return;
    }

    setError('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('orgLeaderToken');
      const response = await fetch(`${API_BASE_URL}/organization/my-organization/staff/${staffId}`, {
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
        throw new Error(data.message || 'Failed to remove staff member');
      }

      setSuccessMessage(t('orgDashboard.messages.staffRemoved'));
      fetchStaff(token, user?.organization?.id);
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddFamily = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const organizationId = user?.organization?.id;
    if (!organizationId) {
      setError('Organization not found');
      return;
    }

    try {
      let token = localStorage.getItem('orgLeaderToken');
      
      let response;
      if (familyModalMode === 'create') {
        // Create new family account with children
        response = await fetch(`${API_BASE_URL}/organization/${organizationId}/families/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newFamily)
        });
      } else {
        // Invite existing family by email - sends invitation
        response = await fetch(`${API_BASE_URL}/organization/my-organization/families/invite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ email: familyEmail })
        });
      }

      // If 401, try to refresh token and retry
      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (!newToken) {
          handleSessionExpired();
          return;
        }
        
        token = newToken;
        
        // Retry the request
        if (familyModalMode === 'create') {
          response = await fetch(`${API_BASE_URL}/organization/${organizationId}/families/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newFamily)
          });
        } else {
          response = await fetch(`${API_BASE_URL}/organization/my-organization/families/invite`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ email: familyEmail })
          });
        }
        
        if (response.status === 401) {
          handleSessionExpired();
          return;
        }
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add family');
      }

      setSuccessMessage(familyModalMode === 'create' ? 'Family account created successfully!' : 'Invitation sent successfully! The family will receive an email to accept.');
      setShowAddFamilyModal(false);
      setFamilyEmail('');
      setNewFamily({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        children: []
      });
      if (familyModalMode === 'create') {
        fetchFamilies(token, user?.organization?.id);
        fetchChildren(token, user?.organization?.id);
      } else {
        // Refresh pending invitations for 'add' mode
        fetchPendingInvitations(token);
      }
      
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditFamily = (family) => {
    setEditingFamily(family);
    setNewFamily({
      fullName: family.fullName || '',
      email: family.email || '',
      phone: family.phone || '',
      password: '', // Don't show existing password
      children: []
    });
    
    // Fetch existing children for this family
    const familyId = family._id || family.id;
    const familyChildren = children.filter(c => {
      const childParentId = c.parentId?.toString() || c.parentId;
      return childParentId === familyId?.toString();
    });
    setExistingChildren(familyChildren);
    setChildrenToDelete([]);
    
    setFamilyModalMode('edit');
    setShowAddFamilyModal(true);
  };

  const handleUpdateFamily = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      let token = localStorage.getItem('orgLeaderToken');
      const familyId = editingFamily._id || editingFamily.id;
      
      // 1. Update family info
      const updateData = {
        fullName: newFamily.fullName,
        email: newFamily.email,
        phone: newFamily.phone
      };

      let response = await fetch(`${API_BASE_URL}/organization/my-organization/families/${familyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      // If 401, try to refresh token and retry
      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (!newToken) {
          handleSessionExpired();
          return;
        }
        
        token = newToken;
        
        // Retry the request with new token
        response = await fetch(`${API_BASE_URL}/organization/my-organization/families/${familyId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updateData)
        });
        
        // If still 401, logout
        if (response.status === 401) {
          handleSessionExpired();
          return;
        }
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update family');
      }

      // 2. Delete marked children
      for (const childId of childrenToDelete) {
        await fetch(`${API_BASE_URL}/organization/my-organization/families/${familyId}/children/${childId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }

      // 3. Update existing children
      for (const child of existingChildren) {
        if (child._modified) {
          const childId = child._id || child.id;
          // eslint-disable-next-line no-unused-vars
          const { _id, id, _modified, parentId, organizationId, createdAt, updatedAt, __v, ...childData } = child;
          
          await fetch(`${API_BASE_URL}/organization/my-organization/families/${familyId}/children/${childId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(childData)
          });
        }
      }

      // 4. Add new children
      for (const child of newFamily.children) {
        await fetch(`${API_BASE_URL}/organization/my-organization/families/${familyId}/children`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(child)
        });
      }

      setSuccessMessage('Family and children updated successfully!');
      setShowAddFamilyModal(false);
      setEditingFamily(null);
      setExistingChildren([]);
      setChildrenToDelete([]);
      setNewFamily({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        children: []
      });
      fetchFamilies(token, user?.organization?.id);
      fetchChildren(token, user?.organization?.id);
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveFamily = async (familyId) => {
    if (!window.confirm('Are you sure you want to remove this family from the organization?')) {
      return;
    }

    setError('');
    setSuccessMessage('');

    try {
      let token = localStorage.getItem('orgLeaderToken');
      let response = await fetch(`${API_BASE_URL}/organization/my-organization/families/${familyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // If 401, try to refresh token and retry
      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (!newToken) {
          handleSessionExpired();
          return;
        }
        
        token = newToken;
        
        // Retry the request with new token
        response = await fetch(`${API_BASE_URL}/organization/my-organization/families/${familyId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // If still 401, logout
        if (response.status === 401) {
          handleSessionExpired();
          return;
        }
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to remove family');
      }

      setSuccessMessage('Family removed successfully!');
      fetchFamilies(token, user?.organization?.id);
      fetchChildren(token, user?.organization?.id);
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddChild = () => {
    setNewFamily({
      ...newFamily,
      children: [
        ...newFamily.children,
        {
          fullName: '',
          dateOfBirth: '',
          gender: 'male',
          diagnosis: '',
          medicalHistory: '',
          allergies: '',
          medications: '',
          notes: ''
        }
      ]
    });
  };

  const handleRemoveChild = (index) => {
    setNewFamily({
      ...newFamily,
      children: newFamily.children.filter((_, i) => i !== index)
    });
  };

  const handleChildChange = (index, field, value) => {
    const updatedChildren = [...newFamily.children];
    updatedChildren[index][field] = value;
    setNewFamily({ ...newFamily, children: updatedChildren });
  };

  const handleExistingChildChange = (index, field, value) => {
    const updatedChildren = [...existingChildren];
    updatedChildren[index][field] = value;
    updatedChildren[index]._modified = true; // Mark as modified
    setExistingChildren(updatedChildren);
  };

  const handleDeleteExistingChild = (index) => {
    const child = existingChildren[index];
    const childId = child._id || child.id;
    
    if (window.confirm(`Are you sure you want to delete ${child.fullName}?`)) {
      setChildrenToDelete([...childrenToDelete, childId]);
      setExistingChildren(existingChildren.filter((_, i) => i !== index));
    }
  };

  if (loading) {
    return (
      <div className="org-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>{t('orgDashboard.loading')}</p>
      </div>
    );
  }

  return (
    <div className="org-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="dashboard-title">{t('orgDashboard.title')}</h1>
            <p className="dashboard-subtitle">{t('orgDashboard.subtitle')}</p>
          </div>
          <div className="header-right">
            <LanguageSwitcher />
            <div className="user-info">
              <span className="user-greeting">{t('orgDashboard.welcome')}, {user?.fullName || 'User'}</span>
              <button onClick={handleRefresh} className="refresh-button" title="Refresh data">
                🔄 Refresh
              </button>
              <button onClick={handleLogout} className="logout-button">
                {t('orgDashboard.logout')}
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
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Tabs */}
        <div className="dashboard-tabs">
          <button
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            {t('orgDashboard.tabs.overview')}
          </button>
          <button
            className={`tab ${activeTab === 'staff' ? 'active' : ''}`}
            onClick={() => setActiveTab('staff')}
          >
            {t('orgDashboard.tabs.staff')}
          </button>
          <button
            className={`tab ${activeTab === 'families' ? 'active' : ''}`}
            onClick={() => setActiveTab('families')}
          >
            {t('orgDashboard.tabs.families')}
          </button>
          <button
            className={`tab ${activeTab === 'children' ? 'active' : ''}`}
            onClick={() => setActiveTab('children')}
          >
            {t('orgDashboard.tabs.children')}
          </button>
          <button
            className={`tab ${activeTab === 'invitations' ? 'active' : ''}`}
            onClick={() => setActiveTab('invitations')}
          >
            Pending Invitations
            {pendingInvitations.length > 0 && (
              <span className="badge">{pendingInvitations.length}</span>
            )}
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="tab-content">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>{staff.length}</h3>
                  <p>{t('orgDashboard.stats.totalStaff')}</p>
                  <span className="stat-subtitle">{t('orgDashboard.stats.activeMembers')}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🧠</div>
                <div className="stat-info">
                  <h3>{staff.filter(s => s.role === 'psychologist').length}</h3>
                  <p>{t('orgDashboard.stats.psychologists')}</p>
                  <span className="stat-subtitle">{t('orgDashboard.stats.mentalHealth')}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">💬</div>
                <div className="stat-info">
                  <h3>{staff.filter(s => s.role === 'speech_therapist').length}</h3>
                  <p>{t('orgDashboard.stats.speechTherapists')}</p>
                  <span className="stat-subtitle">{t('orgDashboard.stats.communication')}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-info">
                  <h3>{staff.filter(s => s.role === 'occupational_therapist').length}</h3>
                  <p>{t('orgDashboard.stats.occupationalTherapists')}</p>
                  <span className="stat-subtitle">{t('orgDashboard.stats.motorSkills')}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">⚕️</div>
                <div className="stat-info">
                  <h3>{staff.filter(s => s.role === 'doctor').length}</h3>
                  <p>{t('orgDashboard.stats.doctors')}</p>
                  <span className="stat-subtitle">{t('orgDashboard.stats.medicalProfessionals')}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🤝</div>
                <div className="stat-info">
                  <h3>{staff.filter(s => s.role === 'volunteer' || s.role === 'other').length}</h3>
                  <p>{t('orgDashboard.stats.volunteers')}</p>
                  <span className="stat-subtitle">{t('orgDashboard.stats.communityHelpers')}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">👨‍👩‍👧‍👦</div>
                <div className="stat-info">
                  <h3>{families.length}</h3>
                  <p>Families</p>
                  <span className="stat-subtitle">Registered families</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">👶</div>
                <div className="stat-info">
                  <h3>{children.length}</h3>
                  <p>Children</p>
                  <span className="stat-subtitle">Under care</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Staff Management Tab */}
        {activeTab === 'staff' && (
          <div className="tab-content">
            <div className="content-header">
              <h2>{t('orgDashboard.staff.title')}</h2>
              <button
                onClick={() => setShowAddStaffModal(true)}
                className="add-button"
              >
                + {t('orgDashboard.staff.addNew')}
              </button>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('orgDashboard.staff.name')}</th>
                    <th>{t('orgDashboard.staff.email')}</th>
                    <th>{t('orgDashboard.staff.role')}</th>
                    <th>{t('orgDashboard.staff.joined')}</th>
                    <th>{t('orgDashboard.staff.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-state">
                        No staff members yet. Add your first staff member!
                      </td>
                    </tr>
                  ) : (
                    staff.map((member) => {
                      const memberId = member._id || member.id;
                      return (
                        <tr key={memberId}>
                          <td>{member.fullName}</td>
                          <td>{member.email}</td>
                          <td>
                            <span className={`role-badge ${member.role}`}>
                              {t(`dashboard.roles.${member.role}`)}
                            </span>
                          </td>
                          <td>{new Date(member.createdAt).toLocaleDateString()}</td>
                          <td>
                            <button
                              onClick={() => handleEditStaff(member)}
                              className="action-button edit"
                              title="Edit staff member"
                              style={{ marginRight: '8px' }}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleRemoveStaff(memberId)}
                              className="action-button delete"
                              title={t('orgDashboard.staff.remove')}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Families Tab */}
        {activeTab === 'families' && (
          <div className="tab-content">
            <div className="content-header">
              <h2>{t('orgDashboard.families.title')}</h2>
              <button
                className="action-button primary"
                onClick={() => setShowAddFamilyModal(true)}
              >
                + {t('orgDashboard.families.addNew')}
              </button>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('orgDashboard.families.parentName')}</th>
                    <th>{t('orgDashboard.families.email')}</th>
                    <th>{t('orgDashboard.families.phone')}</th>
                    <th>{t('orgDashboard.families.childrenCount')}</th>
                    <th>{t('orgDashboard.families.joined')}</th>
                    <th>{t('orgDashboard.families.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {families.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-state">
                        {t('orgDashboard.families.emptyState')}
                      </td>
                    </tr>
                  ) : (
                    families.map((family) => {
                      const familyId = family._id || family.id;
                      const familyChildrenCount = children.filter(c => {
                        const childParentId = c.parentId?.toString() || c.parentId;
                        return childParentId === familyId?.toString();
                      }).length;
                      return (
                        <tr key={familyId}>
                          <td>{family.fullName}</td>
                          <td>{family.email}</td>
                          <td>{family.phone || t('orgDashboard.families.noPhone')}</td>
                          <td>{familyChildrenCount}</td>
                          <td>{new Date(family.createdAt).toLocaleDateString()}</td>
                          <td>
                            <button
                              onClick={() => handleEditFamily(family)}
                              className="action-button edit"
                              title="Edit family"
                              style={{ marginRight: '8px' }}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleRemoveFamily(familyId)}
                              className="action-button delete"
                              title={t('orgDashboard.families.remove')}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Children Tab */}
        {activeTab === 'children' && (
          <div className="tab-content">
            <div className="content-header">
              <h2>{t('orgDashboard.children.title')}</h2>
              <p className="subtitle">{t('orgDashboard.children.total')}: {children.length}</p>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('orgDashboard.children.childName')}</th>
                    <th>{t('orgDashboard.children.gender')}</th>
                    <th>{t('orgDashboard.children.dateOfBirth')}</th>
                    <th>{t('orgDashboard.children.age')}</th>
                    <th>{t('orgDashboard.children.diagnosis')}</th>
                    <th>{t('orgDashboard.children.parent')}</th>
                  </tr>
                </thead>
                <tbody>
                  {children.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-state">
                        {t('orgDashboard.children.emptyState')}
                      </td>
                    </tr>
                  ) : (
                    children.map((child) => {
                      const age = Math.floor((new Date() - new Date(child.dateOfBirth)) / 31557600000);
                      // Handle both 'id' (from login response) and '_id' (from API fetch)
                      const childParentId = child.parentId?.toString() || child.parentId;
                      const parent = families.find(f => {
                        const familyId = f._id?.toString() || f.id?.toString();
                        return familyId === childParentId;
                      });
                      return (
                        <tr key={child._id || child.id}>
                          <td>{child.fullName}</td>
                          <td>{child.gender}</td>
                          <td>{new Date(child.dateOfBirth).toLocaleDateString()}</td>
                          <td>{age} years</td>
                          <td>{child.diagnosis || t('orgDashboard.children.noDiagnosis')}</td>
                          <td>{parent?.fullName || t('orgDashboard.children.unknownParent')}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pending Invitations Tab */}
        {activeTab === 'invitations' && (
          <div className="tab-content">
            <div className="content-header">
              <h2>Pending Invitations</h2>
              <p className="subtitle">Total Pending: {pendingInvitations.length}</p>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Type</th>
                    <th>Invited On</th>
                    <th>Expires</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingInvitations.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-state">
                        No pending invitations
                      </td>
                    </tr>
                  ) : (
                    pendingInvitations.map((invitation) => {
                      const expiresAt = new Date(invitation.expiresAt);
                      const createdAt = new Date(invitation.createdAt);
                      const isExpired = expiresAt < new Date();
                      
                      return (
                        <tr key={invitation._id || invitation.token}>
                          <td>{invitation.userEmail}</td>
                          <td>
                            <span className={`role-badge ${invitation.invitationType}`}>
                              {invitation.invitationType === 'staff' ? '👔 Staff' : '👨‍👩‍👧‍👦 Family'}
                            </span>
                          </td>
                          <td>{createdAt.toLocaleDateString()}</td>
                          <td>
                            <span className={isExpired ? 'expired-text' : ''}>
                              {expiresAt.toLocaleDateString()}
                              {isExpired && ' (Expired)'}
                            </span>
                          </td>
                          <td>
                            <span className="status-badge pending">
                              ⏳ Pending
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="modal-overlay" onClick={() => {
          setShowAddStaffModal(false);
          setStaffModalMode('add');
          setEditingStaff(null);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{staffModalMode === 'edit' ? 'Edit Staff Member' : (staffModalMode === 'create' ? 'Create Staff Account' : t('orgDashboard.modal.addStaff'))}</h2>
              <button
                onClick={() => {
                  setShowAddStaffModal(false);
                  setStaffModalMode('add');
                  setEditingStaff(null);
                }}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            {/* Mode Selector - hide in edit mode */}
            {staffModalMode !== 'edit' && (
              <div className="mode-selector">
                <button
                  type="button"
                  className={`mode-button ${staffModalMode === 'add' ? 'active' : ''}`}
                  onClick={() => setStaffModalMode('add')}
                >
                  Add Existing User
                </button>
                <button
                  type="button"
                  className={`mode-button ${staffModalMode === 'create' ? 'active' : ''}`}
                  onClick={() => setStaffModalMode('create')}
                >
                  Create New Account
                </button>
              </div>
            )}

            <form onSubmit={staffModalMode === 'edit' ? handleUpdateStaff : handleAddStaff} className="modal-form">
              {staffModalMode === 'add' ? (
                <div className="form-group">
                  <label htmlFor="staff-email">{t('orgDashboard.modal.email')}</label>
                  <input
                    type="email"
                    id="staff-email"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder={t('orgDashboard.modal.email')}
                    required
                  />
                  <small className="form-help">{t('orgDashboard.modal.emailHelp')}</small>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label htmlFor="staff-fullName">Full Name *</label>
                    <input
                      type="text"
                      id="staff-fullName"
                      value={newStaff.fullName}
                      onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
                      placeholder="Dr. Sarah Johnson"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="staff-email-new">Email *</label>
                    <input
                      type="email"
                      id="staff-email-new"
                      value={newStaff.email}
                      onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                      placeholder="sarah.johnson@example.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="staff-phone">Phone</label>
                    <input
                      type="tel"
                      id="staff-phone"
                      value={newStaff.phone}
                      onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                      placeholder="+1234567890"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="staff-role">Role *</label>
                    <select
                      id="staff-role"
                      value={newStaff.role}
                      onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                      required
                    >
                      <option value="psychologist">Psychologist</option>
                      <option value="speech_therapist">Speech Therapist</option>
                      <option value="occupational_therapist">Occupational Therapist</option>
                      <option value="doctor">Doctor</option>
                      <option value="volunteer">Volunteer</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="staff-password">Temporary Password {staffModalMode === 'edit' ? '(leave blank to keep current)' : '*'}</label>
                    <input
                      type="password"
                      id="staff-password"
                      value={newStaff.password}
                      onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                      minLength="6"
                      required={staffModalMode !== 'edit'}
                    />
                    {staffModalMode !== 'edit' && (
                      <small className="form-help">User will be asked to change on first login</small>
                    )}
                  </div>
                </>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddStaffModal(false);
                    setStaffModalMode('add');
                    setEditingStaff(null);
                  }}
                  className="button-secondary"
                >
                  {t('orgDashboard.modal.cancel')}
                </button>
                <button type="submit" className="button-primary">
                  {staffModalMode === 'edit' ? 'Update Staff' : (staffModalMode === 'create' ? 'Create Account' : t('orgDashboard.modal.add'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Family Modal */}
      {showAddFamilyModal && (
        <div className="modal-overlay" onClick={() => {
          setShowAddFamilyModal(false);
          setFamilyModalMode('add');
          setEditingFamily(null);
          setExistingChildren([]);
          setChildrenToDelete([]);
        }}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{familyModalMode === 'edit' ? 'Edit Family Member' : (familyModalMode === 'create' ? 'Create Family Account' : 'Add Family to Organization')}</h2>
              <button
                className="modal-close"
                onClick={() => {
                  setShowAddFamilyModal(false);
                  setFamilyModalMode('add');
                  setEditingFamily(null);
                  setExistingChildren([]);
                  setChildrenToDelete([]);
                }}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            {/* Mode Selector - hide in edit mode */}
            {familyModalMode !== 'edit' && (
              <div className="mode-selector">
                <button
                  type="button"
                  className={`mode-button ${familyModalMode === 'add' ? 'active' : ''}`}
                  onClick={() => setFamilyModalMode('add')}
                >
                  Add Existing Family
                </button>
                <button
                  type="button"
                  className={`mode-button ${familyModalMode === 'create' ? 'active' : ''}`}
                  onClick={() => setFamilyModalMode('create')}
                >
                  Create New Family
                </button>
              </div>
            )}

            <form onSubmit={familyModalMode === 'edit' ? handleUpdateFamily : handleAddFamily} className="modal-form">
              {familyModalMode === 'add' ? (
                <div className="form-group">
                  <label htmlFor="familyEmail">Family Parent Email</label>
                  <input
                    type="email"
                    id="familyEmail"
                    value={familyEmail}
                    onChange={(e) => setFamilyEmail(e.target.value)}
                    placeholder="parent@example.com"
                    required
                  />
                  <small className="form-help">Enter the email of the family's parent user</small>
                </div>
              ) : (
                <>
                  <h3 className="section-title">Parent Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="family-fullName">Full Name *</label>
                      <input
                        type="text"
                        id="family-fullName"
                        value={newFamily.fullName}
                        onChange={(e) => setNewFamily({ ...newFamily, fullName: e.target.value })}
                        placeholder="John Smith"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="family-email">Email *</label>
                      <input
                        type="email"
                        id="family-email"
                        value={newFamily.email}
                        onChange={(e) => setNewFamily({ ...newFamily, email: e.target.value })}
                        placeholder="john.smith@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="family-phone">Phone</label>
                      <input
                        type="tel"
                        id="family-phone"
                        value={newFamily.phone}
                        onChange={(e) => setNewFamily({ ...newFamily, phone: e.target.value })}
                        placeholder="+1234567890"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="family-password">Temporary Password {familyModalMode === 'edit' ? '(leave blank to keep current)' : '*'}</label>
                      <input
                        type="password"
                        id="family-password"
                        value={newFamily.password}
                        onChange={(e) => setNewFamily({ ...newFamily, password: e.target.value })}
                        placeholder="Minimum 6 characters"
                        minLength="6"
                        required={familyModalMode !== 'edit'}
                      />
                    </div>
                  </div>

                  {/* Children section - show in both create and edit mode */}
                  {(familyModalMode === 'create' || familyModalMode === 'edit') && (
                    <div className="children-section">
                      <div className="section-header">
                        <h3 className="section-title">
                          {familyModalMode === 'edit' ? 'Manage Children' : 'Children (Optional)'}
                        </h3>
                        <button
                          type="button"
                          className="add-child-button"
                          onClick={handleAddChild}
                        >
                          + Add Child
                        </button>
                      </div>

                      {/* Existing children (edit mode only) */}
                      {familyModalMode === 'edit' && existingChildren.length > 0 && (
                        <div className="existing-children">
                          <h4 className="subsection-title">Existing Children</h4>
                          {existingChildren.map((child, index) => (
                            <div key={child._id || child.id} className="child-form existing">
                              <div className="child-header">
                                <h4>{child.fullName}</h4>
                                <button
                                  type="button"
                                  className="remove-child-button delete"
                                  onClick={() => handleDeleteExistingChild(index)}
                                >
                                  Delete
                                </button>
                              </div>

                              <div className="form-row">
                                <div className="form-group">
                                  <label>Full Name *</label>
                                  <input
                                    type="text"
                                    value={child.fullName}
                                    onChange={(e) => handleExistingChildChange(index, 'fullName', e.target.value)}
                                    placeholder="Emma Smith"
                                    required
                                  />
                                </div>

                                <div className="form-group">
                                  <label>Date of Birth *</label>
                                  <input
                                    type="date"
                                    value={child.dateOfBirth ? new Date(child.dateOfBirth).toISOString().split('T')[0] : ''}
                                    onChange={(e) => handleExistingChildChange(index, 'dateOfBirth', e.target.value)}
                                    required
                                  />
                                </div>

                                <div className="form-group">
                                  <label>Gender *</label>
                                  <select
                                    value={child.gender}
                                    onChange={(e) => handleExistingChildChange(index, 'gender', e.target.value)}
                                    required
                                  >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                  </select>
                                </div>
                              </div>

                              <div className="form-row">
                                <div className="form-group">
                                  <label>Diagnosis</label>
                                  <input
                                    type="text"
                                    value={child.diagnosis || ''}
                                    onChange={(e) => handleExistingChildChange(index, 'diagnosis', e.target.value)}
                                    placeholder="e.g., Autism Spectrum Disorder"
                                  />
                                </div>

                                <div className="form-group">
                                  <label>Allergies</label>
                                  <input
                                    type="text"
                                    value={child.allergies || ''}
                                    onChange={(e) => handleExistingChildChange(index, 'allergies', e.target.value)}
                                    placeholder="e.g., Peanuts, dairy"
                                  />
                                </div>
                              </div>

                              <div className="form-group">
                                <label>Medical History</label>
                                <textarea
                                  value={child.medicalHistory || ''}
                                  onChange={(e) => handleExistingChildChange(index, 'medicalHistory', e.target.value)}
                                  placeholder="Brief medical history..."
                                  rows="2"
                                />
                              </div>

                              <div className="form-group">
                                <label>Current Medications</label>
                                <input
                                  type="text"
                                  value={child.medications || ''}
                                  onChange={(e) => handleExistingChildChange(index, 'medications', e.target.value)}
                                  placeholder="e.g., Risperidone 0.5mg daily"
                                />
                              </div>

                              <div className="form-group">
                                <label>Notes</label>
                                <textarea
                                  value={child.notes || ''}
                                  onChange={(e) => handleExistingChildChange(index, 'notes', e.target.value)}
                                  placeholder="Additional notes..."
                                  rows="2"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* New children to add */}
                      {newFamily.children.length > 0 && (
                        <div className="new-children">
                          {familyModalMode === 'edit' && <h4 className="subsection-title">New Children to Add</h4>}
                          {newFamily.children.map((child, index) => (
                            <div key={index} className="child-form">
                              <div className="child-header">
                                <h4>{familyModalMode === 'edit' ? `New Child ${index + 1}` : `Child ${index + 1}`}</h4>
                                <button
                                  type="button"
                                  className="remove-child-button"
                                  onClick={() => handleRemoveChild(index)}
                                >
                                  Remove
                                </button>
                              </div>

                              <div className="form-row">
                                <div className="form-group">
                                  <label>Full Name *</label>
                                  <input
                                    type="text"
                                    value={child.fullName}
                                    onChange={(e) => handleChildChange(index, 'fullName', e.target.value)}
                                    placeholder="Emma Smith"
                                    required
                                  />
                                </div>

                                <div className="form-group">
                                  <label>Date of Birth *</label>
                                  <input
                                    type="date"
                                    value={child.dateOfBirth}
                                    onChange={(e) => handleChildChange(index, 'dateOfBirth', e.target.value)}
                                    required
                                  />
                                </div>

                                <div className="form-group">
                                  <label>Gender *</label>
                                  <select
                                    value={child.gender}
                                    onChange={(e) => handleChildChange(index, 'gender', e.target.value)}
                                    required
                                  >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                  </select>
                                </div>
                              </div>

                              <div className="form-row">
                                <div className="form-group">
                                  <label>Diagnosis</label>
                                  <input
                                    type="text"
                                    value={child.diagnosis}
                                    onChange={(e) => handleChildChange(index, 'diagnosis', e.target.value)}
                                    placeholder="e.g., Autism Spectrum Disorder"
                                  />
                                </div>

                                <div className="form-group">
                                  <label>Allergies</label>
                                  <input
                                    type="text"
                                    value={child.allergies}
                                    onChange={(e) => handleChildChange(index, 'allergies', e.target.value)}
                                    placeholder="e.g., Peanuts, dairy"
                                  />
                                </div>
                              </div>

                              <div className="form-group">
                                <label>Medical History</label>
                                <textarea
                                  value={child.medicalHistory}
                                  onChange={(e) => handleChildChange(index, 'medicalHistory', e.target.value)}
                                  placeholder="Brief medical history..."
                                  rows="2"
                                />
                              </div>

                              <div className="form-group">
                                <label>Current Medications</label>
                                <input
                                  type="text"
                                  value={child.medications}
                                  onChange={(e) => handleChildChange(index, 'medications', e.target.value)}
                                  placeholder="e.g., Risperidone 0.5mg daily"
                                />
                              </div>

                              <div className="form-group">
                                <label>Notes</label>
                                <textarea
                                  value={child.notes}
                                  onChange={(e) => handleChildChange(index, 'notes', e.target.value)}
                                  placeholder="Additional notes..."
                                  rows="2"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddFamilyModal(false);
                    setFamilyModalMode('add');
                    setEditingFamily(null);
                    setExistingChildren([]);
                    setChildrenToDelete([]);
                  }}
                  className="button-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="button-primary">
                  {familyModalMode === 'edit' ? 'Update Family' : (familyModalMode === 'create' ? 'Create Family & Children' : 'Add Family')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrgLeaderDashboard;
