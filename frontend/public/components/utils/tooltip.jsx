import * as React from 'react';
import { Tooltip as RLT } from 'react-lightweight-tooltip';

const tooltipOverrides = Object.freeze({
  wrapper: {
    color: 'inherit',
    display: 'block',
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

export const Tooltip = ({ content, children }) => <RLT content={content} styles={tooltipOverrides}>{children}</RLT>;
