import * as React from 'react';
import { shallow } from 'enzyme';
import { FormFooter, SyncedEditorField, FlexForm } from '@console/shared';
import { referenceForModel } from '@console/internal/module/k8s';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import { getEventSourceIcon } from '../../../utils/get-knative-icon';
import { EventSourceContainerModel } from '../../../models';
import EventSourceForm from '../EventSourceForm';
import * as fetchDynamicEventsource from '../../../utils/fetch-dynamic-eventsources-utils';
import { kameletSourceTelegram } from '../../../utils/__tests__/knative-eventing-data';

let eventSourceFormProps: React.ComponentProps<typeof EventSourceForm>;

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

const eventSourceStatusData = {
  loaded: true,
  eventSourceList: {
    [EventSourceContainerModel.kind]: {
      name: EventSourceContainerModel.kind,
      title: EventSourceContainerModel.kind,
      iconUrl: getEventSourceIcon(referenceForModel(EventSourceContainerModel)),
      displayName: EventSourceContainerModel.kind,
    },
  },
};

describe('EventSourceForm', () => {
  beforeEach(() => {
    eventSourceFormProps = {
      ...formikFormProps,
      values: {
        formData: {
          type: 'ApiServerSource',
        },
      },
      eventSourceStatus: eventSourceStatusData,
      namespace: 'myapp',
      eventSourceMetaDescription: 'null',
    };
  });

  it('should render FlexForm, SyncedEditorField and FormFooter if Source is valid', () => {
    jest
      .spyOn(fetchDynamicEventsource, 'isDynamicEventSourceKind')
      .mockImplementationOnce(() => true);
    const wrapper = shallow(<EventSourceForm {...eventSourceFormProps} />);
    expect(wrapper.find(FlexForm).exists()).toBe(true);
    expect(wrapper.find(SyncedEditorField).exists()).toBe(true);
    expect(wrapper.find(FormFooter).exists()).toBe(true);
  });

  it('should not render  SyncedEditorField if Source is not valid', () => {
    jest
      .spyOn(fetchDynamicEventsource, 'isDynamicEventSourceKind')
      .mockImplementationOnce(() => false);
    const wrapper = shallow(<EventSourceForm {...eventSourceFormProps} />);
    expect(wrapper.find(FlexForm).exists()).toBe(true);
    expect(wrapper.find(SyncedEditorField).exists()).toBe(false);
    expect(wrapper.find(FormFooter).exists()).toBe(true);
  });

  it('should render FlexForm, SyncedEditorField and FormFooter if is a Kamelet', () => {
    jest
      .spyOn(fetchDynamicEventsource, 'isDynamicEventSourceKind')
      .mockImplementationOnce(() => false);
    const wrapper = shallow(
      <EventSourceForm {...eventSourceFormProps} kameletSource={kameletSourceTelegram} />,
    );
    expect(wrapper.find(FlexForm).exists()).toBe(true);
    expect(wrapper.find(SyncedEditorField).exists()).toBe(true);
    expect(wrapper.find(FormFooter).exists()).toBe(true);
  });
});
