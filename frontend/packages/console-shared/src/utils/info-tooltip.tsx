import * as React from 'react';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import { Tooltip } from '@patternfly/react-core';

export const InfoToolTip = ({ position, content }) => (
  <Tooltip position={position} content={content}>
    <OutlinedQuestionCircleIcon />
  </Tooltip>
);
