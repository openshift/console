import * as React from 'react';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { Perspective, isPerspective, useActivePerspective } from '@console/dynamic-plugin-sdk';
import { history } from '@console/internal/components/utils';
import { K8sResourceKind, k8sCreate, modelFor, referenceFor } from '@console/internal/module/k8s';
import { getActiveApplication } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';
import { useExtensions } from '@console/plugin-sdk';
import { ALL_APPLICATIONS_KEY } from '@console/shared';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { safeJSToYAML } from '@console/shared/src/utils/yaml';
import { sanitizeApplicationValue } from '@console/topology/src/utils/application-utils';
import { getCatalogChannelData, getCreateChannelData } from '../../../utils/create-channel-utils';
import { handleRedirect } from '../../../utils/create-eventsources-utils';
import { addChannelValidationSchema } from '../eventSource-validation-utils';
import { AddChannelFormData, ChannelListProps } from '../import-types';
import ChannelForm from './ChannelForm';

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
  const [perspective] = useActivePerspective();
  const { t } = useTranslation();
  const initialFormData: AddChannelFormData = {
    project: {
      name: namespace || '',
      displayName: '',
      description: '',
    },
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

  const initialYamlData: string = safeJSToYAML(getCreateChannelData(initialFormData), 'yamlData', {
    skipInvalid: true,
    noRefs: true,
  });

  const initialValues = {
    editorType: EditorType.Form,
    showCanUseYAMLMessage: true,
    formData: initialFormData,
    yamlData: initialYamlData,
  };

  const perspectiveExtension = useExtensions<Perspective>(isPerspective);

  const createResources = (rawFormData: any): Promise<K8sResourceKind> => {
    const channelResource = getCatalogChannelData(rawFormData);
    if (channelResource?.kind && modelFor(referenceFor(channelResource))) {
      return k8sCreate(modelFor(referenceFor(channelResource)), channelResource);
    }
    const errMessage =
      channelResource?.kind && channelResource?.apiVersion
        ? t('knative-plugin~No model registered for {{refrenceForChannel}}', {
            refrenceForChannel: referenceFor(channelResource),
          })
        : t('knative-plugin~Invalid YAML');
    return Promise.reject(new Error(errMessage));
  };

  const handleSubmit = (values, actions) => {
    return createResources(values)
      .then(() => {
        handleRedirect(values.formData.namespace, perspective, perspectiveExtension);
      })
      .catch((err) => {
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
      validationSchema={addChannelValidationSchema(t)}
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
