import * as React from 'react';
import * as classNames from 'classnames';
import Linkify from 'react-linkify';
import { useTranslation } from 'react-i18next';
import { CopyToClipboard as CTC } from 'react-copy-to-clipboard';
import { Tooltip } from '@patternfly/react-core';
import { CopyIcon, ExternalLinkAltIcon } from '@patternfly/react-icons';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants';

// Kubernetes "dns-friendly" names match
// [a-z0-9]([-a-z0-9]*[a-z0-9])?  and are 63 or fewer characters
// long. This pattern checks the pattern but not the length.
//
// Don't capture anything in legalNamePattern, since it's used
// in expressions like
//
//    new RegExp("PREFIX" + legalNamePattern.source + "(SUFFIX)")
//
// And it's ok for users to make assumptions about capturing groups.

export const legalNamePattern = /[a-z0-9](?:[-a-z0-9]*[a-z0-9])?/;

const basePathPattern = new RegExp(`^/?${window.SERVER_FLAGS.basePath}`);

export const namespacedPrefixes = [
  '/api-resource',
  '/k8s',
  '/operatorhub',
  '/operatormanagement',
  '/operators',
  '/details',
  '/provisionedservices',
  '/search',
  '/status',
];

export const stripBasePath = (path: string): string => path.replace(basePathPattern, '/');

export const getNamespace = (path: string): string => {
  path = stripBasePath(path);
  const split = path.split('/').filter((x) => x);

  if (split[1] === 'all-namespaces') {
    return ALL_NAMESPACES_KEY;
  }

  let ns: string;
  if (split[1] === 'cluster' && ['namespaces', 'projects'].includes(split[2]) && split[3]) {
    ns = split[3];
  } else if (split[1] === 'ns' && split[2]) {
    ns = split[2];
  } else {
    return;
  }

  const match = ns.match(legalNamePattern);
  return match && match.length > 0 && match[0];
};

export const getURLSearchParams = () => {
  const all: any = {};
  const params = new URLSearchParams(window.location.search);

  for (const [k, v] of params.entries()) {
    all[k] = v;
  }

  return all;
};

export const ExternalLink: React.FC<ExternalLinkProps> = ({
  children,
  href,
  text,
  additionalClassName = '',
  dataTestID,
  stopPropagation,
}) => (
  <a
    className={classNames('co-external-link', additionalClassName)}
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    data-test-id={dataTestID}
    {...(stopPropagation ? { onClick: (e) => e.stopPropagation() } : {})}
  >
    {children || text}
  </a>
);

// Opens link with copy-to-clipboard

export const ExternalLinkWithCopy: React.FC<ExternalLinkWithCopyProps> = ({
  link,
  text,
  additionalClassName,
  dataTestID,
}) => {
  const [copied, setCopied] = React.useState(false);

  const { t } = useTranslation();
  const tooltipText = copied ? t('public~Copied to clipboard') : t('public~Copy to clipboard');
  const tooltipContent = [
    <span className="co-nowrap" key="nowrap">
      {tooltipText}
    </span>,
  ];

  return (
    <div className={classNames(additionalClassName)}>
      <a href={link} target="_blank" rel="noopener noreferrer" data-test-id={dataTestID}>
        {text ?? link}
      </a>
      <span className="co-icon-nowrap">
        &nbsp;
        <span className="co-external-link-with-copy__icon co-external-link-with-copy__externallinkicon">
          <ExternalLinkAltIcon />
        </span>
        <Tooltip content={tooltipContent} trigger="click mouseenter focus" exitDelay={1250}>
          <CTC text={link} onCopy={() => setCopied(true)}>
            <span
              onMouseEnter={() => setCopied(false)}
              className="co-external-link-with-copy__icon co-external-link-with-copy__copyicon"
            >
              <CopyIcon />
              <span className="sr-only">{t('public~Copy to clipboard')}</span>
            </span>
          </CTC>
        </Tooltip>
      </span>
    </div>
  );
};

// Open links in a new window and set noopener/noreferrer.
export const LinkifyExternal: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Linkify properties={{ target: '_blank', rel: 'noopener noreferrer' }}>{children}</Linkify>
);
LinkifyExternal.displayName = 'LinkifyExternal';

type ExternalLinkProps = {
  href: string;
  text?: React.ReactNode;
  additionalClassName?: string;
  dataTestID?: string;
  stopPropagation?: boolean;
};

type ExternalLinkWithCopyProps = {
  link: string;
  text?: string;
  dataTestID?: string;
  additionalClassName?: string;
};
