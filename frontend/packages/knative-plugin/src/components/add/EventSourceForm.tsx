import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps, FormikValues } from 'formik';
import { FormFooter, FlexForm } from '@console/shared';
import EventSourcesSelector from './event-sources/EventSourcesSelector';
import { useEventSourceList } from '../../utils/create-eventsources-utils';
import EventSourceSection from './event-sources/EventSourceSection';

interface OwnProps {
  namespace: string;
}

const EventSourceForm: React.FC<FormikProps<FormikValues> & OwnProps> = ({
  errors,
  handleSubmit,
  handleReset,
  status,
  isSubmitting,
  dirty,
  namespace,
}) => (
  <FlexForm onSubmit={handleSubmit}>
    <EventSourcesSelector eventSourceList={useEventSourceList(namespace)} />
    <EventSourceSection namespace={namespace} />
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
