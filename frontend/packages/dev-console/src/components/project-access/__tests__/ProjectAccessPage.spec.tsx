import { render, screen } from '@testing-library/react';
import { useParams, useLocation } from 'react-router-dom-v5-compat';
import ProjectAccessPage from '../ProjectAccessPage';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(() => [[], true, null]),
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

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
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
