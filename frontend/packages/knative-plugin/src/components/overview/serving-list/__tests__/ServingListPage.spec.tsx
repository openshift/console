import { render, screen } from '@testing-library/react';
import * as Router from 'react-router';
import ServingListPage from '../ServingListsPage';

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: jest.fn(),
}));

jest.mock('@console/internal/components/namespace-bar', () => ({
  NamespaceBar: () => <div data-test="mock-NamespaceBar" />,
}));

jest.mock('@console/shared', () => ({
  MultiTabListPage: () => <div data-test="mock-MultiTabListPage" />,
}));

jest.mock('react-i18next');

jest.mock('@console/internal/module/k8s', () => ({
  referenceForModel: jest.fn(() => 'serving.knative.dev~v1~Service'),
}));

jest.mock('../../../revisions/RevisionsPage', () => ({
  __esModule: true,
  default: 'RevisionsPage',
}));

jest.mock('../../../routes/RoutesPage', () => ({
  __esModule: true,
  default: 'RoutesPage',
}));

jest.mock('../../../services/ServicesPage', () => ({
  __esModule: true,
  default: 'ServicesPage',
}));

describe('ServingListPage', () => {
  beforeEach(() => {
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'my-project',
    });
  });

  it('should render NamespaceBar and MultiTabListPage', () => {
    render(<ServingListPage />);
    expect(screen.getByTestId('mock-NamespaceBar')).toBeVisible();
    expect(screen.getByTestId('mock-MultiTabListPage')).toBeVisible();
  });

  it('should render the main components without errors', () => {
    render(<ServingListPage />);
    expect(screen.getByTestId('mock-NamespaceBar')).toBeVisible();
    expect(screen.getByTestId('mock-MultiTabListPage')).toBeVisible();
  });
});
