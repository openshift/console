import * as React from 'react';
import { Popper } from '../popper';
import styles from '@patternfly/react-styles/css/components/Popover/popover';
import { css } from '@patternfly/react-styles';
import { PopoverArrow } from '@patternfly/react-core/dist/js/components/Popover/PopoverArrow';
import { PopoverBody } from '@patternfly/react-core/dist/js/components/Popover/PopoverBody';
import { PopoverCloseButton } from '@patternfly/react-core/dist/js/components/Popover/PopoverCloseButton';
import { PopoverContent } from '@patternfly/react-core/dist/js/components/Popover/PopoverContent';
import { PopoverHeader } from '@patternfly/react-core/dist/js/components/Popover/PopoverHeader';
import { PopoverFooter } from '@patternfly/react-core/dist/js/components/Popover/PopoverFooter';
import { PopoverPlacement } from './const';
import './Popover.scss';

type PopoverProps = {
  open: boolean;
  uniqueId?: string;
  onClose?: () => void;
  headerContent?: React.ReactNode | string;
  footerContent?: React.ReactNode | string;
  children: React.ReactNode | string;
  trigger: string;
  className?: string;
  placement: PopoverPlacement;
  id?: string;
};

const Popover: React.FC<PopoverProps> = ({
  open,
  headerContent,
  placement,
  onClose,
  uniqueId,
  children,
  footerContent,
  trigger,
  className,
  id,
}) => (
  <>
    <Popper
      reference={document.querySelector(trigger)}
      open={open}
      placement={placement}
      className="ocs-popover"
      popperOptions={{
        modifiers: { arrow: { element: '.ocs-popover__arrow' } },
      }}
    >
      <div id={id} className={css(styles.popover, className)}>
        <PopoverArrow className="ocs-popover__arrow" />
        <PopoverContent>
          <PopoverCloseButton onClose={onClose} aria-label={'closeBtnAriaLabel'} />
          {headerContent && (
            <PopoverHeader id={`popover-${uniqueId}-header`}>{headerContent}</PopoverHeader>
          )}
          <PopoverBody id={`popover-${uniqueId}-body`}>{children}</PopoverBody>
          {footerContent && (
            <PopoverFooter id={`popover-${uniqueId}-footer`}>{footerContent}</PopoverFooter>
          )}
        </PopoverContent>
      </div>
    </Popper>
  </>
);

Popover.displayName = 'Popover';

export default Popover;
