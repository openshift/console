import type { FC, Ref } from 'react';
import { useState, useCallback } from 'react';
import {
  FormGroup,
  Title,
  Select,
  SelectList,
  SelectOption,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import { Edge, Node } from '@patternfly/react-topology';
import { Formik, FormikProps, FormikValues } from 'formik';
import { Trans, useTranslation } from 'react-i18next';
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalWrapper,
} from '@console/internal/components/factory/modal';
import { ResourceIcon } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  TYPE_EVENT_SOURCE_LINK,
  TYPE_KAFKA_CONNECTION_LINK,
} from '@console/knative-plugin/src/topology/const';
import {
  createEventSourceKafkaConnection,
  createSinkConnection,
} from '@console/knative-plugin/src/topology/knative-topology-utils';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import { TYPE_CONNECTS_TO } from '../../const';
import { createConnection } from '../../utils';

type MoveConnectionModalProps = {
  edge: Edge;
  availableTargets: Node[];
  cancel?: () => void;
  close?: () => void;
};

const nodeItem = (node: Node) => (
  <span>
    <span className="co-icon-space-r">
      <ResourceIcon kind={node.getData().data?.kind} />
    </span>
    {node.getLabel()}
  </span>
);

const MoveConnectionForm: FC<FormikProps<FormikValues> & MoveConnectionModalProps> = ({
  handleSubmit,
  isSubmitting,
  cancel,
  values,
  setFieldValue,
  edge,
  availableTargets,
  status,
}) => {
  const { t } = useTranslation();
  const [isOpen, setOpen] = useState<boolean>(false);
  const isDirty = values.target.getId() !== edge.getTarget().getId();

  const toggle = (toggleRef: Ref<MenuToggleElement>) => (
    <MenuToggle
      id="toggle-id"
      ref={toggleRef}
      onClick={() => setOpen(!isOpen)}
      isExpanded={isOpen}
      isFullWidth
    >
      {nodeItem(values.target)}
    </MenuToggle>
  );

  const sourceLabel = edge.getSource().getLabel();
  return (
    <form onSubmit={handleSubmit} className="modal-content">
      <ModalTitle>{t('topology~Move connector')}</ModalTitle>
      <ModalBody>
        <Title headingLevel="h2" size="md" className="co-m-form-row">
          <Trans ns="topology" t={t}>
            Connect <strong>{{ sourceLabel }}</strong> to
          </Trans>
        </Title>
        <div className="pf-v6-c-form">
          <FormGroup fieldId="target-node" label="Target">
            <Select
              id="target-node-dropdown"
              onSelect={(_, value: Node) => {
                if (value) {
                  setFieldValue('target', value);
                }
                setOpen(false);
              }}
              toggle={toggle}
              isOpen={isOpen}
              onOpenChange={(open) => setOpen(open)}
            >
              <SelectList>
                {availableTargets.map((node) => (
                  <SelectOption
                    key={node.getId()}
                    value={node}
                    isSelected={values.target.getId() === node.getId()}
                  >
                    {nodeItem(node)}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </FormGroup>
        </div>
      </ModalBody>
      <ModalSubmitFooter
        submitText={t('topology~Move')}
        submitDisabled={!isDirty || isSubmitting}
        cancel={cancel}
        inProgress={isSubmitting}
        errorMessage={status && status.submitError}
      />
    </form>
  );
};

const MoveConnectionModal: FC<MoveConnectionModalProps> = (props) => {
  const { edge, close } = props;
  const { t } = useTranslation();
  const [handlePromise] = usePromiseHandler();

  const onSubmit = useCallback(
    (newTarget: Node): Promise<K8sResourceKind[] | K8sResourceKind> => {
      switch (edge.getType()) {
        case TYPE_CONNECTS_TO:
          return createConnection(edge.getSource(), newTarget, edge.getTarget());
        case TYPE_EVENT_SOURCE_LINK:
          return createSinkConnection(edge.getSource(), newTarget);
        case TYPE_KAFKA_CONNECTION_LINK:
          return createEventSourceKafkaConnection(edge.getSource(), newTarget);
        default:
          return Promise.reject(
            new Error(
              t('topology~Unable to move connector of type {{type}}.', {
                type: edge.getType(),
              }),
            ),
          );
      }
    },
    [edge, t],
  );

  const handleSubmit = useCallback(
    (values, actions) => {
      return handlePromise(onSubmit(values.target))
        .then(() => {
          close();
        })
        .catch((err) => {
          actions.setStatus({ submitError: err });
        });
    },
    [handlePromise, onSubmit, close],
  );

  const initialValues = {
    target: edge.getTarget(),
  };

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {(formikProps) => <MoveConnectionForm {...formikProps} {...props} />}
    </Formik>
  );
};

const MoveConnectionModalProvider: OverlayComponent<MoveConnectionModalProps> = (props) => {
  return (
    <ModalWrapper blocking onClose={props.closeOverlay}>
      <MoveConnectionModal cancel={props.closeOverlay} close={props.closeOverlay} {...props} />
    </ModalWrapper>
  );
};

export const useMoveConnectionModalLauncher = (props: MoveConnectionModalProps) => {
  const launcher = useOverlay();
  return useCallback(() => launcher<MoveConnectionModalProps>(MoveConnectionModalProvider, props), [
    launcher,
    props,
  ]);
};
