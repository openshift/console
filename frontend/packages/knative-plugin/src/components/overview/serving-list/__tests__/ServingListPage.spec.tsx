import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as Router from 'react-router-dom-v5-compat';
import ServingListPage from '../ServingListsPage';

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
}));

jest.mock('@console/internal/components/namespace-bar', () => ({
  NamespaceBar: 'NamespaceBar',
}));

const mockMultiTabListPage = jest.fn();
jest.mock('@console/shared', () => ({
  MultiTabListPage: mockMultiTabListPage,
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

  it('should render MultiTabListPage with all pages and menuActions', () => {
    render(<ServingListPage />);

    expect(mockMultiTabListPage).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'knative-plugin~Serving',
        pages: expect.arrayContaining([
          expect.objectContaining({
            component: expect.any(String),
            nameKey: expect.any(String),
            pageData: expect.objectContaining({
              namespace: 'my-project',
              canCreate: false,
              showTitle: false,
            }),
          }),
        ]),
        menuActions: expect.objectContaining({
          service: expect.objectContaining({
            label: 'knative-plugin~Service',
            onSelection: expect.any(Function),
          }),
        }),
        telemetryPrefix: 'Serving',
      }),
      expect.anything(),
    );
  });
});
