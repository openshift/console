import { configure, screen } from '@testing-library/react';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import DeployImageForm from '../DeployImageForm';
import '@testing-library/jest-dom';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  withTranslation: () => (Component: React.ComponentType) => Component,
}));

jest.mock('../image-search/ImageSearchSection', () => ({
  __esModule: true,
  default: () => 'Image Search Section',
}));

jest.mock('../NamespaceSection', () => ({
  __esModule: true,
  default: () => 'Namespace Section',
}));

jest.mock('../section/IconSection', () => ({
  __esModule: true,
  default: () => 'Icon Section',
}));

jest.mock('../app/AppSection', () => ({
  __esModule: true,
  default: () => 'App Section',
}));

jest.mock('../section/deploy-section/DeploySection', () => ({
  __esModule: true,
  DeploySection: () => 'Deploy Section',
}));

jest.mock('../advanced/AdvancedSection', () => ({
  __esModule: true,
  default: () => 'Advanced Section',
}));

jest.mock('@console/shared/src/components/form-utils', () => ({
  __esModule: true,
  ...jest.requireActual('@console/shared/src/components/form-utils'),
  FormFooter: () => 'Form Footer',
  FlexForm: (props) => props.children,
  FormBody: (props) => props.children,
}));

jest.mock('@console/internal/components/utils', () => ({
  __esModule: true,
  ...jest.requireActual('@console/internal/components/utils'),
  usePreventDataLossLock: jest.fn(),
}));

jest.mock('../../../utils/samples', () => ({
  __esModule: true,
  hasSampleQueryParameter: jest.fn(() => false), // Default to non-sample mode
}));

let deployImageFormProps: React.ComponentProps<typeof DeployImageForm>;

describe('DeployImageForm', () => {
  beforeAll(() => {
    configure({ testIdAttribute: 'data-testid' });
  });
  afterAll(() => {
    configure({ testIdAttribute: 'data-test' });
  });

  beforeEach(() => {
    deployImageFormProps = {
      ...formikFormProps,
      projects: {
        loaded: true,
        data: [],
      },
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render ImageSearchSection, IconSection, AppSection, AdvancedSection and FormFooter', () => {
    renderWithProviders(<DeployImageForm {...deployImageFormProps} />);
    expect(screen.getByText(/Image Search Section/)).toBeInTheDocument();
    expect(screen.getByText(/Namespace Section/)).toBeInTheDocument();
    expect(screen.getByText(/Icon Section/)).toBeInTheDocument();
    expect(screen.getByText(/App Section/)).toBeInTheDocument();
    expect(screen.getByText(/Deploy Section/)).toBeInTheDocument();
    expect(screen.getByText(/Advanced Section/)).toBeInTheDocument();
    expect(screen.getByText(/Form Footer/)).toBeInTheDocument();
  });
});
