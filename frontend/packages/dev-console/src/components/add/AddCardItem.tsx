import * as React from 'react';
import { SimpleListItem, Title, Text } from '@patternfly/react-core';
import { ResolvedExtension, AddAction } from '@console/dynamic-plugin-sdk';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { navigateTo, resolvedHref } from '../../utils/add-page-utils';
import { useShowAddCardItemDetails } from './hooks/useShowAddCardItemDetails';
import './AddCardItem.scss';

type AddCardItemProps = {
  action: ResolvedExtension<AddAction>;
  namespace: string;
};

const AddCardItem: React.FC<AddCardItemProps> = ({
  action: {
    properties: { id, label, icon, href, description },
  },
  namespace,
}) => {
  const fireTelemetryEvent = useTelemetry();
  const [showDetails] = useShowAddCardItemDetails();

  const actionIcon = (): JSX.Element => {
    if (typeof icon === 'string') {
      return <img className="odc-add-card-item__icon" src={icon} alt={label} aria-hidden="true" />;
    }
    if (typeof icon !== 'string' && React.isValidElement(icon)) {
      return (
        <span className="odc-add-card-item__icon" aria-hidden="true">
          {icon}
        </span>
      );
    }
    return null;
  };

  return (
    <SimpleListItem
      component="a"
      componentProps={{
        'data-test': `item ${id}`,
      }}
      href={resolvedHref(href, namespace)}
      onClick={(e: React.SyntheticEvent) => {
        fireTelemetryEvent('Add Item Selected', {
          id,
          name: label,
        });
        navigateTo(e, resolvedHref(href, namespace));
      }}
      className="odc-add-card-item"
    >
      <Title headingLevel="h3" size="md" className="odc-add-card-item__title" data-test="title">
        {actionIcon()}
        {label}
      </Title>
      {showDetails && (
        <Text className="odc-add-card-item__description" data-test="description">
          {description}
        </Text>
      )}
    </SimpleListItem>
  );
};

export default AddCardItem;
