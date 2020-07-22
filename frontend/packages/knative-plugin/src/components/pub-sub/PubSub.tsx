import * as React from 'react';
import { Formik, FormikValues, FormikHelpers } from 'formik';
import { K8sResourceKind, k8sCreate } from '@console/internal/module/k8s';
import PubSubModal from './PubSubModal';
import { EventingBrokerModel, EventingTriggerModel, EventingSubscriptionModel } from '../../models';
import { pubsubValidationSchema } from './pubsub-validation-utils';

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
  const { kind, apiVersion, apiGroup } = getResourceModel();
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
    metadata: { name: '', namespace },
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
    k8sCreate(getResourceModel(), values)
      .then(() => {
        action.setSubmitting(false);
        action.setStatus({ subscriberAvailable: true, error: '' });
        close();
      })
      .catch((err) => {
        action.setStatus({
          subscriberAvailable: true,
          error: err.message || 'An error occurred. Please try again',
        });
      });
  };

  const labelTitle = `Add ${kind}`;
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
