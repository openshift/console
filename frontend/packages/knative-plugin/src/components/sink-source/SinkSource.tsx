import * as yup from 'yup';
import * as React from 'react';
import { Formik, FormikValues, FormikHelpers } from 'formik';
import { K8sResourceKind, k8sUpdate, referenceFor, modelFor } from '@console/internal/module/k8s';
import { sinkTypeUriValidatiuon } from '../add/eventSource-validation-utils';
import SinkSourceModal from './SinkSourceModal';
import { SinkType } from '../add/import-types';

export interface SinkSourceProps {
  source: K8sResourceKind;
  cancel?: () => void;
  close?: () => void;
}

const SinkSource: React.FC<SinkSourceProps> = ({ source, cancel, close }) => {
  const {
    metadata: { namespace, name },
    spec,
  } = source;
  const isSinkRef = !!spec?.sink?.ref;
  const { name: sinkName = '', apiVersion = '', kind = '', uri = '' } = isSinkRef
    ? spec?.sink?.ref
    : spec?.sink || {};
  const initialValues = {
    sinkType: uri ? SinkType.Uri : SinkType.Resource,
    sink: {
      apiVersion,
      kind,
      name: sinkName,
      uri,
    },
  };
  const handleSubmit = (values: FormikValues, action: FormikHelpers<FormikValues>) => {
    const updatePayload = {
      ...source,
      ...(SinkType.Uri !== values?.sinkType
        ? {
            spec: {
              ...source.spec,
              sink: {
                ref: {
                  apiVersion: values?.sink?.apiVersion,
                  kind: values?.sink?.kind,
                  name: values?.sink?.name,
                },
              },
            },
          }
        : { spec: { ...source.spec, sink: { uri: values?.sink?.uri } } }),
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
      validationSchema={() =>
        yup.object().shape({
          sink: yup.object().when('sinkType', {
            is: SinkType.Uri,
            then: sinkTypeUriValidatiuon,
          }),
        })
      }
    >
      {(formikProps) => (
        <SinkSourceModal
          {...formikProps}
          resourceName={name}
          namespace={namespace}
          cancel={cancel}
        />
      )}
    </Formik>
  );
};

export default SinkSource;
