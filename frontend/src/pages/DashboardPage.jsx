import React, { useState, useEffect } from 'react';
import api from '../services/api';
import TwoFactorAuth from '../components/TwoFactorAuth';
import Add2FAModal from '../components/Add2FAModal';
import PasswordSettings from '../components/PasswordSettings';

export default function DashboardPage() {
    const [secrets, setSecrets] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        const fetchSecrets = async () => {
            const password = localStorage.getItem('sessionPassword');
            if (!password) {
                setError('Session expired. Please log in again.');
                setIsLoading(false);
                return;
            }
            try {
                const response = await api.post('/api/2fa/secrets', { password });
                setSecrets(response.data);
                setError('');
            } catch (err) {
                setError('Failed to fetch secrets. Incorrect password or server error.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchSecrets();
    }, []);

    const handleAddSecret = (newSecret) => {
        setSecrets([...secrets, newSecret]);
    };

    const handleDeleteSecret = async (id) => {
        try {
            await api.delete(`/api/2fa/${id}`);
            setSecrets(secrets.filter(secret => secret.id !== id));
        } catch (err) {
            setError('Failed to delete secret.');
        }
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">{showSettings ? "Settings" : "Your 2FA Codes"}</h1>
                <div>
                    <button onClick={() => setShowSettings(!showSettings)} className="mr-4 px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600">
                        {showSettings ? "Back to Codes" : "Settings"}
                    </button>
                    {!showSettings && (
                        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700">
                            Add New Code
                        </button>
                    )}
                </div>
            </div>

            {isLoading && <p>Loading...</p>}
            {error && <p className="text-red-500">{error}</p>}
            
            {!isLoading && !error && (
                showSettings ? (
                    <PasswordSettings />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {secrets.length > 0 ? secrets.map(item => (
                            <TwoFactorAuth key={item.id} item={item} onDelete={handleDeleteSecret} />
                        )) : <p>No 2FA codes found. Add one to get started.</p>}
                    </div>
                )
            )}

            <Add2FAModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onAdd={handleAddSecret} 
            />
        </div>
    );
}
