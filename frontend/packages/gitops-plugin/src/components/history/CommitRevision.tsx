import * as React from 'react';
import * as GitUrlParse from 'git-url-parse';
import { ExternalLink } from '@console/internal/components/utils';

const isSHARevision = (revision: string) => {
  return revision.match(/^[a-f0-9]{5,40}$/) !== null;
};

function getProtocol(proto: string): string {
  return proto === 'ssh' ? 'https' : proto;
}

function isSupportedSource(parsed: GitUrlParse.GitUrl): boolean {
  return (
    parsed.resource.startsWith('github') ||
    ['gitlab.com', 'bitbucket.org'].indexOf(parsed.source) >= 0
  );
}

function getRevisionUrl(url: string, revision: string): string {
  const parsed = GitUrlParse(url);
  let urlSubPath = isSHARevision(revision) ? 'commit' : 'tree';
  if (url.indexOf('bitbucket') >= 0) {
    urlSubPath = isSHARevision(revision) ? 'commits' : 'branch';
  }
  if (!isSupportedSource(parsed)) {
    return null;
  }
  return `${getProtocol(parsed.protocol)}://${parsed.resource}/${parsed.owner}/${
    parsed.name
  }/${urlSubPath}/${revision || 'HEAD'}`;
}

export const CommitRevision = ({
  repoUrl,
  revision,
  children,
}: {
  repoUrl: string;
  revision: string;
  children?: React.ReactNode;
}) => {
  const revisionNumber = revision || '';
  const url = getRevisionUrl(repoUrl, revisionNumber);
  const content =
    children || (isSHARevision(revisionNumber) ? revisionNumber.substring(0, 10) : revisionNumber);
  return url !== null ? (
    <ExternalLink href={url}>
      <span style={{ marginRight: 'var(--pf-global--spacer--xs)' }}>{content}</span>
    </ExternalLink>
  ) : (
    <span>{content}</span>
  );
};
