import * as React from 'react';
import {
  Button,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  TextInput,
  Tooltip,
} from '@patternfly/react-core';
import { ModalVariant } from '@patternfly/react-core/deprecated';
import { StarIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { connectToModel } from '@console/internal/kinds';
import { Modal, RedExclamationCircleIcon, useUserSettingsCompatibility } from '@console/shared';
import { STORAGE_PREFIX } from '@console/shared/src/constants/common';

export type FavoritesType = {
  name: string;
  url: string;
}[];

export const FAVORITES_CONFIG_MAP_KEY = 'console.favorites';
export const FAVORITES_LOCAL_STORAGE_KEY = `${STORAGE_PREFIX}/favorites`;
const MAX_FAVORITE_COUNT = 10;

export const FavoriteButton = connectToModel(() => {
  const { t } = useTranslation('console-app');
  const [isStarred, setIsStarred] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [name, setName] = React.useState<string>('');
  const [error, setError] = React.useState<string | null>(null);
  const [favorites, setFavorites, loaded] = useUserSettingsCompatibility<FavoritesType>(
    FAVORITES_CONFIG_MAP_KEY,
    FAVORITES_LOCAL_STORAGE_KEY,
    null,
    true,
  );
  const alphanumericRegex = /^[a-zA-Z0-9- ]*$/;

  const currentUrlPath = window.location.pathname;

  React.useEffect(() => {
    if (loaded) {
      const isCurrentlyFavorited = favorites?.some((favorite) => favorite.url === currentUrlPath);
      setIsStarred(isCurrentlyFavorited);
    }
  }, [loaded, favorites, currentUrlPath]);

  const handleStarClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    const isCurrentlyFavorited = favorites?.some((favorite) => favorite.url === currentUrlPath);
    if (isCurrentlyFavorited) {
      const updatedFavorites = favorites?.filter((favorite) => favorite.url !== currentUrlPath);
      setFavorites(updatedFavorites);
      setIsStarred(false);
    } else {
      const currentUrlSplit = currentUrlPath.includes('~')
        ? currentUrlPath.split('~')
        : currentUrlPath.split('/');
      const [defaultName] = currentUrlSplit.slice(-1);
      const sanitizedDefaultName = defaultName.split('?')[0].replace(/[^a-zA-Z0-9- ]/g, '-');
      setName(sanitizedDefaultName);
      setIsModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setError('');
    setName('');
    setIsModalOpen(false);
  };

  const handleConfirmStar = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t('Name is required.'));
      return;
    }
    if (!alphanumericRegex.test(trimmedName)) {
      setError(t('Name can only contain letters, numbers, spaces, and hyphens.'));
      return;
    }
    const nameExists = favorites?.some((favorite) => favorite.name === name.trim());
    if (nameExists) {
      setError(
        t(
          'The name {{favoriteName}} already exists in your favorites. Choose a unique name to save to your favorites.',
          { favoriteName: name },
        ),
      );
      return;
    }

    const newFavorite = { name: name.trim(), url: currentUrlPath };
    const updatedFavorites = [...(favorites || []), newFavorite];
    setFavorites(updatedFavorites);
    setIsStarred((prev) => !prev);
    setError('');
    setName('');
    setIsModalOpen(false);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!alphanumericRegex.test(value)) {
      setError(t('Name can only contain letters, numbers, spaces, and hyphens.'));
    } else {
      setError(null);
    }
  };

  const isDisabled = favorites?.length >= MAX_FAVORITE_COUNT && !isStarred;

  const disabledTooltipText = t(
    'Maximum number of favorites ({{maxCount}}) reached. To add another favorite, remove an existing page from your favorites.',
    { maxCount: MAX_FAVORITE_COUNT },
  );

  const tooltipText = isDisabled
    ? disabledTooltipText
    : isStarred
    ? t('Remove from favorites')
    : t('Add to favorites');

  return (
    <div className="co-fav-actions-icon">
      <Tooltip content={tooltipText} position="top">
        <Button
          icon={<StarIcon color={isStarred ? 'gold' : 'gray'} />}
          className="co-xl-icon-button"
          data-test="favorite-button"
          variant="plain"
          aria-label={tooltipText}
          aria-pressed={isStarred}
          onClick={handleStarClick}
          isDisabled={isDisabled}
        />
      </Tooltip>

      {isModalOpen && (
        <Modal
          title={t('Add to favorites')}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          actions={[
            <Button key="confirm" variant="primary" onClick={handleConfirmStar}>
              {t('Save')}
            </Button>,
            <Button key="cancel" variant="link" onClick={handleModalClose}>
              {t('Cancel')}
            </Button>,
          ]}
          variant={ModalVariant.small}
        >
          <Form>
            <FormGroup label={t('Name')} isRequired fieldId="input-name">
              <TextInput
                id="input-name"
                data-test="input-name"
                name="name"
                type="text"
                onChange={(e, v) => handleNameChange(v)}
                value={name || ''}
                autoFocus
                required
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
              />
              {error && (
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem variant="error" icon={<RedExclamationCircleIcon />}>
                      {error}
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              )}
            </FormGroup>
          </Form>
        </Modal>
      )}
    </div>
  );
});
