import * as React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import {
  mockTrafficData,
  mockRevisionItems,
} from '../../../utils/__mocks__/traffic-splitting-utils-mock';
import TrafficSplittingModal from '../TrafficSplittingModal';
import '@testing-library/jest-dom';

jest.mock('@console/internal/components/factory/modal', () => ({
  ModalTitle: jest.fn(() => null),
  ModalBody: jest.fn(() => null),
  ModalSubmitFooter: jest.fn(() => null),
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

type TrafficSplittingModalProps = React.ComponentProps<typeof TrafficSplittingModal>;

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
    expect(container.querySelector('form')).toHaveClass('modal-content');
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
