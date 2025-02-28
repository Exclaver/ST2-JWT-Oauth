import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import { useNavigate } from 'react-router-dom';
import '../styles/Account.css'; // We'll create this next

const Account = () => {
  const { user: authUser, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

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

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login_signup');
    } catch (error) {
      console.error('Logout failed:', error);
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

  // Calculate credit usage percentage
  const calculateCreditUsage = () => {
    // If credits_total is 0, avoid division by zero
    if (!userData.plan.credits_total) return 0;
    
    // If remaining credits exceed total, show 0% used
    if (userData.plan.credits_remaining >= userData.plan.credits_total) {
      return 0;
    }
    
    // Calculate percentage used based on remaining vs total
    const used = userData.plan.credits_total - userData.plan.credits_remaining;
    const percent = Math.round((used / userData.plan.credits_total) * 100);
    
    // Ensure we never exceed 100% for display purposes
    return Math.min(100, Math.max(0, percent));
  };
  
  const creditUsagePercent = calculateCreditUsage();

    return (
      <div className="account-container">
        <div className="account-header">
          <h1>My Account</h1>
          <button className="account-logout-button" onClick={handleLogout}>Logout</button>
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
              
              // Modify the credits header section around line 130:

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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
};

export default Account;