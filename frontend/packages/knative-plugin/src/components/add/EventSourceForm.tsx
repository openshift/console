import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import { FormFooter, FlexForm } from '@console/shared';
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
}) => {
  const { t } = useTranslation();
  return (
    <FlexForm onSubmit={handleSubmit}>
      {eventSourceStatus && !_.isEmpty(eventSourceStatus.eventSourceList) && (
        <>
          <EventSourcesSelector eventSourceList={eventSourceStatus.eventSourceList} />
          <EventSourceSection namespace={namespace} />{' '}
        </>
      )}
      <FormFooter
        handleReset={handleReset}
        errorMessage={status && status.submitError}
        isSubmitting={isSubmitting}
        submitLabel={t('knative-plugin~Create')}
        disableSubmit={!dirty || !_.isEmpty(errors)}
        resetLabel={t('knative-plugin~Cancel')}
        sticky
      />
    </FlexForm>
  );
};

export default EventSourceForm;
