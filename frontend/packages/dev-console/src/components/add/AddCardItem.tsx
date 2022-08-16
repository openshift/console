import * as React from 'react';
import { SimpleListItem, Title, Text } from '@patternfly/react-core';
import { ResolvedExtension, AddAction } from '@console/dynamic-plugin-sdk';
import { useToast } from '@console/shared/src';
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
    properties: { id, label, icon, href, callback, description },
  },
  namespace,
}) => {
  const fireTelemetryEvent = useTelemetry();
  const [showDetails] = useShowAddCardItemDetails();
  const toast = useToast();

  const actionIcon = (): JSX.Element => {
    if (typeof icon === 'string') {
      return (
        <img
          className="odc-add-card-item__icon odc-add-card-item__img-icon"
          src={icon}
          alt={label}
          aria-hidden="true"
        />
      );
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
      href={href ? resolvedHref(href, namespace) : null}
      onClick={(e: React.SyntheticEvent) => {
        fireTelemetryEvent('Add Item Selected', {
          id,
          name: label,
        });
        if (href) {
          navigateTo(e, resolvedHref(href, namespace));
        } else if (callback) {
          callback({ namespace, toast });
        }
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
