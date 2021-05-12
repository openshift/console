import * as React from 'react';
import { Base64 } from 'js-base64';
import {
  Alert,
  AlertActionLink,
  Button,
  Checkbox,
  Select,
  SelectOption,
  SelectVariant,
  Tooltip,
} from '@patternfly/react-core';

import * as _ from 'lodash-es';
import { Trans, useTranslation } from 'react-i18next';
import {
  CompressIcon,
  ExpandIcon,
  DownloadIcon,
  OutlinedWindowRestoreIcon,
} from '@patternfly/react-icons';
import * as classNames from 'classnames';
import { FLAGS, USERSETTINGS_PREFIX } from '@console/shared/src/constants';
import { useUserSettings } from '@console/shared';
import { LoadingInline, LogWindow, TogglePlay, ExternalLink } from './';
import { modelFor, resourceURL } from '../../module/k8s';
import { WSFactory } from '../../module/ws-factory';
import { LineBuffer } from './line-buffer';
import * as screenfull from 'screenfull';
import { k8sGet, k8sList, K8sResourceKind } from '@console/internal/module/k8s';
import { ConsoleExternalLogLinkModel, ProjectModel } from '@console/internal/models';
import { useFlag } from '@console/shared/src/hooks/flag';
import { usePrevious } from '@console/shared/src/hooks/previous';

export const STREAM_EOF = 'eof';
export const STREAM_LOADING = 'loading';
export const STREAM_PAUSED = 'paused';
export const STREAM_ACTIVE = 'streaming';

export const LOG_SOURCE_RESTARTING = 'restarting';
export const LOG_SOURCE_RUNNING = 'running';
export const LOG_SOURCE_TERMINATED = 'terminated';
export const LOG_SOURCE_WAITING = 'waiting';

const LOG_TYPE_CURRENT = 'current';
const LOG_TYPE_PREVIOUS = 'previous';

const DEFAULT_BUFFER_SIZE = 1000;

// Messages to display for corresponding log status
const streamStatusMessages = {
  // t('public~Log stream ended.')
  [STREAM_EOF]: 'public~Log stream ended.',
  // t('public~Loading log...')
  [STREAM_LOADING]: 'public~Loading log...',
  // t('public~Log stream paused.')
  [STREAM_PAUSED]: 'public~Log stream paused.',
  // t('public~Log streaming...')
  [STREAM_ACTIVE]: 'public~Log streaming...',
};

const replaceVariables = (template: string, values: any): string => {
  return _.reduce(
    values,
    (result, value, name) => {
      // Replace all occurrences of template expressions like "${name}" with the URL-encoded value.
      // eslint-disable-next-line prefer-template
      const pattern = _.escapeRegExp('${' + name + '}');
      return result.replace(new RegExp(pattern, 'g'), encodeURIComponent(value));
    },
    template,
  );
};

// Build a log API url for a given resource
const getResourceLogURL = (
  resource: K8sResourceKind,
  containerName?: string,
  tailLines?: number,
  follow?: boolean,
  logType?: LogTypeStatus,
): string => {
  const previous = logType === LOG_TYPE_PREVIOUS;
  return resourceURL(modelFor(resource.kind), {
    name: resource.metadata.name,
    ns: resource.metadata.namespace,
    path: 'log',
    queryParams: {
      container: containerName || '',
      ...(tailLines && { tailLines: `${tailLines}` }),
      ...(follow && { follow: `${follow}` }),
      ...(previous && { previous: `${previous}` }),
    },
  });
};

// Component for log stream controls
export const LogControls: React.FC<LogControlsProps> = ({
  dropdown,
  toggleFullscreen,
  currentLogURL,
  isFullscreen,
  status,
  toggleStreaming,
  resource,
  containerName,
  podLogLinks,
  namespaceUID,
  toggleWrapLines,
  isWrapLines,
  changeLogType,
  hasPreviousLog,
  logType,
  showLogTypeSelect,
}) => {
  const { t } = useTranslation();
  const [isLogTypeOpen, setLogTypeOpen] = React.useState(false);

  const logTypes: Array<LogType> = [
    { type: LOG_TYPE_CURRENT, text: t('public~Current log') },
    { type: LOG_TYPE_PREVIOUS, text: t('public~Previous log') },
  ];

  const logOption = (log: LogType) => {
    return (
      <SelectOption key={log.type} value={log.type}>
        {log.text}
      </SelectOption>
    );
  };

  const showStatus = () => {
    if (logType !== LOG_TYPE_PREVIOUS) {
      return (
        <>
          {status === STREAM_LOADING && (
            <>
              <LoadingInline />
              &nbsp;
            </>
          )}
          {[STREAM_ACTIVE, STREAM_PAUSED].includes(status) && (
            <TogglePlay active={status === STREAM_ACTIVE} onClick={toggleStreaming} />
          )}
          {t(streamStatusMessages[status])}
        </>
      );
    }
    return <>{t(streamStatusMessages[STREAM_EOF])} </>;
  };

  const logTypeSelect = (isDisabled: boolean) => {
    if (!showLogTypeSelect) {
      return null;
    }

    const select = (
      <span>
        <span id="logTypeSelect" hidden>
          Log type
        </span>
        <Select
          variant={SelectVariant.single}
          onToggle={(isOpen: boolean) => {
            setLogTypeOpen(isOpen);
          }}
          onSelect={(event: React.MouseEvent | React.ChangeEvent, value: LogTypeStatus) => {
            changeLogType(value);
            setLogTypeOpen(false);
          }}
          selections={logType}
          isOpen={isLogTypeOpen}
          isDisabled={isDisabled}
          aria-labelledby="logTypeSelect"
        >
          {logTypes.map((log) => logOption(log))}
        </Select>
      </span>
    );
    return hasPreviousLog ? (
      select
    ) : (
      <Tooltip content={t('public~Only the current log is available for this container.')}>
        {select}
      </Tooltip>
    );
  };

  return (
    <div className="co-toolbar">
      <div className="co-toolbar__group co-toolbar__group--left">
        <div className="co-toolbar__item">{showStatus()}</div>
        {dropdown && <div className="co-toolbar__item">{dropdown}</div>}

        <div className="co-toolbar__item">{logTypeSelect(!hasPreviousLog)}</div>
      </div>
      <div className="co-toolbar__group co-toolbar__group--right">
        {!_.isEmpty(podLogLinks) &&
          _.map(_.sortBy(podLogLinks, 'metadata.name'), (link) => {
            const namespace = resource.metadata.namespace;
            const namespaceFilter = link.spec.namespaceFilter;
            if (namespaceFilter) {
              try {
                const namespaceRegExp = new RegExp(namespaceFilter, 'g');
                if (namespace.search(namespaceRegExp)) {
                  return null;
                }
              } catch (e) {
                // eslint-disable-next-line no-console
                console.warn('invalid log link regex', namespaceFilter, e);
                return null;
              }
            }
            const url = replaceVariables(link.spec.hrefTemplate, {
              resourceName: resource.metadata.name,
              resourceUID: resource.metadata.uid,
              containerName,
              resourceNamespace: namespace,
              resourceNamespaceUID: namespaceUID,
              podLabels: JSON.stringify(resource.metadata.labels),
            });
            return (
              <React.Fragment key={link.metadata.uid}>
                <ExternalLink href={url} text={link.spec.text} dataTestID={link.metadata.name} />
                <span aria-hidden="true" className="co-action-divider hidden-xs">
                  |
                </span>
              </React.Fragment>
            );
          })}
        <Checkbox
          label={t('public~Wrap lines')}
          id="wrapLogLines"
          isChecked={isWrapLines}
          onChange={(checked: boolean) => {
            toggleWrapLines(checked);
          }}
        />
        <span aria-hidden="true" className="co-action-divider hidden-xs">
          |
        </span>
        <a href={currentLogURL} target="_blank" rel="noopener noreferrer">
          <OutlinedWindowRestoreIcon className="co-icon-space-r" />
          {t('public~Raw')}
        </a>
        <span aria-hidden="true" className="co-action-divider hidden-xs">
          |
        </span>
        <a href={currentLogURL} download={`${resource.metadata.name}-${containerName}.log`}>
          <DownloadIcon className="co-icon-space-r" />
          {t('public~Download')}
        </a>
        {screenfull.enabled && (
          <>
            <span aria-hidden="true" className="co-action-divider hidden-xs">
              |
            </span>
            <Button variant="link" isInline onClick={toggleFullscreen}>
              {isFullscreen ? (
                <>
                  <CompressIcon className="co-icon-space-r" />
                  {t('public~Collapse')}
                </>
              ) : (
                <>
                  <ExpandIcon className="co-icon-space-r" />
                  {t('public~Expand')}
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

// Resource agnostic log component
export const ResourceLog: React.FC<ResourceLogProps> = ({
  bufferSize = DEFAULT_BUFFER_SIZE,
  containerName,
  dropdown,
  resource,
  resourceStatus,
}) => {
  const { t } = useTranslation();
  const buffer = React.useRef(new LineBuffer(bufferSize)); // TODO Make this a hook
  const ws = React.useRef<any>(); // TODO Make this a hook
  const resourceLogRef = React.useRef();
  const externalLogLinkFlag = useFlag(FLAGS.CONSOLE_EXTERNAL_LOG_LINK);
  const [error, setError] = React.useState(false);
  const [hasTruncated, setHasTruncated] = React.useState(false);
  const [lines, setLines] = React.useState([]);
  const [linesBehind, setLinesBehind] = React.useState(0);
  const [totalLineCount, setTotalLineCount] = React.useState(0);
  const [stale, setStale] = React.useState(false);
  const [status, setStatus] = React.useState(STREAM_LOADING);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [namespaceUID, setNamespaceUID] = React.useState('');
  const [podLogLinks, setPodLogLinks] = React.useState();

  const [logType, setLogType] = React.useState<LogTypeStatus>(LOG_TYPE_CURRENT);
  const [hasPreviousLogs, setPreviousLogs] = React.useState(false);

  const previousResourceStatus = usePrevious(resourceStatus);
  const previousTotalLineCount = usePrevious(totalLineCount);
  const bufferFull = lines.length === bufferSize;
  const linkURL = getResourceLogURL(resource, containerName);
  const watchURL = getResourceLogURL(resource, containerName, bufferSize, true, logType);
  const [wrapLines, setWrapLines] = useUserSettings<boolean>(
    `${USERSETTINGS_PREFIX}.log.wrapLines`,
    false,
    true,
  );

  // Update lines behind while stream is paused, reset when unpaused
  React.useEffect(() => {
    if (status === STREAM_ACTIVE) {
      setLinesBehind(0);
    }

    if (status === STREAM_PAUSED) {
      setLinesBehind((currentLinesBehind) =>
        Math.min(currentLinesBehind + (totalLineCount - previousTotalLineCount), bufferSize),
      );
    }
  }, [status, totalLineCount, previousTotalLineCount, bufferSize]);

  // Set back to viewing current log when switching containers
  React.useEffect(() => {
    if (resource.kind === 'Pod') {
      setLogType(LOG_TYPE_CURRENT);
    }
  }, [resource.kind, containerName]);

  //Check to see if previous log exists
  React.useEffect(() => {
    if (resource.kind === 'Pod') {
      const container = resource.status?.containerStatuses?.find(
        (pod) => pod.name === containerName,
      );
      setPreviousLogs(container?.restartCount > 0); // Assuming previous log is available if the container has been restarted at least once
    }
  }, [containerName, resource.kind, resource.status]);

  const startWebSocket = React.useCallback(() => {
    // Handler for websocket onopen event
    const onOpen = () => {
      buffer.current.clear();
      setStatus(STREAM_ACTIVE);
    };
    // Handler for websocket onclose event
    const onClose = () => {
      setStatus(STREAM_EOF);
    };
    // Handler for websocket onerror event
    const onError = () => {
      setError(true);
    };
    // Handler for websocket onmessage event
    const onMessage = (msg) => {
      if (msg) {
        const text = Base64.decode(msg);
        setTotalLineCount((currentLineCount) => currentLineCount + buffer.current.ingest(text));
        setLines([...buffer.current.getLines(), buffer.current.getTail()]);
        setHasTruncated(buffer.current.getHasTruncated());
      }
    };
    setError(false);
    setHasTruncated(false);
    setLines([]);
    setTotalLineCount(0);
    setLinesBehind(0);
    setStale(false);
    setStatus(STREAM_LOADING);
    ws.current?.destroy();
    ws.current = new WSFactory(watchURL, {
      host: 'auto',
      path: watchURL,
      subprotocols: ['base64.binary.k8s.io'],
    })
      .onclose(onClose)
      .onerror(onError)
      .onmessage(onMessage)
      .onopen(onOpen);
  }, [watchURL]);
  // Restart websocket if startWebSocket function changes
  React.useEffect(() => {
    if (
      !error &&
      !stale &&
      [LOG_SOURCE_RUNNING, LOG_SOURCE_TERMINATED, LOG_SOURCE_RESTARTING].includes(resourceStatus)
    ) {
      startWebSocket();
    }
    return () => ws.current?.destroy();
  }, [error, resourceStatus, stale, startWebSocket]);

  // Toggle currently displayed log content to/from fullscreen
  const toggleFullscreen = () => {
    resourceLogRef.current && screenfull.enabled && screenfull.toggle(resourceLogRef.current);
  };

  // Toggle streaming/paused status
  const toggleStreaming = () => {
    setStatus((currentStatus) => (currentStatus === STREAM_ACTIVE ? STREAM_PAUSED : STREAM_ACTIVE));
  };

  //
  React.useEffect(() => {
    if (externalLogLinkFlag && resource.kind === 'Pod') {
      Promise.all([
        k8sList(ConsoleExternalLogLinkModel),
        k8sGet(ProjectModel, resource.metadata.namespace),
      ])
        .then(([podLogLinks_, project]) => {
          // Project UID and namespace UID are the same value. Use the projects
          // API since normal OpenShift users can list projects.
          setPodLogLinks(podLogLinks_);
          setNamespaceUID(project.metadata.uid);
        })
        .catch((e) => setError(e));
    }
  }, [externalLogLinkFlag, resource.kind, resource.metadata.namespace]);

  // Only run once, initialize screenfull
  React.useEffect(() => {
    if (screenfull.enabled) {
      screenfull.on('change', () => {
        setIsFullscreen(screenfull.isFullscreen);
      });
      screenfull.on('error', () => {
        setIsFullscreen(false);
      });
    }

    return () => {
      if (screenfull.enabled) {
        screenfull.off('change');
        screenfull.off('error');
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // If container comes out of restarting state, currently displayed logs might be stale
  React.useEffect(() => {
    if (
      previousResourceStatus === LOG_SOURCE_RESTARTING &&
      resourceStatus !== LOG_SOURCE_RESTARTING
    ) {
      setStale(true);
    }
  }, [previousResourceStatus, resourceStatus]);

  return (
    <>
      {error && (
        <Alert
          isInline
          className="co-alert"
          variant="danger"
          title={t('public~An error occurred while retrieving the requested logs.')}
          actionLinks={
            <AlertActionLink onClick={() => setError(false)}>{t('public~Retry')}</AlertActionLink>
          }
        />
      )}
      {hasTruncated && (
        <Alert
          isInline
          className="co-alert"
          variant="warning"
          title={t('public~Some lines have been abridged because they are exceptionally long.')}
        >
          <Trans ns="public" t={t}>
            To view unabridged log content, you can either{' '}
            <a href={linkURL} target="_blank" rel="noopener noreferrer">
              open the raw file in another window
            </a>{' '}
            or{' '}
            <a href={linkURL} download={`${resource.metadata.name}-${containerName}.log`}>
              download it
            </a>
            .
          </Trans>
        </Alert>
      )}
      {stale && (
        <Alert
          isInline
          className="co-alert"
          variant="info"
          title={t('public~The logs for this {{resourceKind}} may be stale.', {
            resourceKind: resource.kind,
          })}
          actionLinks={
            <AlertActionLink onClick={() => setStale(false)}>{t('public~Refresh')}</AlertActionLink>
          }
        />
      )}
      <div
        ref={resourceLogRef}
        className={classNames('resource-log', { 'resource-log--fullscreen': isFullscreen })}
      >
        <LogControls
          currentLogURL={linkURL}
          dropdown={dropdown}
          isFullscreen={isFullscreen}
          status={status}
          toggleFullscreen={toggleFullscreen}
          toggleStreaming={toggleStreaming}
          resource={resource}
          containerName={containerName}
          podLogLinks={podLogLinks}
          namespaceUID={namespaceUID}
          toggleWrapLines={setWrapLines}
          isWrapLines={wrapLines}
          hasPreviousLog={hasPreviousLogs}
          changeLogType={setLogType}
          logType={logType}
          showLogTypeSelect={resource.kind === 'Pod'}
        />
        <LogWindow
          bufferFull={bufferFull}
          isFullscreen={isFullscreen}
          lines={lines}
          linesBehind={linesBehind}
          status={status}
          updateStatus={setStatus}
          wrapLines={wrapLines}
        />
      </div>
    </>
  );
};

type LogControlsProps = {
  currentLogURL: string;
  isFullscreen: boolean;
  dropdown?: React.ReactNode;
  status?: string;
  resource?: any;
  containerName?: string;
  podLogLinks?: K8sResourceKind[];
  namespaceUID?: string;
  toggleStreaming?: () => void;
  toggleFullscreen: () => void;
  toggleWrapLines: (wrapLines: boolean) => void;
  isWrapLines: boolean;
  changeLogType: (type: LogTypeStatus) => void;
  hasPreviousLog?: boolean;
  logType: LogTypeStatus;
  showLogTypeSelect: boolean;
};

type ResourceLogProps = {
  bufferSize?: number;
  containerName?: string;
  dropdown?: React.ReactNode;
  resource: any;
  resourceStatus: string;
};

type LogTypeStatus = typeof LOG_TYPE_CURRENT | typeof LOG_TYPE_PREVIOUS;
type LogType = { type: LogTypeStatus; text: string };
