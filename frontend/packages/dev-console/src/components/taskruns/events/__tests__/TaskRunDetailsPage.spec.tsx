import * as React from 'react';
import { shallow } from 'enzyme';
import { referenceForModel } from '@console/internal/module/k8s';
import { DetailsPage } from '@console/internal/components/factory';
import { TaskRunModel } from '../../../../models';
import * as hookUtils from '../../../pipelines/hooks';
import TaskRunDetailsPage from '../../TaskRunDetailsPage';
import TaskRunEvents from '../TaskRunEvents';

const breadCrumbs = jest.spyOn(hookUtils, 'useTasksBreadcrumbsFor');
type TaskRunDetailsPageProps = React.ComponentProps<typeof TaskRunDetailsPage>;

describe('TaskRunDetailsPage:', () => {
  let taskRunDetailsPageProps: TaskRunDetailsPageProps;
  beforeEach(() => {
    taskRunDetailsPageProps = {
      kind: TaskRunModel.kind,
      kindObj: TaskRunModel,
      match: {
        isExact: true,
        path: `/k8s/ns/:ns/${referenceForModel(TaskRunModel)}/events`,
        url: `k8s/ns/rhd-test/${referenceForModel(TaskRunModel)}/events`,
        params: {
          ns: 'rhd-test',
        },
      },
    };
    breadCrumbs.mockReturnValue([{ label: 'TaskRuns' }, { label: 'TaskRuns Details' }]);
  });

  it('Should render a DetailsPage component', () => {
    const wrapper = shallow(<TaskRunDetailsPage {...taskRunDetailsPageProps} />);
    expect(wrapper.find(DetailsPage).exists()).toBe(true);
  });

  it('Should contain three tabs in the Details Page', () => {
    const wrapper = shallow(<TaskRunDetailsPage {...taskRunDetailsPageProps} />);
    const { pages } = wrapper.props();
    expect(pages).toHaveLength(3);
  });

  it('Should contain events page', () => {
    const wrapper = shallow(<TaskRunDetailsPage {...taskRunDetailsPageProps} />);
    const { pages } = wrapper.props();
    const eventPage = pages.find((page) => page.name === 'Events');
    expect(eventPage).toBeDefined();
    expect(eventPage.component).toBe(TaskRunEvents);
  });
});
