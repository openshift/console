import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as _ from 'lodash';
import { MouseIcon } from '@patternfly/react-icons';
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
        {(ctrl || (!isMac && ctrlCmd)) && <ShortcutCommand>Ctrl</ShortcutCommand>}
        {alt && <ShortcutCommand>{isMac ? '⌥ Opt' : 'Alt'}</ShortcutCommand>}
        {shift && <ShortcutCommand>Shift</ShortcutCommand>}
        {isMac && ctrlCmd && <ShortcutCommand>⌘ Cmd</ShortcutCommand>}
        {hover && (
          <ShortcutCommand>
            <MouseIcon /> {t('console-shared~Hover')}
          </ShortcutCommand>
        )}
        {keyName && (
          <ShortcutCommand>
            {keyName.length === 1 ? keyName.toUpperCase() : _.upperFirst(keyName.toLowerCase())}
          </ShortcutCommand>
        )}
        {drag && (
          <ShortcutCommand>
            <MouseIcon /> {t('console-shared~Drag')}
          </ShortcutCommand>
        )}
        {click && (
          <ShortcutCommand>
            <MouseIcon /> {t('console-shared~Click')}
          </ShortcutCommand>
        )}
        {rightClick && (
          <ShortcutCommand>
            <MouseIcon /> {t('console-shared~Right click')}
          </ShortcutCommand>
        )}
        {dragNdrop && (
          <ShortcutCommand>
            <MouseIcon /> {t('console-shared~Drag + Drop')}
          </ShortcutCommand>
        )}
      </td>
      <td className="ocs-shortcut__cell">{children}</td>
    </tr>
  );
};

export default Shortcut;
