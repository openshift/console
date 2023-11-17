import * as React from 'react';
import { Card, SimpleList, Title } from '@patternfly/react-core';
import { ResolvedExtension, AddAction } from '@console/dynamic-plugin-sdk';
import { CodeRef } from '@console/dynamic-plugin-sdk/src/types';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import { isValidUrl } from '@console/shared';
import AddCardItem from './AddCardItem';
import './AddCard.scss';

type AddCardProps = {
  id: string;
  title: string;
  items: ResolvedExtension<AddAction>[];
  namespace: string;
  icon?: CodeRef<React.ReactNode> | string;
};

const AddCard: React.FC<AddCardProps> = ({ id, title, items, namespace, icon }) => {
  const isTitleFromItem: boolean = items?.length === 1 && items[0].properties.label === title;
  const actionIcon = (): JSX.Element => {
    if (typeof icon === 'string') {
      return (
        <img
          className="odc-add-card__icon odc-add-card__img-icon"
          src={isValidUrl(icon) ? icon : getImageForIconClass(icon)}
          aria-hidden="true"
          alt={title}
        />
      );
    }
    if (typeof icon !== 'string' && React.isValidElement(icon)) {
      return (
        <span className="odc-add-card__icon" aria-hidden="true">
          {icon}
        </span>
      );
    }
    return null;
  };
  return items?.length > 0 ? (
    <Card key={title} className="odc-add-card" data-test={`card ${id}`}>
      {!isTitleFromItem && (
        <Title size="lg" headingLevel="h2" className="odc-add-card__title" data-test="title">
          {actionIcon()}
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
