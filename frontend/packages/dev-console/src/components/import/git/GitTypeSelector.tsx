import * as React from 'react';
import { Tile, Flex, FlexItem, FormGroup } from '@patternfly/react-core';
import {
  GithubIcon,
  GitlabIcon,
  BitbucketIcon,
  GitAltIcon,
} from '@patternfly/react-icons/dist/esm/icons';
import { FormikValues, useFormikContext } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { GitProvider } from '@console/git-service/src';
import GiteaIcon from '../GiteaIcon';
import { GitReadableTypes } from '../import-types';

import './GitTypeSelector.scss';

type GitTypeSelectorProps = {
  fieldPrefix: string;
};

const GitTypeSelector: React.FC<GitTypeSelectorProps> = ({ fieldPrefix }) => {
  const { values, setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const { t } = useTranslation();

  const handleGitTypeChange = (gitType: GitProvider) => {
    setFieldValue(`${fieldPrefix}git.type`, gitType, false);
    setFieldTouched(`${fieldPrefix}git.type`, true, false);
  };
  const typeValue = _.get(values, `${fieldPrefix}git.type`);

  return (
    <>
      <FormGroup label={t('devconsole~Git type')} isRequired id="git-type">
        <Flex spaceItems={{ default: 'spaceItemsSm' }}>
          <FlexItem>
            <Tile
              className="odc-git-type-selector"
              title={GitReadableTypes[GitProvider.GITHUB]}
              icon={<GithubIcon />}
              onClick={() => handleGitTypeChange(GitProvider.GITHUB)}
              isSelected={typeValue === GitProvider.GITHUB}
              id="git-type-github"
            />
          </FlexItem>
          <FlexItem>
            <Tile
              className="odc-git-type-selector"
              title={GitReadableTypes[GitProvider.GITLAB]}
              icon={<GitlabIcon />}
              onClick={() => handleGitTypeChange(GitProvider.GITLAB)}
              isSelected={typeValue === GitProvider.GITLAB}
              id="git-type-gitlab"
            />
          </FlexItem>
          <FlexItem>
            <Tile
              className="odc-git-type-selector"
              title={GitReadableTypes[GitProvider.BITBUCKET]}
              icon={<BitbucketIcon />}
              onClick={() => handleGitTypeChange(GitProvider.BITBUCKET)}
              isSelected={typeValue === GitProvider.BITBUCKET}
              id="git-type-bitbucket"
            />
          </FlexItem>
          <FlexItem>
            <Tile
              className="odc-git-type-selector"
              title={GitReadableTypes[GitProvider.GITEA]}
              icon={<GiteaIcon />}
              onClick={() => handleGitTypeChange(GitProvider.GITEA)}
              isSelected={typeValue === GitProvider.GITEA}
              id="git-type-gitea"
            />
          </FlexItem>
          <FlexItem>
            <Tile
              className="odc-git-type-selector"
              title={GitReadableTypes[GitProvider.UNSURE]}
              icon={<GitAltIcon />}
              onClick={() => handleGitTypeChange(GitProvider.UNSURE)}
              isSelected={typeValue === GitProvider.UNSURE}
              id="git-type-other"
            />
          </FlexItem>
        </Flex>
      </FormGroup>
    </>
  );
};

export default GitTypeSelector;
