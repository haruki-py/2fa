import React, { useState } from 'react';
import api from '../services/api';

export default function Add2FAModal({ isOpen, onClose, onAdd }) {
    const [serviceName, setServiceName] = useState('');
    const [secret, setSecret] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const password = localStorage.getItem('sessionPassword');
        if (!password) {
            setError('Session expired. Please log in again.');
            return;
        }

        try {
            await api.post('/api/2fa', { serviceName, secret, password });
            window.location.reload();
            onClose();
        } catch (err) {
            setError('Failed to add new code. Please check your secret.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Add New 2FA Code</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-400 mb-1">Service Name</label>
                        <input type="text" value={serviceName} onChange={(e) => setServiceName(e.target.value)} required className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none"/>
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-400 mb-1">Secret Key</label>
                        <input type="text" value={secret} onChange={(e) => setSecret(e.target.value)} required className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none"/>
                    </div>
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700">Add</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
