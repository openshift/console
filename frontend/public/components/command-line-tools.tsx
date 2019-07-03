import * as React from 'react';
import { Helmet } from 'react-helmet';
import * as _ from 'lodash-es';

import { OC_DOWNLOAD_LINK, ODO_DOWNLOAD_LINK, FLAGS } from '../const';
import { ExternalLink, Firehose, FirehoseResult } from './utils';
import { connectToFlags } from '../reducers/features';
import { ConsoleCLIDownloadModel } from '../models';
import { referenceForModel } from '../module/k8s';
import { MarkdownView } from './operator-lifecycle-manager/clusterserviceversion';

const CommandLineTools: React.FC<CommandLineToolsProps> = ({obj}) => {
  const title = 'Command Line Tools';
  const additionalCommandLineTools = _.map(_.sortBy(_.get(obj, 'data'), 'spec.displayName'), (tool) => {
    const displayName = tool.spec.displayName;
    const defaultLinkText = `Download ${displayName}`;
    return <React.Fragment key={tool.metadata.uid}>
      <hr />
      <h2 className="co-section-heading" data-test-id={displayName}>{displayName}</h2>
      <MarkdownView content={tool.spec.description} exactHeight />
      {tool.spec.links.length === 1 && <p><ExternalLink href={tool.spec.links[0].href} text={tool.spec.links[0].text || defaultLinkText} /></p>}
      {tool.spec.links.length > 1 && <ul>
        {_.map(tool.spec.links, (link, i) => <li key={i}><ExternalLink href={link.href} text={link.text || defaultLinkText} /></li>)}
      </ul>}
    </React.Fragment>;
  });

  return <React.Fragment>
    <Helmet>
      <title>{title}</title>
    </Helmet>
    <div className="co-m-pane__body">
      <h1 className="co-m-pane__heading">
        <div className="co-m-pane__name">
          {title}
        </div>
      </h1>
      <h2 className="co-section-heading">oc - OpenShift Command Line Interface (CLI)</h2>
      <p>With the OpenShift command line interface, you can create applications and manage OpenShift projects from a terminal.</p>
      <p>The oc binary offers the same capabilities as the kubectl binary, but it is further extended to natively support OpenShift Container Platform features.</p>
      <p>
        <ExternalLink href={OC_DOWNLOAD_LINK} text="Download oc" />
        {(window as any).SERVER_FLAGS.requestTokenURL && (
          <React.Fragment>
            &nbsp;<span className="co-action-divider" aria-hidden="true">|</span>
            &nbsp;<ExternalLink href={(window as any).SERVER_FLAGS.requestTokenURL} text="Copy Login Command" />
          </React.Fragment>
        )}
      </p>
      <hr />
      <h2 className="co-section-heading">odo - Developer-focused CLI for OpenShift</h2>
      <p><span className="label label-warning">Tech Preview</span></p>
      <p>OpenShift Do (odo) is a fast, iterative, and straightforward CLI tool for developers who write, build, and deploy applications on OpenShift.</p>
      <p>odo abstracts away complex Kubernetes and OpenShift concepts, thus allowing developers to focus on what is most important to them: code.</p>
      <p><ExternalLink href={ODO_DOWNLOAD_LINK} text="Download odo" /></p>
      {additionalCommandLineTools}
    </div>
  </React.Fragment>;
};

export const CommandLineToolsPage = connectToFlags(FLAGS.CONSOLE_CLI_DOWNLOAD)(({ flags, ...props }) => {
  const resources = flags[FLAGS.CONSOLE_CLI_DOWNLOAD]
    ? [{
      kind: referenceForModel(ConsoleCLIDownloadModel),
      isList: true,
      prop: 'obj',
    }]
    : [];

  return <Firehose resources={resources}>
    <CommandLineTools {...props as any} />
  </Firehose>;
});

type CommandLineToolsProps = {
  obj: FirehoseResult;
};
