import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { Formik } from 'formik';
import SinkPubsub from '../SinkPubsub';
import {
  EventTriggerObj,
  EventSubscriptionObj,
} from '../../../topology/__tests__/topology-knative-test-data';

type SinkPubsubProps = React.ComponentProps<typeof SinkPubsub>;

describe('SinkPubsub', () => {
  let pubsubForm: ShallowWrapper<SinkPubsubProps>;
  const formProps: SinkPubsubProps = {
    source: EventSubscriptionObj,
  };
  pubsubForm = shallow(<SinkPubsub {...formProps} />);
  it('should render Formik with proper initial values', () => {
    const formikForm = pubsubForm.find(Formik);
    expect(formikForm).toHaveLength(1);
    expect(formikForm.get(0).props.initialValues.ref.name).toBe('overlayimage');
  });

  it('should render Formik child with proper props', () => {
    const formikFormRender = pubsubForm.find(Formik).get(0).props;
    expect(formikFormRender.children).toHaveLength(1);
    expect(formikFormRender.children().props.resourceName).toBe('sub1');
  });

  it('should render Formik child with label move Subscription for Subscription', () => {
    const formikFormRender = pubsubForm.find(Formik).get(0).props;
    expect(formikFormRender.children).toHaveLength(1);
    expect(formikFormRender.children().props.labelTitle).toBe('Move Subscription');
  });

  it('should render Formik child with label move Trigger for Trigger', () => {
    const formPropsData = { source: EventTriggerObj };
    pubsubForm = shallow(<SinkPubsub {...formPropsData} />);
    const formikFormRender = pubsubForm.find(Formik).get(0).props;
    expect(formikFormRender.children).toHaveLength(1);
    expect(formikFormRender.children().props.labelTitle).toBe('Move Trigger');
  });
});
