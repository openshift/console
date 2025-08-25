import * as React from 'react';
import {
  Grid,
  GridItem,
  ActionGroup,
  Button,
  Alert,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Content,
  ContentVariants,
} from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { PVCStatusComponent } from '@console/internal/components/persistent-volume-claim';
import {
  getAccessModeOptions,
  snapshotPVCStorageClassAnnotation,
  snapshotPVCAccessModeAnnotation,
  snapshotPVCVolumeModeAnnotation,
} from '@console/internal/components/storage/shared';
import {
  ListDropdown,
  ButtonBar,
  history,
  ResourceIcon,
  resourceObjPath,
  convertToBaseValue,
  humanizeBinaryBytes,
  getURLSearchParams,
} from '@console/internal/components/utils';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { PVCDropdown } from '@console/internal/components/utils/pvc-dropdown';
import {
  PersistentVolumeClaimModel,
  VolumeSnapshotModel,
  VolumeSnapshotClassModel,
  StorageClassModel,
  NamespaceModel,
} from '@console/internal/models';
import {
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
import { getName, getNamespace, getAnnotations } from '@console/shared';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { LinkTo } from '@console/shared/src/components/links/LinkTo';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import './_create-volume-snapshot.scss';

const LoadingComponent: React.FC = () => (
  <Grid className="skeleton-box">
    <GridItem className="skeleton-activity" />
    <GridItem className="skeleton-activity" />
    <GridItem className="skeleton-activity" />
    <GridItem className="skeleton-activity" />
    <GridItem className="skeleton-activity" />
    <GridItem className="skeleton-activity" />
    <GridItem className="skeleton-activity" />
    <GridItem className="skeleton-activity" />
  </Grid>
);

const SnapshotClassDropdown = (props: SnapshotClassDropdownProps) => {
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
  const accessModes = getAccessModeOptions().find(
    (accessMode) => accessMode.value === persistentVolumeClaim?.spec?.accessModes?.[0],
  );
  const volumeMode = persistentVolumeClaim?.spec?.volumeMode;
  return (
    <>
      <Content component={ContentVariants.h3}>
        {t('console-app~PersistentVolumeClaim details')}
      </Content>
      <DescriptionList>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('console-app~Name')}</DescriptionListTerm>
          <DescriptionListDescription>
            <ResourceIcon kind={PersistentVolumeClaimModel.kind} />
            {getName(persistentVolumeClaim)}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('console-app~Namespace')}</DescriptionListTerm>
          <DescriptionListDescription>
            <ResourceIcon kind={NamespaceModel.kind} />
            {getNamespace(persistentVolumeClaim)}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('console-app~Status')}</DescriptionListTerm>
          <DescriptionListDescription>
            <PVCStatusComponent pvc={persistentVolumeClaim} />
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('console-app~StorageClass')}</DescriptionListTerm>
          <DescriptionListDescription>
            <ResourceIcon kind={StorageClassModel.kind} />
            {storageClass}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('console-app~Requested capacity')}</DescriptionListTerm>
          <DescriptionListDescription>{sizeMetrics}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('console-app~Access mode')}</DescriptionListTerm>
          <DescriptionListDescription>{accessModes.title}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('console-app~Volume mode')}</DescriptionListTerm>
          <DescriptionListDescription>{volumeMode}</DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
    </>
  );
};

const defaultSnapshotClassAnnotation: string = 'snapshot.storage.kubernetes.io/is-default-class';
const isDefaultSnapshotClass = (volumeSnapshotClass: VolumeSnapshotClassKind) =>
  getAnnotations(volumeSnapshotClass, { defaultSnapshotClassAnnotation: 'false' })[
    defaultSnapshotClassAnnotation
  ] === 'true';

const CreateSnapshotForm = (props: SnapshotResourceProps) => {
  const { namespace, pvcName } = props;
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler<VolumeSnapshotKind>();

  const { t } = useTranslation();
  const [selectedPVCName, setSelectedPVCName] = React.useState(pvcName);
  const [pvcObj, setPVCObj] = React.useState<PersistentVolumeClaimKind>(null);
  const [snapshotName, setSnapshotName] = React.useState(`${pvcName || 'pvc'}-snapshot`);
  const [snapshotClassName, setSnapshotClassName] = React.useState('');
  const [vscObj, , vscErr] = useK8sGet<ListKind<VolumeSnapshotClassKind>>(VolumeSnapshotClassModel);
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
      selectedPVCName ? { name: selectedPVCName } : null,
    );
  }, [namespace, selectedPVCName]);

  const [data, loaded, loadError] = useK8sWatchResource<PersistentVolumeClaimKind[]>(resourceWatch);
  const scList = scObjListLoaded ? scObjList.items : [];
  const provisioner = scList.find((sc) => sc.metadata.name === pvcObj?.spec?.storageClassName)
    ?.provisioner;
  const snapshotClassFilter = React.useCallback(
    (snapshotClass: VolumeSnapshotClassKind) => provisioner?.includes(snapshotClass?.driver),
    [provisioner],
  );
  const vscList = React.useMemo(() => vscObj?.items || [], [vscObj]);
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
    const currentPVC = data.find((pvc) => pvc.metadata.name === selectedPVCName);
    setPVCObj(currentPVC);
    setSnapshotClassName(getDefaultItem(snapshotClassFilter));
  }, [data, selectedPVCName, namespace, loadError, snapshotClassFilter, getDefaultItem]);

  const handleSnapshotName: React.ReactEventHandler<HTMLInputElement> = (event) =>
    setSnapshotName(event.currentTarget.value);

  const handlePVCName = (name: string) => {
    const currentPVC = data.find((pvc) => pvc.metadata.name === name);
    setPVCObj(currentPVC);
    setSnapshotName(`${name}-snapshot`);
    setSelectedPVCName(name);
  };

  const create = (event: React.FormEvent<EventTarget>): void => {
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
          persistentVolumeClaimName: selectedPVCName,
        },
      },
    };

    handlePromise(k8sCreate(VolumeSnapshotModel, snapshotTemplate))
      .then((resource) => {
        history.push(resourceObjPath(resource, referenceFor(resource)));
      })
      .catch(() => {});
  };

  const isBound = (pvc: PersistentVolumeClaimKind) => pvc?.status?.phase === 'Bound';

  return (
    <div className="co-volume-snapshot__body">
      <div className="co-m-pane__form">
        <DocumentTitle>{title}</DocumentTitle>
        <PageHeading
          title={title}
          linkProps={{
            component: LinkTo(
              `/k8s/ns/${namespace || 'default'}/${referenceForModel(VolumeSnapshotModel)}/~new`,
              { replace: true },
            ),
            id: 'yaml-link',
            'data-test': 'yaml-link',
            label: t('console-app~Edit YAML'),
          }}
        />
        <PaneBody>
          <form onSubmit={create}>
            {pvcName ? (
              <p>
                <Trans ns="console-app">
                  Creating snapshot for claim <strong>{{ pvcName }}</strong>
                </Trans>
              </p>
            ) : (
              /* eslint-disable jsx-a11y/label-has-associated-control */
              <>
                <label className="co-required" html-for="claimName">
                  {t('console-app~PersistentVolumeClaim')}
                </label>
                <PVCDropdown
                  dataTest="pvc-dropdown"
                  namespace={namespace}
                  onChange={handlePVCName}
                  selectedKey={selectedPVCName}
                  dataFilter={isBound}
                  desc={t('console-app~PersistentVolumeClaim in {{namespace}} namespace', {
                    namespace,
                  })}
                />
              </>
            )}
            <div className="form-group co-volume-snapshot__form">
              <label className="co-required" htmlFor="snapshot-name">
                {t('console-app~Name')}
              </label>
              <span className="pf-v6-c-form-control">
                <input
                  type="text"
                  onChange={handleSnapshotName}
                  name="snapshotName"
                  id="snapshot-name"
                  value={snapshotName}
                  required
                />
              </span>
            </div>
            {pvcObj && (
              <div className="form-group co-volume-snapshot__form">
                <label className="co-required" htmlFor="snapshot-class">
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
              <ActionGroup className="pf-v6-c-form">
                <Button
                  type="submit"
                  variant="primary"
                  id="save-changes"
                  isDisabled={!snapshotClassName || !snapshotName || !selectedPVCName}
                >
                  {t('console-app~Create')}
                </Button>
                <Button type="button" variant="secondary" onClick={history.goBack}>
                  {t('console-app~Cancel')}
                </Button>
              </ActionGroup>
            </ButtonBar>
          </form>
        </PaneBody>
      </div>
      <PaneBody className="co-volume-snapshot__info">
        {selectedPVCName && pvcObj && loaded && <PVCSummary persistentVolumeClaim={pvcObj} />}
        {!loaded && <LoadingComponent />}
      </PaneBody>
    </div>
  );
};

export const VolumeSnapshot: React.FC = () => {
  const params = useParams();
  const { pvc } = getURLSearchParams();
  return <CreateSnapshotForm namespace={params.ns} pvcName={pvc} />;
};

type SnapshotClassDropdownProps = {
  selectedKey: string;
  filter: (obj) => boolean;
  onChange: (string) => void;
  id?: string;
  dataTest?: string;
};

type SnapshotResourceProps = {
  namespace: string;
  pvcName?: string;
};

type PVCSummaryProps = {
  persistentVolumeClaim: PersistentVolumeClaimKind;
};
