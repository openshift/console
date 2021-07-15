import * as React from 'react';
import { VirtualizedGrid } from '@console/dynamic-plugin-sdk/api';

const VirtualizedGridDemo: React.FC = () => {
  return (
    <div>
      <VirtualizedGrid
        items={[{ name: 'john' }, { name: 'alice' }]}
        renderCell={(item) => <div>{item?.name}</div>}
      />
    </div>
  );
};

export default VirtualizedGridDemo;
