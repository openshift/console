import * as React from 'react';
import { Helmet } from 'react-helmet';
import { match } from 'react-router';

import { Grid, GridItem, ActionGroup, Button, Alert } from '@patternfly/react-core';

import {
  LoadingBox,
  ListDropdown,
  ButtonBar,
  history,
  ResourceIcon,
  resourceObjPath,
  HandlePromiseProps,
  withHandlePromise,
  convertToBaseValue,
  humanizeBinaryBytes,
} from '@console/internal/components/utils';
import {
  K8sKind,
  referenceForModel,
  k8sCreate,
  referenceFor,
  VolumeSnapshotClassKind,
  StorageClassResourceKind,
  PersistentVolumeClaimKind,
  k8sGet,
  VolumeSnapshotKind,
  apiVersionForModel,
} from '@console/internal/module/k8s';
import { connectToPlural } from '@console/internal/kinds';
import {
  PersistentVolumeClaimModel,
  VolumeSnapshotModel,
  VolumeSnapshotClassModel,
  StorageClassModel,
  NamespaceModel,
  PersistentVolumeModel,
} from '@console/internal/models';
import { accessModeRadios } from '@console/internal/components/storage/shared';
import { PVCDropdown } from '@console/internal/components/utils/pvc-dropdown';
import { getName, getNamespace } from '@console/shared';
import { PVCStatus } from '@console/internal/components/persistent-volume-claim';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';

import './_create-volume-snapshot.scss';

const LoadingComponent: React.FC = () => (
  <Grid className="skeleton-box">
    <GridItem span={12} className="skeleton-activity" />
    <GridItem span={12} className="skeleton-activity" />
    <GridItem span={12} className="skeleton-activity" />
    <GridItem span={12} className="skeleton-activity" />
    <GridItem span={12} className="skeleton-activity" />
    <GridItem span={12} className="skeleton-activity" />
    <GridItem span={12} className="skeleton-activity" />
    <GridItem span={12} className="skeleton-activity" />
  </Grid>
);

const SnapshotClassDropdown: React.FC<SnapshotClassDropdownProps> = (props) => {
  const { selectedKey, pvcSC } = props;
  const kind = referenceForModel(VolumeSnapshotClassModel);
  const resources = [{ kind }];
  const [scObj, setSCObj] = React.useState<StorageClassResourceKind>(null);
  const [scError, setError] = React.useState('');

  React.useEffect(() => {
    k8sGet(StorageClassModel, pvcSC)
      .then(setSCObj)
      .catch((error) => setError(error));
  }, [pvcSC]);

  const filter = (snapshotClass: VolumeSnapshotClassKind) =>
    !scObj || !scObj.provisioner ? false : scObj?.provisioner.includes(snapshotClass?.driver);

  if (scError) {
    return (
      <Alert
        className="co-alert co-volume-snapshot__alert-body"
        variant="danger"
        title="Error fetching info on claim's provisioner"
        isInline
      />
    );
  }

  return (
    <ListDropdown
      {...props}
      desc="Volume Snapshot Class with same provisioner as claim"
      dataFilter={filter}
      resources={resources}
      selectedKeyKind={kind}
      placeholder="Select volume snapshot class"
      selectedKey={selectedKey}
    />
  );
};

const PVCSummary: React.FC<PVCSummaryProps> = ({ persistentVolumeClaim }) => {
  const storageClass = persistentVolumeClaim?.spec?.storageClassName;
  const requestedCapacity = persistentVolumeClaim?.spec?.resources?.requests?.storage;
  const sizeBase = convertToBaseValue(requestedCapacity);
  const sizeMetrics = requestedCapacity ? humanizeBinaryBytes(sizeBase).string : '-';
  const accessModes = accessModeRadios.find(
    (accessMode) => accessMode.value === persistentVolumeClaim?.spec?.accessModes?.[0],
  );
  const volumeMode = persistentVolumeClaim?.spec?.volumeMode;
  return (
    <dl>
      <dt className="co-volume-snapshot__details-body">
        {PersistentVolumeClaimModel.label} Details
      </dt>
      <dt>Name</dt>
      <dd>
        <ResourceIcon kind={PersistentVolumeClaimModel.kind} />
        {getName(persistentVolumeClaim)}
      </dd>
      <dt>Namespace</dt>
      <dd>
        <ResourceIcon kind={NamespaceModel.kind} />
        {getNamespace(persistentVolumeClaim)}
      </dd>
      <dt>Status</dt>
      <dd>
        <PVCStatus pvc={persistentVolumeClaim} />
      </dd>
      <dt>Storage Class</dt>
      <dd>
        <ResourceIcon kind={StorageClassModel.kind} />
        {storageClass}
      </dd>
      <dt>Requested Capacity</dt>
      <dd>{sizeMetrics}</dd>
      <dt>Access Mode</dt>
      <dd>{accessModes.title}</dd>
      <dt>Volume Mode</dt>
      <dd>{volumeMode}</dd>
    </dl>
  );
};

const CreateSnapshotForm = withHandlePromise<SnapshotResourceProps>((props) => {
  const { resourceName, namespace, kindObj, handlePromise, inProgress, errorMessage } = props;

  const [pvcName, setPVCName] = React.useState(resourceName);
  const [pvcObj, setPVCObj] = React.useState<PersistentVolumeClaimKind>(null);
  const [snapshotName, setSnapshotName] = React.useState(`${pvcName || 'pvc'}-snapshot`);
  const [snapshotClassName, setSnapshotClassName] = React.useState('');
  const title = 'Create VolumeSnapshot';

  const resourceWatch = React.useMemo(() => {
    return Object.assign(
      {
        kind: PersistentVolumeClaimModel.kind,
        namespace,
        isList: true,
      },
      pvcName ? { name: pvcName } : null,
    );
  }, [namespace, pvcName]);

  const [data, loaded, loadError] = useK8sWatchResource<PersistentVolumeClaimKind[]>(resourceWatch);

  React.useEffect(() => {
    const currentPVC = data.find((pvc) => pvc.metadata.name === pvcName);
    setPVCObj(currentPVC);
  }, [data, pvcName, namespace, loadError]);

  const handleSnapshotName: React.ReactEventHandler<HTMLInputElement> = (event) =>
    setSnapshotName(event.currentTarget.value);

  const handlePVCName = (name: string) => {
    const currentPVC = data.find((pvc) => pvc.metadata.name === name);
    setPVCObj(currentPVC);
    setSnapshotName(`${name}-snapshot`);
    setPVCName(name);
  };

  const create = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault();
    const snapshotTemplate: VolumeSnapshotKind = {
      apiVersion: apiVersionForModel(VolumeSnapshotModel),
      kind: VolumeSnapshotModel.kind,
      metadata: {
        name: snapshotName,
        namespace: getNamespace(pvcObj),
      },
      spec: {
        volumeSnapshotClassName: snapshotClassName,
        source: {
          persistentVolumeClaimName: pvcName,
        },
      },
    };

    handlePromise(k8sCreate(VolumeSnapshotModel, snapshotTemplate), (resource) => {
      history.push(resourceObjPath(resource, referenceFor(resource)));
    });
  };

  return (
    <div className="co-m-pane__body co-volume-snapshot__body">
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <form className="co-m-pane__body-group co-m-pane__form" onSubmit={create}>
        <h1 className="co-m-pane__heading">{title}</h1>
        {kindObj.kind === PersistentVolumeClaimModel.kind && (
          <p>
            Creating snapshot for claim <strong>{resourceName}</strong>
          </p>
        )}
        {pvcName && pvcObj && pvcObj?.status?.phase !== 'Bound' && (
          <Alert
            className="co-alert co-volume-snapshot__alert-body"
            variant="warning"
            title="Snapshot creation for unbound claim is not recommended."
            isInline
          />
        )}
        {kindObj.kind === VolumeSnapshotModel.kind && (
          /* eslint-disable jsx-a11y/label-has-associated-control */
          <>
            <label className="control-label co-required" html-for="claimName">
              {PersistentVolumeModel.label}
            </label>
            <PVCDropdown
              dataTest="pvc-dropdown"
              namespace={namespace}
              onChange={handlePVCName}
              selectedKey={pvcName}
              desc={`Persistent Volume Claim in ${namespace} namespace`}
            />
          </>
        )}
        <div className="form-group co-volume-snapshot__form">
          <label className="control-label co-required" htmlFor="snapshot-name">
            Name
          </label>
          <input
            className="pf-c-form-control"
            type="text"
            onChange={handleSnapshotName}
            name="snapshotName"
            id="snapshot-name"
            value={snapshotName}
            required
          />
        </div>
        {pvcObj && (
          <div className="form-group co-volume-snapshot__form">
            <label className="control-label co-required" htmlFor="snapshot-class">
              Volume Snapshot Class
            </label>
            <SnapshotClassDropdown
              dataTest="snapshot-dropdown"
              onChange={setSnapshotClassName}
              selectedKey={snapshotClassName}
              pvcSC={pvcObj?.spec?.storageClassName}
            />
          </div>
        )}

        <ButtonBar errorMessage={errorMessage || loadError} inProgress={inProgress}>
          <ActionGroup className="pf-c-form">
            <Button
              type="submit"
              variant="primary"
              id="save-changes"
              isDisabled={!snapshotClassName || !snapshotName || !pvcName}
            >
              Create
            </Button>
            <Button type="button" variant="secondary" onClick={history.goBack}>
              Cancel
            </Button>
          </ActionGroup>
        </ButtonBar>
      </form>
      <div className="co-volume-snapshot__info">
        <Grid hasGutter>
          <GridItem span={1} />
          <GridItem span={10}>
            {pvcName && pvcObj && loaded && <PVCSummary persistentVolumeClaim={pvcObj} />}
            {!loaded && <LoadingComponent />}
          </GridItem>
          <GridItem span={1} />
        </Grid>
      </div>
    </div>
  );
});

const VolumeSnapshotComponent: React.FC<VolumeSnapshotComponentProps> = (props) => {
  const {
    kindObj,
    kindsInFlight,
    match: { params },
  } = props;
  if (!kindObj && kindsInFlight) {
    return <LoadingBox />;
  }
  return <CreateSnapshotForm namespace={params.ns} resourceName={params.name} kindObj={kindObj} />;
};

export const VolumeSnapshot = connectToPlural(VolumeSnapshotComponent);

type SnapshotClassDropdownProps = {
  selectedKey: string;
  onChange: (string) => void;
  id?: string;
  pvcSC: string;
  dataTest?: string;
};

type SnapshotResourceProps = HandlePromiseProps & {
  namespace: string;
  resourceName: string;
  kindObj: K8sKind;
};

type PVCSummaryProps = {
  persistentVolumeClaim: PersistentVolumeClaimKind;
};

type VolumeSnapshotComponentProps = {
  kindObj: K8sKind;
  kindsInFlight: boolean;
  match: match<{ ns?: string; plural?: string; name?: string }>;
};
