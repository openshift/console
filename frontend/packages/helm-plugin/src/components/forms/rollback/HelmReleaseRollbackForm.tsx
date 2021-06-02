import * as React from 'react';
import { Form, FormGroup } from '@patternfly/react-core';
import { SortByDirection } from '@patternfly/react-table';
import { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { Table } from '@console/internal/components/factory';
import { FormFooter, FormHeader, FormBody } from '@console/shared';
import { HelmRelease, HelmActionConfigType } from '../../../types/helm-types';
import { helmActionString } from '../../../utils/helm-utils';
import RevisionListHeader from './RevisionListHeader';
import RevisionListRow from './RevisionListRow';

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
      Select the version to rollback <strong style={{ color: '#000' }}>{{ releaseName }}</strong>{' '}
      to, from the table below:
    </Trans>
  );

  return (
    <Form onSubmit={handleSubmit}>
      <FormBody>
        <FormHeader title={title} helpText={formHelpText} />
        <FormGroup
          fieldId="revision-list-field"
          label={t('helm-plugin~Revision history')}
          isRequired
        >
          <Table
            data={releaseHistory}
            defaultSortField="version"
            defaultSortOrder={SortByDirection.desc}
            aria-label={t('helm-plugin~CustomResources')}
            Header={RevisionListHeader(t)}
            Row={RevisionListRow}
            loaded={!!releaseHistory}
            virtualize
          />
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
