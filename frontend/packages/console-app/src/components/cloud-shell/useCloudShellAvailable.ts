import * as React from 'react';
import { useFlag } from '@console/shared';
import { FLAG_DEVWORKSPACE } from '../../consts';
import { checkTerminalAvailable } from './cloud-shell-utils';

const useCloudShellAvailable = () => {
  const [terminalAvailable, setTerminalAvailable] = React.useState(false);
  const flagEnabled = useFlag(FLAG_DEVWORKSPACE);
  React.useEffect(() => {
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
