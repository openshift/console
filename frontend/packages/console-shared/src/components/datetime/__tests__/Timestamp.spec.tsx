import { act, screen } from '@testing-library/react';
import { updateTimestamps } from '@console/internal/actions/ui';
import { dateTimeFormatter } from '@console/internal/components/utils/datetime';
import { ONE_MINUTE } from '@console/shared/src';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';

const NOW = new Date('2000-01-01T00:00:00Z').getTime();

describe('Timestamp', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("should say 'Just now'", () => {
    const timestamp = new Date(NOW).toISOString();
    const { store } = renderWithProviders(<Timestamp timestamp={timestamp} />);
    act(() => {
      store.dispatch(updateTimestamps(NOW));
    });
    expect(screen.getByText('Just now')).toBeDefined();
  });
  it("should say '1 minute ago'", () => {
    const timestamp = new Date(NOW - ONE_MINUTE).toISOString();
    const { store } = renderWithProviders(<Timestamp timestamp={timestamp} />);
    act(() => {
      store.dispatch(updateTimestamps(NOW));
    });
    expect(screen.getByText('1 minute ago')).toBeDefined();
  });
  it("should say '10 minutes ago'", () => {
    const timestamp = new Date(NOW - 10 * ONE_MINUTE).toISOString();
    const { store } = renderWithProviders(<Timestamp timestamp={timestamp} />);
    act(() => {
      store.dispatch(updateTimestamps(NOW));
    });
    expect(screen.getByText('10 minutes ago')).toBeDefined();
  });
  it('should show formatted date', () => {
    const timestamp = new Date(NOW - 11 * ONE_MINUTE).toISOString();
    const { store } = renderWithProviders(<Timestamp timestamp={timestamp} />);
    act(() => {
      store.dispatch(updateTimestamps(NOW));
    });
    const formattedDate = dateTimeFormatter().format(new Date(timestamp));
    expect(screen.getByText(formattedDate)).toBeDefined();
  });
});
