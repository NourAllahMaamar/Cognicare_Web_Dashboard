import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

function AdminDashboard() {
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
  const navigate = useNavigate();

  // Handle session expiration
  const handleSessionExpired = useCallback(() => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  }, [navigate]);

  const fetchUsers = useCallback(async (token) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/v1/users', {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('adminToken')}`
        }
      });

      if (response.status === 401) {
        handleSessionExpired();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, [handleSessionExpired]);

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
    } catch {
      navigate('/admin/login');
    }
  }, [navigate, fetchUsers]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
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

      setSuccessMessage('User created successfully!');
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

      setSuccessMessage('User updated successfully!');
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
    if (!window.confirm('Are you sure you want to delete this user?')) {
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

      setSuccessMessage('User deleted successfully!');
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
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <h1>🧠 CogniCare Admin</h1>
        </div>
        <div className="nav-actions">
          <span className="user-name">{user.fullName}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>

      {successMessage && (
        <div className="success-banner">
          <span className="success-icon">✓</span>
          {successMessage}
        </div>
      )}

      <div className="dashboard-content">
        <header className="dashboard-header">
          <h2>Welcome back, {user.fullName?.split(' ')[0]}! 👋</h2>
          <p className="dashboard-subtitle">Manage your CogniCare platform</p>
        </header>

        <div className="dashboard-tabs">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            User Management
          </button>
        </div>

        {activeTab === 'overview' && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>Total Users</h3>
                  <p className="stat-value">{stats.total}</p>
                  <span className="stat-change positive">Active accounts</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">👨‍👩‍👧‍👦</div>
                <div className="stat-info">
                  <h3>Family Accounts</h3>
                  <p className="stat-value">{stats.families}</p>
                  <span className="stat-change">Regular users</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">👨‍⚕️</div>
                <div className="stat-info">
                  <h3>Healthcare Providers</h3>
                  <p className="stat-value">{stats.doctors}</p>
                  <span className="stat-change">Medical professionals</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🤝</div>
                <div className="stat-info">
                  <h3>Volunteers</h3>
                  <p className="stat-value">{stats.volunteers}</p>
                  <span className="stat-change">Community helpers</span>
                </div>
              </div>
            </div>

            <div className="dashboard-grid">
              <section className="dashboard-section">
                <h3 className="section-title">Quick Actions</h3>
                <div className="actions-grid">
                  <button className="action-card" onClick={() => {
                    setActiveTab('users');
                    setShowAddUserModal(true);
                  }}>
                    <span className="action-icon">➕</span>
                    <span>Add User</span>
                  </button>
                  <button className="action-card" onClick={() => setActiveTab('users')}>
                    <span className="action-icon">👥</span>
                    <span>Manage Users</span>
                  </button>
                  <button className="action-card">
                    <span className="action-icon">📈</span>
                    <span>View Reports</span>
                  </button>
                  <button className="action-card">
                    <span className="action-icon">⚙️</span>
                    <span>Settings</span>
                  </button>
                </div>
              </section>
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <div className="users-section">
            <div className="users-header">
              <h3 className="section-title">User Management</h3>
              <button className="add-user-btn" onClick={() => setShowAddUserModal(true)}>
                ➕ Add New User
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
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Actions</th>
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
                              title="Edit user"
                            >
                              ✏️
                            </button>
                            <button
                              className="delete-btn"
                              onClick={() => handleDeleteUser(u._id)}
                              title="Delete user"
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
      </div>

      {/* Add/Edit User Modal */}
      {(showAddUserModal || editingUser) && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingUser ? 'Edit User' : 'Add New User'}</h3>
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
                <label htmlFor="fullName">Full Name</label>
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
                <label htmlFor="email">Email</label>
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
                <label htmlFor="phone">Phone (optional)</label>
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
                  <label htmlFor="password">Password</label>
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
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                >
                  <option value="family">Family</option>
                  <option value="doctor">Doctor</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingUser ? 'Update User' : 'Create User'}
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
