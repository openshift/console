import * as React from 'react';
import { TextContent, Text, TextVariants, CardBody, Card } from '@patternfly/react-core';
import { BackingStoreKind, NamespaceStoreKind } from '../../types';

export const ReviewListTitle: React.FC<ReviewListTitleProps> = ({ text }) => (
  <dt>
    <TextContent>
      <Text component={TextVariants.h3}>{text}</Text>
    </TextContent>
  </dt>
);

type ReviewListTitleProps = { text: string };

export const ReviewListBody: React.FC<ReviewListBodyProps> = ({ children }) => <dd>{children}</dd>;

export const StoreCard: React.FC<StoreCardProp> = ({ resources }) =>
  !!resources.length && (
    <Card isCompact isFlat component="div">
      <CardBody isFilled>
        <TextContent>
          {resources.map((res) => (
            <Text key={res.metadata.name} component={TextVariants.small}>
              {res.metadata.name}
            </Text>
          ))}
        </TextContent>
      </CardBody>
    </Card>
  );

type StoreCardProp = {
  resources: (NamespaceStoreKind | BackingStoreKind)[];
};
type ReviewListBodyProps = {
  children: React.ReactNode;
};
