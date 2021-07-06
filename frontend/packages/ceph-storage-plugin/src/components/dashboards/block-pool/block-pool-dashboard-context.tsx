import * as React from 'react';

import { StoragePoolKind } from '../../../types';

export const BlockPoolDashboardContext = React.createContext<BlockPoolDashboardContext>({} as any);

type BlockPoolDashboardContext = {
  obj: StoragePoolKind;
};
