import * as React from 'react';
import * as _ from 'lodash';
import { match } from 'react-router';
import { k8sGet } from '@console/internal/module/k8s';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager';
import { BreadCrumbs } from '@console/internal/components/utils';
import { Radio, Title } from '@patternfly/react-core';
import { checkForIndependentSupport } from '../independent-mode/utils';
import { OCSServiceModel } from '../../models';
import InstallExternalCluster from '../independent-mode/install';
import { CreateOCSServiceForm } from './create-form';
import './install-page.scss';

enum MODES {
  CONVERGED = 'Converged',
  INDEPENDENT = 'Independent',
}

// eslint-disable-next-line no-shadow
const InstallCluster: React.FC<InstallClusterProps> = ({ match }) => {
  const {
    params: { ns, appName },
    url,
  } = match;

  const [isIndependent, setIsIndependent] = React.useState(false);
  const [mode, setMode] = React.useState(MODES.CONVERGED);
  const [sample, setSample] = React.useState(null);
  const [clusterServiceVersion, setClusterServiceVersion] = React.useState(null);

  const handleModeChange = (_checked: boolean, event: React.FormEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    setMode(value as MODES);
  };

  React.useEffect(() => {
    k8sGet(ClusterServiceVersionModel, appName, ns)
      .then((clusterServiceVersionObj) => {
        setIsIndependent(checkForIndependentSupport(clusterServiceVersionObj));
        try {
          setSample(
            JSON.parse(_.get(clusterServiceVersionObj.metadata.annotations, 'alm-examples'))[0],
          );
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
        <h1 className="co-m-pane__heading co-m-pane__heading--baseline">
          <div className="co-m-pane__name">Create a new storage cluster</div>
        </h1>
        <p className="co-m-pane__explanation">
          OCS runs as a cloud-native service for optimal integration with applications in need of
          storage, and handles the scenes such as provisioning and management.
        </p>
      </div>

      <div className="co-m-pane__body co-m-pane__form">
        {isIndependent && (
          <div className="ceph-install__select-mode">
            <Title headingLevel="h5" size="lg" className="ceph-install-select-mode__title">
              Select Mode
            </Title>
            <div className="ceph-install-select-mode">
              <Radio
                value={MODES.CONVERGED}
                isChecked={mode === MODES.CONVERGED}
                onChange={handleModeChange}
                id="radio-1"
                label="Converged"
                name="converged-mode"
              />
            </div>
            <div className="ceph-install-select-mode">
              <Radio
                value={MODES.INDEPENDENT}
                isChecked={mode === MODES.INDEPENDENT}
                onChange={handleModeChange}
                id="radio-2"
                label="Independent - For external storage"
                name="independent-mode"
              />
            </div>
          </div>
        )}
        {(isIndependent === false || mode === MODES.CONVERGED) &&
          clusterServiceVersion &&
          sample && (
            <CreateOCSServiceForm
              namespace={ns}
              operandModel={OCSServiceModel}
              sample={sample}
              clusterServiceVersion={clusterServiceVersion !== null && clusterServiceVersion}
            />
          )}
        {mode === MODES.INDEPENDENT && <InstallExternalCluster match={match} />}
      </div>
    </>
  );
};

export default InstallCluster;

type InstallClusterProps = {
  match: match<{ ns: string; appName: string }>;
};
