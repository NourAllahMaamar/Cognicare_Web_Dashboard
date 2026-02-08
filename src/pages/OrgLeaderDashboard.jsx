import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import './OrgLeaderDashboard.css';

function OrgLeaderDashboard() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [staff, setStaff] = useState([]);
  const [families, setFamilies] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [staffModalMode, setStaffModalMode] = useState('add'); // 'add' or 'create'
  const [familyModalMode, setFamilyModalMode] = useState('add'); // 'add' or 'create'
  const [staffEmail, setStaffEmail] = useState('');
  const [familyEmail, setFamilyEmail] = useState('');
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

  // Handle session expiration
  const handleSessionExpired = useCallback(() => {
    localStorage.removeItem('orgLeaderToken');
    localStorage.removeItem('orgLeaderUser');
    navigate('/org/login');
  }, [navigate]);

  const fetchStaff = useCallback(async (token, organizationId) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/v1/organization/${organizationId}/staff`, {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('orgLeaderToken')}`
        }
      });

      if (response.status === 401) {
        handleSessionExpired();
        return;
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
  }, [handleSessionExpired]);

  const fetchFamilies = useCallback(async (token, organizationId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/v1/organization/${organizationId}/families`, {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('orgLeaderToken')}`
        }
      });

      if (response.status === 401) {
        handleSessionExpired();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setFamilies(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch families:', err);
      setFamilies([]);
    }
  }, [handleSessionExpired]);

  const fetchChildren = useCallback(async (token, organizationId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/v1/organization/${organizationId}/children`, {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('orgLeaderToken')}`
        }
      });

      if (response.status === 401) {
        handleSessionExpired();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setChildren(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch children:', err);
      setChildren([]);
    }
  }, [handleSessionExpired]);

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
      
      // Fetch staff, families, and children for the organization
      if (parsedUser.organizationId) {
        fetchStaff(token, parsedUser.organizationId);
        fetchFamilies(token, parsedUser.organizationId);
        fetchChildren(token, parsedUser.organizationId);
      } else {
        setLoading(false);
      }
    } catch {
      navigate('/org/login');
    }
  }, [navigate, fetchStaff, fetchFamilies, fetchChildren]);

  const handleLogout = () => {
    localStorage.removeItem('orgLeaderToken');
    localStorage.removeItem('orgLeaderUser');
    navigate('/org/login');
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!user?.organizationId) {
      setError('Organization not found');
      return;
    }

    try {
      const token = localStorage.getItem('orgLeaderToken');
      
      let response;
      if (staffModalMode === 'create') {
        // Create new staff account
        response = await fetch(`http://localhost:3000/api/v1/organization/${user.organizationId}/staff/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newStaff)
        });
      } else {
        // Add existing staff by email
        response = await fetch(`http://localhost:3000/api/v1/organization/${user.organizationId}/staff`, {
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add staff member');
      }

      setSuccessMessage(staffModalMode === 'create' ? 'Staff account created successfully!' : t('orgDashboard.messages.staffAdded'));
      setShowAddStaffModal(false);
      setStaffEmail('');
      setNewStaff({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        role: 'psychologist'
      });
      fetchStaff(token, user.organizationId);
      
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

    if (!user?.organizationId) {
      setError('Organization not found');
      return;
    }

    try {
      const token = localStorage.getItem('orgLeaderToken');
      const response = await fetch(`http://localhost:3000/api/v1/organization/${user.organizationId}/staff/${staffId}`, {
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
      fetchStaff(token, user.organizationId);
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddFamily = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!user?.organizationId) {
      setError('Organization not found');
      return;
    }

    try {
      const token = localStorage.getItem('orgLeaderToken');
      
      let response;
      if (familyModalMode === 'create') {
        // Create new family account with children
        response = await fetch(`http://localhost:3000/api/v1/organization/${user.organizationId}/families/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newFamily)
        });
      } else {
        // Add existing family by email
        response = await fetch(`http://localhost:3000/api/v1/organization/${user.organizationId}/families`, {
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add family');
      }

      setSuccessMessage(familyModalMode === 'create' ? 'Family account created successfully!' : 'Family added successfully!');
      setShowAddFamilyModal(false);
      setFamilyEmail('');
      setNewFamily({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        children: []
      });
      fetchFamilies(token, user.organizationId);
      fetchChildren(token, user.organizationId);
      
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

    if (!user?.organizationId) {
      setError('Organization not found');
      return;
    }

    try {
      const token = localStorage.getItem('orgLeaderToken');
      const response = await fetch(`http://localhost:3000/api/v1/organization/${user.organizationId}/families/${familyId}`, {
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
        throw new Error(data.message || 'Failed to remove family');
      }

      setSuccessMessage('Family removed successfully!');
      fetchFamilies(token, user.organizationId);
      fetchChildren(token, user.organizationId);
      
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
            Families
          </button>
          <button
            className={`tab ${activeTab === 'children' ? 'active' : ''}`}
            onClick={() => setActiveTab('children')}
          >
            Children
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
                    staff.map((member) => (
                      <tr key={member._id}>
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
                            onClick={() => handleRemoveStaff(member._id)}
                            className="action-button delete"
                            title={t('orgDashboard.staff.remove')}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))
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
              <h2>Families</h2>
              <button
                className="action-button primary"
                onClick={() => setShowAddFamilyModal(true)}
              >
                + Add Family
              </button>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Parent Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Children Count</th>
                    <th>Joined Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {families.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-state">
                        No families registered yet
                      </td>
                    </tr>
                  ) : (
                    families.map((family) => (
                      <tr key={family._id}>
                        <td>{family.fullName}</td>
                        <td>{family.email}</td>
                        <td>{family.phone || 'N/A'}</td>
                        <td>{family.childrenIds?.length || 0}</td>
                        <td>{new Date(family.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button
                            onClick={() => handleRemoveFamily(family._id)}
                            className="action-button delete"
                            title="Remove family"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))
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
              <h2>Children Under Care</h2>
              <p className="subtitle">Total children: {children.length}</p>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Child Name</th>
                    <th>Gender</th>
                    <th>Date of Birth</th>
                    <th>Age</th>
                    <th>Diagnosis</th>
                    <th>Parent</th>
                  </tr>
                </thead>
                <tbody>
                  {children.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-state">
                        No children registered yet
                      </td>
                    </tr>
                  ) : (
                    children.map((child) => {
                      const age = Math.floor((new Date() - new Date(child.dateOfBirth)) / 31557600000);
                      const parent = families.find(f => f._id === child.parentId?.toString());
                      return (
                        <tr key={child._id}>
                          <td>{child.fullName}</td>
                          <td>{child.gender}</td>
                          <td>{new Date(child.dateOfBirth).toLocaleDateString()}</td>
                          <td>{age} years</td>
                          <td>{child.diagnosis || 'N/A'}</td>
                          <td>{parent?.fullName || 'Unknown'}</td>
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
        <div className="modal-overlay" onClick={() => setShowAddStaffModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{staffModalMode === 'create' ? 'Create Staff Account' : t('orgDashboard.modal.addStaff')}</h2>
              <button
                onClick={() => {
                  setShowAddStaffModal(false);
                  setStaffModalMode('add');
                }}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            {/* Mode Selector */}
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

            <form onSubmit={handleAddStaff} className="modal-form">
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
                    <label htmlFor="staff-password">Temporary Password *</label>
                    <input
                      type="password"
                      id="staff-password"
                      value={newStaff.password}
                      onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                      minLength="6"
                      required
                    />
                    <small className="form-help">User will be asked to change on first login</small>
                  </div>
                </>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddStaffModal(false);
                    setStaffModalMode('add');
                  }}
                  className="button-secondary"
                >
                  {t('orgDashboard.modal.cancel')}
                </button>
                <button type="submit" className="button-primary">
                  {staffModalMode === 'create' ? 'Create Account' : t('orgDashboard.modal.add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Family Modal */}
      {showAddFamilyModal && (
        <div className="modal-overlay" onClick={() => setShowAddFamilyModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{familyModalMode === 'create' ? 'Create Family Account' : 'Add Family to Organization'}</h2>
              <button
                className="modal-close"
                onClick={() => {
                  setShowAddFamilyModal(false);
                  setFamilyModalMode('add');
                }}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            {/* Mode Selector */}
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

            <form onSubmit={handleAddFamily} className="modal-form">
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
                      <label htmlFor="family-password">Temporary Password *</label>
                      <input
                        type="password"
                        id="family-password"
                        value={newFamily.password}
                        onChange={(e) => setNewFamily({ ...newFamily, password: e.target.value })}
                        placeholder="Minimum 6 characters"
                        minLength="6"
                        required
                      />
                    </div>
                  </div>

                  <div className="children-section">
                    <div className="section-header">
                      <h3 className="section-title">Children (Optional)</h3>
                      <button
                        type="button"
                        className="add-child-button"
                        onClick={handleAddChild}
                      >
                        + Add Child
                      </button>
                    </div>

                    {newFamily.children.map((child, index) => (
                      <div key={index} className="child-form">
                        <div className="child-header">
                          <h4>Child {index + 1}</h4>
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
                </>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddFamilyModal(false);
                    setFamilyModalMode('add');
                  }}
                  className="button-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="button-primary">
                  {familyModalMode === 'create' ? 'Create Family & Children' : 'Add Family'}
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
