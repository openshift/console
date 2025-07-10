import * as React from 'react';
import { useUserSettingsCompatibility } from '@console/shared/src/hooks/useUserSettingsCompatibility';
import { FavoritesType } from '@console/app/src/types';
import { FAVORITES_CONFIG_MAP_KEY, FAVORITES_LOCAL_STORAGE_KEY } from '@console/app/src/consts';

export const useFavoritesOptions = (): [
  FavoritesType,
  React.Dispatch<React.SetStateAction<FavoritesType>>,
  boolean,
] =>
  useUserSettingsCompatibility<FavoritesType>(
    FAVORITES_CONFIG_MAP_KEY,
    FAVORITES_LOCAL_STORAGE_KEY,
    null,
    true,
  );
