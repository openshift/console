import * as React from 'react';
import { List, ListItem } from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import * as _ from 'lodash';
import { GitProvider } from '@console/git-service';
import { RepositoryFormValues } from '../types';

type PermissionsSectionProps = {
  formContextField?: string;
};

const PermissionsSection: React.FC<PermissionsSectionProps> = ({ formContextField }) => {
  const { values } = useFormikContext<RepositoryFormValues>();
  const { gitProvider } = _.get(values, formContextField) || values;

  let permission;
  switch (gitProvider) {
    case GitProvider.GITHUB:
      permission = (
        <List>
          <ListItem>Commit comments</ListItem>
          <ListItem>Issue comments</ListItem>
          <ListItem>Pull request</ListItem>
          <ListItem>Pushes</ListItem>
        </List>
      );
      break;
    case GitProvider.GITLAB:
      permission = (
        <List>
          <ListItem>Merge request Events</ListItem>
          <ListItem>Push Events</ListItem>
          <ListItem>Note Events</ListItem>
        </List>
      );
      break;
    case GitProvider.BITBUCKET:
      permission = (
        <List>
          <ListItem>Repository: Push</ListItem>
          <ListItem>Pull Request: Created</ListItem>
          <ListItem>Pull Request: Updated</ListItem>
          <ListItem>Pull Request: Comment Created</ListItem>
        </List>
      );
      break;
    default:
      permission = null;
  }
  return permission;
};

export default PermissionsSection;
