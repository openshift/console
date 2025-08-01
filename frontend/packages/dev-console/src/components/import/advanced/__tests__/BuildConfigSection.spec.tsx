/* eslint-disable global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { configure, screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import BuildConfigSection from '../BuildConfigSection';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  Trans: function MockTrans(props) {
    const React = require('react');
    return React.createElement('span', { 'data-testid': 'trans' }, props.children);
  },
  withTranslation: () => (Component: React.ComponentType) => Component,
}));

jest.mock('@console/internal/module/k8s', () => ({
  ...jest.requireActual('@console/internal/module/k8s'),
  referenceFor: () => 'apps~v1~Deployment',
  modelFor: () => ({ kind: 'Deployment', crd: false }),
}));

jest.mock('@console/shared', () => ({
  ...jest.requireActual('@console/shared'),
  CheckboxField: function MockCheckboxField(props) {
    const React = require('react');
    return React.createElement('input', {
      'data-test': `checkbox-field-${props.name}`,
      type: 'checkbox',
      name: props.name,
      'aria-label': props.label,
    });
  },
}));

let BuildConfigSectionProps: React.ComponentProps<typeof BuildConfigSection>;

jest.mock('formik', () => ({
  useFormikContext: jest.fn(),
}));

describe('BuildConfigSection', () => {
  const { useFormikContext } = require('formik');

  beforeEach(() => {
    BuildConfigSectionProps = {};
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render CheckboxField if triggers are there', () => {
    useFormikContext.mockReturnValue({
      values: {
        project: {
          name: 'my-app',
        },
        resources: 'kubernetes',
        build: {
          env: [],
          triggers: {
            webhook: true,
            config: true,
            image: true,
          },
          strategy: 'Source',
        },
        image: { selected: 'nodejs-ex', tag: 'latest' },
        import: {
          selectedStrategy: '',
        },
      },
    });

    renderWithProviders(<BuildConfigSection {...BuildConfigSectionProps} />);

    expect(screen.getByTestId('checkbox-field-build.triggers.webhook')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-field-build.triggers.image')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-field-build.triggers.config')).toBeInTheDocument();
  });

  it('should not render CheckboxField if triggers not there', () => {
    useFormikContext.mockReturnValue({
      values: {
        build: {
          env: [],
          triggers: {},
          strategy: 'Source',
        },
        image: { selected: 'nodejs-ex', tag: 'latest' },
        import: {
          selectedStrategy: '',
        },
      },
    });

    renderWithProviders(<BuildConfigSection {...BuildConfigSectionProps} />);

    expect(screen.queryByTestId('checkbox-field-build.triggers.webhook')).not.toBeInTheDocument();
    expect(screen.queryByTestId('checkbox-field-build.triggers.image')).not.toBeInTheDocument();
    expect(screen.queryByTestId('checkbox-field-build.triggers.config')).not.toBeInTheDocument();
  });
});
