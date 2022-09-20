import * as React from 'react';
import { Spinner } from '@patternfly/react-core';
import { PopoverHelpButton } from '../PopoverHelpButton';

export const InProgress: React.FC<{ text: string; infoText?: string }> = ({ text, infoText }) => {
  return (
    <span>
      <Spinner isSVG size="md" aria-label={text} />
      &nbsp;
      {text}
      {infoText && <PopoverHelpButton content={infoText} />}
    </span>
  );
};
