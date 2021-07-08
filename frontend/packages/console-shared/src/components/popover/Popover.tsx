import * as React from 'react';
import { FocusTrap } from '@patternfly/react-core';
import { PopoverArrow } from '@patternfly/react-core/dist/js/components/Popover/PopoverArrow';
import { PopoverBody } from '@patternfly/react-core/dist/js/components/Popover/PopoverBody';
import { PopoverCloseButton } from '@patternfly/react-core/dist/js/components/Popover/PopoverCloseButton';
import { PopoverContent } from '@patternfly/react-core/dist/js/components/Popover/PopoverContent';
import { PopoverFooter } from '@patternfly/react-core/dist/js/components/Popover/PopoverFooter';
import { PopoverHeader } from '@patternfly/react-core/dist/js/components/Popover/PopoverHeader';
import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/components/Popover/popover';
import { useTranslation } from 'react-i18next';
import { Popper } from '../popper';
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
}) => {
  const { t } = useTranslation();
  return (
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
        <FocusTrap>
          <div id={id} className={css(styles.popover, className)}>
            <PopoverArrow className="ocs-popover__arrow" />
            <PopoverContent>
              <PopoverCloseButton onClose={onClose} aria-label={t('console-shared~Close')} />
              {headerContent && (
                <PopoverHeader id={`popover-${uniqueId}-header`}>{headerContent}</PopoverHeader>
              )}
              <PopoverBody id={`popover-${uniqueId}-body`}>{children}</PopoverBody>
              {footerContent && (
                <PopoverFooter id={`popover-${uniqueId}-footer`}>{footerContent}</PopoverFooter>
              )}
            </PopoverContent>
          </div>
        </FocusTrap>
      </Popper>
    </>
  );
};

Popover.displayName = 'Popover';

export default Popover;
