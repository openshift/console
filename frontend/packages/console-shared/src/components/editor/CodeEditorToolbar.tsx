import * as React from 'react';
import { Button, Divider } from '@patternfly/react-core';
import { MagicIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: FIXME out-of-sync @types/react-redux version as new types cause many build errors
import { useDispatch } from 'react-redux';
import { action } from 'typesafe-actions';
import { ActionType } from '@console/internal/reducers/ols';
import { useOLSConfig } from '../../hooks/ols-hook';
import { isMac, ShortcutCommand } from '../shortcuts/Shortcut';
import ShortcutsLink from './ShortcutsLink';

import './CodeEditorToolbar.scss';

interface CodeEditorToolbarProps {
  showShortcuts?: boolean;
  toolbarLinks?: React.ReactNodeArray;
}

const CodeEditorToolbar: React.FC<CodeEditorToolbarProps> = ({ showShortcuts, toolbarLinks }) => {
  const { t } = useTranslation();
  const openOLS = () => action(ActionType.OpenOLS);
  const showLightspeedButton = useOLSConfig();
  const dispatch = useDispatch();
  if (!showShortcuts && !toolbarLinks?.length) return null;
  return (
    <div className="co-toolbar__group co-toolbar__group--right">
      <div className="ocs-yaml-editor-toolbar pf-v6-u-pb-sm pf-v6-l-flex">
        {showLightspeedButton && (
          <div className="ocs-yaml-editor-toolbar__link pf-v6-l-flex">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                dispatch(openOLS());
              }}
              icon={<MagicIcon />}
            >
              {t('console-shared~Ask OpenShift Lightspeed')}
            </Button>
            <Divider
              orientation={{
                default: 'vertical',
              }}
            />
          </div>
        )}
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
          <div className="ocs-yaml-editor-toolbar__link pf-v6-l-flex">
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
            <div key={`${index}`} className="ocs-yaml-editor-toolbar__link pf-v6-l-flex">
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
