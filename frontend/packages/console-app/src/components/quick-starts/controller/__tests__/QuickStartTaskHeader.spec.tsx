import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { Title, WizardNavItem } from '@patternfly/react-core';
import QuickStartTaskHeader from '../QuickStartTaskHeader';
import { QuickStartTaskStatus } from '../../utils/quick-start-types';

type QuickStartTaskHeaderProps = React.ComponentProps<typeof QuickStartTaskHeader>;
let wrapper: ShallowWrapper<QuickStartTaskHeaderProps>;
const props: QuickStartTaskHeaderProps = {
  title: 'title',
  taskIndex: 1,
  subtitle: 'subtitle',
  taskStatus: QuickStartTaskStatus.INIT,
  size: 'lg',
  isActiveTask: true,
  onTaskSelect: jest.fn(),
};

describe('QuickStartTaskHeader', () => {
  beforeEach(() => {
    wrapper = shallow(<QuickStartTaskHeader {...props} />);
  });

  it('should render subtitle for active task', () => {
    expect(
      wrapper
        .find(WizardNavItem)
        .dive()
        .find(Title).length,
    ).toBe(2);
    expect(
      wrapper
        .find(WizardNavItem)
        .dive()
        .find(Title)
        .at(1)
        .props().children,
    ).toEqual(props.subtitle);
  });

  it('should not render subtitle if task is not active', () => {
    wrapper = shallow(<QuickStartTaskHeader {...props} isActiveTask={false} />);
    expect(
      wrapper
        .find(WizardNavItem)
        .dive()
        .find(Title).length,
    ).toBe(1);
    expect(
      wrapper
        .find(WizardNavItem)
        .dive()
        .find(Title)
        .at(0)
        .props().children[1],
    ).toEqual(props.title);
  });
});
