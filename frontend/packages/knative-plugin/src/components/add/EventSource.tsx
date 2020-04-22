import * as React from 'react';
import { Formik } from 'formik';
import { connect } from 'react-redux';
import { history } from '@console/internal/components/utils';
import { getActiveApplication } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';
import { ALL_APPLICATIONS_KEY } from '@console/shared';
import { K8sResourceKind, modelFor, referenceFor, k8sCreate } from '@console/internal/module/k8s';
import { FirehoseList } from '@console/dev-console/src/components/import/import-types';
import { sanitizeApplicationValue } from '@console/dev-console/src/utils/application-utils';
import { eventSourceValidationSchema } from './eventSource-validation-utils';
import EventSourceForm from './EventSourceForm';
import { getEventSourceResource } from '../../utils/create-eventsources-utils';
import { EventSourceFormData } from './import-types';
import ShowResourceAlert from './ShowResourceAlert';
import { knativeServingResourcesServices } from '../../utils/get-knative-resources';

interface EventSourceProps {
  namespace: string;
  projects?: FirehoseList;
  contextSource?: string;
  selectedApplication?: string;
}

interface StateProps {
  activeApplication: string;
}

type Props = EventSourceProps & StateProps;

const EventSource: React.FC<Props> = ({
  namespace,
  projects,
  activeApplication,
  contextSource,
}) => {
  const serviceName = contextSource?.split('/').pop() || '';
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
    sink: {
      knativeService: serviceName,
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
    return k8sCreate(modelFor(referenceFor(knEventSourceResource)), knEventSourceResource);
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

  const knServiceResource = { ...knativeServingResourcesServices(namespace)[0], limit: 1 };

  return (
    <>
      <ShowResourceAlert
        title="Event Source can not be created"
        message="An event source must sink to Knative Service, but no Knative Service exist in this project"
        resource={knServiceResource}
      />
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onReset={history.goBack}
        validationSchema={eventSourceValidationSchema}
      >
        {(props) => <EventSourceForm {...props} namespace={namespace} projects={projects} />}
      </Formik>
    </>
  );
};

const mapStateToProps = (state: RootState, ownProps: EventSourceProps): StateProps => {
  const activeApplication = ownProps.selectedApplication || getActiveApplication(state);
  return {
    activeApplication: activeApplication !== ALL_APPLICATIONS_KEY ? activeApplication : '',
  };
};

export default connect(mapStateToProps)(EventSource);
