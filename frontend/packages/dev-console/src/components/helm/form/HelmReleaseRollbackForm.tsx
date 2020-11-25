import * as React from 'react';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { FormikProps, FormikValues } from 'formik';
import { Form, FormGroup } from '@patternfly/react-core';
import { FormFooter, FormHeader } from '@console/shared';
import { SortByDirection } from '@patternfly/react-table';
import { Table } from '@console/internal/components/factory';
import { HelmRelease, HelmActionConfigType } from '../helm-types';

import RevisionListHeader from './rollback/RevisionListHeader';
import RevisionListRow from './rollback/RevisionListRow';
import { helmActionString } from '../helm-utils';

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
    <Trans t={t} ns="devconsole">
      Select the version to rollback <strong style={{ color: '#000' }}>{{ releaseName }}</strong>{' '}
      to, from the table below:
    </Trans>
  );

  return (
    <Form onSubmit={handleSubmit}>
      <FormHeader title={title} helpText={formHelpText} />
      <FormGroup fieldId="revision-list-field" label={t('devconsole~Revision History')} isRequired>
        <Table
          data={releaseHistory}
          defaultSortField="version"
          defaultSortOrder={SortByDirection.desc}
          aria-label={t('devconsole~CustomResources')}
          Header={RevisionListHeader(t)}
          Row={RevisionListRow}
          loaded={!!releaseHistory}
          virtualize
        />
      </FormGroup>
      <FormFooter
        handleReset={handleReset}
        errorMessage={status?.submitError}
        isSubmitting={status?.isSubmitting || isSubmitting}
        submitLabel={helmActionString(t)[helmAction]}
        disableSubmit={status?.isSubmitting || !dirty || !_.isEmpty(errors)}
        resetLabel={t('devconsole~Cancel')}
        sticky
      />
    </Form>
  );
};

export default HelmReleaseRollbackForm;
