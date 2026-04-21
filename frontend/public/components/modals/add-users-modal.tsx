import * as React from 'react';

import { GroupModel } from '../../models';
import { GroupKind, k8sPatch } from '../../module/k8s';
import {
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
  createModalLauncher,
} from '../factory/modal';
import { ListInput } from '../utils';
import { useTranslation } from 'react-i18next';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';

export const AddUsersModal = (props: AddUsersModalProps) => {
  const [values, setValues] = React.useState(['']);
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();
  const { t } = useTranslation();

  const submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!props.group?.metadata?.name) {
      return;
    }
    const validUsers = values.map((v) => v.trim()).filter((v) => v.length > 0);
    if (validUsers.length === 0) {
      return;
    }
    const patch = props.group.users
      ? validUsers.map((value: string) => ({ op: 'add', path: '/users/-', value }))
      : [{ op: 'add', path: '/users', value: validUsers }];
    handlePromise(k8sPatch(GroupModel, props.group, patch)).then(() => props.close());
  };

  return (
    <form onSubmit={submit} name="form" className="modal-content ">
      <ModalTitle>{t('public~Add Users')}</ModalTitle>
      <ModalBody>
        <p>
          {t('public~Add new users to group {{name}}', { name: props.group?.metadata?.name })}
        </p>
        <ListInput label={t('public~Users')} required initialValues={values} onChange={setValues} />
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitText={t('public~Save')}
        cancel={props.cancel}
      />
    </form>
  );
};

export const addUsersModal = createModalLauncher(AddUsersModal);

export type AddUsersModalProps = {
  group: GroupKind;
} & ModalComponentProps;
