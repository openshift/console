import * as _ from 'lodash-es';
import * as React from 'react';

import {
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
  createModalLauncher,
} from '../../factory/modal';
import { HandlePromiseProps, withHandlePromise, Dropdown } from '../../utils';
import { Section } from '../utils/section';
import { RadioGroup } from '@console/internal/components/radio';
import { coFetchJSON } from '../../../co-fetch';
import { getId } from '../../../hypercloud/auth';

const radioItems = [
  {
    title: 'User',
    value: 'User',
  },
  {
    title: 'User Group',
    value: 'Group',
  },
];

const dropdownItems = {
  admin: 'Admin',
  developer: 'Developer',
  guest: 'Guest',
};

export const InviteMemberModal = withHandlePromise((props: InviteMemberModalProps) => {
  const [member, setMember] = React.useState('');
  const [type, setType] = React.useState('User');
  const [role, setRole] = React.useState('guest');
  const [errorMsg, setError] = React.useState('')

  const onChangeText = (e: any) => {
    setMember(e.target.value);
  }

  const submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    // Append to an existing array, but handle the special case when the array is null.
    coFetchJSON(`/api/multi-hypercloud/cluster/member?userId=${getId()}&cluster=${props.clusterName}&target${type}=${member}&remoteRole=${role}`, 'POST')
      .then((res) => {
        props.close();
      })
      .catch((err) => {
        setError("Fail to invite member(s). " + err);
      })
  };

  return (
    <form onSubmit={submit} name="form" className="modal-content ">
      <ModalTitle>Invite Members</ModalTitle>
      <ModalBody unsetOverflow={true}>
        <Section label="User / UserGroup" id="user" isRequired={true}>
          <div className="hc-invite-modal__input-members">
            <RadioGroup
              id="type"
              currentValue={type}
              items={radioItems}
              onChange={({ currentTarget }) => setType(currentTarget.value)}
              inline
            />
            <input className="pf-c-form-control" id="user" name="members" placeholder="Insert User / User Group Name" value={member} onChange={onChangeText} required />
          </div>
        </Section>
        <Section label="Role" id="role" isRequired={true}>
          <Dropdown className="btn-group" id="role" name="role" items={dropdownItems} selectedKey={role} onChange={(selection:string)=>setRole(selection)} />
        </Section>
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMsg}
        inProgress={props.inProgress}
        submitText="Invite"
        cancel={props.cancel}
      />
    </form>
  );
});

export const inviteMemberModal = createModalLauncher(InviteMemberModal);

export type InviteMemberModalProps = {
  clusterName: string;
} & ModalComponentProps &
  HandlePromiseProps;
