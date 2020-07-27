import * as _ from 'lodash';
import * as React from 'react';
import { DetailsItem, ResourceLink } from '@console/internal/components/utils';
import { CapabilityProps, SpecCapability, StatusCapability } from './types';
import { REGEXP_K8S_RESOURCE_SUFFIX } from './const';
import { YellowExclamationTriangleIcon } from '@console/shared';

export const DefaultCapability: React.FC<CommonCapabilityProps> = ({
  description,
  label,
  obj,
  fullPath,
  value,
}) => {
  const detail = React.useMemo(() => {
    if (_.isEmpty(value) && !_.isFinite(value) && !_.isBoolean(value)) {
      return <span className="text-muted">None</span>;
    }
    if (_.isObject(value) || _.isArray(value)) {
      return <span className="text-muted">Unsupported</span>;
    }
    return _.toString(value);
  }, [value]);

  return (
    <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
      {detail}
    </DetailsItem>
  );
};

export const K8sResourceLinkCapability: React.FC<CommonCapabilityProps> = ({
  capability,
  description,
  descriptor,
  fullPath,
  label,
  obj,
  value,
}) => {
  const detail = React.useMemo(() => {
    if (!value) {
      return <span className="text-muted">None</span>;
    }

    const [, suffix] = capability.match(REGEXP_K8S_RESOURCE_SUFFIX) ?? [];
    const gvk = suffix?.replace(/:/g, '~');
    if (!_.isString(value)) {
      return (
        <>
          <YellowExclamationTriangleIcon /> Invalid descriptor: value at path &apos;
          {descriptor.path}&apos; must be a {gvk} resource name.
        </>
      );
    }

    return <ResourceLink kind={gvk} name={value} namespace={obj.metadata.namespace} />;
  }, [value, capability, obj.metadata.namespace, descriptor.path]);
  return (
    <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
      {detail}
    </DetailsItem>
  );
};

type CommonCapabilityProps = CapabilityProps<SpecCapability | StatusCapability>;
