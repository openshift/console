import * as React from 'react';
import * as _ from 'lodash';
import { match as RouterMatch } from 'react-router';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { Alert, Button } from '@patternfly/react-core';
import { StorageClassResourceKind, K8sResourceKind, k8sList } from '@console/internal/module/k8s';
import { history, LoadingBox } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { StorageClassModel } from '@console/internal/models';
import { fetchK8s } from '@console/internal/graphql/client';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager';
import { LSOSubscriptionResource } from '../../../constants/resources';
import { filterSCWithNoProv } from '../../../utils/install';
import CreateSC from './create-sc/create-sc';
import './attached-devices.scss';

const goToLSOInstallationPage = () => {
  history.push(
    '/operatorhub/all-namespaces?details-item=local-storage-operator-redhat-operators-openshift-marketplace',
  );
};

export const CreateAttachedDevicesCluster: React.FC<CreateAttachedDevicesClusterProps> = ({
  match,
  mode,
}) => {
  const { appName, ns } = match.params;
  const [hasNoProvSC, setHasNoProvSC] = React.useState(false);
  const [isLsoPresent, setIsLsoPresent] = React.useState(false);
  const [allDataLoaded, setAllDataLoaded] = React.useState(false);
  const [lsoNs, setLsoNs] = React.useState('');
  const [subscription, subscriptionLoaded, subscriptionLoadError] = useK8sWatchResource<
    K8sResourceKind[]
  >(LSOSubscriptionResource);

  React.useEffect(() => {
    if (subscriptionLoadError || (!subscription.length && subscriptionLoaded)) {
      setIsLsoPresent(false);
      setAllDataLoaded(true);
    } else if (subscriptionLoaded && !_.isEmpty(subscription[0])) {
      fetchK8s(
        ClusterServiceVersionModel,
        subscription[0]?.status?.installedCSV,
        subscription[0]?.metadata?.namespace,
      )
        .then(() => {
          setIsLsoPresent(true);
          setLsoNs(subscription[0]?.metadata?.namespace);
          setAllDataLoaded(true);
        })
        .catch(() => {
          setIsLsoPresent(false);
          setAllDataLoaded(true);
        });
    }
  }, [subscription, subscriptionLoaded, subscriptionLoadError]);

  React.useEffect(() => {
    /* this call can't be watched here as watching will take the user back to this view 
    once a sc gets created from ocs install in case of no sc present */
    k8sList(StorageClassModel)
      .then((storageClasses: StorageClassResourceKind[]) => {
        const filteredSCData = storageClasses.filter(filterSCWithNoProv);
        if (filteredSCData.length) {
          setHasNoProvSC(true);
        }
      })
      .catch(() => setHasNoProvSC(false));
  }, [appName, ns]);

  return !allDataLoaded && !subscriptionLoadError ? (
    <LoadingBox />
  ) : subscriptionLoadError || !isLsoPresent ? (
    <Alert
      className="co-alert ceph-ocs-install__lso-install-alert"
      variant="info"
      title="Local Storage Operator Not Installed"
      isInline
    >
      Before we can create a storage cluster, the local storage operator needs to be installed. When
      installation is finished come back to OpenShift Container Storage to create a storage cluster.
      <div className="ceph-ocs-install__lso-alert__button">
        <Button type="button" variant="primary" onClick={goToLSOInstallationPage}>
          Install
        </Button>
      </div>
    </Alert>
  ) : (
    <CreateSC
      hasNoProvSC={hasNoProvSC}
      setHasNoProvSC={setHasNoProvSC}
      match={match}
      lsoNs={lsoNs}
      mode={mode}
    />
  );
};

type CreateAttachedDevicesClusterProps = {
  match: RouterMatch<{ appName: string; ns: string }>;
  mode: string;
};
