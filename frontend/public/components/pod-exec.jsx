import * as React from 'react';
import * as _ from 'lodash-es';
import { ExpandIcon } from '@patternfly/react-icons';
import { Button } from '@patternfly/react-core';

import store from '../redux';
import { LoadingBox, LoadingInline, Dropdown, ResourceIcon } from './utils';
import { connectToFlags } from '../reducers/features';
import { FLAGS } from '@console/shared';
import { Terminal } from './terminal';
import { WSFactory } from '../module/ws-factory';
import { resourceURL } from '../module/k8s';
import { PodModel } from '../models';

const nameWithIcon = (name) => (
  <span>
    <span className="co-icon-space-r">
      <ResourceIcon kind="Container" />
    </span>
    {name}
  </span>
);

// pod exec WS protocol is FD prefixed, base64 encoded data (sometimes json stringified)

// Channel 0 is STDIN, 1 is STDOUT, 2 is STDERR (if TTY is not requested), and 3 is a special error channel - 4 is C&C
// The server only reads from STDIN, writes to the other three.
// see also: https://github.com/kubernetes/kubernetes/pull/13885

const NO_SH =
  'starting container process caused "exec: \\"sh\\": executable file not found in $PATH"';

export const PodExec = connectToFlags(FLAGS.OPENSHIFT)(
  class PodExec extends React.PureComponent {
    constructor(props) {
      super(props);
      this.state = {
        open: false,
        containers: [],
        activeContainer: _.get(props, 'obj.spec.containers[0].name'),
      };
      this.terminal = React.createRef();
      this.onResize = (rows, cols) => this.onResize_(rows, cols);
      this.onData = (d) => this.onData_(d);
      this.onChangeContainer = (index) => this.onChangeContainer_(index);
    }

    connect_() {
      const { metadata } = this.props.obj;
      const { activeContainer } = this.state;
      const usedClient = this.props.flags[FLAGS.OPENSHIFT] ? 'oc' : 'kubectl';

      const params = {
        ns: metadata.namespace,
        name: metadata.name,
        path: 'exec',
        queryParams: {
          stdout: 1,
          stdin: 1,
          stderr: 1,
          tty: 1,
          container: activeContainer,
          command: ['sh', '-i', '-c', 'TERM=xterm sh']
            .map((c) => encodeURIComponent(c))
            .join('&command='),
        },
      };

      if (this.ws) {
        this.ws.destroy();
        const { current } = this.terminal;
        current && current.onConnectionClosed(`connecting to ${activeContainer}`);
      }

      const impersonate = store.getState().UI.get('impersonate', {});
      const subprotocols = (impersonate.subprotocols || []).concat('base64.channel.k8s.io');

      let previous;
      this.ws = new WSFactory(`${metadata.name}-terminal`, {
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
          const data = atob(raw.slice(1));
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

    onResize_(rows, cols) {
      const data = btoa(JSON.stringify({ Height: rows, Width: cols }));
      this.ws && this.ws.send(`4${data}`);
    }

    setFullscreen(fullscreen) {
      this.terminal.current.setFullscreen(fullscreen);
    }

    onData_(data) {
      this.ws && this.ws.send(`0${btoa(data)}`);
    }

    render() {
      const { containers, activeContainer, open, error } = this.state;
      const { message } = this.props;

      let contents = <LoadingBox />;
      if (error) {
        contents = <div className="text-center cos-error-title">{error}</div>;
      } else if (open) {
        contents = <Terminal onResize={this.onResize} onData={this.onData} ref={this.terminal} />;
      }

      return (
        <div>
          <div className="co-toolbar">
            <div className="co-toolbar__group co-toolbar__group--left">
              <div className="co-toolbar__item">Connecting to</div>
              <div className="co-toolbar__item">
                <Dropdown
                  className="btn-group"
                  items={_.mapValues(containers, nameWithIcon)}
                  title={nameWithIcon(activeContainer || <LoadingInline />)}
                  onChange={this.onChangeContainer}
                />
              </div>
            </div>
            {!error && (
              <div className="co-toolbar__group co-toolbar__group--right">
                <div className="co-toolbar__item">
                  <Button
                    variant="link"
                    className="pf-m-link--align-right"
                    onClick={() => this.setFullscreen(true)}
                  >
                    <ExpandIcon className="co-icon-space-r" />
                    Expand
                  </Button>
                </div>
              </div>
            )}
          </div>
          {message}
          {contents}
        </div>
      );
    }
  },
);
