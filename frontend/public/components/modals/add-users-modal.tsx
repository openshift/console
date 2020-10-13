import * as _ from 'lodash-es';
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
import { ListInput, HandlePromiseProps, withHandlePromise } from '../utils';
import { useTranslation } from 'react-i18next';

export const AddUsersModal = withHandlePromise((props: AddUsersModalProps) => {
  const [values, setValues] = React.useState(['']);

  const submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    // Append to an existing array, but handle the special case when the array is null.
    const patch = props.group.users
      ? _.map(values, (value: string) => ({ op: 'add', path: '/users/-', value }))
      : [{ op: 'add', path: '/users', value: values }];
    return props.handlePromise(k8sPatch(GroupModel, props.group, patch), props.close);
  };
  const { t } = useTranslation();

  return (
    <form onSubmit={submit} name="form" className="modal-content ">
      <ModalTitle>{t('add-users-modal~Add users')}</ModalTitle>
      <ModalBody>
        <p>{t('add-users-modal~Add new Users to Group {name}.', props.group.metadata)}</p>
        <ListInput
          label={t('add-users-modal~Users')}
          required
          initialValues={values}
          onChange={setValues}
        />
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={props.errorMessage}
        inProgress={props.inProgress}
        submitText={t('add-users-modal~Save')}
        cancel={props.cancel}
      />
    </form>
  );
});

export const addUsersModal = createModalLauncher(AddUsersModal);

export type AddUsersModalProps = {
  group: GroupKind;
} & ModalComponentProps &
  HandlePromiseProps;
