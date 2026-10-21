import * as _ from 'lodash';
import type { FC, FormEvent } from 'react';
import { useState, useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
  Button,
  Content,
  ContentVariants,
  Form,
  Modal,
  ModalBody,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
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
import { ModalCallback } from './types';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';

export const RemoveVolumeModal: FC<RemoveVolumeModalProps> = (props) => {
  const [inProgress, setInProgress] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

  const submit = (event: FormEvent<EventTarget>) => {
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
  const volumeName = volume.name;
  const label = kind.label;
  const resourceName = resource.metadata.name;
  return (
    <>
      <ModalHeader
        title={t('public~Remove volume?')}
        titleIconVariant="warning"
        labelId="remove-volume-modal-title"
      />
      <ModalBody>
        <Content component={ContentVariants.p}>
          <Trans t={t} ns="public">
            Are you sure you want to remove volume{' '}
            <strong className="co-break-word">{{ volumeName }}</strong> from{' '}
            <strong>{{ label }}</strong>: <strong>{{ resourceName }}</strong>?
          </Trans>
        </Content>
        {type && (
          <Content component={ContentVariants.p}>
            {t('public~Note: This will not remove the underlying {{type}}.', { type })}
          </Content>
        )}
        <Form id="remove-volume-form" onSubmit={submit} />
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={errorMessage}>
        <Button
          type="submit"
          variant="danger"
          isLoading={inProgress}
          isDisabled={inProgress}
          data-test="confirm-action"
          form="remove-volume-form"
        >
          {t('public~Remove volume')}
        </Button>
        <Button variant="link" onClick={props.cancel} data-test-id="modal-cancel-action">
          {t('public~Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </>
  );
};

export const RemoveVolumeModalProvider: OverlayComponent<RemoveVolumeModalProps> = (props) => {
  const [isOpen, setIsOpen] = useState(true);
  const handleClose = () => {
    setIsOpen(false);
    props.closeOverlay();
  };

  return isOpen ? (
    <Modal
      variant={ModalVariant.small}
      isOpen
      onClose={handleClose}
      aria-labelledby="remove-volume-modal-title"
    >
      <RemoveVolumeModal close={handleClose} cancel={handleClose} {...props} />
    </Modal>
  ) : null;
};

export const useRemoveModalLauncher = (props: RemoveVolumeModalProps): ModalCallback => {
  const launcher = useOverlay();
  const { kind, resource, volume } = props;

  return useCallback(
    () =>
      kind &&
      resource &&
      volume &&
      launcher<RemoveVolumeModalProps>(RemoveVolumeModalProvider, props),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [launcher, kind, resource, volume],
  );
};

export type RemoveVolumeModalProps = {
  cancel?: () => void;
  close?: () => void;
  volume: RowVolumeData;
  kind: K8sKind;
  resource: K8sResourceKind;
};
