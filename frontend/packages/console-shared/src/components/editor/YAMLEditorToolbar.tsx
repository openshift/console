import * as React from 'react';
import ShortcutsLink from './ShortcutsLink';
import './YAMLEditorToolbar.scss';

interface YAMLEditorToolbarProps {
  showShortcuts?: boolean;
  toolbarLinks?: React.ReactNodeArray;
}

const YAMLEditorToolbar: React.FC<YAMLEditorToolbarProps> = ({ showShortcuts, toolbarLinks }) => {
  if (!showShortcuts && !toolbarLinks?.length) return null;

  return (
    <div className="ocs-yaml-editor-toolbar__links">
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
