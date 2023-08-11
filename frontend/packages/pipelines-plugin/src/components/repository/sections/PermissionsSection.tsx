import * as React from 'react';
import { List, ListItem } from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { GitProvider } from '@console/git-service';
import { RepositoryFormValues } from '../types';

type PermissionsSectionProps = {
  formContextField?: string;
};

const PermissionsSection: React.FC<PermissionsSectionProps> = ({ formContextField }) => {
  const { t } = useTranslation();
  const { values } = useFormikContext<RepositoryFormValues>();
  const { gitProvider } = _.get(values, formContextField) || values;

  let permission;
  switch (gitProvider) {
    case GitProvider.GITHUB:
      permission = (
        <List>
          <ListItem>{t('pipelines-plugin~Commit comments')}</ListItem>
          <ListItem>{t('pipelines-plugin~Issue comments')}</ListItem>
          <ListItem>{t('pipelines-plugin~Pull request')}</ListItem>
          <ListItem>{t('pipelines-plugin~Pushes')}</ListItem>
        </List>
      );
      break;
    case GitProvider.GITLAB:
      permission = (
        <List>
          <ListItem>{t('pipelines-plugin~Merge request Events')}</ListItem>
          <ListItem>{t('pipelines-plugin~Push Events')}</ListItem>
        </List>
      );
      break;
    case GitProvider.BITBUCKET:
      permission = (
        <List>
          <ListItem>{t('pipelines-plugin~Repository: Push')}</ListItem>
          <ListItem>{t('pipelines-plugin~Pull Request: Created')}</ListItem>
          <ListItem>{t('pipelines-plugin~Pull Request: Updated')}</ListItem>
          <ListItem>{t('pipelines-plugin~Pull Request: Comment Created')}</ListItem>
        </List>
      );
      break;
    default:
      permission = null;
  }
  return permission;
};

export default PermissionsSection;
