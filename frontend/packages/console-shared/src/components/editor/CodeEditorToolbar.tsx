import * as React from 'react';
import { Divider } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { isMac, ShortcutCommand } from '../shortcuts/Shortcut';
import ShortcutsLink from './ShortcutsLink';

import './CodeEditorToolbar.scss';

interface CodeEditorToolbarProps {
  showShortcuts?: boolean;
  toolbarLinks?: React.ReactNodeArray;
}

const CodeEditorToolbar: React.FC<CodeEditorToolbarProps> = ({ showShortcuts, toolbarLinks }) => {
  const { t } = useTranslation();
  if (!showShortcuts && !toolbarLinks?.length) return null;
  return (
    <div className="co-toolbar__group co-toolbar__group--right">
      <div className="ocs-yaml-editor-toolbar pf-u-pb-sm pf-l-flex">
        <div className="ocs-yaml-editor-toolbar__link">
          <div>
            <span className="ocs-yaml-editor-shortcut__command">
              <ShortcutCommand>{isMac ? '⌥ Opt' : 'Alt'}</ShortcutCommand>
              <ShortcutCommand>F1</ShortcutCommand>
            </span>
            <span className="ocs-yaml-editor-shortcut__text">
              {t('console-shared~Accessibility help')}
            </span>
          </div>
        </div>
        {showShortcuts && (
          <div className="ocs-yaml-editor-toolbar__link pf-l-flex">
            <Divider
              orientation={{
                default: 'vertical',
              }}
            />
            <ShortcutsLink />
          </div>
        )}
        {toolbarLinks &&
          toolbarLinks.map((link, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={`${index}`} className="ocs-yaml-editor-toolbar__link pf-l-flex">
              {(showShortcuts || index > 0) && link ? (
                <Divider
                  orientation={{
                    default: 'vertical',
                  }}
                />
              ) : null}
              <div className="ocs-yaml-editor-toolbar__link">{link}</div>
            </div>
          ))}
      </div>
    </div>
  );
};
export default CodeEditorToolbar;
