import type { FC } from 'react';
import type { ButtonProps } from '@patternfly/react-core';
import { Tooltip, Button } from '@patternfly/react-core';
import { OutlinedWindowMinimizeIcon } from '@patternfly/react-icons/dist/esm/icons/outlined-window-minimize-icon';
import { OutlinedWindowRestoreIcon } from '@patternfly/react-icons/dist/esm/icons/outlined-window-restore-icon';

type MinimizeRestoreButtonProps = Omit<ButtonProps, 'onClick'> & {
  minimizeText: string;
  restoreText: string;
  minimize?: boolean;
  onClick: (minimized: boolean) => void;
};

export const MinimizeRestoreButton: FC<MinimizeRestoreButtonProps> = ({
  minimizeText,
  restoreText,
  minimize = true,
  onClick,
  ...props
}) => {
  const onMinimize = () => {
    onClick(true);
  };
  const onRestore = () => {
    onClick(false);
  };
  return (
    <Tooltip
      key={minimize ? 'btn-minmize' : 'btn-restore'}
      content={minimize ? minimizeText : restoreText}
    >
      <Button
        icon={minimize ? <OutlinedWindowMinimizeIcon /> : <OutlinedWindowRestoreIcon />}
        variant="plain"
        type="button"
        onClick={minimize ? onMinimize : onRestore}
        aria-label={minimize ? minimizeText : restoreText}
        isInline
        {...props}
      />
    </Tooltip>
  );
};
