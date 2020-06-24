import * as React from 'react';
import { Formik, FormikValues, FormikHelpers } from 'formik';
import { K8sResourceKind, k8sUpdate, referenceFor, modelFor } from '@console/internal/module/k8s';
import SinkSourceModal from './SinkSourceModal';
import { knativeServingResourcesServices } from '../../utils/get-knative-resources';
import { getDynamicChannelResourceList } from '../../utils/fetch-dynamic-eventsources-utils';

export interface SinkSourceProps {
  source: K8sResourceKind;
  cancel?: () => void;
  close?: () => void;
}

const SinkSource: React.FC<SinkSourceProps> = ({ source, cancel, close }) => {
  const {
    kind: sourceKind,
    metadata: { namespace, name },
    spec,
  } = source;
  const isPubSubSink = !!spec?.subscriber;
  const { name: sinkName, apiVersion, kind } = isPubSubSink
    ? spec?.subscriber?.ref
    : spec?.sink?.ref;
  const initialValues = {
    ref: {
      apiVersion: apiVersion || '',
      kind: kind || '',
      name: sinkName || '',
    },
  };
  const handleSubmit = (values: FormikValues, action: FormikHelpers<FormikValues>) => {
    const updatePayload = {
      ...source,
      ...(sinkName !== values?.ref?.name &&
        !isPubSubSink && { spec: { ...source.spec, sink: { ...values } } }),
      ...(sinkName !== values?.ref?.name &&
        isPubSubSink && { spec: { ...source.spec, subscriber: { ...values } } }),
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

  const resourcesDropdownField = knativeServingResourcesServices(namespace);
  let labelTitle = `Move ${sourceKind}`;
  if (!isPubSubSink) {
    resourcesDropdownField.push(...getDynamicChannelResourceList(namespace));
    labelTitle = 'Move Sink';
  }

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onReset={cancel}
      initialStatus={{ error: '' }}
    >
      {(formikProps) => (
        <SinkSourceModal
          {...formikProps}
          resourceName={name}
          resourceDropdown={resourcesDropdownField}
          labelTitle={labelTitle}
          cancel={cancel}
        />
      )}
    </Formik>
  );
};

export default SinkSource;
