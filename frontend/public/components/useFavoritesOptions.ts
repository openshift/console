import type { Dispatch, SetStateAction } from 'react';
import { useUserPreferenceCompatibility } from '@console/shared/src/hooks/useUserPreferenceCompatibility';
import type { FavoritesType } from '@console/app/src/types';
import { FAVORITES_CONFIG_MAP_KEY, FAVORITES_LOCAL_STORAGE_KEY } from '@console/app/src/consts';

export const useFavoritesOptions = (): [
  FavoritesType,
  Dispatch<SetStateAction<FavoritesType>>,
  boolean,
] =>
  useUserPreferenceCompatibility<FavoritesType>(
    FAVORITES_CONFIG_MAP_KEY,
    FAVORITES_LOCAL_STORAGE_KEY,
    null,
    true,
  );
