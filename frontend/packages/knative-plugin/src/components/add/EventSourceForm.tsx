import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps, FormikValues } from 'formik';
import { Form, ActionGroup, ButtonVariant, Button } from '@patternfly/react-core';
import { ButtonBar, useAccessReview } from '@console/internal/components/utils';
import { getActiveNamespace } from '@console/internal/actions/ui';
import AppSection from '@console/dev-console/src/components/import/app/AppSection';
import { FirehoseList } from '@console/dev-console/src/components/import/import-types';
import CronJobSection from './event-sources/CronJobSection';
import SinkSection from './event-sources/SinkSection';
import { EventSources } from './import-types';
import {
  EventSourceCronJobModel,
  EventSourceSinkBindingModel,
  EventSourceApiServerModel,
  EventSourceCamelModel,
  EventSourceKafkaModel,
} from '../../models';
import EventSourcesSelector from './event-sources/EventSourcesSelector';
import * as apiServerSourceImg from '../../imgs/logos/apiserversource.png';
import * as camelSourceImg from '../../imgs/logos/camelsource.svg';
import * as containerSourceImg from '../../imgs/logos/containersource.png';
import * as cronJobSourceImg from '../../imgs/logos/cronjobsource.png';
import * as kafkaSourceImg from '../../imgs/logos/kafkasource.svg';

interface OwnProps {
  services: FirehoseList;
  projects: FirehoseList;
}

const useKnativeEventingAccess = (model): boolean => {
  const canCreateEventSource = useAccessReview({
    group: model.apiGroup,
    resource: model.plural,
    namespace: getActiveNamespace(),
    verb: 'create',
  });
  return canCreateEventSource;
};

const EventSourceForm: React.FC<FormikProps<FormikValues> & OwnProps> = ({
  values,
  errors,
  handleSubmit,
  handleReset,
  status,
  isSubmitting,
  dirty,
  projects,
  services,
}) => {
  const eventSourceList = [
    useKnativeEventingAccess(EventSourceCronJobModel) && {
      name: 'CronJobSource',
      iconUrl: cronJobSourceImg,
      displayName: 'CronJobSource',
      title: 'CronJobSource',
    },
    useKnativeEventingAccess(EventSourceSinkBindingModel) && {
      name: 'SinkBinding',
      iconUrl: containerSourceImg,
      displayName: 'SinkBinding',
      title: 'SinkBinding',
    },
    useKnativeEventingAccess(EventSourceApiServerModel) && {
      name: 'ApiServerSource',
      iconUrl: apiServerSourceImg,
      displayName: 'ApiServerSource',
      title: 'ApiServerSource',
    },
    useKnativeEventingAccess(EventSourceKafkaModel) && {
      name: 'KafkaSource',
      iconUrl: kafkaSourceImg,
      displayName: 'KafkaSource',
      title: 'KafkaSource',
    },
    useKnativeEventingAccess(EventSourceCamelModel) && {
      name: 'CamelSource',
      iconUrl: camelSourceImg,
      displayName: 'CamelSource',
      title: 'CamelSource',
    },
  ];

  return (
    <Form className="co-deploy-image" onSubmit={handleSubmit}>
      <EventSourcesSelector eventSourceList={_.filter(eventSourceList)} />
      {values.type === EventSources.CronJobSource && <CronJobSection />}
      <SinkSection services={services} />
      <AppSection
        project={values.project}
        noProjectsAvailable={projects?.loaded && _.isEmpty(projects.data)}
      />
      <ButtonBar errorMessage={status && status.submitError} inProgress={isSubmitting}>
        <ActionGroup className="pf-c-form">
          <Button
            type="submit"
            variant={ButtonVariant.primary}
            isDisabled={!dirty || !_.isEmpty(errors)}
            data-test-id="deploy-image-form-submit-btn"
          >
            Create
          </Button>
          <Button type="button" variant={ButtonVariant.secondary} onClick={handleReset}>
            Cancel
          </Button>
        </ActionGroup>
      </ButtonBar>
    </Form>
  );
};

export default EventSourceForm;
