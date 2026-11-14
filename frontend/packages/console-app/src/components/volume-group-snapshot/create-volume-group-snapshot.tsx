import type { FC, FormEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { ActionGroup, Button, Form, FormGroup, TextInput } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { ButtonBar } from '@console/internal/components/utils/button-bar';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ListDropdown } from '@console/internal/components/utils/list-dropdown';
import { resourceObjPath } from '@console/internal/components/utils/resource-link';
import { SelectorInput } from '@console/internal/components/utils/selector-input';
import {
  PersistentVolumeClaimModel,
  StorageClassModel,
  VolumeGroupSnapshotClassModel,
  VolumeGroupSnapshotModel,
} from '@console/internal/models';
import type {
  PersistentVolumeClaimKind,
  StorageClassResourceKind,
  VolumeGroupSnapshotClassKind,
  VolumeGroupSnapshotKind,
} from '@console/internal/module/k8s';
import {
  apiVersionForModel,
  k8sCreate,
  referenceFor,
  referenceForModel,
} from '@console/internal/module/k8s';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { LinkTo } from '@console/shared/src/components/links/LinkTo';
import { usePromiseHandler } from '@console/shared/src/hooks/usePromiseHandler';
import { getAnnotations, getName } from '@console/shared/src/selectors/common';
import './_create-volume-group-snapshot.scss';
import { PVCTable } from './pvc-table';

const defaultGroupSnapshotClassAnnotation = 'groupsnapshot.storage.kubernetes.io/is-default-class';
const isDefaultGroupSnapshotClass = (vgsClass: VolumeGroupSnapshotClassKind) =>
  getAnnotations(vgsClass, { defaultGroupSnapshotClassAnnotation: 'false' })[
    defaultGroupSnapshotClassAnnotation
  ] === 'true';

const VolumeGroupSnapshotClassDropdown: FC<SnapshotClassDropdownProps> = (props) => {
  const { selectedKey, filter } = props;
  const kind = referenceForModel(VolumeGroupSnapshotClassModel);
  const resources = [{ kind }];
  const { t } = useTranslation('console-app');
  return (
    <ListDropdown
      {...props}
      desc={t('VolumeGroupSnapshotClass with same provisioner as the selected PVCs')}
      dataFilter={filter}
      resources={resources}
      selectedKeyKind={kind}
      placeholder={t('Select VolumeGroupSnapshotClass')}
      selectedKey={selectedKey}
    />
  );
};

const CreateGroupSnapshotForm: FC<SnapshotResourceProps> = ({ namespace }) => {
  const { t } = useTranslation('console-app');
  const navigate = useNavigate();
  const handleCancel = useCallback(() => navigate(-1), [navigate]);
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler<VolumeGroupSnapshotKind>();

  const [groupSnapshotName, setGroupSnapshotName] = useState('group-snapshot');
  const [groupSnapshotClassName, setGroupSnapshotClassName] = useState('');
  const [selectorTags, setSelectorTags] = useState<string[]>([]);

  const matchLabels = useMemo(
    () => SelectorInput.objectify(selectorTags) as { [key: string]: string },
    [selectorTags],
  );

  const pvcWatch = useMemo(
    () => ({
      kind: PersistentVolumeClaimModel.kind,
      isList: true,
      namespace,
      selector: selectorTags.length > 0 ? { matchLabels } : undefined,
    }),
    [namespace, selectorTags, matchLabels],
  );

  const [filteredPVCs, pvcsLoaded, pvcsLoadError] =
    useK8sWatchResource<PersistentVolumeClaimKind[]>(pvcWatch);

  const [storageClasses, storageClassesLoaded, storageClassesLoadError] = useK8sWatchResource<
    StorageClassResourceKind[]
  >({
    kind: StorageClassModel.kind,
    isList: true,
  });

  const getProvisioner = useCallback(
    (storageClassName: string): string | undefined =>
      storageClasses.find((sc) => getName(sc) === storageClassName)?.provisioner,
    [storageClasses],
  );

  const provisioners = useMemo(
    () =>
      new Set(
        filteredPVCs
          .map((pvc) => getProvisioner(pvc.spec?.storageClassName))
          .filter((provisioner): provisioner is string => Boolean(provisioner)),
      ),
    [filteredPVCs, getProvisioner],
  );

  // True until every matched PVC's StorageClass/provisioner is actually known, so the
  // validation below (and the Create button) don't treat a still-loading or failed
  // StorageClass watch as "all PVCs share one provisioner".
  const hasUnresolvedProvisioner = useMemo(
    () =>
      !storageClassesLoaded ||
      !!storageClassesLoadError ||
      filteredPVCs.some((pvc) => !getProvisioner(pvc.spec?.storageClassName)),
    [filteredPVCs, getProvisioner, storageClassesLoaded, storageClassesLoadError],
  );

  // Only known when every matched PVC shares the same provisioner; used to filter
  // VolumeGroupSnapshotClass options the same way the single-PVC VolumeSnapshot form
  // filters VolumeSnapshotClass options by the source PVC's provisioner.
  const provisioner = provisioners.size === 1 ? [...provisioners][0] : undefined;

  const validationError = useMemo(() => {
    if (!pvcsLoaded || pvcsLoadError || selectorTags.length === 0 || filteredPVCs.length <= 1) {
      return undefined;
    }
    return provisioners.size > 1
      ? t(
          'Selected PVCs have different storage provisioners. All PVCs must have StorageClasses with the same provisioner.',
        )
      : undefined;
  }, [filteredPVCs, pvcsLoaded, pvcsLoadError, provisioners, selectorTags.length, t]);

  const loadErrorMessage =
    pvcsLoadError instanceof Error ? pvcsLoadError.message : (pvcsLoadError as string);
  const storageClassesLoadErrorMessage =
    storageClassesLoadError instanceof Error
      ? storageClassesLoadError.message
      : (storageClassesLoadError as string);

  const [vgsClasses, vgsClassesLoaded, vgsClassesLoadError] = useK8sWatchResource<
    VolumeGroupSnapshotClassKind[]
  >({
    groupVersionKind: {
      group: VolumeGroupSnapshotClassModel.apiGroup,
      kind: VolumeGroupSnapshotClassModel.kind,
      version: VolumeGroupSnapshotClassModel.apiVersion,
    },
    isList: true,
  });
  const vgsClassesLoadErrorMessage =
    vgsClassesLoadError instanceof Error
      ? vgsClassesLoadError.message
      : (vgsClassesLoadError as string);

  const vgsClassFilter = useCallback(
    (vgsClass: VolumeGroupSnapshotClassKind) => !provisioner || provisioner === vgsClass.driver,
    [provisioner],
  );

  const compatibleVgsClasses = useMemo(
    () => vgsClasses.filter(vgsClassFilter),
    [vgsClasses, vgsClassFilter],
  );

  // Once the matched PVCs' provisioner is known, fall back to a compatible
  // VolumeGroupSnapshotClass (preferring the one marked default) whenever the
  // user's explicit selection is empty or no longer compatible, instead of
  // storing this derived value in state.
  const selectedVgsClassIsCompatible = compatibleVgsClasses.some(
    (vgsClass) => getName(vgsClass) === groupSnapshotClassName,
  );
  const effectiveGroupSnapshotClassName =
    selectedVgsClassIsCompatible || !provisioner
      ? groupSnapshotClassName
      : getName(compatibleVgsClasses.find(isDefaultGroupSnapshotClass)) ||
        getName(compatibleVgsClasses[0]) ||
        '';

  const create = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inProgress) {
      return;
    }
    const groupSnapshot: VolumeGroupSnapshotKind = {
      apiVersion: apiVersionForModel(VolumeGroupSnapshotModel),
      kind: VolumeGroupSnapshotModel.kind,
      metadata: {
        name: groupSnapshotName,
        namespace,
      },
      spec: {
        volumeGroupSnapshotClassName: effectiveGroupSnapshotClassName,
        source: {
          selector: { matchLabels },
        },
      },
    };

    handlePromise(k8sCreate(VolumeGroupSnapshotModel, groupSnapshot))
      .then((resource) => {
        navigate(resourceObjPath(resource, referenceFor(resource)));
      })
      .catch(() => {});
  };

  const title = t('Create VolumeGroupSnapshot');

  return (
    <div className="co-volume-group-snapshot__body">
      <DocumentTitle>{title}</DocumentTitle>
      <PageHeading
        title={title}
        linkProps={{
          component: LinkTo(
            `/k8s/ns/${namespace || 'default'}/${referenceForModel(VolumeGroupSnapshotModel)}/~new`,
            { replace: true },
          ),
          id: 'yaml-link',
          'data-test': 'yaml-link',
          label: t('Edit YAML'),
        }}
      />
      <PaneBody>
        <Form onSubmit={create}>
          <FormGroup label={t('Name')} isRequired fieldId="snapshot-name">
            <TextInput
              isRequired
              type="text"
              id="snapshot-name"
              data-test="snapshot-name"
              name="groupSnapshotName"
              value={groupSnapshotName}
              onChange={(_event, value: string) => setGroupSnapshotName(value)}
            />
          </FormGroup>
          <FormGroup label={t('VolumeGroupSnapshotClass')} isRequired fieldId="snapshot-class">
            <VolumeGroupSnapshotClassDropdown
              filter={vgsClassFilter}
              onChange={setGroupSnapshotClassName}
              dataTest="snapshot-class-dropdown"
              selectedKey={effectiveGroupSnapshotClassName}
            />
          </FormGroup>
          <FormGroup label={t('PersistentVolumeClaims')} isRequired fieldId="pvc-selector">
            <p className="pf-v6-u-mb-sm">
              {t(
                'Select PVCs in the {{namespace}} namespace using label selectors to form a volume group to take VolumeGroupSnapshots.',
                { namespace },
              )}
            </p>
            <PVCTable
              pvcObjs={selectorTags.length > 0 ? filteredPVCs : []}
              selectorTags={selectorTags}
              setSelectorTags={setSelectorTags}
              loaded={pvcsLoaded}
              loadError={pvcsLoadError}
            />
          </FormGroup>
          <ButtonBar
            errorMessage={
              errorMessage ||
              loadErrorMessage ||
              storageClassesLoadErrorMessage ||
              vgsClassesLoadErrorMessage ||
              validationError
            }
            inProgress={inProgress}
          >
            <ActionGroup className="pf-v6-c-form">
              <Button
                type="submit"
                variant="primary"
                id="save-changes"
                isDisabled={
                  !effectiveGroupSnapshotClassName ||
                  !groupSnapshotName ||
                  filteredPVCs.length === 0 ||
                  selectorTags.length === 0 ||
                  !!validationError ||
                  hasUnresolvedProvisioner ||
                  !vgsClassesLoaded ||
                  !!vgsClassesLoadError ||
                  inProgress
                }
              >
                {t('Create')}
              </Button>
              <Button type="button" variant="secondary" onClick={handleCancel}>
                {t('Cancel')}
              </Button>
            </ActionGroup>
          </ButtonBar>
        </Form>
      </PaneBody>
    </div>
  );
};

export const VolumeGroupSnapshot: FC = () => {
  const params = useParams();
  return <CreateGroupSnapshotForm namespace={params.ns || ''} />;
};

type SnapshotClassDropdownProps = {
  selectedKey: string;
  filter: (vgsClass: VolumeGroupSnapshotClassKind) => boolean;
  onChange: (key: string) => void;
  id?: string;
  dataTest?: string;
};

type SnapshotResourceProps = {
  namespace: string;
};
