import * as React from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import { PageHeading, LoadingBox } from '@console/internal/components/utils';
import { NamespaceModel } from '@console/internal/models';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { userStateToProps } from '@console/internal/reducers/ui';
import GitOpsList from './GitOpsList';
import { fetchAllAppGroups, getManifestURLs } from './gitops-utils';

interface StateProps {
  user: K8sResourceKind;
}

const projectRes = { isList: true, kind: NamespaceModel.kind, optional: true };

const GitOpsListPage: React.FC<StateProps> = ({ user }) => {
  const [appGroups, setAppGroups] = React.useState(null);
  const [emptyStateMsg, setEmptyStateMsg] = React.useState(null);
  const [namespaces, nsLoaded, nsError] = useK8sWatchResource<K8sResourceKind[]>(projectRes);
  const userName = _.replace(user?.metadata?.name ?? '', /[^a-zA-Z0-9-]/g, '');
  const [secretNS, secretName] =
    (userName && [`pipelines-${userName}-github`, `${userName}-github-token`]) || [];
  const baseURL =
    (secretNS &&
      secretName &&
      `/api/gitops/pipelines?secretNS=${secretNS}&secretName=${secretName}`) ||
    undefined;

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

  if (!appGroups && !emptyStateMsg) {
    return <LoadingBox />;
  }

  return (
    <>
      <Helmet>
        <title>GitOps</title>
      </Helmet>
      <PageHeading title="GitOps" />
      <GitOpsList appGroups={appGroups} emptyStateMsg={emptyStateMsg} />
    </>
  );
};

export default connect<StateProps, null, null>(userStateToProps)(GitOpsListPage);
