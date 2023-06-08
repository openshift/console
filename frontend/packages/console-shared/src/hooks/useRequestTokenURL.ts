import * as React from 'react';
import { consoleFetchJSON as coFetchJSON } from '@console/dynamic-plugin-sdk/src/utils/fetch';
import { useActiveCluster } from '@console/shared/src/hooks/useActiveCluster';
import { FLAGS } from '../constants';
import { useFlag } from './flag';

export const useRequestTokenURL = (): [string] => {
  const [clusterName] = useActiveCluster(); // TODO remove multicluster
  const [requestTokenURL, setRequestTokenURL] = React.useState<string>();
  const authEnabled = useFlag(FLAGS.AUTH_ENABLED);
  React.useEffect(() => {
    if (authEnabled && window.SERVER_FLAGS.requestTokenURL) {
      coFetchJSON(window.SERVER_FLAGS.requestTokenURL, 'GET', {}, 5000, clusterName)
        .then((resp) => {
          setRequestTokenURL(resp?.requestTokenURL);
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.warn(`Could not get request token URL for ${clusterName}: ${err}`);
          setRequestTokenURL('');
        });
    }
  }, [authEnabled, clusterName]);

  return [requestTokenURL];
};
