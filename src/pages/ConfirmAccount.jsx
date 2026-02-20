import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import './ConfirmAccount.css';

const ConfirmAccount = () => {
    const [searchParams] = useSearchParams();
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const t = searchParams.get('token');
        if (t) {
            setToken(t);
        } else {
            setError('Invalid or missing activation token.');
        }
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE_URL}/auth/activate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to activate account. The link may have expired.');
            }

            setSuccess(true);
            setTimeout(() => {
                navigate('/org/login');
            }, 3000);
        } catch (err) {
            setError(err.message || 'Failed to activate account.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="confirm-container">
                <div className="confirm-card">
                    <div className="success-icon">✓</div>
                    <h1>Account Activated!</h1>
                    <p>Your account has been successfully confirmed. You will be redirected to the login page in a few seconds...</p>
                    <button className="confirm-btn" onClick={() => navigate('/org/login')}>
                        Go to Login Now
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="confirm-container">
            <div className="confirm-card">
                <h1>Activate Your Account</h1>
                <p>Please set a password for your new CogniCare specialist account.</p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min 6 characters"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repeat your password"
                            required
                        />
                    </div>
                    <button className="confirm-btn" disabled={loading || !token}>
                        {loading ? 'Activating...' : 'Activate Account'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ConfirmAccount;
