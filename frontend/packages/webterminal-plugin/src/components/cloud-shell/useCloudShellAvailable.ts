import { useState, useEffect } from 'react';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { FLAG_DEVWORKSPACE } from '../../const';
import { checkTerminalAvailable } from './cloud-shell-utils';

export const useCloudShellAvailable = () => {
  const [terminalAvailable, setTerminalAvailable] = useState(false);
  const flagEnabled = useFlag(FLAG_DEVWORKSPACE);

  // Reset the availability result when the flag is disabled so a stale
  // `true` from a previous check is not reported if the flag is re-enabled.
  const [prevFlagEnabled, setPrevFlagEnabled] = useState(flagEnabled);
  if (prevFlagEnabled !== flagEnabled) {
    setPrevFlagEnabled(flagEnabled);
    if (!flagEnabled) {
      setTerminalAvailable(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    if (flagEnabled) {
      checkTerminalAvailable()
        .then(() => {
          if (mounted) {
            setTerminalAvailable(true);
          }
        })
        .catch(() => {
          if (mounted) {
            setTerminalAvailable(false);
          }
        });
    }
    return () => {
      mounted = false;
    };
  }, [flagEnabled]);

  return flagEnabled && terminalAvailable;
};
