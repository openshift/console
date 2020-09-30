import * as React from 'react';
import { Formik } from 'formik';
import { connect } from 'react-redux';
import { history } from '@console/internal/components/utils';
import { getActiveApplication } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';
import { ALL_APPLICATIONS_KEY } from '@console/shared';
import {
  K8sResourceKind,
  modelFor,
  referenceFor,
  k8sCreate,
  getGroupVersionKind,
} from '@console/internal/module/k8s';
import { sanitizeApplicationValue } from '@console/dev-console/src/utils/application-utils';
import { eventSourceValidationSchema } from './eventSource-validation-utils';
import EventSourceForm from './EventSourceForm';
import { getEventSourceResource } from '../../utils/create-eventsources-utils';
import { EventSourceFormData, EventSourceListData, SinkType } from './import-types';

interface EventSourceProps {
  namespace: string;
  eventSourceStatus: EventSourceListData | null;
  contextSource?: string;
  selectedApplication?: string;
}

interface StateProps {
  activeApplication: string;
}

type Props = EventSourceProps & StateProps;

export const EventSource: React.FC<Props> = ({
  namespace,
  eventSourceStatus,
  activeApplication,
  contextSource,
}) => {
  const [sinkGroupVersionKind = '', sinkName = ''] = contextSource?.split('/') ?? [];
  const [sinkGroup = '', sinkVersion = '', sinkKind = ''] =
    getGroupVersionKind(sinkGroupVersionKind) ?? [];
  const sinkKey = sinkName && sinkKind ? `${sinkKind}-${sinkName}` : '';
  const sinkApiVersion = sinkGroup ? `${sinkGroup}/${sinkVersion}` : '';
  const initialValues: EventSourceFormData = {
    project: {
      name: namespace || '',
      displayName: '',
      description: '',
    },
    application: {
      initial: sanitizeApplicationValue(activeApplication),
      name: sanitizeApplicationValue(activeApplication),
      selectedKey: activeApplication,
    },
    name: '',
    apiVersion: '',
    sinkType: SinkType.Resource,
    sink: {
      apiVersion: sinkApiVersion,
      kind: sinkKind,
      name: sinkName,
      key: sinkKey,
      uri: '',
    },
    limits: {
      cpu: {
        request: '',
        requestUnit: 'm',
        defaultRequestUnit: 'm',
        limit: '',
        limitUnit: 'm',
        defaultLimitUnit: 'm',
      },
      memory: {
        request: '',
        requestUnit: 'Mi',
        defaultRequestUnit: 'Mi',
        limit: '',
        limitUnit: 'Mi',
        defaultLimitUnit: 'Mi',
      },
    },
    type: '',
    data: {},
    yamlData: '',
  };

  const createResources = (rawFormData: any): Promise<K8sResourceKind> => {
    const knEventSourceResource = getEventSourceResource(rawFormData);
    if (knEventSourceResource?.kind && modelFor(referenceFor(knEventSourceResource))) {
      return k8sCreate(modelFor(referenceFor(knEventSourceResource)), knEventSourceResource);
    }
    const errMessage =
      knEventSourceResource?.kind && knEventSourceResource?.apiVersion
        ? `No model registered for ${referenceFor(knEventSourceResource)}`
        : 'Invalid YAML';
    return Promise.reject(new Error(errMessage));
  };

  const handleSubmit = (values, actions) => {
    const {
      project: { name: projectName },
    } = values;
    const eventSrcRequest: Promise<K8sResourceKind> = createResources(values);
    eventSrcRequest
      .then(() => {
        actions.setSubmitting(false);
        history.push(`/topology/ns/${projectName}`);
      })
      .catch((err) => {
        actions.setSubmitting(false);
        actions.setStatus({ submitError: err.message });
      });
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onReset={history.goBack}
      validateOnBlur={false}
      validateOnChange={false}
      validationSchema={eventSourceValidationSchema}
    >
      {(formikProps) => (
        <EventSourceForm
          {...formikProps}
          namespace={namespace}
          eventSourceStatus={eventSourceStatus}
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
