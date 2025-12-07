import { useEffect, useState } from 'react';
import { getTaskRunLog } from './tekton-results';

export const useTRTaskRunLog = (
  namespace: string,
  taskRunName: string,
  taskRunPath: string,
): [string, boolean, unknown] => {
  const [result, setResult] = useState<[string, boolean, unknown]>([null, false, undefined]);
  useEffect(() => {
    let disposed = false;
    if (namespace && taskRunName) {
      (async () => {
        try {
          const log = await getTaskRunLog(taskRunPath);
          if (!disposed) {
            setResult([log, true, undefined]);
          }
        } catch (e) {
          if (!disposed) {
            setResult([null, false, e]);
          }
        }
      })();
    }
    return () => {
      disposed = true;
    };
  }, [namespace, taskRunName, taskRunPath]);
  return result;
};
