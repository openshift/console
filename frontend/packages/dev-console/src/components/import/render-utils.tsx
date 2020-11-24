import * as React from 'react';
import { TFunction } from 'i18next';
import { BitbucketIcon, GitAltIcon, GithubIcon, GitlabIcon } from '@patternfly/react-icons';
import CheIcon from './CheIcon';
import { detectGitType } from './import-validation-utils';
import { GitTypes } from './import-types';

export const routeDecoratorIcon = (
  routeURL: string,
  radius: number,
  t: TFunction,
  cheEnabled?: boolean,
): React.ReactElement => {
  if (cheEnabled && routeURL) {
    return <CheIcon style={{ fontSize: radius }} />;
  }
  switch (detectGitType(routeURL)) {
    case GitTypes.invalid:
      // Not a valid url and thus not safe to use
      return null;
    case GitTypes.github:
      return <GithubIcon style={{ fontSize: radius }} title={t('devconsole~Edit Source Code')} />;
    case GitTypes.bitbucket:
      return (
        <BitbucketIcon style={{ fontSize: radius }} title={t('devconsole~Edit Source Code')} />
      );
    case GitTypes.gitlab:
      return <GitlabIcon style={{ fontSize: radius }} title={t('devconsole~Edit Source Code')} />;
    default:
      return <GitAltIcon style={{ fontSize: radius }} title={t('devconsole~Edit Source Code')} />;
  }
};
