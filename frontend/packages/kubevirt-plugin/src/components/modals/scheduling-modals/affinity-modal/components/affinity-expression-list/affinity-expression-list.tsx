import * as React from 'react';
import { GridItem, Text, TextVariants } from '@patternfly/react-core';
import { LabelsList } from '../../../../../LabelsList/labels-list';
import { LABEL_KEY } from '../../../../../LabelsList/consts';
import { AffinityLabel } from '../../types';
import { AffinityExpressionRow } from './affinity-expression-row';

export const AffinityExpressionList = ({
  expressions,
  addRowText,
  onAdd,
  onChange,
  onDelete,
}: AffinityExpressionListProps) => {
  return (
    <LabelsList
      isEmpty={expressions.length === 0}
      onLabelAdd={onAdd}
      addRowText={addRowText}
      emptyStateAddRowText={addRowText}
    >
      {expressions.length > 0 && (
        <>
          <GridItem span={4}>
            <Text component={TextVariants.h6}>{LABEL_KEY}</Text>
          </GridItem>
          <GridItem span={3}>
            <Text component={TextVariants.h6}>Operator</Text>
          </GridItem>
          <GridItem span={5}>
            <Text component={TextVariants.h6}>Values</Text>
          </GridItem>
          {expressions.map((expression) => (
            <AffinityExpressionRow
              key={expression.id}
              expression={expression}
              onChange={onChange}
              onDelete={onDelete}
            />
          ))}
        </>
      )}
    </LabelsList>
  );
};

type AffinityExpressionListProps = {
  expressions: AffinityLabel[];
  addRowText: string;
  onAdd: () => void;
  onChange: (aff: AffinityLabel) => void;
  onDelete: (id: any) => void;
};
