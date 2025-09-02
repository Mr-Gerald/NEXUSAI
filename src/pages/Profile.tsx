import React, { useState, useRef } from 'react';
// FIX: Use relative paths for component, context, and type imports.
import Card from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types';
import { CameraIcon } from '../components/icons/CameraIcon';

const Profile: React.FC = () => {
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState<Partial<User>>(user || {});
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!user) {
        return <div className="text-center text-gray-400">Please log in to view your profile.</div>;
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, profilePicture: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        setSuccess('');
        try {
            const response = await fetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: user.id, ...formData }),
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to update profile.');
            }
            updateUser(data.user);
            setSuccess('Profile updated successfully!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsSaving(false);
        }
    };


    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <h2 className="text-3xl font-black text-white mb-4 text-glow-accent">User Profile</h2>
            <p className="text-lg text-[var(--color-text-secondary)] mb-8">
                Manage your personal information and preferences.
            </p>
            <Card>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="relative">
                            <img 
                                src={formData.profilePicture || `https://i.pravatar.cc/150?u=${user.username}`} 
                                alt="Profile" 
                                className="w-32 h-32 rounded-full object-cover border-4 border-[var(--color-border)]"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-1 right-1 bg-[var(--color-accent)] text-white p-2 rounded-full hover:opacity-90 transition-opacity"
                                aria-label="Change profile picture"
                            >
                                <CameraIcon className="w-5 h-5" />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>
                        <div className="flex-grow w-full">
                             <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-[var(--color-text-secondary)]">Full Name</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    id="fullName"
                                    value={formData.fullName || ''}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] sm:text-sm"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label htmlFor="username" className="block text-sm font-medium text-[var(--color-text-secondary)]">Username</label>
                            <input
                                type="text"
                                name="username"
                                id="username"
                                value={formData.username || ''}
                                onChange={handleInputChange}
                                className="mt-1 block w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text-secondary)]">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                value={formData.email || ''}
                                onChange={handleInputChange}
                                className="mt-1 block w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] sm:text-sm"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-4">
                        {error && <p className="text-sm text-[var(--color-accent-red)]">{error}</p>}
                        {success && <p className="text-sm text-[var(--color-accent-green)]">{success}</p>}
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="bg-[var(--color-accent)] text-white font-bold py-2 px-6 rounded-lg hover:opacity-90 disabled:opacity-50"
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default Profile;