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
import { connectToFlags, FlagsObject } from '../../reducers/features';

export const STREAM_EOF = 'eof';
export const STREAM_LOADING = 'loading';
export const STREAM_PAUSED = 'paused';
export const STREAM_ACTIVE = 'streaming';

export const LOG_SOURCE_RESTARTING = 'restarting';
export const LOG_SOURCE_RUNNING = 'running';
export const LOG_SOURCE_TERMINATED = 'terminated';
export const LOG_SOURCE_WAITING = 'waiting';

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

const replaceVariables = (template, values) => {
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

// Component for log stream controls
export const LogControls = (props: LogControlsProps) => {
  const { t } = useTranslation();
  const {
    dropdown,
    logURL,
    toggleFullscreen,
    isFullscreen,
    status,
    toggleStreaming,
    resource,
    containerName,
    podLogLinks,
    namespaceUID,
  } = props;
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
        <a href={logURL} target="_blank" rel="noopener noreferrer">
          <OutlinedWindowRestoreIcon className="co-icon-space-r" />
          {t('logs~Raw')}
        </a>
        <span aria-hidden="true" className="co-action-divider hidden-xs">
          |
        </span>
        <a href={logURL} download>
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

type LogControlsProps = {
  isFullscreen: boolean;
  dropdown?: React.ReactNode;
  logURL: string;
  status?: string;
  resource?: any;
  containerName?: string;
  podLogLinks?: K8sResourceKind[];
  namespaceUID?: string;
  toggleStreaming?: () => void;
  toggleFullscreen: () => void;
};

// Resource agnostic log component
const ResourceLog_ = (props: ResourceLogProps) => {
  const buffer = React.useRef(new LineBuffer(props.bufferSize));
  const resourceLogRef = React.useRef();
  let ws;

  const [error, setError] = React.useState(false);
  const [hasTruncated, setHasTruncated] = React.useState(false);
  const [lines, setLines] = React.useState([]);
  const [linesBehind, setLinesBehind] = React.useState(0);
  const [resourceStatus, setResourceStatus] = React.useState(LOG_SOURCE_WAITING);
  const [stale, setStale] = React.useState(false);
  const [status, setStatus] = React.useState(STREAM_LOADING);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [namespaceUID, setNamespaceUID] = React.useState('');
  const [podLogLinks, setPodLogLinks] = React.useState();

  // Updates log status
  const updateStatus = (newStatus) => {
    // Reset linesBehind when transitioning out of paused state
    if (status !== STREAM_ACTIVE && newStatus === STREAM_ACTIVE) {
      setLinesBehind(0);
    }
    setStatus(newStatus);
  };

  // Initialize websocket connection and wire up handlers
  const wsInit = React.useCallback(() => {
    // Handler for websocket onopen event
    const onOpen = () => {
      buffer.current.clear();
      updateStatus(STREAM_ACTIVE);
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
        const linesAdded = buffer.current.ingest(text);
        setLinesBehind((currentLinesBehind) =>
          status === STREAM_PAUSED ? currentLinesBehind + linesAdded : currentLinesBehind,
        );
        setLines([...buffer.current.getLines(), buffer.current.getTail()]);
        setHasTruncated(buffer.current.getHasTruncated());
      }
    };
    if (
      [LOG_SOURCE_RUNNING, LOG_SOURCE_TERMINATED, LOG_SOURCE_RESTARTING].includes(resourceStatus)
    ) {
      const urlOpts = {
        ns: props.resource.metadata.namespace,
        name: props.resource.metadata.name,
        path: 'log',
        queryParams: {
          container: props.containerName || '',
          follow: 'true',
          tailLines: `${props.bufferSize}`,
        },
      };
      const watchURL = resourceURL(modelFor(props.resource.kind), urlOpts);
      const wsOpts = {
        host: 'auto',
        path: watchURL,
        subprotocols: ['base64.binary.k8s.io'],
      };

      ws = new WSFactory(watchURL, wsOpts)
        .onclose(onClose)
        .onerror(onError)
        .onmessage(onMessage)
        .onopen(onOpen);
    }
  }, [
    resourceStatus,
    props.resource.metadata.namespace,
    props.resource.metadata.name,
    props.resource.kind,
    props.containerName,
    props.bufferSize,
  ]);

  // Destroy websocket
  const wsDestroy = React.useCallback(() => {
    ws && ws.destroy();
  }, [ws]);

  // Destroy and reinitialize websocket connection
  const restartStream = React.useCallback(() => {
    setError(false);
    setHasTruncated(false);
    setLines([]);
    setLinesBehind(0);
    setStale(false);
    setStatus(STREAM_LOADING);
    wsDestroy();
    wsInit();
  }, [wsDestroy, wsInit]);

  // Toggle currently displayed log content to/from fullscreen
  const toggleFullscreen = () => {
    resourceLogRef.current && screenfull.enabled && screenfull.toggle(resourceLogRef.current);
  };

  // Toggle streaming/paused status
  const toggleStreaming = () => {
    updateStatus(status === STREAM_ACTIVE ? STREAM_PAUSED : STREAM_ACTIVE);
  };

  React.useEffect(() => {
    if (props.flags.CONSOLE_EXTERNAL_LOG_LINK && props.resource.kind === 'Pod') {
      Promise.all([
        k8sList(ConsoleExternalLogLinkModel),
        k8sGet(ProjectModel, props.resource.metadata.namespace),
      ])
        .then(([podLogLinks_, project]) => {
          // Project UID and namespace UID are the same value. Use the projects
          // API since normal OpenShift users can list projects.
          setPodLogLinks(podLogLinks_);
          setNamespaceUID(project.metadata.uid);
        })
        .catch((e) => setError(e));
    }
  }, [
    props.flags.CONSOLE_EXTERNAL_LOG_LINK,
    props.resource.kind,
    props.resource.metadata.namespace,
  ]);

  React.useEffect(() => {
    wsInit();
    if (screenfull.enabled) {
      screenfull.on('change', () => {
        setIsFullscreen(screenfull.isFullscreen);
      });
      screenfull.on('error', () => {
        setIsFullscreen(false);
      });
    }

    return () => {
      wsDestroy();
      if (screenfull.enabled) {
        screenfull.off('change');
        screenfull.off('error');
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (props.resourceStatus !== resourceStatus) {
      setResourceStatus(props.resourceStatus);
      // Container changed from non-running to running state, so currently displayed logs are stale
      if (
        resourceStatus === LOG_SOURCE_RESTARTING &&
        props.resourceStatus !== LOG_SOURCE_RESTARTING
      ) {
        setStale(true);
      }
    }
  }, [props.resourceStatus, resourceStatus]);

  React.useEffect(() => {
    const resourceStarted =
      resourceStatus === LOG_SOURCE_WAITING && props.resourceStatus !== LOG_SOURCE_WAITING;
    if (resourceStarted) {
      restartStream();
    }
  }, [props.resourceStatus, resourceStatus, restartStream]);

  React.useEffect(() => {
    restartStream();
  }, [props.containerName, restartStream]);

  const { resource, containerName, dropdown, bufferSize } = props;
  const { t } = useTranslation();
  const bufferFull = lines.length === bufferSize;
  const logURL = resourceURL(modelFor(resource.kind), {
    name: resource.metadata.name,
    ns: resource.metadata.namespace,
    path: 'log',
    queryParams: { container: containerName || '' },
  });

  return (
    <>
      {error && (
        <Alert
          isInline
          className="co-alert"
          variant="danger"
          title={t('logs~An error occurred while retrieving the requested logs.')}
          actionLinks={<AlertActionLink onClick={restartStream}>{t('logs~Retry')}</AlertActionLink>}
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
            <a href={logURL} target="_blank" rel="noopener noreferrer">
              open the raw file in another window
            </a>{' '}
            or{' '}
            <a href={logURL} download>
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
            <AlertActionLink onClick={restartStream}>{t('logs~Refresh')}</AlertActionLink>
          }
        />
      )}
      <div
        ref={resourceLogRef}
        className={classNames('resource-log', { 'resource-log--fullscreen': isFullscreen })}
      >
        <LogControls
          dropdown={dropdown}
          isFullscreen={isFullscreen}
          logURL={logURL}
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
          updateStatus={updateStatus}
        />
      </div>
    </>
  );
};

export const ResourceLog = connectToFlags(FLAGS.CONSOLE_EXTERNAL_LOG_LINK)(ResourceLog_);

ResourceLog.defaultProps = {
  bufferSize: 1000,
};

type ResourceLogProps = {
  bufferSize?: number;
  containerName?: string;
  dropdown?: React.ReactNode;
  resource: any;
  resourceStatus: string;
  flags: FlagsObject;
};
