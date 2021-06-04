import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { match as RouteMatch } from 'react-router';
import {
  ListKind,
  referenceForModel,
  StorageClassResourceKind,
} from '@console/internal/module/k8s';
import { history, BreadCrumbs } from '@console/internal/components/utils';
import { RadioGroup } from '@console/internal/components/radio';
import { InfrastructureModel, StorageClassModel } from '@console/internal/models';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { useDeepCompareMemoize } from '@console/shared';
import { getAnnotations } from '@console/shared/src/selectors/common';
import {
  ClusterServiceVersionModel,
  ClusterServiceVersionKind,
} from '@console/operator-lifecycle-manager';
import { getRequiredKeys, createDownloadFile } from './external-mode/utils';
import CreateExternalCluster from './external-mode/install';
import { CreateInternalCluster } from './internal-mode/install-wizard';
import { CreateAttachedDevicesCluster } from './attached-devices-mode/install';
import ExistingClusterModal from './existing-cluster-modal';
import { CEPH_STORAGE_NAMESPACE, MODES, CreateStepsSC } from '../../constants';
import { StorageClusterKind } from '../../types';
import { OCSServiceModel } from '../../models';
import './install-page.scss';
import { filterSCWithNoProv } from '../../utils/install';

const INDEP_MODE_SUPPORTED_PLATFORMS = [
  'BareMetal',
  'None',
  'VSphere',
  'OpenStack',
  'oVirt',
  'IBMCloud',
];

const InstallCluster: React.FC<InstallClusterProps> = ({ match }) => {
  const {
    params: { ns, appName },
    url,
  } = match;
  const csvResource = {
    kind: referenceForModel(ClusterServiceVersionModel),
    name: appName,
    namespace: ns,
    isList: false,
  };
  const { t } = useTranslation();
  const [isIndepModeSupportedPlatform, setIndepModeSupportedPlatform] = React.useState(false);
  const [independentReqdKeys, setIndependentReqdKeys] = React.useState<{ [key: string]: string[] }>(
    null,
  );
  const [downloadFile, setDownloadFile] = React.useState(null);
  const [clusterServiceVersion, setClusterServiceVersion] = React.useState(null);
  const [csv, csvLoaded, csvError] = useK8sWatchResource<ClusterServiceVersionKind>(csvResource);
  const [infra, infraLoaded, infraError] = useK8sGet<any>(InfrastructureModel, 'cluster');
  const [storageCluster] = useK8sGet<ListKind<StorageClusterKind>>(
    OCSServiceModel,
    null,
    CEPH_STORAGE_NAMESPACE,
  );

  const memoizedCSV = useDeepCompareMemoize(csv, true);
  const [sc] = useK8sGet<ListKind<StorageClassResourceKind>>(StorageClassModel);
  const hasNoProvSC = sc?.items?.some(filterSCWithNoProv);

  React.useEffect(() => {
    if (csvLoaded && !csvError) {
      const { configMaps = [], secrets = [], storageClasses = [] } = getRequiredKeys(memoizedCSV);
      setIndependentReqdKeys({ configMaps, secrets, storageClasses });
      const file = createDownloadFile(
        getAnnotations(memoizedCSV)?.['external.features.ocs.openshift.io/export-script'],
      );
      setDownloadFile(file);
      setClusterServiceVersion(memoizedCSV);
    }
  }, [memoizedCSV, csvLoaded, csvError]);

  React.useEffect(() => {
    if (infraLoaded && !infraError) {
      const infraType = infra?.spec?.platformSpec?.type;
      const supportsExternal = INDEP_MODE_SUPPORTED_PLATFORMS.includes(infraType);
      setIndepModeSupportedPlatform(supportsExternal);
    }
  }, [infra, infraLoaded, infraError]);

  const getMode = () => {
    const searchParams = new URLSearchParams(window.location.search.slice(1));
    const modeParam = parseInt(searchParams.get('mode'), 10) || 1;
    const sanitizedMode =
      modeParam && modeParam <= (!isIndepModeSupportedPlatform ? 2 : 3) && modeParam >= 1
        ? modeParam
        : 1;
    return sanitizedMode;
  };

  const getParamString = (step: number, mode: number) => {
    const searchParams = new URLSearchParams(window.location.search.slice(1));
    searchParams.set('step', step.toString());
    searchParams.set('mode', mode.toString());
    return searchParams.toString();
  };

  const getAnchor = (step: number, mode: number) => `~new?${getParamString(step, mode)}`;

  const getStep = (offset: number = 0) => {
    const searchParams = new URLSearchParams(window.location.search.slice(1));
    const step = parseInt(searchParams.get('step'), 10) || 1;
    const sanitizedStep = step && step <= 5 - offset && step >= 1 ? step : 1;
    return sanitizedStep;
  };

  const getIndex = (searchSpace: any, search: string, offset: number = 0) => {
    const index = Object.values(searchSpace).findIndex((el) => el === search);
    return index - offset + 1;
  };

  const handleModeChange = (event: React.FormEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    const modeIndex = getIndex(MODES, value);
    // `modeIndex` can have one of the following numerical values:
    // 1: INTERNAL
    // 2: ATTACHED_DEVICES
    // 3: EXTERNAL
    if (modeIndex === 2 && hasNoProvSC) {
      history.push(getAnchor(3, 2));
    } else {
      history.push(getAnchor(getIndex(CreateStepsSC, CreateStepsSC.DISCOVER), modeIndex));
    }
  };

  const disableClusterCreation: boolean = storageCluster?.items?.length > 0;
  const persistMode = Object.values(MODES)[getMode() - 1];

  return (
    <>
      <div className="co-create-operand__header">
        <div className="co-create-operand__header-buttons">
          {clusterServiceVersion !== null && (
            <BreadCrumbs
              breadcrumbs={[
                {
                  name: clusterServiceVersion.spec.displayName,
                  path: url.replace('/~new', ''),
                },
                {
                  name: t('ceph-storage-plugin~Create Storage Cluster'),
                  path: url,
                },
              ]}
            />
          )}
        </div>
        <h1 className="co-create-operand__header-text">
          {t('ceph-storage-plugin~Create Storage Cluster')}
        </h1>
        <p className="help-block">
          {t(
            'ceph-storage-plugin~OCS runs as a cloud-native service for optimal integration with applications in need of storage and handles the scenes such as provisioning and management.',
          )}
        </p>
      </div>

      <div className="ceph-install__mode-toggle">
        <RadioGroup
          label="Select Mode:"
          currentValue={persistMode}
          inline
          items={[
            {
              value: MODES.INTERNAL,
              title: MODES.INTERNAL,
            },
            {
              value: MODES.ATTACHED_DEVICES,
              title: MODES.ATTACHED_DEVICES,
            },
            {
              value: MODES.EXTERNAL,
              title: MODES.EXTERNAL,
              disabled: !isIndepModeSupportedPlatform,
            },
          ]}
          onChange={handleModeChange}
        />
      </div>
      {persistMode === MODES.INTERNAL && (
        <CreateInternalCluster
          navUtils={{ getStep, getParamString, getIndex, getAnchor }}
          match={match}
          mode={persistMode}
        />
      )}
      {persistMode === MODES.EXTERNAL && (
        <CreateExternalCluster
          match={match}
          minRequiredKeys={independentReqdKeys}
          downloadFile={downloadFile}
        />
      )}
      {persistMode === MODES.ATTACHED_DEVICES && (
        <CreateAttachedDevicesCluster
          navUtils={{ getStep, getParamString, getIndex, getAnchor }}
          match={match}
          mode={persistMode}
        />
      )}
      {disableClusterCreation && (
        <ExistingClusterModal match={match} storageCluster={storageCluster} />
      )}
    </>
  );
};

export default InstallCluster;

type InstallClusterProps = {
  match: RouteMatch<{ ns: string; appName: string }>;
};
