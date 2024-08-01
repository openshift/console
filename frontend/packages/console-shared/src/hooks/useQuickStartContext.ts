import * as React from 'react';
import { QuickStartContext, QuickStartContextValues } from '@patternfly/quickstarts';

export const useQuickStartContext = () => {
  return React.useContext<QuickStartContextValues>(QuickStartContext);
};
