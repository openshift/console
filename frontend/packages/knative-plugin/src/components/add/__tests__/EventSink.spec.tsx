import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { Formik } from 'formik';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useSelector } from 'react-redux';
import { mockKameletSink, mockNormalizedSink } from '../__mocks__/Kamelet-data';
import EventSink from '../EventSink';

const useSelectorMock = useSelector as jest.Mock;

jest.mock('react-redux', () => {
  const originalModule = require.requireActual('react-redux');
  return {
    ...originalModule,
    useSelector: jest.fn(),
  };
});

type EventSourceProps = React.ComponentProps<typeof EventSink>;

describe('EventSinkSpec', () => {
  let wrapper: ShallowWrapper<EventSourceProps>;
  const namespace = 'myApp';

  it('should render form with proper initialvalues', () => {
    useSelectorMock.mockReturnValue('appGroup');
    wrapper = shallow(
      <EventSink
        namespace={namespace}
        normalizedSink={mockNormalizedSink}
        kameletSink={mockKameletSink}
      />,
    );
    const FormikField = wrapper.find(Formik);
    expect(FormikField.exists()).toBe(true);
    expect(FormikField.get(0).props.initialValues.formData.project.name).toBe('myApp');
    expect(FormikField.get(0).props.initialValues.formData.application.name).toBe('appGroup');
    expect(FormikField.get(0).props.initialValues.formData.apiVersion).toBe(
      'camel.apache.org/v1alpha1',
    );
    expect(FormikField.get(0).props.initialValues.formData.source.apiVersion).toEqual('');
    expect(FormikField.get(0).props.initialValues.formData.source.kind).toEqual('');
    expect(FormikField.get(0).props.initialValues.formData.source.name).toEqual('');
  });
});
