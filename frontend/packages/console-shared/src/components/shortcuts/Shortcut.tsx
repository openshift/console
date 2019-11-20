import * as React from 'react';
import { MouseIcon } from '@patternfly/react-icons';
import './Shortcut.scss';

interface ShortcutProps {
  children: React.ReactNode;
  alt?: boolean;
  click?: boolean;
  ctrl?: boolean;
  drag?: boolean;
  hover?: boolean;
  keyName?: string;
  macCtrl?: boolean;
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
  ctrl,
  shift,
  alt,
  keyName,
  drag,
  click,
  rightClick,
  hover,
  macCtrl,
}) => {
  const isMac = window.navigator.platform.includes('Mac');
  return (
    <tr>
      <td className="ocs-shortcut__cell">
        {((!isMac && ctrl) || macCtrl) && <Command>Ctrl</Command>}
        {alt && <Command>{isMac ? '⌥ Opt' : 'Alt'}</Command>}
        {shift && <Command>Shift</Command>}
        {isMac && ctrl && <Command>⌘ Cmd</Command>}
        {hover && (
          <Command>
            <MouseIcon /> Hover
          </Command>
        )}
        {keyName && <Command>{keyName.toUpperCase()}</Command>}
        {drag && (
          <Command>
            <MouseIcon /> Drag
          </Command>
        )}
        {click && (
          <Command>
            <MouseIcon /> Click
          </Command>
        )}
        {rightClick && (
          <Command>
            <MouseIcon /> Right Click
          </Command>
        )}
      </td>
      <td className="ocs-shortcut__cell">{children}</td>
    </tr>
  );
};

export default Shortcut;
