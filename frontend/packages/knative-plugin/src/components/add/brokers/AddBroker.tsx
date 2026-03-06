import type { FC } from 'react';
import { useCallback } from 'react';
import type { FormikHelpers } from 'formik';
import { Formik } from 'formik';
import { safeLoad } from 'js-yaml';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import { handleRedirect } from '@console/dev-console/src/components/import/import-submit-utils';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { k8sCreate } from '@console/internal/module/k8s';
import { usePerspectives } from '@console/shared/src';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { EventingBrokerModel } from '../../../models';
import type { AddBrokerFormYamlValues } from '../import-types';
import { convertFormToBrokerYaml, addBrokerInitialValues } from './add-broker-utils';
import AddBrokerForm from './AddBrokerForm';
import { brokerValidationSchema } from './broker-validation-utils';

interface AddBrokerProps {
  namespace: string;
  selectedApplication: string;
  contextSource?: string;
}

const AddBroker: FC<AddBrokerProps> = ({ namespace, selectedApplication }) => {
  const navigate = useNavigate();
  const handleCancel = useCallback(() => navigate(-1), [navigate]);
  const perspectiveExtension = usePerspectives();
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
    let broker: K8sResourceKind;
    if (formValues.editorType === EditorType.Form) {
      broker = convertFormToBrokerYaml(formValues.formData);
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
        handleRedirect(values.formData.project.name, perspective, perspectiveExtension, navigate);
      })
      .catch((err) => {
        actions.setStatus({ submitError: err.message });
      });
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onReset={handleCancel}
      validationSchema={brokerValidationSchema(t)}
    >
      {(formikProps) => <AddBrokerForm {...formikProps} namespace={namespace} />}
    </Formik>
  );
};

export default AddBroker;
