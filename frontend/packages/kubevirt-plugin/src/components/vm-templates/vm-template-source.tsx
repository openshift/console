import * as React from 'react';
import classNames from 'classnames';
import { TemplateKind, K8sResourceKind } from '@console/internal/module/k8s';
import { DASH, getName, getNamespace } from '@console/shared';
import { prefixedID } from '../../utils';
import { Url } from '../url';
import { ProvisionSource } from '../../constants/vm/provision-source';
import './vm-template-source.scss';

const getId = (value: K8sResourceKind) => `${getNamespace(value)}-${getName(value)}`;

const Type: React.FC<TypeProps> = ({ type, source, error, id, isInline = false }) => (
  <div
    id={id}
    title={source || error}
    className={classNames({ 'kubevirt-template-source__overlay': isInline })}
  >
    {type.getValue()}
  </div>
);

const Source: React.FC<SourceProps> = ({ type, source, id }) => {
  if (!source) {
    return null;
  }

  const sourceElem = type === ProvisionSource.URL ? <Url url={source} isShort /> : source;

  return (
    <div id={id} className="kubevirt-template-source__source">
      {sourceElem}
    </div>
  );
};

export const VMTemplateSource: React.FC<VMTemplateSourceProps> = ({
  template,
  isDetailed = false,
}) => {
  const provisionSource = ProvisionSource.getProvisionSourceDetails(template);

  if (!provisionSource || !provisionSource.type) {
    return <>{DASH}</>;
  }

  const { type, source, error } = provisionSource;
  const id = getId(template);
  const typeId = prefixedID(id, 'type');
  const sourceId = prefixedID(id, 'source');

  if (!isDetailed) {
    return <Type id={typeId} type={type} source={source} error={error} isInline />;
  }

  return (
    <>
      <Type id={typeId} type={type} source={source} error={error} />
      <Source id={sourceId} type={type} source={source} />
    </>
  );
};

type VMTemplateSourceProps = {
  template: TemplateKind;
  dataVolumes?: K8sResourceKind[];
  isDetailed?: boolean;
};

type TypeProps = {
  id: string;
  type: ProvisionSource;
  source?: string;
  error?: string;
  isInline?: boolean;
};

type SourceProps = {
  id: string;
  type: ProvisionSource;
  source?: string;
};
