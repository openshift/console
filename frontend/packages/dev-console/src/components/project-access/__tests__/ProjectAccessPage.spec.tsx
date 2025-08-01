/* eslint-disable global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { configure, render, screen } from '@testing-library/react';
import * as Router from 'react-router-dom-v5-compat';
import ProjectAccessPage from '../ProjectAccessPage';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

jest.mock('@console/internal/components/utils', () => ({
  Firehose: function MockFirehose(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'firehose',
        'data-resources': JSON.stringify(props.resources),
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

jest.mock('../ProjectAccess', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockProjectAccess(props) {
      return React.createElement(
        'div',
        {
          'data-test': 'project-access',
          'data-full-form-view': props.fullFormView,
          'data-namespace': props.namespace,
          'data-roles': JSON.stringify(props.roles),
        },
        'Project Access Component',
      );
    },
  };
});

jest.mock('../hooks', () => ({
  useProjectAccessRoles: jest.fn(() => ({
    data: { edit: 'Edit', admin: 'Admin', view: 'View' },
    loaded: true,
  })),
}));

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
  useLocation: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'devconsole~Project access') return 'Project access';
      return key;
    },
  }),
}));

describe('Project Access Page', () => {
  beforeEach(() => {
    (window as any).SERVER_FLAGS = { projectAccessClusterRoles: '["edit", "admin", "view"]' };
  });

  it('should render Project access tab', () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'abc',
    });
    jest
      .spyOn(Router, 'useLocation')
      .mockReturnValue({ pathname: '/project-details/ns/abc/access' });

    render(<ProjectAccessPage />);

    expect(screen.getByTestId('project-access')).toBeInTheDocument();
    expect(screen.getByTestId('project-access')).toHaveAttribute('data-full-form-view', 'false');
    expect(screen.getByTestId('project-access')).toHaveAttribute('data-namespace', 'abc');
  });

  it('should render Project access full form view', () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'abc',
    });
    jest.spyOn(Router, 'useLocation').mockReturnValue({ pathname: '/project-access/ns/abc' });

    render(<ProjectAccessPage />);

    expect(screen.getByTestId('project-access')).toBeInTheDocument();
    expect(screen.getByTestId('project-access')).toHaveAttribute('data-full-form-view', 'true');
    expect(screen.getByTestId('project-access')).toHaveAttribute('data-namespace', 'abc');
  });
});
