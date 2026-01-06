import * as _ from 'lodash';
import type { FormEventHandler } from 'react';
import { YellowExclamationTriangleIcon } from '@console/shared/src/components/status/icons';

import { GroupModel } from '../../models';
import { GroupKind, k8sPatch } from '../../module/k8s';
import {
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
  createModalLauncher,
} from '../factory/modal';
import { useTranslation } from 'react-i18next';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';

export const RemoveUserModal = (props: RemoveUserModalProps) => {
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();

  const submit: FormEventHandler<HTMLFormElement> = (e): void => {
    e.preventDefault();
    const value = _.filter(props.group.users, (user: string) => user !== props.user);
    const patch = [{ op: 'replace', path: '/users', value }];
    handlePromise(k8sPatch(GroupModel, props.group, patch))
      .then(() => props.close())
      .catch(() => {});
  };

  const { t } = useTranslation();
  return (
    <form onSubmit={submit} name="form" className="modal-content ">
      <ModalTitle>
        <YellowExclamationTriangleIcon className="co-icon-space-r" />
        {t('public~Remove User from Group?')}
      </ModalTitle>
      <ModalBody>
        {t('public~Remove User {{ user }} from Group {{ name }}?', {
          user: props.user,
          name: props.group.metadata.name,
        })}
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitText={t('public~Remove')}
        cancel={props.cancel}
        submitDanger
      />
    </form>
  );
};

export const removeUserModal = createModalLauncher(RemoveUserModal);

export type RemoveUserModalProps = {
  group: GroupKind;
  user: string;
} & ModalComponentProps;
