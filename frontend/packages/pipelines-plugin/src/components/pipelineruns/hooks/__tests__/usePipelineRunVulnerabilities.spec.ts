import { testHook } from '../../../../../../../__tests__/utils/hooks-utils';
import {
  PipeLineRunWithVulnerabilitiesData,
  PipeLineRunWithVulnerabilitiesNames,
} from '../../../../test-data/pipeline-data';
import { usePipelineRunVulnerabilities } from '../usePipelineRunVulnerabilities';

describe('usePLRVulnerabilities', () => {
  it('should return vulnerability scan results', () => {
    const {
      result: { current: scanResults },
    } = testHook(() =>
      usePipelineRunVulnerabilities(
        PipeLineRunWithVulnerabilitiesData[PipeLineRunWithVulnerabilitiesNames.ScanOutput],
      ),
    );
    expect(scanResults.vulnerabilities.critical).toBe(13);
    expect(scanResults.vulnerabilities.high).toBe(29);
    expect(scanResults.vulnerabilities.medium).toBe(32);
    expect(scanResults.vulnerabilities.low).toBe(3);
  });
  it('should accept any scan results', () => {
    const {
      result: { current: scanResults },
    } = testHook(() =>
      usePipelineRunVulnerabilities(
        PipeLineRunWithVulnerabilitiesData[PipeLineRunWithVulnerabilitiesNames.MyScanOutput],
      ),
    );
    expect(scanResults.vulnerabilities.critical).toBe(0);
    expect(scanResults.vulnerabilities.high).toBe(9);
    expect(scanResults.vulnerabilities.medium).toBe(2);
    expect(scanResults.vulnerabilities.low).toBe(13);
  });
  it('should ignore improper scan results', () => {
    const {
      result: { current: scanResults },
    } = testHook(() =>
      usePipelineRunVulnerabilities(
        PipeLineRunWithVulnerabilitiesData[PipeLineRunWithVulnerabilitiesNames.InvalidScanOutput],
      ),
    );
    expect(scanResults.vulnerabilities).toBeUndefined();
  });
  it('should aggregate vulnerability scan results', () => {
    const {
      result: { current: scanResults },
    } = testHook(() =>
      usePipelineRunVulnerabilities(
        PipeLineRunWithVulnerabilitiesData[PipeLineRunWithVulnerabilitiesNames.MultipleScanOutput],
      ),
    );
    expect(scanResults.vulnerabilities.critical).toBe(13);
    expect(scanResults.vulnerabilities.high).toBe(38);
    expect(scanResults.vulnerabilities.medium).toBe(34);
    expect(scanResults.vulnerabilities.low).toBe(16);
  });
});
