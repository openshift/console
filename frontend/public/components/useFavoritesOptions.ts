import type { Dispatch, SetStateAction } from 'react';
import { FAVORITES_USER_PREFERENCE_KEY } from '@console/app/src/consts';
import type { FavoritesType } from '@console/app/src/types';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';

export const useFavoritesOptions = (): [
  FavoritesType,
  Dispatch<SetStateAction<FavoritesType>>,
  boolean,
] => useUserPreference<FavoritesType>(FAVORITES_USER_PREFERENCE_KEY, null, true);
