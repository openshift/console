import * as React from 'react';
import { NodeModel } from '@console/internal/models';
import { createModalLauncher, ModalComponentProps } from '@console/internal/components/factory';
import { Firehose } from '@console/internal/components/utils';
import { getName, getNamespace } from '@console/shared';
import { getVMLikeModel } from '../../../../selectors/vm';
import { VMLikeEntityKind } from '../../../../types/vmLike';
import { TModal } from './tolerations-modal';

const TolerationsModal: React.FC<TolerationsModalProps> = (props) => {
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
      <TModal vmLikeEntity={vmLikeEntity} {...restProps} />
    </Firehose>
  );
};

type TolerationsModalProps = ModalComponentProps & {
  vmLikeEntity: VMLikeEntityKind;
};

export default createModalLauncher(TolerationsModal);
