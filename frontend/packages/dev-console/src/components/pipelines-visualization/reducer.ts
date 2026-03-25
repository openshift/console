import { t_global_text_color_status_danger_default as failureColor } from '@patternfly/react-tokens';
import { chart_color_black_400 as skippedColor } from '@patternfly/react-tokens/dist/js/chart_color_black_400';
import { chart_color_black_500 as cancelledColor } from '@patternfly/react-tokens/dist/js/chart_color_black_500';
import { chart_color_blue_100 as pendingColor } from '@patternfly/react-tokens/dist/js/chart_color_blue_100';
import { chart_color_blue_300 as runningColor } from '@patternfly/react-tokens/dist/js/chart_color_blue_300';
import { chart_color_green_400 as successColor } from '@patternfly/react-tokens/dist/js/chart_color_green_400';
import type { Graph, LayoutFactory } from '@patternfly/react-topology';
import { DagreLayout, PipelineDagreLayout } from '@patternfly/react-topology';
import type { GraphLabel } from 'dagre';
import i18next from 'i18next';
import { ComputedStatus } from '@console/shipwright-plugin/src/components/logs/log-snippet-types';
import { pipelineRunStatus } from '@console/shipwright-plugin/src/components/logs/logs-utils';
import type { StatusMessage, StepStatus } from './types';
import {
  DAGRE_BUILDER_PROPS,
  DAGRE_BUILDER_SPACED_PROPS,
  DAGRE_VIEWER_PROPS,
  DAGRE_VIEWER_SPACED_PROPS,
  PipelineLayout,
} from './types';

export const getDuration = (seconds: number, long?: boolean): string => {
  if (seconds === 0) {
    return i18next.t('devconsole~less than a sec');
  }
  let sec = Math.round(seconds);
  let min = 0;
  let hr = 0;
  let duration = '';
  if (sec >= 60) {
    min = Math.floor(sec / 60);
    sec %= 60;
  }
  if (min >= 60) {
    hr = Math.floor(min / 60);
    min %= 60;
  }
  if (hr > 0) {
    duration += long
      ? i18next.t('devconsole~{{count}} hour', { count: hr })
      : i18next.t('devconsole~{{hr}}h', { hr });
    duration += ' ';
  }
  if (min > 0) {
    duration += long
      ? i18next.t('devconsole~{{count}} minute', { count: min })
      : i18next.t('devconsole~{{min}}m', { min });
    duration += ' ';
  }
  if (sec > 0) {
    duration += long
      ? i18next.t('devconsole~{{count}} second', { count: sec })
      : i18next.t('devconsole~{{sec}}s', { sec });
  }

  return duration.trim();
};

export const calculateDuration = (startTime: string, endTime?: string, long?: boolean) => {
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : new Date().getTime();
  const durationInSeconds = (end - start) / 1000;
  return getDuration(durationInSeconds, long);
};

export const pipelineRunFilterReducer = (pipelineRun): ComputedStatus => {
  const status = pipelineRunStatus(pipelineRun);
  return status || ComputedStatus.Other;
};

enum TerminatedReasons {
  Completed = 'Completed',
}

export type TaskStatusStep = {
  name: string;
  running?: { startedAt: string };
  terminated?: {
    finishedAt: string;
    reason: TerminatedReasons;
    startedAt: string;
  };
  waiting?: {};
};

export type TaskStatus = {
  reason: ComputedStatus;
  duration?: string;
  steps?: TaskStatusStep[];
};

const getMatchingStep = (step, status: TaskStatus): TaskStatusStep => {
  const statusSteps: TaskStatusStep[] = status.steps || [];
  return statusSteps.find((statusStep) => {
    // In rare occasions the status step name is prefixed with `step-`
    // This is likely a bug but this workaround will be temporary as it's investigated separately
    return statusStep.name === step.name || statusStep.name === `step-${step.name}`;
  });
};

const getMatchingStepDuration = (matchingStep?: TaskStatusStep) => {
  if (!matchingStep) return '';

  if (matchingStep.terminated) {
    return calculateDuration(matchingStep.terminated.startedAt, matchingStep.terminated.finishedAt);
  }

  if (matchingStep.running) {
    return calculateDuration(matchingStep.running.startedAt);
  }

  return '';
};

export const createStepStatus = (step: { name: string }, status: TaskStatus): StepStatus => {
  let stepRunStatus: ComputedStatus = ComputedStatus.PipelineNotStarted;
  let duration: string = null;

  if (!status || !status.reason) {
    stepRunStatus = ComputedStatus.Cancelled;
  } else if (status.reason === ComputedStatus['In Progress']) {
    // In progress, try to get granular statuses
    const matchingStep: TaskStatusStep = getMatchingStep(step, status);

    if (!matchingStep) {
      stepRunStatus = ComputedStatus.Pending;
    } else if (matchingStep.terminated) {
      stepRunStatus =
        matchingStep.terminated.reason === TerminatedReasons.Completed
          ? ComputedStatus.Succeeded
          : ComputedStatus.Failed;
      duration = getMatchingStepDuration(matchingStep);
    } else if (matchingStep.running) {
      stepRunStatus = ComputedStatus['In Progress'];
      duration = getMatchingStepDuration(matchingStep);
    } else if (matchingStep.waiting) {
      stepRunStatus = ComputedStatus.Pending;
    }
  } else {
    // Not in progress, just use the run status reason
    stepRunStatus = status.reason;

    duration = getMatchingStepDuration(getMatchingStep(step, status)) || status.duration;
  }

  return {
    duration,
    name: step.name,
    status: stepRunStatus,
  };
};

export const getRunStatusColor = (status: string): StatusMessage => {
  switch (status) {
    case ComputedStatus.Succeeded:
      return { message: i18next.t('devconsole~Succeeded'), pftoken: successColor };
    case ComputedStatus.Failed:
      return { message: i18next.t('devconsole~Failed'), pftoken: failureColor };
    case ComputedStatus.FailedToStart:
      return {
        message: i18next.t('devconsole~PipelineRun failed to start'),
        pftoken: failureColor,
      };
    case ComputedStatus.Running:
      return { message: i18next.t('devconsole~Running'), pftoken: runningColor };
    case ComputedStatus['In Progress']:
      return { message: i18next.t('devconsole~Running'), pftoken: runningColor };

    case ComputedStatus.Skipped:
      return { message: i18next.t('devconsole~Skipped'), pftoken: skippedColor };
    case ComputedStatus.Cancelled:
      return { message: i18next.t('devconsole~Cancelled'), pftoken: cancelledColor };
    case ComputedStatus.Cancelling:
      return { message: i18next.t('devconsole~Cancelling'), pftoken: cancelledColor };
    case ComputedStatus.Idle:
    case ComputedStatus.Pending:
      return { message: i18next.t('devconsole~Pending'), pftoken: pendingColor };
    default:
      return {
        message: i18next.t('devconsole~PipelineRun not started yet'),
        pftoken: pendingColor,
      };
  }
};

export const getLayoutData = (layout: PipelineLayout): GraphLabel => {
  switch (layout) {
    case PipelineLayout.DAGRE_BUILDER:
      return DAGRE_BUILDER_PROPS;
    case PipelineLayout.DAGRE_VIEWER:
      return DAGRE_VIEWER_PROPS;
    case PipelineLayout.DAGRE_VIEWER_SPACED:
      return DAGRE_VIEWER_SPACED_PROPS;
    case PipelineLayout.DAGRE_BUILDER_SPACED:
      return DAGRE_BUILDER_SPACED_PROPS;
    default:
      return null;
  }
};

export const layoutFactory: LayoutFactory = (type: string, graph: Graph) => {
  switch (type) {
    case PipelineLayout.DAGRE_BUILDER:
    case PipelineLayout.DAGRE_BUILDER_SPACED:
      return new DagreLayout(graph, {
        // Hack to get around undesirable defaults
        // TODO: fix this, it's not ideal but it works for now
        linkDistance: 0,
        nodeDistance: 0,
        groupDistance: 0,
        collideDistance: 0,
        simulationSpeed: 0,
        chargeStrength: 0,
        allowDrag: false,
        layoutOnDrag: false,
        ...getLayoutData(type),
      });
    case PipelineLayout.DAGRE_VIEWER:
    case PipelineLayout.DAGRE_VIEWER_SPACED:
      return new PipelineDagreLayout(graph, { nodesep: 25, ...getLayoutData(type) });
    default:
      return undefined;
  }
};
