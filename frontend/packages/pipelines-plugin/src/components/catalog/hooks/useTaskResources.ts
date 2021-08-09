import * as React from 'react';
import { coFetch } from '@console/internal/co-fetch';
import { TEKTON_HUB_API_ENDPOINT } from '../const';

const useTaskResources = () => {
  const [tektonHubTasks, setTektonHubTasks] = React.useState<any>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [loadedError, setLoadedError] = React.useState<string>();

  React.useEffect(() => {
    let mounted = true;
    coFetch(`${TEKTON_HUB_API_ENDPOINT}/resources`)
      .then(async (res) => {
        const json = await res.json();
        if (mounted) {
          setLoaded(true);
          setTektonHubTasks(json.data);
        }
      })
      .catch((err) => {
        setLoaded(true);
        if (mounted) setLoadedError(err?.message);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return [tektonHubTasks, loaded, loadedError];
};

export default useTaskResources;
