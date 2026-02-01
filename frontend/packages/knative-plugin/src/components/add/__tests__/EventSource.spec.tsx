import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { EVENT_SOURCE_CONTAINER_KIND } from '../../../const';
import { getEventSourceIcon } from '../../../utils/get-knative-icon';
import { EventSource } from '../EventSource';

jest.mock('formik', () => ({
  ...jest.requireActual('formik'),
  Formik: 'Formik',
}));

describe('EventSourceSpec', () => {
  const namespaceName = 'myApp';
  const activeApplicationName = 'appGroup';
  const eventSourceStatusData = {
    loaded: true,
    eventSource: {
      uid: EVENT_SOURCE_CONTAINER_KIND,
      name: EVENT_SOURCE_CONTAINER_KIND,
      description: '',
      icon: {
        url: getEventSourceIcon(EVENT_SOURCE_CONTAINER_KIND),
        class: null,
      },
      type: 'EventSource',
      provider: 'Red hat',
      cta: { label: 'knative-plugin~Create Event Source', href: '/' },
    },
  };

  it('should render form with proper initialvalues if contextSource is not passed', () => {
    const { container } = renderWithProviders(
      <EventSource
        namespace={namespaceName}
        normalizedSource={eventSourceStatusData.eventSource}
        activeApplication={activeApplicationName}
      />,
    );
    expect(container.querySelector('Formik')).toBeInTheDocument();
  });

  it('should render form with proper initialvalues for sink if contextSource is passed', () => {
    const contextSourceData = 'serving.knative.dev~v1~Service/svc-display';
    const { container } = renderWithProviders(
      <EventSource
        namespace={namespaceName}
        normalizedSource={eventSourceStatusData.eventSource}
        contextSource={contextSourceData}
        activeApplication={activeApplicationName}
      />,
    );
    expect(container.querySelector('Formik')).toBeInTheDocument();
  });
});
