import type { FC } from 'react';
import { Button, ButtonVariant, Tooltip } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import GroupsEditorModal from '@console/app/src/components/nodes/modals/GroupsEditorModal';
import NodeGroupsEditorModal from '@console/app/src/components/nodes/modals/NodeGroupsEditorModal';
import { FLAG_OPENSHIFT_5 } from '@console/app/src/consts';
import { useAccessReview } from '@console/dynamic-plugin-sdk/src';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { useFlag } from '@console/dynamic-plugin-sdk/src/utils/flags';
import { NodeModel } from '@console/internal/models';
import type { NodeKind } from '@console/internal/module/k8s';

type NodeGroupEditButtonProps = {
  node?: NodeKind;
};

const NodeGroupEditButton: FC<NodeGroupEditButtonProps> = ({ node }) => {
  const { t } = useTranslation('console-app');
  const launchOverlay = useOverlay();
  const isOpenShift5 = useFlag(FLAG_OPENSHIFT_5);

  const [canEdit, isEditLoading] = useAccessReview({
    group: NodeModel.apiGroup || '',
    resource: NodeModel.plural,
    verb: 'patch',
  });

  if (!isOpenShift5) {
    return null;
  }

  const groupEditButton = (
    <Button
      variant={node ? ButtonVariant.link : ButtonVariant.secondary}
      isInline={!!node}
      onClick={() =>
        node ? launchOverlay(NodeGroupsEditorModal, { node }) : launchOverlay(GroupsEditorModal, {})
      }
      isDisabled={isEditLoading || !canEdit}
    >
      {node ? t('Edit') : t('Edit groups')}
    </Button>
  );

  if (isEditLoading || canEdit) {
    return groupEditButton;
  }

  return (
    <Tooltip
      content={t(
        'You do not have permission to edit groups. Contact your administrator for access.',
      )}
    >
      <span>{groupEditButton}</span>
    </Tooltip>
  );
};

export default NodeGroupEditButton;
