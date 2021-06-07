import * as _ from 'lodash-es';
import * as React from 'react';
import { YellowExclamationTriangleIcon } from '@console/shared';

import { GroupModel } from '../../models';
import { GroupKind, k8sPatch } from '../../module/k8s';
import {
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
  createModalLauncher,
} from '../factory/modal';
import { HandlePromiseProps, withHandlePromise } from '../utils';
import { useTranslation } from 'react-i18next';

export const RemoveUserModal = withHandlePromise((props: RemoveUserModalProps) => {
  const submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const value = _.filter(props.group.users, (user: string) => user !== props.user);
    const patch = [{ op: 'replace', path: '/users', value }];
    return props.handlePromise(k8sPatch(GroupModel, props.group, patch), props.close);
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
        errorMessage={props.errorMessage}
        inProgress={props.inProgress}
        submitText={t('public~Remove')}
        cancel={props.cancel}
        submitDanger
      />
    </form>
  );
});

export const removeUserModal = createModalLauncher(RemoveUserModal);

export type RemoveUserModalProps = {
  group: GroupKind;
  user: string;
} & ModalComponentProps &
  HandlePromiseProps;
