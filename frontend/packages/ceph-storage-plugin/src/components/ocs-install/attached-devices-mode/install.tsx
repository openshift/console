import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { match as RouterMatch } from 'react-router';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { Alert, Button } from '@patternfly/react-core';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { history, LoadingBox } from '@console/internal/components/utils';
import {
  useK8sWatchResource,
  WatchK8sResource,
} from '@console/internal/components/utils/k8s-watch-hook';
import { ClusterServiceVersionModel, SubscriptionModel } from '@console/operator-lifecycle-manager';
import { getNamespace } from '@console/shared';
import CreateStorageClusterWizard from './install-wizard';
import { NavUtils } from '../../../types';
import { getOperatorVersion } from '../../../selectors';
import { LSO_OPERATOR } from '../../../constants';
import './attached-devices.scss';

const goToLSOInstallationPage = () =>
  history.push(
    '/operatorhub/all-namespaces?details-item=local-storage-operator-redhat-operators-openshift-marketplace',
  );

export const CreateAttachedDevicesCluster: React.FC<CreateAttachedDevicesClusterProps> = ({
  match,
  mode,
  navUtils,
}) => {
  const { t } = useTranslation();

  const [lsoSubscription, setLsoSubscription] = React.useState<K8sResourceKind>();
  const isDataLoaded = React.useRef(false);
  const lsoNs = getNamespace(lsoSubscription);
  const lsoVersion = getOperatorVersion(lsoSubscription);

  const subscriptionResource: WatchK8sResource = {
    kind: referenceForModel(SubscriptionModel),
    isList: true,
  };
  const [subscriptions, subscriptionsLoaded, subscriptionsLoadError] = useK8sWatchResource<
    K8sResourceKind[]
  >(subscriptionResource);

  const csvResource = {
    kind: referenceForModel(ClusterServiceVersionModel),
    name: lsoVersion,
    namespaced: true,
    namespace: lsoNs,
    isList: false,
  };
  const [csv, csvLoaded, csvLoadError] = useK8sWatchResource<K8sResourceKind>(csvResource);

  if (subscriptionsLoaded && csvLoaded) isDataLoaded.current = true;
  const isLsoCsvSucceeded = !!lsoNs && !!lsoVersion && csv?.status?.phase === 'Succeeded';

  React.useEffect(() => {
    setLsoSubscription(subscriptions.find((item) => item?.spec?.name === LSO_OPERATOR));
  }, [subscriptions]);

  return !isDataLoaded.current && !subscriptionsLoadError && !csvLoadError ? (
    <LoadingBox />
  ) : subscriptionsLoadError || csvLoadError || !isLsoCsvSucceeded ? (
    <Alert
      className="co-alert ceph-ocs-install__lso-install-alert"
      variant="info"
      title={t('ceph-storage-plugin~Local Storage Operator not installed')}
      isInline
    >
      <Trans t={t} ns="ceph-storage-plugin">
        Before we can create a StorageCluster, the Local Storage operator needs to be installed.
        When installation is finished come back to OpenShift Container Storage to create a
        StorageCluster.
        <div className="ceph-ocs-install__lso-alert__button">
          <Button type="button" variant="primary" onClick={goToLSOInstallationPage}>
            Install
          </Button>
        </div>
      </Trans>
    </Alert>
  ) : (
    <CreateStorageClusterWizard navUtils={navUtils} match={match} lsoNs={lsoNs} mode={mode} />
  );
};

type CreateAttachedDevicesClusterProps = {
  navUtils: NavUtils;
  match: RouterMatch<{ appName: string; ns: string }>;
  mode: string;
};
