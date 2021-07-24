import * as React from 'react';
import { Formik, FormikValues, FormikHelpers } from 'formik';
import { useTranslation } from 'react-i18next';
import { K8sResourceKind, k8sCreate } from '@console/internal/module/k8s';
import { getRandomChars } from '@console/shared/src/utils';
import { EventingBrokerModel, EventingTriggerModel, EventingSubscriptionModel } from '../../models';
import { pubsubValidationSchema } from './pubsub-validation-utils';
import PubSubModal from './PubSubModal';

interface PubSubProps {
  source: K8sResourceKind;
  target?: K8sResourceKind;
  cancel?: () => void;
  close?: () => void;
}

const PubSub: React.FC<PubSubProps> = ({
  source,
  cancel,
  close,
  target = { metadata: { name: '' } },
}) => {
  const { t } = useTranslation();
  const {
    apiVersion: sourceApiVersion,
    kind: sourceKind,
    metadata: { namespace, name: sourceName },
  } = source;
  const {
    apiVersion: targetApiVersion = '',
    kind: targetKind = '',
    metadata: { name: targetName },
  } = target;
  const getResourceModel = () =>
    sourceKind === EventingBrokerModel.kind ? EventingTriggerModel : EventingSubscriptionModel;
  const { kind, apiVersion, apiGroup, labelKey } = getResourceModel();
  const getSpecForKind = (connectorSourceKind: string) => {
    let spec = {};
    if (connectorSourceKind === EventingTriggerModel.kind) {
      spec = { broker: sourceName, filter: {} };
    } else {
      spec = {
        channel: {
          apiVersion: sourceApiVersion,
          kind: sourceKind,
          name: sourceName,
        },
      };
    }
    return spec;
  };
  const initialValues = {
    apiVersion: `${apiGroup}/${apiVersion}`,
    kind,
    metadata: { name: `${sourceName}-${getRandomChars()}`, namespace },
    spec: {
      ...getSpecForKind(kind),
      subscriber: {
        ref: {
          apiVersion: targetApiVersion,
          kind: targetKind,
          name: targetName,
        },
      },
    },
  };
  const handleSubmit = (values: FormikValues, action: FormikHelpers<FormikValues>) => {
    return k8sCreate(getResourceModel(), values)
      .then(() => {
        action.setStatus({ subscriberAvailable: true, error: '' });
        close();
      })
      .catch((err) => {
        const errMessage = err.message || t('knative-plugin~An error occurred. Please try again');
        action.setStatus({
          subscriberAvailable: true,
          error: errMessage,
        });
      });
  };

  const labelTitle = t('knative-plugin~Add {{kind}}', {
    kind: t(labelKey) || kind,
  });
  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onReset={cancel}
      initialStatus={{ error: '' }}
      validationSchema={pubsubValidationSchema}
    >
      {(formikProps) => (
        <PubSubModal
          {...formikProps}
          filterEnabled={sourceKind === EventingBrokerModel.kind}
          labelTitle={labelTitle}
          cancel={cancel}
        />
      )}
    </Formik>
  );
};

export default PubSub;
