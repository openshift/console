import * as React from 'react';
import { Formik } from 'formik';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import * as _ from 'lodash';
import { history } from '@console/internal/components/utils';
import { getActiveApplication, getActivePerspective } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';
import { ALL_APPLICATIONS_KEY } from '@console/shared';
import {
  K8sResourceKind,
  modelFor,
  referenceFor,
  k8sCreate,
  getGroupVersionKind,
} from '@console/internal/module/k8s';
import { sanitizeApplicationValue } from '@console/topology/src/utils/application-utils';
import { isPerspective, Perspective, useExtensions } from '@console/plugin-sdk';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { eventSourceValidationSchema } from './eventSource-validation-utils';
import EventSourceForm from './EventSourceForm';
import CatalogEventSourceForm from './CatalogEventSourceForm';
import {
  getEventSourceResource,
  getCatalogEventSourceResource,
  isKnownEventSource,
  getEventSourceData,
  handleRedirect,
} from '../../utils/create-eventsources-utils';
import { getEventSourceModels } from '../../utils/fetch-dynamic-eventsources-utils';
import { KNATIVE_EVENT_SOURCE_APIGROUP } from '../../const';
import {
  EventSourceSyncFormData,
  EventSourceListData,
  SinkType,
  EVENT_SOURCES_APP,
} from './import-types';
import EventSourceMetaDescription from './EventSourceMetadataDescription';

interface EventSourceProps {
  namespace: string;
  eventSourceStatus: EventSourceListData;
  showCatalog: boolean;
  contextSource?: string;
  selectedApplication?: string;
  sourceKind?: string;
}

interface StateProps {
  activeApplication: string;
  perspective: string;
}

type Props = EventSourceProps & StateProps;

export const EventSource: React.FC<Props> = ({
  namespace,
  eventSourceStatus,
  showCatalog,
  activeApplication,
  contextSource,
  perspective,
  sourceKind = '',
}) => {
  const perpectiveExtension = useExtensions<Perspective>(isPerspective);
  const { t } = useTranslation();
  let sourceData = {};
  let selApiVersion = '';
  let selSourceName = '';
  if (sourceKind && showCatalog) {
    const selDataModel = _.find(getEventSourceModels(), { kind: sourceKind });
    selApiVersion = selDataModel
      ? `${selDataModel?.apiGroup}/${selDataModel?.apiVersion}`
      : `${KNATIVE_EVENT_SOURCE_APIGROUP}/v1alpha2`;
    sourceData = isKnownEventSource(sourceKind)
      ? { [sourceKind]: getEventSourceData(sourceKind) }
      : {};
    selSourceName = _.kebabCase(sourceKind);
  }
  const [sinkGroupVersionKind = '', sinkName = ''] = contextSource?.split('/') ?? [];
  const [sinkGroup = '', sinkVersion = '', sinkKind = ''] =
    getGroupVersionKind(sinkGroupVersionKind) ?? [];
  const sinkKey = sinkName && sinkKind ? `${sinkKind}-${sinkName}` : '';
  const sinkApiVersion = sinkGroup ? `${sinkGroup}/${sinkVersion}` : '';

  const eventSourceMetaDescription = (
    <EventSourceMetaDescription eventSourceStatus={eventSourceStatus} sourceKind={sourceKind} />
  );

  const catalogInitialValues: EventSourceSyncFormData = {
    editorType: EditorType.Form,
    showCanUseYAMLMessage: true,
    formData: {
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
        key: sinkKey,
        uri: '',
      },
      type: sourceKind,
      data: sourceData,
    },
    yamlData: '',
  };

  const createResources = (rawFormData: any): Promise<K8sResourceKind> => {
    const knEventSourceResource = showCatalog
      ? getCatalogEventSourceResource(rawFormData)
      : getEventSourceResource(rawFormData);
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
    eventSrcRequest
      .then(() => {
        actions.setSubmitting(false);
        handleRedirect(projectName, perspective, perpectiveExtension);
      })
      .catch((err) => {
        actions.setSubmitting(false);
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
      {(formikProps) =>
        showCatalog ? (
          <CatalogEventSourceForm
            {...formikProps}
            namespace={namespace}
            eventSourceStatus={eventSourceStatus}
            eventSourceMetaDescription={eventSourceMetaDescription}
          />
        ) : (
          <EventSourceForm
            {...formikProps}
            namespace={namespace}
            eventSourceStatus={eventSourceStatus}
          />
        )
      }
    </Formik>
  );
};

const mapStateToProps = (state: RootState, ownProps: EventSourceProps): StateProps => {
  const perspective = getActivePerspective(state);
  const activeApplication = ownProps.selectedApplication || getActiveApplication(state);
  return {
    activeApplication: activeApplication !== ALL_APPLICATIONS_KEY ? activeApplication : '',
    perspective,
  };
};

export default connect(mapStateToProps)(EventSource);
