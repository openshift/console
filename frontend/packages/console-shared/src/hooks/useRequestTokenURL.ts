import * as React from 'react';
import { consoleFetchJSON as coFetchJSON } from '@console/dynamic-plugin-sdk/src/utils/fetch';
import { useActiveCluster } from '@console/shared/src/hooks/useActiveCluster';

export const useRequestTokenURL = (): [string] => {
  const [clusterName] = useActiveCluster(); // TODO remove multicluster
  const [requestTokenURL, setClusterTokenURL] = React.useState<string>();
  React.useEffect(() => {
    const url = '/api/request-token';
    coFetchJSON(url, 'GET', {}, 5000, clusterName)
      .then((resp) => {
        setClusterTokenURL(resp?.requestTokenURL);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.warn(`Could not get request token URL for ${clusterName}: ${err}`);
        setClusterTokenURL('');
      });
  }, [clusterName]);

  return [requestTokenURL];
};
