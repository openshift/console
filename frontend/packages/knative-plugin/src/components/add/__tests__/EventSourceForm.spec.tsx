import * as React from 'react';
import { shallow } from 'enzyme';
import { referenceForModel } from '@console/internal/module/k8s';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import { LoadingInline } from '@console/internal/components/utils';
import EventSourceForm from '../EventSourceForm';
import EventSourcesSelector from '../event-sources/EventSourcesSelector';
import { getDefaultEventingData } from '../../../utils/__tests__/knative-serving-data';
import { EventSources } from '../import-types';
import EventSourceSection from '../event-sources/EventSourceSection';
import { getKnativeEventSourceIcon } from '../../../utils/get-knative-icon';
import { EventSourceContainerModel } from '../../../models';

type EventSourceFormProps = React.ComponentProps<typeof EventSourceForm>;
let formProps: EventSourceFormProps;

describe('EventSource Form', () => {
  const defaultEventingData = getDefaultEventingData(EventSources.CronJobSource);
  const eventSourceStatusData = {
    loaded: true,
    eventSourceList: {
      [EventSourceContainerModel.kind]: {
        name: EventSourceContainerModel.kind,
        title: EventSourceContainerModel.kind,
        iconUrl: getKnativeEventSourceIcon(referenceForModel(EventSourceContainerModel)),
        displayName: EventSourceContainerModel.kind,
      },
    },
  };
  beforeEach(() => {
    formProps = {
      ...formikFormProps,
      values: {
        type: 'CronJobSource',
      },
      namespace: 'myapp',
      initialValues: defaultEventingData,
      eventSourceStatus: {
        loaded: false,
        eventSourceList: {},
      },
    };
  });

  it('should not render EventSourcesSelector if sources are loaded with no data', () => {
    const eventSourceForm = shallow(<EventSourceForm {...formProps} />);
    expect(eventSourceForm.find(EventSourcesSelector).exists()).toBe(false);
  });

  it('should not render EventSourceSection if sources are loaded with no data', () => {
    const eventSourceForm = shallow(<EventSourceForm {...formProps} />);
    expect(eventSourceForm.find(EventSourceSection).exists()).toBe(false);
  });

  it('should render loading if sources are not loaded', () => {
    const eventSourceForm = shallow(<EventSourceForm {...formProps} />);
    expect(eventSourceForm.find(LoadingInline).exists()).toBe(true);
  });

  it('should render EventSourcesSelector if sources are loaded', () => {
    const eventSourceForm = shallow(
      <EventSourceForm {...formProps} eventSourceStatus={eventSourceStatusData} />,
    );
    expect(eventSourceForm.find(EventSourcesSelector).exists()).toBe(true);
  });

  it('should render EventSourceSection if sources are loaded', () => {
    const eventSourceForm = shallow(
      <EventSourceForm {...formProps} eventSourceStatus={eventSourceStatusData} />,
    );
    expect(eventSourceForm.find(EventSourceSection).exists()).toBe(true);
  });
});
