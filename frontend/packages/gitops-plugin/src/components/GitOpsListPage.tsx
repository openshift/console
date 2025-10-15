import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { LoadingBox } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ProjectModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { DevPreviewBadge } from '@console/shared';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import GitOpsList from './list/GitOpsList';
import { fetchAllAppGroups, getManifestURLs, getPipelinesBaseURI } from './utils/gitops-utils';
import useDefaultSecret from './utils/useDefaultSecret';
import './GitOpsListPage.scss';

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
        const [allAppGroups, emptyMsg] = await fetchAllAppGroups(baseURL, manifestURLs, t);
        if (ignore) return;
        setAppGroups(allAppGroups);
        setEmptyStateMsg(emptyMsg);
      }
    };

    getAppGroups();

    return () => {
      ignore = true;
    };
  }, [baseURL, namespaces, nsError, nsLoaded, t]);

  const isLoading = !appGroups && !emptyStateMsg;

  return (
    <>
      <DocumentTitle>{t('gitops-plugin~Environments')}</DocumentTitle>
      <PageHeading
        title={t('gitops-plugin~Environments')}
        badge={<DevPreviewBadge />}
        helpText={
          !isLoading &&
          t("gitops-plugin~Select an application to view the environment it's deployed in.")
        }
      />
      {!appGroups && !emptyStateMsg ? (
        <LoadingBox />
      ) : (
        <GitOpsList appGroups={appGroups} emptyStateMsg={emptyStateMsg} />
      )}
    </>
  );
};

export default GitOpsListPage;
