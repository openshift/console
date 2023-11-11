import * as React from 'react';
import { ClipboardCopy, ClipboardCopyVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { ResourceLink, DetailsItem, ExternalLink } from '@console/internal/components/utils';
import { SecretModel } from '@console/internal/models';
import {
  ClusterBuildStrategyModel,
  BuildStrategyModel,
  ClusterBuildStrategyModelV1Alpha1,
  BuildStrategyModelV1Alpha1,
} from '../../models';
import { Build, BuildRun, BuildSpec } from '../../types';
import { isV1Alpha1Resource } from '../../utils';
import BuildOutput from '../build-list/BuildOutput';

type BuildSpecSectionProps = {
  obj: Build | BuildRun;
  buildSpec: BuildSpec;
  path: string;
};

const BuildSpecSection: React.FC<BuildSpecSectionProps> = ({ obj, buildSpec, path }) => {
  const { t } = useTranslation();

  if (!buildSpec) {
    return null;
  }

  const namespace = obj?.metadata?.namespace;

  const url = isV1Alpha1Resource(obj) ? buildSpec.source?.url : buildSpec.source?.git?.url;
  const contextDir = buildSpec.source?.contextDir;
  const credentials = isV1Alpha1Resource(obj)
    ? buildSpec.source?.credentials?.name
    : buildSpec.source?.git?.cloneSecret;
  const outputCredentials = isV1Alpha1Resource(obj)
    ? buildSpec.output?.credentials?.name
    : buildSpec.output?.pushSecret;
  const dockerFile = isV1Alpha1Resource(obj)
    ? buildSpec?.dockerfile
    : buildSpec?.paramValues?.find((param) => param?.name === 'dockerfile')?.value;
  const builderImage = isV1Alpha1Resource(obj)
    ? buildSpec?.builder?.image
    : buildSpec?.paramValues?.find((param) => param?.name === 'builder-image')?.value;

  return (
    <dl>
      {buildSpec.strategy ? (
        <DetailsItem label={t('shipwright-plugin~Strategy')} obj={obj} path={`${path}.strategy`}>
          {buildSpec.strategy.kind === 'ClusterBuildStrategy' ? (
            <ResourceLink
              groupVersionKind={getGroupVersionKindForModel(
                isV1Alpha1Resource(obj)
                  ? ClusterBuildStrategyModelV1Alpha1
                  : ClusterBuildStrategyModel,
              )}
              name={buildSpec.strategy.name}
            />
          ) : (
            <ResourceLink
              groupVersionKind={getGroupVersionKindForModel(
                isV1Alpha1Resource(obj) ? BuildStrategyModelV1Alpha1 : BuildStrategyModel,
              )}
              namespace={namespace}
              name={buildSpec.strategy.name}
            />
          )}
        </DetailsItem>
      ) : null}

      {url ? (
        <DetailsItem
          label={t('shipwright-plugin~Source URL')}
          obj={obj}
          path={isV1Alpha1Resource(obj) ? `${path}.source.url` : `${path}.source.git.url`}
        >
          <ClipboardCopy variant={ClipboardCopyVariant.inlineCompact}>
            <ExternalLink href={url} text={url} />
          </ClipboardCopy>
        </DetailsItem>
      ) : null}

      {contextDir ? (
        <DetailsItem
          label={t('shipwright-plugin~Context dir')}
          obj={obj}
          path={`${path}.source.contextDir`}
        >
          <ClipboardCopy variant={ClipboardCopyVariant.inlineCompact}>{contextDir}</ClipboardCopy>
        </DetailsItem>
      ) : null}

      {credentials ? (
        <DetailsItem
          label={t('shipwright-plugin~Source credentials')}
          obj={obj}
          path={
            isV1Alpha1Resource(obj)
              ? `${path}.source.credentials.name`
              : `${path}.source.git.cloneSecret`
          }
        >
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(SecretModel)}
            namespace={obj.metadata.namespace}
            name={credentials}
          />
        </DetailsItem>
      ) : null}

      {isV1Alpha1Resource(obj) && buildSpec?.sources?.length ? (
        <DetailsItem label={t('shipwright-plugin~Sources')} obj={obj} path={`${path}.sources`}>
          {buildSpec.sources?.map((source) => (
            <React.Fragment key={source.name}>
              {source.name}:<br />
              <ClipboardCopy variant={ClipboardCopyVariant.inlineCompact}>
                <ExternalLink href={source.url} text={source.url} />
              </ClipboardCopy>
              <br />
            </React.Fragment>
          ))}
        </DetailsItem>
      ) : null}

      {dockerFile ? (
        <DetailsItem
          label={t('shipwright-plugin~Dockerfile')}
          obj={obj}
          path={
            isV1Alpha1Resource(obj)
              ? `${path}.dockerfile`
              : `${path}.paramValues['dockerfile'].value`
          }
        >
          <ClipboardCopy variant={ClipboardCopyVariant.inlineCompact}>{dockerFile}</ClipboardCopy>
        </DetailsItem>
      ) : null}

      {builderImage ? (
        <DetailsItem
          label={t('shipwright-plugin~Builder image')}
          obj={obj}
          path={
            isV1Alpha1Resource(obj)
              ? `${path}.builder.image`
              : `${path}.paramValues['builder-image'].value`
          }
        >
          <ClipboardCopy variant={ClipboardCopyVariant.inlineCompact}>{builderImage}</ClipboardCopy>
        </DetailsItem>
      ) : null}

      {buildSpec.output?.image ? (
        <DetailsItem
          label={t('shipwright-plugin~Output image')}
          obj={obj}
          path={`${path}.output.image`}
        >
          <BuildOutput buildSpec={buildSpec} />
        </DetailsItem>
      ) : null}

      {outputCredentials ? (
        <DetailsItem
          label={t('shipwright-plugin~Output credentials')}
          obj={obj}
          path={
            isV1Alpha1Resource(obj)
              ? `${path}.output.credentials.name`
              : `${path}.output.pushSecret`
          }
        >
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(SecretModel)}
            namespace={obj.metadata.namespace}
            name={outputCredentials}
          />
        </DetailsItem>
      ) : null}
    </dl>
  );
};

export default BuildSpecSection;
