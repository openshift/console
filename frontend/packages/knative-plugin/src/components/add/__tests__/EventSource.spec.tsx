import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { Formik } from 'formik';
import { EventSource } from '../EventSource';

type EventSourceProps = React.ComponentProps<typeof EventSource>;
describe('EventSourceSpec', () => {
  let wrapper: ShallowWrapper<EventSourceProps>;
  const namespaceName = 'myApp';
  const activeApplicationName = 'appGroup';
  const eventSourceStatusData = null;

  it('should render form with proper initialvalues if contextSource is not passed', () => {
    wrapper = shallow(
      <EventSource
        namespace={namespaceName}
        eventSourceStatus={eventSourceStatusData}
        activeApplication={activeApplicationName}
      />,
    );
    const FormikField = wrapper.find(Formik);
    expect(FormikField.exists()).toBe(true);
    expect(FormikField.get(0).props.initialValues.project.name).toBe('myApp');
    expect(FormikField.get(0).props.initialValues.sink).toEqual({
      apiVersion: '',
      kind: '',
      name: '',
    });
  });

  it('should render form with proper initialvalues for sink if contextSource is passed', () => {
    const contextSourceData = 'serving.knative.dev~v1~Service/svc-display';
    wrapper = shallow(
      <EventSource
        namespace={namespaceName}
        eventSourceStatus={eventSourceStatusData}
        contextSource={contextSourceData}
        activeApplication={activeApplicationName}
      />,
    );
    const FormikField = wrapper.find(Formik);
    expect(FormikField.exists()).toBe(true);
    expect(FormikField.get(0).props.initialValues.project.name).toBe('myApp');
    expect(FormikField.get(0).props.initialValues.sink).toEqual({
      apiVersion: 'serving.knative.dev/v1',
      kind: 'Service',
      name: 'svc-display',
    });
  });
});
