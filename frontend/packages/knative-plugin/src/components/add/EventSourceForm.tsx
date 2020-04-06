import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps, FormikValues } from 'formik';
import { FormFooter } from '@console/shared';
import { Form } from '@patternfly/react-core';
import AppSection from '@console/dev-console/src/components/import/app/AppSection';
import { FirehoseList } from '@console/dev-console/src/components/import/import-types';
import CronJobSection from './event-sources/CronJobSection';
import SinkBindingSection from './event-sources/SinkBindingSection';
import ApiServerSection from './event-sources/ApiServerSection';
import SinkSection from './event-sources/SinkSection';
import { EventSources } from './import-types';
import EventSourcesSelector from './event-sources/EventSourcesSelector';
import { useEventSourceList } from '../../utils/create-eventsources-utils';
import KafkaSourceSection from './event-sources/KafkaSourceSection';
import AdvancedSection from './AdvancedSection';

interface OwnProps {
  namespace: string;
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
  namespace,
  projects,
}) => (
  <Form className="co-deploy-image" onSubmit={handleSubmit}>
    <EventSourcesSelector eventSourceList={useEventSourceList(namespace)} />
    {values.type === EventSources.CronJobSource && <CronJobSection />}
    {values.type === EventSources.SinkBinding && <SinkBindingSection />}
    {values.type === EventSources.ApiServerSource && <ApiServerSection />}
    {values.type === EventSources.KafkaSource && <KafkaSourceSection />}
    <SinkSection namespace={namespace} />
    <AppSection
      project={values.project}
      noProjectsAvailable={projects?.loaded && _.isEmpty(projects.data)}
    />
    {values.type === EventSources.KafkaSource && <AdvancedSection />}
    <FormFooter
      handleReset={handleReset}
      errorMessage={status && status.submitError}
      isSubmitting={isSubmitting}
      submitLabel="Create"
      sticky
      disableSubmit={!dirty || !_.isEmpty(errors)}
      resetLabel="Cancel"
    />
  </Form>
);

export default EventSourceForm;
