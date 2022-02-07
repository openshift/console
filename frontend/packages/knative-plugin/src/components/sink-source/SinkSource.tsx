import * as React from 'react';
import { Formik, FormikValues, FormikHelpers } from 'formik';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';
import { K8sResourceKind, k8sUpdate, referenceFor, modelFor } from '@console/internal/module/k8s';
import { sinkTypeUriValidation } from '../add/eventSource-validation-utils';
import { SinkType } from '../add/import-types';
import { craftResourceKey } from '../pub-sub/pub-sub-utils';
import SinkSourceModal from './SinkSourceModal';

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
  const initialValues = {
    formData: {
      sinkType: uri ? SinkType.Uri : SinkType.Resource,
      sink: {
        apiVersion,
        kind,
        name: sinkName,
        key: craftResourceKey(sinkName, { kind, apiVersion }),
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
              then: sinkTypeUriValidation(),
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
