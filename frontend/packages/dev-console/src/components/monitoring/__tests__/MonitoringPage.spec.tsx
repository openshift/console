/* eslint-disable global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { configure, render, screen } from '@testing-library/react';
import * as Router from 'react-router-dom-v5-compat';
import * as rbacModule from '@console/internal/components/utils/rbac';
import { PageContents } from '../MonitoringPage';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

jest.mock('@console/internal/module/k8s', () => ({
  k8sCreate: jest.fn(),
  k8sGet: jest.fn(),
  k8sList: jest.fn(),
  k8sUpdate: jest.fn(),
  k8sPatch: jest.fn(),
  k8sKill: jest.fn(),
  K8sResourceKind: {},
  modelFor: jest.fn(),
  referenceFor: jest.fn(),
  referenceForModel: jest.fn(),
}));

jest.mock('@console/internal/components/factory', () => ({
  Table: jest.fn(),
  MultiListPage: jest.fn(),
  DetailsPage: jest.fn(),
  ListPage: jest.fn(),
  RowFunction: jest.fn(),
}));

jest.mock('@console/internal/components/utils', () => ({
  HorizontalNav: function MockHorizontalNav(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'horizontal-nav',
        'data-context-id': props.contextId,
        'data-pages': JSON.stringify(props.pages),
        'data-no-status-box': props.noStatusBox,
      },
      `HorizontalNav with ${props.pages?.length || 0} pages`,
    );
  },
  history: { push: jest.fn() },
  Kebab: {
    factory: {
      ModifyLabels: jest.fn(),
      ModifyAnnotations: jest.fn(),
    },
  },
  useAccessReview: jest.fn(),
}));

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
}));

jest.mock('@console/shared/src/components/heading/PageHeading', () => ({
  PageHeading: function MockPageHeading(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'page-heading',
        'data-title': props.title,
      },
      `Page Heading: ${props.title}`,
    );
  },
}));

jest.mock('@console/shared/src/components/pagetitle/PageTitleContext', () => ({
  PageTitleContext: {
    Provider: function MockProvider({ children, value }) {
      const React = require('react');
      return React.createElement(
        'div',
        {
          'data-test': 'page-title-context',
          'data-title-prefix': value?.titlePrefix,
          'data-telemetry-prefix': value?.telemetryPrefix,
        },
        children,
      );
    },
  },
}));

jest.mock('../../NamespacedPage', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockNamespacedPage({ children }) {
      return React.createElement(
        'div',
        {
          'data-test': 'namespaced-page',
        },
        children,
      );
    },
  };
});

jest.mock('../../projects/CreateProjectListPage', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockCreateProjectListPage(props) {
      return React.createElement(
        'div',
        {
          'data-test': 'create-project-list-page',
          'data-title': props.title,
        },
        `CreateProjectListPage: ${props.title}`,
      );
    },
  };
});

jest.mock('../events/MonitoringEvents', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockMonitoringEvents() {
      return React.createElement(
        'div',
        {
          'data-test': 'monitoring-events',
        },
        'MonitoringEvents Component',
      );
    },
  };
});

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'devconsole~Observe') return 'Observe';
      if (key === 'devconsole~Events') return 'Events';
      return key;
    },
  }),
  Trans: function MockTrans({ children }) {
    const React = require('react');
    return React.createElement('span', { 'data-test': 'trans' }, children);
  },
}));

jest.mock('@console/shared', () => ({
  ALL_NAMESPACES_KEY: '__ALL_NAMESPACES__',
  FLAGS: {},
  useFlag: jest.fn(() => false),
  useActiveNamespace: jest.fn(() => ['test-namespace']),
}));

jest.mock('@console/internal/components/start-guide', () => ({
  withStartGuide: (Component) => Component,
}));

jest.mock('@console/shared/src/hooks/useCreateNamespaceOrProjectModal', () => ({
  useCreateNamespaceOrProjectModal: jest.fn(() => [jest.fn(), false]),
}));

describe('Monitoring Page ', () => {
  let spyUseAccessReview;

  beforeEach(() => {
    spyUseAccessReview = jest.spyOn(rbacModule, 'useAccessReview');
    spyUseAccessReview.mockReturnValue(true);
  });

  afterEach(() => {
    spyUseAccessReview.mockReset();
  });

  it('should render ProjectList page when in all-projects namespace', () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({});
    render(<PageContents />);

    expect(screen.getByTestId('create-project-list-page')).toBeInTheDocument();
    expect(screen.getByTestId('create-project-list-page')).toHaveAttribute('data-title', 'Observe');
  });

  it('should render all Tabs of Monitoring page for selected project', () => {
    spyUseAccessReview.mockReturnValue(true);
    const expectedTabs: string[] = ['Events'];

    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'test-proj',
    });
    render(<PageContents />);

    expect(screen.getByTestId('page-heading')).toBeInTheDocument();
    expect(screen.getByTestId('page-heading')).toHaveAttribute('data-title', 'Observe');
    expect(screen.getByTestId('horizontal-nav')).toBeInTheDocument();

    const horizontalNav = screen.getByTestId('horizontal-nav');
    const pagesData = JSON.parse(horizontalNav.getAttribute('data-pages'));
    const actualTabs = pagesData.map((page) => page.nameKey.replace('devconsole~', ''));
    expect(actualTabs).toEqual(expectedTabs);
  });

  it('should not render the Silences tab if user has no access to get prometheousRule resource', () => {
    spyUseAccessReview.mockReturnValue(false);
    const expectedTabs: string[] = ['Events'];
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'test-proj',
    });

    render(<PageContents />);

    const horizontalNav = screen.getByTestId('horizontal-nav');
    const pagesData = JSON.parse(horizontalNav.getAttribute('data-pages'));
    const actualTabs = pagesData.map((page) => page.nameKey.replace('devconsole~', ''));
    expect(actualTabs).toEqual(expectedTabs);
  });

  it('should render page title context with correct values when namespace is selected', () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'test-proj',
    });
    render(<PageContents />);

    const titleContext = screen.getByTestId('page-title-context');
    expect(titleContext).toBeInTheDocument();
    expect(titleContext).toHaveAttribute('data-title-prefix', 'Observe');
    expect(titleContext).toHaveAttribute('data-telemetry-prefix', 'Observe');
  });

  it('should render monitoring page with correct nav context when namespace is selected', () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'test-proj',
    });
    render(<PageContents />);

    const horizontalNav = screen.getByTestId('horizontal-nav');
    expect(horizontalNav).toHaveAttribute('data-context-id', 'dev-console-observe');
    expect(horizontalNav).toHaveAttribute('data-no-status-box', 'true');
  });
});
