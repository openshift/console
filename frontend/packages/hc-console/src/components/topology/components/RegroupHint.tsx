import * as React from 'react';
import { InfoCircleIcon } from '@patternfly/react-icons';
import { ShortcutTable, Shortcut } from '@console/shared';

import './RegroupHint.scss';

const RegroupHint: React.FC = () => (
  <div className="odc-regroup-hint">
    <InfoCircleIcon className="odc-regroup-hint__icon" />
    <span className="odc-regroup-hint__text">
      <ShortcutTable>
        <Shortcut shift drag>
          Edit application grouping
        </Shortcut>
      </ShortcutTable>
    </span>
  </div>
);

export { RegroupHint };
