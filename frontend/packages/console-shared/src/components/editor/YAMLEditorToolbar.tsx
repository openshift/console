import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { isMac, ShortcutCommand } from '../shortcuts/Shortcut';
import ShortcutsLink from './ShortcutsLink';

import './YAMLEditorToolbar.scss';

interface YAMLEditorToolbarProps {
  showShortcuts?: boolean;
  toolbarLinks?: React.ReactNodeArray;
}

const YAMLEditorToolbar: React.FC<YAMLEditorToolbarProps> = ({ showShortcuts, toolbarLinks }) => {
  const { t } = useTranslation();
  if (!showShortcuts && !toolbarLinks?.length) return null;
  return (
    <div className="ocs-yaml-editor-toolbar">
      <span className="ocs-yaml-editor-shortcut__command">
        <ShortcutCommand>{isMac ? '⌥ Opt' : 'Alt'}</ShortcutCommand>
        <ShortcutCommand>F1</ShortcutCommand>
      </span>
      <span className="ocs-yaml-editor-shortcut__text">{t('editor~Accessibility help')}</span>
      <div className="co-action-divider">|</div>
      {showShortcuts && (
        <div className="ocs-yaml-editor-toolbar__link">
          <ShortcutsLink />
        </div>
      )}
      {toolbarLinks &&
        toolbarLinks.map((link, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={`${index}`}>
            {(showShortcuts || index > 0) && link ? (
              <div className="co-action-divider">|</div>
            ) : null}
            <div className="ocs-yaml-editor-toolbar__link">{link}</div>
          </div>
        ))}
    </div>
  );
};
export default YAMLEditorToolbar;
