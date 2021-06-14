import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { Base64 } from 'js-base64';
import { useTranslation } from 'react-i18next';
import { coFetchText } from '@console/internal/co-fetch';
import { LOG_SOURCE_TERMINATED } from '@console/internal/components/utils';
import { resourceURL, modelFor, PodKind, ContainerSpec } from '@console/internal/module/k8s';
import { WSFactory } from '@console/internal/module/ws-factory';
import './Logs.scss';

type LogsProps = {
  resource: PodKind;
  resourceStatus: string;
  container: ContainerSpec;
  render: boolean;
  autoScroll?: boolean;
  onComplete: (containerName: string) => void;
};

const Logs: React.FC<LogsProps> = ({
  resource,
  resourceStatus,
  container,
  onComplete,
  render,
  autoScroll = true,
}) => {
  const { t } = useTranslation();
  const { name } = container;
  const { kind, metadata = {} } = resource;
  const { name: resName, namespace: resNamespace } = metadata;
  const scrollToRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [error, setError] = React.useState<boolean>(false);
  const resourceStatusRef = React.useRef<string>(resourceStatus);
  const onCompleteRef = React.useRef<(name) => void>();
  onCompleteRef.current = onComplete;

  const appendMessage = React.useRef<(blockContent) => void>();

  appendMessage.current = React.useCallback(
    (blockContent: string) => {
      if (contentRef.current && blockContent) {
        contentRef.current.innerText += blockContent;
      }
      if (scrollToRef.current && blockContent && render && autoScroll) {
        scrollToRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    },
    [autoScroll, render],
  );

  if (resourceStatusRef.current !== resourceStatus) {
    resourceStatusRef.current = resourceStatus;
  }

  React.useEffect(() => {
    let loaded: boolean = false;
    let ws: WSFactory;
    const urlOpts = {
      ns: resNamespace,
      name: resName,
      path: 'log',
      queryParams: {
        container: name,
        follow: 'true',
      },
    };
    const watchURL = resourceURL(modelFor(kind), urlOpts);
    if (resourceStatusRef.current === LOG_SOURCE_TERMINATED) {
      coFetchText(watchURL)
        .then((res) => {
          if (loaded) return;
          appendMessage.current(res);
          onCompleteRef.current(name);
        })
        .catch(() => {
          if (loaded) return;
          setError(true);
          onCompleteRef.current(name);
        });
    } else {
      const wsOpts = {
        host: 'auto',
        path: watchURL,
        subprotocols: ['base64.binary.k8s.io'],
      };
      ws = new WSFactory(watchURL, wsOpts);
      ws.onmessage((msg) => {
        if (loaded) return;
        const message = Base64.decode(msg);
        appendMessage.current(message);
      })
        .onclose(() => {
          onCompleteRef.current(name);
        })
        .onerror(() => {
          if (loaded) return;
          setError(true);
          onCompleteRef.current(name);
        });
    }
    return () => {
      loaded = true;
      ws && ws.destroy();
    };
  }, [kind, name, resName, resNamespace]);

  React.useEffect(() => {
    if (scrollToRef.current && render && autoScroll) {
      scrollToRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [autoScroll, render]);

  return (
    <div className="odc-logs" style={{ display: render ? '' : 'none' }}>
      <p className="odc-logs__name">{name}</p>
      {error && (
        <Alert
          variant="danger"
          isInline
          title={t('pipelines-plugin~An error occurred while retrieving the requested logs.')}
        />
      )}
      <div>
        <div className="odc-logs__content" ref={contentRef} />
        <div ref={scrollToRef} />
      </div>
    </div>
  );
};

export default Logs;
