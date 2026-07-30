import type { FC } from 'react';
import { Form, FormGroup } from '@patternfly/react-core';
import type { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { FormBody } from '@console/shared/src/components/form-utils/FormBody';
import { FormFooter } from '@console/shared/src/components/form-utils/FormFooter';
import { FormHeader } from '@console/shared/src/components/form-utils/FormHeader';
import type { HelmRelease, HelmActionConfigType } from '../../../types/helm-types';
import { helmActionString } from '../../../utils/helm-utils';
import HelmReleaseHistoryTable from '../../details-page/history/HelmReleaseHistoryTable';

interface HelmReleaseRollbackFormProps {
  releaseName: string;
  releaseHistory: HelmRelease[];
  helmActionConfig: HelmActionConfigType;
}

type Props = FormikProps<FormikValues> & HelmReleaseRollbackFormProps;

const HelmReleaseRollbackForm: FC<Props> = ({
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
  const { t } = useTranslation('helm-plugin');
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
        <FormGroup fieldId="revision-list-field" label={t('Revision history')} isRequired>
          <HelmReleaseHistoryTable releaseHistory={releaseHistory} />
        </FormGroup>
      </FormBody>
      <FormFooter
        handleReset={handleReset}
        errorMessage={status?.submitError}
        isSubmitting={isSubmitting}
        submitLabel={helmActionString(t)[helmAction]}
        disableSubmit={isSubmitting || !dirty || !_.isEmpty(errors)}
        resetLabel={t('Cancel')}
        sticky
      />
    </Form>
  );
};

export default HelmReleaseRollbackForm;
