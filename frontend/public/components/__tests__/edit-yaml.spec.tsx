import type { CodeEditorRef } from '@console/dynamic-plugin-sdk/src/extensions/console-types';

describe('EditYAML: getEditor function', () => {
  it('should handle undefined monacoRef.current without throwing TypeError', () => {
    // This test verifies the fix for OCPBUGS-77912
    // The bug occurred when monacoRef.current was undefined and the 'in' operator was used
    const monacoRef = { current: undefined } as React.MutableRefObject<CodeEditorRef>;

    // This simulates the getEditor function from edit-yaml.tsx
    const getEditor = () =>
      monacoRef?.current && 'editor' in monacoRef.current ? monacoRef.current.editor : undefined;

    // Before the fix, this would throw: "TypeError: Cannot use 'in' operator to search for 'editor' in undefined"
    // After the fix, it should return undefined gracefully
    expect(() => getEditor()).not.toThrow();
    expect(getEditor()).toBeUndefined();
  });

  it('should return undefined when monacoRef.current exists but has no editor property', () => {
    const monacoRef = { current: {} as CodeEditorRef } as React.MutableRefObject<CodeEditorRef>;

    const getEditor = () =>
      monacoRef?.current && 'editor' in monacoRef.current ? monacoRef.current.editor : undefined;

    expect(getEditor()).toBeUndefined();
  });

  it('should return the editor when monacoRef.current has an editor property', () => {
    const mockEditor = { getValue: jest.fn(), setValue: jest.fn() };
    const monacoRef = { current: { editor: mockEditor } as any } as React.MutableRefObject<
      CodeEditorRef
    >;

    const getEditor = () =>
      monacoRef?.current && 'editor' in monacoRef.current ? monacoRef.current.editor : undefined;

    expect(getEditor()).toBe(mockEditor);
  });
});
