import * as React from 'react';
import { act } from '@testing-library/react';
import { mount, ReactWrapper } from 'enzyme';
import { Provider } from 'react-redux';
import { Router } from 'react-router-dom';
import { SemVer } from 'semver';
import * as rbacModule from '@console/dynamic-plugin-sdk/src/app/components/utils/rbac';
import useActivePerspective from '@console/dynamic-plugin-sdk/src/perspective/useActivePerspective';
import { ErrorPage404 } from '@console/internal/components/error';
import { DetailsPage } from '@console/internal/components/factory/';
import { history, LoadingBox } from '@console/internal/components/utils';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { referenceForModel } from '@console/internal/module/k8s';
import store from '@console/internal/redux';
import { PipelineModel } from '../../../models';
import { pipelineTestData, PipelineExampleNames } from '../../../test-data/pipeline-data';
import {
  sampleTektonConfig,
  sampleTektonConfigMetrics,
} from '../../../test-data/tekon-config-data';
import { PipelineRunKind } from '../../../types';
import { getPipelineKebabActions } from '../../../utils/pipeline-actions';
import * as triggerHooksModule from '../../pipelineruns/triggered-by/hooks';
import { PipelineMetricsLevel } from '../const';
import * as hookUtils from '../hooks';
import { MetricsQueryPrefix } from '../pipeline-metrics/pipeline-metrics-utils';
import PipelineDetailsPage from '../PipelineDetailsPage';
import * as configUtils from '../utils/pipeline-config';
import * as operatorUtils from '../utils/pipeline-operator';
import * as triggerUtils from '../utils/triggers';

const menuActions = jest.spyOn(triggerHooksModule, 'useMenuActionsWithUserAnnotation');
const breadCrumbs = jest.spyOn(hookUtils, 'usePipelinesBreadcrumbsFor');
const templateNames = jest.spyOn(triggerUtils, 'usePipelineTriggerTemplateNames');
const latestPipelineRun = jest.spyOn(hookUtils, 'useLatestPipelineRun');
const operatorVersion = jest.spyOn(operatorUtils, 'usePipelineOperatorVersion');
const spyUseAccessReview = jest.spyOn(rbacModule, 'useAccessReview');
const spyPipelineConfig = jest.spyOn(configUtils, 'usePipelineConfig');

const useActivePerspectiveMock = useActivePerspective as jest.Mock;

jest.mock('@console/internal/components/utils/k8s-get-hook', () => ({
  useK8sGet: jest.fn(),
}));

jest.mock('@console/dynamic-plugin-sdk/src/perspective/useActivePerspective', () => ({
  default: jest.fn(),
}));

jest.mock('@console/internal/components/utils/firehose', () => ({
  ...require.requireActual('@console/internal/components/utils/firehose'),
  Firehose: ({ children }) => children,
}));

type PipelineDetailsPageProps = React.ComponentProps<typeof PipelineDetailsPage>;
const mockData = pipelineTestData[PipelineExampleNames.SIMPLE_PIPELINE];
const pipelineRuns: PipelineRunKind[] = Object.values(mockData.pipelineRuns);
const {
  metadata: { name: pipelineName, namespace },
} = mockData.pipeline;

describe('PipelineDetailsPage:', () => {
  let PipelineDetailsPageProps: PipelineDetailsPageProps;
  beforeEach(() => {
    PipelineDetailsPageProps = {
      kind: PipelineModel.kind,
      kindObj: PipelineModel,
      match: {
        isExact: true,
        path: `/k8s/ns/${namespace}/${referenceForModel(PipelineModel)}/${pipelineName}`,
        url: `k8s/ns/${namespace}/${referenceForModel(PipelineModel)}/${pipelineName}`,
        params: {
          ns: namespace,
        },
      },
    };
    menuActions.mockReturnValue(getPipelineKebabActions(pipelineRuns[0], true));
    breadCrumbs.mockReturnValue([{ label: 'Pipelines' }, { label: 'Pipeline Details' }]);
    templateNames.mockReturnValue([]);
    latestPipelineRun.mockReturnValue(null);
    (useK8sGet as jest.Mock).mockReturnValue([mockData.pipeline, true, null]);
    useActivePerspectiveMock.mockClear();
    ((operatorVersion as unknown) as jest.Mock).mockReturnValue(new SemVer('1.6.2'));
    spyPipelineConfig.mockReturnValue([sampleTektonConfig]);
    spyUseAccessReview.mockReturnValue([true]);
  });
  const renderPipelineDetailsPage = async () => {
    let wrapper: ReactWrapper;
    await act(
      async () =>
        (wrapper = mount(
          <Router history={history}>
            <Provider store={store}>
              <PipelineDetailsPage {...PipelineDetailsPageProps} />
            </Provider>
          </Router>,
        )),
    );
    return wrapper;
  };

  it('should render the Details Page if the pipeline is loaded and available', async () => {
    (useK8sGet as jest.Mock).mockReturnValue([mockData.pipeline, true, null]);
    useActivePerspectiveMock.mockReturnValue(['dev', () => {}]);
    const wrapper: ReactWrapper = await renderPipelineDetailsPage();
    expect(wrapper.find(DetailsPage).exists()).toBe(true);
  });

  it('should render the loading box if the pipeline is not loaded yet', async () => {
    (useK8sGet as jest.Mock).mockReturnValue([[], false, null]);
    const wrapper: ReactWrapper = await renderPipelineDetailsPage();
    expect(wrapper.find(LoadingBox).exists()).toBe(true);
  });

  it('should render the ErrorPage404 if the pipeline is not found', async () => {
    (useK8sGet as jest.Mock).mockReturnValue([[], true, { response: { status: 404 } }]);
    const wrapper: ReactWrapper = await renderPipelineDetailsPage();
    expect(wrapper.find(ErrorPage404).exists()).toBe(true);
  });

  it('should have the latest metrics endpoint as default queryPrefix', async () => {
    (useK8sGet as jest.Mock).mockReturnValue([mockData.pipeline, true, null]);
    const wrapper: ReactWrapper = await renderPipelineDetailsPage();
    expect(wrapper.find(DetailsPage).props().customData.queryPrefix).toBe(
      MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER,
    );
  });

  it('should use the new metrics endpoint if the pipeline operator is greater than 1.4.0', async () => {
    (useK8sGet as jest.Mock).mockReturnValue([mockData.pipeline, true, null]);
    ((operatorVersion as unknown) as jest.Mock).mockReturnValue(new SemVer('1.8.0'));
    const wrapper: ReactWrapper = await renderPipelineDetailsPage();
    expect(wrapper.find(DetailsPage).props().customData.queryPrefix).toBe(
      MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER,
    );
  });

  it('should use the old metrics endpoint if the pipeline operator is less than 1.4.0', async () => {
    (useK8sGet as jest.Mock).mockReturnValue([mockData.pipeline, true, null]);
    ((operatorVersion as unknown) as jest.Mock).mockReturnValue(new SemVer('1.2.1'));
    const wrapper: ReactWrapper = await renderPipelineDetailsPage();
    expect(wrapper.find(DetailsPage).props().customData.queryPrefix).toBe(
      MetricsQueryPrefix.TEKTON,
    );
  });

  it('should not contain Start last run menu item if the pipeline run is not present', async () => {
    menuActions.mockReturnValue(getPipelineKebabActions(null, false));
    const wrapper: ReactWrapper = await renderPipelineDetailsPage();
    const menuItems: any = wrapper.find(DetailsPage).props().menuActions;
    const startLastRun = menuItems.find(
      (menu) =>
        menu(PipelineModel, mockData.pipeline).labelKey === 'pipelines-plugin~Start last run',
    );
    expect(startLastRun).toBeUndefined();
  });

  it('should contain Start last run menu item if the pipeline run is present', async () => {
    menuActions.mockReturnValue(getPipelineKebabActions(pipelineRuns[0], false));
    const wrapper: ReactWrapper = await renderPipelineDetailsPage();

    const menuItems: any = wrapper.find(DetailsPage).props().menuActions;
    const startLastRun = menuItems.find(
      (menu) =>
        menu(PipelineModel, mockData.pipeline).labelKey === 'pipelines-plugin~Start last run',
    );
    expect(startLastRun).toBeDefined();
  });

  describe('Pipeline Details page Metrics Tab:', () => {
    test('It should contain metrics tab if the user has view permission in the openshift pipelines namespace', async () => {
      const wrapper: ReactWrapper = await renderPipelineDetailsPage();
      const tabs = wrapper.find(DetailsPage).props().pages;
      const metricsTab = tabs.find((t) => t.nameKey === 'pipelines-plugin~Metrics');

      expect(tabs).toHaveLength(5);
      expect(metricsTab).toBeDefined();
    });

    test('It should contain metrics tab if the user has permission and osp 1.5.2 is installed', async () => {
      spyUseAccessReview.mockReturnValue([true]);
      ((operatorVersion as unknown) as jest.Mock).mockReturnValue(new SemVer('1.5.2'));
      spyPipelineConfig.mockReturnValue([
        sampleTektonConfigMetrics[PipelineMetricsLevel.UNSIMPLIFIED_METRICS_LEVEL],
      ]);
      const wrapper: ReactWrapper = await renderPipelineDetailsPage();
      const tabs = wrapper.find(DetailsPage).props().pages;
      const metricsTab = tabs.find((t) => t.nameKey === 'pipelines-plugin~Metrics');

      expect(tabs).toHaveLength(5);
      expect(metricsTab).toBeDefined();
    });
  });
});
