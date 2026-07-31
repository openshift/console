import { GridItem } from '@patternfly/react-core';
import { render, screen } from '@testing-library/react';
import type { OverviewGridCard } from '@console/dynamic-plugin-sdk';
import * as refWidthHook from '@console/internal/components/utils/ref-width-hook';
import DashboardGrid from '../DashboardGrid';

jest.mock('@patternfly/react-core', () => ({
  ...jest.requireActual('@patternfly/react-core'),
  GridItem: jest.fn(jest.requireActual('@patternfly/react-core').GridItem),
}));

jest.mock('@console/internal/components/utils/ref-width-hook', () => ({
  useRefWidth: jest.fn(),
}));

const createMockCards = (count: number, label: string): OverviewGridCard[] =>
  Array.from({ length: count }, (_, index) => ({
    Card: () => <div>{`${label} Card ${index + 1}`}</div>,
    span: 12,
  }));

const getLayoutGridItemSizes = () =>
  jest
    .mocked(GridItem)
    .mock.calls.filter(([{ lg }]) => lg !== undefined)
    .map(([{ lg, md, sm }]) => ({ lg, md, sm }));

const expectLayoutGridItems = (...sizes: number[]) => {
  expect(getLayoutGridItemSizes()).toEqual(sizes.map((size) => ({ lg: size, md: size, sm: size })));
};

describe('DashboardGrid', () => {
  beforeEach(() => {
    (refWidthHook.useRefWidth as jest.Mock).mockReturnValue([jest.fn(), 1200]);
    jest.mocked(GridItem).mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('when rendering with main cards only', () => {
    it('should render main cards in a 12-column grid', () => {
      const mainCards = createMockCards(2, 'Main');

      render(<DashboardGrid mainCards={mainCards} />);

      expect(screen.getByText('Main Card 1')).toBeVisible();
      expect(screen.getByText('Main Card 2')).toBeVisible();

      expectLayoutGridItems(12);
    });

    it('should not render left or right columns', () => {
      const mainCards = createMockCards(1, 'Main');

      render(<DashboardGrid mainCards={mainCards} />);

      expect(screen.queryByText('Left Card 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Right Card 1')).not.toBeInTheDocument();

      expectLayoutGridItems(12);
    });
  });

  describe('when rendering with left cards', () => {
    it('should render both main and left cards', () => {
      const mainCards = createMockCards(1, 'Main');
      const leftCards = createMockCards(1, 'Left');

      render(<DashboardGrid mainCards={mainCards} leftCards={leftCards} />);

      expect(screen.getByText('Main Card 1')).toBeVisible();
      expect(screen.getByText('Left Card 1')).toBeVisible();

      expectLayoutGridItems(3, 9);
    });
  });

  describe('when rendering with right cards', () => {
    it('should render both main and right cards', () => {
      const mainCards = createMockCards(1, 'Main');
      const rightCards = createMockCards(1, 'Right');

      render(<DashboardGrid mainCards={mainCards} rightCards={rightCards} />);

      expect(screen.getByText('Main Card 1')).toBeVisible();
      expect(screen.getByText('Right Card 1')).toBeVisible();

      expectLayoutGridItems(9, 3);
    });
  });

  describe('when rendering with left and right cards', () => {
    it('should render all three card sections', () => {
      const mainCards = createMockCards(1, 'Main');
      const leftCards = createMockCards(1, 'Left');
      const rightCards = createMockCards(1, 'Right');

      render(<DashboardGrid mainCards={mainCards} leftCards={leftCards} rightCards={rightCards} />);

      expect(screen.getByText('Main Card 1')).toBeVisible();
      expect(screen.getByText('Left Card 1')).toBeVisible();
      expect(screen.getByText('Right Card 1')).toBeVisible();

      expectLayoutGridItems(3, 6, 3);
    });
  });

  describe('when viewport is small', () => {
    beforeEach(() => {
      (refWidthHook.useRefWidth as jest.Mock).mockReturnValue([jest.fn(), 800]);
    });

    it('should render all cards stacked vertically', () => {
      const mainCards = createMockCards(1, 'Main');
      const leftCards = createMockCards(1, 'Left');
      const rightCards = createMockCards(1, 'Right');

      render(<DashboardGrid mainCards={mainCards} leftCards={leftCards} rightCards={rightCards} />);

      expect(screen.getByText('Main Card 1')).toBeVisible();
      expect(screen.getByText('Left Card 1')).toBeVisible();
      expect(screen.getByText('Right Card 1')).toBeVisible();

      expectLayoutGridItems(12, 12, 12);
    });
  });

  describe('when rendering multiple cards', () => {
    it('should render all cards in their respective sections', () => {
      const mainCards = createMockCards(3, 'Main');
      const leftCards = createMockCards(2, 'Left');

      render(<DashboardGrid mainCards={mainCards} leftCards={leftCards} />);

      expect(screen.getByText('Main Card 1')).toBeVisible();
      expect(screen.getByText('Main Card 2')).toBeVisible();
      expect(screen.getByText('Main Card 3')).toBeVisible();
      expect(screen.getByText('Left Card 1')).toBeVisible();
      expect(screen.getByText('Left Card 2')).toBeVisible();

      expectLayoutGridItems(3, 9);
    });
  });
});
