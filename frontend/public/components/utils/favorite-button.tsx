import * as React from 'react';
import { useTranslation } from 'react-i18next';
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
import {
  FAVORITES_LOCAL_STORAGE_KEY,
  Modal,
  RedExclamationCircleIcon,
  useUserSettingsCompatibility,
} from '@console/shared';
import { connectToModel } from '../../kinds';
import { StarIcon } from '@patternfly/react-icons';

export type FavoritesType = Array<{
  name: string;
  url: string;
}>;

export const FAVORITES_CONFIG_MAP_KEY = 'console.favorites';
const MAX_FAVORITE_COUNT = 10;

export const FavoriteButton = connectToModel(() => {
  const { t } = useTranslation();
  const ref = React.useRef();
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
      setIsModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setError('');
    setName('');
    setIsModalOpen(false);
  };

  const handleConfirmStar = () => {
    if (!name.trim()) {
      setError(t('public~Name is required.'));
      return;
    }
    const nameExists = favorites?.some((favorite) => favorite.name === name.trim());
    if (nameExists) {
      setError(
        t(
          'public~The name {{favoriteName}} already exists in your favorites. Choose a unique name to save to your favorites.',
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
    const alphanumericRegex = /^[a-zA-Z0-9- ]*$/;
    if (!alphanumericRegex.test(value)) {
      setError(t('Name can only contain letters, numbers, spaces, and hyphens.'));
    } else {
      setError(null);
      setName(value);
    }
  };

  const tooltipText = t(
    'public~Maximum number of favorites ({{maxCount}}) reached. To add another favorite, remove an existing page from your favorites.',
    { maxCount: MAX_FAVORITE_COUNT },
  );

  return (
    <>
      {favorites?.length >= MAX_FAVORITE_COUNT && !isStarred ? (
        <Tooltip content={tooltipText} triggerRef={ref} position="left">
          <div ref={ref}>
            <Button
              icon={<StarIcon color={isStarred ? 'gold' : 'gray'} />}
              className="co-actions-icon"
              variant="link"
              aria-label="save-favorite"
              aria-pressed={isStarred}
              onClick={handleStarClick}
              isDisabled={true}
            />
          </div>
        </Tooltip>
      ) : (
        <Button
          icon={<StarIcon color={isStarred ? 'gold' : 'gray'} />}
          className="co-actions-icon"
          variant="link"
          aria-label="save-favorite"
          aria-pressed={isStarred}
          onClick={handleStarClick}
        />
      )}

      {isModalOpen && (
        <Modal
          title={t('public~Add to favorites')}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          actions={[
            <Button key="confirm" variant="primary" onClick={handleConfirmStar}>
              {t('public~Save')}
            </Button>,
            <Button key="cancel" variant="link" onClick={handleModalClose}>
              {t('public~Cancel')}
            </Button>,
          ]}
          variant={ModalVariant.small}
        >
          <Form>
            <FormGroup label={t('public~Name')} isRequired fieldId="input-name">
              <TextInput
                id="input-name"
                data-test="input-name"
                name="name"
                type="text"
                onChange={(e, v) => handleNameChange(v)}
                value={name || ''}
                autoFocus
                required
                maxLength={20}
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
    </>
  );
});
