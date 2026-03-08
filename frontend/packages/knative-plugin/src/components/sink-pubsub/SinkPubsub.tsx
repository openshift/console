import type { FC } from 'react';
import { useMemo } from 'react';
import type { FormikValues, FormikHelpers } from 'formik';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { k8sUpdate, referenceFor, modelFor, referenceForModel } from '@console/internal/module/k8s';
import { ServiceModel as KsServiceModel, KafkaSinkModel } from '../../models';
import { craftResourceKey, sanitizeResourceName } from '../pub-sub/pub-sub-utils';
import SinkPubsubModal from './SinkPubsubModal';

export interface SinkPubsubProps {
  source: K8sResourceKind;
  resourceType: string;
  cancel?: () => void;
  close?: () => void;
}

const SinkPubsub: FC<SinkPubsubProps> = ({ source, resourceType, cancel, close }) => {
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

  const watchSpec = useMemo(
    () =>
      namespace
        ? {
            services: {
              isList: true,
              kind: 'Service',
              namespace,
              optional: true,
            },
            ksservices: {
              isList: true,
              kind: referenceForModel(KsServiceModel),
              namespace,
              optional: true,
            },
            kafkasinks: {
              isList: true,
              kind: referenceForModel(KafkaSinkModel),
              namespace,
              optional: true,
            },
          }
        : {},
    [namespace],
  );

  const watchedResources = useK8sWatchResources<{
    services?: K8sResourceKind[];
    ksservices?: K8sResourceKind[];
    kafkasinks?: K8sResourceKind[];
  }>(watchSpec);

  const resourceDropdown = useMemo(
    () =>
      namespace
        ? [
            {
              data: watchedResources.services?.data,
              loaded: watchedResources.services?.loaded,
              loadError: watchedResources.services?.loadError,
              kind: 'Service',
            },
            {
              data: watchedResources.ksservices?.data,
              loaded: watchedResources.ksservices?.loaded,
              loadError: watchedResources.ksservices?.loadError,
              kind: KsServiceModel.kind,
            },
            {
              data: watchedResources.kafkasinks?.data,
              loaded: watchedResources.kafkasinks?.loaded,
              loadError: watchedResources.kafkasinks?.loadError,
              kind: KafkaSinkModel.kind,
            },
          ]
        : [],
    [
      namespace,
      watchedResources.services?.data,
      watchedResources.services?.loaded,
      watchedResources.services?.loadError,
      watchedResources.ksservices?.data,
      watchedResources.ksservices?.loaded,
      watchedResources.ksservices?.loadError,
      watchedResources.kafkasinks?.data,
      watchedResources.kafkasinks?.loaded,
      watchedResources.kafkasinks?.loadError,
    ],
  );

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
          resourceDropdown={resourceDropdown}
          labelTitle={t('knative-plugin~Move {{kind}}', { kind: resourceType })}
          cancel={cancel}
        />
      )}
    </Formik>
  );
};

export default SinkPubsub;
