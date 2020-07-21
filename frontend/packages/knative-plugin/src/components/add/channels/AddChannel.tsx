import * as React from 'react';
import { Formik } from 'formik';
import { connect } from 'react-redux';
import { history } from '@console/internal/components/utils';
import { getActiveApplication } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';
import { ALL_APPLICATIONS_KEY } from '@console/shared';
import { K8sResourceKind, k8sCreate, modelFor, referenceFor } from '@console/internal/module/k8s';
import { sanitizeApplicationValue } from '@console/dev-console/src/utils/application-utils';
import { AddChannelFormData, ChannelListProps } from '../import-types';
import { addChannelValidationSchema } from '../eventSource-validation-utils';
import ChannelForm from './ChannelForm';
import { getCreateChannelResource } from '../../../utils/create-channel-utils';

interface ChannelProps {
  namespace: string;
  channels: ChannelListProps;
  contextSource?: string;
  selectedApplication?: string;
}

interface StateProps {
  activeApplication: string;
}

type Props = ChannelProps & StateProps;

const AddChannel: React.FC<Props> = ({ namespace, channels, activeApplication }) => {
  const initialValues: AddChannelFormData = {
    application: {
      initial: sanitizeApplicationValue(activeApplication),
      name: sanitizeApplicationValue(activeApplication),
      selectedKey: activeApplication,
    },
    name: '',
    namespace,
    apiVersion: '',
    type: '',
    data: {},
    yamlData: '',
  };

  const createResources = (rawFormData: any): Promise<K8sResourceKind> => {
    const channelResource = getCreateChannelResource(rawFormData);
    if (channelResource?.kind && modelFor(referenceFor(channelResource))) {
      return k8sCreate(modelFor(referenceFor(channelResource)), channelResource);
    }
    const errMessage =
      channelResource?.kind && channelResource?.apiVersion
        ? `No model registered for ${referenceFor(channelResource)}`
        : 'Invalid YAML';
    return Promise.reject(new Error(errMessage));
  };

  const handleSubmit = (values, actions) => {
    createResources(values)
      .then(() => {
        actions.setSubmitting(false);
        history.push(`/topology/ns/${values.namespace}`);
      })
      .catch((err) => {
        actions.setSubmitting(false);
        actions.setStatus({ submitError: err.message });
      });
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onReset={history.goBack}
      validateOnBlur={false}
      validateOnChange={false}
      validationSchema={addChannelValidationSchema}
    >
      {(formikProps) => <ChannelForm {...formikProps} namespace={namespace} channels={channels} />}
    </Formik>
  );
};

const mapStateToProps = (state: RootState, ownProps: ChannelProps): StateProps => {
  const activeApplication = ownProps.selectedApplication || getActiveApplication(state);
  return {
    activeApplication: activeApplication !== ALL_APPLICATIONS_KEY ? activeApplication : '',
  };
};

export default connect(mapStateToProps)(AddChannel);
