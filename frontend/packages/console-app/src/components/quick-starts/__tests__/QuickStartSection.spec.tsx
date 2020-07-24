import * as React from 'react';
import { Link } from 'react-router-dom';
import { shallow, ShallowWrapper } from 'enzyme';
import { Button } from '@patternfly/react-core';
import { getQuickStart } from '../utils/quick-start-utils';
import { QuickStartStatus, TaskStatus } from '../utils/quick-start-status';
import QuickStartSection from '../QuickStartSection';
import QuickStartIntroduction from '../QuickStartIntroduction';
import QuickStartTasks from '../QuickStartTasks';
import QuickStartConclusion from '../QuickStartConclusion';

type QuickStartSectionProps = React.ComponentProps<typeof QuickStartSection>;
let wrapper: ShallowWrapper<QuickStartSectionProps>;
const props: QuickStartSectionProps = {
  quickStartStatus: QuickStartStatus.NOT_STARTED,
  introduction: 'introduction',
  tasks: getQuickStart('serverless-explore').tasks,
  taskStatus: [TaskStatus.INIT, TaskStatus.INIT, TaskStatus.INIT],
  activeTaskIndex: 0,
  conclusion: 'conclusion',
  nextQuickStart: 'nextQuickStart',
  nextCallback: jest.fn(),
  prevCallback: jest.fn(),
  reviewCallback: jest.fn(),
  launchNextQuickStart: jest.fn(),
  onTaskSelect: jest.fn(),
};

describe('QuickStartSection', () => {
  beforeEach(() => {
    wrapper = shallow(<QuickStartSection {...props} />);
  });

  it('should render QuickStartIntroduction and not render secondary button when the tour status is Not Started', () => {
    expect(wrapper.find(QuickStartIntroduction).length).toBe(1);
    expect(wrapper.find(QuickStartTasks).length).toBe(0);
    expect(wrapper.find(QuickStartConclusion).length).toBe(0);
    expect(wrapper.find(Button).length).toBe(1);
    expect(
      wrapper
        .find(Button)
        .at(0)
        .props().children,
    ).toEqual('Start Tour');
    expect(wrapper.find(Link).length).toBe(0);
  });

  it('should render QuickStartTasks and secondary button when the tour status is In Progress', () => {
    wrapper = shallow(
      <QuickStartSection {...props} quickStartStatus={QuickStartStatus.IN_PROGRESS} />,
    );
    expect(wrapper.find(QuickStartIntroduction).length).toBe(0);
    expect(wrapper.find(QuickStartTasks).length).toBe(1);
    expect(wrapper.find(QuickStartConclusion).length).toBe(0);
    expect(wrapper.find(Button).length).toBe(2);
    expect(
      wrapper
        .find(Button)
        .at(0)
        .props().children,
    ).toEqual('Next');
    expect(
      wrapper
        .find(Button)
        .at(1)
        .props().children,
    ).toEqual('Back');
    expect(wrapper.find(Link).length).toBe(0);
  });

  it('should render QuickStartConclusion, secondary button and Link to QuickStartCatalog when the tour status is Complete', () => {
    wrapper = shallow(
      <QuickStartSection {...props} quickStartStatus={QuickStartStatus.COMPLETE} />,
    );
    expect(wrapper.find(QuickStartIntroduction).length).toBe(0);
    expect(wrapper.find(QuickStartTasks).length).toBe(0);
    expect(wrapper.find(QuickStartConclusion).length).toBe(1);
    expect(wrapper.find(Button).length).toBe(2);
    expect(
      wrapper
        .find(Button)
        .at(0)
        .props().children,
    ).toEqual('Close');
    expect(
      wrapper
        .find(Button)
        .at(1)
        .props().children,
    ).toEqual('Back');
    expect(wrapper.find(Link).length).toBe(1);
  });
});
