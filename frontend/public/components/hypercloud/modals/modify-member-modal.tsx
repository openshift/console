import * as _ from 'lodash-es';
import * as React from 'react';

import {
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
  createModalLauncher,
} from '../../factory/modal';
import { HandlePromiseProps, withHandlePromise } from '../../utils';
import { Section } from '../utils/section';
import { RadioGroup } from '@console/internal/components/radio';
import { coFetchJSON } from '../../../co-fetch';
import { getId, getUserGroup } from '../../../hypercloud/auth';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';

const roleItems = (t?: TFunction) => [
  {
    title: t('COMMON:MSG_DETAILS_TABACCESSPERMISSIONS_RADIOBUTTON_1'),
    value: 'admin',
  },
  {
    title: t('COMMON:MSG_DETAILS_TABACCESSPERMISSIONS_RADIOBUTTON_2'),
    value: 'developer',
  },
  {
    title: t('COMMON:MSG_DETAILS_TABACCESSPERMISSIONS_RADIOBUTTON_3'),
    value: 'guest'
  },
];


export const ModifyMemberModal = withHandlePromise((props: ModifyMemberModalProps) => {
  const [role, setRole] = React.useState(props.member.role);
  const [errorMsg, setError] = React.useState('')

  const submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    coFetchJSON(`/api/multi-hypercloud/cluster/${props.clusterName}/update_role/${props.member.type}/${props.member.type === 'user' ? props.member.email : props.member.name}?userId=${getId()}${getUserGroup()}&remoteRole=${role}`, 'PUT')
      .then((res) => {
        props.close();
      })
      .catch((err) => {
        setError(err);
      })
  };

  const { t } = useTranslation();
  return (
    <form onSubmit={submit} name="form" className="modal-content ">
      <ModalTitle>
        {t('MULTI:MSG_MULTI_CLUSTERS_CHANGEPERMISSIONSPOPUP_TITLE_1')}
      </ModalTitle>
      <ModalBody className="modal-body">
        <Section id='role'>
          <RadioGroup
            id='role'
            currentValue={role}
            items={roleItems.bind(null, t)()}
            onChange={({ currentTarget }) => setRole(currentTarget.value)}
          />
        </Section>
      </ModalBody>
      <ModalSubmitFooter errorMessage={errorMsg} inProgress={props.inProgress} submitText={t('COMMON:MSG_COMMON_BUTTON_COMMIT_3')} cancelText={t('COMMON:MSG_COMMON_BUTTON_COMMIT_2')} cancel={props.cancel} />
    </form>
  );
});

export const modifyMemberModal = createModalLauncher(ModifyMemberModal);

export type ModifyMemberModalProps = {
  clusterName: string;
  member: {
    name: string,
    role: string,
    type: 'user' | 'group',
    email: string
  };
} & ModalComponentProps &
  HandlePromiseProps;
