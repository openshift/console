import * as React from 'react';
import { shallow } from 'enzyme';
import { FormFooter, SyncedEditorField, FlexForm } from '@console/shared';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import { CamelKameletBindingModel } from '../../../models';
import { mockKameletSink } from '../__mocks__/Kamelet-data';
import EventSinkForm from '../EventSinkForm';

let eventSinkFormProps: React.ComponentProps<typeof EventSinkForm>;

describe('EventSinkForm', () => {
  beforeEach(() => {
    eventSinkFormProps = {
      ...formikFormProps,
      values: {
        formData: {
          type: CamelKameletBindingModel.kind,
        },
      },
      namespace: 'myapp',
      eventSinkMetaDescription: 'null',
      kameletSink: mockKameletSink,
    };
  });

  it('should render FlexForm, SyncedEditorField and FormFooter', () => {
    const wrapper = shallow(<EventSinkForm {...eventSinkFormProps} />);
    expect(wrapper.find(FlexForm).exists()).toBe(true);
    expect(wrapper.find(SyncedEditorField).exists()).toBe(true);
    expect(wrapper.find(FormFooter).exists()).toBe(true);
  });
});
