import * as React from 'react';
import { shallow } from 'enzyme';
import { FormFooter, SyncedEditorField, FlexForm } from '@console/shared';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import { kameletSourceTelegram } from '../../../utils/__tests__/knative-eventing-data';
import EventSourceForm from '../EventSourceForm';

let eventSourceFormProps: React.ComponentProps<typeof EventSourceForm>;

describe('EventSourceForm', () => {
  beforeEach(() => {
    eventSourceFormProps = {
      ...formikFormProps,
      values: {
        formData: {
          type: 'ApiServerSource',
        },
      },
      namespace: 'myapp',
      eventSourceMetaDescription: 'null',
    };
  });

  it('should render FlexForm, SyncedEditorField and FormFooter if Source is valid', () => {
    const wrapper = shallow(<EventSourceForm {...eventSourceFormProps} />);
    expect(wrapper.find(FlexForm).exists()).toBe(true);
    expect(wrapper.find(SyncedEditorField).exists()).toBe(true);
    expect(wrapper.find(FormFooter).exists()).toBe(true);
  });

  it('should render FlexForm, SyncedEditorField and FormFooter if is a Kamelet', () => {
    const wrapper = shallow(
      <EventSourceForm {...eventSourceFormProps} kameletSource={kameletSourceTelegram} />,
    );
    expect(wrapper.find(FlexForm).exists()).toBe(true);
    expect(wrapper.find(SyncedEditorField).exists()).toBe(true);
    expect(wrapper.find(FormFooter).exists()).toBe(true);
  });
});
