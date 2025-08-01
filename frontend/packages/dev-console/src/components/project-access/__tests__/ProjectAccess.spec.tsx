/* eslint-disable global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { configure, render, screen } from '@testing-library/react';
import { defaultAccessRoles } from '../project-access-form-utils';
import ProjectAccess from '../ProjectAccess';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

jest.mock('@console/internal/components/utils', () => ({
  LoadingBox: function MockLoadingBox() {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'loading-box',
      },
      'Loading...',
    );
  },
  StatusBox: function MockStatusBox(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'status-box',
        'data-loaded': props.loaded,
        'data-load-error': JSON.stringify(props.loadError),
      },
      'Status Box',
    );
  },
  documentationURLs: { usingRBAC: 'rbac-url' },
  getDocumentationURL: jest.fn(() => 'http://example.com/rbac'),
  history: { goBack: jest.fn() },
  isManaged: jest.fn(() => false),
}));

jest.mock('formik', () => ({
  Formik: function MockFormik(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'formik',
        'data-initial-values': JSON.stringify(props.initialValues),
      },
      'Formik Form Component',
    );
  },
}));

jest.mock('@patternfly/react-core', () => ({
  Content: function MockContent(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'content',
      },
      props.children,
    );
  },
  ContentVariants: { p: 'p' },
}));

jest.mock('react-router-dom-v5-compat', () => ({
  Link: function MockLink(props) {
    const React = require('react');
    return React.createElement(
      'a',
      {
        'data-test': 'link',
        'data-to': props.to,
        href: props.to,
      },
      props.children,
    );
  },
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

jest.mock('@console/shared/src/components/heading/PageHeading', () => ({
  PageHeading: function MockPageHeading(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'page-heading',
        'data-title': props.title,
      },
      'Page Heading',
    );
  },
}));

jest.mock('@console/shared/src/components/links/ExternalLink', () => ({
  ExternalLink: function MockExternalLink(props) {
    const React = require('react');
    return React.createElement(
      'a',
      {
        'data-test': 'external-link',
        'data-href': props.href,
        href: props.href,
      },
      props.children,
    );
  },
}));

jest.mock('../../NamespacedPage', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockNamespacedPage(props) {
      return React.createElement(
        'div',
        {
          'data-test': 'namespaced-page',
        },
        props.children,
      );
    },
    NamespacedPageVariants: { light: 'light' },
  };
});

jest.mock('../ProjectAccessForm', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockProjectAccessForm() {
      return React.createElement(
        'div',
        {
          'data-test': 'project-access-form',
        },
        'Project Access Form',
      );
    },
  };
});

jest.mock('@console/internal/models', () => ({
  RoleBindingModel: { plural: 'rolebindings' },
  RoleModel: { plural: 'roles' },
}));

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  Trans: function MockTrans(props) {
    const React = require('react');
    return React.createElement('span', { 'data-test': 'trans' }, props.children);
  },
}));

jest.mock('lodash', () => ({
  isEmpty: jest.fn((obj) => obj === undefined || obj === null || Object.keys(obj).length === 0),
}));

jest.mock('../project-access-form-submit-utils', () => ({
  getNewRoles: jest.fn(() => []),
  getRemovedRoles: jest.fn(() => []),
  sendRoleBindingRequest: jest.fn(() => []),
  getRolesWithMultipleSubjects: jest.fn(() => ({
    updateRolesWithMultipleSubjects: [],
    removeRoleSubjectFlag: false,
  })),
  getRolesToUpdate: jest.fn(() => []),
}));

jest.mock('../project-access-form-utils', () => ({
  getUserRoleBindings: jest.fn(() => []),
  defaultAccessRoles: { admin: 'admin' },
}));

jest.mock('../project-access-form-validation-utils', () => ({
  validationSchema: {},
}));

type ProjectAccessProps = React.ComponentProps<typeof ProjectAccess>;
let projectAccessProps: ProjectAccessProps;

describe('Project Access', () => {
  beforeEach(() => {
    projectAccessProps = {
      namespace: 'abc',
      roleBindings: {
        data: [],
        loaded: false,
        loadError: {},
      },
      roles: {
        data: defaultAccessRoles,
        loaded: true,
      },
    };
  });

  it('should show the LoadingBox when role bindings are not loaded, but user has access to role bindings', () => {
    render(<ProjectAccess {...projectAccessProps} />);

    expect(screen.getByTestId('loading-box')).toBeInTheDocument();
    expect(screen.queryByTestId('formik')).not.toBeInTheDocument();
  });

  it('should show the StatusBox when there is error loading the role bindings', () => {
    projectAccessProps.roleBindings.loadError = { error: 'user has no access to role bindigs' };
    render(<ProjectAccess {...projectAccessProps} />);

    expect(screen.getByTestId('status-box')).toBeInTheDocument();
    expect(screen.queryByTestId('formik')).not.toBeInTheDocument();
  });

  it('should load the Formik Form Component when role bindings loads without any error', () => {
    projectAccessProps.roleBindings.loaded = true;
    projectAccessProps.roleBindings.loadError = undefined;
    render(<ProjectAccess {...projectAccessProps} />);

    expect(screen.getByTestId('formik')).toBeInTheDocument();
  });
});
