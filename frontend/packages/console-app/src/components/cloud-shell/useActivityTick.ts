import * as React from 'react';
import { sendActivityTick } from './cloud-shell-utils';

// 1 minute
const TICK_INTERVAL = 60000;

const useActivityTick = (workspaceName: string, namespace: string) => {
  const lastTick = React.useRef<number>(0);

  const tick = React.useCallback(() => {
    const now = Date.now();
    if (now - lastTick.current >= TICK_INTERVAL) {
      sendActivityTick(workspaceName, namespace);
      lastTick.current = now;
    }
  }, [workspaceName, namespace]);

  return tick;
};

export default useActivityTick;
