import * as React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { match } from 'react-router';
import { Trans, useTranslation } from 'react-i18next';

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
  VolumeSnapshotKind,
  apiVersionForModel,
  ListKind,
} from '@console/internal/module/k8s';
import { connectToPlural } from '@console/internal/kinds';
import {
  PersistentVolumeClaimModel,
  VolumeSnapshotModel,
  VolumeSnapshotClassModel,
  StorageClassModel,
  NamespaceModel,
} from '@console/internal/models';
import {
  getAccessModeRadios,
  snapshotPVCStorageClassAnnotation,
  snapshotPVCAccessModeAnnotation,
  snapshotPVCVolumeModeAnnotation,
} from '@console/internal/components/storage/shared';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { PVCDropdown } from '@console/internal/components/utils/pvc-dropdown';
import { getName, getNamespace, getAnnotations } from '@console/shared';
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
  const { selectedKey, filter } = props;
  const kind = referenceForModel(VolumeSnapshotClassModel);
  const resources = [{ kind }];
  const { t } = useTranslation();
  return (
    <ListDropdown
      {...props}
      desc={t('console-app~VolumeSnapshotClass with same provisioner as claim')}
      dataFilter={filter}
      resources={resources}
      selectedKeyKind={kind}
      placeholder={t('console-app~Select volume snapshot class')}
      selectedKey={selectedKey}
    />
  );
};

const PVCSummary: React.FC<PVCSummaryProps> = ({ persistentVolumeClaim }) => {
  const { t } = useTranslation();
  const storageClass = persistentVolumeClaim?.spec?.storageClassName;
  const requestedCapacity = persistentVolumeClaim?.spec?.resources?.requests?.storage;
  const sizeBase = convertToBaseValue(requestedCapacity);
  const sizeMetrics = requestedCapacity ? humanizeBinaryBytes(sizeBase).string : '-';
  const accessModes = getAccessModeRadios().find(
    (accessMode) => accessMode.value === persistentVolumeClaim?.spec?.accessModes?.[0],
  );
  const volumeMode = persistentVolumeClaim?.spec?.volumeMode;
  return (
    <dl>
      <dt className="co-volume-snapshot__details-body">
        {t('console-app~PersistentVolumeClaim details')}
      </dt>
      <dt>{t('console-app~Name')}</dt>
      <dd>
        <ResourceIcon kind={PersistentVolumeClaimModel.kind} />
        {getName(persistentVolumeClaim)}
      </dd>
      <dt>{t('console-app~Namespace')}</dt>
      <dd>
        <ResourceIcon kind={NamespaceModel.kind} />
        {getNamespace(persistentVolumeClaim)}
      </dd>
      <dt>{t('console-app~Status')}</dt>
      <dd>
        <PVCStatus pvc={persistentVolumeClaim} />
      </dd>
      <dt>{t('console-app~StorageClass')}</dt>
      <dd>
        <ResourceIcon kind={StorageClassModel.kind} />
        {storageClass}
      </dd>
      <dt>{t('console-app~Requested capacity')}</dt>
      <dd>{sizeMetrics}</dd>
      <dt>{t('console-app~Access mode')}</dt>
      <dd>{accessModes.title}</dd>
      <dt>{t('console-app~Volume mode')}</dt>
      <dd>{volumeMode}</dd>
    </dl>
  );
};

const defaultSnapshotClassAnnotation: string = 'snapshot.storage.kubernetes.io/is-default-class';
const isDefaultSnapshotClass = (volumeSnapshotClass: VolumeSnapshotClassKind) =>
  getAnnotations(volumeSnapshotClass, { defaultSnapshotClassAnnotation: 'false' })[
    defaultSnapshotClassAnnotation
  ] === 'true';

const CreateSnapshotForm = withHandlePromise<SnapshotResourceProps>((props) => {
  const {
    resourceName,
    plural,
    namespace,
    kindObj,
    handlePromise,
    inProgress,
    errorMessage,
  } = props;

  const { t } = useTranslation();
  const [pvcName, setPVCName] = React.useState(resourceName);
  const [pvcObj, setPVCObj] = React.useState<PersistentVolumeClaimKind>(null);
  const [snapshotName, setSnapshotName] = React.useState(`${pvcName || 'pvc'}-snapshot`);
  const [snapshotClassName, setSnapshotClassName] = React.useState('');
  const [vscObj, vscLoaded, vscErr] = useK8sGet<ListKind<VolumeSnapshotClassKind>>(
    VolumeSnapshotClassModel,
  );
  const [scObjList, scObjListLoaded, scObjListErr] = useK8sGet<ListKind<StorageClassResourceKind>>(
    StorageClassModel,
  );
  const title = t('console-app~Create VolumeSnapshot');
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
  const scList = scObjListLoaded ? scObjList.items : [];
  const provisioner = scList.find((sc) => sc.metadata.name === pvcObj?.spec?.storageClassName)
    ?.provisioner;
  const snapshotClassFilter = React.useCallback(
    (snapshotClass: VolumeSnapshotClassKind) => provisioner?.includes(snapshotClass?.driver),
    [provisioner],
  );
  const vscList = vscLoaded ? vscObj.items : [];
  const getDefaultItem = React.useCallback(
    (snapFilter) => {
      const filteredVSC = vscList.filter(snapFilter);
      const defaultFilteredVSC = filteredVSC.filter(isDefaultSnapshotClass);
      const defaultItem = getName(defaultFilteredVSC?.[0]) || getName(filteredVSC?.[0]);

      return defaultItem;
    },
    [vscList],
  );

  React.useEffect(() => {
    const currentPVC = data.find((pvc) => pvc.metadata.name === pvcName);
    setPVCObj(currentPVC);
    setSnapshotClassName(getDefaultItem(snapshotClassFilter));
  }, [data, pvcName, namespace, loadError, snapshotClassFilter, getDefaultItem]);

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
        annotations: {
          [snapshotPVCAccessModeAnnotation]: pvcObj.spec.accessModes.join(','),
          [snapshotPVCStorageClassAnnotation]: pvcObj.spec.storageClassName,
          [snapshotPVCVolumeModeAnnotation]: pvcObj.spec.volumeMode,
        },
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

  const isBound = (pvc: PersistentVolumeClaimKind) => pvc?.status?.phase === 'Bound';

  return (
    <div className="co-volume-snapshot__body">
      <div className="co-m-pane__body co-m-pane__form">
        <Helmet>
          <title>{title}</title>
        </Helmet>
        <h1 className="co-m-pane__heading co-m-pane__heading--baseline">
          <div className="co-m-pane__name">{title}</div>
          <div className="co-m-pane__heading-link">
            <Link
              to={`/k8s/ns/${namespace || 'default'}/${plural}/~new`}
              id="yaml-link"
              data-test="yaml-link"
              replace
            >
              {t('public~Edit YAML')}
            </Link>
          </div>
        </h1>
        <form className="co-m-pane__body-group" onSubmit={create}>
          {kindObj.kind === PersistentVolumeClaimModel.kind && (
            <p>
              <Trans ns="console-app">
                Creating snapshot for claim <strong>{resourceName}</strong>
              </Trans>
            </p>
          )}
          {kindObj.kind === VolumeSnapshotModel.kind && (
            /* eslint-disable jsx-a11y/label-has-associated-control */
            <>
              <label className="control-label co-required" html-for="claimName">
                {t('console-app~PersistentVolumeClaim')}
              </label>
              <PVCDropdown
                dataTest="pvc-dropdown"
                namespace={namespace}
                onChange={handlePVCName}
                selectedKey={pvcName}
                dataFilter={isBound}
                desc={`Persistent Volume Claim in ${namespace} namespace`}
              />
            </>
          )}
          <div className="form-group co-volume-snapshot__form">
            <label className="control-label co-required" htmlFor="snapshot-name">
              {t('console-app~Name')}
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
                {t('console-app~Snapshot Class')}
              </label>
              {vscErr || scObjListErr ? (
                <Alert
                  className="co-alert co-volume-snapshot__alert-body"
                  variant="danger"
                  title="Error fetching info on claim's provisioner"
                  isInline
                />
              ) : (
                <SnapshotClassDropdown
                  filter={snapshotClassFilter}
                  onChange={setSnapshotClassName}
                  dataTest="snapshot-dropdown"
                  selectedKey={snapshotClassName}
                />
              )}
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
                {t('console-app~Create')}
              </Button>
              <Button type="button" variant="secondary" onClick={history.goBack}>
                {t('console-app~Cancel')}
              </Button>
            </ActionGroup>
          </ButtonBar>
        </form>
      </div>
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
  return (
    <CreateSnapshotForm
      plural={params.plural}
      namespace={params.ns}
      resourceName={params.name}
      kindObj={kindObj}
    />
  );
};

export const VolumeSnapshot = connectToPlural(VolumeSnapshotComponent);

type SnapshotClassDropdownProps = {
  selectedKey: string;
  filter: (obj) => boolean;
  onChange: (string) => void;
  id?: string;
  dataTest?: string;
};

type SnapshotResourceProps = HandlePromiseProps & {
  namespace: string;
  resourceName: string;
  kindObj: K8sKind;
  plural: string;
};

type PVCSummaryProps = {
  persistentVolumeClaim: PersistentVolumeClaimKind;
};

type VolumeSnapshotComponentProps = {
  kindObj: K8sKind;
  kindsInFlight: boolean;
  match: match<{ ns?: string; plural?: string; name?: string }>;
};
