import * as React from 'react';
import { Checkbox, Text, TextVariants } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalTitle,
} from '@console/internal/components/factory';
import { HandlePromiseProps, withHandlePromise } from '@console/internal/components/utils';
import { k8sPatch } from '@console/internal/module/k8s';
import { getEvictionStrategyPatch } from '../../../../k8s/patches/vm/vm-scheduling-patches';
import { getVMLikeModel } from '../../../../selectors/vm/vmlike';
import { VMLikeEntityKind } from '../../../../types/vmLike';
import { ModalFooter } from '../../modal/modal-footer';

import '../shared/scheduling-modals.scss';

const EvictionStrategyModal = withHandlePromise<EvictionStrategyModalWithPromiseProps>((props) => {
  const { vmLikeEntity, evictionStrategy, inProgress, close, handlePromise } = props;

  const { t } = useTranslation();
  const [isCheckedEvictionStrategy, setIsCheckedEvictionStrategy] = React.useState<boolean>(
    !!evictionStrategy,
  );

  const onModalSubmit = () => {
    if (isCheckedEvictionStrategy !== !!evictionStrategy) {
      handlePromise(
        k8sPatch(
          getVMLikeModel(vmLikeEntity),
          vmLikeEntity,
          getEvictionStrategyPatch(vmLikeEntity, isCheckedEvictionStrategy),
        ),
        close,
      );
    }
  };

  return (
    <div className="modal-content">
      <ModalTitle>{t('kubevirt-plugin~Eviction Strategy')}</ModalTitle>
      <ModalBody>
        <Checkbox
          id="eviction-strategy"
          className="kubevirt-scheduling__checkbox"
          isChecked={isCheckedEvictionStrategy}
          onChange={() => setIsCheckedEvictionStrategy((value) => !value)}
          label={t('kubevirt-plugin~LiveMigrate')}
        />
        <Text className="kubevirt-scheduling__helper-text" component={TextVariants.small}>
          {t(
            'kubevirt-plugin~EvictionStrategy can be set to "LiveMigrate" if the VirtualMachineInstance should be migrated instead of shut-off in case of a node drain.',
          )}
        </Text>
      </ModalBody>
      <ModalFooter
        onCancel={close}
        inProgress={inProgress}
        onSubmit={onModalSubmit}
        submitButtonText={t('kubevirt-plugin~Save')}
      />
    </div>
  );
});

type EvictionStrategyModalWithPromiseProps = HandlePromiseProps &
  ModalComponentProps & {
    vmLikeEntity: VMLikeEntityKind;
    evictionStrategy: string;
  };

export default createModalLauncher(EvictionStrategyModal);
