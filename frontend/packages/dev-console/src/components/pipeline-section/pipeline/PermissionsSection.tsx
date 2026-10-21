import type { FC } from 'react';
import { List, ListItem } from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { GitProvider } from '@console/git-service';
import type { RepositoryFormValues } from '../../import/import-types';

type PermissionsSectionProps = {
  formContextField?: string;
};

const PermissionsSection: FC<PermissionsSectionProps> = ({ formContextField }) => {
  const { t } = useTranslation();
  const { values } = useFormikContext<RepositoryFormValues>();
  const { gitProvider } = _.get(values, formContextField) || values;

  let permission;
  switch (gitProvider) {
    case GitProvider.GITHUB:
      permission = (
        <List>
          <ListItem>{t('devconsole~Commit comments')}</ListItem>
          <ListItem>{t('devconsole~Issue comments')}</ListItem>
          <ListItem>{t('devconsole~Pull request')}</ListItem>
          <ListItem>{t('devconsole~Pushes')}</ListItem>
        </List>
      );
      break;
    case GitProvider.GITLAB:
      permission = (
        <List>
          <ListItem>{t('devconsole~Merge request Events')}</ListItem>
          <ListItem>{t('devconsole~Push Events')}</ListItem>
        </List>
      );
      break;
    case GitProvider.BITBUCKET:
      permission = (
        <List>
          <ListItem>{t('devconsole~Repository: Push')}</ListItem>
          <ListItem>{t('devconsole~Pull Request: Created')}</ListItem>
          <ListItem>{t('devconsole~Pull Request: Updated')}</ListItem>
          <ListItem>{t('devconsole~Pull Request: Comment Created')}</ListItem>
        </List>
      );
      break;
    default:
      permission = null;
  }
  return permission;
};

export default PermissionsSection;
