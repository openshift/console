import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps, FormikValues } from 'formik';
import { FormFooter } from '@console/shared';
import { Form } from '@patternfly/react-core';
import AppSection from '@console/dev-console/src/components/import/app/AppSection';
import { FirehoseList } from '@console/dev-console/src/components/import/import-types';
import CronJobSection from './event-sources/CronJobSection';
import SinkSection from './event-sources/SinkSection';
import { EventSources } from './import-types';
import EventSourcesSelector from './event-sources/EventSourcesSelector';
import { useEventSourceList } from '../../utils/create-eventsources-utils';

interface OwnProps {
  services: FirehoseList;
  projects: FirehoseList;
}

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
}) => (
  <Form className="co-deploy-image" onSubmit={handleSubmit}>
    <EventSourcesSelector eventSourceList={useEventSourceList()} />
    {values.type === EventSources.CronJobSource && <CronJobSection />}
    <SinkSection services={services?.data} />
    <AppSection
      project={values.project}
      noProjectsAvailable={projects?.loaded && _.isEmpty(projects.data)}
    />
    <FormFooter
      handleReset={handleReset}
      errorMessage={status && status.submitError}
      isSubmitting={isSubmitting}
      submitLabel="Create"
      disableSubmit={!dirty || !_.isEmpty(errors)}
      resetLabel="Cancel"
    />
  </Form>
);

export default EventSourceForm;
