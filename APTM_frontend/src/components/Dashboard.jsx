import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { user, signOut, getAvatarUrl, refreshUserData } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const [profileVerified, setProfileVerified] = useState(false);
  const [stats, setStats] = useState({
    totalBalance: 0,
    pendingBalance: 0,
    availableBalance: 0,
    totalTrades: 0,
    winRate: 0,
    activeDays: 0,
    portfolioValue: 0,
    dailyChange: 0,
    monthlyProgress: 0
  });

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profile/complete', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Dashboard user data:', data);
        
        if (data.success && data.user) {
          setUserData(data.user);
          
          // Check if profile is complete
          checkProfileCompletion(data.user);
          
          // Load user stats from backend data
          loadUserStats(data.user);
        }
      } else {
        console.error('Failed to fetch user data:', response.status);
        // Fallback to basic user data from auth context
        if (user) {
          setUserData({
            profile: {},
            settings: {},
            subscription: { plan: 'free', status: 'active' }
          });
          loadBasicStats();
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Fallback to basic user data from auth context
      if (user) {
        setUserData({
          profile: {},
          settings: {},
          subscription: { plan: 'free', status: 'active' }
        });
        loadBasicStats();
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = (userData) => {
    const profile = userData.profile || {};
    const profileStats = profile.stats || {};
    
    // Use actual data from backend only
    const userStats = {
      totalBalance: profileStats.totalBalance || 0,
      pendingBalance: profileStats.pendingBalance || 0,
      availableBalance: profileStats.availableBalance || 0,
      totalTrades: profileStats.tradesCompleted || 0,
      winRate: profileStats.successRate || 0,
      activeDays: calculateActiveDays(profileStats.joinDate),
      portfolioValue: profileStats.portfolioValue || 0,
      dailyChange: profileStats.dailyChange || 0,
      monthlyProgress: calculateMonthlyProgress(profileStats.joinDate)
    };

    setStats(userStats);
  };

  const loadBasicStats = () => {
    // Basic stats when backend data is not available - all zeros
    const basicStats = {
      totalBalance: 0,
      pendingBalance: 0,
      availableBalance: 0,
      totalTrades: 0,
      winRate: 0,
      activeDays: 0,
      portfolioValue: 0,
      dailyChange: 0,
      monthlyProgress: 0
    };
    setStats(basicStats);
  };

  const calculateActiveDays = (joinDate) => {
    if (!joinDate) return 0;
    const join = new Date(joinDate);
    const today = new Date();
    const diffTime = Math.abs(today - join);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateMonthlyProgress = (joinDate) => {
    if (!joinDate) return 0;
    const join = new Date(joinDate);
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    if (join > monthStart) {
      const monthTime = today - monthStart;
      const joinedTime = today - join;
      return Math.min(100, (joinedTime / monthTime) * 100);
    }
    return 100;
  };

  const checkProfileCompletion = (userData) => {
    const profile = userData.profile || {};
    
    // Profile completion check based on actual required fields
    const requiredFields = {
      'First Name': profile.firstName,
      'Last Name': profile.lastName,
      'Username': profile.username,
      'Trading Experience': profile.tradingExperience,
      'Interests': profile.interests?.length > 0
    };

    const filledFields = Object.values(requiredFields).filter(field => field && field !== '').length;
    const totalFields = Object.keys(requiredFields).length;
    const completionRate = Math.round((filledFields / totalFields) * 100);
    
    setProfileComplete(completionRate >= 80);
    setProfileVerified(profile.verificationStatus === 'verified');
  };

  const getProfileCompletionPercentage = () => {
    if (!userData?.profile) return 0;
    
    const profile = userData.profile;
    const fields = [
      profile.firstName,
      profile.lastName,
      profile.username,
      profile.bio,
      profile.phone,
      profile.country,
      profile.tradingExperience,
      profile.interests?.length > 0,
      profile.codingExperience,
      profile.gender,
      profile.address?.city,
      profile.dateOfBirth
    ];

    const filledFields = fields.filter(field => field && field !== '').length;
    return Math.round((filledFields / fields.length) * 100);
  };

  const getMissingFields = () => {
    if (!userData?.profile) return ['Complete your profile to see missing fields'];
    
    const profile = userData.profile;
    const missing = [];
    
    if (!profile.firstName) missing.push('First Name');
    if (!profile.lastName) missing.push('Last Name');
    if (!profile.username) missing.push('Username');
    if (!profile.tradingExperience) missing.push('Trading Experience');
    if (!profile.interests?.length) missing.push('Interests');
    if (!profile.bio || profile.bio.length < 10) missing.push('Bio (min 10 chars)');
    
    return missing.length > 0 ? missing : ['All required fields completed!'];
  };

  const handleRefresh = async () => {
    await fetchUserData();
    if (refreshUserData) {
      await refreshUserData();
    }
  };

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  const getTradingLevel = (experience) => {
    const levels = {
      'beginner': { name: 'Beginner', color: '#10b981', progress: 25 },
      'intermediate': { name: 'Intermediate', color: '#3b82f6', progress: 50 },
      'advanced': { name: 'Advanced', color: '#8b5cf6', progress: 75 },
      'expert': { name: 'Expert', color: '#f59e0b', progress: 95 }
    };
    return levels[experience] || { name: 'Not Set', color: '#6b7280', progress: 0 };
  };

  const getRiskLevel = (risk) => {
    const risks = {
      'low': { name: 'Low', color: '#10b981' },
      'medium': { name: 'Medium', color: '#f59e0b' },
      'high': { name: 'High', color: '#ef4444' }
    };
    return risks[risk] || { name: 'Not Set', color: '#6b7280' };
  };

  if (loading && !userData) {
    return (
      <div className={`${styles.loading} ${darkMode ? styles.dark : styles.light}`}>
        <div className={styles.spinner}></div>
        <p>Loading your dashboard...</p>
        <small>Preparing your trading overview</small>
      </div>
    );
  }

  // Use user data from backend or fallback to auth context
  const displayUser = userData || {
    profile: {},
    subscription: { plan: 'free', status: 'active' }
  };

  const completionPercentage = getProfileCompletionPercentage();
  const missingFields = getMissingFields();
  const tradingLevel = getTradingLevel(displayUser.profile?.tradingExperience);
  const riskLevel = getRiskLevel(displayUser.profile?.riskAppetite);

  return (
    <div className={`${styles.dashboard} ${darkMode ? styles.dark : styles.light}`}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.welcomeSection}>
          <button onClick={handleBack} className={styles.backButton}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5"></path>
              <path d="M12 19l-7-7 7-7"></path>
            </svg>
            Back
          </button>
          <h1>
            Welcome back, {displayUser.profile?.firstName || user?.name || 'Trader'}!
            {profileComplete && profileVerified && (
              <span className={styles.verifiedBadge}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22,4 12,14.01 9,11.01"></polyline>
                </svg>
                Verified
              </span>
            )}
          </h1>
          <p className={styles.subtitle}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button 
            onClick={handleRefresh}
            className={styles.refreshButton}
            disabled={loading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>

          <Link 
            to="/profile" 
            className={`${styles.profileButton} ${
              !profileComplete ? styles.incomplete : 
              !profileVerified ? styles.pending : 
              styles.complete
            }`}
          >
            {profileComplete && profileVerified ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit Profile
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
                Complete Profile ({completionPercentage}%)
              </>
            )}
          </Link>
          
          <button onClick={signOut} className={styles.logoutBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16,17 21,12 16,7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
          </button>
        </div>
      </div>
      
      {/* Alert Section */}
      <div className={styles.alertSection}>
        {!profileComplete && (
          <div className={styles.completionAlert}>
            <div className={styles.alertContent}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <div>
                <strong>Complete your profile to unlock premium features!</strong>
                <p>Increase your profile strength to access advanced trading tools and analytics.</p>
                <div className={styles.missingFields}>
                  <strong>Missing:</strong> {missingFields.slice(0, 3).join(', ')}
                  {missingFields.length > 3 && ` and ${missingFields.length - 3} more...`}
                </div>
              </div>
            </div>
            <Link to="/profile" className={styles.alertButton}>
              Complete Now
            </Link>
          </div>
        )}

        {profileComplete && !profileVerified && (
          <div className={styles.verificationAlert}>
            <div className={styles.alertContent}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
              <div>
                <strong>Profile verification required</strong>
                <p>Your profile is complete! Verify your identity to access all trading features and higher limits.</p>
              </div>
            </div>
            <Link to="/profile" className={styles.alertButton}>
              Start Verification
            </Link>
          </div>
        )}

        {profileComplete && profileVerified && (
          <div className={styles.successAlert}>
            <div className={styles.alertContent}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22,4 12,14.01 9,11.01"></polyline>
              </svg>
              <div>
                <strong>Profile Complete & Verified! 🎉</strong>
                <p>You have full access to all trading features and premium tools.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className={styles.content}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          {/* Enhanced Profile Card */}
          <div className={styles.profileCard}>
            <div className={styles.cardHeader}>
              <h2>Profile Overview</h2>
              <span className={`${styles.status} ${
                profileComplete && profileVerified ? styles.complete : 
                profileComplete ? styles.pending : 
                styles.incomplete
              }`}>
                {profileComplete && profileVerified ? '✓ Verified' : 
                 profileComplete ? '⏳ Pending' : '⚠ Incomplete'}
              </span>
            </div>
            <div className={styles.profileContent}>
              <div className={styles.profilePicture}>
                <div className={styles.avatar}>
                  {user?.avatar ? (
                    <img 
                      src={getAvatarUrl()} 
                      alt="Profile" 
                      className={styles.avatarImage}
                      onError={(e) => {
                        console.error('Failed to load avatar:', user.avatar);
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {user?.avatarInitial || user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                <Link to="/profile" className={styles.changePhotoBtn}>
                  Change Photo
                </Link>
              </div>
              <div className={styles.profileProgress}>
                <div className={styles.progressHeader}>
                  <span>Profile Strength</span>
                  <span>{completionPercentage}%</span>
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
                <div className={styles.profileInfo}>
                  <div className={styles.infoItem}>
                    <strong>Name:</strong> {displayUser.profile?.firstName ? `${displayUser.profile.firstName} ${displayUser.profile.lastName}` : user?.name || 'Not set'}
                  </div>
                  <div className={styles.infoItem}>
                    <strong>Email:</strong> {user?.email}
                  </div>
                  <div className={styles.infoItem}>
                    <strong>Username:</strong> {displayUser.profile?.username || user?.username || 'Not set'}
                  </div>
                  <div className={styles.infoItem}>
                    <strong>Trading Level:</strong>
                    <span className={styles.levelBadge} style={{ backgroundColor: tradingLevel.color }}>
                      {tradingLevel.name}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <strong>Risk Appetite:</strong>
                    <span className={styles.riskBadge} style={{ backgroundColor: riskLevel.color }}>
                      {riskLevel.name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className={styles.quickStats}>
            <h2>Performance Metrics</h2>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <div className={styles.statIcon} style={{ backgroundColor: '#10b98120', color: '#10b981' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                  </svg>
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>{stats.totalTrades}</span>
                  <span className={styles.statLabel}>Total Trades</span>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statIcon} style={{ backgroundColor: '#3b82f620', color: '#3b82f6' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22,4 12,14.01 9,11.01"></polyline>
                  </svg>
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>{stats.winRate.toFixed(1)}%</span>
                  <span className={styles.statLabel}>Win Rate</span>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statIcon} style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                  </svg>
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>{stats.activeDays}</span>
                  <span className={styles.statLabel}>Active Days</span>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statIcon} style={{ backgroundColor: '#8b5cf620', color: '#8b5cf6' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>
                    ${stats.dailyChange > 0 ? '+' : ''}{stats.dailyChange.toFixed(2)}
                  </span>
                  <span className={styles.statLabel}>Daily P&L</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className={styles.rightColumn}>
          {/* Enhanced Casher Section */}
          <div className={styles.casher}>
            <div className={styles.casherHeader}>
              <h2>Account Balance</h2>
              <span className={styles.lastUpdated}>Updated just now</span>
            </div>
            <div className={styles.balanceCards}>
              <div className={styles.balanceCard}>
                <div className={styles.balanceIcon} style={{ backgroundColor: '#10b98120', color: '#10b981' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <div className={styles.balanceInfo}>
                  <h3>Total Balance</h3>
                  <p className={styles.balanceAmount}>${stats.totalBalance.toFixed(2)}</p>
                  <span className={styles.balanceLabel}>All accounts</span>
                </div>
              </div>
              <div className={styles.balanceCard}>
                <div className={styles.balanceIcon} style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                  </svg>
                </div>
                <div className={styles.balanceInfo}>
                  <h3>Available</h3>
                  <p className={styles.balanceAmount}>${stats.availableBalance.toFixed(2)}</p>
                  <span className={styles.balanceLabel}>Ready to trade</span>
                </div>
              </div>
              <div className={styles.balanceCard}>
                <div className={styles.balanceIcon} style={{ backgroundColor: '#ef444420', color: '#ef4444' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                  </svg>
                </div>
                <div className={styles.balanceInfo}>
                  <h3>Pending</h3>
                  <p className={styles.balanceAmount}>${stats.pendingBalance.toFixed(2)}</p>
                  <span className={styles.balanceLabel}>In processing</span>
                </div>
              </div>
            </div>
            <div className={styles.casherActions}>
              <button className={`${styles.casherBtn} ${styles.primary}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="19" x2="12" y2="5"></line>
                  <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
                Deposit
              </button>
              <button className={styles.casherBtn}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <polyline points="19 12 12 19 5 12"></polyline>
                </svg>
                Withdraw
              </button>
              <button className={styles.casherBtn}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
                Transfer
              </button>
            </div>
          </div>

          {/* Progress Overview */}
          <div className={styles.progressCards}>
            <h2>Progress Overview</h2>
            <div className={styles.progressGrid}>
              <div className={styles.progressCard}>
                <div className={styles.progressCardHeader}>
                  <h3>Trading Progress</h3>
                  <span className={styles.progressPercent} style={{ color: tradingLevel.color }}>
                    {tradingLevel.progress}%
                  </span>
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${tradingLevel.progress}%`, backgroundColor: tradingLevel.color }}
                  ></div>
                </div>
                <div className={styles.progressStats}>
                  <span>Level: {tradingLevel.name}</span>
                  <span>Trades: {stats.totalTrades}</span>
                </div>
              </div>
              
              <div className={styles.progressCard}>
                <div className={styles.progressCardHeader}>
                  <h3>Profile Strength</h3>
                  <span className={styles.progressPercent} style={{ color: '#3b82f6' }}>
                    {completionPercentage}%
                  </span>
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${completionPercentage}%`, backgroundColor: '#3b82f6' }}
                  ></div>
                </div>
                <div className={styles.progressStats}>
                  <span>Status: {profileComplete ? 'Complete' : 'In Progress'}</span>
                  <span>Missing: {Math.max(0, missingFields.length - 1)} fields</span>
                </div>
              </div>
              
              <div className={styles.progressCard}>
                <div className={styles.progressCardHeader}>
                  <h3>Monthly Goal</h3>
                  <span className={styles.progressPercent} style={{ color: '#10b981' }}>
                    {stats.monthlyProgress.toFixed(0)}%
                  </span>
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${stats.monthlyProgress}%`, backgroundColor: '#10b981' }}
                  ></div>
                </div>
                <div className={styles.progressStats}>
                  <span>Active: {stats.activeDays}/30 days</span>
                  <span>Streak: {Math.min(stats.activeDays, 15)} days</span>
                </div>
              </div>
              
              <div className={styles.progressCard}>
                <div className={styles.progressCardHeader}>
                  <h3>Learning Progress</h3>
                  <span className={styles.progressPercent} style={{ color: '#8b5cf6' }}>
                    {stats.winRate.toFixed(0)}%
                  </span>
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${stats.winRate}%`, backgroundColor: '#8b5cf6' }}
                  ></div>
                </div>
                <div className={styles.progressStats}>
                  <span>Win Rate: {stats.winRate.toFixed(1)}%</span>
                  <span>Performance: {stats.winRate > 50 ? 'Good' : 'Needs Improvement'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={styles.quickActions}>
            <h2>Quick Actions</h2>
            <div className={styles.actionButtons}>
              <button className={styles.actionBtn}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                View Portfolio
              </button>
              <button className={styles.actionBtn}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline>
                  <polyline points="7.5 19.79 7.5 14.6 3 12"></polyline>
                  <polyline points="21 12 16.5 14.6 16.5 19.79"></polyline>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                Market Analysis
              </button>
              <button className={styles.actionBtn}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
                Trade History
              </button>
              <Link to="/profile" className={styles.actionBtn}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Edit Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;