import * as yup from 'yup';
import * as React from 'react';
import { Formik, FormikValues, FormikHelpers } from 'formik';
import { useTranslation } from 'react-i18next';
import { K8sResourceKind, k8sUpdate, referenceFor, modelFor } from '@console/internal/module/k8s';
import { sinkTypeUriValidation } from '../add/eventSource-validation-utils';
import SinkSourceModal from './SinkSourceModal';
import { SinkType } from '../add/import-types';

export interface SinkSourceProps {
  source: K8sResourceKind;
  cancel?: () => void;
  close?: () => void;
}

const SinkSource: React.FC<SinkSourceProps> = ({ source, cancel, close }) => {
  const { t } = useTranslation();
  const {
    metadata: { namespace, name },
    spec,
  } = source;
  const isSinkRef = !!spec?.sink?.ref;
  const { name: sinkName = '', apiVersion = '', kind = '', uri = '' } = isSinkRef
    ? spec?.sink?.ref
    : spec?.sink || {};
  const sinkKey = sinkName && kind ? `${kind}-${sinkName}` : '';
  const initialValues = {
    formData: {
      sinkType: uri ? SinkType.Uri : SinkType.Resource,
      sink: {
        apiVersion,
        kind,
        name: sinkName,
        key: sinkKey,
        uri,
      },
    },
  };
  const handleSubmit = (values: FormikValues, action: FormikHelpers<FormikValues>) => {
    const {
      formData: { sinkType, sink },
    } = values;
    const updatePayload = {
      ...source,
      ...(SinkType.Uri !== sinkType
        ? {
            spec: {
              ...source.spec,
              sink: {
                ref: {
                  apiVersion: sink?.apiVersion,
                  kind: sink?.kind,
                  name: sink?.name,
                },
              },
            },
          }
        : { spec: { ...source.spec, sink: { uri: sink?.uri } } }),
    };
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
      validationSchema={() =>
        yup.object().shape({
          formData: yup.object().shape({
            sink: yup.object().when('sinkType', {
              is: SinkType.Uri,
              then: sinkTypeUriValidation(t),
            }),
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
