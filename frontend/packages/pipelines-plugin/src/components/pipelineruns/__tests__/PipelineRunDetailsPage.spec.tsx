import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { SemVer } from 'semver';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sWatchResource';
import { DetailsPage } from '@console/internal/components/factory';
import { PipelineRunModel } from '../../../models';
import { getPipelineRunKebabActions } from '../../../utils/pipeline-actions';
import * as hookUtils from '../../pipelines/hooks';
import * as taskRunUtils from '../../taskruns/useTaskRuns';
import PipelineRunEvents from '../events/PipelineRunEvents';
import PipelineRunDetailsPage from '../PipelineRunDetailsPage';
import * as triggerHooksModule from '../triggered-by/hooks';

const menuActions = jest.spyOn(triggerHooksModule, 'useMenuActionsWithUserAnnotation');
const breadCrumbs = jest.spyOn(hookUtils, 'useDevPipelinesBreadcrumbsFor');
const taskRuns = jest.spyOn(taskRunUtils, 'useTaskRuns');
type PipelineRunDetailsPageProps = React.ComponentProps<typeof PipelineRunDetailsPage>;
const i18nNS = 'public';
const i18nPipelineNS = 'pipelines-plugin';

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sWatchResource', () => ({
  useK8sWatchResource: jest.fn(),
}));

describe('PipelineRunDetailsPage:', () => {
  let pipelineRunDetailsPageProps: PipelineRunDetailsPageProps;
  let wrapper: ShallowWrapper<PipelineRunDetailsPageProps>;
  beforeEach(() => {
    pipelineRunDetailsPageProps = {
      kind: PipelineRunModel.kind,
      kindObj: PipelineRunModel,
    };
    menuActions.mockReturnValue([getPipelineRunKebabActions(new SemVer('1.9.0'), [], true)]);
    breadCrumbs.mockReturnValue([{ label: 'PipelineRuns' }, { label: 'PipelineRuns Details' }]);
    taskRuns.mockReturnValue([]);
    (useK8sWatchResource as jest.Mock).mockReturnValue([[], true]);
    wrapper = shallow(<PipelineRunDetailsPage {...pipelineRunDetailsPageProps} />);
  });

  it('Should render a DetailsPage component', () => {
    expect(wrapper.find(DetailsPage).exists()).toBe(true);
  });

  it('Should contain five tabs in the details page', () => {
    const { pages } = wrapper.props();
    expect(pages).toHaveLength(5);
  });

  it('Should contain events page', () => {
    const { pages } = wrapper.props();
    const eventPage = pages.find((page) => page.nameKey === `${i18nNS}~Events`);
    expect(eventPage).toBeDefined();
    expect(eventPage.component).toBe(PipelineRunEvents);
  });

  it('Should contain Parameters page', () => {
    const { pages } = wrapper.props();

    const parametersPage = pages.find((page) => page.nameKey === `${i18nPipelineNS}~Parameters`);
    expect(parametersPage).toBeDefined();
  });
});
