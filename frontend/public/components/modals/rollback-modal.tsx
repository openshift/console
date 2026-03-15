import type { FC, FormEvent } from 'react';
import { useState, useEffect } from 'react';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import {
  Alert,
  Button,
  Checkbox,
  Form,
  Modal,
  ModalBody,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import {
  getDeploymentConfigVersion,
  getOwnerNameByKind,
} from '@console/shared/src/utils/resource-utils';
import { usePromiseHandler } from '@console/shared/src/hooks/usePromiseHandler';
import type { ModalComponentProps } from '@console/shared/src/types/modal';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';
import { LoadingInline } from '../utils/status-box';
import { DeploymentConfigModel, DeploymentModel, ReplicationControllerModel } from '../../models';
import type { K8sResourceKind } from '../../module/k8s';
import { k8sCreate, k8sPatch, k8sUpdate } from '../../module/k8s';
import { useK8sWatchResource } from '../utils/k8s-watch-hook';

const ANNOTATIONS_TO_SKIP = [
  'kubectl.kubernetes.io/last-applied-configuration',
  'deployment.kubernetes.io/revision',
  'deployment.kubernetes.io/revision-history',
  'deployment.kubernetes.io/desired-replicas',
  'deployment.kubernetes.io/max-replicas',
  'deprecated.deployment.rollback.to',
];

const BaseRollbackModal: FC<RollbackModalProps> = (props) => {
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();
  const { t } = useTranslation();
  const isDCRollback = props.resource.kind === ReplicationControllerModel.kind;
  const dName = getOwnerNameByKind(
    props.resource,
    isDCRollback ? DeploymentConfigModel : DeploymentModel,
  );
  const [changeScaleSettings, setChangeScaleSettings] = useState(false);
  const [changeStrategy, setChangeStrategy] = useState(false);
  const [changeTriggers, setChangeTriggers] = useState(false);
  const deploymentResource = {
    kind: isDCRollback ? DeploymentConfigModel.kind : DeploymentModel.kind,
    isList: false,
    name: dName,
    namespace: props.resource.metadata.namespace,
  };
  const [deployment, loaded, loadError] = useK8sWatchResource<K8sResourceKind>(deploymentResource);
  const [deploymentError, setDeploymentError] = useState<string>();

  const submitDCRollback = () => {
    const dcVersion = getDeploymentConfigVersion(props.resource);

    // put together a new rollback request
    const req = {
      kind: 'DeploymentConfigRollback',
      apiVersion: 'apps.openshift.io/v1',
      name: dName,
      latest: true,
      force: true,
      spec: {
        from: {},
        revision: dcVersion,
        includeTemplate: true,
        includeReplicationMeta: changeScaleSettings,
        includeStrategy: changeStrategy,
        includeTriggers: changeTriggers,
      },
    };
    const opts = {
      name: dName,
      ns: props.resource.metadata.namespace,
      path: 'rollback',
    };

    handlePromise(
      // create the deployment config rollback
      k8sCreate(DeploymentConfigModel, req, opts).then((updatedDC) => {
        // update the deployment config based on the one returned by the rollback
        return k8sUpdate(DeploymentConfigModel, updatedDC);
      }),
    )
      .then(() => {
        props.close();
      })
      .catch(() => {});
  };

  const submitDeploymentRollback = () => {
    // remove hash label before patching back into the deployment
    const rsTemplate = _.clone(props.resource.spec.template);
    delete rsTemplate.metadata.labels['pod-template-hash'];

    // compute deployment annotations
    const annotations = {};

    ANNOTATIONS_TO_SKIP.forEach((k) => {
      if (deployment.metadata.annotations[k]) {
        annotations[k] = deployment.metadata.annotations[k];
      }
    });

    Object.keys(props.resource.metadata.annotations).forEach((k) => {
      if (!ANNOTATIONS_TO_SKIP.includes(k)) {
        annotations[k] = props.resource.metadata.annotations[k];
      }
    });

    // make patch to restore
    const patch = [
      { op: 'replace', path: '/spec/template', value: rsTemplate },
      { op: 'replace', path: '/metadata/annotations', value: annotations },
    ];

    handlePromise(k8sPatch(DeploymentModel, deployment, patch))
      .then(() => {
        props.close();
      })
      .catch(() => {});
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (isDCRollback) {
      return submitDCRollback();
    }
    return submitDeploymentRollback();
  };

  useEffect(() => {
    if (loaded && !loadError && deployment) {
      if (deployment.spec.paused) {
        setDeploymentError(
          t('public~You cannot rollback a paused {{ deployType }}. You must resume it first.', {
            deployType: isDCRollback ? DeploymentConfigModel.label : DeploymentModel.label,
          }),
        );
      }
    }
  }, [deployment, isDCRollback, loadError, loaded, t]);

  const renderRollbackBody = () => {
    if (props.resource.kind === ReplicationControllerModel.kind) {
      return (
        <>
          <p>
            <Trans t={t} ns="public">
              Use the following settings from{' '}
              <strong className="co-break-word">
                {{ resourceName: props.resource.metadata.name }}
              </strong>{' '}
              when rolling back:
            </Trans>
          </p>
          <Checkbox
            label={t('public~Replica count and selector')}
            onChange={(_event, checked) => setChangeScaleSettings(checked)}
            isChecked={changeScaleSettings}
            name="changeScaleSettings"
            id="changeScaleSettings"
          />
          <Checkbox
            label={t('public~Deployment strategy')}
            onChange={(_event, checked) => setChangeStrategy(checked)}
            isChecked={changeStrategy}
            name="changeStrategy"
            id="changeStrategy"
          />
          <Checkbox
            label={t('public~Deployment trigger')}
            onChange={(_event, checked) => setChangeTriggers(checked)}
            isChecked={changeTriggers}
            name="changeTriggers"
            id="changeTriggers"
          />
        </>
      );
    }

    return (
      <p>
        <Trans t={t} ns="public">
          Are you sure you want to rollback to{' '}
          <strong className="co-break-word">
            {{ resourceName: props.resource.metadata.name }}
          </strong>
          ?
        </Trans>
      </p>
    );
  };

  return (
    <>
      <ModalHeader
        title={t('public~Rollback')}
        data-test-id="modal-title"
        labelId="rollback-modal-title"
      />
      <ModalBody>
        <Form id="rollback-form" onSubmit={submit}>
          {loaded ? (
            !loadError && !deploymentError ? (
              renderRollbackBody()
            ) : (
              <Alert isInline variant="danger" title={t('public~Unable to Rollback')}>
                <div className="co-pre-line">{loadError?.message || deploymentError}</div>
              </Alert>
            )
          ) : (
            <LoadingInline />
          )}
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={errorMessage}>
        <Button
          type="submit"
          variant="primary"
          isLoading={inProgress}
          form="rollback-form"
          data-test="confirm-action"
          id="confirm-action"
          isDisabled={!!(loadError || deploymentError)}
        >
          {t('public~Rollback')}
        </Button>
        <Button
          variant="link"
          onClick={props.cancel}
          type="button"
          data-test-id="modal-cancel-action"
        >
          {t('public~Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </>
  );
};

export const RollbackModalOverlay: OverlayComponent<RollbackModalProps> = (props) => (
  <Modal
    isOpen
    onClose={props.closeOverlay}
    variant={ModalVariant.small}
    aria-labelledby="rollback-modal-title"
  >
    <BaseRollbackModal {...props} cancel={props.closeOverlay} close={props.closeOverlay} />
  </Modal>
);

export type RollbackModalProps = {
  resource: K8sResourceKind;
} & ModalComponentProps;
