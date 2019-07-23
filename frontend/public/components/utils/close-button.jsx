import * as React from 'react';
import { CloseIcon } from '@patternfly/react-icons';

export const CloseButton = ({onClick}) =>
  <button aria-label="Close" className="close" onClick={onClick} type="button">
    <CloseIcon />
  </button>;
