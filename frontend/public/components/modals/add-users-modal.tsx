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
import { ListInput } from '../utils/list-input';
import { useTranslation } from 'react-i18next';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';

export const AddUsersModal = (props: AddUsersModalProps) => {
  const [values, setValues] = React.useState(['']);
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();

  const submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    // Append to an existing array, but handle the special case when the array is null.
    const patch = props.group.users
      ? _.map(values, (value: string) => ({ op: 'add', path: '/users/-', value }))
      : [{ op: 'add', path: '/users', value: values }];
    handlePromise(k8sPatch(GroupModel, props.group, patch)).then(() => props.close());
  };
  const { t } = useTranslation();

  return (
    <form onSubmit={submit} name="form" className="modal-content ">
      <ModalTitle>{t('public~Add Users')}</ModalTitle>
      <ModalBody>
        <p>{t('public~Add new Users to Group {{name}}.', props.group.metadata)}</p>
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
