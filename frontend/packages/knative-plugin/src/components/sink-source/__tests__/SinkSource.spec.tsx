import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { Formik } from 'formik';
import SinkSource from '../SinkSource';
import { sampleEventSourceSinkbinding } from '../../../topology/__tests__/topology-knative-test-data';

type SinkSourceProps = React.ComponentProps<typeof SinkSource>;

describe('SinkSource', () => {
  const formProps: SinkSourceProps = {
    source: sampleEventSourceSinkbinding.data[0],
  };
  const eventSourceForm: ShallowWrapper<SinkSourceProps> = shallow(<SinkSource {...formProps} />);
  it('should render Formik with proper initial values', () => {
    const formikForm = eventSourceForm.find(Formik);
    expect(formikForm).toHaveLength(1);
    expect(formikForm.get(0).props.initialValues.sink.name).toBe('wss-event-display');
  });

  it('should render Formik child with proper props', () => {
    const formikFormRender = eventSourceForm.find(Formik).get(0).props;
    expect(formikFormRender.children).toHaveLength(1);
    expect(formikFormRender.children().props.resourceName).toBe('bind-wss');
  });
});
