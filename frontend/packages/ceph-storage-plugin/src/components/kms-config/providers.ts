import * as React from 'react';
import { ModalComponentProps } from '@console/internal/components/factory/modal';
import { HandlePromiseProps } from '@console/internal/components/utils/promise-component';
import { Action, State } from '../ocs-install/attached-devices-mode/reducer';
import { InternalClusterAction, InternalClusterState } from '../ocs-install/internal-mode/reducer';
import { CreateStorageSystemAction, WizardState } from '../create-storage-system/reducer';

export type EncryptionDispatch = React.Dispatch<
  Action | InternalClusterAction | CreateStorageSystemAction
>;

export type KMSConfigureProps = {
  state:
    | InternalClusterState
    | State
    | Pick<WizardState['securityAndNetwork'], 'encryption' | 'kms'>;
  dispatch: EncryptionDispatch;
  className: string;
  infraType?: string;
  mode?: string;
  isWizardFlow?: boolean;
};

export type AdvancedKMSModalProps = {
  state:
    | InternalClusterState
    | State
    | Pick<WizardState['securityAndNetwork'], 'encryption' | 'kms'>;
  dispatch: EncryptionDispatch;
  mode?: string;
} & HandlePromiseProps &
  ModalComponentProps;
