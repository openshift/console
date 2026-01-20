import type { FC, ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { updateTimestamps } from '@console/internal/actions/ui';
import { dateTimeFormatter } from '@console/internal/components/utils/datetime';
import store from '@console/internal/redux';
import { ONE_MINUTE } from '@console/shared/src';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';

interface WrapperProps {
  children?: ReactNode;
}

const TestWrapper: FC<WrapperProps> = ({ children }) => (
  <Provider store={store}>{children}</Provider>
);

describe('Timestamp', () => {
  it("should say 'Just now'", () => {
    store.dispatch(updateTimestamps(Date.now()));
    const timestamp = new Date().toISOString();
    render(<Timestamp timestamp={timestamp} />, {
      wrapper: TestWrapper,
    });
    expect(screen.getByText('Just now')).toBeDefined();
  });
  it("should say '1 minute ago'", () => {
    store.dispatch(updateTimestamps(Date.now()));
    const timestamp = new Date(Date.now() - ONE_MINUTE).toISOString();
    render(<Timestamp timestamp={timestamp} />, {
      wrapper: TestWrapper,
    });
    expect(screen.getByText('1 minute ago')).toBeDefined();
  });
  it("should say '10 minutes ago'", () => {
    store.dispatch(updateTimestamps(Date.now()));
    const timestamp = new Date(Date.now() - 10 * ONE_MINUTE).toISOString();
    render(<Timestamp timestamp={timestamp} />, {
      wrapper: TestWrapper,
    });
    expect(screen.getByText('10 minutes ago')).toBeDefined();
  });
  it('should show formatted date', () => {
    store.dispatch(updateTimestamps(Date.now()));
    const timestamp = new Date(Date.now() - 11 * ONE_MINUTE).toISOString();
    render(<Timestamp timestamp={timestamp} />, {
      wrapper: TestWrapper,
    });
    const formattedDate = dateTimeFormatter().format(new Date(timestamp));
    expect(screen.getByText(formattedDate)).toBeDefined();
  });
});
