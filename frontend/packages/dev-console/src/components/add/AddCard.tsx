import * as React from 'react';
import { Card, SimpleList, Title } from '@patternfly/react-core';
import { ResolvedExtension, AddAction } from '@console/dynamic-plugin-sdk';
import AddCardItem from './AddCardItem';
import './AddCard.scss';

type AddCardProps = { title: string; items: ResolvedExtension<AddAction>[]; namespace: string };
const AddCard: React.FC<AddCardProps> = ({ title, items, namespace }) => {
  const isTitleFromItem: boolean = items?.length === 1 && items[0].properties.label === title;
  return items?.length > 0 ? (
    <Card key={title} className="odc-add-card">
      {!isTitleFromItem && (
        <Title
          size="lg"
          headingLevel="h4"
          className="odc-add-card__title"
          data-test-id="odc-add-card-title"
        >
          {title}
        </Title>
      )}
      <SimpleList>
        {items.map((item) => (
          <AddCardItem key={item.properties.id} namespace={namespace} action={item} />
        ))}
      </SimpleList>
    </Card>
  ) : null;
};
export default AddCard;
