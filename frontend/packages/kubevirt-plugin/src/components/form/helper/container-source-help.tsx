import * as React from 'react';

import { EXAMPLE_CONTAINER } from '../../../utils/strings';

export const ContainerSourceHelp: React.FC = () => (
  <div className="pf-c-form__helper-text" aria-live="polite">
    Example: {EXAMPLE_CONTAINER}
  </div>
);
