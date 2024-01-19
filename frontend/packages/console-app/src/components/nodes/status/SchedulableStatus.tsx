import * as React from 'react';
import { Button, Stack, StackItem, ExpandableSection } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  IsNodeStatusActive,
  NodePopoverContentProps,
  StatusIconAndText,
  YellowExclamationTriangleIcon,
} from '@console/dynamic-plugin-sdk';
import { errorModal } from '@console/internal/components/modals';
import { makeNodeSchedulable } from '../../../k8s/requests/nodes';

type NodeStatusResources = {};

export const isUnschedulableActive: IsNodeStatusActive<NodeStatusResources> = (node) =>
  !!node.spec.unschedulable;

export const MarkAsSchedulablePopover: React.FC<NodePopoverContentProps<NodeStatusResources>> = ({
  node,
}) => {
  const { t } = useTranslation();
  const [isExpanded, setExpanded] = React.useState(true);

  const onClickMarkAsSchedulable = async () => {
    try {
      await makeNodeSchedulable(node);
    } catch (err) {
      errorModal({ error: err.message || t('console-app~An error occurred. Please try again') });
    }
  };

  return (
    <ExpandableSection
      isExpanded={isExpanded}
      onToggle={(_, expanded) => setExpanded(expanded)}
      toggleContent={
        <StatusIconAndText
          title={t('console-app~Scheduling disabled')}
          icon={<YellowExclamationTriangleIcon />}
        />
      }
    >
      <Stack hasGutter>
        <StackItem>
          {t(
            "console-app~No new Pods or workloads will be placed on this Node until it's marked as schedulable.",
          )}
        </StackItem>
        <StackItem>
          <Button isInline variant="link" onClick={onClickMarkAsSchedulable}>
            {t('console-app~Mark as schedulable')}
          </Button>
        </StackItem>
      </Stack>
    </ExpandableSection>
  );
};
