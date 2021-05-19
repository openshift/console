import * as React from 'react';
import * as _ from 'lodash';
import { Formik, FormikValues, FormikHelpers } from 'formik';
import { useTranslation } from 'react-i18next';
import { K8sResourceKind, k8sUpdate, referenceFor, modelFor } from '@console/internal/module/k8s';
import SinkUriModal from './SinkUriModal';

export interface SinkUriProps {
  source: K8sResourceKind;
  eventSourceList: K8sResourceKind[];
  cancel?: () => void;
  close?: () => void;
}

const SinkUri: React.FC<SinkUriProps> = ({ source, eventSourceList, cancel, close }) => {
  const { t } = useTranslation();
  const initialValues = {
    uri: source.spec?.sinkUri ?? '',
  };
  const handleSubmit = (values: FormikValues, action: FormikHelpers<FormikValues>) => {
    const requests: Promise<K8sResourceKind>[] = [];
    _.forEach(eventSourceList, (evSrc) => {
      const updatePayload = {
        ...evSrc,
        spec: { ...evSrc.spec, sink: { ...values } },
      };
      requests.push(k8sUpdate(modelFor(referenceFor(evSrc)), updatePayload));
    });
    return Promise.race(requests)
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
      {(formikProps) => <SinkUriModal {...formikProps} cancel={cancel} />}
    </Formik>
  );
};

export default SinkUri;
