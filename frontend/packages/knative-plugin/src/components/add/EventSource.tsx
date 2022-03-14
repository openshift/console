import * as React from 'react';
import { Formik } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { Perspective, isPerspective, useActivePerspective } from '@console/dynamic-plugin-sdk';
import { history } from '@console/internal/components/utils';
import {
  K8sResourceKind,
  modelFor,
  referenceFor,
  k8sCreate,
  getGroupVersionKind,
} from '@console/internal/module/k8s';
import { getActiveApplication } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';
import { useExtensions } from '@console/plugin-sdk';
import { ALL_APPLICATIONS_KEY } from '@console/shared';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { safeJSToYAML } from '@console/shared/src/utils/yaml';
import { sanitizeApplicationValue } from '@console/topology/src/utils/application-utils';
import { KNATIVE_EVENT_SOURCE_APIGROUP } from '../../const';
import { CamelKameletBindingModel } from '../../models';
import {
  getCatalogEventSourceResource,
  isKnownEventSource,
  getEventSourceData,
  handleRedirect,
  getKameletSourceData,
  getEventSourceResource,
} from '../../utils/create-eventsources-utils';
import { getEventSourceModels } from '../../utils/fetch-dynamic-eventsources-utils';
import { craftResourceKey } from '../pub-sub/pub-sub-utils';
import { EVENT_SOURCES_APP } from './const';
import { eventSourceValidationSchema } from './eventSource-validation-utils';
import EventSourceForm from './EventSourceForm';
import {
  EventSourceSyncFormData,
  SinkType,
  KnEventCatalogMetaData,
  EventSourceFormData,
} from './import-types';
import KnEventMetaDescription from './KnEventMetaDescription';

interface EventSourceProps {
  namespace: string;
  normalizedSource: KnEventCatalogMetaData;
  contextSource?: string;
  selectedApplication?: string;
  sourceKind?: string;
  kameletSource?: K8sResourceKind;
}

interface StateProps {
  activeApplication: string;
}

type Props = EventSourceProps & StateProps;

export const EventSource: React.FC<Props> = ({
  namespace,
  normalizedSource,
  activeApplication,
  contextSource,
  sourceKind = '',
  kameletSource,
}) => {
  const perpectiveExtension = useExtensions<Perspective>(isPerspective);
  const [perspective] = useActivePerspective();
  const { t } = useTranslation();
  let sourceData = {};
  let selApiVersion = '';
  let selSourceName = '';
  let kameletSourceName = '';
  if (sourceKind) {
    const selDataModel = _.find(getEventSourceModels(), { kind: sourceKind });
    selApiVersion = selDataModel
      ? `${selDataModel?.apiGroup}/${selDataModel?.apiVersion}`
      : kameletSource
      ? `${CamelKameletBindingModel.apiGroup}/${CamelKameletBindingModel.apiVersion}`
      : `${KNATIVE_EVENT_SOURCE_APIGROUP}/v1alpha2`;
    sourceData = isKnownEventSource(sourceKind)
      ? kameletSource
        ? { [sourceKind]: getKameletSourceData(kameletSource) }
        : { [sourceKind]: getEventSourceData(sourceKind) }
      : {};
    kameletSourceName = kameletSource && kameletSource.metadata.name;
    selSourceName = kameletSourceName ? `kamelet-${kameletSourceName}` : _.kebabCase(sourceKind);
  }
  const [sinkGroupVersionKind = '', sinkName = ''] = contextSource?.split('/') ?? [];
  const [sinkGroup = '', sinkVersion = '', sinkKind = ''] =
    getGroupVersionKind(sinkGroupVersionKind) ?? [];
  const sinkApiVersion = sinkGroup ? `${sinkGroup}/${sinkVersion}` : '';

  const eventSourceMetaDescription = <KnEventMetaDescription normalizedData={normalizedSource} />;

  const initialFormData: EventSourceFormData = {
    project: {
      name: namespace || '',
      displayName: '',
      description: '',
    },
    application: {
      initial: sanitizeApplicationValue(activeApplication),
      name: sanitizeApplicationValue(activeApplication) || EVENT_SOURCES_APP,
      selectedKey: activeApplication,
    },
    name: selSourceName,
    apiVersion: selApiVersion,
    sinkType: SinkType.Resource,
    sink: {
      apiVersion: sinkApiVersion,
      kind: sinkKind,
      name: sinkName,
      key: craftResourceKey(sinkName, { kind: sinkKind, apiVersion: sinkGroupVersionKind }),
      uri: '',
    },
    type: sourceKind,
    data: sourceData,
  };

  const initialYamlData: string = safeJSToYAML(
    getEventSourceResource(initialFormData),
    'yamlData',
    {
      skipInvalid: true,
      noRefs: true,
    },
  );

  const catalogInitialValues: EventSourceSyncFormData = {
    editorType: EditorType.Form,
    showCanUseYAMLMessage: true,
    formData: initialFormData,
    yamlData: initialYamlData,
  };

  const createResources = (rawFormData: any): Promise<K8sResourceKind> => {
    const knEventSourceResource = getCatalogEventSourceResource(rawFormData);
    if (knEventSourceResource?.kind && modelFor(referenceFor(knEventSourceResource))) {
      return k8sCreate(modelFor(referenceFor(knEventSourceResource)), knEventSourceResource);
    }
    const errMessage =
      knEventSourceResource?.kind && knEventSourceResource?.apiVersion
        ? t('knative-plugin~No model registered for {{referenceForKnEventSource}}', {
            referenceForKnEventSource: referenceFor(knEventSourceResource),
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
    const eventSrcRequest: Promise<K8sResourceKind> = createResources(values);

    return eventSrcRequest
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
      validationSchema={eventSourceValidationSchema(t)}
    >
      {(formikProps) => (
        <EventSourceForm
          {...formikProps}
          namespace={namespace}
          eventSourceMetaDescription={eventSourceMetaDescription}
          kameletSource={kameletSource}
        />
      )}
    </Formik>
  );
};

const mapStateToProps = (state: RootState, ownProps: EventSourceProps): StateProps => {
  const activeApplication = ownProps.selectedApplication || getActiveApplication(state);
  return {
    activeApplication: activeApplication !== ALL_APPLICATIONS_KEY ? activeApplication : '',
  };
};

export default connect(mapStateToProps)(EventSource);
