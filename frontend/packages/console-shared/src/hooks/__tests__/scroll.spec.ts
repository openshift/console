import { ScrollDirection, getScrollDirection } from '../scroll';

describe('getScrollDirection', () => {
  it('should return scrolled to bottom', () => {
    expect(getScrollDirection(300, 500, 1000, 500)).toEqual(ScrollDirection.scrolledToBottom);
  });

  it('should return scrolled to top', () => {
    expect(getScrollDirection(500, 0, 1000, 500)).toEqual(ScrollDirection.scrolledToTop);
  });

  it('should return scrolling down', () => {
    expect(getScrollDirection(300, 400, 1000, 500)).toEqual(ScrollDirection.scrollingDown);
  });

  it('should return scrolling up', () => {
    expect(getScrollDirection(300, 200, 1000, 500)).toEqual(ScrollDirection.scrollingUp);
  });

  it('should return undefined', () => {
    expect(getScrollDirection(300, 300, 1000, 500)).toEqual(undefined);
  });
});
