import * as React from 'react';
import { Formik, FormikValues, FormikHelpers } from 'formik';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import { k8sPatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { ResourceIcon } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { ApprovalTaskModel, PipelineRunModel } from '@console/pipelines-plugin/src/models';
import { ApprovalTaskKind } from '@console/pipelines-plugin/src/types';
import ApprovalModal from './ApprovalModal';

interface ApprovalProps {
  resource: ApprovalTaskKind;
  pipelineRunName?: string;
  userName?: string;
  type: string;
  cancel?: () => void;
  close?: () => void;
}

const Approval: React.FC<ApprovalProps> = ({
  resource,
  pipelineRunName,
  userName,
  type,
  cancel,
  close,
}) => {
  const { t } = useTranslation();
  const {
    metadata: { name, namespace },
    spec: { approvals },
  } = resource;

  const initialValues = {
    reason: '',
  };

  const handleSubmit = (values: FormikValues, action: FormikHelpers<FormikValues>) => {
    const updatedApprovals = approvals.map((approval) => {
      if (approval.name === userName) {
        return {
          ...approval,
          input: type === 'approve' ? 'true' : 'false',
          ...(values.reason && { message: values.reason }),
        };
      }
      return approval;
    });
    return k8sPatchResource({
      model: ApprovalTaskModel,
      resource,
      data: [
        {
          path: '/spec/approvals',
          op: 'replace',
          value: updatedApprovals,
        },
      ],
    })
      .then(() => {
        close();
      })
      .catch((err) => {
        const errMessage = err.message || t('pipelines-plugin~An error occurred. Please try again');
        action.setStatus({
          error: errMessage,
        });
      });
  };

  const labelTitle =
    type === 'approve' ? t('pipelines-plugin~Approve') : t('pipelines-plugin~Reject');

  const labelDescription = (
    <Trans t={t} ns="pipelines-plugin">
      <p>
        {type === 'approve'
          ? 'Are you sure you want to approve'
          : 'Please provide a reason for not approving'}{' '}
        <ResourceIcon kind={referenceForModel(ApprovalTaskModel)} />
        <Link to={`/k8s/ns/${namespace}/${referenceForModel(ApprovalTaskModel)}/${name}`}>
          {name}
        </Link>{' '}
        in <br />
        <ResourceIcon kind={referenceForModel(PipelineRunModel)} />
        <Link to={`/k8s/ns/${namespace}/${referenceForModel(PipelineRunModel)}/${pipelineRunName}`}>
          {pipelineRunName}
        </Link>
        ?
      </p>
    </Trans>
  );
  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onReset={cancel}
      initialStatus={{ error: '' }}
    >
      {(formikProps) => (
        <ApprovalModal
          {...formikProps}
          labelTitle={labelTitle}
          labelDescription={labelDescription}
          type={type}
          cancel={cancel}
        />
      )}
    </Formik>
  );
};

export default Approval;
