import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { PageHeading, LoadingBox } from '@console/internal/components/utils';
import { ProjectModel } from '@console/internal/models';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { DevPreviewBadge } from '@console/shared';
import GitOpsList from './list/GitOpsList';
import { fetchAllAppGroups, getManifestURLs, getPipelinesBaseURI } from './utils/gitops-utils';
import useDefaultSecret from './utils/useDefaultSecret';

const projectRes = { isList: true, kind: ProjectModel.kind, optional: true };

const GitOpsListPage: React.FC = () => {
  const [appGroups, setAppGroups] = React.useState(null);
  const [emptyStateMsg, setEmptyStateMsg] = React.useState(null);
  const [namespaces, nsLoaded, nsError] = useK8sWatchResource<K8sResourceKind[]>(projectRes);
  const [secretNS, secretName] = useDefaultSecret();
  const baseURL = getPipelinesBaseURI(secretNS, secretName);
  const { t } = useTranslation();

  React.useEffect(() => {
    let ignore = false;

    const getAppGroups = async () => {
      if (nsLoaded) {
        const manifestURLs = (!nsError && getManifestURLs(namespaces)) || [];
        const [allAppGroups, emptyMsg] = await fetchAllAppGroups(baseURL, manifestURLs);
        if (ignore) return;
        setAppGroups(allAppGroups);
        setEmptyStateMsg(emptyMsg);
      }
    };

    getAppGroups();

    return () => {
      ignore = true;
    };
  }, [baseURL, namespaces, nsError, nsLoaded]);

  return (
    <>
      <Helmet>
        <title>{t('devconsole~Application Stages')}</title>
      </Helmet>
      <PageHeading title={t('devconsole~Application Stages')} badge={<DevPreviewBadge />} />
      {!appGroups && !emptyStateMsg ? (
        <LoadingBox />
      ) : (
        <GitOpsList appGroups={appGroups} emptyStateMsg={emptyStateMsg} />
      )}
    </>
  );
};

export default GitOpsListPage;
