import * as _ from 'lodash';
import * as React from 'react';
import { Tooltip as RLT } from 'react-lightweight-tooltip';

const tooltipOverrides = Object.freeze({
  wrapper: {
    color: 'inherit',
    display: 'inline-block',
    zIndex: 'auto',
  },
  tooltip: {
    maxWidth: 'none',
    minWidth: '170px',
    padding: '0',
    textAlign: 'center',
    zIndex: '1070',
  },
  content: {
    display: 'block',
    fontSize: '12px',
    maxWidth: '200px',
    padding: '7px 12px',
    whiteSpace: 'normal',
  },
  arrow: {
    borderWidth: '8px',
    bottom: '-8px',
    marginLeft: '-8px',
  },
  gap: {
    bottom: '-5px',
    height: '5px',
  },
});

// Consider this mobile if the device screen width is less than 768. (This value shouldn't change.)
const isMobile = window.screen.width < 768;

export const Tooltip: React.SFC<TooltipProps> = ({ content, children, styles, disableOnMobile, hidden = false }) => {
  if (disableOnMobile && isMobile || hidden) {
    return <React.Fragment>{children}</React.Fragment>;
  }
  const mergedStyles = styles ? _.merge({}, tooltipOverrides, styles) : tooltipOverrides;
  return <RLT content={content} styles={mergedStyles}>{children}</RLT>;
};

type TooltipProps = {
  content: React.ReactNode;
  hidden?: boolean;
  styles?: any;
  disableOnMobile?: boolean;
};
