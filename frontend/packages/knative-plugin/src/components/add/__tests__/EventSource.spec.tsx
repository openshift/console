import type { ReactNode } from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { EVENT_SOURCE_CONTAINER_KIND } from '../../../const';
import { getEventSourceIcon } from '../../../utils/get-knative-icon';
import { EventSource } from '../EventSource';

global.ResizeObserver = class ResizeObserver {
  observe = () => {};

  unobserve = () => {};

  disconnect = () => {};
};

jest.mock('@console/shared', () => {
  const actual = jest.requireActual('@console/shared');
  return {
    ...actual,
    SyncedEditorField: ({ formContext }: { formContext?: { editor?: ReactNode } }) => (
      <>{formContext?.editor}</>
    ),
  };
});

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
      cta: { label: 'Create Event Source', href: '/' },
    },
  };

  it('should render form with proper initialvalues if contextSource is not passed', () => {
    renderWithProviders(
      <EventSource
        namespace={namespaceName}
        normalizedSource={eventSourceStatusData.eventSource}
        activeApplication={activeApplicationName}
        sourceKind={EVENT_SOURCE_CONTAINER_KIND}
      />,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: EVENT_SOURCE_CONTAINER_KIND }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Target/ })).toBeInTheDocument();
    expect(
      screen.getByText(/This resource will be the sink for the Event source/),
    ).toBeInTheDocument();
  });

  it('should render form with proper initialvalues for sink if contextSource is passed', () => {
    const contextSourceData = 'serving.knative.dev~v1~Service/svc-display';
    renderWithProviders(
      <EventSource
        namespace={namespaceName}
        normalizedSource={eventSourceStatusData.eventSource}
        contextSource={contextSourceData}
        activeApplication={activeApplicationName}
        sourceKind={EVENT_SOURCE_CONTAINER_KIND}
      />,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: EVENT_SOURCE_CONTAINER_KIND }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Target/ })).toBeInTheDocument();
    expect(
      screen.queryByText(/This resource will be the sink for the Event source/),
    ).not.toBeInTheDocument();
  });
});
