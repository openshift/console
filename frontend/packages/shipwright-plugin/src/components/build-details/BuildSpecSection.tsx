import * as React from 'react';
import { ClipboardCopy, ClipboardCopyVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { ResourceLink, DetailsItem, ExternalLink } from '@console/internal/components/utils';
import { SecretModel } from '@console/internal/models';
import { ClusterBuildStrategyModel, BuildStrategyModel } from '../../models';
import { Build, BuildRun, BuildSpec } from '../../types';

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

  return (
    <dl>
      {buildSpec.strategy ? (
        <DetailsItem label={t('shipwright-plugin~Strategy')} obj={obj} path={`${path}.strategy`}>
          {buildSpec.strategy.kind === 'ClusterBuildStrategy' ? (
            <ResourceLink
              groupVersionKind={getGroupVersionKindForModel(ClusterBuildStrategyModel)}
              name={buildSpec.strategy.name}
            />
          ) : (
            <ResourceLink
              groupVersionKind={getGroupVersionKindForModel(BuildStrategyModel)}
              namespace={namespace}
              name={buildSpec.strategy.name}
            />
          )}
        </DetailsItem>
      ) : null}

      {buildSpec.source?.url ? (
        <DetailsItem
          label={t('shipwright-plugin~Source URL')}
          obj={obj}
          path={`${path}.source.url`}
        >
          <ClipboardCopy variant={ClipboardCopyVariant.inlineCompact}>
            <ExternalLink href={buildSpec.source.url} text={buildSpec.source.url} />
          </ClipboardCopy>
        </DetailsItem>
      ) : null}

      {buildSpec.source?.contextDir ? (
        <DetailsItem
          label={t('shipwright-plugin~Context dir')}
          obj={obj}
          path={`${path}.source.contextDir`}
        >
          <ClipboardCopy variant={ClipboardCopyVariant.inlineCompact}>
            {buildSpec.source.contextDir}
          </ClipboardCopy>
        </DetailsItem>
      ) : null}

      {buildSpec.source?.credentials ? (
        <DetailsItem
          label={t('shipwright-plugin~Source credentials')}
          obj={obj}
          path={`${path}.source.credentials`}
        >
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(SecretModel)}
            namespace={obj.metadata.namespace}
            {...buildSpec.source.credentials}
          />
        </DetailsItem>
      ) : null}

      {buildSpec.sources?.length ? (
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

      {buildSpec.dockerfile ? (
        <DetailsItem
          label={t('shipwright-plugin~Dockerfile')}
          obj={obj}
          path={`${path}.dockerfile`}
        >
          <ClipboardCopy variant={ClipboardCopyVariant.inlineCompact}>
            {buildSpec.dockerfile}
          </ClipboardCopy>
        </DetailsItem>
      ) : null}

      {buildSpec.builder?.image ? (
        <DetailsItem
          label={t('shipwright-plugin~Builder image')}
          obj={obj}
          path={`${path}.builder.image`}
        >
          <ClipboardCopy variant={ClipboardCopyVariant.inlineCompact}>
            {buildSpec.builder.image}
          </ClipboardCopy>
        </DetailsItem>
      ) : null}

      {buildSpec.output?.image ? (
        <DetailsItem
          label={t('shipwright-plugin~Output image')}
          obj={obj}
          path={`${path}.output.image`}
        >
          <ClipboardCopy variant={ClipboardCopyVariant.inlineCompact}>
            {buildSpec.output.image}
          </ClipboardCopy>
        </DetailsItem>
      ) : null}

      {buildSpec.output?.credentials ? (
        <DetailsItem
          label={t('shipwright-plugin~Output credentials')}
          obj={obj}
          path={`${path}.output.credentials`}
        >
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(SecretModel)}
            namespace={obj.metadata.namespace}
            {...buildSpec.output.credentials}
          />
        </DetailsItem>
      ) : null}
    </dl>
  );
};

export default BuildSpecSection;
