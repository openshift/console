import * as React from 'react';
import { ActionGroup, Button } from '@patternfly/react-core';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom-v5-compat';
import {
  ButtonBar,
  getURLSearchParams,
  HandlePromiseProps,
  history,
  ListDropdown,
  PageHeading,
  resourceObjPath,
  withHandlePromise,
} from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import {
  PersistentVolumeClaimModel,
  StorageClassModel,
  VolumeGroupSnapshotClassModel,
  VolumeGroupSnapshotModel,
} from '@console/internal/models';
import {
  apiVersionForModel,
  k8sCreate,
  MatchExpression,
  PersistentVolumeClaimKind,
  referenceFor,
  referenceForModel,
  StorageClassResourceKind,
  VolumeGroupSnapshotKind,
} from '@console/internal/module/k8s';
import { getNamespace } from '@console/shared';
import './_create-volume-group-snapshot.scss';
import { PVCTable } from './pvc-table';

const VolumeGroupSnapshotClassDropdown: React.FC<SnapshotClassDropdownProps> = (props) => {
  const { selectedKey } = props;
  const kind = referenceForModel(VolumeGroupSnapshotClassModel);
  const resources = [{ kind }];
  const { t } = useTranslation();
  return (
    <ListDropdown
      {...props}
      desc={t('console-app~VolumeGroupSnapshotClass')}
      resources={resources}
      selectedKeyKind={kind}
      placeholder={t('console-app~Select volumegroup snapshot class')}
      selectedKey={selectedKey}
    />
  );
};

const CreateGroupSnapshotForm = withHandlePromise<SnapshotResourceProps>((props) => {
  const { namespace, handlePromise, inProgress, errorMessage } = props;
  const { t } = useTranslation();
  const [pvcObjs, setPVCObjs] = React.useState<PersistentVolumeClaimKind[]>([]);
  const [groupSnapshotName, setGroupSnapshotName] = React.useState('group-snapshot');
  const [groupSnapshotClassName, setGroupSnapshotClassName] = React.useState('');
  const title = t('console-app~Create VolumeGroupSnapshot');
  const [labelExpressions, setLabelExpressions] = React.useState<MatchExpression[]>([]);
  const [labels, setLabels] = React.useState<{ [key: string]: string[] }>({});
  const [validationError, setValidationError] = React.useState<string | null>(null);

  const resourceWatch = React.useMemo(() => {
    const watch = {
      kind: referenceForModel(PersistentVolumeClaimModel),
      isList: true,
      namespace,
      selector: labelExpressions.length > 0 ? { matchExpressions: labelExpressions } : undefined,
    };

    return watch;
  }, [namespace, labelExpressions]);

  const [data, loaded, loadError] = useK8sWatchResource<PersistentVolumeClaimKind[]>(resourceWatch);

  const [storageClasses, setStorageClasses] = React.useState<StorageClassResourceKind[]>([]);
  const storageClassWatch = {
    kind: StorageClassModel.kind,
    isList: true,
  };

  const [storageClassData] = useK8sWatchResource<StorageClassResourceKind[]>(storageClassWatch);

  React.useEffect(() => {
    if (storageClassData) {
      setStorageClasses(storageClassData);
    }
  }, [storageClassData]);

  const getProvisioner = React.useCallback(
    (storageClassName: string): string | null => {
      if (!storageClassName || !storageClasses.length) return null;

      const storageClass = storageClasses.find((sc) => sc.metadata.name === storageClassName);
      return storageClass?.provisioner || null;
    },
    [storageClasses],
  );

  const validatePVCs = React.useCallback(
    (pvcs: PersistentVolumeClaimKind[]) => {
      if (!pvcs || pvcs.length <= 1 || labelExpressions.length === 0) {
        setValidationError(null);
        return;
      }

      const provisioners = new Set();
      pvcs.forEach((pvc) => {
        const storageClassName = pvc.spec?.storageClassName;
        if (storageClassName) {
          const provisioner = getProvisioner(storageClassName);
          if (provisioner) {
            provisioners.add(provisioner);
          }
        }
      });

      if (provisioners.size > 1) {
        setValidationError(
          t(
            'console-app~Selected PVCs have different storage provisioners. All PVCs must have StorageClasses with the same provisioner.',
          ),
        );
        return;
      }

      setValidationError(null);
    },
    [getProvisioner, labelExpressions.length, t],
  );

  React.useEffect(() => {
    if (loaded && !loadError) {
      const newPvcObjs = data || [];
      setPVCObjs(newPvcObjs);

      // Validate PVCs for same provisioner
      if (newPvcObjs.length > 1) {
        validatePVCs(newPvcObjs);
      } else {
        setValidationError(null);
      }
    }
  }, [data, loaded, loadError, validatePVCs]);

  React.useEffect(() => {
    if (loaded && data?.length) {
      const labelsMap: { [key: string]: string[] } = {};
      data.forEach((pvc) => {
        if (pvc.metadata?.labels) {
          Object.entries(pvc.metadata.labels).forEach(([key, value]) => {
            if (!labelsMap[key]) {
              labelsMap[key] = [];
            }
            if (!labelsMap[key].includes(value)) {
              labelsMap[key].push(value);
            }
          });
        }
      });
      setLabels(labelsMap);
    }
  }, [data, loaded]);

  const handleSnapshotName: React.ReactEventHandler<HTMLInputElement> = (event) =>
    setGroupSnapshotName(event.currentTarget.value);

  const create = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault();

    if (!pvcObjs.length) {
      return;
    }

    // Don't proceed if validation errors exist
    if (validationError) {
      return;
    }

    const groupSnapshot: VolumeGroupSnapshotKind = {
      apiVersion: apiVersionForModel(VolumeGroupSnapshotModel),
      kind: VolumeGroupSnapshotModel.kind,
      metadata: {
        name: groupSnapshotName,
        namespace: getNamespace(pvcObjs[0]),
      },
      spec: {
        volumeGroupSnapshotClassName: groupSnapshotClassName,
        source: {
          selector: {
            matchExpressions: labelExpressions,
          },
        },
      },
    };

    handlePromise(k8sCreate(VolumeGroupSnapshotModel, groupSnapshot), (resource) => {
      history.push(resourceObjPath(resource, referenceFor(resource)));
    });
  };

  return (
    <div className="co-volume-snapshot__body">
      <div className="co-m-pane__form">
        <Helmet>
          <title>{title}</title>
        </Helmet>
        <PageHeading
          title={<div className="co-m-pane__name">{title}</div>}
          link={
            <Link
              to={`/k8s/ns/${namespace || 'default'}/${referenceForModel(
                VolumeGroupSnapshotModel,
              )}/~new`}
              id="yaml-link"
              data-test="yaml-link"
              replace
            >
              {t('console-app~Edit YAML')}
            </Link>
          }
        />
        <div className="co-m-pane__body co-m-pane__body--no-top-margin">
          <form className="co-m-pane__body-group" onSubmit={create}>
            <div className="form-group co-volume-snapshot__form">
              <label className="control-label co-required" htmlFor="snapshot-name">
                {t('console-app~Name')}
              </label>
              <span className="pf-v6-c-form-control">
                <input
                  type="text"
                  onChange={handleSnapshotName}
                  name="snapshotName"
                  id="snapshot-name"
                  value={groupSnapshotName}
                  required
                />
              </span>
              <div className="form-group co-volume-snapshot__form">
                <label className="control-label co-required" htmlFor="snapshot-class">
                  {t('console-app~GroupSnapshot Class')}
                </label>
                <VolumeGroupSnapshotClassDropdown
                  onChange={setGroupSnapshotClassName}
                  dataTest="snapshot-dropdown"
                  selectedKey={groupSnapshotClassName}
                />
              </div>
              <div className="form-group co-volume-snapshot__form">
                <label className="control-label co-required" htmlFor="claimName">
                  {t('console-app~Persistent Volume Claim')}
                </label>
                <div className="pf-v6-c-form__helper-text">
                  {t(
                    'console-app~Select PVCs in the {{namespace}} namespace using label selectors to form a volume group to take VolumeGroupSnapshots.',
                    { namespace },
                  )}
                </div>

                {validationError && (
                  <div className="pf-v6-c-form__helper-text pf-m-error">
                    <span className="pf-v6-c-form__helper-text-icon">
                      <i className="fas fa-exclamation-circle" aria-hidden="true" />
                    </span>
                    {validationError}
                  </div>
                )}

                <PVCTable
                  namespace={namespace}
                  pvcObjs={labelExpressions.length > 0 ? pvcObjs : []}
                  labels={labels}
                  labelExpressions={labelExpressions}
                  setLabelExpressions={setLabelExpressions}
                  loaded={loaded}
                  loadError={loadError}
                />
              </div>
            </div>
            <ButtonBar
              errorMessage={errorMessage || loadError || validationError}
              inProgress={inProgress}
            >
              <ActionGroup className="pf-v6-c-form">
                <Button
                  type="submit"
                  variant="primary"
                  id="save-changes"
                  isDisabled={
                    !groupSnapshotClassName ||
                    !groupSnapshotName ||
                    pvcObjs.length === 0 ||
                    !!validationError
                  }
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
      </div>
    </div>
  );
});

export const VolumeGroupSnapshot: React.FC = () => {
  const params = useParams();
  const { pvc } = getURLSearchParams();
  return <CreateGroupSnapshotForm namespace={params.ns} pvcName={pvc} />;
};

type SnapshotClassDropdownProps = {
  selectedKey: string;
  onChange: (string) => void;
  id?: string;
  dataTest?: string;
};

type SnapshotResourceProps = HandlePromiseProps & {
  namespace: string;
  pvcName?: string;
};
