import * as React from 'react';
import { Formik, FormikValues, FormikHelpers } from 'formik';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom-v5-compat';
import { history, LoadingBox } from '@console/internal/components/utils';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { K8sResourceKind, k8sCreate } from '@console/internal/module/k8s';
import { getRandomChars } from '@console/shared/src/utils';
import { safeJSToYAML } from '@console/shared/src/utils/yaml';
import { EVENT_TYPE_NAME_PARAM, EVENT_TYPE_NAMESPACE_PARAM } from '../../../const';
import {
  EventingBrokerModel,
  EventingEventTypeModel,
  EventingSubscriptionModel,
  EventingTriggerModel,
} from '../../../models';
import { sanitizeResourceName } from '../../pub-sub/pub-sub-utils';
import { pubsubValidationSchema } from '../../pub-sub/pubsub-validation-utils';
import SubscribeForm from './SubscribeForm';

interface SubscribeProps {
  source: K8sResourceKind;
  target?: K8sResourceKind;
}

const Subscribe: React.FC<SubscribeProps> = ({ source, target = { metadata: { name: '' } } }) => {
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

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const eventTypeName = searchParams.get(EVENT_TYPE_NAME_PARAM);
  const eventTypeNamespace = searchParams.get(EVENT_TYPE_NAMESPACE_PARAM);

  const [eventType, loaded] = useK8sGet<K8sResourceKind>(
    EventingEventTypeModel,
    eventTypeName,
    eventTypeNamespace,
  );
  const specAttributes = ['type', 'source', 'schema'];

  const rows = specAttributes
    .filter((a) => loaded && eventType?.spec?.hasOwnProperty(a))
    .reduce((a, v) => ({ ...a, [v]: eventType.spec[v] }), {});
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
  const yamlData = {
    apiVersion: `${apiGroup}/${apiVersion}`,
    kind,
    metadata: { name: `${sourceName}-${getRandomChars()}`, namespace },
    spec: {
      ...getSpecForKind(kind),
      filter: {
        attributes: {
          ...rows,
        },
      },
      subscriber: {
        ref: {
          apiVersion: '',
          kind: '',
          name: '',
        },
      },
    },
  };
  const initialValues = {
    editorType: 'form',
    formData: {
      apiVersion: `${apiGroup}/${apiVersion}`,
      kind,
      metadata: { name: `${sourceName}-${getRandomChars()}`, namespace },
      spec: {
        ...getSpecForKind(kind),
        filter: {
          attributes: {
            ...rows,
          },
        },
        subscriber: {
          ref: {
            apiVersion: targetApiVersion,
            kind: targetKind,
            name: targetName,
          },
        },
      },
    },
    yamlData: safeJSToYAML(yamlData, '', { skipInvalid: true }),
  };

  const handleSubmit = (values: FormikValues, action: FormikHelpers<FormikValues>) => {
    return k8sCreate(getResourceModel(), sanitizeResourceName(values.formData))
      .then((resource) => {
        action.setStatus({ subscriberAvailable: true, error: '' });
        history.push(`/topology/ns/${resource.metadata.namespace}`);
      })
      .catch((err) => {
        const errMessage = err.message || t('knative-plugin~An error occurred. Please try again');
        action.setStatus({
          subscriberAvailable: true,
          error: errMessage,
        });
      });
  };

  const handleCancel = () => history.goBack();

  return loaded ? (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      initialStatus={{ error: '' }}
      validationSchema={pubsubValidationSchema}
    >
      {(formikProps) => (
        <SubscribeForm
          {...formikProps}
          filterEnabled={sourceKind === EventingBrokerModel.kind}
          source={source}
          handleCancel={handleCancel}
        />
      )}
    </Formik>
  ) : (
    <LoadingBox />
  );
};

export default Subscribe;
