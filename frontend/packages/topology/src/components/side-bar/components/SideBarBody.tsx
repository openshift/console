import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { SimpleTabNav } from '@console/internal/components/utils';
import SideBarTabLoader from '../providers/SideBarTabLoader';

const SideBarBody: React.FC<{ element: GraphElement }> = ({ element }) => {
  return (
    <SideBarTabLoader element={element}>
      {(tabs, loaded) =>
        loaded ? (
          <SimpleTabNav
            tabs={tabs}
            tabProps={null}
            additionalClassNames="co-m-horizontal-nav__menu--within-sidebar co-m-horizontal-nav__menu--within-overview-sidebar"
          />
        ) : null
      }
    </SideBarTabLoader>
  );
};

export default SideBarBody;
