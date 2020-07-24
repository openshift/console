import * as React from 'react';
import { Formik, FormikValues, FormikHelpers } from 'formik';
import { K8sResourceKind, k8sUpdate, referenceFor, modelFor } from '@console/internal/module/k8s';
import SinkPubsubModal from './SinkPubsubModal';
import { knativeServingResourcesServices } from '../../utils/get-knative-resources';

export interface SinkPubsubProps {
  source: K8sResourceKind;
  cancel?: () => void;
  close?: () => void;
}

const SinkPubsub: React.FC<SinkPubsubProps> = ({ source, cancel, close }) => {
  const {
    kind: sourceKind,
    metadata: { namespace, name },
    spec,
  } = source;
  const isSinkRef = !!spec?.subscriber?.ref;
  const { name: sinkName = '', apiVersion = '', kind = '' } = isSinkRef
    ? spec?.subscriber?.ref
    : {};
  const initialValues = {
    ref: {
      apiVersion,
      kind,
      name: sinkName,
    },
  };
  const resourcesDropdownField = knativeServingResourcesServices(namespace);
  const handleSubmit = (values: FormikValues, action: FormikHelpers<FormikValues>) => {
    const updatePayload = {
      ...source,
      ...(sinkName !== values?.ref?.name && {
        spec: { ...source.spec, subscriber: { ...values } },
      }),
    };
    k8sUpdate(modelFor(referenceFor(source)), updatePayload)
      .then(() => {
        action.setSubmitting(false);
        action.setStatus({ error: '' });
        close();
      })
      .catch((err) => {
        action.setStatus({ error: err.message || 'An error occurred. Please try again' });
      });
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onReset={cancel}
      initialStatus={{ error: '' }}
    >
      {(formikProps) => (
        <SinkPubsubModal
          {...formikProps}
          resourceName={name}
          resourceDropdown={resourcesDropdownField}
          labelTitle={`Move ${sourceKind}`}
          cancel={cancel}
        />
      )}
    </Formik>
  );
};

export default SinkPubsub;
