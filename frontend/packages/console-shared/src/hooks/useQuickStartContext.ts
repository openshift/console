import { useContext } from 'react';
import { QuickStartContext, QuickStartContextValues } from '@patternfly/quickstarts';

export const useQuickStartContext = () => {
  return useContext<QuickStartContextValues>(QuickStartContext);
};
