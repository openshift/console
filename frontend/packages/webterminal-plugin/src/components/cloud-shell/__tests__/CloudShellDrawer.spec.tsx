import { shallow } from 'enzyme';
import { Drawer } from '@console/shared';
import CloseButton from '@console/shared/src/components/close-button';
import CloudShellDrawer from '../CloudShellDrawer';

jest.mock('@console/shared/src/hooks/useTelemetry', () => ({
  useTelemetry: () => {},
}));

describe('CloudShellDrawerComponent', () => {
  it('should render children as Drawer children when present', () => {
    const wrapper = shallow(
      <CloudShellDrawer onClose={() => null}>
        <p data-test="terminal-content">Terminal content</p>
      </CloudShellDrawer>,
    );
    expect(wrapper.find(Drawer).children().find('[data-test="terminal-content"]').text()).toEqual(
      'Terminal content',
    );
  });

  it('should call onClose when clicked on close button', () => {
    const onClose = jest.fn();
    const wrapper = shallow(
      <CloudShellDrawer onClose={onClose}>
        <p>Terminal content</p>
      </CloudShellDrawer>,
    );
    const closeButton = wrapper.find(Drawer).shallow().find(CloseButton);
    expect(closeButton.props().ariaLabel).toEqual('Close terminal');
    closeButton.simulate('click');
    expect(onClose).toHaveBeenCalled();
  });
});
