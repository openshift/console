/* eslint-disable global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { configure, screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import DeploymentConfigSection from '../DeploymentConfigSection';
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
  EnvironmentField: function MockEnvironmentField(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'environment-field',
        'data-envs': JSON.stringify(props.envs),
      },
      `Environment Field - ${props.envs?.length || 0} envs`,
    );
  },
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

jest.mock('formik', () => ({
  useFormikContext: jest.fn(),
}));

let deploymentConfigSectionProps: React.ComponentProps<typeof DeploymentConfigSection>;

describe('DeploymentConfigSection', () => {
  const { useFormikContext } = require('formik');

  beforeEach(() => {
    deploymentConfigSectionProps = {
      namespace: 'my-app',
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render EnvironmentField and have values of Environment', () => {
    useFormikContext.mockReturnValue({
      values: {
        project: {
          name: 'my-app',
        },
        resources: 'kubernetes',
        deployment: {
          env: [
            {
              name: 'GREET',
              value: 'hi',
            },
          ],
        },
        import: {
          selectedStrategy: { type: 1 }, // dockerfile
          knativeFuncLoaded: true,
        },
      },
    });

    renderWithProviders(<DeploymentConfigSection {...deploymentConfigSectionProps} />);

    const environmentField = screen.getByTestId('environment-field');
    expect(environmentField).toBeInTheDocument();

    const envsData = JSON.parse(environmentField.getAttribute('data-envs'));
    expect(envsData).toEqual([
      {
        name: 'GREET',
        value: 'hi',
      },
    ]);
  });
});
