import { render, screen } from '@testing-library/react';
import EventSinkAlert from '../EventSinkAlert';

jest.mock('@patternfly/react-core', () => ({
  Alert: () => 'mock-Alert',
}));

describe('EventSinkAlert', () => {
  it('should not alert if eventSinks are there', () => {
    render(<EventSinkAlert isValidSink createSinkAccessLoading={false} createSinkAccess />);
    expect(screen.queryByText('mock-Alert')).not.toBeInTheDocument();
  });

  it('should show alert if eventSink is present but do not have create access', () => {
    render(<EventSinkAlert isValidSink createSinkAccessLoading={false} createSinkAccess={false} />);
    expect(screen.getByText('mock-Alert')).toBeVisible();
  });

  it('should show alert if eventSink is not present', () => {
    render(
      <EventSinkAlert
        isValidSink={false}
        createSinkAccessLoading={false}
        createSinkAccess={false}
      />,
    );
    expect(screen.getByText('mock-Alert')).toBeVisible();
  });
});
