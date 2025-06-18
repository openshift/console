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
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const pluginAssetBaseURL = `${document.baseURI}api/plugins/`;

const getPluginNameFromResourceURL = (url: string): string =>
  url?.startsWith(pluginAssetBaseURL)
    ? url.substring(pluginAssetBaseURL.length).split('/')[0]
    : null;

const isRecordExpired = ({ timestamp }: CSPViolationRecord): boolean =>
  timestamp && Date.now() - timestamp > CSP_VIOLATION_EXPIRATION;

const sameHostname = (a: string, b: string): boolean => {
  const urlA = new URL(a);
  const urlB = new URL(b);
  return urlA.hostname === urlB.hostname;
};

// CSP violiation records are considered equal if the following properties match:
// - pluginName
// - effectiveDirective
// - sourceFile
// - blockedURI hostname
const cspViolationRecordsAreEqual = (a: CSPViolationRecord, b: CSPViolationRecord): boolean =>
  a.pluginName === b.pluginName &&
  a.effectiveDirective === b.effectiveDirective &&
  a.sourceFile === b.sourceFile &&
  sameHostname(a.blockedURI, b.blockedURI);

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

const useCSPViolationQueue = (): ((record: CSPViolationRecord) => void) => {
  const fireTelemetryEvent = useTelemetry();
  const [records, setRecords] = React.useState<CSPViolationRecord[]>(() => {
    try {
      const serializedRecords = window.localStorage.getItem(LOCAL_STORAGE_CSP_VIOLATIONS_KEY) || '';
      const newRecords = serializedRecords ? JSON.parse(serializedRecords) : [];
      // Violations should expire when they haven't been reported for a while
      return newRecords.filter((v) => !isRecordExpired(v));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Error parsing CSP violation reports from local storage. Value will be reset.');
      return [];
    }
  });

  React.useEffect(() => {
    const existingRecords = window.localStorage.getItem(LOCAL_STORAGE_CSP_VIOLATIONS_KEY);
    const newRecords = JSON.stringify(records);
    if (newRecords !== existingRecords) {
      window.localStorage.setItem(LOCAL_STORAGE_CSP_VIOLATIONS_KEY, newRecords);
    }
  }, [records]);

  return React.useCallback(
    (newRecord: CSPViolationRecord) => {
      setRecords((currentRecords) => {
        if (currentRecords.some((record) => cspViolationRecordsAreEqual(record, newRecord))) {
          return currentRecords;
        }
        if (IS_PRODUCTION) {
          fireTelemetryEvent('CSPViolation', newRecord);
        }
        return [...(currentRecords || []), newRecord];
      });
    },
    [fireTelemetryEvent],
  );
};

export const useCSPViolationDetector = () => {
  const { t } = useTranslation();
  const toastContext = useToast();
  const pluginStore = usePluginStore();
  const addRecordToQueue = useCSPViolationQueue();

  const reportViolation = React.useCallback(
    (event) => {
      // eslint-disable-next-line no-console
      console.warn('Content Security Policy violation detected', event);

      // Attempt to infer Console plugin name from SecurityPolicyViolation event
      const pluginName =
        getPluginNameFromResourceURL(event.blockedURI) ||
        getPluginNameFromResourceURL(event.sourceFile);

      addRecordToQueue({
        ...newCSPViolationReport(pluginName, event),
        timestamp: Date.now(),
      });

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

        if (pluginIsLoaded && !IS_PRODUCTION && !pluginInfo.hasCSPViolations) {
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
    [addRecordToQueue, pluginStore, toastContext, t],
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
