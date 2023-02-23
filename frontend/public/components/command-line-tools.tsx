import * as React from 'react';
import { Helmet } from 'react-helmet';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { Divider } from '@patternfly/react-core';

import { FLAGS } from '@console/shared';
import { ExternalLink, Firehose, FirehoseResult } from './utils';
import { connectToFlags } from '../reducers/connectToFlags';
import { ConsoleCLIDownloadModel } from '../models';
import { referenceForModel } from '../module/k8s';
import { SyncMarkdownView } from './markdown-view';
import { useRequestTokenURL } from '@console/shared/src/hooks/useRequestTokenURL';

export const CommandLineTools: React.FC<CommandLineToolsProps> = ({ obj }) => {
  const { t } = useTranslation();
  const [requestTokenURL] = useRequestTokenURL();
  const title = 'Command Line Tools';
  const data = _.sortBy(_.get(obj, 'data'), 'spec.displayName');
  const cliData = _.remove(data, (item) => item.metadata.name === 'oc-cli-downloads');

  const additionalCommandLineTools = _.map(cliData.concat(data), (tool) => {
    const displayName = tool.spec.displayName;
    const defaultLinkText = `Download ${displayName}`;
    return (
      <React.Fragment key={tool.metadata.uid}>
        <Divider className="co-divider" />
        <h2 className="co-section-heading" data-test-id={displayName}>
          {displayName}
        </h2>
        <SyncMarkdownView content={tool.spec.description} exactHeight />
        {tool.spec.links.length === 1 && (
          <p>
            <ExternalLink
              href={tool.spec.links[0].href}
              text={tool.spec.links[0].text || defaultLinkText}
            />
          </p>
        )}
        {tool.spec.links.length > 1 && (
          <ul>
            {_.map(tool.spec.links, (link, i) => (
              <li key={i}>
                <ExternalLink href={link.href} text={link.text || defaultLinkText} />
              </li>
            ))}
          </ul>
        )}
      </React.Fragment>
    );
  });

  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <div className="co-m-pane__body">
        <h1 className="co-m-pane__heading">
          <div className="co-m-pane__name">{title}</div>
        </h1>
        {requestTokenURL && (
          <>
            <Divider className="co-divider" />
            <ExternalLink href={requestTokenURL} text={t('public~Copy login command')} />
          </>
        )}
        {additionalCommandLineTools}
      </div>
    </>
  );
};

export const CommandLineToolsPage = connectToFlags(FLAGS.CONSOLE_CLI_DOWNLOAD)(
  ({ flags, ...props }) => {
    const resources = flags[FLAGS.CONSOLE_CLI_DOWNLOAD]
      ? [
          {
            kind: referenceForModel(ConsoleCLIDownloadModel),
            isList: true,
            prop: 'obj',
          },
        ]
      : [];

    return (
      <Firehose resources={resources}>
        <CommandLineTools {...(props as any)} />
      </Firehose>
    );
  },
);

type CommandLineToolsProps = {
  obj: FirehoseResult;
};
