import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import ThemeToggle from '../../components/ui/ThemeToggle';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';

function detectRole(pathname) {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/org')) return 'orgLeader';
  return 'specialist';
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { pathname } = useLocation();
  const role = detectRole(pathname);
  const { getUser, authMutate } = useAuth(role);

  const user = getUser();
  const [profileForm, setProfileForm] = useState({ fullName: user?.fullName || '', phone: user?.phone || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileForm.fullName.trim()) { setProfileMsg({ type: 'error', text: 'Name is required' }); return; }
    setProfileLoading(true);
    try {
      const result = await authMutate('/auth/profile', { method: 'PATCH', body: { fullName: profileForm.fullName.trim(), phone: profileForm.phone.trim() } });
      // Update stored user
      const keys = { admin: 'adminUser', orgLeader: 'orgLeaderUser', specialist: 'specialistUser' };
      const stored = JSON.parse(localStorage.getItem(keys[role]) || '{}');
      localStorage.setItem(keys[role], JSON.stringify({ ...stored, fullName: profileForm.fullName.trim(), phone: profileForm.phone.trim() }));
      setProfileMsg({ type: 'success', text: t('settings.profileSaved', 'Profile updated successfully') });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile' });
    }
    setProfileLoading(false);
    setTimeout(() => setProfileMsg({ type: '', text: '' }), 4000);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 6) { setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters' }); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { setPasswordMsg({ type: 'error', text: 'Passwords do not match' }); return; }
    setPasswordLoading(true);
    try {
      await authMutate('/auth/change-password', { method: 'PATCH', body: { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword } });
      setPasswordMsg({ type: 'success', text: t('settings.passwordChanged', 'Password changed successfully') });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to change password' });
    }
    setPasswordLoading(false);
    setTimeout(() => setPasswordMsg({ type: '', text: '' }), 4000);
  };

  const inputCls = 'w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-colors';

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('settings.title', 'Settings')}</h2>
        <p className="text-slate-500 dark:text-text-muted mt-1">{t('settings.subtitle', 'Manage your preferences and account settings.')}</p>
      </div>

      {/* Profile */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">person</span>
          {t('settings.profile', 'Profile')}
        </h3>
        {profileMsg.text && (
          <div className={`p-3 rounded-lg text-sm font-medium mb-4 ${profileMsg.type === 'error' ? 'bg-error/10 text-error' : 'bg-success/10 text-success'}`}>{profileMsg.text}</div>
        )}
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('settings.fullName', 'Full Name')}</label>
            <input type="text" value={profileForm.fullName} onChange={e => setProfileForm({ ...profileForm, fullName: e.target.value })} className={inputCls} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('settings.email', 'Email')}</label>
            <input type="email" value={user?.email || ''} disabled className={`${inputCls} opacity-60 cursor-not-allowed`} />
            <p className="text-xs text-slate-400 mt-1">{t('settings.emailHint', 'Contact support to change your email')}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('settings.phone', 'Phone')}</label>
            <input type="tel" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} className={inputCls} placeholder="+1 234 567 890" />
          </div>
          <button type="submit" disabled={profileLoading} className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50">
            {profileLoading ? t('settings.saving', 'Saving...') : t('settings.saveProfile', 'Save Profile')}
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">lock</span>
          {t('settings.changePassword', 'Change Password')}
        </h3>
        {passwordMsg.text && (
          <div className={`p-3 rounded-lg text-sm font-medium mb-4 ${passwordMsg.type === 'error' ? 'bg-error/10 text-error' : 'bg-success/10 text-success'}`}>{passwordMsg.text}</div>
        )}
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('settings.currentPassword', 'Current Password')}</label>
            <input type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} className={inputCls} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('settings.newPassword', 'New Password')}</label>
            <input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className={inputCls} required minLength={6} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('settings.confirmPassword', 'Confirm New Password')}</label>
            <input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} className={inputCls} required minLength={6} />
          </div>
          <button type="submit" disabled={passwordLoading} className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50">
            {passwordLoading ? t('settings.changing', 'Changing...') : t('settings.updatePassword', 'Update Password')}
          </button>
        </form>
      </div>

      {/* Appearance */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">palette</span>
          {t('settings.appearance', 'Appearance')}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-sm font-medium">{t('settings.darkMode', 'Dark Mode')}</p>
              <p className="text-xs text-slate-500 dark:text-text-muted">{t('settings.darkModeDesc', 'Toggle between light and dark theme')}</p>
            </div>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium">{t('settings.language', 'Language')}</p>
              <p className="text-xs text-slate-500 dark:text-text-muted">{t('settings.languageDesc', 'Choose your preferred language')}</p>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">info</span>
          {t('settings.accountInfo', 'Account Information')}
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500">{t('settings.role', 'Role')}</span>
            <span className="font-medium capitalize">{user?.role?.replace(/_/g, ' ') || role}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500">{t('settings.userId', 'User ID')}</span>
            <span className="font-mono text-xs text-slate-400">{user?._id || user?.id || '—'}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-slate-500">{t('settings.verified', 'Verified')}</span>
            <span className={`inline-flex items-center gap-1 font-medium ${user?.isVerified ? 'text-success' : 'text-warning'}`}>
              <span className="material-symbols-outlined text-sm">{user?.isVerified ? 'check_circle' : 'pending'}</span>
              {user?.isVerified ? t('settings.yes', 'Yes') : t('settings.no', 'No')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
