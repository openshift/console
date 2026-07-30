import { screen } from '@testing-library/react';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import {
  mockKameletSink,
  mockNormalizedKafkaSink,
  mockNormalizedSink,
} from '../__mocks__/Kamelet-data';
import EventSink from '../EventSink';

const useSelectorMock = useConsoleSelector as jest.Mock;

jest.mock('@console/shared/src/hooks/useConsoleSelector', () => ({
  useConsoleSelector: jest.fn(),
}));

jest.mock('formik', () => ({
  Formik: () => <span data-test="mock-Formik" />,
}));

describe('EventSinkSpec', () => {
  const namespace = 'myApp';

  it('should render form with proper initialvalues', () => {
    useSelectorMock.mockReturnValue('appGroup');
    renderWithProviders(
      <EventSink
        namespace={namespace}
        normalizedSink={mockNormalizedSink}
        kameletSink={mockKameletSink}
        sinkKind={'KameletBinding'}
      />,
    );
    expect(screen.getByTestId('mock-Formik')).toBeInTheDocument();
  });

  it('should render form with proper initialvalues for kafkaSink', () => {
    useSelectorMock.mockReturnValue('appGroup');
    renderWithProviders(
      <EventSink
        namespace={namespace}
        normalizedSink={mockNormalizedKafkaSink}
        sinkKind={'KafkaSink'}
      />,
    );
    expect(screen.getByTestId('mock-Formik')).toBeInTheDocument();
  });
});
