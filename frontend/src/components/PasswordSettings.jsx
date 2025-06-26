import React, { useState } from 'react';
import api from '../services/api';

export default function PasswordSettings() {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match.');
            return;
        }

        if (newPassword.length < 8) {
            setError('New password must be at least 8 characters long.');
            return;
        }

        try {
            await api.post('/api/auth/change-password', { oldPassword, newPassword });
            setSuccess('Password updated successfully! Your secrets have been re-encrypted.');
            localStorage.setItem('sessionPassword', newPassword);
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError('Failed to change password. Check your old password.');
        }
    };

    return (
        <div className="max-w-md mx-auto bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-6">Change Password</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400">Current Password</label>
                    <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400">New Password</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400">Confirm New Password</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md" />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                {success && <p className="text-green-500 text-sm">{success}</p>}
                <button type="submit" className="w-full py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700">
                    Update Password
                </button>
            </form>
        </div>
    );
}
