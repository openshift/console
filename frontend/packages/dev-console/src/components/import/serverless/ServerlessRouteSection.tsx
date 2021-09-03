import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { WatchK8sResource } from '@console/dynamic-plugin-sdk';
import { LoadingInline } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { DomainMappingModel } from '@console/knative-plugin/src';
import { SelectInputField } from '@console/shared';
import { GitImportFormData, DeployImageFormData, UploadJarFormData } from '../import-types';
import PortInputField from '../route/PortInputField';
import {
  getAllOtherDomainMappingInUse,
  getOtherKsvcFromDomainMapping,
  hasOtherKsvcDomainMappings,
  removeDuplicateDomainMappings,
} from './serverless-utils';

const ServerlessRouteSection: React.FC = () => {
  const { t } = useTranslation();
  const {
    setFieldValue,
    values: {
      name,
      project: { name: namespace },
      image: { ports },
      route: { defaultUnknownPort },
      serverless,
    },
  } = useFormikContext<DeployImageFormData | GitImportFormData | UploadJarFormData>();
  const resource: WatchK8sResource = React.useMemo(
    () => ({
      kind: referenceForModel(DomainMappingModel),
      isList: true,
      namespace,
      optional: true,
    }),
    [namespace],
  );
  const [data, domainMappingLoaded, domainMappingLoadErr] = useK8sWatchResource<K8sResourceKind[]>(
    resource,
  );
  const domainMappingResources = React.useMemo(() => {
    return domainMappingLoaded && !domainMappingLoadErr
      ? data.map((dm) => {
          const ksvc = getOtherKsvcFromDomainMapping(dm, name);
          return {
            value: ksvc ? `${dm.metadata.name} (${ksvc})` : dm.metadata.name,
            disabled: false,
          };
        })
      : [];
  }, [domainMappingLoaded, domainMappingLoadErr, data, name]);

  React.useEffect(() => {
    if (domainMappingLoaded && !domainMappingLoadErr && data?.length) {
      const mappedDomain = data
        .filter((domainRes) => domainRes.spec?.ref?.name === name)
        .map((filterDm) => filterDm.metadata.name);
      const newDomainMap = [
        ...(serverless.domainMapping ? serverless.domainMapping : []),
        ...mappedDomain,
      ];
      setFieldValue('serverless', {
        ...serverless,
        domainMapping: removeDuplicateDomainMappings(newDomainMap, mappedDomain),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, domainMappingLoaded, domainMappingLoadErr, name, setFieldValue]);

  const placeholderPort = defaultUnknownPort;
  const portOptions = ports.map((port) => port?.containerPort.toString());
  const domainsInUse = getAllOtherDomainMappingInUse(serverless.domainMapping, data, name) ?? [];
  return (
    <>
      <PortInputField
        data-test-id="serverless-route-section-port"
        name="route.unknownTargetPort"
        label={t('devconsole~Target port')}
        placeholderText={placeholderPort.toString()}
        helpText={t('devconsole~Target port for traffic.')}
        options={portOptions}
      />
      {domainMappingLoaded || domainMappingLoadErr ? (
        <>
          <SelectInputField
            data-test-id="domain-mapping-field"
            name="serverless.domainMapping"
            label={t('devconsole~Domain mapping')}
            options={domainMappingResources}
            placeholderText={t('devconsole~Add domain')}
            helpText={t('devconsole~Enter custom domain to map to the Knative service')}
            isCreatable
            hasOnCreateOption
          />
          {hasOtherKsvcDomainMappings(serverless.domainMapping) && (
            <Alert
              data-test="domain-mapping-warning"
              variant="warning"
              isInline
              title={t('devconsole~Domain mapping(s) will be updated')}
            >
              <div style={{ marginBottom: 'var(--pf-global--spacer--sm)' }}>
                {t(
                  'devconsole~Warning: The following domain(s) will be removed from the associated service',
                )}
              </div>
              {domainsInUse.length > 0 && (
                <ul>
                  {domainsInUse.map((dm) => {
                    return (
                      <li key={dm.metadata.uid}>
                        {t(`devconsole~{{domainMapping}} from {{knativeService}}`, {
                          domainMapping: dm.metadata.name,
                          knativeService: dm.spec.ref.name,
                        })}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Alert>
          )}
        </>
      ) : (
        <LoadingInline />
      )}
    </>
  );
};

export default ServerlessRouteSection;
