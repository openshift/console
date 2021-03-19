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
import { YellowExclamationTriangleIcon } from '@console/shared';
import { coFetchJSON } from '../../../co-fetch';
import { getId } from '../../../hypercloud/auth';
import { useTranslation } from 'react-i18next';

export const RemoveMemberModal = withHandlePromise((props: RemoveMemberModalProps) => {
  const [errorMsg, setError] = React.useState('')

  const submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    coFetchJSON(`/api/multi-hypercloud/cluster/remove_member?userId=${getId()}&cluster=${props.clusterName}&target${props.member.type}=${props.member.type === 'user' ? props.member.email : props.member.name}`, 'POST')
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
        <YellowExclamationTriangleIcon className="co-icon-space-r" />
        {t('MULTI:MSG_MULTI_CLUSTERS_DELETEPEPLEPOPUP_TITLE_1')}
      </ModalTitle>
      <ModalBody className="modal-body">
        <div>
          {t('MULTI:MSG_MULTI_CLUSTERS_DELETEPEPLEPOPUP_MAINMESSAGE_1', { 0: props.member.name, 1: props.clusterName })}
        </div>
      </ModalBody>
      <ModalSubmitFooter errorMessage={errorMsg} inProgress={props.inProgress} submitText='Delete' cancelText={t('MULTI:MSG_MULTI_CLUSTERS_INVITEPEOPLEPOPUP_BUTTON_2')} cancel={props.cancel} />
    </form>
  );
});

export const removeMemberModal = createModalLauncher(RemoveMemberModal);

export type RemoveMemberModalProps = {
  clusterName: string;
  member: {
    name: string,
    role: string,
    type: 'user' | 'group',
    email: string
  };
} & ModalComponentProps &
  HandlePromiseProps;
