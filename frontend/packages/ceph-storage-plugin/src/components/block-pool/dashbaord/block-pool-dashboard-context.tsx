import * as React from 'react';

import { StoragePoolKind } from '../../../types';

export const BlockPoolDashboardContext = React.createContext<BlockPoolDashboardContext>({});

type BlockPoolDashboardContext = {
  obj?: StoragePoolKind;
};
