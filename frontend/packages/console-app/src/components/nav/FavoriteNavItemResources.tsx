import * as React from 'react';
import { Nav, NavExpandable, NavList, Button } from '@patternfly/react-core';
import { StarIcon } from '@patternfly/react-icons';
import * as classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { FAVORITES_CONFIG_MAP_KEY, FavoritesType } from '@console/internal/components/utils';
import { FAVORITES_LOCAL_STORAGE_KEY, useUserSettingsCompatibility } from '@console/shared';
import { FavoriteNavItemResource } from './FavoriteNavItemResource';

import './FavoriteNavItemResources.scss';

export const FavoriteNavItemResources: React.FC = () => {
  const { t } = useTranslation();
  const [activeGroup, setActiveGroup] = React.useState('');
  const [activeItem, setActiveItem] = React.useState('');
  const currentUrlPath = window.location.pathname;

  const onSelect = (
    _event: React.FormEvent<HTMLInputElement>,
    result: { itemId: number | string; groupId: number | string | null },
  ) => {
    setActiveGroup(result.groupId as string);
    setActiveItem(result.itemId as string);
  };

  const [favorites, setFavorites, loaded] = useUserSettingsCompatibility<FavoritesType>(
    FAVORITES_CONFIG_MAP_KEY,
    FAVORITES_LOCAL_STORAGE_KEY,
    null,
    true,
  );

  React.useEffect(() => {
    if (loaded && favorites) {
      const currentFavorite = favorites.find((favorite) => favorite.url === currentUrlPath);
      if (currentFavorite) {
        setActiveGroup('favorites-group');
        setActiveItem(`favorites-item-${currentFavorite.url}`);
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
    };
    if (!loaded) return null;
    if (!favorites || favorites.length === 0) {
      return <div className="oc-no-favorites-message">{t('public~No favorites added')}</div>;
    }

    return favorites.map((favorite) => (
      <FavoriteNavItemResource
        key={favorite.url}
        dataAttributes={{
          'data-test': 'favorite-resource-item',
        }}
        className={classNames('oc-favorite-resource')}
        to={favorite.url}
        isActive={activeItem === `favorites-item-${favorite.url}`}
      >
        {favorite.name}
        <Button
          variant="plain"
          aria-label={`Unfavorite ${favorite.name}`}
          onClick={(e) => {
            e.preventDefault();
            handleUnfavorite(favorite.url);
          }}
          className="oc-favorite-delete-button"
          icon={<StarIcon color="gold" />}
        />
      </FavoriteNavItemResource>
    ));
  }, [favorites, activeItem, loaded, t, setFavorites]);

  return (
    <Nav onSelect={onSelect} aria-label="favorite-resources" className="oc-favorite-menu">
      <NavList>
        <NavExpandable
          title={t('public~Favorites')}
          groupId="favorites-group"
          isActive={activeGroup === 'favorites-group'}
          isExpanded={activeGroup === 'favorites-group'}
        >
          {navList}
        </NavExpandable>
      </NavList>
    </Nav>
  );
};
