import { useState, useEffect } from 'react';
import {
  Button,
  ButtonProps,
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
import Modal from '@console/shared/src/components/modal/Modal';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { useUserSettingsCompatibility } from '@console/shared/src/hooks/useUserSettingsCompatibility';
import { FAVORITES_CONFIG_MAP_KEY, FAVORITES_LOCAL_STORAGE_KEY } from '../../consts';
import { FavoritesType } from '../../types';

const MAX_FAVORITE_COUNT = 10;

type FavoriteButtonProps = {
  /** The default name to put in the input field */
  defaultName?: string;
};

export const FavoriteButton = ({ defaultName }: FavoriteButtonProps) => {
  const { t } = useTranslation('console-app');
  const triggerTelemetry = useTelemetry();
  const [isStarred, setIsStarred] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites, loaded] = useUserSettingsCompatibility<FavoritesType>(
    FAVORITES_CONFIG_MAP_KEY,
    FAVORITES_LOCAL_STORAGE_KEY,
    undefined,
    true,
  );
  const alphanumericRegex = /^[\p{L}\p{N}\s-]*$/u;

  const currentUrlPath = window.location.pathname;

  useEffect(() => {
    if (loaded) {
      const isCurrentlyFavorited = favorites?.some((favorite) => favorite.url === currentUrlPath);
      setIsStarred(isCurrentlyFavorited);
    }
  }, [loaded, favorites, currentUrlPath]);

  const handleStarClick: ButtonProps['onClick'] = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isCurrentlyFavorited = favorites?.some((favorite) => favorite.url === currentUrlPath);
    if (isCurrentlyFavorited) {
      const updatedFavorites = favorites?.filter((favorite) => favorite.url !== currentUrlPath);
      setFavorites(updatedFavorites);
      setIsStarred(false);
      triggerTelemetry('remove-favorite', {
        url: currentUrlPath,
      });
    } else {
      const currentUrlSplit = currentUrlPath.includes('~')
        ? currentUrlPath.split('~')
        : currentUrlPath.split('/');
      const sanitizedDefaultName = (
        defaultName ?? currentUrlSplit.slice(-1)[0].split('?')[0]
      ).replace(/[^\p{L}\p{N}\s-]/gu, '-');
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
    triggerTelemetry('add-favorite', {
      name: name.trim(),
      url: currentUrlPath,
    });
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
            <Button
              key="confirm"
              variant="primary"
              onClick={handleConfirmStar}
              form="confirm-favorite"
            >
              {t('Save')}
            </Button>,
            <Button key="cancel" variant="link" onClick={handleModalClose}>
              {t('Cancel')}
            </Button>,
          ]}
          variant={ModalVariant.small}
        >
          <Form id="confirm-favorite-form" onSubmit={handleConfirmStar}>
            <FormGroup label={t('Name')} isRequired fieldId="input-name">
              <TextInput
                id="confirm-favorite-form-name"
                data-test="input-name"
                name="name"
                type="text"
                onChange={(e, v) => handleNameChange(v)}
                value={name || ''}
                autoFocus
                required
              />
              {error && (
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem variant="error">{error}</HelperTextItem>
                  </HelperText>
                </FormHelperText>
              )}
            </FormGroup>
          </Form>
        </Modal>
      )}
    </div>
  );
};
