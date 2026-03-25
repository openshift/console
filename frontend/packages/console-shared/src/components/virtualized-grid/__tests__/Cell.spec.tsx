import type { CSSProperties } from 'react';
import type { GridCellProps } from 'react-virtualized';
import { renderWithProviders } from '../../../test-utils/unit-test-utils';
import Cell from '../Cell';
import type { RenderHeader, RenderCell } from '../types';

// Mock CellMeasurer
jest.mock('react-virtualized', () => ({
  CellMeasurer: jest.fn(({ children }) => children),
}));

describe('Grid-cell', () => {
  let data: GridCellProps;
  let renderHeader: RenderHeader;
  let renderCell: RenderCell;
  let style: CSSProperties;

  beforeEach(() => {
    style = {
      height: 50,
      width: 50,
      top: 60,
      left: 60,
      position: 'absolute',
    };
    data = {
      key: 'unique-key',
      columnIndex: 0,
      rowIndex: 0,
      style,
      isScrolling: false,
      isVisible: false,
      parent: null,
    };
    renderHeader = jest.fn(() => <div>Header</div>);
    renderCell = jest.fn(() => <div>Cell</div>);
  });

  it('should return null when item is null', () => {
    const { container } = renderWithProviders(
      <Cell
        data={data}
        renderCell={renderCell}
        style={style}
        columnCount={1}
        rowCount={2}
        items={[null]}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render when item is not null', () => {
    const { container } = renderWithProviders(
      <Cell
        data={data}
        renderCell={renderCell}
        style={style}
        columnCount={1}
        rowCount={2}
        items={[{}]}
      />,
    );
    expect(container.firstChild).not.toBeNull();
  });

  it('should render header when item is string', () => {
    renderWithProviders(
      <Cell
        data={data}
        renderCell={renderCell}
        style={style}
        columnCount={1}
        rowCount={2}
        items={['string']}
        renderHeader={renderHeader}
      />,
    );

    expect(renderHeader).toHaveBeenCalledWith('string');
    expect(renderCell).not.toHaveBeenCalled();
  });

  it('should render cell when item is an object', () => {
    const item = { id: 1 };
    renderWithProviders(
      <Cell
        data={data}
        renderCell={renderCell}
        style={style}
        columnCount={1}
        rowCount={2}
        items={[item]}
      />,
    );

    expect(renderCell).toHaveBeenCalledWith(item);
    expect(renderHeader).not.toHaveBeenCalled();
  });
});
