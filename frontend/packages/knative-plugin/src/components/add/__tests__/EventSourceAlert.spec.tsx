import { render } from '@testing-library/react';
import EventSourceAlert from '../EventSourceAlert';

jest.mock('@patternfly/react-core', () => ({
  Alert: 'Alert',
}));

describe('EventSourceAlert', () => {
  it('should not alert if eventSources are there', () => {
    const { container } = render(
      <EventSourceAlert isValidSource createSourceAccessLoading={false} createSourceAccess />,
    );
    expect(container.querySelector('Alert')).not.toBeInTheDocument();
  });

  it('should show alert if eventSource is present but do not have create access', () => {
    const { container } = render(
      <EventSourceAlert
        isValidSource
        createSourceAccessLoading={false}
        createSourceAccess={false}
      />,
    );
    expect(container.querySelector('Alert')).toBeInTheDocument();
  });

  it('should show alert if eventSource is not present', () => {
    const { container } = render(
      <EventSourceAlert
        isValidSource={false}
        createSourceAccessLoading={false}
        createSourceAccess={false}
      />,
    );
    expect(container.querySelector('Alert')).toBeInTheDocument();
  });
});
