import * as React from 'react';
import { Tooltip, Button } from '@patternfly/react-core';
import { OutlinedWindowMinimizeIcon, OutlinedWindowRestoreIcon } from '@patternfly/react-icons';

type MinimizeRestoreButtonProps = {
  minimizeText: string;
  restoreText: string;
  minimize?: boolean;
  onClick: (minimized: boolean) => void;
};

const MinimizeRestoreButton: React.FC<MinimizeRestoreButtonProps> = ({
  minimizeText,
  restoreText,
  minimize = true,
  onClick,
}) => {
  const onMinimize = () => {
    onClick(true);
  };
  const onRestore = () => {
    onClick(false);
  };
  return (
    <Tooltip content={minimize ? minimizeText : restoreText}>
      <Button
        variant="plain"
        type="button"
        onClick={minimize ? onMinimize : onRestore}
        aria-label={minimize ? minimizeText : restoreText}
        isInline
      >
        {minimize ? <OutlinedWindowMinimizeIcon /> : <OutlinedWindowRestoreIcon />}
      </Button>
    </Tooltip>
  );
};

export default MinimizeRestoreButton;
