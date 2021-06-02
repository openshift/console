import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { CombinedErrorDetails } from './log-snippet-types';
import LogSnippetBlock from './LogSnippetBlock';

type RunDetailErrorLogProps = {
  logDetails: CombinedErrorDetails;
  namespace: string;
};

const RunDetailsErrorLog: React.FC<RunDetailErrorLogProps> = ({ logDetails, namespace }) => {
  const { t } = useTranslation();
  if (!logDetails) {
    return null;
  }

  return (
    <>
      <dl>
        <dt>{t('pipelines-plugin~Message')}</dt>
        <dd>{logDetails.title}</dd>
      </dl>
      <dl>
        <dt>{t('pipelines-plugin~Log snippet')}</dt>
        <dd>
          <LogSnippetBlock logDetails={logDetails} namespace={namespace}>
            {(logSnippet: string) => <pre>{logSnippet}</pre>}
          </LogSnippetBlock>
        </dd>
      </dl>
    </>
  );
};

export default RunDetailsErrorLog;
