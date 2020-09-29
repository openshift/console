import * as React from 'react';
import { Button } from '@patternfly/react-core';

import { PopoverStatus } from '@console/shared';
import { NodeKind } from '@console/internal/module/k8s';
import NodeStatus from '../NodeStatus';
import { makeNodeSchedulable } from '../../../k8s/requests/nodes';
import { errorModal } from '@console/internal/components/modals';

const MarkAsSchedulablePopover: React.FC<MarkAsSchedulablePopoverProps> = ({ node }) => {
  const [visible, setVisible] = React.useState<boolean>(null);

  React.useEffect(() => {
    setVisible(null);
  }, [visible]);

  const onClickMarkAsSchedulable = async () => {
    try {
      await makeNodeSchedulable(node);
    } catch (err) {
      setVisible(false);
      errorModal({ error: err.message || 'An error occurred. Please try again' });
    }
  };

  return (
    <PopoverStatus
      title="Scheduling disabled"
      statusBody={<NodeStatus node={node} showPopovers />}
      isVisible={visible}
    >
      <p>
        No new Pods or workloads will be placed on this Node until it&apos;s marked as schedulable.
      </p>
      <Button isInline variant="link" onClick={onClickMarkAsSchedulable}>
        Mark as Schedulable
      </Button>
    </PopoverStatus>
  );
};

export default MarkAsSchedulablePopover;

type MarkAsSchedulablePopoverProps = {
  node: NodeKind;
};
