import { configure, render, screen } from '@testing-library/react';
import { defaultAccessRoles } from '../project-access-form-utils';
import ProjectAccess from '../ProjectAccess';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

jest.mock('@console/internal/components/utils', () => ({
  LoadingBox: () => 'LoadingBox',
  StatusBox: () => 'StatusBox',
  documentationURLs: { usingRBAC: 'rbac-url' },
  getDocumentationURL: jest.fn(() => 'http://example.com/rbac'),
  history: { goBack: jest.fn() },
  isManaged: jest.fn(() => false),
}));

jest.mock('formik', () => ({
  Formik: () => 'Formik',
}));

jest.mock('@patternfly/react-core', () => ({
  Content: (props) => props.children,
  ContentVariants: { p: 'p' },
}));

jest.mock('react-router-dom-v5-compat', () => ({
  Link: () => 'Link',
}));

jest.mock('@console/shared/src/components/document-title/DocumentTitle', () => ({
  DocumentTitle: (props) => props.children,
}));

jest.mock('@console/shared/src/components/heading/PageHeading', () => ({
  PageHeading: () => 'PageHeading',
}));

jest.mock('@console/shared/src/components/links/ExternalLink', () => ({
  ExternalLink: () => 'ExternalLink',
}));

jest.mock('../../NamespacedPage', () => ({
  __esModule: true,
  default: (props) => props.children,
  NamespacedPageVariants: { light: 'light' },
}));

jest.mock('../ProjectAccessForm', () => ({
  __esModule: true,
  default: () => 'ProjectAccessForm',
}));

jest.mock('@console/internal/models', () => ({
  RoleBindingModel: { plural: 'rolebindings' },
  RoleModel: { plural: 'roles' },
}));

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  Trans: (props) => props.children,
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

    expect(screen.getByText(/LoadingBox/)).toBeInTheDocument();
    expect(screen.queryByText(/Formik/)).not.toBeInTheDocument();
  });

  it('should show the StatusBox when there is error loading the role bindings', () => {
    if (projectAccessProps.roleBindings) {
      projectAccessProps.roleBindings.loadError = {
        error: 'user has no access to role bindigs',
      } as any;
    }
    const renderProjectAccess = shallow(<ProjectAccess {...projectAccessProps} />);
    expect(renderProjectAccess.find(StatusBox).exists()).toBeTruthy();
    expect(renderProjectAccess.find(Formik).exists()).toBe(false);
  });

  it('should load the Formik Form Component when role bindings loads without any error', () => {
    // Ensure roleBindings is defined before accessing its properties
    if (projectAccessProps.roleBindings) {
      projectAccessProps.roleBindings.loaded = true;
      projectAccessProps.roleBindings.loadError = {} as any;
    }
    const renderProjectAccess = shallow(<ProjectAccess {...projectAccessProps} />);
    expect(renderProjectAccess.find(Formik).exists()).toBe(true);
  });
});
