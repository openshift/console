import { useState, useEffect } from 'react';
import {
  PREFERRED_CREATE_EDIT_METHOD_USER_SETTING_VALUE_LATEST,
  usePreferredCreateEditMethod,
} from '@console/app/src/components/user-preferences/synced-editor/usePreferredCreateEditMethod';
import { useUserPreference } from '../../hooks/useUserPreference';
import type { EditorType } from './editor-toggle';

export const useEditorType = (
  lastViewUserPreferenceKey: string,
  defaultValue: EditorType,
  checkEditorTypeEnabled?: (type: EditorType) => boolean,
): [EditorType, (type: EditorType) => void, boolean] => {
  const [lastViewedEditorType, setLastViewedEditorType, lastViewedEditorTypeLoaded] =
    useUserPreference<EditorType>(lastViewUserPreferenceKey);
  const [preferredEditorType, preferredEditorTypeLoaded] = usePreferredCreateEditMethod();
  const isEditorTypeEnabled = (type: EditorType): boolean =>
    checkEditorTypeEnabled ? checkEditorTypeEnabled(type) : true;

  const resourceLoaded: boolean = lastViewedEditorTypeLoaded && preferredEditorTypeLoaded;

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

  const [activeEditorType, setActiveEditorType] = useState<EditorType>(null);
  // Initialize the active editor type from the user preferences once they have
  // loaded.
  const [prevResourceLoaded, setPrevResourceLoaded] = useState(false);
  if (prevResourceLoaded !== resourceLoaded) {
    setPrevResourceLoaded(resourceLoaded);
    if (resourceLoaded) {
      setActiveEditorType(getEditorType());
    }
  }
  const setEditorType = (type: EditorType) => {
    setActiveEditorType(type);
    setLastViewedEditorType(type);
  };
  useEffect(() => {
    if (resourceLoaded) {
      const editorType: EditorType = getEditorType();
      if (!lastViewedEditorType || lastViewedEditorType !== editorType) {
        setLastViewedEditorType(editorType);
      }
    }
    // run this hook only after all resources have loaded
    // to set the lastView user setting when the form loads
    // eslint-disable-next-line react-hooks-js/exhaustive-deps
  }, [resourceLoaded]);

  const loaded: boolean = resourceLoaded && (!!activeEditorType || !defaultValue);
  return [activeEditorType, setEditorType, loaded];
};
