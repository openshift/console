import { render } from '@testing-library/react';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import {
  mockTrafficData,
  mockRevisionItems,
} from '../../../utils/__mocks__/traffic-splitting-utils-mock';
import TrafficSplittingFields from '../TrafficSplittingFields';
import '@testing-library/jest-dom';

jest.mock('@console/shared', () => ({
  MultiColumnField: jest.fn(() => null),
  InputField: jest.fn(() => null),
}));

jest.mock('../TrafficModalRevisionsDropdownField', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const formProps = {
  ...formikFormProps,
  status: { error: 'checkErrorProp' },
  values: { trafficSplitting: mockTrafficData },
  revisionItems: mockRevisionItems,
};

describe('TrafficSplittingFields', () => {
  it('should render with single traffic splitting value', () => {
    expect(() =>
      render(
        <TrafficSplittingFields
          {...formProps}
          values={{ trafficSplitting: [{ percent: 100, revisionName: 'overlayimage-fdqsf' }] }}
        />,
      ),
    ).not.toThrow();
  });

  it('should render with multiple traffic splitting values', () => {
    expect(() =>
      render(
        <TrafficSplittingFields
          {...formProps}
          values={{
            trafficSplitting: [
              { percent: 50, tag: 'tag-1', revisionName: 'overlayimage-fdqsf' },
              { percent: 50, tag: 'tag-2', revisionName: 'overlayimage-tkvz5' },
            ],
          }}
        />,
      ),
    ).not.toThrow();
  });

  it('should render with all revisions assigned', () => {
    expect(() => render(<TrafficSplittingFields {...formProps} />)).not.toThrow();
  });

  it('should render without errors when filtering revisions', () => {
    expect(() =>
      render(
        <TrafficSplittingFields
          {...formProps}
          values={{ trafficSplitting: [{ percent: 100, revisionName: 'overlayimage-fdqsf' }] }}
        />,
      ),
    ).not.toThrow();
  });
});
