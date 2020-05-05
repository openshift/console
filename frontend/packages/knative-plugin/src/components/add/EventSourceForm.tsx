import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps, FormikValues } from 'formik';
import { FormFooter, FlexForm } from '@console/shared';
import { LoadingInline } from '@console/internal/components/utils';
import EventSourcesSelector from './event-sources/EventSourcesSelector';
import EventSourceSection from './event-sources/EventSourceSection';
import { EventSourceListData } from './import-types';

interface OwnProps {
  namespace: string;
  eventSourceStatus: EventSourceListData | null;
}

const EventSourceForm: React.FC<FormikProps<FormikValues> & OwnProps> = ({
  errors,
  handleSubmit,
  handleReset,
  status,
  isSubmitting,
  dirty,
  namespace,
  eventSourceStatus,
}) => (
  <FlexForm onSubmit={handleSubmit}>
    {eventSourceStatus && !_.isEmpty(eventSourceStatus.eventSourceList) && (
      <>
        <EventSourcesSelector eventSourceList={eventSourceStatus.eventSourceList} />
        <EventSourceSection namespace={namespace} />{' '}
      </>
    )}
    {eventSourceStatus && !eventSourceStatus.loaded && <LoadingInline />}
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
