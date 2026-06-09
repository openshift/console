import type { FC } from 'react';
import { Button, ButtonProps } from '@patternfly/react-core';
import { RhUiPauseIcon, RhUiPlayIcon } from '@patternfly/react-icons';
import { css } from '@patternfly/react-styles';
import { useTranslation } from 'react-i18next';

export interface TogglePlayProps {
  active: boolean;
  className?: string;
  onClick: ButtonProps['onClick'];
}

export const TogglePlay: FC<TogglePlayProps> = ({ active, className, onClick }) => {
  const { t } = useTranslation();

  return (
    <Button
      icon={active ? <RhUiPauseIcon /> : <RhUiPlayIcon />}
      variant="plain"
      className={css(
        'co-toggle-play',
        active ? 'co-toggle-play--active' : 'co-toggle-play--inactive',
        className,
      )}
      onClick={onClick}
      aria-label={active ? t('public~Pause event streaming') : t('public~Start streaming events')}
    />
  );
};
