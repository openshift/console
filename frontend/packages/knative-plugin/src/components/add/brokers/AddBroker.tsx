import * as React from 'react';
import { Formik, FormikHelpers } from 'formik';
import { safeLoad } from 'js-yaml';
import { useTranslation } from 'react-i18next';
import { handleRedirect } from '@console/dev-console/src/components/import/import-submit-utils';
import { history } from '@console/internal/components/utils';
import { K8sResourceKind, k8sCreate } from '@console/internal/module/k8s';
import { useExtensions, isPerspective, Perspective } from '@console/plugin-sdk';
import { useActivePerspective } from '@console/shared';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { EventingBrokerModel } from '../../../models';
import { AddBrokerFormYamlValues } from '../import-types';
import { convertFormToBrokerYaml, addBrokerInitialValues } from './add-broker-utils';
import AddBrokerForm from './AddBrokerForm';
import { brokerValidationSchema } from './broker-validation-utils';

interface AddBrokerProps {
  namespace: string;
  selectedApplication: string;
  contextSource?: string;
}

const AddBroker: React.FC<AddBrokerProps> = ({ namespace, selectedApplication }) => {
  const perspectiveExtension = useExtensions<Perspective>(isPerspective);
  const [perspective] = useActivePerspective();
  const { t } = useTranslation();
  const initialValues: AddBrokerFormYamlValues = addBrokerInitialValues(
    namespace,
    selectedApplication,
  );

  const createResources = (
    formValues: AddBrokerFormYamlValues,
    actions: FormikHelpers<AddBrokerFormYamlValues>,
  ): Promise<K8sResourceKind> => {
    let broker;
    if (formValues.editorType === EditorType.Form) {
      broker = convertFormToBrokerYaml(formValues);
    } else {
      try {
        broker = safeLoad(formValues.yamlData);
        if (!broker.metadata?.namespace) {
          broker.metadata.namespace = formValues.formData.project.name;
        }
      } catch (err) {
        actions.setStatus({ submitError: `Invalid YAML - ${err}` });
        return null;
      }
    }
    return k8sCreate(EventingBrokerModel, broker);
  };

  const handleSubmit = (
    values: AddBrokerFormYamlValues,
    actions: FormikHelpers<AddBrokerFormYamlValues>,
  ) => {
    return createResources(values, actions)
      .then(() => {
        handleRedirect(values.formData.project.name, perspective, perspectiveExtension);
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
      validationSchema={brokerValidationSchema(t)}
    >
      {(formikProps) => <AddBrokerForm {...formikProps} namespace={namespace} />}
    </Formik>
  );
};

export default AddBroker;
