import type { FC } from 'react';
import { Button, ButtonProps } from '@patternfly/react-core';
import { RhUiPauseFillIcon, RhUiPlayFillIcon } from '@patternfly/react-icons';
import { css } from '@patternfly/react-styles';
import { useTranslation } from 'react-i18next';

export interface TogglePlayProps {
  active: boolean;
  className?: string;
  onClick: ButtonProps['onClick'];
}

export const TogglePlay: FC<TogglePlayProps> = ({ active, className, onClick }) => {
  const { t } = useTranslation('public');

  return (
    <Button
      icon={active ? <RhUiPauseFillIcon /> : <RhUiPlayFillIcon />}
      variant="plain"
      className={css(
        'co-toggle-play',
        active ? 'co-toggle-play--active' : 'co-toggle-play--inactive',
        className,
      )}
      onClick={onClick}
      aria-label={active ? t('Pause event streaming') : t('Start streaming events')}
    />
  );
};
