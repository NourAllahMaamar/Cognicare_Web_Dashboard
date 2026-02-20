import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import * as XLSX from 'xlsx';
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

  // Import/Export state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importType, setImportType] = useState(''); // 'staff', 'families', 'children', 'families_children'
  const [importStep, setImportStep] = useState(1); // 1=upload, 2=mapping, 3=results
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importMappings, setImportMappings] = useState([]);
  const [importResults, setImportResults] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importDefaultPassword, setImportDefaultPassword] = useState('');
  const fileInputRef = useRef(null);
  const [openDropdown, setOpenDropdown] = useState(null); // 'staff' | 'families' | 'children' | null

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

  const fetchStaff = useCallback(async (token) => {
    setLoading(true);
    try {
      let authToken = token || localStorage.getItem('orgLeaderToken');
      let response = await fetch(`${API_BASE_URL}/organization/my-organization/staff`, {
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
        response = await fetch(`${API_BASE_URL}/organization/my-organization/staff`, {
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

  const fetchFamilies = useCallback(async (token) => {
    try {
      let authToken = token || localStorage.getItem('orgLeaderToken');
      let response = await fetch(`${API_BASE_URL}/organization/my-organization/families`, {
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
        response = await fetch(`${API_BASE_URL}/organization/my-organization/families`, {
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

  const fetchChildren = useCallback(async (token) => {
    try {
      let authToken = token || localStorage.getItem('orgLeaderToken');
      let response = await fetch(`${API_BASE_URL}/organization/my-organization/children`, {
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
        response = await fetch(`${API_BASE_URL}/organization/my-organization/children`, {
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
        // Fetch all data from API to ensure it's up-to-date
        fetchStaff(token);
        fetchFamilies(token);
        fetchChildren(token);
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

    if (!token) return;

    setLoading(true);
    try {
      // Refresh all data
      await Promise.all([
        fetchStaff(token),
        fetchFamilies(token),
        fetchChildren(token),
        fetchPendingInvitations(token),
      ]);
      setSuccessMessage(t('orgDashboard.messages.refreshed'));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to refresh data:', error);
      setError(t('orgDashboard.messages.refreshFailed'));
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      let token = localStorage.getItem('orgLeaderToken');

      // The new flow uses the same "invite" endpoint but with userData
      const inviteData = {
        email: newStaff.email,
        fullName: newStaff.fullName,
        phone: newStaff.phone,
        role: newStaff.role
      };

      let response = await fetch(`${API_BASE_URL}/organization/my-organization/staff/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(inviteData)
      });

      // If 401, try to refresh token and retry
      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (!newToken) {
          handleSessionExpired();
          return;
        }

        token = newToken;

        // Retry the request
        response = await fetch(`${API_BASE_URL}/organization/my-organization/staff/invite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(inviteData)
        });

        if (response.status === 401) {
          handleSessionExpired();
          return;
        }
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add staff member');
      }

      setSuccessMessage(t('orgDashboard.messages.staffInviteSuccess'));
      setShowAddStaffModal(false);
      setStaffEmail('');
      setNewStaff({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        role: 'psychologist'
      });

      // Refresh pending invitations and staff list
      fetchPendingInvitations(token);
      fetchStaff(token);

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

      setSuccessMessage(t('orgDashboard.messages.staffUpdateSuccess'));
      setShowAddStaffModal(false);
      setEditingStaff(null);
      setNewStaff({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        role: 'psychologist'
      });
      fetchStaff(token);

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
      fetchStaff(token);

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
      setError(t('orgDashboard.messages.orgNotFound'));
      return;
    }

    try {
      let token = localStorage.getItem('orgLeaderToken');

      let response;
      if (familyModalMode === 'create') {
        // Create new family account with children
        response = await fetch(`${API_BASE_URL}/organization/my-organization/families/create`, {
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
          response = await fetch(`${API_BASE_URL}/organization/my-organization/families/create`, {
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

      setSuccessMessage(familyModalMode === 'create' ? t('orgDashboard.messages.familyCreateSuccess') : t('orgDashboard.messages.familyInviteSuccess'));
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
        fetchFamilies(token);
        fetchChildren(token);
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

      setSuccessMessage(t('orgDashboard.messages.familyUpdateSuccess'));
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
      fetchFamilies(token);
      fetchChildren(token);

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

      setSuccessMessage(t('orgDashboard.messages.familyRemoved'));
      fetchFamilies(token);
      fetchChildren(token);

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // ─── Template Download ───────────────────────────────
  const handleDownloadTemplate = (type) => {
    const templates = {
      staff: ['Full Name', 'Email', 'Phone', 'Role', 'Password'],
      families: ['Full Name', 'Email', 'Phone', 'Password'],
      children: ['Child Name', 'Date of Birth', 'Gender', 'Parent Email', 'Diagnosis', 'Medical History', 'Allergies', 'Medications', 'Notes'],
      families_children: ['Parent Name', 'Parent Email', 'Parent Phone', 'Parent Password', 'Child Name', 'Date of Birth', 'Gender', 'Diagnosis', 'Medical History', 'Allergies', 'Medications', 'Notes'],
    };
    const cols = templates[type];
    if (!cols) return;

    const ws = XLSX.utils.aoa_to_sheet([cols]);
    // Auto-width based on header length
    ws['!cols'] = cols.map(h => ({ wch: Math.max(h.length + 4, 14) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `cognicare_${type}_template.xlsx`);
  };

  // ─── Export Handlers ───────────────────────────────
  const handleExport = (type) => {
    let data = [];
    let filename = '';

    if (type === 'staff') {
      if (staff.length === 0) {
        setError(t('orgDashboard.importExport.noData'));
        setTimeout(() => setError(''), 3000);
        return;
      }
      data = staff.map(s => ({
        'Full Name': s.fullName || '',
        'Email': s.email || '',
        'Phone': s.phone || '',
        'Role': s.role || '',
        'Joined': s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''
      }));
      filename = 'staff_export.xlsx';
    } else if (type === 'families') {
      if (families.length === 0) {
        setError(t('orgDashboard.importExport.noData'));
        setTimeout(() => setError(''), 3000);
        return;
      }
      data = families.map(f => {
        const familyId = f._id || f.id;
        const childCount = children.filter(c => {
          const pid = c.parentId?.toString() || c.parentId;
          return pid === familyId?.toString();
        }).length;
        return {
          'Full Name': f.fullName || '',
          'Email': f.email || '',
          'Phone': f.phone || '',
          'Children Count': childCount,
          'Joined': f.createdAt ? new Date(f.createdAt).toLocaleDateString() : ''
        };
      });
      filename = 'families_export.xlsx';
    } else if (type === 'children') {
      if (children.length === 0) {
        setError(t('orgDashboard.importExport.noData'));
        setTimeout(() => setError(''), 3000);
        return;
      }
      data = children.map(c => {
        const parent = families.find(f => {
          const fid = f._id?.toString() || f.id?.toString();
          const pid = c.parentId?.toString() || c.parentId;
          return fid === pid;
        });
        return {
          'Child Name': c.fullName || '',
          'Date of Birth': c.dateOfBirth ? new Date(c.dateOfBirth).toLocaleDateString() : '',
          'Gender': c.gender || '',
          'Parent Name': parent?.fullName || '',
          'Parent Email': parent?.email || '',
          'Diagnosis': c.diagnosis || '',
          'Medical History': c.medicalHistory || '',
          'Allergies': c.allergies || '',
          'Medications': c.medications || '',
          'Notes': c.notes || ''
        };
      });
      filename = 'children_export.xlsx';
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, type.charAt(0).toUpperCase() + type.slice(1));

    // Auto-width columns
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(key.length, ...data.map(row => String(row[key] || '').length)) + 2
    }));
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, filename);
    setSuccessMessage(t('orgDashboard.importExport.exportSuccess'));
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // ─── Import Handlers ───────────────────────────────
  const openImportModal = (type) => {
    setImportType(type);
    setImportStep(1);
    setImportFile(null);
    setImportPreview(null);
    setImportMappings([]);
    setImportResults(null);
    setImportLoading(false);
    setImportDefaultPassword('');
    setShowImportModal(true);
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportType('');
    setImportStep(1);
    setImportFile(null);
    setImportPreview(null);
    setImportMappings([]);
    setImportResults(null);
    setImportLoading(false);
    setImportDefaultPassword('');
  };

  const handleImportFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
  };

  const handleImportFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setImportFile(file);
  };

  const handleImportPreview = async () => {
    if (!importFile) return;

    const orgId = user?.organization?.id;
    if (!orgId) {
      setError(t('orgDashboard.messages.orgNotFound'));
      return;
    }

    setImportLoading(true);
    try {
      let token = localStorage.getItem('orgLeaderToken');
      const formData = new FormData();
      formData.append('file', importFile);

      let response = await fetch(`${API_BASE_URL}/import/preview/${orgId}/${importType}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (!newToken) { handleSessionExpired(); return; }
        token = newToken;
        response = await fetch(`${API_BASE_URL}/import/preview/${orgId}/${importType}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Preview failed');

      setImportPreview(data);
      // Initialize mappings from suggestions
      const initialMappings = (data.suggestedMappings || []).map(m => ({
        excelHeader: m.excelHeader,
        dbField: m.dbField || ''
      }));
      setImportMappings(initialMappings);
      setImportStep(2);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setImportLoading(false);
    }
  };

  const handleMappingChange = (index, newDbField) => {
    const updated = [...importMappings];
    updated[index] = { ...updated[index], dbField: newDbField };
    setImportMappings(updated);
  };

  const handleImportExecute = async () => {
    const orgId = user?.organization?.id;
    if (!orgId) {
      setError(t('orgDashboard.messages.orgNotFound'));
      return;
    }

    // Filter out unmapped columns
    const activeMappings = importMappings.filter(m => m.dbField);

    setImportLoading(true);
    try {
      let token = localStorage.getItem('orgLeaderToken');
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('importType', importType);
      formData.append('mappings', JSON.stringify(activeMappings));

      let url = `${API_BASE_URL}/import/execute/${orgId}/${importType}`;
      if (importDefaultPassword) {
        url += `?defaultPassword=${encodeURIComponent(importDefaultPassword)}`;
      }

      let response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (!newToken) { handleSessionExpired(); return; }
        token = newToken;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Import failed');

      setImportResults(data);
      setImportStep(3);

      // Refresh data
      fetchStaff(token);
      fetchFamilies(token);
      fetchChildren(token);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setImportLoading(false);
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

    if (window.confirm(t('orgDashboard.messages.confirmDeleteChild') + ` (${child.fullName})`)) {
      setChildrenToDelete([...childrenToDelete, childId]);
      setExistingChildren(existingChildren.filter((_, i) => i !== index));
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    if (!window.confirm(t('orgDashboard.invitations.cancelConfirm'))) {
      return;
    }

    try {
      let token = localStorage.getItem('orgLeaderToken');
      let response = await fetch(`${API_BASE_URL}/organization/my-organization/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (!newToken) {
          handleSessionExpired();
          return;
        }
        token = newToken;
        response = await fetch(`${API_BASE_URL}/organization/my-organization/invitations/${invitationId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }

      if (response.ok) {
        setSuccessMessage(t('dashboard.messages.inviteCancelSuccess'));
        // Optimistically remove from invitations list
        setPendingInvitations(prev => prev.filter(inv => inv._id !== invitationId));
        // Refresh both lists to ensure consistency
        fetchPendingInvitations(token);
        fetchStaff(token);
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to cancel invitation');
      }
    } catch (err) {
      setError('An error occurred while cancelling the invitation');
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
            <h1 className="dashboard-title">
              <img src="/src/assets/logo.png" alt="CogniCare Logo" className="header-logo" onError={(e) => { e.target.style.display = 'none'; }} />
              <span>CogniCare</span>
            </h1>
            <p className="dashboard-subtitle">{t('orgDashboard.subtitle')}</p>
          </div>
          <div className="header-right">
            <LanguageSwitcher />
            <div className="user-info">
              <span className="user-greeting">{t('orgDashboard.welcome')}, {user?.fullName || 'User'}</span>
              <button onClick={handleRefresh} className="refresh-button" title={t('orgDashboard.header.refresh')}>
                🔄 {t('orgDashboard.header.refresh')}
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
            {t('orgDashboard.tabs.invitations')}
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
                  <p>{t('orgDashboard.tabs.families')}</p>
                  <span className="stat-subtitle">{t('orgDashboard.stats.registeredFamilies')}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">👶</div>
                <div className="stat-info">
                  <h3>{children.length}</h3>
                  <p>{t('orgDashboard.tabs.children')}</p>
                  <span className="stat-subtitle">{t('orgDashboard.stats.underCare')}</span>
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
              <div className="header-actions">
                <div className="dropdown-wrapper">
                  <button
                    className="io-button dropdown-toggle"
                    onClick={() => setOpenDropdown(openDropdown === 'staff' ? null : 'staff')}
                    onBlur={() => setTimeout(() => setOpenDropdown(null), 200)}
                  >
                    ⚙️ {t('orgDashboard.importExport.actions')} ▾
                  </button>
                  {openDropdown === 'staff' && (
                    <div className="dropdown-menu">
                      <button onClick={() => { handleExport('staff'); setOpenDropdown(null); }}>
                        📤 {t('orgDashboard.importExport.exportStaff')}
                      </button>
                      <button onClick={() => { openImportModal('staff'); setOpenDropdown(null); }}>
                        📥 {t('orgDashboard.importExport.importStaff')}
                      </button>
                      <div className="dropdown-divider" />
                      <button onClick={() => { handleDownloadTemplate('staff'); setOpenDropdown(null); }}>
                        📋 {t('orgDashboard.importExport.downloadTemplate')}
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowAddStaffModal(true)}
                  className="add-button"
                >
                  + {t('orgDashboard.staff.addNew')}
                </button>
              </div>
            </div>

            <div className="user-grid">
              {staff.length === 0 ? (
                <div className="empty-state">
                  {t('orgDashboard.staff.emptyState')}
                </div>
              ) : (
                staff.map((member) => {
                  const memberId = member._id || member.id;
                  return (
                    <div key={memberId} className="profile-card">
                      <div className="card-header">
                        <div className="card-avatar">
                          {member.fullName?.[0]?.toUpperCase()}
                          <span className={`card-role-badge ${member.role}`}>
                            {t(`roles.${member.role}`) || member.role}
                          </span>
                        </div>
                        <h4 className="card-name">{member.fullName}</h4>
                        <a href={`mailto:${member.email}`} className="card-email">{member.email}</a>
                      </div>

                      <div className="card-body">
                        <div className="card-info-item">
                          <span className="card-info-label">📞</span>
                          <span>{member.phone || '—'}</span>
                        </div>
                        <div className="card-info-item">
                          <span className="card-info-label">📅</span>
                          <span>{new Date(member.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : (i18n.language === 'fr' ? 'fr-FR' : 'en-US'))}</span>
                        </div>
                        <div className="card-info-item">
                          <span className="card-info-label">✅</span>
                          <span className={`status-badge ${member.isConfirmed ? 'confirmed' : 'pending'}`}>
                            {member.isConfirmed ? t('orgDashboard.staff.status.confirmed') : t('orgDashboard.staff.status.pending')}
                          </span>
                        </div>
                      </div>

                      <div className="card-footer">
                        <div className="card-date">{t('orgDashboard.staff.joined')}</div>
                        <div className="card-actions">
                          <button
                            onClick={() => handleEditStaff(member)}
                            className="card-action-btn edit"
                            title={t('orgDashboard.staff.editTitle')}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleRemoveStaff(memberId)}
                            className="card-action-btn delete"
                            title={t('orgDashboard.staff.remove')}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Families Tab */}
        {activeTab === 'families' && (
          <div className="tab-content">
            <div className="content-header">
              <h2>{t('orgDashboard.families.title')}</h2>
              <div className="header-actions">
                <div className="dropdown-wrapper">
                  <button
                    className="io-button dropdown-toggle"
                    onClick={() => setOpenDropdown(openDropdown === 'families' ? null : 'families')}
                    onBlur={() => setTimeout(() => setOpenDropdown(null), 200)}
                  >
                    ⚙️ {t('orgDashboard.importExport.actions')} ▾
                  </button>
                  {openDropdown === 'families' && (
                    <div className="dropdown-menu">
                      <button onClick={() => { handleExport('families'); setOpenDropdown(null); }}>
                        📤 {t('orgDashboard.importExport.exportFamilies')}
                      </button>
                      <button onClick={() => { openImportModal('families'); setOpenDropdown(null); }}>
                        📥 {t('orgDashboard.importExport.importFamilies')}
                      </button>
                      <button onClick={() => { openImportModal('families_children'); setOpenDropdown(null); }}>
                        👨‍👧‍👦 {t('orgDashboard.importExport.importFamiliesChildren')}
                      </button>
                      <div className="dropdown-divider" />
                      <button onClick={() => { handleDownloadTemplate('families'); setOpenDropdown(null); }}>
                        📋 {t('orgDashboard.importExport.downloadTemplate')}
                      </button>
                      <button onClick={() => { handleDownloadTemplate('families_children'); setOpenDropdown(null); }}>
                        📋 {t('orgDashboard.importExport.downloadTemplateFamiliesChildren')}
                      </button>
                    </div>
                  )}
                </div>
                <button
                  className="action-button primary"
                  onClick={() => setShowAddFamilyModal(true)}
                >
                  + {t('orgDashboard.families.addNew')}
                </button>
              </div>
            </div>

            <div className="user-grid">
              {families.length === 0 ? (
                <div className="empty-state">
                  {t('orgDashboard.families.emptyState')}
                </div>
              ) : (
                families.map((family) => {
                  const familyId = family._id || family.id;
                  const familyChildrenCount = children.filter(c => {
                    const childParentId = c.parentId?.toString() || c.parentId;
                    return childParentId === familyId?.toString();
                  }).length;
                  return (
                    <div key={familyId} className="profile-card">
                      <div className="card-header">
                        <div className="card-avatar">
                          {family.fullName?.[0]?.toUpperCase()}
                          <span className="card-role-badge status-approved" style={{ background: '#10b981', color: 'white' }}>
                            {t('roles.family')}
                          </span>
                        </div>
                        <h4 className="card-name">{family.fullName}</h4>
                        <a href={`mailto:${family.email}`} className="card-email">{family.email}</a>
                      </div>

                      <div className="card-body">
                        <div className="card-info-item">
                          <span className="card-info-label">📞</span>
                          <span>{family.phone || t('orgDashboard.families.noPhone')}</span>
                        </div>
                        <div className="card-stats">
                          <div className="card-stat-box">
                            <span className="card-stat-value">{familyChildrenCount}</span>
                            <span className="card-stat-label">{t('orgDashboard.tabs.children')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="card-footer">
                        <div className="card-date">{new Date(family.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : (i18n.language === 'fr' ? 'fr-FR' : 'en-US'))}</div>
                        <div className="card-actions">
                          <button
                            onClick={() => handleEditFamily(family)}
                            className="card-action-btn edit"
                            title={t('orgDashboard.families.editTitle')}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleRemoveFamily(familyId)}
                            className="card-action-btn delete"
                            title={t('orgDashboard.families.remove')}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Children Tab */}
        {activeTab === 'children' && (
          <div className="tab-content">
            <div className="content-header">
              <h2>{t('orgDashboard.children.title')}</h2>
              <div className="header-actions">
                <div className="dropdown-wrapper">
                  <button
                    className="io-button dropdown-toggle"
                    onClick={() => setOpenDropdown(openDropdown === 'children' ? null : 'children')}
                    onBlur={() => setTimeout(() => setOpenDropdown(null), 200)}
                  >
                    ⚙️ {t('orgDashboard.importExport.actions')} ▾
                  </button>
                  {openDropdown === 'children' && (
                    <div className="dropdown-menu">
                      <button onClick={() => { handleExport('children'); setOpenDropdown(null); }}>
                        📤 {t('orgDashboard.importExport.exportChildren')}
                      </button>
                      <button onClick={() => { openImportModal('children'); setOpenDropdown(null); }}>
                        📥 {t('orgDashboard.importExport.importChildren')}
                      </button>
                      <div className="dropdown-divider" />
                      <button onClick={() => { handleDownloadTemplate('children'); setOpenDropdown(null); }}>
                        📋 {t('orgDashboard.importExport.downloadTemplate')}
                      </button>
                    </div>
                  )}
                </div>
                <p className="subtitle">{t('orgDashboard.children.total')}: {children.length}</p>
              </div>
            </div>

            <div className="user-grid">
              {children.length === 0 ? (
                <div className="empty-state">
                  {t('orgDashboard.children.emptyState')}
                </div>
              ) : (
                children.map((child) => {
                  const age = Math.floor((new Date() - new Date(child.dateOfBirth)) / 31557600000);
                  const childParentId = child.parentId?.toString() || child.parentId;
                  const parent = families.find(f => {
                    const familyId = f._id?.toString() || f.id?.toString();
                    return familyId === childParentId;
                  });

                  return (
                    <div key={child._id} className="profile-card">
                      <div className="card-header">
                        <div className="card-avatar">
                          👶
                          <span className="card-role-badge" style={{ background: '#3b82f6', color: 'white' }}>
                            {t(`orgDashboard.modal.${child.gender}`) || child.gender}
                          </span>
                        </div>
                        <h4 className="card-name">{child.fullName}</h4>
                        <p className="card-email">{age} {t('orgDashboard.children.yearsOld') || 'years old'}</p>
                      </div>

                      <div className="card-body">
                        <div className="card-info-item">
                          <span className="card-info-label">👤</span>
                          <span>{parent?.fullName || t('orgDashboard.children.unknownParent')}</span>
                        </div>
                        <div className="card-info-item">
                          <span className="card-info-label">🏥</span>
                          <span style={{ fontSize: '0.8rem' }}>{child.diagnosis || t('orgDashboard.children.noDiagnosis')}</span>
                        </div>
                        <div className="card-info-item">
                          <span className="card-info-label">📅</span>
                          <span>{new Date(child.dateOfBirth).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : (i18n.language === 'fr' ? 'fr-FR' : 'en-US'))}</span>
                        </div>
                      </div>

                      <div className="card-footer">
                        <div className="card-date">{child.allergies ? `⚠️ ${child.allergies}` : ''}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Pending Invitations Tab */}
        {activeTab === 'invitations' && (
          <div className="tab-content">
            <div className="content-header">
              <h2>{t('orgDashboard.invitations.title')}</h2>
              <p className="subtitle">{t('orgDashboard.invitations.total')}: {pendingInvitations.length}</p>
            </div>

            <div className="user-grid">
              {pendingInvitations.length === 0 ? (
                <div className="empty-state">
                  {t('orgDashboard.invitations.noInvites')}
                </div>
              ) : (
                pendingInvitations.map((invitation) => {
                  const expiresAt = new Date(invitation.expiresAt);
                  const createdAt = new Date(invitation.createdAt);
                  const isExpired = expiresAt < new Date();

                  // Debug log to check invitation data
                  console.log('Invitation data:', invitation);

                  const invType = invitation.invitationType || invitation.type || 'staff';
                  const userEmail = invitation.userEmail || invitation.email || invitation.userId?.email || 'N/A';
                  const userName = invitation.userId?.fullName || null;

                  return (
                    <div key={invitation._id || invitation.token} className="profile-card">
                      <div className="card-header">
                        <div className="card-avatar">
                          {invType === 'staff' ? '👔' : '👨‍👩‍👧‍👦'}
                          <span className={`card-role-badge status-${isExpired ? 'rejected' : 'pending'}`}
                            style={{ background: isExpired ? '#ef4444' : '#f59e0b', color: 'white' }}>
                            {invType === 'staff' ? t('orgDashboard.invitations.staff') : t('orgDashboard.invitations.family')}
                          </span>
                        </div>
                        <h4 className="card-name">{userName || (invType === 'staff' ? t('orgDashboard.invitations.staff') : t('orgDashboard.invitations.family'))}</h4>
                        <p className="card-email">{t('orgDashboard.invitations.sentDate')}: {createdAt.toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : (i18n.language === 'fr' ? 'fr-FR' : 'en-US'))}</p>
                      </div>

                      <div className="card-body">
                        <div className="card-info-item">
                          <span className="card-info-label">📧</span>
                          <span style={{ fontSize: '0.85rem', wordBreak: 'break-word' }}>{userEmail}</span>
                        </div>
                        <div className="card-info-item">
                          <span className="card-info-label">⌛</span>
                          <span className={isExpired ? 'expired-text' : ''}>
                            {t('orgDashboard.invitations.expires')}: {expiresAt.toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : (i18n.language === 'fr' ? 'fr-FR' : 'en-US'))}
                            {isExpired && ` (${t('orgDashboard.invitations.expired')})`}
                          </span>
                        </div>
                        <div className="card-info-item">
                          <span className="card-info-label">📍</span>
                          <span>{t('dashboard.organizations.status')}: {isExpired ? t('orgDashboard.invitations.expired') : t('roles.pending')}</span>
                        </div>
                      </div>

                      <div className="card-footer">
                        <button
                          className="action-button delete"
                          onClick={() => handleCancelInvitation(invitation._id)}
                          title={t('orgDashboard.invitations.cancel')}
                        >
                          {t('orgDashboard.invitations.cancel')}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
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
                  {t('orgDashboard.staff.addExisting')}
                </button>
                <button
                  type="button"
                  className={`mode-button ${staffModalMode === 'create' ? 'active' : ''}`}
                  onClick={() => setStaffModalMode('create')}
                >
                  {t('orgDashboard.staff.createNew')}
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
                    <label htmlFor="staff-fullName">{t('orgDashboard.modal.fullName')} *</label>
                    <input
                      type="text"
                      id="staff-fullName"
                      value={newStaff.fullName}
                      onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
                      placeholder={t('orgDashboard.modal.fullNamePlaceholder')}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="staff-email-new">{t('orgDashboard.modal.email')} *</label>
                    <input
                      type="email"
                      id="staff-email-new"
                      value={newStaff.email}
                      onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                      placeholder={t('orgDashboard.modal.emailPlaceholder')}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="staff-phone">{t('orgDashboard.modal.phone')}</label>
                    <input
                      type="tel"
                      id="staff-phone"
                      value={newStaff.phone}
                      onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                      placeholder={t('orgDashboard.modal.phonePlaceholder')}
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
                      <option value="psychologist">{t('roles.psychologist')}</option>
                      <option value="speech_therapist">{t('roles.speech_therapist')}</option>
                      <option value="occupational_therapist">{t('roles.occupational_therapist')}</option>
                      <option value="doctor">{t('roles.doctor')}</option>
                      <option value="volunteer">{t('roles.volunteer')}</option>
                      <option value="other">{t('roles.other')}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="staff-password">
                      {staffModalMode === 'edit' ? t('orgDashboard.modal.editTempPassword') : `${t('orgDashboard.modal.tempPassword')} *`}
                    </label>
                    <input
                      type="password"
                      id="staff-password"
                      value={newStaff.password}
                      onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                      placeholder={t('orgDashboard.modal.minCharacters')}
                      minLength="6"
                      required={staffModalMode !== 'edit'}
                    />
                    {staffModalMode !== 'edit' && (
                      <small className="form-help">{t('orgDashboard.modal.resetNotice')}</small>
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
                  {staffModalMode === 'edit' ? t('orgDashboard.modal.update') : (staffModalMode === 'create' ? t('orgDashboard.modal.create') : t('orgDashboard.modal.add'))}
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
              <h2>{familyModalMode === 'edit' ? t('orgDashboard.families.editTitle') : (familyModalMode === 'create' ? t('orgDashboard.families.createNew') : t('orgDashboard.families.addExisting'))}</h2>
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
                  {t('orgDashboard.families.addExisting')}
                </button>
                <button
                  type="button"
                  className={`mode-button ${familyModalMode === 'create' ? 'active' : ''}`}
                  onClick={() => setFamilyModalMode('create')}
                >
                  {t('orgDashboard.families.createNew')}
                </button>
              </div>
            )}

            <form onSubmit={familyModalMode === 'edit' ? handleUpdateFamily : handleAddFamily} className="modal-form">
              {familyModalMode === 'add' ? (
                <div className="form-group">
                  <label htmlFor="familyEmail">{t('orgDashboard.families.email')}</label>
                  <input
                    type="email"
                    id="familyEmail"
                    value={familyEmail}
                    onChange={(e) => setFamilyEmail(e.target.value)}
                    placeholder="parent@example.com"
                    required
                  />
                  <small className="form-help">{t('orgDashboard.modal.emailHelp')}</small>
                </div>
              ) : (
                <>
                  <h3 className="section-title">{t('orgDashboard.modal.parentInfo')}</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="family-fullName">{t('orgDashboard.modal.fullName')} *</label>
                      <input
                        type="text"
                        id="family-fullName"
                        value={newFamily.fullName}
                        onChange={(e) => setNewFamily({ ...newFamily, fullName: e.target.value })}
                        placeholder={t('orgDashboard.modal.fullNamePlaceholder')}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="family-email">{t('orgDashboard.modal.email')} *</label>
                      <input
                        type="email"
                        id="family-email"
                        value={newFamily.email}
                        onChange={(e) => setNewFamily({ ...newFamily, email: e.target.value })}
                        placeholder={t('orgDashboard.modal.emailPlaceholder')}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="family-phone">{t('orgDashboard.modal.phone')}</label>
                      <input
                        type="tel"
                        id="family-phone"
                        value={newFamily.phone}
                        onChange={(e) => setNewFamily({ ...newFamily, phone: e.target.value })}
                        placeholder="+1234567890"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="family-password">{t('orgDashboard.modal.password')} {familyModalMode === 'edit' ? `(${t('orgDashboard.modal.leaveBlank')})` : '*'}</label>
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
                          {familyModalMode === 'edit' ? t('orgDashboard.modal.manageChildren') : t('orgDashboard.modal.childrenOptional')}
                        </h3>
                        <button
                          type="button"
                          className="add-child-button"
                          onClick={handleAddChild}
                        >
                          + {t('orgDashboard.modal.addChild')}
                        </button>
                      </div>

                      {/* Existing children (edit mode only) */}
                      {familyModalMode === 'edit' && existingChildren.length > 0 && (
                        <div className="existing-children">
                          <h4 className="subsection-title">{t('orgDashboard.modal.existingChildren')}</h4>
                          {existingChildren.map((child, index) => (
                            <div key={child._id || child.id} className="child-form existing">
                              <div className="child-header">
                                <h4>{child.fullName}</h4>
                                <button
                                  type="button"
                                  className="remove-child-button delete"
                                  onClick={() => handleDeleteExistingChild(index)}
                                >
                                  {t('orgDashboard.modal.delete')}
                                </button>
                              </div>

                              <div className="form-row">
                                <div className="form-group">
                                  <label>{t('orgDashboard.modal.fullName')} *</label>
                                  <input
                                    type="text"
                                    value={child.fullName}
                                    onChange={(e) => handleExistingChildChange(index, 'fullName', e.target.value)}
                                    placeholder="Emma Smith"
                                    required
                                  />
                                </div>

                                <div className="form-group">
                                  <label>{t('orgDashboard.modal.dob')} *</label>
                                  <input
                                    type="date"
                                    value={child.dateOfBirth ? new Date(child.dateOfBirth).toISOString().split('T')[0] : ''}
                                    onChange={(e) => handleExistingChildChange(index, 'dateOfBirth', e.target.value)}
                                    required
                                  />
                                </div>

                                <div className="form-group">
                                  <label>{t('orgDashboard.modal.gender')} *</label>
                                  <select
                                    value={child.gender}
                                    onChange={(e) => handleExistingChildChange(index, 'gender', e.target.value)}
                                    required
                                  >
                                    <option value="male">{t('orgDashboard.modal.male')}</option>
                                    <option value="female">{t('orgDashboard.modal.female')}</option>
                                    <option value="other">{t('orgDashboard.modal.other')}</option>
                                  </select>
                                </div>
                              </div>

                              <div className="form-row">
                                <div className="form-group">
                                  <label>{t('orgDashboard.modal.diagnosis')}</label>
                                  <input
                                    type="text"
                                    value={child.diagnosis || ''}
                                    onChange={(e) => handleExistingChildChange(index, 'diagnosis', e.target.value)}
                                    placeholder={t('orgDashboard.modal.diagnosis')}
                                  />
                                </div>

                                <div className="form-group">
                                  <label>{t('orgDashboard.modal.allergies')}</label>
                                  <input
                                    type="text"
                                    value={child.allergies || ''}
                                    onChange={(e) => handleExistingChildChange(index, 'allergies', e.target.value)}
                                    placeholder={t('orgDashboard.modal.allergies')}
                                  />
                                </div>
                              </div>

                              <div className="form-group">
                                <label>{t('orgDashboard.modal.medicalHistory')}</label>
                                <textarea
                                  value={child.medicalHistory || ''}
                                  onChange={(e) => handleExistingChildChange(index, 'medicalHistory', e.target.value)}
                                  placeholder="Brief medical history..."
                                  rows="2"
                                />
                              </div>

                              <div className="form-group">
                                <label>{t('orgDashboard.modal.medications')}</label>
                                <input
                                  type="text"
                                  value={child.medications || ''}
                                  onChange={(e) => handleExistingChildChange(index, 'medications', e.target.value)}
                                  placeholder="e.g., Risperidone 0.5mg daily"
                                />
                              </div>

                              <div className="form-group">
                                <label>{t('orgDashboard.modal.notes')}</label>
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
                          {familyModalMode === 'edit' && <h4 className="subsection-title">{t('orgDashboard.modal.newChildrenToAdd')}</h4>}
                          {newFamily.children.map((child, index) => (
                            <div key={index} className="child-form">
                              <div className="child-header">
                                <h4>{familyModalMode === 'edit' ? `New Child ${index + 1}` : `Child ${index + 1}`}</h4>
                                <button
                                  type="button"
                                  className="remove-child-button"
                                  onClick={() => handleRemoveChild(index)}
                                >
                                  {t('orgDashboard.modal.remove')}
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
                                    <option value="male">{t('orgDashboard.modal.male')}</option>
                                    <option value="female">{t('orgDashboard.modal.female')}</option>
                                    <option value="other">{t('orgDashboard.modal.other')}</option>
                                  </select>
                                </div>
                              </div>

                              <div className="form-row">
                                <div className="form-group">
                                  <label>{t('orgDashboard.modal.diagnosis')}</label>
                                  <input
                                    type="text"
                                    value={child.diagnosis}
                                    onChange={(e) => handleChildChange(index, 'diagnosis', e.target.value)}
                                    placeholder="e.g., Autism Spectrum Disorder"
                                  />
                                </div>

                                <div className="form-group">
                                  <label>{t('orgDashboard.modal.allergies')}</label>
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
                                <label>{t('orgDashboard.modal.notes')}</label>
                                <textarea
                                  value={child.notes}
                                  onChange={(e) => handleChildChange(index, 'notes', e.target.value)}
                                  placeholder={t('orgDashboard.modal.notes')}
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
                  {t('orgDashboard.modal.cancel')}
                </button>
                <button type="submit" className="button-primary">
                  {familyModalMode === 'edit' ? t('orgDashboard.modal.update') : (familyModalMode === 'create' ? t('orgDashboard.modal.create') : t('orgDashboard.modal.add'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-overlay" onClick={closeImportModal}>
          <div className="modal-content import-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {importType === 'staff' && t('orgDashboard.importExport.importStaff')}
                {importType === 'families' && t('orgDashboard.importExport.importFamilies')}
                {importType === 'children' && t('orgDashboard.importExport.importChildren')}
                {importType === 'families_children' && t('orgDashboard.importExport.importFamiliesChildren')}
              </h2>
              <button className="close-button" onClick={closeImportModal}>&times;</button>
            </div>

            {/* Step Indicator */}
            <div className="import-steps">
              <div className={`import-step ${importStep >= 1 ? 'active' : ''} ${importStep > 1 ? 'done' : ''}`}>
                <span className="step-number">1</span>
                <span className="step-label">{t('orgDashboard.importExport.step1')}</span>
              </div>
              <div className="step-connector" />
              <div className={`import-step ${importStep >= 2 ? 'active' : ''} ${importStep > 2 ? 'done' : ''}`}>
                <span className="step-number">2</span>
                <span className="step-label">{t('orgDashboard.importExport.step2')}</span>
              </div>
              <div className="step-connector" />
              <div className={`import-step ${importStep >= 3 ? 'active' : ''}`}>
                <span className="step-number">3</span>
                <span className="step-label">{t('orgDashboard.importExport.step3')}</span>
              </div>
            </div>

            {/* Step 1: Upload */}
            {importStep === 1 && (
              <div className="import-step-content">
                <div
                  className={`drop-zone ${importFile ? 'has-file' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                  onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); }}
                  onDrop={handleImportFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleImportFileSelect}
                    style={{ display: 'none' }}
                  />
                  {importFile ? (
                    <div className="file-selected">
                      <span className="file-icon">📄</span>
                      <span className="file-name">{importFile.name}</span>
                      <button
                        className="change-file-btn"
                        onClick={(e) => { e.stopPropagation(); setImportFile(null); }}
                      >
                        {t('orgDashboard.importExport.changeFile')}
                      </button>
                    </div>
                  ) : (
                    <div className="drop-zone-content">
                      <span className="drop-icon">📁</span>
                      <p className="drop-text">{t('orgDashboard.importExport.dragDrop')}</p>
                      <p className="drop-subtext">{t('orgDashboard.importExport.acceptedFormats')}</p>
                    </div>
                  )}
                </div>

                {(importType === 'staff' || importType === 'families' || importType === 'families_children') && (
                  <div className="form-group default-password-group">
                    <label>{t('orgDashboard.importExport.defaultPassword')}</label>
                    <input
                      type="text"
                      value={importDefaultPassword}
                      onChange={(e) => setImportDefaultPassword(e.target.value)}
                      placeholder="e.g., Welcome123!"
                    />
                    <p className="field-help">{t('orgDashboard.importExport.defaultPasswordHelp')}</p>
                  </div>
                )}

                <div className="import-modal-actions">
                  <button className="button-secondary" onClick={closeImportModal}>
                    {t('orgDashboard.modal.cancel')}
                  </button>
                  <button
                    className="button-primary"
                    disabled={!importFile || importLoading}
                    onClick={handleImportPreview}
                  >
                    {importLoading ? t('orgDashboard.importExport.importing') : t('orgDashboard.importExport.next')}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Mapping */}
            {importStep === 2 && importPreview && (
              <div className="import-step-content">
                <p className="import-info">
                  {t('orgDashboard.importExport.totalRows')}: <strong>{importPreview.totalRows}</strong>
                </p>

                <div className="mapping-table-wrapper">
                  <table className="mapping-table">
                    <thead>
                      <tr>
                        <th>{t('orgDashboard.importExport.excelColumn')}</th>
                        <th>{t('orgDashboard.importExport.mapsTo')}</th>
                        <th>{t('orgDashboard.importExport.confidence')}</th>
                        <th>{t('orgDashboard.importExport.sampleData')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importMappings.map((mapping, index) => (
                        <tr key={index} className={!mapping.dbField ? 'unmapped-row' : ''}>
                          <td className="excel-header-cell">
                            <span className="excel-header-name">{mapping.excelHeader}</span>
                          </td>
                          <td>
                            <select
                              value={mapping.dbField || ''}
                              onChange={(e) => handleMappingChange(index, e.target.value)}
                              className={`mapping-select ${!mapping.dbField ? 'unmapped' : ''}`}
                            >
                              <option value="">-- {t('orgDashboard.importExport.unmapped')} --</option>
                              {importPreview.availableFields?.map((field) => (
                                <option key={field.field} value={field.field}>
                                  {field.label} {field.required ? '*' : ''}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            {mapping.confidence != null && (
                              <span className={`confidence-badge confidence-${
                                mapping.confidence >= 0.8 ? 'high' : mapping.confidence >= 0.5 ? 'medium' : 'low'
                              }`}>
                                {Math.round(mapping.confidence * 100)}%
                              </span>
                            )}
                          </td>
                          <td className="sample-data-cell">
                            {importPreview.sampleRows?.slice(0, 2).map((row, ri) => (
                              <div key={ri} className="sample-value">
                                {row[mapping.originalHeader || mapping.excelHeader] ?? '—'}
                              </div>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="import-modal-actions">
                  <button className="button-secondary" onClick={() => setImportStep(1)}>
                    {t('orgDashboard.importExport.back')}
                  </button>
                  <button
                    className="button-primary"
                    disabled={importLoading}
                    onClick={handleImportExecute}
                  >
                    {importLoading ? t('orgDashboard.importExport.importing') : t('orgDashboard.importExport.confirmImport')}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Results */}
            {importStep === 3 && importResults && (
              <div className="import-step-content">
                <div className="import-results-summary">
                  <h3>✅ {t('orgDashboard.importExport.importSuccess')}</h3>

                  <div className="results-grid">
                    <div className="result-card result-created">
                      <span className="result-number">{importResults.created ?? importResults.familiesCreated ?? 0}</span>
                      <span className="result-label">{t('orgDashboard.importExport.created')}</span>
                    </div>
                    <div className="result-card result-skipped">
                      <span className="result-number">{importResults.skipped ?? importResults.childrenSkipped ?? 0}</span>
                      <span className="result-label">{t('orgDashboard.importExport.skipped')}</span>
                    </div>
                    <div className="result-card result-errors">
                      <span className="result-number">{importResults.errors?.length ?? importResults.childrenErrors?.length ?? 0}</span>
                      <span className="result-label">{t('orgDashboard.importExport.errors')}</span>
                    </div>
                  </div>

                  {/* Children-specific results for families_children import */}
                  {importType === 'families_children' && importResults.childrenCreated != null && (
                    <div className="results-grid" style={{ marginTop: '1rem' }}>
                      <div className="result-card result-created">
                        <span className="result-number">{importResults.childrenCreated}</span>
                        <span className="result-label">{t('orgDashboard.importExport.childrenCreated')}</span>
                      </div>
                      <div className="result-card result-skipped">
                        <span className="result-number">{importResults.childrenSkipped ?? 0}</span>
                        <span className="result-label">{t('orgDashboard.importExport.childrenSkipped')}</span>
                      </div>
                      <div className="result-card result-errors">
                        <span className="result-number">{importResults.childrenErrors?.length ?? 0}</span>
                        <span className="result-label">{t('orgDashboard.importExport.childrenErrors')}</span>
                      </div>
                    </div>
                  )}

                  {/* Error details */}
                  {((importResults.errors && importResults.errors.length > 0) ||
                    (importResults.childrenErrors && importResults.childrenErrors.length > 0)) && (
                    <div className="import-error-details">
                      <h4>{t('orgDashboard.importExport.errorDetails')}</h4>
                      <div className="error-list">
                        {(importResults.errors || []).concat(importResults.childrenErrors || []).map((err, i) => {
                          const rawMsg = err.error || err.message || '';
                          let displayMsg = rawMsg;
                          if (rawMsg === 'Missing' && err.field) {
                            displayMsg = t('orgDashboard.importExport.errorMissingField', { field: err.field });
                          } else if (rawMsg.startsWith('Invalid') && err.field) {
                            displayMsg = `${rawMsg} (${err.field})`;
                          } else if (rawMsg.startsWith('Parent not found') && err.field) {
                            displayMsg = rawMsg;
                          }
                          return (
                            <div key={i} className="error-item">
                              <span className="error-row">{t('orgDashboard.importExport.row')} {err.row}</span>
                              {err.field && <span className="error-field">{err.field}</span>}
                              <span className="error-message">{displayMsg}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="import-modal-actions">
                  <button className="button-primary" onClick={closeImportModal}>
                    {t('orgDashboard.importExport.close')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default OrgLeaderDashboard;
