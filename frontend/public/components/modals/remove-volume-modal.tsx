import * as _ from 'lodash-es';
import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory';
import {
  ContainerSpec,
  getVolumeType,
  K8sKind,
  k8sPatch,
  K8sResourceKind,
  Volume,
  VolumeMount,
} from '../../module/k8s/';
import { RowVolumeData } from '../volumes-table';
import { YellowExclamationTriangleIcon } from '@console/shared';

export const RemoveVolumeModal: React.FC<RemoveVolumeModalProps> = (props) => {
  const [inProgress, setInProgress] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  const getRemoveVolumePatch = (resource: K8sResourceKind, rowVolumeData: RowVolumeData) => {
    const containers: ContainerSpec[] = _.get(resource, 'spec.template.spec.containers', []);
    const patches = [];
    let allowRemoveVolume = true;
    containers.forEach((container: ContainerSpec, i: number) => {
      const mounts: VolumeMount[] = _.get(container, 'volumeMounts', []);
      mounts.forEach((mount: VolumeMount, j: number) => {
        if (mount.name !== rowVolumeData.name) {
          return;
        }
        if (
          mount.mountPath === rowVolumeData.mountPath &&
          container.name === rowVolumeData.container
        ) {
          patches.push({
            op: 'remove',
            path: `/spec/template/spec/containers/${i}/volumeMounts/${j}`,
          });
        } else {
          allowRemoveVolume = false;
        }
      });
    });

    // if the mountCount is greater than zero, then the volume is still being used at a different mount point or in a different container
    // Either way, we cannot give the cmd to remove it
    if (allowRemoveVolume) {
      const volumes: Volume[] = _.get(resource, 'spec.template.spec.volumes', []);
      const volumeIndex = volumes.findIndex((v: Volume) => v.name === rowVolumeData.name);
      if (volumeIndex > -1) {
        patches.push({ op: 'remove', path: `/spec/template/spec/volumes/${volumeIndex}` });
      }
    }
    return patches;
  };

  const submit = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault();
    setErrorMessage('');
    setInProgress(true);
    const { kind, resource, volume } = props;
    k8sPatch(kind, resource, getRemoveVolumePatch(resource, volume))
      .then(() => {
        setInProgress(false);
        props.close();
      })
      .catch(({ message: errMessage }) => {
        setErrorMessage(errMessage);
        setInProgress(false);
      });
  };

  const { t } = useTranslation();
  const { kind, resource, volume } = props;
  const type: string = _.get(getVolumeType(volume.volumeDetail), 'id', '');
  return (
    <form onSubmit={submit} className="modal-content">
      <ModalTitle>
        <YellowExclamationTriangleIcon className="co-icon-space-r" /> {t('public~Remove volume?')}
      </ModalTitle>
      <ModalBody className="modal-body">
        <div>
          <Trans t={t} ns="public">
            Are you sure you want to remove volume{' '}
            <strong className="co-break-word">{volume.name}</strong> from{' '}
            <strong>{kind.label}</strong>: <strong>{resource.metadata.name}</strong>?
          </Trans>
        </div>
        {type && (
          <div>
            <label className="control-label">
              {t('public~Note: This will not remove the underlying {{type}}.', { type })}
            </label>
          </div>
        )}
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitDanger
        submitText={t('public~Remove volume')}
        cancel={props.cancel}
      />
    </form>
  );
};

export const removeVolumeModal = createModalLauncher(RemoveVolumeModal);

export type RemoveVolumeModalProps = {
  cancel?: () => void;
  close?: () => void;
  volume: RowVolumeData;
  kind: K8sKind;
  resource: K8sResourceKind;
};
