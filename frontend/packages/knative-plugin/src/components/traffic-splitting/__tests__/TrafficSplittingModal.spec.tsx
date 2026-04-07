import type { ComponentProps } from 'react';
import { render, fireEvent } from '@testing-library/react';
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
  Button: jest.fn(() => null),
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

  it('should call handleSubmit on form submit', () => {
    const { container } = render(<TrafficSplittingModal {...formProps} />);
    const form = container.querySelector('form');
    if (form) {
      fireEvent.submit(form);
    }
    expect(formProps.handleSubmit).toHaveBeenCalled();
  });
});
