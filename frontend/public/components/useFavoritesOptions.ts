import type { Dispatch, SetStateAction } from 'react';
import { useUserSettingsCompatibility } from '@console/shared/src/hooks/useUserSettingsCompatibility';
import type { FavoritesType } from '@console/app/src/types';
import { FAVORITES_CONFIG_MAP_KEY, FAVORITES_LOCAL_STORAGE_KEY } from '@console/app/src/consts';

export const useFavoritesOptions = (): [
  FavoritesType,
  Dispatch<SetStateAction<FavoritesType>>,
  boolean,
] =>
  useUserSettingsCompatibility<FavoritesType>(
    FAVORITES_CONFIG_MAP_KEY,
    FAVORITES_LOCAL_STORAGE_KEY,
    null,
    true,
  );
