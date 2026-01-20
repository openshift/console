import { act } from '@testing-library/react';
import { testHook } from '@console/shared/src/test-utils/hooks-utils';
import { data, visibleRows, onRowSelected } from '../__mocks__/select-list-data';
import { useSelectList } from '../select-list';

describe('useSelectList', () => {
  let onSelect;
  let selectedRows;
  let updateSelectedRows;

  beforeEach(() => {
    testHook(() => {
      ({ onSelect, selectedRows, updateSelectedRows } = useSelectList(
        data,
        visibleRows,
        onRowSelected,
      ));
    });
  });

  it('onSelect should update selectedRows properly', () => {
    act(() => {
      onSelect({}, true, -1);
    });
    expect(selectedRows).toEqual(visibleRows);
    act(() => {
      onSelect({}, false, 1, { props: { id: '2' } });
    });
    expect(selectedRows).toEqual(new Set(['1', '3']));
    act(() => {
      onSelect({}, false, -1);
    });
    expect(selectedRows).toEqual(new Set());
  });

  it('updateSelectedRows should update selectedRows properly and call onRowSelected', () => {
    act(() => {
      updateSelectedRows(data);
    });
    expect(selectedRows).toEqual(visibleRows);
    expect(onRowSelected).toHaveBeenCalled();
  });
});
