import type { FC, ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { useConsoleDataViewSort } from '../useConsoleDataViewSort';

const columns: ConsoleDataViewColumn<unknown>[] = [{ id: 'name', title: 'Name' }];

// Use the browser URL so updates before a router render are included in cleanup.
const wrapper: FC<{ children: ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

const renderSort = (columnsResolved = true) =>
  renderHook(() => useConsoleDataViewSort({ columns, columnsResolved }), { wrapper });

describe('useConsoleDataViewSort cleanup', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    window.history.replaceState({}, '', '?sortBy=Missing&orderBy=desc&page=2');
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    window.history.replaceState({}, '', '/');
  });

  it('should remove invalid sort parameters', () => {
    renderSort();

    act(() => jest.runOnlyPendingTimers());

    expect(window.location.search).toBe('?page=2');
  });

  it('should preserve pagination and filter updates made before cleanup', () => {
    renderSort();
    window.history.replaceState(
      {},
      '',
      '?sortBy=Missing&orderBy=desc&page=3&perPage=20&name=pod&status=Running&status=Pending',
    );

    act(() => jest.runOnlyPendingTimers());

    expect(window.location.search).toBe(
      '?page=3&perPage=20&name=pod&status=Running&status=Pending',
    );
  });

  it('should preserve a new valid sort selected before cleanup', () => {
    renderSort();
    window.history.replaceState({}, '', '?sortBy=Name&orderBy=asc&page=3');

    act(() => jest.runOnlyPendingTimers());

    expect(window.location.search).toBe('?sortBy=Name&orderBy=asc&page=3');
  });

  it('should retain valid sort parameters', () => {
    window.history.replaceState({}, '', '?sortBy=Name&orderBy=desc&page=2');
    renderSort();

    act(() => jest.runOnlyPendingTimers());

    expect(window.location.search).toBe('?sortBy=Name&orderBy=desc&page=2');
  });

  it('should retain sort parameters until columns resolve', () => {
    renderSort(false);

    act(() => jest.runOnlyPendingTimers());

    expect(window.location.search).toBe('?sortBy=Missing&orderBy=desc&page=2');
  });
});
