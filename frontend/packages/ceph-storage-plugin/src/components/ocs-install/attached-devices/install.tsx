import * as React from 'react';
import { match as RouterMatch } from 'react-router';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { Alert, Button } from '@patternfly/react-core';
import { StorageClassResourceKind, K8sResourceKind } from '@console/internal/module/k8s';
import { history } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { fetchK8s } from '@console/internal/graphql/client';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager';
import { LSO_NAMESPACE } from '@console/local-storage-operator-plugin/src/constants';
import { CreateOCS } from './install-lso-sc';
import { scResource, LSOSubscriptionResource } from '../../../constants/resources';
import { filterSCWithNoProv } from '../../../utils/install';
import './attached-devices.scss';

export const CreateAttachedDevicesCluster: React.FC<CreateAttachedDevicesClusterProps> = ({
  match,
}) => {
  const [hasNoProvSC, setHasNoProvSC] = React.useState(false);
  // LSO stands for local-storage-operator
  const [LSOEnabled, setLSOEnabled] = React.useState(false);
  const [scData, scLoaded, scLoadError] = useK8sWatchResource<StorageClassResourceKind[]>(
    scResource,
  );
  const [LSOData, LSOLoaded, LSOLoadError] = useK8sWatchResource<K8sResourceKind>(
    LSOSubscriptionResource,
  );

  React.useEffect(() => {
    if ((LSOLoadError || !LSOData) && LSOLoaded) {
      setLSOEnabled(false);
    } else if (LSOLoaded) {
      // checking for availability of LSO CSV
      fetchK8s(ClusterServiceVersionModel, LSOData?.status?.currentCSV, LSO_NAMESPACE)
        .then(() => {
          setLSOEnabled(true);
        })
        .catch(() => {
          setLSOEnabled(false);
        });
    }
  }, [LSOData, LSOLoaded, LSOLoadError]);

  React.useEffect(() => {
    if ((scLoadError || scData.length === 0) && scLoaded) {
      setHasNoProvSC(false);
    } else if (scLoaded) {
      const filteredSCData = scData.filter(filterSCWithNoProv);
      if (filteredSCData.length) {
        setHasNoProvSC(true);
      }
    }
  }, [scData, scLoaded, scLoadError]);

  const goToLSOInstallationPage = () => {
    history.push(
      '/operatorhub/all-namespaces?details-item=local-storage-operator-redhat-operators-openshift-marketplace',
    );
  };

  return (
    <div className="co-m-pane__body">
      {!LSOEnabled && (
        <Alert
          className="co-alert"
          variant="info"
          title="Local Storage Operator Not Installed"
          isInline
        >
          <div>
            Before we can create a storage cluster, the local storage operator needs to be
            installed. When installation is finished come back to OpenShift Container Storage to
            create a storage cluster.
            <div className="ceph-ocs-install__lso-alert__button">
              <Button type="button" variant="primary" onClick={goToLSOInstallationPage}>
                Install
              </Button>
            </div>
          </div>
        </Alert>
      )}
      {hasNoProvSC && LSOEnabled && <CreateOCS match={match} />}
    </div>
  );
};

type CreateAttachedDevicesClusterProps = {
  match: RouterMatch<{ appName: string; ns: string }>;
};
