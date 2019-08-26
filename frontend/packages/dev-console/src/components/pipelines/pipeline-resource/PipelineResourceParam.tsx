import * as React from 'react';
import * as _ from 'lodash';
import { ActionGroup, ButtonVariant, Button } from '@patternfly/react-core';
import { CheckIcon, CloseIcon } from '@patternfly/react-icons';
import { useFormikContext, FormikValues } from 'formik';
import { ButtonBar } from '@console/internal/components/utils';
import PipelineGitOptions from './PipelineGitOptions';
import PipelineImageOptions from './PipelineImageOptions';
import PipelineClusterOptions from './PipelineClusterOptions';
import PipelineStorageOptions from './PipelineStorageOptions';
import './PipelineResourceParam.scss';

export interface PipelineResourceParamProps {
  type: string;
}

const PipelineResourceParam: React.FC<PipelineResourceParamProps> = ({ type }) => {
  const { errors, handleReset, status, isSubmitting, dirty, submitForm } = useFormikContext<
    FormikValues
  >();
  const handleCreateFormSubmit = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    submitForm();
  };
  const resourceComponent = (): React.ReactElement => {
    switch (type) {
      case 'git':
        return <PipelineGitOptions />;
      case 'image':
        return <PipelineImageOptions />;
      case 'cluster':
        return <PipelineClusterOptions />;
      case 'storage':
        return <PipelineStorageOptions />;
      default:
        return null;
    }
  };

  return (
    <div className="odc-pipeline-resource-param__content">
      {resourceComponent()}
      <ButtonBar errorMessage={status && status.submitError} inProgress={isSubmitting}>
        <ActionGroup className="pf-c-form pf-c-form__actions--right pf-c-form__group--no-top-margin">
          <Button
            type="button"
            variant={ButtonVariant.link}
            onClick={handleCreateFormSubmit}
            isDisabled={!dirty || !_.isEmpty(errors)}
            className="odc-pipeline-resource-param__action-btn"
            aria-label="create"
          >
            <CheckIcon />
          </Button>
          <Button
            type="button"
            className="odc-pipeline-resource-param__action-btn"
            variant={ButtonVariant.plain}
            onClick={handleReset}
            aria-label="close"
          >
            <CloseIcon />
          </Button>
        </ActionGroup>
      </ButtonBar>
    </div>
  );
};

export default PipelineResourceParam;
