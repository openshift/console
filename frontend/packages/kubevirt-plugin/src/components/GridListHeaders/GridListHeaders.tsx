import * as React from 'react';
import { GridItem, Text, TextVariants } from '@patternfly/react-core';

export type GridListHeadersProps = {
  headers: any[];
};

const GridListHeaders: React.FC<GridListHeadersProps> = ({ headers }) => (
  <>
    {headers?.map((item) => (
      <GridItem span={item?.span}>
        <Text component={TextVariants.h4}>{item?.title}</Text>
      </GridItem>
    ))}
  </>
);

export default GridListHeaders;
