import * as React from 'react';
import { FocusTrap } from '@patternfly/react-core';
import { Popper } from '../../popper';
import { MenuOption } from '../types';
import ActionMenuContent from './ActionMenuContent';

type ActionMenuRendererProps = {
  open: boolean;
  options: MenuOption[];
  toggleRef: () => Element;
  onClick: () => void;
  onRequestClose: (e?: MouseEvent) => void;
};

const ActionMenuRenderer: React.FC<ActionMenuRendererProps> = ({
  open,
  options,
  toggleRef,
  onClick,
  onRequestClose,
}) => {
  const menuRef = React.useRef<HTMLDivElement>();
  const menuRefCb = React.useCallback(() => menuRef.current, []);

  return (
    <Popper
      open={open}
      placement="bottom-end"
      onRequestClose={onRequestClose}
      reference={toggleRef}
      closeOnEsc
      closeOnOutsideClick
    >
      <FocusTrap
        focusTrapOptions={{
          clickOutsideDeactivates: true,
          returnFocusOnDeactivate: false,
          fallbackFocus: menuRefCb,
        }}
      >
        <div ref={menuRef} className="pf-c-menu pf-m-flyout">
          <ActionMenuContent options={options} onClick={onClick} focusItem={options[0]} />
        </div>
      </FocusTrap>
    </Popper>
  );
};

export default ActionMenuRenderer;
