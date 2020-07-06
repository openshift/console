import * as React from 'react';
import { shallow } from 'enzyme';
import Cell from '../Cell';
import { RenderHeader, RenderCell } from '../types';
import { GridCellProps, CellMeasurer } from 'react-virtualized';
import { IDEAL_SPACE_BW_TILES } from '../const';

describe('Grid-cell', () => {
  let data: GridCellProps;
  let renderHeader: RenderHeader;
  let renderCell: RenderCell;

  beforeEach(() => {
    data = {
      key: 'unique-key',
      columnIndex: 0,
      rowIndex: 0,
      style: {
        height: 50,
        width: 50,
        top: 60,
        left: 60,
        position: 'absolute',
      },
      isScrolling: false,
      isVisible: false,
      parent: null,
    };
    renderHeader = jest.fn();
    renderCell = jest.fn();
  });

  it('should return null when item is null', () => {
    const wrapper = shallow(
      <Cell data={data} renderCell={renderCell} columnCount={1} items={[null]} />,
    );
    expect(wrapper.isEmptyRender()).toBeTruthy();
  });

  it('should render cellMeasurer when item is not null', () => {
    const wrapper = shallow(
      <Cell data={data} renderCell={renderCell} columnCount={1} items={[{}]} />,
    );
    expect(wrapper.find(CellMeasurer)).toHaveLength(1);
  });

  it('should render header and not the cell when item is string and height should not be changed', () => {
    const wrapper = shallow(
      <Cell
        data={data}
        renderCell={renderCell}
        columnCount={1}
        items={['string']}
        renderHeader={renderHeader}
      />,
    );
    expect(wrapper.find('div').prop('style').height).toBe(50);
    expect(wrapper.find('div').prop('style').width).toBe('100%');
    expect(renderHeader).toHaveBeenCalledWith('string');
    expect(renderCell).not.toHaveBeenCalled();
  });

  it('should render Cell and not the Header when item is neither string nor null and height should be changed', () => {
    const item = { id: 1 };
    const wrapper = shallow(
      <Cell data={data} renderCell={renderCell} columnCount={1} items={[item]} />,
    );
    expect(wrapper.find('div').prop('style').height).toBe(50 - IDEAL_SPACE_BW_TILES);
    expect(wrapper.find('div').prop('style').width).toBe(50 - IDEAL_SPACE_BW_TILES);
    expect(renderCell).toHaveBeenCalledWith(item);
    expect(renderHeader).not.toHaveBeenCalled();
  });
});
