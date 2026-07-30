import { render, screen } from '@testing-library/react';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { EVENT_SOURCE_SINK_BINDING_KIND, KNATIVE_EVENT_SOURCE_APIGROUP } from '../../../const';
import { getEventSourceResponse } from '../../../topology/__tests__/topology-knative-test-data';
import EventSourceOwnedList from '../EventSourceOwnedList';

jest.mock(
  '@console/internal/components/utils',
  () =>
    jest.requireActual('@console/knative-plugin/src/__tests__/rtl-stub-components')
      .knativeInternalUtilsStubs,
);

describe('EventSourceOwnedList', () => {
  const mockData: K8sResourceKind = getEventSourceResponse(
    KNATIVE_EVENT_SOURCE_APIGROUP,
    'v1',
    EVENT_SOURCE_SINK_BINDING_KIND,
  ).data[0];

  it('should render SidebarSectionHeading, ResourceLink', () => {
    render(<EventSourceOwnedList source={mockData} />);
    expect(screen.getByTestId('mock-SidebarSectionHeading')).toBeVisible();
    expect(screen.getByTestId('mock-ResourceLink')).toBeVisible();
  });
});
