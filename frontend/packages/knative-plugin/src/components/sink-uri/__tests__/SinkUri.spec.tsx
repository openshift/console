import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { Formik } from 'formik';
import SinkUri from '../SinkUri';
import { sampleEventSourceSinkbinding } from '../../../topology/__tests__/topology-knative-test-data';

type SinkUriProps = React.ComponentProps<typeof SinkUri>;

describe('SinkUri', () => {
  const sinkUriObj = {
    metadata: { uid: 'http%3A%2F%2Fsvc.cluster.com', namespace: 'jai-test' },
    spec: { sinkUri: 'http://svc.cluster.com' },
    type: { nodeType: 'sink-uri' },
  };
  const formProps: SinkUriProps = {
    source: sinkUriObj,
    eventSourceList: sampleEventSourceSinkbinding.data,
  };
  const edituriForm: ShallowWrapper<SinkUriProps> = shallow(<SinkUri {...formProps} />);

  it('should render Formik with proper initial values', () => {
    const formikForm = edituriForm.find(Formik);
    expect(formikForm).toHaveLength(1);
    expect(formikForm.get(0).props.initialValues.uri).toBe('http://svc.cluster.com');
  });
});
