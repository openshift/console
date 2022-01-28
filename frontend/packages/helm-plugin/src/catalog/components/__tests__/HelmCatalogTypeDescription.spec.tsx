import * as React from 'react';
import { shallow } from 'enzyme';
import QuickStartsLoader from '@console/app/src/components/quick-starts/loader/QuickStartsLoader';
import { loadingQuickStarts } from '@console/shared/src/components/getting-started/__tests__/QuickStartGettingStartedCard.data';
import HelmCatalogTypeDescription from '../HelmCatalogTypeDescription';

jest.mock('react-router-dom', () => ({
  ...require.requireActual('react-router-dom'),
  useLocation: () => {
    return {
      pathname: ' /catalog/ns/my-namespace',
      search: '?catalogType=myCatalog',
    };
  },
}));

jest.mock('@console/app/src/components/quick-starts/loader/QuickStartsLoader', () => ({
  default: jest.fn(),
}));

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    Trans: () => null,
  };
});

const QuickStartsLoaderMock = QuickStartsLoader as jest.Mock;

describe('HelmCatalogTypeDescription', () => {
  it('should not return the Quick starts link if the quick starts are not loaded', () => {
    QuickStartsLoaderMock.mockImplementation((props) => props.children(loadingQuickStarts, false));
    const helmCatalogTypeDescription = shallow(<HelmCatalogTypeDescription />).shallow();

    expect(
      helmCatalogTypeDescription.find('[data-test-id="namespaced-hcr-quickstart-link"]').exists(),
    ).toBe(false);
  });

  it('should not return the Quick starts link if the `install-helmchartrepo-ns` quick start is not available', () => {
    QuickStartsLoaderMock.mockImplementation((props) => props.children(loadingQuickStarts, true));

    const helmCatalogTypeDescription = shallow(<HelmCatalogTypeDescription />).shallow();

    expect(
      helmCatalogTypeDescription.find('[data-test-id="namespaced-hcr-quickstart-link"]').exists(),
    ).toBe(false);
  });

  it('should return the Quick starts link if the `install-helmchartrepo-ns` quick start is available', () => {
    QuickStartsLoaderMock.mockImplementation((props) =>
      props.children(
        [
          ...loadingQuickStarts,
          {
            apiVersion: 'console.openshift.io/v1',
            kind: 'ConsoleQuickStart',
            metadata: {
              annotations: {
                'include.release.openshift.io/ibm-cloud-managed': 'true',
                'include.release.openshift.io/single-node-developer': 'true',
              },
              creationTimestamp: '2022-01-25T15:08:07Z',
              managedFields: [],
              name: 'install-helmchartrepo-ns',
              resourceVersion: '26537',
              uid: '0049c0b4-b081-41d3-8133-46160a63d5ff',
            },
            spec: {
              conclusion:
                'Helm Charts from the new repository are now available to developers in your project.',
              description:
                'Enable additional Helm Charts by adding a namespace scoped Helm Chart Repository to your project.',
              displayName:
                'Add Helm Chart Repositories to extend the Developer Catalog for your project',
              durationMinutes: 5,
              icon:
                'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHJvbGU9ImltZyIgdmlld0JveD0iLTYuNDkgLTYuNzQgMzE2LjQ5IDM2My43NCI+PG1hc2sgaWQ9ImEiIGZpbGw9IiNmZmYiPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0ibTAgMGgzMTMuMzAzMTU1djE1OS44NjQ4NjVoLTMxMy4zMDMxNTV6Ii8+PC9tYXNrPjxtYXNrIGlkPSJiIiBmaWxsPSIjZmZmIj48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGQ9Im0wIDBoMzEzLjMwMzE1NXYxNTkuODY0ODY1aC0zMTMuMzAzMTU1eiIvPjwvbWFzaz48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9IiMwMDAiIGQ9Im0xMS42Nzg1NzE0IDE4OWgxOS43ODU4MzU3djI2Ljc4OWgyMy45MDM3di0yNi43ODloMTkuNzg1ODM1OHY3NS4yNWgtMTkuNzg1ODM1OHYtMjguNjk1MzMzaC0yMy45MDM3djI4LjY5NTMzM2gtMTkuNzg1ODM1N3ptODYuMTczODQyOSA3NS4yNXYtNzUuMjVoNDYuODAzMDQyN3YxNi4zNTQzMzNoLTI3LjAxNzIwN3YxMi4yNDA2NjdoMjMuOTAzN3YxNi42NTUzMzNoLTIzLjkwMzd2MTMuODQ2aDI3LjAxNzIwN3YxNi4xNTM2Njd6bTY4LjQ5NzE1NjcgMHYtNzUuMjVoMTkuNzg1ODM2djU1LjM4NGgyNy4xMTc2NDN2MTkuODY2em03Ny41MzYzNzItNzUuMjUgMzAuNzMzMzI4IDI3Ljg5MjY2NyAzMC42MzI4OTMtMjcuODkyNjY3aDguOTM4Nzc5djc1LjI1aC0xOS44ODYyNzJ2LTM4LjYyODMzM2wtMTkuNjg1NCAxNy45NTk2NjYtMTkuNzg1ODM1LTE3Ljg1OTMzM3YzOC41MjhoLTE5Ljg4NjI3MnYtNzUuMjV6IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTEgLTUxKSIvPjxnPjxnIGZpbGw9IiMwMDAiIG1hc2s9InVybCgjYSkiIHRyYW5zZm9ybT0ibWF0cml4KDEgMCAwIC0xIC45NTggNDA0KSI+PHBhdGggZD0ibTIwMy40NjA2NzYgOTUuNjg3NTQyNWM2LjkzNjMxIDAgMTIuNTU5MzAxLTE0LjgwOTIxOTQgMTIuNTU5MzAxLTMzLjA3NzMxNzJzLTUuNjIyOTkxLTMzLjA3NzMxNzItMTIuNTU5MzAxLTMzLjA3NzMxNzJjLTYuOTM2MzExIDAtMTIuNTU5MzAxIDE0LjgwOTIxOTQtMTIuNTU5MzAxIDMzLjA3NzMxNzJzNS42MjI5OSAzMy4wNzczMTcyIDEyLjU1OTMwMSAzMy4wNzczMTcyeiIgdHJhbnNmb3JtPSJyb3RhdGUoMzUgMTM3LjkzMSAxNTEuNTUpIi8+PHBhdGggZD0ibTMwLjE0MjMyMjMgOTUuNjg3NTQyNWM2LjkzNjMxMDQgMCAxMi41NTkzMDEtMTQuODA5MjE5NCAxMi41NTkzMDEtMzMuMDc3MzE3MnMtNS42MjI5OTA2LTMzLjA3NzMxNzItMTIuNTU5MzAxLTMzLjA3NzMxNzItMTIuNTU5MzAwOSAxNC44MDkyMTk0LTEyLjU1OTMwMDkgMzMuMDc3MzE3MiA1LjYyMjk5MDUgMzMuMDc3MzE3MiAxMi41NTkzMDA5IDMzLjA3NzMxNzJ6IiB0cmFuc2Zvcm09InNjYWxlKC0xIDEpIHJvdGF0ZSgzNSAtMTA0LjY5MiAtNjguMjU4KSIvPjxwYXRoIGQ9Im0xMTYuNzMyODE1IDY2LjI3NTI2NzZjNi45MzYzMTEgMCAxMi41NTkzMDEtMTQuODA5MjE5MyAxMi41NTkzMDEtMzMuMDc3MzE3MiAwLTE4LjI2ODA5NzgtNS42MjI5OS0zMy4wNzczMTcxMy0xMi41NTkzMDEtMzMuMDc3MzE3MTMtNi45MzYzMSAwLTEyLjU1OTMwMSAxNC44MDkyMTkzMy0xMi41NTkzMDEgMzMuMDc3MzE3MTMgMCAxOC4yNjgwOTc5IDUuNjIyOTkxIDMzLjA3NzMxNzIgMTIuNTU5MzAxIDMzLjA3NzMxNzJ6IiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSAyNzIuNjI5IDUzLjY3KSIvPjwvZz48cGF0aCBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMjAiIGQ9Im0yNTEuNDY3MDA2IDE3My4wOTk4NDljLTIwLjIzMDA3Ni0zMy42MDk5NjktNTYuODg5NTY1LTU2LjA2NzkwOC05OC43NTU3NzYtNTYuMDY3OTA4LTQwLjcyMDc5OCAwLTc2LjUxNTg3NjYgMjEuMjQ1OTAxLTk3LjA1ODY5NTkgNTMuMzM0NTg4bTIuMTk4MTEwNyAxMjkuMTY5NTM0YzIwLjg0MDMwMzYgMzAuMjMyNzAxIDU1LjU1NTkwNDIgNTAuMDI2NTkxIDk0Ljg2MDU4NTIgNTAuMDI2NTkxIDM5LjM3NjA5OSAwIDc0LjE0NjQyNC0xOS44NjU4ODcgOTQuOTc0MDQ5LTUwLjE5MTQ5NSIgbWFzaz0idXJsKCNhKSIgdHJhbnNmb3JtPSJtYXRyaXgoMSAwIDAgLTEgLjk1OCA0MDQpIi8+PC9nPjxnPjxnIGZpbGw9IiMwMDAiIG1hc2s9InVybCgjYikiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC45NTggLTUxKSI+PHBhdGggZD0ibTIwMy40NjA2NzYgOTUuNjg3NTQyNWM2LjkzNjMxIDAgMTIuNTU5MzAxLTE0LjgwOTIxOTQgMTIuNTU5MzAxLTMzLjA3NzMxNzJzLTUuNjIyOTkxLTMzLjA3NzMxNzItMTIuNTU5MzAxLTMzLjA3NzMxNzJjLTYuOTM2MzExIDAtMTIuNTU5MzAxIDE0LjgwOTIxOTQtMTIuNTU5MzAxIDMzLjA3NzMxNzJzNS42MjI5OSAzMy4wNzczMTcyIDEyLjU1OTMwMSAzMy4wNzczMTcyeiIgdHJhbnNmb3JtPSJyb3RhdGUoMzUgMTQxLjgzMSAxNTAuMzIpIi8+PHBhdGggZD0ibTMwLjE0MjMyMjMgOTUuNjg3NTQyNWM2LjkzNjMxMDQgMCAxMi41NTkzMDEtMTQuODA5MjE5NCAxMi41NTkzMDEtMzMuMDc3MzE3MnMtNS42MjI5OTA2LTMzLjA3NzMxNzItMTIuNTU5MzAxLTMzLjA3NzMxNzItMTIuNTU5MzAwOSAxNC44MDkyMTk0LTEyLjU1OTMwMDkgMzMuMDc3MzE3MiA1LjYyMjk5MDUgMzMuMDc3MzE3MiAxMi41NTkzMDA5IDMzLjA3NzMxNzJ6IiB0cmFuc2Zvcm09InNjYWxlKC0xIDEpIHJvdGF0ZSgzNSAtMTAwLjc5MiAtNjkuNDg4KSIvPjxwYXRoIGQ9Im0xMTYuNzMyODE1IDY2LjI3NTI2NzZjNi45MzYzMTEgMCAxMi41NTkzMDEtMTQuODA5MjE5MyAxMi41NTkzMDEtMzMuMDc3MzE3MiAwLTE4LjI2ODA5NzgtNS42MjI5OS0zMy4wNzczMTcxMy0xMi41NTkzMDEtMzMuMDc3MzE3MTMtNi45MzYzMSAwLTEyLjU1OTMwMSAxNC44MDkyMTkzMy0xMi41NTkzMDEgMzMuMDc3MzE3MTMgMCAxOC4yNjgwOTc5IDUuNjIyOTkxIDMzLjA3NzMxNzIgMTIuNTU5MzAxIDMzLjA3NzMxNzJ6IiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSAyNzIuNjI5IDUxLjIxMSkiLz48L2c+PHBhdGggc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjIwIiBkPSJtMjUxLjQ2NzAwNiAxNzAuNjQwMzljLTIwLjIzMDA3Ni0zMy42MDk5NjktNTYuODg5NTY1LTU2LjA2NzkwOC05OC43NTU3NzYtNTYuMDY3OTA4LTQwLjcyMDc5OCAwLTc2LjUxNTg3NjYgMjEuMjQ1OS05Ny4wNTg2OTU5IDUzLjMzNDU4N20yLjE5ODExMDcgMTI5LjE2OTUzNGMyMC44NDAzMDM2IDMwLjIzMjcwMiA1NS41NTU5MDQyIDUwLjAyNjU5MSA5NC44NjA1ODUyIDUwLjAyNjU5MSAzOS4zNzYwOTkgMCA3NC4xNDY0MjQtMTkuODY1ODg2IDk0Ljk3NDA0OS01MC4xOTE0OTQiIG1hc2s9InVybCgjYikiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC45NTggLTUxKSIvPjwvZz48L2c+PC9zdmc+Cg==',
              introduction:
                'Content in the Helm Chart Catalog is defined by **HelmChartRepository** and **ProjectHelmChartRepository** CRs. Both CRs provide a URL and are used to populate the available Helm Charts in the Developer Catalog. A default **HelmChartRepository** is provided, called the **openshift-helm-charts**.\n- **HelmChartRepository** CRs which are cluster scoped and defined by users with the admin role\n- **ProjectHelmChartRepository** CRs which are namespace-scoped and defined by users with read/write access to the namespace',
              tags: ['helm'],
              tasks: [],
            },
          },
        ],
        true,
      ),
    );

    const helmCatalogTypeDescription = shallow(<HelmCatalogTypeDescription />).shallow();

    expect(
      helmCatalogTypeDescription.find('[data-test-id="namespaced-hcr-quickstart-link"]').exists(),
    ).toBe(true);
  });
});
