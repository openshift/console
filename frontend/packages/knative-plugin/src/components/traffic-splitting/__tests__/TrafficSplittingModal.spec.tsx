/* eslint-disable testing-library/no-container, testing-library/no-node-access -- Mocked components require container queries */
import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import {
  mockTrafficData,
  mockRevisionItems,
} from '../../../utils/__mocks__/traffic-splitting-utils-mock';
import TrafficSplittingModal from '../TrafficSplittingModal';

jest.mock('@patternfly/react-core', () => ({
  ...jest.requireActual('@patternfly/react-core'),
  ModalHeader: jest.fn(() => null),
  ModalBody: jest.fn(({ children }) => <div>{children}</div>),
  Button: jest.fn(({ children, type = 'button', isDisabled, isLoading: _isLoading, ...props }) =>
    type === 'submit' ? (
      <button type="submit" disabled={isDisabled} {...props}>
        {children}
      </button>
    ) : (
      <button type="button" disabled={isDisabled} {...props}>
        {children}
      </button>
    ),
  ),
  Form: jest.fn(({ children, ...props }) => <form {...props}>{children}</form>),
}));

jest.mock('@console/shared/src/components/modals/ModalFooterWithAlerts', () => ({
  ModalFooterWithAlerts: jest.fn(({ children }) => <div>{children}</div>),
}));

jest.mock('../TrafficSplittingFields', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

type TrafficSplittingModalProps = ComponentProps<typeof TrafficSplittingModal>;

describe('TrafficSplittingModal', () => {
  let formProps: TrafficSplittingModalProps;

  beforeEach(() => {
    formProps = {
      ...formikFormProps,
      isSubmitting: false,
      isValidating: false,
      status: { error: 'checkErrorProp' },
      values: { trafficSplitting: mockTrafficData },
      revisionItems: mockRevisionItems,
      cancel: jest.fn(),
    };
  });

  it('should render form with modal structure', () => {
    const { container } = render(<TrafficSplittingModal {...formProps} />);
    expect(container.querySelector('form')).toBeInTheDocument();
    expect(container.querySelector('form')).toHaveAttribute('id', 'traffic-splitting-form');
  });

  it('should call handleSubmit on form submit', async () => {
    const user = userEvent.setup();
    render(<TrafficSplittingModal {...formProps} />);
    await user.click(screen.getByRole('button', { name: 'knative-plugin~Save' }));
    expect(formProps.handleSubmit).toHaveBeenCalled();
  });

  it('should call cancel when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<TrafficSplittingModal {...formProps} />);
    await user.click(screen.getByRole('button', { name: 'knative-plugin~Cancel' }));
    expect(formProps.cancel).toHaveBeenCalled();
  });
});
