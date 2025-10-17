import * as React from 'react';
import { NavExpandable, Button, FlexItem, Flex, Truncate } from '@patternfly/react-core';
import { StarIcon } from '@patternfly/react-icons';
import { css } from '@patternfly/react-styles';
import { useTranslation } from 'react-i18next';
import { useTelemetry, useUserSettingsCompatibility } from '@console/shared';
import { FAVORITES_CONFIG_MAP_KEY, FAVORITES_LOCAL_STORAGE_KEY } from '../../consts';
import { FavoritesType } from '../../types';
import { FavoriteNavItem } from './FavoriteNavItem';

import './FavoriteNavItems.scss';

export const FavoriteNavItems: React.FC = () => {
  const { t } = useTranslation();
  const triggerTelemetry = useTelemetry();
  const [activeGroup, setActiveGroup] = React.useState('');
  const [activeItem, setActiveItem] = React.useState('');
  const currentUrlPath = window.location.pathname;

  const [favorites, setFavorites, loaded] = useUserSettingsCompatibility<FavoritesType>(
    FAVORITES_CONFIG_MAP_KEY,
    FAVORITES_LOCAL_STORAGE_KEY,
    undefined,
    true,
  );

  React.useEffect(() => {
    if (loaded && favorites) {
      const currentFavorite = favorites.find((favorite) => favorite.url === currentUrlPath);
      if (currentFavorite) {
        setActiveGroup('favorites-group');
        setActiveItem(`favorites-item-${currentFavorite.url}`);
      } else {
        setActiveItem('');
      }
    }
  }, [loaded, favorites, currentUrlPath]);

  const navList = React.useMemo(() => {
    const handleUnfavorite = (favoriteUrl: string) => {
      const updatedFavorites = favorites?.filter((favorite) => favorite.url !== favoriteUrl);
      setFavorites(updatedFavorites);
      if (activeItem === `favorites-item-${favoriteUrl}`) {
        setActiveItem('');
      }
      triggerTelemetry('remove-favorite-from-nav', {
        url: favoriteUrl,
      });
    };
    if (!loaded) return null;
    if (!favorites || favorites.length === 0) {
      return (
        <li className="co-no-favorites-message" data-test="no-favorites-message">
          {t('console-app~No favorites added')}
        </li>
      );
    }

    return favorites.map((favorite) => (
      <FavoriteNavItem
        key={favorite.url}
        dataAttributes={{
          'data-test': 'favorite-resource-item',
        }}
        className={css('co-favorite-resource')}
        to={`${favorite.url}?from=favorites`}
        isActive={activeItem === `favorites-item-${favorite.url}`}
      >
        <Flex
          justifyContent={{ default: 'justifyContentSpaceBetween' }}
          alignItems={{ default: 'alignItemsCenter' }}
          flexWrap={{ default: 'nowrap' }}
          style={{ width: '100%' }}
        >
          <FlexItem className="pf-v6-u-m-0">
            <Truncate content={favorite.name} />
          </FlexItem>
          <FlexItem className="pf-v6-u-mr-xs">
            <Button
              variant="plain"
              aria-label={`Unfavorite ${favorite.name}`}
              onClick={(e) => {
                e.preventDefault();
                handleUnfavorite(favorite.url);
              }}
              icon={<StarIcon color="gold" />}
              data-test="remove-favorite-button"
            />
          </FlexItem>
        </Flex>
      </FavoriteNavItem>
    ));
  }, [favorites, activeItem, loaded, t, setFavorites, triggerTelemetry]);

  return (
    <NavExpandable
      title={t('console-app~Favorites')}
      groupId="favorites-group"
      isActive={activeGroup === 'favorites-group'}
      isExpanded={activeGroup === 'favorites-group'}
    >
      {navList}
    </NavExpandable>
  );
};
