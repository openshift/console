import * as React from 'react';
import { GridItem, Text, TextVariants } from '@patternfly/react-core';
import { LABEL_VALUE, LABEL_KEY } from '../../../LabelsList/consts';

export const TolerationHeader = () => {
  return (
    <>
      <GridItem span={4}>
        <Text component={TextVariants.h4}>{LABEL_KEY}</Text>
      </GridItem>
      <GridItem span={4}>
        <Text component={TextVariants.h4}>{LABEL_VALUE}</Text>
      </GridItem>
      <GridItem span={4}>
        <Text component={TextVariants.h4}>Effect</Text>
      </GridItem>
    </>
  );
};
