import { isValidElement, memo } from 'react';
import { SimpleListItem, Title, Content } from '@patternfly/react-core';
import { useNavigate } from 'react-router-dom-v5-compat';
import type { ResolvedExtension, AddAction } from '@console/dynamic-plugin-sdk';
import { useToast } from '@console/shared/src';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { resolvedHref } from '../../utils/add-page-utils';
import { useShowAddCardItemDetails } from './hooks/useShowAddCardItemDetails';
import './AddCardItem.scss';

interface AddCardItemProps {
  action: ResolvedExtension<AddAction>;
  namespace: string;
}

const AddCardItem = memo<AddCardItemProps>(
  ({
    action: {
      properties: { id, label, icon, href, callback, description },
    },
    namespace,
  }) => {
    const navigate = useNavigate();
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
            data-test="add-card-icon"
          />
        );
      }
      if (typeof icon !== 'string' && isValidElement(icon)) {
        return (
          <span className="odc-add-card-item__icon" aria-hidden="true" data-test="add-card-icon">
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
        onClick={(e) => {
          const isModifiedClick =
            'metaKey' in e && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1);
          fireTelemetryEvent('Add Item Selected', {
            id,
            name: label,
          });

          // Allow modified clicks to open in new tab/window
          if (href && isModifiedClick) {
            return;
          }

          e.preventDefault();
          if (href) {
            navigate(resolvedHref(href, namespace));
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
          <Content component="p" className="odc-add-card-item__description" data-test="description">
            {description}
          </Content>
        )}
      </SimpleListItem>
    );
  },
);

export default AddCardItem;
