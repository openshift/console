import type { Dispatch, SetStateAction } from 'react';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';
import type { FavoritesType } from '@console/app/src/types';
import { FAVORITES_CONFIG_MAP_KEY } from '@console/app/src/consts';

export const useFavoritesOptions = (): [
  FavoritesType,
  Dispatch<SetStateAction<FavoritesType>>,
  boolean,
] =>
  useUserPreference<FavoritesType>(
    FAVORITES_CONFIG_MAP_KEY,
    null,
    true,
  );
