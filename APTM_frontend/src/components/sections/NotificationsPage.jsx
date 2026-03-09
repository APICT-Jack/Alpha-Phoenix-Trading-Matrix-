import React, { useState } from 'react';

const NotificationsPage = () => {
  const [activeTab, setActiveTab] = useState('signals');
  
  // Sample notification data
  const notifications = {
    signals: [
      {
        id: 1,
        title: 'New Buy Signal Detected',
        message: 'BTC/USD has triggered a buy signal on the 4H chart with 85% confidence',
        time: '2 min ago',
        unread: true,
        type: 'signal'
      },
      {
        id: 2,
        title: 'Take Profit Reached',
        message: 'ETH/USD has reached your take profit level at $2,850',
        time: '1 hour ago',
        unread: false,
        type: 'signal'
      }
    ],
    chats: [
      {
        id: 1,
        title: 'New message in Trading Room',
        message: 'John_Doe: What do you think about this pullback?',
        time: '5 min ago',
        unread: true,
        type: 'chat'
      }
    ],
    community: [
      {
        id: 1,
        title: 'New reply to your post',
        message: 'Trader_Pro replied to your question about RSI divergence',
        time: '30 min ago',
        unread: true,
        type: 'community'
      }
    ],
    events: [
      {
        id: 1,
        title: 'Live Trading Session Starting Soon',
        message: 'Join our weekly live trading session in 15 minutes',
        time: '1 day ago',
        unread: false,
        type: 'event'
      }
    ],
    study: [
      {
        id: 1,
        title: 'New Study Material Available',
        message: 'The Advanced Technical Analysis course has been updated',
        time: '3 days ago',
        unread: false,
        type: 'study'
      }
    ],
    bank: [
      {
        id: 1,
        title: 'Withdrawal Processed',
        message: 'Your withdrawal of $500 has been processed',
        time: '2 days ago',
        unread: false,
        type: 'bank'
      }
    ]
  };

  const tabs = [
    { id: 'signals', label: 'Signals', count: 2 },
    { id: 'chats', label: 'Chats', count: 1 },
    { id: 'community', label: 'Community', count: 1 },
    { id: 'events', label: 'Events', count: 0 },
    { id: 'study', label: 'Study', count: 0 },
    { id: 'bank', label: 'Bank', count: 0 }
  ];

  const markAllAsRead = () => {
    // Implementation to mark all as read
  };

  return (
    <div className="notifications-page">
      <div className="container">
        <div className="notifications-container">
          <div className="notifications-header">
            <h2>Notifications</h2>
            <div className="notifications-actions">
              <button className="mark-all-read" onClick={markAllAsRead}>
                <i className="icon-check"></i> Mark all as read
              </button>
            </div>
          </div>
          
          <div className="notifications-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`notification-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {tab.count > 0 && <span className="notification-tab-badge">{tab.count}</span>}
              </button>
            ))}
          </div>
          
          <div className="notifications-content">
            {tabs.map(tab => (
              <div 
                key={tab.id} 
                className={`notification-tab-content ${activeTab === tab.id ? 'active' : ''}`}
              >
                {notifications[tab.id]?.length > 0 ? (
                  notifications[tab.id].map(notification => (
                    <div key={notification.id} className={`notification-item ${notification.unread ? 'unread' : ''}`}>
                      <div className={`notification-icon ${notification.type}`}>
                        <i className={`icon-${notification.type}`}></i>
                      </div>
                      <div className="notification-content">
                        <h3 className="notification-title">{notification.title}</h3>
                        <p className="notification-message">{notification.message}</p>
                        <div className="notification-meta">
                          <span className="notification-time">
                            <i className="icon-clock"></i> {notification.time}
                          </span>
                          {notification.unread && <span className="notification-unread"></span>}
                        </div>
                        <div className="notification-actions">
                          <button className="notification-action">View</button>
                          <button className="notification-action">Dismiss</button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <i className="icon-bell-off"></i>
                    </div>
                    <h3>No notifications</h3>
                    <p>You don't have any {tab.label.toLowerCase()} notifications at this time.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;