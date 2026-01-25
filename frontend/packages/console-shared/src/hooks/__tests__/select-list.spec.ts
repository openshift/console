import type { FormEvent } from 'react';
import { act, renderHook } from '@testing-library/react';
import { data, visibleRows, onRowSelected } from '../__mocks__/select-list-data';
import { useSelectList } from '../select-list';

const dummyFormEvent: FormEvent<HTMLInputElement> = ({} as unknown) as FormEvent<HTMLInputElement>;

describe('useSelectList', () => {
  it('onSelect should update selectedRows properly', () => {
    const { result } = renderHook(() => useSelectList(data, visibleRows, onRowSelected));

    act(() => {
      result.current.onSelect(dummyFormEvent, true, -1, undefined, undefined);
    });
    expect(result.current.selectedRows).toEqual(visibleRows);
    act(() => {
      result.current.onSelect(dummyFormEvent, false, 1, { props: { id: '2' } }, undefined);
    });
    expect(result.current.selectedRows).toEqual(new Set(['1', '3']));
    act(() => {
      result.current.onSelect(dummyFormEvent, false, -1, undefined, undefined);
    });
    expect(result.current.selectedRows).toEqual(new Set());
  });

  it('updateSelectedRows should update selectedRows properly and call onRowSelected', () => {
    const { result } = renderHook(() => useSelectList(data, visibleRows, onRowSelected));

    act(() => {
      result.current.updateSelectedRows(data);
    });
    expect(result.current.selectedRows).toEqual(visibleRows);
    expect(onRowSelected).toHaveBeenCalled();
  });
});
