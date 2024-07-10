import * as React from 'react';
import { Alert, Flex, FlexItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import {
  ResourceLink,
  resourcePath,
  SidebarSectionHeading,
} from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s/k8s';
import { OverviewItem, useFlag } from '@console/shared';
import { BUILDRUN_TO_RESOURCE_MAP_LABEL } from '../../const';
import { BuildModel, BuildModelV1Alpha1, BuildRunModel, BuildRunModelV1Alpha1 } from '../../models';
import { Build, BuildRun, ComputedBuildRunStatus } from '../../types';
import { byCreationTime, isV1Alpha1Resource } from '../../utils';
import { getBuildRunStatus } from '../buildrun-status/BuildRunStatus';
import BuildRunItem from './BuildRunItem';
import StartBuildButton from './StartBuildButton';
import TriggerLastBuildButton from './TriggerLastBuildButton';

const MAX_VISIBLE = 3;

type BuildsOverviewProps = {
  item: OverviewItem & {
    builds?: Build[];
    buildRuns?: BuildRun[];
  };
};

const BuildsOverview: React.FC<BuildsOverviewProps> = ({ item: { builds, buildRuns, obj } }) => {
  const { t } = useTranslation();
  const resourceLabel = obj.metadata?.labels?.[BUILDRUN_TO_RESOURCE_MAP_LABEL];
  const buildRunModel = useFlag('SHIPWRIGHT_BUILDRUN')
    ? referenceForModel(BuildRunModel)
    : referenceForModel(BuildRunModelV1Alpha1);
  const buildRunsforResource = resourceLabel
    ? buildRuns.filter((buildRun) => {
        return resourceLabel === buildRun.metadata?.labels?.[BUILDRUN_TO_RESOURCE_MAP_LABEL];
      })
    : [];

  const buildsForResource = builds.filter((build) => {
    return (
      build.metadata?.labels?.[BUILDRUN_TO_RESOURCE_MAP_LABEL] ===
      obj.metadata?.labels?.[BUILDRUN_TO_RESOURCE_MAP_LABEL]
    );
  });

  const waitingForFirstBuild: boolean = buildRunsforResource?.every((buildRun: BuildRun) => {
    const buildRunStatus = getBuildRunStatus(buildRun);
    return (
      buildRunStatus !== ComputedBuildRunStatus.SUCCEEDED &&
      buildRunStatus !== ComputedBuildRunStatus.FAILED
    );
  });

  const podAlert = (
    <Alert isInline variant="info" title={t('public~Waiting for the build')}>
      {t(
        'shipwright-plugin~Waiting for the first Shipwright build to run successfully. You may temporarily see "ImagePullBackOff" and "ErrImagePull" errors in the Pods Section while waiting.',
      )}
    </Alert>
  );

  if (!buildsForResource || !buildsForResource.length) {
    return null;
  }

  return (
    <>
      <SidebarSectionHeading text={t('shipwright-plugin~BuildRuns')}>
        {buildRunsforResource.length > MAX_VISIBLE && (
          <Link
            className="sidebar__section-view-all"
            to={`${resourcePath(
              buildRunModel,
              undefined,
              obj.metadata?.namespace,
            )}?labels=${BUILDRUN_TO_RESOURCE_MAP_LABEL}=${encodeURIComponent(resourceLabel)}`}
          >
            {t('shipwright-plugin~View all {{buildLength}}', {
              buildLength: buildRunsforResource.length,
            })}
          </Link>
        )}
      </SidebarSectionHeading>

      {waitingForFirstBuild && podAlert}

      {buildsForResource.map((build) => {
        const buildRunsforBuild = buildRuns
          .filter((buildRun) =>
            isV1Alpha1Resource(buildRun)
              ? buildRun.spec.buildRef?.name === build.metadata.name
              : buildRun.spec.build?.name === build.metadata.name &&
                buildRun.metadata?.labels?.[BUILDRUN_TO_RESOURCE_MAP_LABEL] ===
                  obj.metadata?.labels?.[BUILDRUN_TO_RESOURCE_MAP_LABEL],
          )
          .sort(byCreationTime);
        return (
          <ul className="list-group pf-v5-u-mb-xl">
            <li className="list-group-item">
              <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                <FlexItem>
                  <ResourceLink
                    inline
                    kind={
                      isV1Alpha1Resource(build)
                        ? referenceForModel(BuildModelV1Alpha1)
                        : referenceForModel(BuildModel)
                    }
                    name={build.metadata.name}
                    namespace={build.metadata.namespace}
                  />
                </FlexItem>
                <FlexItem>
                  {buildRunsforBuild.length === 0 ? (
                    <StartBuildButton build={build} namespace={build.metadata.namespace} />
                  ) : (
                    <TriggerLastBuildButton
                      buildRuns={buildRunsforBuild}
                      resource={obj}
                      namespace={build.metadata.namespace}
                    />
                  )}
                </FlexItem>
              </Flex>
            </li>

            {buildRunsforBuild.length > 0 &&
              buildRunsforBuild
                .slice(0, MAX_VISIBLE)
                .map((br) => <BuildRunItem key={br.metadata.uid} buildRun={br} />)}
          </ul>
        );
      })}
    </>
  );
};

export default BuildsOverview;
