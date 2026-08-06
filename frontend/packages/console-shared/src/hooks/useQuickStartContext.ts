import { useContext } from 'react';
import type { QuickStartContextValues } from '@patternfly/quickstarts';
import { QuickStartContext } from '@patternfly/quickstarts';

export const useQuickStartContext = () => useContext<QuickStartContextValues>(QuickStartContext);
