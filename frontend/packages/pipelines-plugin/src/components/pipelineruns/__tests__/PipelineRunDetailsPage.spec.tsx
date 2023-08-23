import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { SemVer } from 'semver';
import { DetailsPage } from '@console/internal/components/factory';
import { PipelineRunModel } from '../../../models';
import { getPipelineRunKebabActions } from '../../../utils/pipeline-actions';
import * as hookUtils from '../../pipelines/hooks';
import TaskRuns from '../detail-page-tabs/TaskRuns';
import PipelineRunEvents from '../events/PipelineRunEvents';
import PipelineRunDetailsPage from '../PipelineRunDetailsPage';
import * as triggerHooksModule from '../triggered-by/hooks';

const menuActions = jest.spyOn(triggerHooksModule, 'useMenuActionsWithUserAnnotation');
const breadCrumbs = jest.spyOn(hookUtils, 'useDevPipelinesBreadcrumbsFor');
type PipelineRunDetailsPageProps = React.ComponentProps<typeof PipelineRunDetailsPage>;
const i18nNS = 'public';
const i18nPipelineNS = 'pipelines-plugin';

describe('PipelineRunDetailsPage:', () => {
  let pipelineRunDetailsPageProps: PipelineRunDetailsPageProps;
  let wrapper: ShallowWrapper<PipelineRunDetailsPageProps>;
  beforeEach(() => {
    pipelineRunDetailsPageProps = {
      kind: PipelineRunModel.kind,
      kindObj: PipelineRunModel,
    };
    menuActions.mockReturnValue([getPipelineRunKebabActions(new SemVer('1.9.0'), true)]);
    breadCrumbs.mockReturnValue([{ label: 'PipelineRuns' }, { label: 'PipelineRuns Details' }]);
    wrapper = shallow(<PipelineRunDetailsPage {...pipelineRunDetailsPageProps} />);
  });

  it('Should render a DetailsPage component', () => {
    expect(wrapper.find(DetailsPage).exists()).toBe(true);
  });

  it('Should contain five tabs in the details page', () => {
    const { pages } = wrapper.props();
    expect(pages).toHaveLength(6);
  });

  it('Should contain events page', () => {
    const { pages } = wrapper.props();
    const eventPage = pages.find((page) => page.nameKey === `${i18nNS}~Events`);
    expect(eventPage).toBeDefined();
    expect(eventPage.component).toBe(PipelineRunEvents);
  });

  it('Should contain task runs page', () => {
    const { pages } = wrapper.props();

    const taskRunsPage = pages.find((page) => page.nameKey.includes('TaskRuns'));
    expect(taskRunsPage).toBeDefined();
    expect(taskRunsPage.component).toBe(TaskRuns);
  });

  it('Should contain Parameters page', () => {
    const { pages } = wrapper.props();

    const parametersPage = pages.find((page) => page.nameKey === `${i18nPipelineNS}~Parameters`);
    expect(parametersPage).toBeDefined();
  });
});
