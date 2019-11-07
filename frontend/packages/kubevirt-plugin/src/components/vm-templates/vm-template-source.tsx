import * as React from 'react';
import { TemplateKind } from '@console/internal/module/k8s';
import { Tooltip } from '@patternfly/react-core';
import { parseURL, resolveURL } from '../../utils/url';
import { ProvisionSource } from '../../constants/vm/provision-source';

export const URLObj: React.FC<URLObjProps> = ({
  urlPath,
  short = false,
  maxHostnameParts = 3,
  maxPathnameParts = 1,
}) => {
  const urlObj = short ? parseURL(urlPath) : undefined;

  const resolvedURL = urlObj ? resolveURL({ urlObj, maxHostnameParts, maxPathnameParts }) : urlPath;
  const resolvedTitle = resolvedURL === urlPath ? undefined : urlPath;

  return (
    <a href={urlPath} title={resolvedTitle}>
      {resolvedURL}
    </a>
  );
};

type URLObjProps = {
  urlPath: string;
  short?: boolean;
  maxHostnameParts?: number;
  maxPathnameParts?: number;
};

const Type: React.FC<TypeProps> = ({ type, source, error, detailed = false }) => {
  if (!source && !error && type) {
    // for PXE - a valid PXE configuration has no source nor error
    return <>{type.getValue()}</>;
  }
  if (!detailed) {
    return (
      <Tooltip position="bottom" enableFlip={false} content={<>{error || source}</>} exitDelay={0}>
        <div>{error ? 'Invalid source' : type.getValue()}</div>
      </Tooltip>
    );
  }

  return error || type ? <>{error || type.getValue()}</> : null;
};

type TypeProps = {
  type: ProvisionSource;
  source?: string;
  error?: string;
  detailed?: boolean;
};

const Source: React.FC<SourceProps> = ({ type, source, error }) => {
  if (!source && !error) {
    // for PXE - a valid PXE configuration has no source nor error
    return null;
  }

  const sourceElem =
    type && type.getValue() === ProvisionSource.URL.getValue() ? (
      <URLObj urlPath={source} short />
    ) : (
      source || error
    );

  return <div>{sourceElem}</div>;
};

type SourceProps = {
  type: ProvisionSource;
  source?: string;
  error?: string;
};

export const TemplateSource: React.FC<TemplateSourceProps> = ({ template, detailed = false }) => {
  const provisionSource = ProvisionSource.getProvisionSourceDetails(template);
  const { type, source, error } = provisionSource;

  if (!detailed) {
    return <Type type={type} source={source} error={error} />;
  }

  return (
    <>
      <Type type={type} source={source} detailed />
      <Source type={type} source={source} error={error} />
    </>
  );
};

type TemplateSourceProps = {
  template: TemplateKind;
  detailed?: boolean;
};
