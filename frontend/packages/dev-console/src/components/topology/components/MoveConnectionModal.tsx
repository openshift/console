import * as React from 'react';
import { connect } from 'react-redux';
import { FormGroup, Title, Dropdown, DropdownItem, DropdownToggle } from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';
import { Formik, FormikProps, FormikValues } from 'formik';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { PromiseComponent, ResourceIcon } from '@console/internal/components/utils';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { Edge, Node } from '@console/topology';
import FormSection from '../../import/section/FormSection';
import { RootState } from '@console/internal/redux';
import { ALLOW_SERVICE_BINDING } from '../../../const';
import { TYPE_CONNECTS_TO, TYPE_EVENT_SOURCE_LINK, TYPE_SERVICE_BINDING } from '../const';
import { createConnection, createSinkConnection } from './createConnection';

interface StateProps {
  serviceBinding: boolean;
}
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

const MoveConnectionForm: React.FC<FormikProps<FormikValues> & MoveConnectionModalProps> = ({
  handleSubmit,
  isSubmitting,
  cancel,
  values,
  edge,
  availableTargets,
  status,
}) => {
  const [isOpen, setOpen] = React.useState<boolean>(false);
  const isDirty = values.target.getId() !== edge.getTarget().getId();

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

  return (
    <form onSubmit={handleSubmit} className="modal-content modal-content--no-inner-scroll">
      <ModalTitle>Move Connector</ModalTitle>
      <ModalBody>
        <Title size="sm" className="co-m-form-row">
          Connect
          <strong>{` ${edge.getSource().getLabel()} `}</strong>
          to
        </Title>
        <FormSection fullWidth>
          <FormGroup fieldId="target-node" label="Target">
            <Dropdown
              id="target-node-dropdown"
              className="dropdown--full-width"
              toggle={
                <DropdownToggle id="toggle-id" onToggle={onToggle} iconComponent={CaretDownIcon}>
                  {nodeItem(values.target)}
                </DropdownToggle>
              }
              isOpen={isOpen}
              dropdownItems={availableTargets.map(dropDownNodeItem)}
            />
          </FormGroup>
        </FormSection>
      </ModalBody>
      <ModalSubmitFooter
        submitText="Move"
        submitDisabled={!isDirty}
        cancel={cancel}
        inProgress={isSubmitting}
        errorMessage={status && status.submitError}
      />
    </form>
  );
};

class MoveConnectionModal extends PromiseComponent<
  MoveConnectionModalProps & StateProps,
  MoveConnectionModalState
> {
  private onSubmit = (newTarget: Node): Promise<K8sResourceKind[] | K8sResourceKind> => {
    const { edge, serviceBinding } = this.props;
    switch (edge.getType()) {
      case TYPE_CONNECTS_TO:
        return createConnection(edge.getSource(), newTarget, edge.getTarget(), serviceBinding);
      case TYPE_SERVICE_BINDING:
        return createConnection(edge.getSource(), newTarget, edge.getTarget(), serviceBinding);
      case TYPE_EVENT_SOURCE_LINK:
        return createSinkConnection(edge.getSource(), newTarget);
      default:
        return Promise.reject(new Error(`Unable to move connector of type ${edge.getType()}.`));
    }
  };

  private handleSubmit = (values, actions) => {
    actions.setSubmitting(true);
    const { close } = this.props;
    this.handlePromise(this.onSubmit(values.target))
      .then(() => {
        actions.setSubmitting(false);
        close();
      })
      .catch((err) => {
        actions.setSubmitting(false);
        actions.setStatus({ submitError: err });
      });
  };

  render() {
    const { edge } = this.props;
    const initialValues = {
      target: edge.getTarget(),
    };
    return (
      <Formik
        initialValues={initialValues}
        onSubmit={this.handleSubmit}
        render={(formProps) => <MoveConnectionForm {...formProps} {...this.props} />}
      />
    );
  }
}

const getServiceBindingStatus = ({ FLAGS }: RootState): boolean => FLAGS.get(ALLOW_SERVICE_BINDING);

const mapStateToProps = (state: RootState): StateProps => {
  return {
    serviceBinding: getServiceBindingStatus(state),
  };
};

const ConnectedMoveConnectionModal = connect(mapStateToProps)(MoveConnectionModal);

export const moveConnectionModal = createModalLauncher((props: MoveConnectionModalProps) => (
  <ConnectedMoveConnectionModal {...props} />
));
