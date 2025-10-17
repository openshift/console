import { render } from '@testing-library/react';
import EventSinkAlert from '../EventSinkAlert';

jest.mock('@patternfly/react-core', () => ({
  Alert: 'Alert',
}));

describe('EventSinkAlert', () => {
  it('should not alert if eventSinks are there', () => {
    const { container } = render(
      <EventSinkAlert isValidSink createSinkAccessLoading={false} createSinkAccess />,
    );
    expect(container.querySelector('Alert')).not.toBeInTheDocument();
  });

  it('should show alert if eventSink is present but do not have create access', () => {
    const { container } = render(
      <EventSinkAlert isValidSink createSinkAccessLoading={false} createSinkAccess={false} />,
    );
    expect(container.querySelector('Alert')).toBeInTheDocument();
  });

  it('should show alert if eventSink is not present', () => {
    const { container } = render(
      <EventSinkAlert
        isValidSink={false}
        createSinkAccessLoading={false}
        createSinkAccess={false}
      />,
    );
    expect(container.querySelector('Alert')).toBeInTheDocument();
  });
});
