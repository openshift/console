import { configure, render, screen } from '@testing-library/react';
import { Resources } from '../../import-types';
import AdvancedRouteOptions from '../AdvancedRouteOptions';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

jest.mock('@console/internal/module/k8s', () => ({
  ...jest.requireActual('@console/internal/module/k8s'),
  referenceFor: () => 'apps~v1~Deployment',
  modelFor: () => ({ kind: 'Deployment', crd: false }),
}));

jest.mock('@console/git-service/src', () => ({
  GitProvider: {},
}));

jest.mock('@patternfly/react-core', () => ({
  Alert: () => 'Alert',
}));

jest.mock('@console/internal/components/utils', () => ({
  ExpandCollapse: (props) => props.children,
}));

jest.mock('@console/shared/src/components/formik-fields/SelectorInputField', () => ({
  __esModule: true,
  default: (props) =>
    `SelectorInputField name=${props.name} label="${props.label}" helpText="${props.helpText}" placeholder="${props.placeholder}" dataTest=${props.dataTest}`,
}));

jest.mock('../../section/FormSection', () => ({
  __esModule: true,
  default: (props) => props.children,
}));

jest.mock('../../serverless/ServerlessRouteSection', () => ({
  __esModule: true,
  default: () => 'Serverless Route Section',
}));

jest.mock('../CreateRoute', () => ({
  __esModule: true,
  default: () => 'Create Route',
}));

jest.mock('../SecureRoute', () => ({
  __esModule: true,
  default: () => 'Secure Route',
}));

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  withTranslation: () => (Component: React.ComponentType) => Component,
  Trans: (props) => props.children,
}));

describe('AdvancedRoutingOptions:', () => {
  const defaultProps = {
    canCreateRoute: true,
    resources: Resources.OpenShift,
  };

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('Render AdvancedRoutingOptions', () => {
    render(<AdvancedRouteOptions {...defaultProps} />);
    expect(screen.getByText(/SelectorInputField/)).toBeInTheDocument();
  });

  it('should show serverless route section options', () => {
    const props = {
      ...defaultProps,
      resources: Resources.KnativeService,
    };
    render(<AdvancedRouteOptions {...props} />);

    expect(screen.getByText(/Serverless Route Section/)).toBeInTheDocument();
    expect(screen.queryByText(/Create Route/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Secure Route/)).not.toBeInTheDocument();
    expect(screen.queryByText(/SelectorInputField/)).not.toBeInTheDocument();
  });

  it('should show route section options', () => {
    const props = {
      ...defaultProps,
      resources: Resources.OpenShift,
    };
    render(<AdvancedRouteOptions {...props} />);

    expect(screen.getByText(/Create Route/)).toBeInTheDocument();
    expect(screen.getByText(/Secure Route/)).toBeInTheDocument();
    expect(screen.getByText(/SelectorInputField/)).toBeInTheDocument();
    expect(screen.queryByText(/Serverless Route Section/)).not.toBeInTheDocument();
  });

  it('should show labels input option', () => {
    render(<AdvancedRouteOptions {...defaultProps} />);

    expect(
      screen.getByText(
        /SelectorInputField name=route\.labels label=".*Labels.*" helpText=".*Additional labels which are only added to the Route resource.*" placeholder="app\.io\/type=frontend" dataTest=route-labels/,
      ),
    ).toBeInTheDocument();
  });

  it('should not show route section and show alert', () => {
    const props = {
      ...defaultProps,
      canCreateRoute: false,
    };

    render(<AdvancedRouteOptions {...props} />);

    expect(screen.getByText(/Alert/)).toBeInTheDocument();
    expect(screen.queryByText(/Create Route/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Secure Route/)).not.toBeInTheDocument();
    expect(screen.queryByText(/SelectorInputField/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Serverless Route Section/)).not.toBeInTheDocument();
  });
});
