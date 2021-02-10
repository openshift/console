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

const radioItems = (disabled:boolean) => [
  {
    title: 'User',
    value: 'User',
    disabled
  },
  {
    title: 'User Group',
    value: 'Group',
    disabled
  },
];

const dropdownItems = {
  admin: 'Admin',
  developer: 'Developer',
  guest: 'Guest',
};

export const InviteMemberModal = withHandlePromise((props: InviteMemberModalProps) => {
  const [member, setMember] = React.useState(props.member ?? '');
  const [type, setType] = React.useState(props.type ?? 'User');
  const [role, setRole] = React.useState(props.role ?? 'guest');
  const [errorMsg, setError] = React.useState('')

  const isUpdate = props.requestType === 'update';

  const onChangeText = (e: any) => {
    setMember(e.target.value);
  }

  const submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    // Append to an existing array, but handle the special case when the array is null.
    coFetchJSON(`/api/multi-hypercloud/cluster/member?userId=${getId()}&cluster=${props.clusterName}&target${type}=${member}&remoteRole=${role}`, isUpdate ? 'PUT' : 'POST')
      .then((res) => {
        props.close();
      })
      .catch((err) => {
        setError("Fail to invite/update member(s). " + err);
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
              items={radioItems(isUpdate)}
              onChange={({ currentTarget }) => setType(currentTarget.value)}
              inline
            />
            <input className="pf-c-form-control" id="user" name="members" placeholder="Insert User / User Group Name" value={member} onChange={onChangeText} required disabled={isUpdate} />
          </div>
        </Section>
        <Section label="Role" id="role" isRequired={true}>
          <Dropdown className="btn-group" id="role" name="role" items={dropdownItems} selectedKey={role} onChange={(selection:string)=>setRole(selection)} />
        </Section>
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMsg}
        inProgress={props.inProgress}
        submitText={isUpdate ? "Update" : "Invite"}
        cancel={props.cancel}
      />
    </form>
  );
});

export const inviteMemberModal = createModalLauncher(InviteMemberModal);

export type InviteMemberModalProps = {
  clusterName: string;
  type: string;
  member: string;
  role: string;
  requestType: string;
} & ModalComponentProps &
  HandlePromiseProps;
