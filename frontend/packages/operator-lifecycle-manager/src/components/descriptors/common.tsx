import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { EyeIcon, EyeSlashIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { SecretValue } from '@console/internal/components/configmap-and-secret-data';
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
        The field <code className="co-code">{{ path }}</code> is invalid.
      </Trans>
    </span>
  );
};

export const DefaultCapability: React.FC<CommonCapabilityProps<string | number | boolean>> = ({
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
    return _.toString(value);
  }, [t, value]);

  return (
    <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
      {detail}
    </DetailsItem>
  );
};

export const K8sResourceLinkCapability: React.FC<CommonCapabilityProps<string>> = ({
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
      // eslint-disable-next-line no-console
      console.warn(
        `[Invalid descriptor] descriptor is incompatible with property ${descriptor.path} and will have no effect`,
        descriptor,
      );

      return null;
    }
    return <ResourceLink kind={gvk} name={value} namespace={obj.metadata.namespace} />;
  }, [value, capability, obj.metadata.namespace, t, descriptor]);
  return (
    <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
      {detail}
    </DetailsItem>
  );
};

export const SecretCapability: React.FC<CommonCapabilityProps<string>> = ({
  description,
  label,
  obj,
  fullPath,
  value,
}) => {
  const { t } = useTranslation();
  const [reveal, setReveal] = React.useState(false);

  return (
    <DetailsItem description={description} label={label} obj={obj} path={fullPath}>
      <div className="co-toggle-reveal-value">
        <Button
          type="button"
          variant="link"
          isInline
          className="pf-m-link--align-right co-toggle-reveal-value__btn"
          onClick={() => setReveal(!reveal)}
        >
          {reveal ? (
            <>
              <EyeSlashIcon className="co-icon-space-r" />
              {t('olm~Hide values')}
            </>
          ) : (
            <>
              <EyeIcon className="co-icon-space-r" />
              {t('olm~Reveal values')}
            </>
          )}
        </Button>
        <SecretValue value={value} encoded={false} reveal={reveal} />
      </div>
    </DetailsItem>
  );
};

type CommonCapabilityProps<V = any> = CapabilityProps<SpecCapability | StatusCapability, V>;

Invalid.displayName = 'Invalid';
DefaultCapability.displayName = 'DefaultCapability';
K8sResourceLinkCapability.displayName = 'K8sResourceLinkCapability';
SecretCapability.displayName = 'SecretCapability';
