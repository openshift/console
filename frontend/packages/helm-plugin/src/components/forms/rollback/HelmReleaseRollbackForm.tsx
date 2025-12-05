import * as React from 'react';
import { Form, FormGroup } from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { FormFooter, FormHeader, FormBody } from '@console/shared';
import { HelmRelease, HelmActionConfigType } from '../../../types/helm-types';
import { helmActionString } from '../../../utils/helm-utils';
import HelmReleaseHistoryTable from '../../details-page/history/HelmReleaseHistoryTable';

interface HelmReleaseRollbackFormProps {
  releaseName: string;
  releaseHistory: HelmRelease[];
  helmActionConfig: HelmActionConfigType;
}

type Props = FormikProps<FormikValues> & HelmReleaseRollbackFormProps;

const HelmReleaseRollbackForm: React.FC<Props> = ({
  errors,
  handleSubmit,
  handleReset,
  status,
  isSubmitting,
  dirty,
  releaseHistory,
  releaseName,
  helmActionConfig,
}) => {
  const { t } = useTranslation();
  const { type: helmAction, title } = helmActionConfig;

  const formHelpText = (
    <Trans t={t} ns="helm-plugin">
      {'Select the version to rollback '}
      <strong
        style={{
          color: 'var(--pf-t--global--text--color--regular)',
        }}
      >
        {{ releaseName }}
      </strong>{' '}
      to, from the table below:
    </Trans>
  );

  return (
    // display block so table horizontal scrolling works
    <Form onSubmit={handleSubmit} className="pf-v6-u-display-block">
      <FormBody>
        <FormHeader title={title} helpText={formHelpText} />
        <FormGroup
          fieldId="revision-list-field"
          label={t('helm-plugin~Revision history')}
          isRequired
        >
          <HelmReleaseHistoryTable releaseHistory={releaseHistory} />
        </FormGroup>
      </FormBody>
      <FormFooter
        handleReset={handleReset}
        errorMessage={status?.submitError}
        isSubmitting={isSubmitting}
        submitLabel={helmActionString(t)[helmAction]}
        disableSubmit={isSubmitting || !dirty || !_.isEmpty(errors)}
        resetLabel={t('helm-plugin~Cancel')}
        sticky
      />
    </Form>
  );
};

export default HelmReleaseRollbackForm;
