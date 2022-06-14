import * as React from 'react';
import i18next from 'i18next';
import Status, { StatusProps } from '@console/dynamic-plugin-sdk/src/app/components/status/Status';
import { BuildRun, ComputedBuildRunStatus } from '../../types';

const getSucceededCondition = (buildRun: BuildRun) =>
  buildRun.status?.conditions?.find((condition) => condition.type === 'Succeeded');

export const getBuildRunStatus = (buildRun: BuildRun): ComputedBuildRunStatus => {
  const succeededCondition = getSucceededCondition(buildRun);
  if (succeededCondition) {
    if (succeededCondition.status === 'Unknown' && succeededCondition.reason === 'Pending') {
      return ComputedBuildRunStatus.PENDING;
    }
    if (succeededCondition.status === 'Unknown' && succeededCondition.reason === 'Running') {
      return ComputedBuildRunStatus.RUNNING;
    }
    if (succeededCondition.status === 'True') {
      return ComputedBuildRunStatus.SUCCEEDED;
    }
    if (succeededCondition.status === 'False') {
      return ComputedBuildRunStatus.FAILED;
    }
  }
  return ComputedBuildRunStatus.UNKNOWN;
};

export const getBuildRunStatusProps = (buildRun: BuildRun): StatusProps => {
  const succeededCondition = getSucceededCondition(buildRun);
  if (succeededCondition) {
    if (succeededCondition.status === 'Unknown' && succeededCondition.reason === 'Pending') {
      return {
        status: ComputedBuildRunStatus.PENDING,
        title: i18next.t('shipwright-plugin~Pending'),
      };
    }
    if (succeededCondition.status === 'Unknown' && succeededCondition.reason === 'Running') {
      return {
        status: ComputedBuildRunStatus.RUNNING,
        title: i18next.t('shipwright-plugin~Running'),
      };
    }
    if (succeededCondition.status === 'True') {
      return {
        status: ComputedBuildRunStatus.SUCCEEDED,
        title: i18next.t('shipwright-plugin~Succeeded'),
      };
    }
    if (succeededCondition.status === 'False') {
      return {
        status: ComputedBuildRunStatus.FAILED,
        title: i18next.t('shipwright-plugin~Failed'),
      };
    }
  }
  return {
    status: ComputedBuildRunStatus.UNKNOWN,
    title: i18next.t('shipwright-plugin~Unknown'),
  };
};

const BuildRunStatus: React.FC<{ buildRun: BuildRun }> = ({ buildRun }) => {
  const status = getBuildRunStatus(buildRun);
  const failedCondition = getSucceededCondition(buildRun);
  return (
    <Status {...getBuildRunStatusProps(buildRun)}>
      {status === ComputedBuildRunStatus.FAILED ? (
        <>
          <pre data-test="failure-popup">{failedCondition.reason}</pre>
          {failedCondition.message}
        </>
      ) : null}
    </Status>
  );
};

export default BuildRunStatus;
