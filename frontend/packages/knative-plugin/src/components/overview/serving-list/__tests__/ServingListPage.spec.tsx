import { render } from '@testing-library/react';
import * as Router from 'react-router-dom-v5-compat';
import ServingListPage from '../ServingListsPage';

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
}));

jest.mock('@console/internal/components/namespace-bar', () => ({
  NamespaceBar: 'NamespaceBar',
}));

jest.mock('@console/shared', () => ({
  MultiTabListPage: 'MultiTabListPage',
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

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
    const { container } = render(<ServingListPage />);
    expect(container.querySelector('namespacebar')).toBeInTheDocument();
    expect(container.querySelector('multitablistpage')).toBeInTheDocument();
  });

  it('should render the main components without errors', () => {
    const { container } = render(<ServingListPage />);
    expect(container.querySelector('namespacebar')).toBeInTheDocument();
    expect(container.querySelector('multitablistpage')).toBeInTheDocument();
  });
});
