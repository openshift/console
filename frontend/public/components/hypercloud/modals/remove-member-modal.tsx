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

export const RemoveMemberModal = withHandlePromise((props: RemoveMemberModalProps) => {
  const [errorMsg, setError] = React.useState('')

  const submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    // Append to an existing array, but handle the special case when the array is null.
    coFetchJSON(`/api/multi-hypercloud/cluster/remove_member?userId=${getId()}&cluster=${props.clusterName}&target${props.type}=${props.member}`, 'POST')
      .then((res) => {
        props.close();
      })
      .catch((err) => {
        setError("Fail to remove member(s). " + err);
      })
  };

  return (
    <form onSubmit={submit} name="form" className="modal-content ">
        <ModalTitle>
          <YellowExclamationTriangleIcon className="co-icon-space-r" />
          {`Delete ${props.member}?`}
        </ModalTitle>
        <ModalBody className="modal-body">
          <div>
            Are you sure you want to delete {props.type} <strong className="co-break-word">{props.member}</strong> in cluster <strong>{props.clusterName}</strong>?
          </div>
        </ModalBody>
        <ModalSubmitFooter errorMessage={errorMsg} inProgress={props.inProgress} submitText='Delete' cancel={props.cancel} />
      </form>
  );
});

export const removeMemberModal = createModalLauncher(RemoveMemberModal);

export type RemoveMemberModalProps = {
  clusterName: string;
  type: string;
  member: string;
} & ModalComponentProps &
  HandlePromiseProps;
