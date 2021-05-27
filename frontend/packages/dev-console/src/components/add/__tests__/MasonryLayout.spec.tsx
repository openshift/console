import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import Measure, { BoundingRect } from 'react-measure';
import AddCardSectionSkeleton from '../AddCardSectionSkeleton';
import { Masonry } from '../layout/Masonry';
import { MasonryLayout } from '../layout/MasonryLayout';

describe('Masonry Layout', () => {
  type MasonryLayoutProps = React.ComponentProps<typeof MasonryLayout>;
  let wrapper: ShallowWrapper<MasonryLayoutProps>;
  const bounds: BoundingRect = { width: 1200, height: 900, top: 0, left: 0, bottom: 0, right: 0 };

  it('should render loading component if loading is true and LoadingComponent is defined', () => {
    wrapper = shallow(
      <MasonryLayout columnWidth={300} loading LoadingComponent={AddCardSectionSkeleton}>
        {[<div key="key" />]}
      </MasonryLayout>,
    );
    wrapper.find(Measure).prop('onResize')({
      bounds,
    });
    expect(
      wrapper
        .dive()
        .dive()
        .find(Masonry)
        .find(AddCardSectionSkeleton)
        .exists(),
    ).toBe(true);
  });

  it('should render children if loading is false', () => {
    const TestChildren: React.FC = () => <div />;
    wrapper = shallow(
      <MasonryLayout columnWidth={300}>{[<TestChildren key="key" />]}</MasonryLayout>,
    );
    wrapper.find(Measure).prop('onResize')({
      bounds,
    });
    expect(
      wrapper
        .dive()
        .dive()
        .find(Masonry)
        .find(TestChildren)
        .exists(),
    ).toBe(true);
  });
});
