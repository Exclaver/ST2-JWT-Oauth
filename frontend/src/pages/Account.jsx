import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import { useNavigate } from 'react-router-dom';
import '../styles/Account.css';

const Account = () => {
  const { user: authUser, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const EXTENSION_ID = 'lamomcdfocoklbenmamelleakhmpodge';

  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        setLoading(true);
        const data = await authAPI.getProfile();
        setUserData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching account data:', err);
        setError('Failed to load your account information. Please try again later.');
        setLoading(false);
      }
    };

    fetchAccountData();
  }, []);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  const handleLogoutConfirm = async () => {
    try {
      // First notify extension to logout
      if (chrome?.runtime?.sendMessage) {
        await new Promise((resolve) => {
          chrome.runtime.sendMessage(
            EXTENSION_ID,
            { 
              action: 'storeAuthData', 
              token: null, 
              user: null 
            },
            (response) => {
              console.log('Extension notified of logout');
              resolve();
            }
          );
        });
      }
      
      // Use the AuthContext logout function which properly handles everything
      await logout();
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleUpgrade = () => {
    navigate('/plans');
  };

  if (loading) {
    return (
      <div className="account-loading">
        <div className="account-loading-spinner"></div>
        <p>Loading your account information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="account-error">
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  if (!userData) return null;

  const calculateCreditUsage = () => {
    if (!userData.plan.credits_total) return 0;
    
    if (userData.plan.credits_remaining >= userData.plan.credits_total) {
      return 0;
    }
    
    const used = userData.plan.credits_total - userData.plan.credits_remaining;
    const percent = Math.round((used / userData.plan.credits_total) * 100);
    
    return Math.min(100, Math.max(0, percent));
  };
  
  const creditUsagePercent = calculateCreditUsage();

  return (
    <div className="account-container">
      <div className="account-header">
        <h1>My Account</h1>
        <button className="account-logout-button" onClick={handleLogoutClick}>Logout</button>
      </div>

      <div className="account-section user-info">
        <h2>Personal Information</h2>
        <div className="account-user-details">
          <div className="account-user-avatar">
            {userData.full_name ? userData.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="account-user-text">
            <p className="account-user-name">{userData.full_name}</p>
            <p className="account-user-email">{userData.email}</p>
            <p className="account-user-username">Username: {userData.username}</p>
          </div>
        </div>
      </div>

      <div className="account-section plan-info">
        <div className="account-section-header">
          <h2>Subscription Plan</h2>
          <button className="account-upgrade-button" onClick={handleUpgrade}>Change Plan</button>
        </div>
        
        <div className="account-plan-card">
          <div className="account-plan-header">
            <h3 className="account-plan-name">{userData.plan.name}</h3>
            <p className="account-plan-price">${userData.plan.price}/month</p>
          </div>
          
          <div className="account-plan-details">
            <div className="account-plan-expiry">
              {userData.plan.expiry_date && (
                <>
                  <p className="account-expiry-label">Current Period Ends:</p>
                  <p className="account-expiry-date">
                    {new Date(userData.plan.expiry_date).toLocaleDateString()}
                  </p>
                  {userData.plan.days_until_renewal !== null && (
                    <p className="account-renewal-countdown">
                      {userData.plan.days_until_renewal === 0 
                        ? "Renews today" 
                        : `Renews in ${userData.plan.days_until_renewal} days`}
                    </p>
                  )}
                </>
              )}
            </div>
            
            <div className="account-credits-info">
              <div className="account-credits-header">
                <p>Credits</p>
                <p>
                  {userData.plan.credits_remaining > userData.plan.credits_total 
                    ? `${userData.plan.credits_remaining} available (Plan: ${userData.plan.credits_total})` 
                    : `${userData.plan.credits_remaining} of ${userData.plan.credits_total} available`
                  }
                </p>
              </div>
              <div className="account-credits-progress">
                <div 
                  className="account-credits-bar" 
                  style={{ width: `${creditUsagePercent}%` }}
                ></div>
              </div>
              <p className="account-credits-percentage">
                {userData.plan.credits_remaining >= userData.plan.credits_total 
                  ? `${userData.plan.credits_remaining - userData.plan.credits_total > 0 
                      ? `+${userData.plan.credits_remaining - userData.plan.credits_total} bonus credits` 
                      : "100% available"}`
                  : `${creditUsagePercent}% used`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {userData.payment_history && userData.payment_history.length > 0 && (
        <div className="account-section payment-history">
          <h2>Payment History</h2>
          <div className="account-payment-table-container">
            <table className="account-payment-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment ID</th>
                  <th>Payment Method</th>
                </tr>
              </thead>
              <tbody>
                {userData.payment_history.map(payment => (
                  <tr key={payment.id}>
                    <td>{new Date(payment.date).toLocaleDateString()}</td>
                    <td>{payment.plan}</td>
                    <td>${payment.amount.toFixed(2)}</td>
                    <td>
                      <span className={`account-status-badge ${payment.status}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="account-payment-id">{payment.razorpay_payment_id}</td>
                    <td>{payment.payment_method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="logout-confirm-overlay">
          <div className="logout-confirm-modal">
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to logout?</p>
            <div className="logout-confirm-buttons">
              <button className="confirm-btn" onClick={handleLogoutConfirm}>Yes, Logout</button>
              <button className="cancel-btn" onClick={handleLogoutCancel}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;