import * as React from 'react';
import { NodeModel } from '@console/internal/models';
import { createModalLauncher, ModalComponentProps } from '@console/internal/components/factory';
import { Firehose } from '@console/internal/components/utils';
import { getName, getNamespace } from '@console/shared';
import { getVMLikeModel } from '../../../../selectors/vm';
import { VMLikeEntityKind } from '../../../../types/vmLike';
import { NSModal } from './node-selector-modal';

const NodeSelectorModal: React.FC<NodeSelectorModalProps> = (props) => {
  const { vmLikeEntity, ...restProps } = props;

  const resources = [
    {
      kind: getVMLikeModel(vmLikeEntity).kind,
      name: getName(vmLikeEntity),
      namespace: getNamespace(vmLikeEntity),
      prop: 'vmLikeEntityLoading',
    },
    {
      kind: NodeModel.kind,
      isList: true,
      namespaced: false,
      prop: 'nodes',
    },
  ];

  return (
    <Firehose resources={resources}>
      <NSModal vmLikeEntity={vmLikeEntity} {...restProps} />
    </Firehose>
  );
};

type NodeSelectorModalProps = ModalComponentProps & {
  vmLikeEntity: VMLikeEntityKind;
};

export default createModalLauncher(NodeSelectorModal);
