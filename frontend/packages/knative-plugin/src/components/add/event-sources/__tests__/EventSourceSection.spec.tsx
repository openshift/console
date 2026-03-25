import { render } from '@testing-library/react';
import type { FormikValues } from 'formik';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { getDefaultEventingData } from '../../../../utils/__tests__/knative-serving-data';
import { EventSources } from '../../import-types';
import EventSourceSection from '../EventSourceSection';

const mockEventingData = getDefaultEventingData(EventSources.PingSource);

jest.mock('@console/dev-console/src/components/import/app/AppSection', () => ({
  __esModule: true,
  default: 'AppSection',
}));

jest.mock('../SinkSection', () => ({
  __esModule: true,
  default: 'SinkSection',
}));

jest.mock('formik', () => ({
  useField: jest.fn(() => [{}, {}]),
  useFormikContext: jest.fn(() => ({
    setFieldValue: jest.fn(),
    setFieldTouched: jest.fn(),
    values: mockEventingData as FormikValues,
  })),
}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

describe('EventSource Section', () => {
  const namespace = 'myapp';

  it('should render SinkSection, AppSection for CronjobSource', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[], true]);
    const { container } = render(<EventSourceSection namespace={namespace} />);
    expect(container.querySelector('SinkSection')).toBeInTheDocument();
    expect(container.querySelector('AppSection')).toBeInTheDocument();
  });
});
