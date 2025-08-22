import { configure, render, screen } from '@testing-library/react';
import { useParams, useLocation } from 'react-router-dom';
import ProjectAccessPage from '../ProjectAccessPage';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

jest.mock('@console/internal/components/utils', () => ({
  Firehose: (props) => props.children,
}));

jest.mock('@console/shared/src/components/document-title/DocumentTitle', () => ({
  DocumentTitle: (props) => props.children,
}));

jest.mock('../ProjectAccess', () => ({
  __esModule: true,
  default: () => 'ProjectAccess',
}));

jest.mock('../hooks', () => ({
  useProjectAccessRoles: jest.fn(() => ({
    data: { edit: 'Edit', admin: 'Admin', view: 'View' },
    loaded: true,
  })),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useLocation: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('Project Access Page', () => {
  beforeEach(() => {
    (window as any).SERVER_FLAGS = { projectAccessClusterRoles: '["edit", "admin", "view"]' };
  });

  it('should render Project access tab', () => {
    (useParams as jest.Mock).mockReturnValue({
      ns: 'abc',
    });
    (useLocation as jest.Mock).mockReturnValue({ pathname: '/project-details/ns/abc/access' });

    render(<ProjectAccessPage />);

    expect(screen.getByText(/ProjectAccess/)).toBeInTheDocument();
  });

  it('should render Project access full form view', () => {
    (useParams as jest.Mock).mockReturnValue({
      ns: 'abc',
    });
    (useLocation as jest.Mock).mockReturnValue({ pathname: '/project-access/ns/abc' });

    render(<ProjectAccessPage />);

    expect(screen.getByText(/ProjectAccess/)).toBeInTheDocument();
  });
});
