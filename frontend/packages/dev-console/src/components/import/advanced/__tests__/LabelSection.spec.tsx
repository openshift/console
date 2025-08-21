import { configure, screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import LabelSection from '../LabelSection';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  Trans: (props) => props.children,
  withTranslation: () => (Component: React.ComponentType) => Component,
}));

jest.mock('@console/internal/module/k8s', () => ({
  ...jest.requireActual('@console/internal/module/k8s'),
  referenceFor: () => 'apps~v1~Deployment',
  modelFor: () => ({ kind: 'Deployment', crd: false }),
}));

jest.mock('../../section/FormSection', () => ({
  __esModule: true,
  default: (props) => `${props.title} ${props.subTitle} ${props.children}`,
}));

jest.mock('@console/shared/src/components/formik-fields/SelectorInputField', () => ({
  __esModule: true,
  default: (props) => `SelectorInputField name=${props.name} placeholder=${props.placeholder}`,
}));

describe('LabelSection', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render a form section', () => {
    renderWithProviders(<LabelSection />);

    expect(screen.getByText(/Labels/)).toBeInTheDocument();
    expect(screen.getByText(/Each label is applied to each created resource/)).toBeInTheDocument();
  });

  it('should render the labels section content', () => {
    renderWithProviders(<LabelSection />);

    expect(screen.getByText(/Labels/)).toBeInTheDocument();
  });
});
