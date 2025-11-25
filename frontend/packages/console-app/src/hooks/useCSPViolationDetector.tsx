import { useCallback, useEffect } from 'react';
import { AlertVariant } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { setPluginCSPViolations, PluginCSPViolations } from '@console/internal/actions/ui';
import { RootState } from '@console/internal/redux';
import { usePluginStore } from '@console/plugin-sdk/src/api/usePluginStore';
import { useToast } from '@console/shared/src/components/toast';
import { IS_PRODUCTION } from '@console/shared/src/constants/common';
import { ONE_DAY } from '@console/shared/src/constants/time';
import { useLocalStorageCache } from '@console/shared/src/hooks/useLocalStorageCache';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';

const CSP_VIOLATION_EXPIRATION = ONE_DAY;
const LOCAL_STORAGE_CSP_VIOLATIONS_KEY = 'console/csp_violations';
const CSP_VIOLATION_TELEMETRY_EVENT_NAME = 'CSPViolation';

const pluginAssetBaseURL = `${document.baseURI}api/plugins/`;

const getPluginNameFromResourceURL = (url: string): string =>
  url?.startsWith(pluginAssetBaseURL)
    ? url.substring(pluginAssetBaseURL.length).split('/')[0]
    : null;

const sameHostname = (a: string, b: string): boolean => {
  const urlA = new URL(a);
  const urlB = new URL(b);
  return urlA.hostname === urlB.hostname;
};

// CSP violation records are considered equal if the following properties match:
// - pluginName
// - effectiveDirective
// - sourceFile
// - documentURI
// - blockedURI hostname
const pluginCSPViolationsAreEqual = (
  a: PluginCSPViolationEvent,
  b: PluginCSPViolationEvent,
): boolean =>
  a.pluginName === b.pluginName &&
  a.effectiveDirective === b.effectiveDirective &&
  a.sourceFile === b.sourceFile &&
  a.documentURI === b.documentURI &&
  sameHostname(a.blockedURI, b.blockedURI);

// Export for testing
export const newPluginCSPViolationEvent = (
  pluginName: string,
  // https://developer.mozilla.org/en-US/docs/Web/API/SecurityPolicyViolationEvent
  event: SecurityPolicyViolationEvent,
): PluginCSPViolationEvent => ({
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
  const fireTelemetryEvent = useTelemetry();
  const pluginStore = usePluginStore();
  const cspViolations = useSelector<RootState, PluginCSPViolations>(({ UI }) =>
    UI.get('pluginCSPViolations'),
  );
  const dispatch = useDispatch();
  const [, cacheEvent] = useLocalStorageCache<PluginCSPViolationEvent>(
    LOCAL_STORAGE_CSP_VIOLATIONS_KEY,
    CSP_VIOLATION_EXPIRATION,
    pluginCSPViolationsAreEqual,
  );

  const reportViolation = useCallback(
    (event) => {
      // eslint-disable-next-line no-console
      console.warn('Content Security Policy violation detected', event);

      // Attempt to infer Console plugin name from SecurityPolicyViolation event
      const pluginName =
        getPluginNameFromResourceURL(event.blockedURI) ||
        getPluginNameFromResourceURL(event.sourceFile);

      const pluginCSPViolationEvent = newPluginCSPViolationEvent(pluginName, event);
      const isNew = cacheEvent(pluginCSPViolationEvent);

      if (isNew && IS_PRODUCTION) {
        fireTelemetryEvent(CSP_VIOLATION_TELEMETRY_EVENT_NAME, pluginCSPViolationEvent);
      }

      if (pluginName) {
        const pluginInfo = pluginStore
          .getPluginInfo()
          .find((entry) => entry.manifest.name === pluginName);

        const validPlugin = !!pluginInfo;
        const pluginIsLoaded = validPlugin && pluginInfo.status === 'loaded';

        // eslint-disable-next-line no-console
        console.warn(
          `Content Security Policy violation seems to originate from ${
            validPlugin ? `plugin ${pluginName}` : `unknown plugin ${pluginName}`
          }`,
        );

        if (validPlugin) {
          dispatch(setPluginCSPViolations(pluginName, true));
        }

        if (pluginIsLoaded && !IS_PRODUCTION && !cspViolations[pluginName]) {
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
    [cacheEvent, fireTelemetryEvent, pluginStore, toastContext, t, dispatch, cspViolations],
  );

  useEffect(() => {
    document.addEventListener('securitypolicyviolation', reportViolation);
    return () => {
      document.removeEventListener('securitypolicyviolation', reportViolation);
    };
  }, [reportViolation]);
};

/** A subset of properties from a SecurityPolicyViolationEvent which identify a unique CSP violation */
type PluginCSPViolationProperties =
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

/** A PluginCSPViolationEvent represents a CSP violation event associated with a plugin */
type PluginCSPViolationEvent = Pick<SecurityPolicyViolationEvent, PluginCSPViolationProperties> & {
  pluginName: string;
};
