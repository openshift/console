import * as React from 'react';
import { Button, Popover } from '@patternfly/react-core';
import { QuestionCircleIcon } from '@patternfly/react-icons';

export const FieldLevelHelp: React.FC<FieldLevelHelpProps> = React.memo(({ children }) => {
  if (React.Children.count(children) === 0) {
    return null;
  }
  return (
    <Popover aria-label="Help" bodyContent={children} enableFlip>
      <Button variant="link" isInline className="co-field-level-help" aria-label="Help Button">
        <QuestionCircleIcon className="co-field-level-help__icon" />
      </Button>
    </Popover>
  );
});

type FieldLevelHelpProps = {
  children: React.ReactNode;
};
