import * as React from 'react';
import { consoleFetchJSON as coFetchJSON } from '@console/dynamic-plugin-sdk/src/utils/fetch';
import { FLAGS } from '../constants';
import { useFlag } from './flag';

const COPY_LOGIN_COMMANDS_ENDPOINT = '/api/copy-login-commands';

export const useCopyLoginCommands = (): [string, string] => {
  const [requestTokenURL, setRequestTokenURL] = React.useState<string>();
  const [externalLoginCommand, setExternalLoginCommand] = React.useState<string>();
  const authEnabled = useFlag(FLAGS.AUTH_ENABLED);
  React.useEffect(() => {
    if (authEnabled) {
      coFetchJSON(COPY_LOGIN_COMMANDS_ENDPOINT, 'GET', {}, 5000)
        .then((resp) => {
          const newRequestTokenURL = resp?.requestTokenURL ?? '';
          const newExternalLoginCommand = resp?.externalLoginCommand ?? '';
          if (newRequestTokenURL) {
            setRequestTokenURL(newRequestTokenURL);
            setExternalLoginCommand('');
          } else if (newExternalLoginCommand) {
            setExternalLoginCommand(newExternalLoginCommand);
            setRequestTokenURL('');
          }
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.warn(`GET ${COPY_LOGIN_COMMANDS_ENDPOINT} failed: ${err}`);
          setRequestTokenURL('');
          setExternalLoginCommand('');
        });
    }
  }, [authEnabled]);

  return [requestTokenURL, externalLoginCommand];
};
