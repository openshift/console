import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import AddCardSectionSkeleton from '../AddCardSectionSkeleton';
import { Masonry } from '../layout/Masonry';
import { MasonryLayout } from '../layout/MasonryLayout';

describe('Masonry Layout', () => {
  const setWidth = (width: number) => {
    window.HTMLElement.prototype.getBoundingClientRect = () =>
      ({
        width,
      } as DOMRect);
  };

  it('should render loading component if loading is true and LoadingComponent is defined', () => {
    setWidth(1400);

    const wrapper = mount(
      <MasonryLayout columnWidth={300} loading LoadingComponent={AddCardSectionSkeleton}>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
        <div>Child 4</div>
        <div>Child 5</div>
      </MasonryLayout>,
    );

    // Should show 4 columns (Math.floor(1400 / 300))
    expect(wrapper.find(Masonry).prop('columnCount')).toBe(4);
    // Should render 4 placeholders
    expect(wrapper.find(Masonry).find(AddCardSectionSkeleton)).toHaveLength(4);
  });

  it('should render children if loading is false', () => {
    setWidth(1400);

    const wrapper = mount(
      <MasonryLayout columnWidth={300}>
        <div className="child">Child 1</div>
        <div className="child">Child 2</div>
        <div className="child">Child 3</div>
        <div className="child">Child 4</div>
        <div className="child">Child 5</div>
      </MasonryLayout>,
    );
    // Should show 4 columns (Math.floor(1400 / 300))
    expect(wrapper.find(Masonry).prop('columnCount')).toBe(4);
    // Should render all childrens
    expect(wrapper.find(Masonry).find('div.child')).toHaveLength(5);
  });

  it('should change columns if a resize event exceeds threshold', () => {
    setWidth(1200);

    const wrapper = mount(
      <MasonryLayout columnWidth={300}>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
        <div>Child 4</div>
        <div>Child 5</div>
      </MasonryLayout>,
    );

    // Should show 4 columns and all children, see test above.
    expect(wrapper.find(Masonry).prop('columnCount')).toBe(4);

    act(() => {
      setWidth(900);
      window.dispatchEvent(new Event('resize'));
    });

    wrapper.update();

    // Should show 3 columns now (Math.floor(900 / 300))
    expect(wrapper.find(Masonry).prop('columnCount')).toBe(3);
  });

  it('should not change columns if a resize event does not exceed threshold', () => {
    // Should show 4 columns and all childrens, see test above.
    setWidth(1200);
    const wrapper = mount(
      <MasonryLayout columnWidth={300}>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
        <div>Child 4</div>
        <div>Child 5</div>
      </MasonryLayout>,
    );

    // Should still show 4 columns because new width does not exceed threshold
    act(() => {
      setWidth(1190);
      window.dispatchEvent(new Event('resize'));
    });

    wrapper.update();

    expect(wrapper.find(Masonry).prop('columnCount')).toBe(4);
  });
});
