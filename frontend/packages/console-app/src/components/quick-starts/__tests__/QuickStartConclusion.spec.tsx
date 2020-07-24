import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { Button } from '@patternfly/react-core';
import { getQuickStart } from '../utils/quick-start-utils';
import { TaskStatus } from '../utils/quick-start-status';
import QuickStartConclusion from '../QuickStartConclusion';

type QuickStartConclusionProps = React.ComponentProps<typeof QuickStartConclusion>;
let wrapper: ShallowWrapper<QuickStartConclusionProps>;
const props: QuickStartConclusionProps = {
  tasks: getQuickStart('serverless-explore').tasks,
  taskStatus: [TaskStatus.INIT, TaskStatus.INIT, TaskStatus.INIT],
  conclusion: 'conclusion',
  onTaskSelect: jest.fn(),
};

describe('QuickStartConclusion', () => {
  beforeEach(() => {
    wrapper = shallow(<QuickStartConclusion {...props} />);
  });

  it('should not render link for next quick start if nextQuickStart props is available', () => {
    expect(wrapper.find(Button).length).toBe(0);
  });

  it('should render link for next quick start if nextQuickStart props is available', () => {
    wrapper = shallow(
      <QuickStartConclusion
        {...props}
        nextQuickStart="Serverless Application"
        launchNextQuickStart={jest.fn()}
      />,
    );
    expect(
      wrapper
        .find(Button)
        .at(0)
        .props().children[0],
    ).toEqual('Start Serverless Application quick start');
  });
});
