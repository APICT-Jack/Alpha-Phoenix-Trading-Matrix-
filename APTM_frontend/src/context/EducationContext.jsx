import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Action types
const ACTION_TYPES = {
  SET_FAVORITES: 'SET_FAVORITES',
  ADD_FAVORITE: 'ADD_FAVORITE',
  REMOVE_FAVORITE: 'REMOVE_FAVORITE',
  ADD_COMMENT: 'ADD_COMMENT',
  LIKE_COMMENT: 'LIKE_COMMENT',
  SET_RECENT_VIEWS: 'SET_RECENT_VIEWS',
  ADD_RECENT_VIEW: 'ADD_RECENT_VIEW',
  SET_SUBSCRIPTIONS: 'SET_SUBSCRIPTIONS',
  ADD_SUBSCRIPTION: 'ADD_SUBSCRIPTION',
  REMOVE_SUBSCRIPTION: 'REMOVE_SUBSCRIPTION',
};

// Load initial state from localStorage
const loadInitialState = () => ({
  favorites: JSON.parse(localStorage.getItem('educationFavorites')) || [],
  recentViews: JSON.parse(localStorage.getItem('educationRecentViews')) || [],
  subscriptions: JSON.parse(localStorage.getItem('educationSubscriptions')) || [],
  userPreferences: JSON.parse(localStorage.getItem('educationPreferences')) || {
    defaultSort: 'rating',
    defaultView: 'grid',
  },
});

// Reducer
const educationReducer = (state, action) => {
  let newState;
  
  switch (action.type) {
    case ACTION_TYPES.SET_FAVORITES:
      newState = { ...state, favorites: action.payload };
      localStorage.setItem('educationFavorites', JSON.stringify(action.payload));
      return newState;

    case ACTION_TYPES.ADD_FAVORITE:
      { const newFavoritesAdd = [...state.favorites, action.payload];
      newState = { ...state, favorites: newFavoritesAdd };
      localStorage.setItem('educationFavorites', JSON.stringify(newFavoritesAdd));
      return newState; }

    case ACTION_TYPES.REMOVE_FAVORITE:
      { const newFavoritesRemove = state.favorites.filter(id => id !== action.payload);
      newState = { ...state, favorites: newFavoritesRemove };
      localStorage.setItem('educationFavorites', JSON.stringify(newFavoritesRemove));
      return newState; }

    case ACTION_TYPES.SET_RECENT_VIEWS:
      newState = { ...state, recentViews: action.payload };
      localStorage.setItem('educationRecentViews', JSON.stringify(action.payload));
      return newState;

    case ACTION_TYPES.ADD_RECENT_VIEW:
      { const recent = state.recentViews.filter(id => id !== action.payload);
      const newRecentViews = [action.payload, ...recent].slice(0, 10);
      newState = { ...state, recentViews: newRecentViews };
      localStorage.setItem('educationRecentViews', JSON.stringify(newRecentViews));
      return newState; }

    case ACTION_TYPES.SET_SUBSCRIPTIONS:
      newState = { ...state, subscriptions: action.payload };
      localStorage.setItem('educationSubscriptions', JSON.stringify(action.payload));
      return newState;

    case ACTION_TYPES.ADD_SUBSCRIPTION:
      { const newSubscriptionsAdd = [...state.subscriptions, action.payload];
      newState = { ...state, subscriptions: newSubscriptionsAdd };
      localStorage.setItem('educationSubscriptions', JSON.stringify(newSubscriptionsAdd));
      return newState; }

    case ACTION_TYPES.REMOVE_SUBSCRIPTION:
      { const newSubscriptionsRemove = state.subscriptions.filter(id => id !== action.payload);
      newState = { ...state, subscriptions: newSubscriptionsRemove };
      localStorage.setItem('educationSubscriptions', JSON.stringify(newSubscriptionsRemove));
      return newState; }

    default:
      return state;
  }
};

// Context
const EducationContext = createContext();

// Provider
export const EducationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(educationReducer, loadInitialState());

  // Sync with localStorage changes (for cross-tab synchronization)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'educationFavorites') {
        dispatch({ 
          type: ACTION_TYPES.SET_FAVORITES, 
          payload: JSON.parse(e.newValue || '[]') 
        });
      }
      if (e.key === 'educationSubscriptions') {
        dispatch({ 
          type: ACTION_TYPES.SET_SUBSCRIPTIONS, 
          payload: JSON.parse(e.newValue || '[]') 
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const actions = {
    // Favorite actions
    addFavorite: (academyId) => {
      if (!state.favorites.includes(academyId)) {
        dispatch({ type: ACTION_TYPES.ADD_FAVORITE, payload: academyId });
      }
    },
    
    removeFavorite: (academyId) => {
      dispatch({ type: ACTION_TYPES.REMOVE_FAVORITE, payload: academyId });
    },
    
    toggleFavorite: (academyId) => {
      if (state.favorites.includes(academyId)) {
        dispatch({ type: ACTION_TYPES.REMOVE_FAVORITE, payload: academyId });
      } else {
        dispatch({ type: ACTION_TYPES.ADD_FAVORITE, payload: academyId });
      }
    },
    
    // Recent views actions
    addRecentView: (academyId) => {
      dispatch({ type: ACTION_TYPES.ADD_RECENT_VIEW, payload: academyId });
    },
    
    // Subscription actions
    addSubscription: (academyId) => {
      if (!state.subscriptions.includes(academyId)) {
        dispatch({ type: ACTION_TYPES.ADD_SUBSCRIPTION, payload: academyId });
      }
    },
    
    removeSubscription: (academyId) => {
      dispatch({ type: ACTION_TYPES.REMOVE_SUBSCRIPTION, payload: academyId });
    },
    
    toggleSubscription: (academyId) => {
      if (state.subscriptions.includes(academyId)) {
        dispatch({ type: ACTION_TYPES.REMOVE_SUBSCRIPTION, payload: academyId });
      } else {
        dispatch({ type: ACTION_TYPES.ADD_SUBSCRIPTION, payload: academyId });
      }
    },
    
    // Check functions
    isFavorite: (academyId) => state.favorites.includes(academyId),
    isSubscribed: (academyId) => state.subscriptions.includes(academyId),
  };

  return (
    <EducationContext.Provider value={{ ...state, ...actions }}>
      {children}
    </EducationContext.Provider>
  );
};

// Hook
// eslint-disable-next-line react-refresh/only-export-components
export const useEducation = () => {
  const context = useContext(EducationContext);
  if (!context) {
    throw new Error('useEducation must be used within an EducationProvider');
  }
  return context;
};