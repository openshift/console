import { Button, ButtonProps } from '@patternfly/react-core';
import { PauseIcon } from '@patternfly/react-icons/dist/esm/icons/pause-icon';
import { PlayIcon } from '@patternfly/react-icons/dist/esm/icons/play-icon';
import { css } from '@patternfly/react-styles';
import { useTranslation } from 'react-i18next';

export interface TogglePlayProps {
  active: boolean;
  className?: string;
  onClick: ButtonProps['onClick'];
}

export const TogglePlay: Snail.FCC<TogglePlayProps> = ({ active, className, onClick }) => {
  const { t } = useTranslation();

  return (
    <Button
      icon={active ? <PauseIcon /> : <PlayIcon />}
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
