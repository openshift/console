import * as React from 'react';
import { AlertVariant } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { usePluginStore } from '@console/plugin-sdk/src/api/usePluginStore';
import { useToast } from '@console/shared/src/components/toast';
import { ONE_DAY } from '@console/shared/src/constants/time';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';

const CSP_VIOLATION_EXPIRATION = ONE_DAY;
const LOCAL_STORAGE_CSP_VIOLATIONS_KEY = 'console/csp_violations';

const pluginAssetBaseURL = `${document.baseURI}api/plugins/`;

const getPluginNameFromResourceURL = (url: string): string =>
  url?.startsWith(pluginAssetBaseURL)
    ? url.substring(pluginAssetBaseURL.length).split('/')[0]
    : null;

const isRecordExpired = ({ timestamp }: CSPViolationRecord): boolean => {
  return timestamp && Date.now() - timestamp > CSP_VIOLATION_EXPIRATION;
};

// Export for testing
export const newCSPViolationReport = (
  pluginName: string,
  // https://developer.mozilla.org/en-US/docs/Web/API/SecurityPolicyViolationEvent
  event: SecurityPolicyViolationEvent,
): CSPViolationReport => ({
  ..._.pick(event, [
    'blockedURI',
    'columnNumber',
    'disposition',
    'documentURI',
    'effectiveDirective',
    'lineNumber',
    'originalPolicy',
    'referrer',
    'sample',
    'sourceFile',
    'statusCode',
  ]),
  pluginName: pluginName || '',
});

export const useCSPViolationDetector = () => {
  const { t } = useTranslation();
  const toastContext = useToast();
  const pluginStore = usePluginStore();
  const fireTelemetryEvent = useTelemetry();
  const getRecords = React.useCallback((): CSPViolationRecord[] => {
    const serializedRecords = window.localStorage.getItem(LOCAL_STORAGE_CSP_VIOLATIONS_KEY) || '';
    try {
      const records = serializedRecords ? JSON.parse(serializedRecords) : [];
      // Violations should expire when they haven't been reported for a while
      return records.reduce((acc, v) => (isRecordExpired(v) ? acc : [...acc, v]), []);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Error parsing CSP violation reports from local storage. Value will be reset.');
      return [];
    }
  }, []);

  const updateRecords = React.useCallback(
    (
      existingRecords: CSPViolationRecord[],
      newRecord: CSPViolationRecord,
    ): CSPViolationRecord[] => {
      if (!existingRecords.length) {
        return [newRecord];
      }

      // Update the existing records. If a matching report is already recorded in local storage,
      // update the timestamp. Otherwise, append the new record.
      const [updatedRecords] = existingRecords.reduce(
        ([acc, hasBeenRecorded], existingRecord, i, all) => {
          // Exclude originalPolicy and timestamp from equality comparison.
          const { timestamp, originalPolicy, ...existingReport } = existingRecord;
          const { timestamp: _t, originalPolicy: _o, ...newReport } = newRecord;

          // Replace matching report with a newly timestamped record
          if (_.isEqual(newReport, existingReport)) {
            return [[...acc, newRecord], true];
          }

          // If this is the last record and the new report has not been recorded yet, append it
          if (i === all.length - 1 && !hasBeenRecorded) {
            return [[...acc, existingRecord, newRecord], true];
          }

          // Append all existing records that don't match to the accumulator
          return [[...acc, existingRecord], hasBeenRecorded];
        },
        [[], false],
      );
      return updatedRecords;
    },
    [],
  );

  const reportViolation = React.useCallback(
    (event) => {
      // eslint-disable-next-line no-console
      console.warn('Content Security Policy violation detected', event);

      // Attempt to infer Console plugin name from SecurityPolicyViolation event
      const pluginName =
        getPluginNameFromResourceURL(event.blockedURI) ||
        getPluginNameFromResourceURL(event.sourceFile);

      const existingRecords = getRecords();
      const newRecord = {
        ...newCSPViolationReport(pluginName, event),
        timestamp: Date.now(),
      };
      const updatedRecords = updateRecords(existingRecords, newRecord);
      const isNewOccurrence = updatedRecords.length > existingRecords.length;
      const isProduction = process.env.NODE_ENV === 'production';

      window.localStorage.setItem(LOCAL_STORAGE_CSP_VIOLATIONS_KEY, JSON.stringify(updatedRecords));

      if (isNewOccurrence && isProduction) {
        fireTelemetryEvent('CSPViolation', newRecord);
      }

      if (pluginName) {
        const pluginInfo = pluginStore.findDynamicPluginInfo(pluginName);
        const validPlugin = !!pluginInfo;
        const pluginIsLoaded = validPlugin && pluginInfo.status === 'Loaded';

        // eslint-disable-next-line no-console
        console.warn(
          `Content Security Policy violation seems to originate from ${
            validPlugin ? `plugin ${pluginName}` : `unknown plugin ${pluginName}`
          }`,
        );

        if (validPlugin) {
          pluginStore.setCustomDynamicPluginInfo(pluginName, { hasCSPViolations: true });
        }

        if (pluginIsLoaded && !isProduction && !pluginInfo.hasCSPViolations) {
          toastContext.addToast({
            variant: AlertVariant.warning,
            title: t('public~Content Security Policy violation in Console plugin'),
            content: t(
              "public~{{pluginName}} might have violated the Console Content Security Policy. Refer to the browser's console logs for details.",
              {
                pluginName,
              },
            ),
            timeout: true,
            dismissible: true,
          });
        }
      }
    },
    [fireTelemetryEvent, getRecords, t, toastContext, updateRecords, pluginStore],
  );

  React.useEffect(() => {
    document.addEventListener('securitypolicyviolation', reportViolation);
    return () => {
      document.removeEventListener('securitypolicyviolation', reportViolation);
    };
  }, [reportViolation]);
};

/** A subset of properties from a SecurityPolicyViolationEvent which identify a unique CSP violation */
type CSPViolationReportProperties =
  // The URI of the resource that was blocked because it violates a policy.
  | 'blockedURI'
  // The column number in the document or worker at which the violation occurred.
  | 'columnNumber'
  // Whether the user agent is configured to enforce or just report the policy violation.
  | 'disposition'
  // The URI of the document or worker in which the violation occurred.
  | 'documentURI'
  // The directive that was violated.
  | 'effectiveDirective'
  // The line number in the document or worker at which the violation occurred.
  | 'lineNumber'
  // The policy whose enforcement caused the violation.
  | 'originalPolicy'
  // The URL for the referrer of the resources whose policy was violated, or null.
  | 'referrer'
  // A sample of the resource that caused the violation, usually the first 40 characters.
  // This will only be populated if the resource is an inline script, event handler or style.
  | 'sample'
  // If the violation occurred as a result of a script, this will be the URL of the script.
  | 'sourceFile'
  // HTTP status code of the document or worker in which the violation occurred.
  | 'statusCode';

/** A CSPViolationReport represents a unique CSP violation per plugin */
type CSPViolationReport = Pick<SecurityPolicyViolationEvent, CSPViolationReportProperties> & {
  pluginName: string;
};

/** A CSPViolationRecord represents a unique CSP violation per plugin, per occurrance */
type CSPViolationRecord = CSPViolationReport & { timestamp: number };
