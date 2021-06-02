import * as React from 'react';
import { MouseIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import './Shortcut.scss';

interface ShortcutProps {
  children: React.ReactNode;
  alt?: boolean;
  click?: boolean;
  ctrl?: boolean;
  ctrlCmd?: boolean;
  drag?: boolean;
  hover?: boolean;
  keyName?: string;
  rightClick?: boolean;
  shift?: boolean;
  dragNdrop?: boolean;
}

export const ShortcutCommand: React.FC = ({ children }) => (
  <span className="ocs-shortcut__command">
    <kbd>{children}</kbd>
  </span>
);

export const isMac = window.navigator.platform.includes('Mac');

const Shortcut: React.FC<ShortcutProps> = ({
  children,
  alt,
  click,
  ctrl,
  ctrlCmd,
  drag,
  hover,
  keyName,
  rightClick,
  shift,
  dragNdrop,
}) => {
  const { t } = useTranslation();
  return (
    <tr>
      <td className="ocs-shortcut__cell">
        {(ctrl || (!isMac && ctrlCmd)) && (
          <ShortcutCommand data-test-id="ctrl-button">Ctrl</ShortcutCommand>
        )}
        {alt && (
          <ShortcutCommand data-test-id={isMac ? 'opt-button' : 'alt-button'}>
            {isMac ? '⌥ Opt' : 'Alt'}
          </ShortcutCommand>
        )}
        {shift && <ShortcutCommand data-test-id="shift-button">Shift</ShortcutCommand>}
        {isMac && ctrlCmd && <ShortcutCommand data-test-id="cmd-button">⌘ Cmd</ShortcutCommand>}
        {hover && (
          <ShortcutCommand data-test-id="hover">
            <MouseIcon /> {t('console-shared~Hover')}
          </ShortcutCommand>
        )}
        {keyName && (
          <ShortcutCommand data-test-id={`${keyName}-button`}>
            {keyName.length === 1 ? keyName.toUpperCase() : _.upperFirst(keyName.toLowerCase())}
          </ShortcutCommand>
        )}
        {drag && (
          <ShortcutCommand data-test-id="drag">
            <MouseIcon /> {t('console-shared~Drag')}
          </ShortcutCommand>
        )}
        {click && (
          <ShortcutCommand data-test-id="click">
            <MouseIcon /> {t('console-shared~Click')}
          </ShortcutCommand>
        )}
        {rightClick && (
          <ShortcutCommand data-test-id="right-click">
            <MouseIcon /> {t('console-shared~Right click')}
          </ShortcutCommand>
        )}
        {dragNdrop && (
          <ShortcutCommand data-test-id="drag-and-drop">
            <MouseIcon /> {t('console-shared~Drag + Drop')}
          </ShortcutCommand>
        )}
      </td>
      <td className="ocs-shortcut__cell">{children}</td>
    </tr>
  );
};

export default Shortcut;
