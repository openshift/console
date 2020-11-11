import * as React from 'react';
import Helmet from 'react-helmet';
import { PageHeading, LoadingBox, ExternalLink } from '@console/internal/components/utils';
import { ProjectModel, ConsoleLinkModel } from '@console/internal/models';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { DevPreviewBadge } from '@console/shared';
import GitOpsList from './list/GitOpsList';
import { fetchAllAppGroups, getManifestURLs, getPipelinesBaseURI } from './utils/gitops-utils';
import useDefaultSecret from './utils/useDefaultSecret';
import { Split } from '@patternfly/react-core';
import * as _ from 'lodash-es';
import './GitOpsListPage.scss';

const projectRes = { isList: true, kind: ProjectModel.kind, optional: true };

const GitOpsListPage: React.FC = () => {
  const [appGroups, setAppGroups] = React.useState(null);
  const [emptyStateMsg, setEmptyStateMsg] = React.useState(null);
  const [namespaces, nsLoaded, nsError] = useK8sWatchResource<K8sResourceKind[]>(projectRes);
  const [secretNS, secretName] = useDefaultSecret();
  const baseURL = getPipelinesBaseURI(secretNS, secretName);

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

  const [consoleLinks] = useK8sWatchResource<K8sResourceKind[]>({
    isList: true,
    kind: referenceForModel(ConsoleLinkModel),
    optional: true,
  });
  let aLink = _.find(consoleLinks, (link: K8sResourceKind) => 
   (link.metadata?.name === 'argocd' && link.spec?.location === 'ApplicationMenu')
  );

  return (
    <>
      <Helmet>
        <title>Application Stages</title>
      </Helmet>
      <PageHeading 
        title="Application Stages" 
        badge={
            <>
              {aLink ? (
                <Split className="odc-gitops-list-page-heading">
                  <ExternalLink href={aLink.spec.href} text="Argo CD" additionalClassName="odc-gitops-list-page-heading__argocd"/>
                  <DevPreviewBadge />
                </Split>
              ) : (
                <DevPreviewBadge />
              )}
            </>
        }>
      </PageHeading> 
      {!appGroups && !emptyStateMsg ? (
        <LoadingBox />
      ) : (
        <GitOpsList appGroups={appGroups} emptyStateMsg={emptyStateMsg} />
      )}
    </>
  );
};

export default GitOpsListPage;
