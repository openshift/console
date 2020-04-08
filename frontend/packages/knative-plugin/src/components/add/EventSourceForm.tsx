import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps, FormikValues } from 'formik';
import { FormFooter, FlexForm } from '@console/shared';
import { FirehoseList } from '@console/dev-console/src/components/import/import-types';
import EventSourcesSelector from './event-sources/EventSourcesSelector';
import { useEventSourceList } from '../../utils/create-eventsources-utils';
import EventSourceSection from './event-sources/EventSourceSection';

interface OwnProps {
  namespace: string;
  projects: FirehoseList;
}

const EventSourceForm: React.FC<FormikProps<FormikValues> & OwnProps> = ({
  errors,
  handleSubmit,
  handleReset,
  status,
  isSubmitting,
  dirty,
  namespace,
  projects,
}) => (
  <FlexForm onSubmit={handleSubmit}>
    <EventSourcesSelector eventSourceList={useEventSourceList(namespace)} />
    <EventSourceSection projects={projects} namespace={namespace} />
    <FormFooter
      handleReset={handleReset}
      errorMessage={status && status.submitError}
      isSubmitting={isSubmitting}
      submitLabel="Create"
      disableSubmit={!dirty || !_.isEmpty(errors)}
      resetLabel="Cancel"
      sticky
    />
  </FlexForm>
);

export default EventSourceForm;
