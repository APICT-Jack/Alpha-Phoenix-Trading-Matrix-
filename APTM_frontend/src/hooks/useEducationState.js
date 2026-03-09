import { useCallback, useMemo } from 'react';
import { useEducation } from '../context/EducationContext';

export const useEducationState = (academyId) => {
  const { 
    favorites,        // Get the arrays directly
    subscriptions,
    toggleFavorite, 
    toggleSubscription,
    forceUpdate 
  } = useEducation();

  // Compute values based on the arrays - this will trigger re-renders
  const isFavorite = useMemo(() => 
    academyId ? favorites.includes(academyId) : false,
    [academyId, favorites]
  );

  const isSubscribed = useMemo(() => 
    academyId ? subscriptions.includes(academyId) : false,
    [academyId, subscriptions]
  );

  const handleToggleFavorite = useCallback((e) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (academyId) {
      console.log('🎯 Toggling favorite for:', academyId);
      toggleFavorite(academyId);
      // Force update is probably not needed anymore since we're using arrays
      setTimeout(() => forceUpdate(), 0);
    }
  }, [academyId, toggleFavorite, forceUpdate]);

  const handleToggleSubscription = useCallback((e) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (academyId) {
      console.log('🎯 Toggling subscription for:', academyId);
      toggleSubscription(academyId);
      setTimeout(() => forceUpdate(), 0);
    }
  }, [academyId, toggleSubscription, forceUpdate]);

  return {
    isFavorite,
    isSubscribed,
    toggleFavorite: handleToggleFavorite,
    toggleSubscription: handleToggleSubscription
  };
};