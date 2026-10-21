import { renderHook } from '@testing-library/react';
import { useRef } from 'react';
import type { CodeEditorRef } from '../../module/k8s';

describe('EditYAML: getEditor function', () => {
  it('should handle undefined monacoRef.current without throwing TypeError', () => {
    // This test verifies the fix for OCPBUGS-77912
    // The bug occurred when monacoRef.current was undefined and the 'in' operator was used
    const { result } = renderHook(() => useRef<CodeEditorRef>());
    const monacoRef = result.current;

    // This simulates the getEditor function from edit-yaml.tsx
    const getEditor = () =>
      monacoRef?.current && 'editor' in monacoRef.current ? monacoRef.current.editor : undefined;

    // Before the fix, this would throw: "TypeError: Cannot use 'in' operator to search for 'editor' in undefined"
    // After the fix, it should return undefined gracefully
    expect(() => getEditor()).not.toThrow();
    expect(getEditor()).toBeUndefined();
  });

  it('should return undefined when monacoRef.current exists but has no editor property', () => {
    const { result } = renderHook(() => useRef<CodeEditorRef>());
    const monacoRef = result.current;

    // Set monacoRef.current to an object without an 'editor' property
    monacoRef.current = {} as CodeEditorRef;

    const getEditor = () =>
      monacoRef?.current && 'editor' in monacoRef.current ? monacoRef.current.editor : undefined;

    expect(getEditor()).toBeUndefined();
  });

  it('should return the editor when monacoRef.current has an editor property', () => {
    const { result } = renderHook(() => useRef<CodeEditorRef>());
    const monacoRef = result.current;

    const mockEditor = { getValue: jest.fn(), setValue: jest.fn() };
    // Set monacoRef.current to an object with an 'editor' property
    monacoRef.current = { editor: mockEditor } as any;

    const getEditor = () =>
      monacoRef?.current && 'editor' in monacoRef.current ? monacoRef.current.editor : undefined;

    expect(getEditor()).toBe(mockEditor);
  });
});
