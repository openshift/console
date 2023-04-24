import * as React from 'react';
import { consoleFetchJSON as coFetchJSON } from '@console/dynamic-plugin-sdk/src/utils/fetch';
import { FLAGS } from '../constants';
import { useFlag } from './flag';

const REQUEST_TOKEN_ENDPOINT = '/api/request-token';

export const useRequestTokenURL = (): [string] => {
  const [requestTokenURL, setRequestTokenURL] = React.useState<string>();
  const authEnabled = useFlag(FLAGS.AUTH_ENABLED);
  React.useEffect(() => {
    if (authEnabled) {
      coFetchJSON(REQUEST_TOKEN_ENDPOINT, 'GET', {}, 5000)
        .then((resp) => {
          setRequestTokenURL(resp?.requestTokenURL);
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.warn(`Could not get request token URL: ${err}`);
          setRequestTokenURL('');
        });
    }
  }, [authEnabled]);

  return [requestTokenURL];
};
