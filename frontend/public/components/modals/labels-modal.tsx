import * as _ from 'lodash';
import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Content,
  ContentVariants,
  Form,
  FormGroup,
  Modal,
  ModalBody,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { K8sModel } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { k8sPatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { K8sResourceKind } from '../../module/k8s';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import { ModalComponentProps } from '../factory/modal';
import { ResourceIcon } from '../utils/resource-icon';
import { SelectorInput } from '../utils/selector-input';
import { useK8sWatchResource } from '../utils/k8s-watch-hook';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';

const LABELS_PATH = '/metadata/labels';
const TEMPLATE_SELECTOR_PATH = '/spec/template/metadata/labels';

const BaseLabelsModal: FC<BaseLabelsModalProps> = ({
  cancel,
  close,
  descriptionKey,
  isPodSelector,
  kind,
  labelClassName,
  messageKey,
  messageVariables,
  path,
  resource,
}) => {
  const [handlePromise, , errorMessage] = usePromiseHandler<K8sResourceCommon>();
  const [labels, setLabels] = useState(
    SelectorInput.arrayify(_.get(resource, path.split('/').slice(1))),
  );
  const [watchedResource, watchedResourceLoaded] = useK8sWatchResource<K8sResourceCommon>({
    kind: resource?.kind,
    name: resource?.metadata?.name,
    namespace: resource?.metadata?.namespace,
  });
  const [stale, setStale] = useState(false);
  const [isInputValid, setIsInputValid] = useState(true);
  const createPath = !labels.length;
  const { t } = useTranslation();

  useEffect(() => {
    if (watchedResourceLoaded && !_.isEmpty(watchedResource)) {
      setStale(!_.isEqual(resource?.metadata?.labels, watchedResource?.metadata?.labels));
    }
  }, [path, resource, watchedResource, watchedResourceLoaded]);

  const submit = useCallback(
    (e): void => {
      e.preventDefault();
      const data = [
        {
          op: createPath ? 'add' : 'replace',
          path,
          value: SelectorInput.objectify(labels),
        },
      ];

      // https://kubernetes.io/docs/user-guide/deployments/#selector
      //   .spec.selector must match .spec.template.metadata.labels, or it will be rejected by the API
      const updateTemplate =
        isPodSelector && !_.isEmpty(_.get(resource, TEMPLATE_SELECTOR_PATH.split('/').slice(1)));

      if (updateTemplate) {
        data.push({
          path: TEMPLATE_SELECTOR_PATH,
          op: 'replace',
          value: SelectorInput.objectify(labels),
        });
      }
      const promise = k8sPatchResource({ model: kind, resource, data });
      handlePromise(promise)
        .then(close)
        .catch(() => {});
    },
    [createPath, path, labels, isPodSelector, resource, kind, handlePromise, close],
  );

  return (
    <>
      <ModalHeader
        title={
          descriptionKey
            ? t('public~Edit {{description}}', {
                description: t(descriptionKey),
              })
            : t('public~Edit labels')
        }
        data-test-id="modal-title"
      />
      <ModalBody>
        <Content component={ContentVariants.p}>
          {messageKey
            ? t(messageKey, messageVariables)
            : t(
                'public~Labels help you organize and select resources. Adding labels below will let you query for objects that have similar, overlapping or dissimilar labels.',
              )}
        </Content>
        <Form id="labels-form" onSubmit={submit}>
          <FormGroup
            label={
              <>
                {descriptionKey
                  ? t('{{description}} for', { description: t(descriptionKey) })
                  : t('public~Labels for')}{' '}
                <ResourceIcon groupVersionKind={getGroupVersionKindForModel(kind)} />{' '}
                {resource?.metadata?.name}
              </>
            }
            fieldId="tags-input"
          >
            <SelectorInput
              onChange={(l) => setLabels(l)}
              onValidationChange={setIsInputValid}
              tags={labels}
              labelClassName={labelClassName || `co-m-${kind.id}`}
              autoFocus
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts
        errorMessage={errorMessage}
        message={
          stale
            ? t('public~Labels have been updated. Click Cancel and reapply your changes.')
            : undefined
        }
      >
        <Button
          type="submit"
          variant="primary"
          isDisabled={stale || !isInputValid}
          data-test="confirm-action"
          form="labels-form"
        >
          {t('public~Save')}
        </Button>
        <Button variant="link" onClick={cancel} data-test-id="modal-cancel-action">
          {t('public~Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </>
  );
};

const LabelsModal: FC<LabelsModalProps> = (props) => (
  <BaseLabelsModal path={LABELS_PATH} {...props} />
);

export const LabelsModalOverlay: OverlayComponent<LabelsModalProps> = (props) => {
  const [isOpen, setIsOpen] = useState(true);
  const handleClose = () => {
    setIsOpen(false);
    props.closeOverlay();
  };

  return isOpen ? (
    <Modal variant={ModalVariant.small} isOpen onClose={handleClose}>
      <LabelsModal {...props} cancel={handleClose} close={handleClose} />
    </Modal>
  ) : null;
};

type BaseLabelsModalProps = {
  descriptionKey?: string;
  isPodSelector?: boolean;
  kind: K8sModel;
  labelClassName?: string;
  messageKey?: string;
  messageVariables?: { [key: string]: string };
  path: string;
  resource: K8sResourceKind;
} & ModalComponentProps;
export type LabelsModalProps = Omit<BaseLabelsModalProps, 'path'>;
