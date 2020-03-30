import * as React from 'react';
import { Formik, FormikValues, FormikHelpers } from 'formik';
import { K8sResourceKind, k8sUpdate, referenceFor, modelFor } from '@console/internal/module/k8s';
import SinkSourceModal from './SinkSourceModal';

export interface SinkSourceProps {
  source: K8sResourceKind;
  cancel?: () => void;
  close?: () => void;
}

const SinkSource: React.FC<SinkSourceProps> = ({ source, cancel, close }) => {
  const {
    metadata: { namespace, name },
    spec: {
      sink: {
        ref: { name: sinkName },
      },
    },
  } = source;

  const initialValues = {
    sink: {
      ref: {
        apiVersion: '',
        kind: '',
        name: sinkName || '',
      },
    },
  };
  const handleSubmit = (values: FormikValues, action: FormikHelpers<FormikValues>) => {
    const updatePayload = {
      ...source,
      spec: { ...source.spec, ...values },
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
      {(props) => (
        <SinkSourceModal {...props} namespace={namespace} resourceName={name} cancel={cancel} />
      )}
    </Formik>
  );
};

export default SinkSource;
