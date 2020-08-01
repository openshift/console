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

  return (
    <form onSubmit={submit} name="form" className="modal-content ">
      <ModalTitle>Add Users</ModalTitle>
      <ModalBody>
        <p>Add new users to group {props.group.metadata.name}.</p>
        <ListInput label="Users" required initialValues={values} onChange={setValues} />
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={props.errorMessage}
        inProgress={props.inProgress}
        submitText="Save"
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
