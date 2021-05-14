import * as React from 'react';
import { shallow } from 'enzyme';
import { Formik } from 'formik';
import { LoadingBox, StatusBox } from '@console/internal/components/utils';
import ProjectAccess from '../ProjectAccess';
import { defaultAccessRoles } from '../project-access-form-utils';

type ProjectAccessProps = React.ComponentProps<typeof ProjectAccess>;
let projectAccessProps: ProjectAccessProps;

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key.split('~')[1] }),
  };
});

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
    const renderProjectAccess = shallow(<ProjectAccess {...projectAccessProps} />);
    expect(renderProjectAccess.find(LoadingBox).exists()).toBeTruthy();
    expect(renderProjectAccess.find(Formik).exists()).toBe(false);
  });

  it('should show the StatusBox when there is error loading the role bindings', () => {
    projectAccessProps.roleBindings.loadError = { error: 'user has no access to role bindigs' };
    const renderProjectAccess = shallow(<ProjectAccess {...projectAccessProps} />);
    expect(renderProjectAccess.find(StatusBox).exists()).toBeTruthy();
    expect(renderProjectAccess.find(Formik).exists()).toBe(false);
  });

  it('should load the Formik Form Component when role bindings loads without any error', () => {
    projectAccessProps.roleBindings.loaded = true;
    projectAccessProps.roleBindings.loadError = undefined;
    const renderProjectAccess = shallow(<ProjectAccess {...projectAccessProps} />);
    expect(renderProjectAccess.find(Formik).exists()).toBe(true);
  });
});
