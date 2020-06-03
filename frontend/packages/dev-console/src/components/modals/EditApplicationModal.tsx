import * as React from 'react';
import * as _ from 'lodash';
import { Title } from '@patternfly/react-core';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { PromiseComponent } from '@console/internal/components/utils';
import { Node } from '@console/topology';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { Formik, FormikProps, FormikValues } from 'formik';
import FormSection from '../import/section/FormSection';
import ApplicationSelector from '../import/app/ApplicationSelector';
import { updateResourceApplication } from '../../utils/application-utils';
import { updateTopologyResourceApplication } from '../topology/topology-utils';
import { UNASSIGNED_KEY } from '../../const';

type EditApplicationFormProps = {
  resource: K8sResourceKind;
  initialApplication: string;
  cancel?: () => void;
};

type EditApplicationModalState = {
  inProgress: boolean;
  errorMessage: string;
};

type EditApplicationModalProps = EditApplicationFormProps & {
  resourceKind: K8sKind;
  close?: () => void;
};

const EditApplicationForm: React.FC<FormikProps<FormikValues> & EditApplicationFormProps> = ({
  resource,
  handleSubmit,
  isSubmitting,
  cancel,
  values,
  initialApplication,
  status,
}) => {
  const dirty = _.get(values, 'application.selectedKey') !== initialApplication;
  return (
    <form onSubmit={handleSubmit} className="modal-content modal-content--no-inner-scroll">
      <ModalTitle>Edit Application Grouping</ModalTitle>
      <ModalBody>
        <Title headingLevel="h2" size="md" className="co-m-form-row">
          Select an application group to add the component
          <strong>{` ${resource.metadata.name} `}</strong>
          to
        </Title>
        <FormSection fullWidth>
          <ApplicationSelector namespace={resource.metadata.namespace} />
        </FormSection>
      </ModalBody>
      <ModalSubmitFooter
        submitText="Save"
        submitDisabled={!dirty}
        cancel={cancel}
        inProgress={isSubmitting}
        errorMessage={status && status.submitError}
      />
    </form>
  );
};

class EditApplicationModal extends PromiseComponent<
  EditApplicationModalProps,
  EditApplicationModalState
> {
  private handleSubmit = (values, actions) => {
    const { resourceKind, resource } = this.props;
    const application = _.get(values, 'application.name');

    this.handlePromise(updateResourceApplication(resourceKind, resource, application))
      .then(() => {
        actions.setSubmitting(false);
        this.props.close();
      })
      .catch((errorMessage) => {
        actions.setSubmitting(false);
        actions.setStatus({ submitError: errorMessage });
      });
  };

  render() {
    const { resource } = this.props;
    const application = _.get(resource, ['metadata', 'labels', 'app.kubernetes.io/part-of']);

    const initialValues = {
      application: {
        name: application,
        selectedKey: application || UNASSIGNED_KEY,
      },
    };
    return (
      <Formik
        initialValues={initialValues}
        onSubmit={this.handleSubmit}
        render={(formProps) => (
          <EditApplicationForm {...formProps} {...this.props} initialApplication={application} />
        )}
      />
    );
  }
}

type GroupEditApplicationModalProps = {
  group: Node;
  cancel?: () => void;
  close?: () => void;
};

class GroupEditApplicationModal extends PromiseComponent<
  GroupEditApplicationModalProps,
  EditApplicationModalState
> {
  private handleSubmit = (values, actions) => {
    const application = _.get(values, 'application.name');

    this.handlePromise(updateTopologyResourceApplication(this.props.group.getData(), application))
      .then(() => {
        actions.setSubmitting(false);
        this.props.close();
      })
      .catch((errorMessage) => {
        actions.setSubmitting(false);
        actions.setStatus({ submitError: errorMessage });
      });
  };

  render() {
    const { group } = this.props;
    const resource = group.getData().resources.obj;
    const application = _.get(resource, ['metadata', 'labels', 'app.kubernetes.io/part-of']);

    const initialValues = {
      application: {
        name: application,
        selectedKey: application,
      },
    };
    return (
      <Formik
        initialValues={initialValues}
        onSubmit={this.handleSubmit}
        render={(formProps) => (
          <EditApplicationForm
            {...formProps}
            {...this.props}
            resource={resource}
            initialApplication={application}
          />
        )}
      />
    );
  }
}

export const editApplicationModal = createModalLauncher((props: EditApplicationModalProps) => (
  <EditApplicationModal {...props} />
));

export const groupEditApplicationModal = createModalLauncher(
  (props: GroupEditApplicationModalProps) => <GroupEditApplicationModal {...props} />,
);
