import { shallow, ShallowWrapper } from 'enzyme';
import {
  LimitRangeDetailsRowProps,
  LimitRangeDetailsRow,
} from '../../public/components/limit-range';

describe(LimitRangeDetailsRow.displayName, () => {
  let wrapper: ShallowWrapper<LimitRangeDetailsRowProps>;
  const limitContent = {
    max: '',
    min: '1',
    default: '',
    defaultRequest: '',
    maxLimitRequestRatio: '',
  };

  beforeEach(() => {
    wrapper = shallow(
      <LimitRangeDetailsRow limitType={'Container'} resource={'memory'} limit={limitContent} />,
    );
  });

  it('renders column for limit type', () => {
    const col = wrapper.childAt(0);
    expect(col.text()).toBe('Container');
  });

  it('renders column for resource type', () => {
    const col = wrapper.childAt(1);
    expect(col.text()).toBe('memory');
  });

  it('renders column for limit min', () => {
    const col = wrapper.childAt(2);
    expect(col.text()).toBe('1');
  });

  it('renders column for limit max', () => {
    const col = wrapper.childAt(3);
    expect(col.text()).toBe('-');
  });

  it('renders column for limit defaultRequest', () => {
    const col = wrapper.childAt(4);
    expect(col.text()).toBe('-');
  });

  it('renders column for limit default', () => {
    const col = wrapper.childAt(5);
    expect(col.text()).toBe('-');
  });

  it('renders column for limit maxLimitRequestRatio', () => {
    const col = wrapper.childAt(6);
    expect(col.text()).toBe('-');
  });
});
