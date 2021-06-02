import * as React from 'react';
import { Title, WizardNavItem } from '@patternfly/react-core';
import { shallow, ShallowWrapper } from 'enzyme';
import { QuickStartTaskStatus } from '../../utils/quick-start-types';
import QuickStartTaskHeader from '../QuickStartTaskHeader';

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
    ).toBe(1);
    expect(
      wrapper
        .find(WizardNavItem)
        .dive()
        .find('[data-test-id="quick-start-task-subtitle"]')
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
        .find('[data-test-id="quick-start-task-subtitle"]')
        .exists(),
    ).toBe(false);
  });
});
