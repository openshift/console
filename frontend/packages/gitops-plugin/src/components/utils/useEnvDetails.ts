import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { fetchAppGroups } from './gitops-utils';
import { GitOpsAppGroupData } from './gitops-types';

const useEnvDetails = (appName, manifestURL, pipelinesBaseURI) => {
  const { t } = useTranslation();
  const [envs, setEnvs] = React.useState<string[]>(null);
  const [emptyStateMsg, setEmptyStateMsg] = React.useState(null);
  React.useEffect(() => {
    let ignore = false;

    const getEnvs = async () => {
      if (!pipelinesBaseURI) return;
      let appGroups: GitOpsAppGroupData[];
      let emptyMsg = null;
      try {
        appGroups = await fetchAppGroups(pipelinesBaseURI, manifestURL);
      } catch {} // eslint-disable-line no-empty
      if (ignore) return;
      const app = _.find(appGroups, (appObj) => appName === appObj?.name);
      if (!app?.environments) {
        emptyMsg = t(
          'gitops-plugin~Environment details were not found. Try reloading the page or contacting an administrator.',
        );
      }
      setEmptyStateMsg(emptyMsg);
      setEnvs(app?.environments);
    };

    getEnvs();

    return () => {
      ignore = true;
    };
  }, [appName, manifestURL, pipelinesBaseURI, t]);

  return [envs, emptyStateMsg];
};

export default useEnvDetails;
