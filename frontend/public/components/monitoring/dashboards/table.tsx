import * as React from 'react';

import { Panel } from './types';

// TODO: Just a stub for now
// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
const Table: React.FC<Props> = ({ panel, pollInterval, queries }) => null;

type Props = {
  panel: Panel;
  pollInterval: number;
  queries: string[];
};

export default Table;
