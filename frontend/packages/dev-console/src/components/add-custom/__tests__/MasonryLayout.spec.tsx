import * as React from 'react';
import { shallow } from 'enzyme';
import Measure, { ContentRect } from 'react-measure';
import AddCardSectionSkeleton from '../AddCardSectionSkeleton';
import { Masonry } from '../layout/Masonry';
import { MasonryLayout } from '../layout/MasonryLayout';

describe('Masonry Layout', () => {
  const getContentRect = (width: number, height: number): ContentRect => ({
    bounds: { width, height, top: 0, left: 0, bottom: 0, right: 0 },
  });

  it('should render loading component if loading is true and LoadingComponent is defined', () => {
    const wrapper = shallow(
      <MasonryLayout columnWidth={300} loading LoadingComponent={AddCardSectionSkeleton}>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
        <div>Child 4</div>
        <div>Child 5</div>
      </MasonryLayout>,
    );
    wrapper.find(Measure).prop('onResize')(getContentRect(1400, 900));

    // Should show 4 columns (Math.floor(1400 / 300))
    expect(
      wrapper
        .dive()
        .dive()
        .find(Masonry)
        .prop('columnCount'),
    ).toBe(4);
    // Should render 4 placeholders
    expect(
      wrapper
        .dive()
        .dive()
        .find(Masonry)
        .find(AddCardSectionSkeleton),
    ).toHaveLength(4);
  });

  it('should render children if loading is false', () => {
    const wrapper = shallow(
      <MasonryLayout columnWidth={300}>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
        <div>Child 4</div>
        <div>Child 5</div>
      </MasonryLayout>,
    );
    wrapper.find(Measure).prop('onResize')(getContentRect(1400, 900));

    // Should show 4 columns (Math.floor(1400 / 300))
    expect(
      wrapper
        .dive()
        .dive()
        .find(Masonry)
        .prop('columnCount'),
    ).toBe(4);
    // Should render all childrens
    expect(
      wrapper
        .dive()
        .dive()
        .find(Masonry)
        .find('div'),
    ).toHaveLength(5);
  });

  it('should change columns if a resize event exceeds threshold', () => {
    const wrapper = shallow(
      <MasonryLayout columnWidth={300}>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
        <div>Child 4</div>
        <div>Child 5</div>
      </MasonryLayout>,
    );
    wrapper.find(Measure).prop('onResize')(getContentRect(1200, 800));
    // Should show 4 columns and all childrens, see test above.

    wrapper.find(Measure).prop('onResize')(getContentRect(900, 800));
    // Should show 3 columns now (Math.floor(900 / 300))
    expect(
      wrapper
        .dive()
        .dive()
        .find(Masonry)
        .prop('columnCount'),
    ).toBe(3);
  });

  it('should not change columns if a resize event does not exceed threshold', () => {
    const wrapper = shallow(
      <MasonryLayout columnWidth={300}>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
        <div>Child 4</div>
        <div>Child 5</div>
      </MasonryLayout>,
    );
    wrapper.find(Measure).prop('onResize')(getContentRect(1200, 800));
    // Should show 4 columns and all childrens, see test above.

    wrapper.find(Measure).prop('onResize')(getContentRect(1190, 800));
    // Should still show 4 columns because new width does not exceed threshold
    expect(
      wrapper
        .dive()
        .dive()
        .find(Masonry)
        .prop('columnCount'),
    ).toBe(4);
  });
});
