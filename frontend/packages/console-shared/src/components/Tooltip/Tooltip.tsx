/**
 * This component exists because of two issue with patternfly tooltip components
 * 1. If content changes while the tooltip is open, its position shift from the target
 * 2. Tooltip component is missing the onShow/OnHide events which are fired when the tooltip open/closed
 * Remove this component once https://github.com/patternfly/patternfly-react/issues/5620 is fixed.
 */
import * as React from 'react';
import { TooltipArrow } from '@patternfly/react-core/dist/js/components/Tooltip/TooltipArrow';
import { TooltipContent } from '@patternfly/react-core/dist/js/components/Tooltip/TooltipContent';
import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/components/Tooltip/tooltip';
import { Tippy } from '../popper/Tippy';
import './Tooltip.scss';

export enum TooltipPlacement {
  top = 'top',
  left = 'left',
  right = 'right',
  bottom = 'bottom',
}

type TooltipProps = {
  reference: Element | (() => HTMLElement);
  className?: string;
  placement?: TooltipPlacement;
  onShow?: (event: Event) => void;
  onHide?: (event: Event) => void;
  content: React.ReactNode;
};

export const Tooltip: React.FC<TooltipProps> = ({ content, className, ...rest }) => {
  return (
    <Tippy
      className="ocs-tooltip"
      tippyOptions={{
        modifiers: { arrow: { element: '.ocs-tooltip__arrow' } },
      }}
      {...rest}
    >
      <div className={css(styles.tooltip, className)}>
        <TooltipArrow className="ocs-tooltip__arrow" />
        <TooltipContent>{content}</TooltipContent>
      </div>
    </Tippy>
  );
};
