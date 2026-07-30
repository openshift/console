import type { FC } from 'react';
import { List, ListItem } from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { GitProvider } from '@console/git-service/src/types/git';
import type { RepositoryFormValues } from '../../import/import-types';

type PermissionsSectionProps = {
  formContextField?: string;
};

const PermissionsSection: FC<PermissionsSectionProps> = ({ formContextField }) => {
  const { t } = useTranslation('devconsole');
  const { values } = useFormikContext<RepositoryFormValues>();
  const { gitProvider } = _.get(values, formContextField) || values;

  let permission;
  switch (gitProvider) {
    case GitProvider.GITHUB:
      permission = (
        <List>
          <ListItem>{t('Commit comments')}</ListItem>
          <ListItem>{t('Issue comments')}</ListItem>
          <ListItem>{t('Pull request')}</ListItem>
          <ListItem>{t('Pushes')}</ListItem>
        </List>
      );
      break;
    case GitProvider.GITLAB:
      permission = (
        <List>
          <ListItem>{t('Merge request Events')}</ListItem>
          <ListItem>{t('Push Events')}</ListItem>
        </List>
      );
      break;
    case GitProvider.BITBUCKET:
      permission = (
        <List>
          <ListItem>{t('Repository: Push')}</ListItem>
          <ListItem>{t('Pull Request: Created')}</ListItem>
          <ListItem>{t('Pull Request: Updated')}</ListItem>
          <ListItem>{t('Pull Request: Comment Created')}</ListItem>
        </List>
      );
      break;
    default:
      permission = null;
  }
  return permission;
};

export default PermissionsSection;
