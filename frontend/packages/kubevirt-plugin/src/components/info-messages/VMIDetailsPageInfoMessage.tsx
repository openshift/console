import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, HintBlock } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { getOwnerReferences } from '@console/shared/src';
import { VirtualMachineInstanceModel, VirtualMachineModel } from '../../models/index';
import { kubevirtReferenceForModel } from '../../models/kubevirtReferenceForModel';
import { VMIKind } from '../../types';

const VMIDetailsPageInfoMessage: React.FC<InfoMessageHintBlockProps> = ({ name, namespace }) => {
  const { t } = useTranslation();
  const [vmi, isLoaded] = useK8sWatchResource<VMIKind>({
    kind: kubevirtReferenceForModel(VirtualMachineInstanceModel),
    name,
    namespace,
  });

  const isOwnedByVM =
    vmi &&
    !!getOwnerReferences<VMIKind>(vmi)?.find(({ kind }) => kind === VirtualMachineModel.kind);

  const showMessage = isLoaded && !isOwnedByVM && vmi !== null;

  return (
    showMessage && (
      <HintBlock
        className="kubevirt-vmi-details-page-info-message__hint-block"
        title={t('kubevirt-plugin~`Virtual Machine Instance {{name}}`', { name })}
      >
        <p>
          {t(
            'kubevirt-plugin~Consider using a Virtual Machine that will provide additional management capabilities to a VirtualMachineInstance inside the cluster.',
          )}
        </p>
        <ExternalLink
          href="https://kubevirt.io/user-guide/#/architecture?id=virtualmachine"
          text={t('kubevirt-plugin~Learn more')}
        />
      </HintBlock>
    )
  );
};

type InfoMessageHintBlockProps = {
  name: string;
  namespace: string;
};

export default VMIDetailsPageInfoMessage;
