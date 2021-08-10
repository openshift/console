import * as React from 'react';
import { coFetch } from '@console/internal/co-fetch';

export type ApiResult<R extends any[]> = [R, boolean, string];
export type UseApiResponse = <R extends any = any>(
  url: string,
  hasPermission: boolean,
) => ApiResult<R[]>;

const useApiResponse: UseApiResponse = (url: string, hasPermission: boolean) => {
  const [resultData, setResult] = React.useState([]);
  const [loaded, setLoaded] = React.useState(false);
  const [loadedError, setLoadedError] = React.useState<string>();

  React.useEffect(() => {
    let mounted = true;
    if (hasPermission) {
      coFetch(url)
        .then(async (res) => {
          const json = await res.json();
          if (mounted) {
            setLoaded(true);
            setResult(json.data);
          }
        })
        .catch((err) => {
          setLoaded(true);
          if (mounted) setLoadedError(err?.message);
        });
    } else {
      setLoaded(true);
    }
    return () => {
      mounted = false;
    };
  }, [url, hasPermission]);

  return [resultData, loaded, loadedError];
};

export default useApiResponse;
