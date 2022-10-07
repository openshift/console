import * as React from 'react';
import { Formik } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { k8sCreateResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { history } from '@console/internal/components/utils';
import {
  K8sResourceKind,
  modelFor,
  referenceFor,
  getGroupVersionKind,
} from '@console/internal/module/k8s';
import { getActiveApplication } from '@console/internal/reducers/ui';
import { ALL_APPLICATIONS_KEY, usePerspectives } from '@console/shared';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { safeJSToYAML } from '@console/shared/src/utils/yaml';
import { sanitizeApplicationValue } from '@console/topology/src/utils/application-utils';
import { CamelKameletBindingModel, KafkaSinkModel } from '../../models';
import {
  getCatalogEventSinkResource,
  getEventSinkData,
  getEventSinksDepResource,
  getKameletSinkData,
} from '../../utils/create-eventsink-utils';
import { handleRedirect } from '../../utils/create-eventsources-utils';
import { craftResourceKey } from '../pub-sub/pub-sub-utils';
import { EVENT_SOURCES_APP } from './const';
import { eventSinkValidationSchema } from './eventSink-validation-utils';
import EventSinkForm from './EventSinkForm';
import { KnEventCatalogMetaData, EventSinkFormData, EventSinkSyncFormData } from './import-types';
import KnEventMetaDescription from './KnEventMetaDescription';

interface EventSinkProps {
  namespace: string;
  normalizedSink: KnEventCatalogMetaData;
  contextSource?: string;
  selectedApplication?: string;
  sinkKind: string;
  kameletSink?: K8sResourceKind;
}

const EventSink: React.FC<EventSinkProps> = ({
  namespace,
  normalizedSink,
  contextSource,
  selectedApplication,
  sinkKind = '',
  kameletSink,
}) => {
  const perpectiveExtension = usePerspectives();
  const [perspective] = useActivePerspective();
  const { t } = useTranslation();
  const application = useSelector(getActiveApplication);
  const currentApp = selectedApplication || application;

  let sinkApiVersion = '';
  let sinkData = {};
  let sinkName = '';

  if (sinkKind && sinkKind === KafkaSinkModel.kind) {
    sinkApiVersion = `${KafkaSinkModel.apiGroup}/${KafkaSinkModel.apiVersion}`;
    sinkData = { [KafkaSinkModel.kind]: getEventSinkData(sinkKind) };
    sinkName = _.kebabCase(sinkKind);
  } else {
    sinkApiVersion = `${CamelKameletBindingModel.apiGroup}/${CamelKameletBindingModel.apiVersion}`;
    sinkData = { [CamelKameletBindingModel.kind]: getKameletSinkData(kameletSink) };
    sinkName = `kamelet-${kameletSink.metadata.name}`;
  }

  const activeApplication = currentApp !== ALL_APPLICATIONS_KEY ? currentApp : '';
  const [sourceGroupVersionKind = '', sourceName = ''] = contextSource?.split('/') ?? [];
  const [sourceGroup = '', sourceVersion = '', sourceKind = ''] =
    getGroupVersionKind(sourceGroupVersionKind) ?? [];
  const sourceApiVersion = sourceGroup ? `${sourceGroup}/${sourceVersion}` : '';

  const eventSinkMetaDescription = <KnEventMetaDescription normalizedData={normalizedSink} />;

  const initialFormData: EventSinkFormData = {
    project: {
      name: namespace || '',
      displayName: '',
      description: '',
    },
    application: {
      initial: sanitizeApplicationValue(activeApplication),
      name: sanitizeApplicationValue(activeApplication) ?? EVENT_SOURCES_APP,
      selectedKey: activeApplication,
      isInContext: !!sanitizeApplicationValue(activeApplication),
    },
    name: sinkName,
    apiVersion: sinkApiVersion,
    ...(sinkKind !== KafkaSinkModel.kind && {
      source: {
        apiVersion: sourceApiVersion,
        kind: sourceKind,
        name: sourceName,
        key: craftResourceKey(sourceName, {
          kind: sourceKind,
          apiVersion: `${sourceGroup}/${sourceVersion}`,
        }),
      },
    }),
    type: sinkKind,
    data: sinkData,
  };

  const initialYamlData: string = safeJSToYAML(
    getEventSinksDepResource(initialFormData),
    'yamlData',
    {
      skipInvalid: true,
      noRefs: true,
    },
  );

  const catalogInitialValues: EventSinkSyncFormData = {
    editorType: EditorType.Form,
    showCanUseYAMLMessage: true,
    formData: initialFormData,
    yamlData: initialYamlData,
  };

  const createResources = (rawFormData: any): Promise<K8sResourceKind> => {
    const knEventSinkResource = getCatalogEventSinkResource(rawFormData);
    if (knEventSinkResource?.kind && modelFor(referenceFor(knEventSinkResource))) {
      return k8sCreateResource({
        model: modelFor(referenceFor(knEventSinkResource)),
        data: knEventSinkResource,
      });
    }
    const errMessage =
      knEventSinkResource?.kind && knEventSinkResource?.apiVersion
        ? t('knative-plugin~No model registered for {{referenceForKnEventSink}}', {
            referenceForKnEventSink: referenceFor(knEventSinkResource),
          })
        : t('knative-plugin~Invalid YAML');
    return Promise.reject(new Error(errMessage));
  };

  const handleSubmit = (values, actions) => {
    const {
      formData: {
        project: { name: projectName },
      },
    } = values;
    const eventSinkRequest: Promise<K8sResourceKind> = createResources(values);

    return eventSinkRequest
      .then(() => {
        handleRedirect(projectName, perspective, perpectiveExtension);
      })
      .catch((err) => {
        actions.setStatus({ submitError: err.message });
      });
  };

  return (
    <Formik
      initialValues={catalogInitialValues}
      onSubmit={handleSubmit}
      onReset={history.goBack}
      validateOnBlur={false}
      validateOnChange={false}
      validationSchema={eventSinkValidationSchema(t)}
    >
      {(formikProps) => (
        <EventSinkForm
          {...formikProps}
          namespace={namespace}
          eventSinkMetaDescription={eventSinkMetaDescription}
          kameletSink={kameletSink}
        />
      )}
    </Formik>
  );
};

export default EventSink;
