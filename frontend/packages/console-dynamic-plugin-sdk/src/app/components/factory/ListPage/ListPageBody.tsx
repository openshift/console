import type { FC, ReactNode } from 'react';
import { PageSection } from '@patternfly/react-core';

interface ListPageBodyProps {
  children?: ReactNode;
}

const ListPageBody: FC<ListPageBodyProps> = ({ children }) => (
  <PageSection className="co-m-pane__body" hasBodyWrapper={false}>
    {children}
  </PageSection>
);

export default ListPageBody;
