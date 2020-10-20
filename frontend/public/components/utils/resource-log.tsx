import * as React from 'react';
import { Base64 } from 'js-base64';
import { Alert, AlertActionLink, Button } from '@patternfly/react-core';
import * as _ from 'lodash-es';
import { Trans, useTranslation } from 'react-i18next';
import {
  CompressIcon,
  ExpandIcon,
  DownloadIcon,
  OutlinedWindowRestoreIcon,
} from '@patternfly/react-icons';
import * as classNames from 'classnames';
import { FLAGS } from '@console/shared/src/constants';
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

const DEFAULT_BUFFER_SIZE = 1000;

// Messages to display for corresponding log status
const streamStatusMessages = {
  // t('logs~Log stream ended.')
  [STREAM_EOF]: 'logs~Log stream ended.',
  // t('logs~Loading log...')
  [STREAM_LOADING]: 'logs~Loading log...',
  // t('logs~Log stream paused.')
  [STREAM_PAUSED]: 'logs~Log stream paused.',
  // t('logs~Log streaming...')
  [STREAM_ACTIVE]: 'logs~Log streaming...',
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
): string => {
  return resourceURL(modelFor(resource.kind), {
    name: resource.metadata.name,
    ns: resource.metadata.namespace,
    path: 'log',
    queryParams: {
      container: containerName || '',
      ...(tailLines && { tailLines: `${tailLines}` }),
      ...(follow && { follow: `${follow}` }),
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
}) => {
  const { t } = useTranslation();
  return (
    <div className="co-toolbar">
      <div className="co-toolbar__group co-toolbar__group--left">
        <div className="co-toolbar__item">
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
        </div>
        {dropdown && <div className="co-toolbar__item">{dropdown}</div>}
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
        <a href={currentLogURL} target="_blank" rel="noopener noreferrer">
          <OutlinedWindowRestoreIcon className="co-icon-space-r" />
          {t('logs~Raw')}
        </a>
        <span aria-hidden="true" className="co-action-divider hidden-xs">
          |
        </span>
        <a href={currentLogURL} download>
          <DownloadIcon className="co-icon-space-r" />
          {t('logs~Download')}
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
                  {t('logs~Collapse')}
                </>
              ) : (
                <>
                  <ExpandIcon className="co-icon-space-r" />
                  {t('logs~Expand')}
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
  const previousResourceStatus = usePrevious(resourceStatus);
  const previousTotalLineCount = usePrevious(totalLineCount);
  const bufferFull = lines.length === bufferSize;
  const linkURL = getResourceLogURL(resource, containerName);
  const watchURL = getResourceLogURL(resource, containerName, bufferSize, true);

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
          title={t('logs~An error occurred while retrieving the requested logs.')}
          actionLinks={
            <AlertActionLink onClick={() => setError(false)}>{t('logs~Retry')}</AlertActionLink>
          }
        />
      )}
      {hasTruncated && (
        <Alert
          isInline
          className="co-alert"
          variant="warning"
          title={t('logs~Some lines have been abridged because they are exceptionally long.')}
        >
          <Trans ns="logs" t={t}>
            To view unabridged log content, you can either{' '}
            <a href={linkURL} target="_blank" rel="noopener noreferrer">
              open the raw file in another window
            </a>{' '}
            or{' '}
            <a href={linkURL} download>
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
          title={t('logs~The logs for this {{resourceKind}} may be stale.', {
            resourceKind: resource.kind,
          })}
          actionLinks={
            <AlertActionLink onClick={() => setStale(false)}>{t('logs~Refresh')}</AlertActionLink>
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
        />
        <LogWindow
          bufferFull={bufferFull}
          isFullscreen={isFullscreen}
          lines={lines}
          linesBehind={linesBehind}
          status={status}
          updateStatus={setStatus}
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
};

type ResourceLogProps = {
  bufferSize?: number;
  containerName?: string;
  dropdown?: React.ReactNode;
  resource: any;
  resourceStatus: string;
};
