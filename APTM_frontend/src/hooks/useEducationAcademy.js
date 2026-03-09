import { useCallback, useMemo } from 'react';
import { useEducation } from '../context/EducationContext';

export const useEducationAcademy = (academyId) => {
  const { 
    favorites,        // Get the actual arrays
    subscriptions, 
    toggleFavorite, 
    toggleSubscription 
  } = useEducation();

  // These computed values will update when favorites/subscriptions change
  const isFavorite = useMemo(() => 
    academyId ? favorites.includes(academyId) : false,
    [academyId, favorites]  // Recompute when favorites array changes
  );

  const isSubscribed = useMemo(() => 
    academyId ? subscriptions.includes(academyId) : false,
    [academyId, subscriptions]  // Recompute when subscriptions array changes
  );

  const handleToggleFavorite = useCallback((e) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (academyId) {
      console.log('🎯 Toggling favorite for:', academyId);
      toggleFavorite(academyId);
    }
  }, [academyId, toggleFavorite]);

  const handleToggleSubscription = useCallback((e) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (academyId) {
      console.log('🎯 Toggling subscription for:', academyId);
      toggleSubscription(academyId);
    }
  }, [academyId, toggleSubscription]);

  return {
    isFavorite,
    isSubscribed,
    toggleFavorite: handleToggleFavorite,
    toggleSubscription: handleToggleSubscription,
    // Return raw arrays for debugging
    favorites,
    subscriptions
  };
};