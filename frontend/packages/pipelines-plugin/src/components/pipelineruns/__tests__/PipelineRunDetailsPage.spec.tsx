import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { referenceForModel } from '@console/internal/module/k8s';
import { DetailsPage } from '@console/internal/components/factory';
import { PipelineRunModel } from '../../../models';
import * as utils from '../triggered-by';
import * as hookUtils from '../../pipelines/hooks';
import PipelineRunDetailsPage from '../PipelineRunDetailsPage';
import { getPipelineRunKebabActions } from '../../../utils/pipeline-actions';
import PipelineRunEvents from '../events/PipelineRunEvents';
import TaskRuns from '../detail-page-tabs/TaskRuns';

const menuActions = jest.spyOn(utils, 'useMenuActionsWithUserAnnotation');
const breadCrumbs = jest.spyOn(hookUtils, 'usePipelinesBreadcrumbsFor');
type PipelineRunDetailsPageProps = React.ComponentProps<typeof PipelineRunDetailsPage>;

describe('PipelineRunDetailsPage:', () => {
  let pipelineRunDetailsPageProps: PipelineRunDetailsPageProps;
  let wrapper: ShallowWrapper<PipelineRunDetailsPageProps>;
  beforeEach(() => {
    pipelineRunDetailsPageProps = {
      kind: PipelineRunModel.kind,
      kindObj: PipelineRunModel,
      match: {
        isExact: true,
        path: `/k8s/ns/:ns/${referenceForModel(PipelineRunModel)}/events`,
        url: `k8s/ns/rhd-test/${referenceForModel(PipelineRunModel)}/events`,
        params: {
          ns: 'rhd-test',
        },
      },
    };
    menuActions.mockReturnValue([getPipelineRunKebabActions(true)]);
    breadCrumbs.mockReturnValue([{ label: 'PipelineRuns' }, { label: 'PipelineRuns Details' }]);
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
    const eventPage = pages.find((page) => page.name === 'Events');
    expect(eventPage).toBeDefined();
    expect(eventPage.component).toBe(PipelineRunEvents);
  });

  it('Should contain task runs page', () => {
    const { pages } = wrapper.props();
    const taskRunsPage = pages.find((page) => page.name === 'Task Runs');
    expect(taskRunsPage).toBeDefined();
    expect(taskRunsPage.component).toBe(TaskRuns);
  });
});
