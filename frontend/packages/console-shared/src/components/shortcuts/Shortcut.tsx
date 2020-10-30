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
}

const Command: React.FC = ({ children }) => (
  <span className="ocs-shortcut__command">
    <kbd>{children}</kbd>
  </span>
);

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
}) => {
  const { t } = useTranslation();
  const isMac = window.navigator.platform.includes('Mac');
  return (
    <tr>
      <td className="ocs-shortcut__cell">
        {(ctrl || (!isMac && ctrlCmd)) && <Command>Ctrl</Command>}
        {alt && <Command>{isMac ? '⌥ Opt' : 'Alt'}</Command>}
        {shift && <Command>Shift</Command>}
        {isMac && ctrlCmd && <Command>⌘ Cmd</Command>}
        {hover && (
          <Command>
            <MouseIcon /> {t('console-shared~Hover')}
          </Command>
        )}
        {keyName && (
          <Command>
            {keyName.length === 1 ? keyName.toUpperCase() : _.startCase(keyName.toLowerCase())}
          </Command>
        )}
        {drag && (
          <Command>
            <MouseIcon /> {t('console-shared~Drag')}
          </Command>
        )}
        {click && (
          <Command>
            <MouseIcon /> {t('console-shared~Click')}
          </Command>
        )}
        {rightClick && (
          <Command>
            <MouseIcon /> {t('console-shared~Right Click')}
          </Command>
        )}
      </td>
      <td className="ocs-shortcut__cell">{children}</td>
    </tr>
  );
};

export default Shortcut;
