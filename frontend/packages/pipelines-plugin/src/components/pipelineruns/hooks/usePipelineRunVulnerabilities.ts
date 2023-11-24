import * as React from 'react';
import { PipelineRunKind } from '../../../types';

const SCAN_OUTPUT_SUFFIX = 'SCAN_OUTPUT';

export type ScanResults = {
  vulnerabilities?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
};

export const getPipelineRunVulnerabilities = (pipelineRun: PipelineRunKind): ScanResults => {
  const results = pipelineRun.status?.results || pipelineRun.status?.pipelineResults;
  return results?.reduce((acc, result) => {
    if (result.name?.endsWith(SCAN_OUTPUT_SUFFIX)) {
      if (!acc.vulnerabilities) {
        acc.vulnerabilities = { critical: 0, high: 0, medium: 0, low: 0 };
      }
      try {
        const taskVulnerabilities = JSON.parse(result.value);
        if (taskVulnerabilities.vulnerabilities) {
          acc.vulnerabilities.critical += taskVulnerabilities.vulnerabilities.critical || 0;
          acc.vulnerabilities.high += taskVulnerabilities.vulnerabilities.high || 0;
          acc.vulnerabilities.medium += taskVulnerabilities.vulnerabilities.medium || 0;
          acc.vulnerabilities.low += taskVulnerabilities.vulnerabilities.low || 0;
        }
      } catch (e) {
        // ignore
      }
    }
    return acc;
  }, {} as ScanResults);
};

export const usePipelineRunVulnerabilities = (pipelineRun: PipelineRunKind): ScanResults =>
  React.useMemo(() => {
    if (!pipelineRun) {
      return null;
    }

    return getPipelineRunVulnerabilities(pipelineRun);
  }, [pipelineRun]);
