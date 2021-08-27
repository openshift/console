import * as React from 'react';
import {
  PREFERRED_CREATE_EDIT_METHOD_USER_SETTING_VALUE_LATEST,
  usePreferredCreateEditMethod,
} from '@console/app/src/components/user-preferences/synced-editor';
import { useUserSettings } from '@console/shared';
import { testHook } from '../../../../../../__tests__/utils/hooks-utils';
import { EditorType } from '../editor-toggle';
import { useEditorType } from '../useEditorType';

jest.mock('@console/shared/src/hooks/useUserSettings', () => ({
  useUserSettings: jest.fn(),
}));

jest.mock(
  '@console/app/src/components/user-preferences/synced-editor/usePreferredCreateEditMethod',
  () => ({
    usePreferredCreateEditMethod: jest.fn(),
  }),
);

const mockUserSettings = useUserSettings as jest.Mock;
const mockUsePreferredCreateEditMethod = usePreferredCreateEditMethod as jest.Mock;

describe('useEditorType', () => {
  const lastViewUserSettingKey = 'key';
  const defaultValue = EditorType.Form;

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return editor type corresponding to preferred editor type if it is defined and enabled', () => {
    mockUserSettings.mockReturnValue([EditorType.Form, jest.fn(), true]);
    mockUsePreferredCreateEditMethod.mockReturnValue([EditorType.YAML, true]);
    const { result } = testHook(() => useEditorType(lastViewUserSettingKey, defaultValue));
    const [editorType, , loaded] = result.current;
    expect(editorType).toEqual(EditorType.YAML);
    expect(loaded).toBe(true);
  });

  it(`should return editor type corresponding to last viewed editor type if it is defined and enabled and preferred editor type is ${PREFERRED_CREATE_EDIT_METHOD_USER_SETTING_VALUE_LATEST}`, () => {
    mockUserSettings.mockReturnValue([EditorType.YAML, jest.fn(), true]);
    mockUsePreferredCreateEditMethod.mockReturnValue([
      PREFERRED_CREATE_EDIT_METHOD_USER_SETTING_VALUE_LATEST,
      true,
    ]);
    const { result } = testHook(() => useEditorType(lastViewUserSettingKey, defaultValue));
    const [editorType, , loaded] = result.current;
    expect(editorType).toEqual(EditorType.YAML);
    expect(loaded).toBe(true);
  });

  it('should return editor type corresponding to last viewed editor type if it is defined and enabled preferred editor type is defined but disabled', () => {
    mockUserSettings.mockReturnValue([EditorType.YAML, jest.fn(), true]);
    mockUsePreferredCreateEditMethod.mockReturnValue([EditorType.Form, true]);
    const { result } = testHook(() =>
      useEditorType(
        lastViewUserSettingKey,
        defaultValue,
        (type: string) => !(type === EditorType.Form),
      ),
    );
    const [editorType, , loaded] = result.current;
    expect(editorType).toEqual(EditorType.YAML);
    expect(loaded).toBe(true);
  });

  it('should return editor type corresponding to last viewed editor type if it is defined and enabled and preferred editor type is not defined', () => {
    mockUserSettings.mockReturnValue([EditorType.YAML, jest.fn(), true]);
    mockUsePreferredCreateEditMethod.mockReturnValue([undefined, true]);
    const { result } = testHook(() => useEditorType(lastViewUserSettingKey, defaultValue));
    const [editorType, , loaded] = result.current;
    expect(editorType).toEqual(EditorType.YAML);
    expect(loaded).toBe(true);
  });

  it('should return editor type corresponding to default value if both preferred and last viewed editor type are not defined or disabled', () => {
    mockUserSettings.mockReturnValue([undefined, jest.fn(), true]);
    mockUsePreferredCreateEditMethod.mockReturnValue([undefined, true]);
    const { result } = testHook(() => useEditorType(lastViewUserSettingKey, defaultValue));
    const [editorType, , loaded] = result.current;
    expect(editorType).toEqual(defaultValue);
    expect(loaded).toBe(true);
  });

  it('should return false for loaded and null for editor type if preferred editor type has not loaded', () => {
    mockUserSettings.mockReturnValue([EditorType.YAML, jest.fn(), true]);
    mockUsePreferredCreateEditMethod.mockReturnValue([undefined, false]);
    const { result } = testHook(() => useEditorType(lastViewUserSettingKey, defaultValue));
    const [editorType, , loaded] = result.current;
    expect(editorType).toEqual(null);
    expect(loaded).toBe(false);
  });

  it('should return false for loaded and null for editor type if last viewed editor type has not loaded', () => {
    mockUserSettings.mockReturnValue([undefined, jest.fn(), false]);
    mockUsePreferredCreateEditMethod.mockReturnValue([EditorType.YAML, true]);
    const { result } = testHook(() => useEditorType(lastViewUserSettingKey, defaultValue));
    const [editorType, , loaded] = result.current;
    expect(editorType).toEqual(null);
    expect(loaded).toBe(false);
  });

  it('should return false for loaded if resources have loaded and defaultValue is defined but activeEditorType is not defined', () => {
    mockUserSettings.mockReturnValue([undefined, jest.fn(), true]);
    mockUsePreferredCreateEditMethod.mockReturnValue([EditorType.YAML, true]);
    spyOn(React, 'useState').and.returnValue([null, jest.fn()]);
    const { result } = testHook(() => useEditorType(lastViewUserSettingKey, defaultValue));
    const [editorType, , loaded] = result.current;
    expect(editorType).toEqual(null);
    expect(loaded).toBe(false);
  });

  it('should return true for loaded if all resources have loaded but activeEditorType and defaultValue are not defined', () => {
    mockUserSettings.mockReturnValue([undefined, jest.fn(), true]);
    mockUsePreferredCreateEditMethod.mockReturnValue([EditorType.YAML, true]);
    spyOn(React, 'useState').and.returnValue([null, jest.fn()]);
    const { result } = testHook(() => useEditorType(lastViewUserSettingKey, null));
    const [editorType, , loaded] = result.current;
    expect(editorType).toEqual(null);
    expect(loaded).toBe(true);
  });
});
