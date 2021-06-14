import * as React from 'react';
import { FormGroup, Title, Dropdown, DropdownItem, DropdownToggle } from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';
import { Edge, Node } from '@patternfly/react-topology';
import { Formik, FormikProps, FormikValues } from 'formik';
import { TFunction } from 'i18next';
import { Trans, useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { PromiseComponent, ResourceIcon } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  TYPE_EVENT_SOURCE_LINK,
  TYPE_KAFKA_CONNECTION_LINK,
} from '@console/knative-plugin/src/topology/const';
import {
  createEventSourceKafkaConnection,
  createSinkConnection,
} from '@console/knative-plugin/src/topology/knative-topology-utils';
import { TYPE_CONNECTS_TO, TYPE_SERVICE_BINDING } from '../../const';
import { createConnection } from '../../utils';

type MoveConnectionModalProps = {
  edge: Edge;
  availableTargets: Node[];
  cancel?: () => void;
  close?: () => void;
};

type MoveConnectionModalState = {
  inProgress: boolean;
  errorMessage: string;
};

const nodeItem = (node: Node) => (
  <span>
    <span className="co-icon-space-r">
      <ResourceIcon kind={node.getData().data?.kind} />
    </span>
    {node.getLabel()}
  </span>
);

const MoveConnectionForm: React.FC<FormikProps<FormikValues> &
  MoveConnectionModalProps & { setTranslator: (t: TFunction) => void }> = ({
  handleSubmit,
  isSubmitting,
  setTranslator,
  cancel,
  values,
  edge,
  availableTargets,
  status,
}) => {
  const { t } = useTranslation();
  const [isOpen, setOpen] = React.useState<boolean>(false);
  const isDirty = values.target.getId() !== edge.getTarget().getId();
  setTranslator(t);

  const onToggle = () => {
    setOpen(!isOpen);
  };

  const dropDownNodeItem = (node: Node) => {
    return (
      <DropdownItem
        key={node.getId()}
        component="button"
        onClick={() => {
          values.target = node;
          setOpen(false);
        }}
      >
        {nodeItem(node)}
      </DropdownItem>
    );
  };

  const sourceLabel = edge.getSource().getLabel();
  return (
    <form onSubmit={handleSubmit} className="modal-content modal-content--no-inner-scroll">
      <ModalTitle>{t('topology~Move connector')}</ModalTitle>
      <ModalBody>
        <Title headingLevel="h2" size="md" className="co-m-form-row">
          <Trans ns="topology" t={t}>
            Connect <strong>{{ sourceLabel }}</strong> to
          </Trans>
        </Title>
        <div className="pf-c-form">
          <FormGroup fieldId="target-node" label="Target">
            <Dropdown
              id="target-node-dropdown"
              className="dropdown--full-width"
              toggle={
                <DropdownToggle id="toggle-id" onToggle={onToggle} toggleIndicator={CaretDownIcon}>
                  {nodeItem(values.target)}
                </DropdownToggle>
              }
              isOpen={isOpen}
              dropdownItems={availableTargets.map(dropDownNodeItem)}
            />
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

class MoveConnectionModal extends PromiseComponent<
  MoveConnectionModalProps,
  MoveConnectionModalState
> {
  private t: TFunction;

  private onSubmit = (newTarget: Node): Promise<K8sResourceKind[] | K8sResourceKind> => {
    const { edge } = this.props;
    switch (edge.getType()) {
      case TYPE_CONNECTS_TO:
        return createConnection(edge.getSource(), newTarget, edge.getTarget());
      case TYPE_SERVICE_BINDING:
        return createConnection(edge.getSource(), newTarget, edge.getTarget());
      case TYPE_EVENT_SOURCE_LINK:
        return createSinkConnection(edge.getSource(), newTarget);
      case TYPE_KAFKA_CONNECTION_LINK:
        return createEventSourceKafkaConnection(edge.getSource(), newTarget);
      default:
        return Promise.reject(
          new Error(
            this.t('topology~Unable to move connector of type {{type}}.', {
              type: edge.getType(),
            }),
          ),
        );
    }
  };

  private handleSubmit = (values, actions) => {
    const { close } = this.props;
    return this.handlePromise(this.onSubmit(values.target))
      .then(() => {
        close();
      })
      .catch((err) => {
        actions.setStatus({ submitError: err });
      });
  };

  private setTranslator = (t: TFunction) => {
    this.t = t;
  };

  render() {
    const { edge } = this.props;
    const initialValues = {
      target: edge.getTarget(),
    };
    return (
      <Formik initialValues={initialValues} onSubmit={this.handleSubmit}>
        {(formikProps) => (
          <MoveConnectionForm setTranslator={this.setTranslator} {...formikProps} {...this.props} />
        )}
      </Formik>
    );
  }
}

export const moveConnectionModal = createModalLauncher((props: MoveConnectionModalProps) => (
  <MoveConnectionModal {...props} />
));
