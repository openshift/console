import * as React from 'react';
import { match } from 'react-router';
import { k8sGet } from '@console/internal/module/k8s';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager';
import { BreadCrumbs } from '@console/internal/components/utils';
import { getAnnotations } from '@console/shared/src/selectors/common';
import { RadioGroup } from '@console/internal/components/radio';
import { getRequiredKeys, createDownloadFile } from '../independent-mode/utils';
import { OCSServiceModel } from '../../models';
import CreateExternalCluster from '../independent-mode/install';
import { CreateInternalCluster } from './create-form';
import { OCS_SUPPORT_ANNOTATION } from '../../constants';
import { CreateAttachedDevicesCluster } from './attached-devices/install';
import './install-page.scss';

enum MODES {
  INTERNAL = 'Internal',
  EXTERNAL = 'External',
  ATTACHED_DEVICES = 'Internal - Attached Devices',
}

// eslint-disable-next-line no-shadow
const InstallCluster: React.FC<InstallClusterProps> = ({ match }) => {
  const {
    params: { ns, appName },
    url,
  } = match;

  const [isIndependent, setIsIndependent] = React.useState(false);
  const [independentReqdKeys, setIndependentReqdKeys] = React.useState<{ [key: string]: string[] }>(
    null,
  );
  const [downloadFile, setDownloadFile] = React.useState(null);
  const [mode, setMode] = React.useState(MODES.ATTACHED_DEVICES);
  const [clusterServiceVersion, setClusterServiceVersion] = React.useState(null);

  const handleModeChange = (event: React.FormEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    setMode(value as MODES);
  };

  React.useEffect(() => {
    k8sGet(ClusterServiceVersionModel, appName, ns)
      .then((clusterServiceVersionObj) => {
        const isIndependentSupported = getAnnotations(clusterServiceVersionObj)[
          OCS_SUPPORT_ANNOTATION
        ].includes('external');
        if (isIndependentSupported) {
          setIsIndependent(true);
          const { configMaps = [], secrets = [], storageClasses = [] } = getRequiredKeys(
            clusterServiceVersionObj,
          );
          setIndependentReqdKeys({ configMaps, secrets, storageClasses });
          setDownloadFile(
            createDownloadFile(
              getAnnotations(clusterServiceVersionObj)?.[
                'external.features.ocs.openshift.io/export-script'
              ],
            ),
          );
        }

        try {
          setClusterServiceVersion(clusterServiceVersionObj);
        } catch (e) {
          setClusterServiceVersion(null);
        }
      })
      .catch(() => setClusterServiceVersion(null));
  }, [appName, ns]);

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
                { name: `Create ${OCSServiceModel.label}`, path: url },
              ]}
            />
          )}
        </div>
        <h1 className="co-create-operand__header-text">Create Storage Cluster</h1>
        <p className="help-block">
          OCS runs as a cloud-native service for optimal integration with applications in need of
          storage, and handles the scenes such as provisioning and management.
        </p>
      </div>
      <div className="ceph-install__mode-toggle">
        <RadioGroup
          label="Select Mode:"
          currentValue={mode}
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
              disabled: !isIndependent,
            },
          ]}
          onChange={handleModeChange}
        />
      </div>
      <div>
        {mode === MODES.INTERNAL && <CreateInternalCluster match={match} />}
        {mode === MODES.EXTERNAL && (
          <CreateExternalCluster
            match={match}
            minRequiredKeys={independentReqdKeys}
            downloadFile={downloadFile}
          />
        )}
        {mode === MODES.ATTACHED_DEVICES && <CreateAttachedDevicesCluster match={match} />}
      </div>
    </>
  );
};

export default InstallCluster;

type InstallClusterProps = {
  match: match<{ ns: string; appName: string }>;
};
