import React, { useState, useMemo } from 'react';
import Layout from '../components/layout/Layout';
import authAPI from '../api/auth';
import usersAPI from '../api/users';
import { useDispatch } from 'react-redux';
import { clearAuth } from '../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChanging, setIsChanging] = useState(false);

  // Deactivate
  const [deactivatePassword, setDeactivatePassword] = useState('');
  const [isDeactivating, setIsDeactivating] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Inline validation helpers
  const nameValid = name.length === 0 || name.trim().length >= 2;
  const bioValid = bio.length <= 500;
  const passwordStrength = useMemo(() => {
    if (!newPassword) return 'empty';
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[a-z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    if (score >= 4) return 'strong';
    if (score >= 3) return 'medium';
    return 'weak';
  }, [newPassword]);
  const passwordsMatch = !newPassword || newPassword === confirmPassword;


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const formData = new FormData();
      if (name) formData.append('name', name);
      if (bio) formData.append('bio', bio);
      if (avatar) formData.append('avatar', avatar);
      await authAPI.updateProfile(formData);
      setSuccess('Profile updated successfully');
      toast.success('Profile updated');
    } catch (e) {
      const msg = e?.response?.data?.error || e.message || 'Failed to update profile';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('Please enter current and new password');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setIsChanging(true);
    try {
      await authAPI.changePassword({ currentPassword, newPassword, confirmPassword });
      toast.success('Password changed. Please log in again.');
      // Clear auth and redirect to login
      dispatch(clearAuth());
      navigate('/login');
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message || 'Failed to change password');
    } finally {
      setIsChanging(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleDeactivate = async (e) => {
    e.preventDefault();
    if (!deactivatePassword) {
      toast.error('Password is required');
      return;
    }
    if (!window.confirm('This will deactivate your account. Continue?')) return;
    setIsDeactivating(true);
    try {
      await usersAPI.deactivateAccount(deactivatePassword);
      toast.success('Account deactivated');
      dispatch(clearAuth());
      navigate('/');
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message || 'Failed to deactivate account');
    } finally {
      setIsDeactivating(false);
      setDeactivatePassword('');
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>

        {/* Profile */}
        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your name"
            />
            {!nameValid && (
              <p className="mt-1 text-sm text-red-600">Name must be at least 2 characters.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="Tell us about yourself"
            />
            {!bioValid && (
              <p className="mt-1 text-sm text-red-600">Bio cannot exceed 500 characters.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Avatar</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAvatar(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-gray-700 dark:text-gray-300"
            />
          </div>

          {error && <div className="text-red-600">{error}</div>}
          {success && <div className="text-green-600">{success}</div>}

          <button
            type="submit"
            disabled={isSaving || !nameValid || !bioValid}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-6 py-2 rounded-lg"
          >
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>

        {/* Change Password */}
        <form onSubmit={handleChangePassword} className="space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Change Password</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
              {newPassword && (
                <p className={`mt-1 text-xs ${passwordStrength === 'strong' ? 'text-green-600' : passwordStrength === 'medium' ? 'text-yellow-600' : 'text-red-600'}`}>
                  Strength: {passwordStrength}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Re-enter new password"
                autoComplete="new-password"
              />
              {newPassword && !passwordsMatch && (
                <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={isChanging || (newPassword && !passwordsMatch)}
            className="bg-gray-900 hover:bg-black disabled:opacity-60 text-white px-6 py-2 rounded-lg"
          >
            {isChanging ? 'Changing…' : 'Change Password'}
          </button>
        </form>

        {/* Deactivate Account */}
        <form onSubmit={handleDeactivate} className="space-y-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-red-600">Deactivate Account</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">This will deactivate your account. You can contact support to reactivate.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm with Password</label>
            <input
              type="password"
              value={deactivatePassword}
              onChange={(e) => setDeactivatePassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 focus:ring-red-500 focus:border-red-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={isDeactivating}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-6 py-2 rounded-lg"
          >
            {isDeactivating ? 'Deactivating…' : 'Deactivate Account'}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default SettingsPage;
