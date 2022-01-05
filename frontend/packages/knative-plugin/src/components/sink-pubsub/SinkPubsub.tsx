import * as React from 'react';
import { Formik, FormikValues, FormikHelpers } from 'formik';
import { useTranslation } from 'react-i18next';
import { K8sResourceKind, k8sUpdate, referenceFor, modelFor } from '@console/internal/module/k8s';
import { getSinkableResources } from '../../utils/get-knative-resources';
import { craftResourceKey, sanitizeResourceName } from '../pub-sub/pub-sub-utils';
import SinkPubsubModal from './SinkPubsubModal';

export interface SinkPubsubProps {
  source: K8sResourceKind;
  resourceType: string;
  cancel?: () => void;
  close?: () => void;
}

const SinkPubsub: React.FC<SinkPubsubProps> = ({ source, resourceType, cancel, close }) => {
  const { t } = useTranslation();
  const {
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
      name: craftResourceKey(sinkName, spec?.subscriber?.ref),
    },
  };

  const handleSubmit = (values: FormikValues, action: FormikHelpers<FormikValues>) => {
    const updatePayload = sanitizeResourceName({
      ...source,
      ...(sinkName !== values?.ref?.name && {
        spec: { ...source.spec, subscriber: { ...values } },
      }),
    });
    return k8sUpdate(modelFor(referenceFor(source)), updatePayload)
      .then(() => {
        action.setStatus({ error: '' });
        close();
      })
      .catch((err) => {
        const errMessage = err.message || t('knative-plugin~An error occurred. Please try again');
        action.setStatus({ error: errMessage });
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
          resourceDropdown={getSinkableResources(namespace)}
          labelTitle={t('knative-plugin~Move {{kind}}', { kind: resourceType })}
          cancel={cancel}
        />
      )}
    </Formik>
  );
};

export default SinkPubsub;
