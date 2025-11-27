import type { FC } from 'react';
import { AsyncComponent } from '@console/internal/components/utils/async';

const QuickStartCatalogPageAsync: FC = () => (
  <AsyncComponent
    blame="QuickStartCatalogPageAsync"
    loader={() =>
      import('./QuickStartCatalogPage' /* webpackChunkName: "quick-start" */).then((c) => c.default)
    }
  />
);

export default QuickStartCatalogPageAsync;
