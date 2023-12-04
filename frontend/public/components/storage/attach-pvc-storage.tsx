import * as _ from 'lodash-es';
import * as React from 'react';
import { ActionGroup, Button } from '@patternfly/react-core';
import { useTranslation, Trans } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom-v5-compat';
import {
  ContainerSpec,
  k8sCreate,
  k8sGet,
  K8sKind,
  k8sPatch,
  referenceFor,
} from '../../module/k8s';
import { ButtonBar, LoadingBox, resourceObjPath } from '../utils';
import { Checkbox } from '../checkbox';
import { RadioInput } from '../radio';
import { CreatePVCForm } from './create-pvc';
import { PersistentVolumeClaimModel } from '../../models';
import { ContainerSelector } from '../container-selector';
import { PVCDropdown } from '../utils/pvc-dropdown';
import { PodTemplate, PersistentVolumeClaimKind, Patch } from '../../module/k8s/types';

export const AttachStorageForm: React.FC<AttachStorageFormProps> = (props) => {
  const [obj, setObj] = React.useState(null);
  const [inProgress, setInProgress] = React.useState(false);
  const [useContainerSelector, setUseContainerSelector] = React.useState(false);
  const [claimName, setClaimName] = React.useState('');
  const [volumeName, setVolumeName] = React.useState('');
  const [mountPath, setMountPath] = React.useState('');
  const [devicePath, setDevicePath] = React.useState('');
  const [subPath, setSubPath] = React.useState('');
  const [mountAsReadOnly, setMountAsReadOnly] = React.useState(false);
  const [selectedContainers, setSelectedContainers] = React.useState([]);
  const [volumeAlreadyMounted, setVolumeAlreadyMounted] = React.useState(false);
  const [error, setError] = React.useState('');
  const [showCreatePVC, setShowCreatePVC] = React.useState('existing');
  const [claimVolumeMode, setClaimVolumeMode] = React.useState('');
  const [newPVCObj, setNewPVCObj] = React.useState(null);
  const [selectedPVC, setSelectedPVC] = React.useState<PersistentVolumeClaimKind>(null);

  const { kindObj, resourceName, namespace } = props;

  const { t } = useTranslation();
  const navigate = useNavigate();

  const supportedKinds = [
    'Deployment',
    'DeploymentConfig',
    'ReplicaSet',
    'ReplicationController',
    'StatefulSet',
    'DaemonSet',
  ];

  React.useEffect(() => {
    // Get the current resource so we can add to its definition
    k8sGet(kindObj, resourceName, namespace).then(setObj);
  }, [kindObj, resourceName, namespace]);

  React.useEffect(() => {
    // If the PVC or its name changes, check if there is already a volume with that name
    const newClaimName =
      showCreatePVC === 'existing' ? claimName : _.get(newPVCObj, 'metadata.name', '');
    const volumes = _.get(obj, 'spec.template.spec.volumes');
    const volume = _.find(volumes, {
      persistentVolumeClaim: {
        claimName: newClaimName,
      },
    }) as any;
    const newVolumeName = volume ? volume.name : newClaimName;
    const newVolumeAlreadyMounted = !!volume;
    setVolumeName(newVolumeName);
    setVolumeAlreadyMounted(newVolumeAlreadyMounted);
    showCreatePVC === 'existing' && newClaimName.trim().length > 0
      ? setClaimVolumeMode(selectedPVC.spec.volumeMode)
      : setClaimVolumeMode(newPVCObj?.spec?.volumeMode);
  }, [newPVCObj, obj, claimName, showCreatePVC, claimVolumeMode, selectedPVC, namespace]);

  if (!kindObj || !_.includes(supportedKinds, kindObj.kind)) {
    setError('Unsupported kind.');
    return;
  }

  const handleShowCreatePVCChange: React.ReactEventHandler<HTMLInputElement> = (event) => {
    setShowCreatePVC(event.currentTarget.value);
  };

  const handleSelectContainers = () => {
    setUseContainerSelector(!useContainerSelector);
    setSelectedContainers([]);
  };

  const handleContainerSelectionChange = (event, checked) => {
    const checkedItems = [...selectedContainers];
    checked
      ? checkedItems.push(event.currentTarget.id)
      : _.pull(checkedItems, event.currentTarget.id);
    setSelectedContainers(checkedItems);
  };

  const isContainerSelected = ({ name }) => {
    return !useContainerSelector || selectedContainers.includes(name);
  };

  const getMountPaths = (podTemplate: any): string[] => {
    const containers: ContainerSpec[] = _.get(podTemplate, 'spec.containers', []);
    return containers.reduce((acc: string[], container: ContainerSpec) => {
      if (!isContainerSelected(container)) {
        return acc;
      }
      const mountPaths: string[] = _.map(container.volumeMounts, 'mountPath');
      return acc.concat(mountPaths);
    }, []);
  };

  const validateMountPaths = (path: string) => {
    const existingMountPaths = getMountPaths(obj.spec.template);
    const err = existingMountPaths.includes(path) ? 'Mount path is already in use.' : '';
    setError(err);
  };

  // Add logic to check this handler for if a mount path is not unique
  const handleMountPathChange: React.ReactEventHandler<HTMLInputElement> = (event) => {
    setMountPath(event.currentTarget.value);
    // Look at the existing mount paths so that we can warn if the new value is not unique.
    validateMountPaths(event.currentTarget.value);
  };

  const getDevicePaths = (podTemplate: PodTemplate): string[] => {
    const containers: ContainerSpec[] = podTemplate?.spec?.containers;
    return containers.reduce((acc: string[], container: ContainerSpec) => {
      if (!isContainerSelected(container)) {
        return acc;
      }
      const devicePaths: string[] = _.map(container.volumeDevices, 'devicePath');
      return acc.concat(devicePaths);
    }, []);
  };

  const validateDevicePath = (path: string) => {
    const existingDevicePaths = getDevicePaths(obj.spec.template);
    if (existingDevicePaths.includes(path)) {
      setError(t('public~Device path is already in use.'));
    }
  };

  const handleDevicePathChange: React.ReactEventHandler<HTMLInputElement> = (event) => {
    setDevicePath(event.currentTarget.value);
    validateDevicePath(event.currentTarget.value);
  };
  const handleSubPathChange: React.ReactEventHandler<HTMLInputElement> = (event) => {
    setSubPath(event.currentTarget.value);
  };

  const handlePVCChange = (
    newClaimName: string,
    kindLabel?: string,
    resource?: PersistentVolumeClaimKind,
  ) => {
    setClaimName(newClaimName);
    setSelectedPVC(resource);
  };

  const onMountAsReadOnlyChanged: React.ReactEventHandler<HTMLInputElement> = () => {
    setMountAsReadOnly(!mountAsReadOnly);
  };

  const createPVCIfNecessary = () => {
    return showCreatePVC === 'new'
      ? k8sCreate(PersistentVolumeClaimModel, newPVCObj).then((claim) => claim.metadata.name)
      : Promise.resolve(claimName);
  };

  const getVolumeMountPatches = (): Patch[] => {
    const mount = {
      name: volumeName,
      mountPath,
      subPath,
      readOnly: mountAsReadOnly,
    };
    const containers: ContainerSpec[] = _.get(obj, 'spec.template.spec.containers', []);
    return containers.reduce((patch, container, i) => {
      // Only add to selected containers
      if (isContainerSelected(container)) {
        if (_.isEmpty(container.volumeMounts)) {
          patch.push({
            op: 'add',
            path: `/spec/template/spec/containers/${i}/volumeMounts`,
            value: [mount],
          });
        } else {
          patch.push({
            op: 'add',
            path: `/spec/template/spec/containers/${i}/volumeMounts/-`,
            value: mount,
          });
        }
      }
      return patch;
    }, []);
  };

  const getVolumeDevicePatches = (): Patch[] => {
    const device = {
      name: volumeName,
      devicePath,
    };
    const containers: ContainerSpec[] = obj?.spec?.template?.spec?.containers;
    return containers.reduce((patch, container, i) => {
      // Only add to selected containers
      if (isContainerSelected(container)) {
        if (_.isEmpty(container.volumeMounts)) {
          patch.push({
            op: 'add',
            path: `/spec/template/spec/containers/${i}/volumeDevices`,
            value: [device],
          });
        } else {
          patch.push({
            op: 'add',
            path: `/spec/template/spec/containers/${i}/volumeDevices/-`,
            value: device,
          });
        }
      }
      return patch;
    }, []);
  };
  const getVolumePatches = (pvcName: string) => {
    const patches =
      claimVolumeMode === 'Block' ? getVolumeDevicePatches() : getVolumeMountPatches();
    const volume = {
      name: volumeName,
      persistentVolumeClaim: {
        claimName: pvcName,
      },
    };

    if (!volumeAlreadyMounted) {
      const existingVolumes = _.get(obj, 'spec.template.spec.volumes');
      const volumePatch = _.isEmpty(existingVolumes)
        ? { op: 'add', path: '/spec/template/spec/volumes', value: [volume] }
        : { op: 'add', path: '/spec/template/spec/volumes/-', value: volume };
      return [...patches, volumePatch];
    }
    return patches;
  };

  const save = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault();
    if (useContainerSelector && selectedContainers.length === 0) {
      setError('You must choose at least one container to mount to.');
      return;
    }
    setInProgress(true);
    createPVCIfNecessary().then(
      (pvcName: string) => {
        return k8sPatch(kindObj, obj, getVolumePatches(pvcName)).then((resource) => {
          setInProgress(false);
          navigate(resourceObjPath(resource, referenceFor(resource)));
        });
      },
      (err) => {
        setError(err.message);
        setInProgress(false);
      },
    );
  };

  return (
    <form className="co-m-pane__body-group co-m-pane__form" onSubmit={save}>
      <label className="control-label co-required">{t('public~PersistentVolumeClaim')}</label>
      <div className="form-group">
        <RadioInput
          title={t('public~Use existing claim')}
          value="existing"
          key="existing"
          onChange={handleShowCreatePVCChange}
          checked={showCreatePVC === 'existing'}
          name="showCreatePVC"
        />
      </div>

      {showCreatePVC === 'existing' && (
        <div className="form-group co-form-subsection">
          <PVCDropdown
            namespace={namespace}
            onChange={handlePVCChange}
            id="claimName"
            dataTest="claim-name"
            selectedKey={claimName}
          />
        </div>
      )}
      <div className="form-group">
        <RadioInput
          title={t('public~Create new claim')}
          value="new"
          key="new"
          onChange={handleShowCreatePVCChange}
          checked={showCreatePVC === 'new'}
          name="showCreatePVC"
        />
      </div>

      {showCreatePVC === 'new' && (
        <div className="co-form-subsection">
          <CreatePVCForm onChange={setNewPVCObj} namespace={namespace} />
        </div>
      )}

      {claimVolumeMode === 'Block' ? (
        <div className="form-group">
          <label className="control-label co-required" htmlFor="device-path">
            {t('public~Device path')}
          </label>
          <div>
            <input
              className="pf-v5-c-form-control"
              type="text"
              onChange={handleDevicePathChange}
              aria-describedby="volume-device-help"
              name="devicePath"
              id="device-path"
              value={devicePath}
              required
            />
            <p className="help-block" id="volume-device-help">
              {t('public~Device path for the block volume inside the container.')}
            </p>
          </div>
        </div>
      ) : (
        <div className="form-group">
          <label className="control-label co-required" htmlFor="mount-path">
            {t('public~Mount path')}
          </label>
          <div>
            <input
              className="pf-v5-c-form-control"
              type="text"
              onChange={handleMountPathChange}
              aria-describedby="mount-path-help"
              name="mountPath"
              id="mount-path"
              data-test="mount-path"
              value={mountPath}
              required
            />
            <p className="help-block" id="mount-path-help">
              {t('public~Mount path for the volume inside the container.')}
            </p>
          </div>
          <Checkbox
            label={t('public~Mount as read-only')}
            onChange={onMountAsReadOnlyChanged}
            checked={mountAsReadOnly}
            name="mountAsReadOnly"
          />
          <div className="form-group">
            <label className="control-label" htmlFor="subpath">
              {t('public~Subpath')}
            </label>
            <div>
              <input
                className="pf-v5-c-form-control"
                type="text"
                onChange={handleSubPathChange}
                aria-describedby="subpath-help"
                id="subpath"
                name="subPath"
                value={subPath}
              />
              <p className="help-block" id="subpath-help">
                {t(
                  'public~Optional path within the volume from which it will be mounted into the container. Defaults to the root of the volume.',
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {!useContainerSelector && (
        <p>
          <Trans t={t} ns="public">
            The volume will be mounted into all containers. You can{' '}
            <Button type="button" onClick={handleSelectContainers} variant="link" isInline>
              select specific containers
            </Button>{' '}
            instead.
          </Trans>
        </p>
      )}
      {useContainerSelector && (
        <div className="form-group co-break-word">
          <label className="control-label">{t('public~Containers')}</label>
          <Button type="button" onClick={handleSelectContainers} variant="link">
            {t('public~(use all containers)')}
          </Button>
          <ContainerSelector
            containers={obj.spec.template.spec.containers}
            selected={selectedContainers}
            onChange={handleContainerSelectionChange}
          />
          <p className="help-block" id="subpath-help">
            {t('public~Select which containers to mount volume into.')}
          </p>
        </div>
      )}
      <ButtonBar errorMessage={error} inProgress={inProgress}>
        <ActionGroup className="pf-v5-c-form">
          <Button
            type="submit"
            variant="primary"
            id="save-changes"
            isDisabled={showCreatePVC === 'existing' && !claimName}
          >
            {t('public~Save')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            {t('public~Cancel')}
          </Button>
        </ActionGroup>
      </ButtonBar>
    </form>
  );
};

export const AttachStorage = ({ kindObj, kindsInFlight }) => {
  const params = useParams();
  if (!kindObj && kindsInFlight) {
    return <LoadingBox />;
  }
  return <AttachStorageForm namespace={params.ns} resourceName={params.name} kindObj={kindObj} />;
};

export type AttachStorageFormProps = {
  kindObj: K8sKind;
  namespace: string;
  resourceName: string;
};
