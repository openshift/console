import { useState, useEffect } from 'react';
import { consoleFetchJSON as coFetchJSON } from '@console/dynamic-plugin-sdk/src/utils/fetch';
import { FLAGS } from '../constants';
import { useFlag } from './flag';

const COPY_LOGIN_COMMANDS_ENDPOINT = '/api/copy-login-commands';

export const useCopyLoginCommands = (): [string, string, string] => {
  const [requestTokenURL, setRequestTokenURL] = useState<string>();
  const [externalLoginCommand, setExternalLoginCommand] = useState<string>();
  const [loginServerURL, setLoginServerURL] = useState<string>('');
  const authEnabled = useFlag(FLAGS.AUTH_ENABLED);
  useEffect(() => {
    if (authEnabled) {
      coFetchJSON(COPY_LOGIN_COMMANDS_ENDPOINT, 'GET', {}, 5000)
        .then((resp) => {
          const newRequestTokenURL = resp?.requestTokenURL ?? '';
          const newExternalLoginCommand = resp?.externalLoginCommand ?? '';
          const newLoginServerURL = resp?.customLoginServerURL ?? '';
          setLoginServerURL(newLoginServerURL);
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
          setLoginServerURL('');
        });
    }
  }, [authEnabled]);

  return [requestTokenURL, externalLoginCommand, loginServerURL];
};
