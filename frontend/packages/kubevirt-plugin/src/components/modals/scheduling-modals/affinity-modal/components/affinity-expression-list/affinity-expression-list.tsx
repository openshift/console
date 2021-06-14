import * as React from 'react';
import { GridItem, Text, TextVariants } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { LabelsList } from '../../../../../LabelsList/labels-list';
import { AffinityLabel } from '../../types';
import { AffinityExpressionRow } from './affinity-expression-row';

export const AffinityExpressionList = ({
  expressions,
  addRowText,
  onAdd,
  onChange,
  onDelete,
  rowID,
}: AffinityExpressionListProps) => {
  const { t } = useTranslation();
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
            <Text component={TextVariants.h6}>{t('kubevirt-plugin~Key')}</Text>
          </GridItem>
          <GridItem span={2}>
            <Text component={TextVariants.h6}>{t('kubevirt-plugin~Operator')}</Text>
          </GridItem>
          <GridItem span={6}>
            <Text component={TextVariants.h6}>{t('kubevirt-plugin~Values')}</Text>
          </GridItem>
          {expressions.map((expression) => (
            <AffinityExpressionRow
              key={expression.id}
              expression={expression}
              onChange={onChange}
              onDelete={onDelete}
              rowID={rowID}
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
  rowID: string;
};
