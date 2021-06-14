import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { errorModal } from '@console/internal/components/modals';
import { NodeKind } from '@console/internal/module/k8s';
import { PopoverStatus } from '@console/shared';
import { makeNodeSchedulable } from '../../../k8s/requests/nodes';
import NodeStatus from '../NodeStatus';

const MarkAsSchedulablePopover: React.FC<MarkAsSchedulablePopoverProps> = ({ node }) => {
  const [visible, setVisible] = React.useState<boolean>(null);
  const { t } = useTranslation();
  React.useEffect(() => {
    setVisible(null);
  }, [visible]);

  const onClickMarkAsSchedulable = async () => {
    try {
      await makeNodeSchedulable(node);
    } catch (err) {
      setVisible(false);
      errorModal({ error: err.message || t('nodes~An error occurred. Please try again') });
    }
  };

  return (
    <PopoverStatus
      title={t('nodes~Scheduling disabled')}
      statusBody={<NodeStatus node={node} showPopovers />}
      isVisible={visible}
    >
      <p>
        {t(
          "nodes~No new Pods or workloads will be placed on this Node until it's marked as schedulable.",
        )}
      </p>
      <Button isInline variant="link" onClick={onClickMarkAsSchedulable}>
        {t('nodes~Mark as schedulable')}
      </Button>
    </PopoverStatus>
  );
};

export default MarkAsSchedulablePopover;

type MarkAsSchedulablePopoverProps = {
  node: NodeKind;
};
