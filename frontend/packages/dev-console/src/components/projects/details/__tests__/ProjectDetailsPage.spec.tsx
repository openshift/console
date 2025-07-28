/* eslint-disable global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { configure, render, screen } from '@testing-library/react';
import * as _ from 'lodash';
import * as Router from 'react-router-dom-v5-compat';
import * as rbacModule from '@console/internal/components/utils/rbac';
import { ProjectDetailsPage, PageContents } from '../ProjectDetailsPage';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

let spyUseAccessReview;

jest.mock('@console/internal/components/factory', () => ({
  DetailsPage: function MockDetailsPage(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'details-page',
        'data-breadcrumbs-for': props.breadcrumbsFor ? 'true' : 'false',
        'data-name': props.name,
        'data-kind': props.kind,
        'data-pages': JSON.stringify(props.pages),
        'data-custom-data': JSON.stringify(props.customData),
      },
      'Details Page',
    );
  },
}));

jest.mock('@console/internal/components/dashboard/project-dashboard/project-dashboard', () => ({
  ProjectDashboard: function MockProjectDashboard() {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'project-dashboard',
      },
      'Project Dashboard',
    );
  },
}));

jest.mock('@console/internal/components/namespace', () => ({
  NamespaceDetails: function MockNamespaceDetails() {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'namespace-details',
      },
      'Namespace Details',
    );
  },
  projectMenuActions: [],
}));

jest.mock('@console/internal/components/start-guide', () => ({
  withStartGuide: (Component) => Component,
}));

jest.mock('@console/internal/components/utils', () => ({
  history: { push: jest.fn() },
  useAccessReview: jest.fn(),
  Page: {},
}));

jest.mock('@console/internal/models', () => ({
  ProjectModel: { kind: 'Project' },
  RoleBindingModel: {
    apiGroup: 'rbac.authorization.k8s.io',
    plural: 'rolebindings',
  },
  UserModel: {
    apiGroup: 'user.openshift.io',
    plural: 'users',
  },
}));

jest.mock('@console/shared', () => ({
  ALL_NAMESPACES_KEY: '__ALL_NAMESPACES__',
}));

jest.mock('@console/shared/src/components/document-title/DocumentTitle', () => ({
  DocumentTitle: function MockDocumentTitle(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'document-title',
      },
      props.children,
    );
  },
}));

jest.mock('@console/shared/src/components/breadcrumbs/Breadcrumbs', () => ({
  Breadcrumbs: function MockBreadcrumbs() {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'breadcrumbs',
      },
      'Breadcrumbs',
    );
  },
}));

jest.mock('../../../NamespacedPage', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockNamespacedPage(props) {
      return React.createElement(
        'div',
        {
          'data-test': 'namespaced-page',
          'data-hide-applications': props.hideApplications,
          'data-variant': props.variant,
        },
        props.children,
      );
    },
    NamespacedPageVariants: { light: 'light' },
  };
});

jest.mock('../../CreateProjectListPage', () => {
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
        'Create Project List Page',
      );
    },
    CreateAProjectButton: function MockCreateAProjectButton() {
      return React.createElement(
        'button',
        {
          'data-test': 'create-a-project-button',
          type: 'button',
        },
        'Create Project',
      );
    },
  };
});

jest.mock('../../../project-access/ProjectAccessPage', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockProjectAccessPage() {
      return React.createElement(
        'div',
        {
          'data-test': 'project-access-page',
        },
        'Project Access Page',
      );
    },
  };
});

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'devconsole~Project Details') return 'Project Details';
      if (key === 'devconsole~Projects') return 'Projects';
      if (key === 'devconsole~Overview') return 'Overview';
      if (key === 'devconsole~Details') return 'Details';
      if (key === 'devconsole~Project access') return 'Project access';
      return key;
    },
  }),
  Trans: function MockTrans(props) {
    const React = require('react');
    return React.createElement('span', { 'data-test': 'trans' }, props.children);
  },
}));

describe('ProjectDetailsPage', () => {
  beforeEach(() => {
    spyUseAccessReview = jest.spyOn(rbacModule, 'useAccessReview');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('expect ProjectDetailsPage to render the project list page when in the all-projects namespace', () => {
    spyUseAccessReview.mockReturnValue(true);
    jest.spyOn(Router, 'useParams').mockReturnValue({});

    render(<PageContents />);

    expect(screen.getByTestId('create-project-list-page')).toBeInTheDocument();
  });

  it('expect ProjectDetailsPage to show a namespaced details page for a namespace', () => {
    spyUseAccessReview.mockReturnValue(true);
    jest.spyOn(Router, 'useParams').mockReturnValue({ ns: 'test-project' });

    render(<PageContents />);

    expect(screen.getByTestId('details-page')).toBeInTheDocument();
  });

  it('expect ProjectDetailsPage not to render breadcrumbs', () => {
    spyUseAccessReview.mockReturnValue(true);
    jest.spyOn(Router, 'useParams').mockReturnValue({ ns: 'test-project' });

    render(<ProjectDetailsPage />);

    expect(screen.queryByTestId('breadcrumbs')).not.toBeInTheDocument();
  });

  it('should not render the Project Access tab if user has no access to role bindings', () => {
    spyUseAccessReview.mockReturnValue(false);
    jest.spyOn(Router, 'useParams').mockReturnValue({ ns: 'test-project' });

    render(<PageContents />);

    const detailsPage = screen.getByTestId('details-page');
    const pagesData = JSON.parse(detailsPage.getAttribute('data-pages'));
    expect(_.find(pagesData, { nameKey: 'devconsole~Project access' })).toBe(undefined);
  });
});
