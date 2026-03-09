// components/navigation/NavigationAvatar.js
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../ui/UserAvatar';
import { useNavigate } from 'react-router-dom';

const NavigationAvatar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    navigate('/profile/settings');
  };

  const handleCasherClick = () => {
    navigate('/dashboard');
  };

  const handleSubscriptionClick = () => {
    navigate('/subscription');
  };

  return (
    <UserAvatar
      user={user}
      showName={true}
      showDropdown={true}
      onProfileClick={handleProfileClick}
      onSettingsClick={handleSettingsClick}
      onCasherClick={handleCasherClick}
      onSubscriptionClick={handleSubscriptionClick}
      onLogoutClick={handleLogout}
    />
  );
};

export default NavigationAvatar;