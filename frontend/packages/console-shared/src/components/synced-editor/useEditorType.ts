import * as React from 'react';
import {
  PREFERRED_CREATE_EDIT_METHOD_USER_SETTING_VALUE_LATEST,
  usePreferredCreateEditMethod,
} from '@console/app/src/components/user-preferences/synced-editor';
import { useUserSettings } from '../../hooks/useUserSettings';
import { EditorType } from './editor-toggle';

export const useEditorType = (
  lastViewUserSettingKey: string,
  defaultValue: EditorType,
  checkEditorTypeEnabled?: (type: EditorType) => boolean,
): [EditorType, (type: EditorType) => void, boolean] => {
  const [
    lastViewedEditorType,
    setLastViewedEditorType,
    lastViewedEditorTypeLoaded,
  ] = useUserSettings<EditorType>(lastViewUserSettingKey);
  const [preferredEditorType, preferredEditorTypeLoaded] = usePreferredCreateEditMethod();
  const isEditorTypeEnabled = (type: EditorType): boolean =>
    checkEditorTypeEnabled ? checkEditorTypeEnabled(type) : true;

  const loaded: boolean = lastViewedEditorTypeLoaded && preferredEditorTypeLoaded;

  const getEditorType = (): EditorType => {
    if (
      preferredEditorType &&
      preferredEditorType !== PREFERRED_CREATE_EDIT_METHOD_USER_SETTING_VALUE_LATEST &&
      isEditorTypeEnabled(preferredEditorType as EditorType)
    ) {
      return preferredEditorType as EditorType;
    }
    if (lastViewedEditorType && isEditorTypeEnabled(lastViewedEditorType)) {
      return lastViewedEditorType;
    }
    return defaultValue;
  };

  const [activeEditorType, setActiveEditorType] = React.useState<EditorType>(null);
  const setEditorType = (type: EditorType) => {
    setActiveEditorType(type);
    setLastViewedEditorType(type);
  };
  React.useEffect(() => {
    if (loaded) {
      const editorType: EditorType = getEditorType();
      setLastViewedEditorType(editorType);
      setActiveEditorType(editorType);
    }
    // run this hook only after all resources have loaded
    // to set the lastView user setting when the form loads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);
  return [activeEditorType, setEditorType, loaded];
};
