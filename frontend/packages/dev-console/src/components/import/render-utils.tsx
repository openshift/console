import * as React from 'react';
import { BitbucketIcon, GitAltIcon, GithubIcon, GitlabIcon } from '@patternfly/react-icons';
import i18next from 'i18next';
import CheIcon from './CheIcon';
import { GitTypes } from './import-types';
import { detectGitType } from './import-validation-utils';

export const routeDecoratorIcon = (
  routeURL: string,
  radius: number,
  cheEnabled?: boolean,
  cheIconURL?: string,
): React.ReactElement => {
  if (cheEnabled && routeURL) {
    return cheIconURL ? (
      <image xlinkHref={cheIconURL} width={radius} height={radius} />
    ) : (
      <CheIcon style={{ fontSize: radius }} />
    );
  }
  switch (detectGitType(routeURL)) {
    case GitTypes.invalid:
      // Not a valid url and thus not safe to use
      return null;
    case GitTypes.github:
      return (
        <GithubIcon style={{ fontSize: radius }} title={i18next.t('devconsole~Edit source code')} />
      );
    case GitTypes.bitbucket:
      return (
        <BitbucketIcon
          style={{ fontSize: radius }}
          title={i18next.t('devconsole~Edit source code')}
        />
      );
    case GitTypes.gitlab:
      return (
        <GitlabIcon style={{ fontSize: radius }} title={i18next.t('devconsole~Edit source code')} />
      );
    default:
      return (
        <GitAltIcon style={{ fontSize: radius }} title={i18next.t('devconsole~Edit source code')} />
      );
  }
};
