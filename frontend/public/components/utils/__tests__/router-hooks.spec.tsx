import { renderHook, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom-v5-compat';
import { useQueryParamsMutator } from '../router';

describe('useQueryParamsMutator', () => {
  const wrapper = ({ children, initialEntries = ['/test?existing=value#hash'] }) => (
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/test" element={children} />
      </Routes>
    </MemoryRouter>
  );

  describe('getQueryArgument', () => {
    it('should get existing query argument', () => {
      const { result } = renderHook(() => useQueryParamsMutator(), { wrapper });

      expect(result.current.getQueryArgument('existing')).toBe('value');
    });

    it('should return null for non-existent query argument', () => {
      const { result } = renderHook(() => useQueryParamsMutator(), { wrapper });

      expect(result.current.getQueryArgument('nonexistent')).toBeNull();
    });
  });

  describe('setQueryArgument', () => {
    it('should set a new query argument', () => {
      const { result } = renderHook(() => useQueryParamsMutator(), { wrapper });

      act(() => {
        result.current.setQueryArgument('newParam', 'newValue');
      });

      expect(result.current.getQueryArgument('newParam')).toBe('newValue');
    });

    it('should update existing query argument', () => {
      const { result } = renderHook(() => useQueryParamsMutator(), { wrapper });

      act(() => {
        result.current.setQueryArgument('existing', 'updated');
      });

      expect(result.current.getQueryArgument('existing')).toBe('updated');
    });

    it('should remove query argument when value is empty string', () => {
      const { result } = renderHook(() => useQueryParamsMutator(), { wrapper });

      act(() => {
        result.current.setQueryArgument('existing', '');
      });

      expect(result.current.getQueryArgument('existing')).toBeNull();
    });

    it('should not update if value is unchanged', () => {
      const { result } = renderHook(() => useQueryParamsMutator(), { wrapper });
      const initialValue = result.current.getQueryArgument('existing');

      act(() => {
        result.current.setQueryArgument('existing', 'value');
      });

      expect(result.current.getQueryArgument('existing')).toBe(initialValue);
    });

    it('should preserve other query parameters', () => {
      const customWrapper = ({ children }) => (
        <MemoryRouter initialEntries={['/test?param1=value1&param2=value2']}>
          <Routes>
            <Route path="/test" element={children} />
          </Routes>
        </MemoryRouter>
      );

      const { result } = renderHook(() => useQueryParamsMutator(), {
        wrapper: customWrapper,
      });

      act(() => {
        result.current.setQueryArgument('param3', 'value3');
      });

      expect(result.current.getQueryArgument('param1')).toBe('value1');
      expect(result.current.getQueryArgument('param2')).toBe('value2');
      expect(result.current.getQueryArgument('param3')).toBe('value3');
    });
  });

  describe('setQueryArguments', () => {
    it('should set multiple query arguments', () => {
      const { result } = renderHook(() => useQueryParamsMutator(), { wrapper });

      act(() => {
        result.current.setQueryArguments({ param1: 'val1', param2: 'val2' });
      });

      expect(result.current.getQueryArgument('param1')).toBe('val1');
      expect(result.current.getQueryArgument('param2')).toBe('val2');
    });

    it('should preserve existing parameters not in update', () => {
      const { result } = renderHook(() => useQueryParamsMutator(), { wrapper });

      act(() => {
        result.current.setQueryArguments({ newParam: 'newValue' });
      });

      expect(result.current.getQueryArgument('existing')).toBe('value');
      expect(result.current.getQueryArgument('newParam')).toBe('newValue');
    });

    it('should not update if all values are unchanged', () => {
      const { result } = renderHook(() => useQueryParamsMutator(), { wrapper });
      const initialValue = result.current.getQueryArgument('existing');

      act(() => {
        result.current.setQueryArguments({ existing: 'value' });
      });

      expect(result.current.getQueryArgument('existing')).toBe(initialValue);
    });
  });

  describe('setAllQueryArguments', () => {
    it('should replace all query arguments', () => {
      const { result } = renderHook(() => useQueryParamsMutator(), { wrapper });

      act(() => {
        result.current.setAllQueryArguments({ only: 'this', remains: 'true' });
      });

      expect(result.current.getQueryArgument('existing')).toBeNull();
      expect(result.current.getQueryArgument('only')).toBe('this');
      expect(result.current.getQueryArgument('remains')).toBe('true');
    });

    it('should not update if all values are unchanged', () => {
      const { result } = renderHook(() => useQueryParamsMutator(), { wrapper });
      const initialValue = result.current.getQueryArgument('existing');

      act(() => {
        result.current.setAllQueryArguments({ existing: 'value' });
      });

      expect(result.current.getQueryArgument('existing')).toBe(initialValue);
    });
  });

  describe('removeQueryArgument', () => {
    it('should remove existing query argument', () => {
      const { result } = renderHook(() => useQueryParamsMutator(), { wrapper });

      act(() => {
        result.current.removeQueryArgument('existing');
      });

      expect(result.current.getQueryArgument('existing')).toBeNull();
    });

    it('should do nothing if argument does not exist', () => {
      const { result } = renderHook(() => useQueryParamsMutator(), { wrapper });

      act(() => {
        result.current.removeQueryArgument('nonexistent');
      });

      // Should not throw or cause issues
      expect(result.current.getQueryArgument('existing')).toBe('value');
    });
  });

  describe('removeQueryArguments', () => {
    it('should remove multiple query arguments', () => {
      const customWrapper = ({ children }) => (
        <MemoryRouter initialEntries={['/test?param1=value1&param2=value2&param3=value3']}>
          <Routes>
            <Route path="/test" element={children} />
          </Routes>
        </MemoryRouter>
      );

      const { result } = renderHook(() => useQueryParamsMutator(), {
        wrapper: customWrapper,
      });

      act(() => {
        result.current.removeQueryArguments('param1', 'param2');
      });

      expect(result.current.getQueryArgument('param1')).toBeNull();
      expect(result.current.getQueryArgument('param2')).toBeNull();
      expect(result.current.getQueryArgument('param3')).toBe('value3');
    });

    it('should handle removing non-existent arguments', () => {
      const { result } = renderHook(() => useQueryParamsMutator(), { wrapper });

      act(() => {
        result.current.removeQueryArguments('nonexistent1', 'nonexistent2');
      });

      expect(result.current.getQueryArgument('existing')).toBe('value');
    });
  });

  describe('setOrRemoveQueryArgument', () => {
    it('should set query argument when value is truthy', () => {
      const { result } = renderHook(() => useQueryParamsMutator(), { wrapper });

      act(() => {
        result.current.setOrRemoveQueryArgument('newParam', 'newValue');
      });

      expect(result.current.getQueryArgument('newParam')).toBe('newValue');
    });

    it('should remove query argument when value is empty string', () => {
      const { result } = renderHook(() => useQueryParamsMutator(), { wrapper });

      act(() => {
        result.current.setOrRemoveQueryArgument('existing', '');
      });

      expect(result.current.getQueryArgument('existing')).toBeNull();
    });

    it('should remove query argument when value is falsy', () => {
      const customWrapper = ({ children }) => (
        <MemoryRouter initialEntries={['/test?param=value']}>
          <Routes>
            <Route path="/test" element={children} />
          </Routes>
        </MemoryRouter>
      );

      const { result } = renderHook(() => useQueryParamsMutator(), {
        wrapper: customWrapper,
      });

      act(() => {
        result.current.setOrRemoveQueryArgument('param', '');
      });

      expect(result.current.getQueryArgument('param')).toBeNull();
    });
  });
});
