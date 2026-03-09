import React from 'react';
import { 
  FaHome, 
  FaUser, 
  FaBuilding, 
  FaPalette, 
  FaTools, 
  FaComments,
  FaGraduationCap,
  FaBook
} from 'react-icons/fa';
import '../../styles/education/NavigationPanel.css';

const NavigationPanel = ({ 
  isCollapsed, 
  activeNav, 
  onNavClick, 
  // eslint-disable-next-line no-unused-vars
  onToggleCollapse 
}) => {
  const navigationItems = [
    { key: 'Home', icon: FaHome, label: 'Home', path: '/' },
     { key: 'Account', icon: FaUser, label: 'Account', path: '/account' },
    { key: 'Academies', icon: FaGraduationCap, label: 'Academies', path: '/education' },
    { key: 'Library', icon: FaBook, label: 'Library', path: '/library' },
   
    { key: 'Office', icon: FaBuilding, label: 'Office', path: '/office' },
    { key: 'Studio', icon: FaPalette, label: 'Studio', path: '/studio' },
    { key: 'Tools', icon: FaTools, label: 'Tools', path: '/tools' },
    { key: 'Chat AI', icon: FaComments, label: 'Chat AI', path: '/chat' }
  ];

  const handleNavClick = (navItem) => {
    onNavClick(navItem);
    
    switch (navItem) {
      case 'Home':
        window.location.href = '/';
        break;
      case 'Academies':
        break;
      case 'Library':
        console.log('Navigating to Library');
        break;
      case 'Account':
        console.log('Navigating to Account');
        break;
      case 'Office':
        console.log('Navigating to Office');
        break;
      case 'Studio':
        console.log('Navigating to Studio');
        break;
      case 'Tools':
        console.log('Navigating to Tools');
        break;
      case 'Chat AI':
        console.log('Navigating to Chat AI');
        break;
      default:
        break;
    }
  };

  return (
    <nav className={`education-nav-pane ${isCollapsed ? 'education-nav-pane--collapsed' : ''}`}>
      <div className="education-nav-items">
        {navigationItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.key}
              className={`education-nav-item ${activeNav === item.key ? 'education-nav-item--active' : ''}`}
              onClick={() => handleNavClick(item.key)}
              title={item.label}
              aria-label={item.label}
              aria-current={activeNav === item.key ? 'page' : undefined}
            >
              <IconComponent className="education-nav-icon" />
              {!isCollapsed && (
                <span className="education-nav-label">{item.label}</span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default NavigationPanel;