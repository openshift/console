import { shallow } from 'enzyme';
import { DraggableCore, DraggableEvent, DraggableData } from 'react-draggable';
import DraggableCoreIFrameFix from '../DraggableCoreIFrameFix';

describe('DraggableCoreIFrameFix', () => {
  it('should execute handlers and apply fix class', () => {
    const onStart = jest.fn();
    const onStop = jest.fn();
    const event = {} as DraggableEvent;
    const data = {} as DraggableData;
    const wrapper = shallow(<DraggableCoreIFrameFix onStart={onStart} onStop={onStop} />);

    wrapper.find(DraggableCore).props().onStart(event, data);
    expect(document.body.className).toBe('ocs-draggable-core-iframe-fix');

    wrapper.find(DraggableCore).props().onStop(event, data);
    expect(document.body.className).toBe('');

    expect(onStart).toHaveBeenCalledWith(event, data);
    expect(onStop).toHaveBeenCalledWith(event, data);
  });
});
