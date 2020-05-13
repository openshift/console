import * as React from 'react';
import * as _ from 'lodash-es';
import { Base64 } from 'js-base64';
import Measure from 'react-measure';
import store from '@console/internal/redux';
import { LoadingBox } from '@console/internal/components/utils';
import { connectToFlags } from '@console/internal/reducers/features';
import { FLAGS } from '@console/shared';
import { Terminal } from './terminal2';
import { WSFactory } from '@console/internal/module/ws-factory';
import { resourceURL } from '@console/internal/module/k8s';
import { PodModel } from '@console/internal/models';

// pod exec WS protocol is FD prefixed, base64 encoded data (sometimes json stringified)

// Channel 0 is STDIN, 1 is STDOUT, 2 is STDERR (if TTY is not requested), and 3 is a special error channel - 4 is C&C
// The server only reads from STDIN, writes to the other three.
// see also: https://github.com/kubernetes/kubernetes/pull/13885

const NO_SH =
  'starting container process caused "exec: \\"sh\\": executable file not found in $PATH"';

export const CloudExec = connectToFlags(FLAGS.OPENSHIFT)(
  class PodExec extends React.PureComponent<any, any> {
    private terminal;
    private onData;
    private ws;
    constructor(props) {
      super(props);
      this.state = {
        open: false,
        dimensions: {
          width: 0,
          height: 0,
        },
      };
      this.terminal = React.createRef();
      this.onData = (d) => this.onData_(d);
    }

    connect_() {
      const { container, podname, command, namespace } = this.props;
      const usedClient = this.props.flags[FLAGS.OPENSHIFT] ? 'oc' : 'kubectl';

      const params = {
        ns: namespace,
        name: podname,
        path: 'exec',
        queryParams: {
          stdout: '1',
          stdin: '1',
          stderr: '1',
          tty: '1',
          container: container,
          command: ['sh', '-i', '-c', 'TERM=xterm sh']
            .map((c) => encodeURIComponent(c))
            .join('&command='),
        },
      };

      if (this.ws) {
        this.ws.destroy();
        const { current } = this.terminal;
        current && current.onConnectionClosed(`connecting to ${container}`);
      }

      const impersonate = store.getState().UI.get('impersonate', {});
      const subprotocols = (impersonate.subprotocols || []).concat('base64.channel.k8s.io');

      let previous;
      this.ws = new WSFactory(`${podname}-terminal`, {
        host: 'auto',
        reconnect: true,
        path: resourceURL(PodModel, params),
        jsonParse: false,
        subprotocols,
      })
        .onmessage((raw) => {
          const { current } = this.terminal;
          // error channel
          if (raw[0] === '3') {
            if (previous.includes(NO_SH)) {
              current.reset();
              current.onConnectionClosed(
                `This container doesn't have a /bin/sh shell. Try specifying your command in a terminal with:\r\n\r\n ${usedClient} -n ${metadata.namespace} exec ${metadata.name} -ti <command>`,
              );
              this.ws.destroy();
              previous = '';
              return;
            }
          }
          const data = Base64.decode(raw.slice(1));
          current && current.onDataReceived(data);
          previous = data;
        })
        .onopen(() => {
          const { current } = this.terminal;
          current && current.reset();
          previous = '';
          this.setState({ open: true, error: null });
        })
        .onclose((evt) => {
          if (!evt || evt.wasClean === true) {
            return;
          }
          const error = evt.reason || 'The terminal connection has closed.';
          this.setState({ error });
          this.terminal.current && this.terminal.current.onConnectionClosed(error);
          this.ws.destroy();
        }) // eslint-disable-next-line no-console
        .onerror((evt) => console.error(`WS error?! ${evt}`));
    }

    componentDidMount() {
      this.connect_();
    }

    componentWillUnmount() {
      this.ws && this.ws.destroy();
      delete this.ws;
    }

    static getDerivedStateFromProps(nextProps, prevState) {
      const containers = _.get(nextProps.obj, 'spec.containers', []).map((n) => n.name);
      if (_.isEqual(containers, prevState.containers)) {
        return null;
      }
      return { containers };
    }

    onChangeContainer_(index) {
      const name = this.state.containers[index];

      if (!name) {
        // eslint-disable-next-line no-console
        console.warn(`no name, how did that happen? ${index}`);
        return;
      }
      if (name === this.state.activeContainer) {
        return;
      }
      this.setState({ activeContainer: name }, () => {
        this.connect_();
        this.terminal.current && this.terminal.current.focus();
      });
    }

    setFullscreen(fullscreen) {
      this.terminal.current.setFullscreen(fullscreen);
    }

    onData_(data) {
      this.ws && this.ws.send(`0${Base64.encode(data)}`);
    }

    render() {
      const { open, error } = this.state;
      const { message } = this.props;
      if (error) {
        return <div className="text-center cos-error-title">{error}</div>;
      }
      if (open) {
        return (
          <Measure
            bounds
            onResize={(contentRect) => {
              this.setState(contentRect.bounds);
              console.log('resized cloudexec');
            }}
          >
            {({ measureRef = this.props.ref }) => (
              <div style={{ width: '100%', height: '100%' }} ref={measureRef}>
                {message}
                <Terminal
                  measureRef={measureRef}
                  style={this.state.dimensions}
                  onData={this.onData}
                  ref={this.terminal}
                />
              </div>
            )}
          </Measure>
        );
      }
      return <LoadingBox message="Connecting to OpenShift Terminal" />;
    }
  },
);
