import * as React from 'react';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { DetailsItem, ResourceLink } from '@console/internal/components/utils';
import { YellowExclamationTriangleIcon } from '@console/shared';
import { REGEXP_K8S_RESOURCE_SUFFIX } from './const';
import { CapabilityProps, SpecCapability, StatusCapability } from './types';

export const Invalid: React.FC<{ path: string }> = ({ path }) => {
  return (
    <span className="text-muted olm-descriptors__invalid-pod-descriptor">
      <YellowExclamationTriangleIcon />
      &nbsp;&nbsp;
      <Trans ns="olm">
        The field <code>{{ path }}</code> is invalid.
      </Trans>
    </span>
  );
};

export const DefaultCapability: React.FC<CommonCapabilityProps> = ({
  description,
  label,
  obj,
  fullPath,
  value,
}) => {
  const { t } = useTranslation();
  const detail = React.useMemo(() => {
    if (_.isEmpty(value) && !_.isFinite(value) && !_.isBoolean(value)) {
      return <span className="text-muted">{t('public~None')}</span>;
    }
    if (_.isObject(value) || _.isArray(value)) {
      return <span className="text-muted">{t('public~Unsupported')}</span>;
    }
    return _.toString(value);
  }, [t, value]);

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
  const { t } = useTranslation();
  const detail = React.useMemo(() => {
    if (!value) {
      return <span className="text-muted">{t('public~None')}</span>;
    }

    const [, suffix] = capability.match(REGEXP_K8S_RESOURCE_SUFFIX) ?? [];
    const gvk = suffix?.replace(/:/g, '~');
    if (!_.isString(value)) {
      return <Invalid path={descriptor.path} />;
    }

    return <ResourceLink kind={gvk} name={value} namespace={obj.metadata.namespace} />;
  }, [value, capability, obj.metadata.namespace, t, descriptor.path]);
  return (
    <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
      {detail}
    </DetailsItem>
  );
};

type CommonCapabilityProps = CapabilityProps<SpecCapability | StatusCapability>;
