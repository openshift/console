import * as React from 'react';
import { shallow } from 'enzyme';
import { referenceForModel } from '@console/internal/module/k8s';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { DetailsPage } from '@console/internal/components/factory/';
import { LoadingBox } from '@console/internal/components/utils';
import { ErrorPage404 } from '@console/internal/components/error';
import { pipelineTestData, PipelineExampleNames } from '../../../test-data/pipeline-data';
import { getPipelineKebabActions } from '../../../utils/pipeline-actions';
import { PipelineRun } from '../../../utils/pipeline-augment';
import { PipelineModel } from '../../../models';
import * as utils from '../../pipelineruns/triggered-by';
import * as hookUtils from '../hooks';
import PipelineDetailsPage from '../PipelineDetailsPage';
import * as triggerUtils from '../utils/triggers';

const menuActions = jest.spyOn(utils, 'useMenuActionsWithUserAnnotation');
const breadCrumbs = jest.spyOn(hookUtils, 'usePipelinesBreadcrumbsFor');
const templateNames = jest.spyOn(triggerUtils, 'usePipelineTriggerTemplateNames');
const latestPipelineRun = jest.spyOn(hookUtils, 'useLatestPipelineRun');

jest.mock('@console/internal/components/utils/k8s-get-hook', () => ({
  useK8sGet: jest.fn(),
}));

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

type PipelineDetailsPageProps = React.ComponentProps<typeof PipelineDetailsPage>;
const mockData = pipelineTestData[PipelineExampleNames.SIMPLE_PIPELINE];
const pipelineRuns: PipelineRun[] = Object.values(mockData.pipelineRuns);
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
  });

  it('should render the Details Page if the pipeline is loaded and available', () => {
    (useK8sGet as jest.Mock).mockReturnValue([mockData.pipeline, true, null]);
    const wrapper = shallow(<PipelineDetailsPage {...PipelineDetailsPageProps} />);
    expect(wrapper.find(DetailsPage).exists()).toBe(true);
  });

  it('should render the loading box if the pipeline is not loaded yet', () => {
    (useK8sGet as jest.Mock).mockReturnValue([[], false, null]);
    const wrapper = shallow(<PipelineDetailsPage {...PipelineDetailsPageProps} />);
    expect(wrapper.find(LoadingBox).exists()).toBe(true);
  });

  it('should render the ErrorPage404 if the pipeline is not found', () => {
    (useK8sGet as jest.Mock).mockReturnValue([[], true, { response: { status: 404 } }]);
    const wrapper = shallow(<PipelineDetailsPage {...PipelineDetailsPageProps} />);
    expect(wrapper.find(ErrorPage404).exists()).toBe(true);
  });

  it('should not contain Start last run menu item if the pipeline run is not present', () => {
    menuActions.mockReturnValue(getPipelineKebabActions(null, false));
    const wrapper = shallow(<PipelineDetailsPage {...PipelineDetailsPageProps} />);
    const menuItems = wrapper.props().menuActions;
    const startLastRun = menuItems.find(
      (menu) =>
        menu(PipelineModel, mockData.pipeline).labelKey === 'pipelines-plugin~Start Last Run',
    );
    expect(startLastRun).toBeUndefined();
  });

  it('should contain Start last run menu item if the pipeline run is present', () => {
    menuActions.mockReturnValue(getPipelineKebabActions(pipelineRuns[0], false));
    const wrapper = shallow(<PipelineDetailsPage {...PipelineDetailsPageProps} />);
    const menuItems = wrapper.props().menuActions;
    const startLastRun = menuItems.find(
      (menu) =>
        menu(PipelineModel, mockData.pipeline).labelKey === 'pipelines-plugin~Start Last Run',
    );
    expect(startLastRun).toBeDefined();
  });
});
