import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { fetchAppGroups } from './gitops-utils';

const useEnvDetails = (appName, manifestURL, pipelinesBaseURI) => {
  const { t } = useTranslation();
  const [envs, setEnvs] = React.useState<string[]>(null);
  const [emptyStateMsg, setEmptyStateMsg] = React.useState(null);
  React.useEffect(() => {
    let ignore = false;

    if (pipelinesBaseURI) {
      fetchAppGroups(pipelinesBaseURI, manifestURL)
        .then((appGroups) => {
          if (ignore) return;
          const app = _.find(appGroups, (appObj) => appName === appObj?.name);
          if (!app?.environments) {
            setEmptyStateMsg(
              t(
                'gitops-plugin~Environment details were not found. Try reloading the page or contacting an administrator.',
              ),
            );
          }
          setEnvs(app?.environments);
        })
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.error('Unable to load EnvDetails', e);
        });
    }

    return () => {
      ignore = true;
    };
  }, [appName, manifestURL, pipelinesBaseURI, t]);

  return [envs, emptyStateMsg];
};

export default useEnvDetails;
