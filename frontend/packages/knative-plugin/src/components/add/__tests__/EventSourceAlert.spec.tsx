import { render, screen } from '@testing-library/react';
import EventSourceAlert from '../EventSourceAlert';

jest.mock('@patternfly/react-core', () => ({
  Alert: () => 'mock-Alert',
}));

describe('EventSourceAlert', () => {
  it('should not alert if eventSources are there', () => {
    render(<EventSourceAlert isValidSource createSourceAccessLoading={false} createSourceAccess />);
    expect(screen.queryByText('mock-Alert')).not.toBeInTheDocument();
  });

  it('should show alert if eventSource is present but do not have create access', () => {
    render(
      <EventSourceAlert
        isValidSource
        createSourceAccessLoading={false}
        createSourceAccess={false}
      />,
    );
    expect(screen.getByText('mock-Alert')).toBeVisible();
  });

  it('should show alert if eventSource is not present', () => {
    render(
      <EventSourceAlert
        isValidSource={false}
        createSourceAccessLoading={false}
        createSourceAccess={false}
      />,
    );
    expect(screen.getByText('mock-Alert')).toBeVisible();
  });
});
