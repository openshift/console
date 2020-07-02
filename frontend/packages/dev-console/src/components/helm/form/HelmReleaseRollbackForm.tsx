import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps, FormikValues } from 'formik';
import { Form, FormGroup } from '@patternfly/react-core';
import { FormFooter, FormHeader } from '@console/shared';
import { SortByDirection } from '@patternfly/react-table';
import { Table } from '@console/internal/components/factory';
import { HelmRelease, HelmActionConfigType } from '../helm-types';

import RevisionListHeader from './rollback/RevisionListHeader';
import RevisionListRow from './rollback/RevisionListRow';

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
  const { type: helmAction, title } = helmActionConfig;

  const formHelpText = (
    <>
      Select the version to rollback <strong style={{ color: '#000' }}>{releaseName}</strong> to,
      from the table below:
    </>
  );

  return (
    <Form onSubmit={handleSubmit}>
      <FormHeader title={title} helpText={formHelpText} />
      <FormGroup fieldId="revision-list-field" label="Revision History" isRequired>
        <Table
          data={releaseHistory}
          defaultSortField="version"
          defaultSortOrder={SortByDirection.desc}
          aria-label="CustomResources"
          Header={RevisionListHeader}
          Row={RevisionListRow}
          loaded={!!releaseHistory}
          virtualize
        />
      </FormGroup>
      <FormFooter
        handleReset={handleReset}
        errorMessage={status?.submitError}
        isSubmitting={status?.isSubmitting || isSubmitting}
        submitLabel={helmAction}
        disableSubmit={status?.isSubmitting || !dirty || !_.isEmpty(errors)}
        resetLabel="Cancel"
        sticky
      />
    </Form>
  );
};

export default HelmReleaseRollbackForm;
