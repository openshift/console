import * as React from 'react';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { Button, Divider } from '@patternfly/react-core';

import { FLAGS, useCopyLoginCommands } from '@console/shared';
import PrimaryHeading from '@console/shared/src/components/heading/PrimaryHeading';
import SecondaryHeading from '@console/shared/src/components/heading/SecondaryHeading';
import { ExternalLink, Firehose, FirehoseResult } from './utils';
import { connectToFlags } from '../reducers/connectToFlags';
import { ConsoleCLIDownloadModel } from '../models';
import { referenceForModel } from '../module/k8s';
import { SyncMarkdownView } from './markdown-view';
import { useCopyCodeModal } from '@console/shared/src/hooks/useCopyCodeModal';

export const CommandLineTools: React.FC<CommandLineToolsProps> = ({ obj }) => {
  const { t } = useTranslation();
  const [requestTokenURL, externalLoginCommand] = useCopyLoginCommands();
  const launchCopyLoginCommandModal = useCopyCodeModal(
    t('public~Login with this command'),
    externalLoginCommand,
  );
  const showCopyLoginCommand = requestTokenURL || externalLoginCommand;
  const data = _.sortBy(_.get(obj, 'data'), 'spec.displayName');
  const cliData = _.remove(data, (item) => item.metadata.name === 'oc-cli-downloads');

  const additionalCommandLineTools = _.map(cliData.concat(data), (tool) => {
    const displayName = tool.spec.displayName;
    const defaultLinkText = t('Download {{displayName}}', { displayName });
    const sortedLinks = _.sortBy(tool.spec.links, 'text');
    return (
      <React.Fragment key={tool.metadata.uid}>
        <Divider className="co-divider" />
        <SecondaryHeading data-test-id={displayName}>{displayName}</SecondaryHeading>
        <SyncMarkdownView content={tool.spec.description} exactHeight />
        {sortedLinks.length === 1 && (
          <p>
            <ExternalLink
              href={sortedLinks[0].href}
              text={sortedLinks[0].text || defaultLinkText}
            />
          </p>
        )}
        {sortedLinks.length > 1 && (
          <ul>
            {_.map(sortedLinks, (link, i) => (
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
      <DocumentTitle>{t('public~Command Line Tools')}</DocumentTitle>
      <div className="co-m-pane__body">
        <PrimaryHeading>
          <div className="co-m-pane__name">{t('public~Command Line Tools')}</div>
        </PrimaryHeading>
        {showCopyLoginCommand && (
          <>
            <Divider className="co-divider" />
            {requestTokenURL ? (
              <ExternalLink href={requestTokenURL} text={t('public~Copy login command')} />
            ) : (
              <Button variant="link" onClick={launchCopyLoginCommandModal}>
                {t('public~Copy login command')}
              </Button>
            )}
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
