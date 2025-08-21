import { useState, useEffect } from 'react';
import { useFlag } from '@console/shared/src/hooks/flag';
import { FLAG_DEVWORKSPACE } from '../../const';
import { checkTerminalAvailable } from './cloud-shell-utils';

const useCloudShellAvailable = () => {
  const [terminalAvailable, setTerminalAvailable] = useState(false);
  const flagEnabled = useFlag(FLAG_DEVWORKSPACE);
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
    } else {
      setTerminalAvailable(false);
    }
    return () => {
      mounted = false;
    };
  }, [flagEnabled]);

  return flagEnabled && terminalAvailable;
};

export default useCloudShellAvailable;
