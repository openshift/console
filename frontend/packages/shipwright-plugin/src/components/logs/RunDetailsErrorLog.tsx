import type { FC } from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { CombinedErrorDetails } from './log-snippet-types';
import LogSnippetBlock from './LogSnippetBlock';

type RunDetailErrorLogProps = {
  logDetails: CombinedErrorDetails;
  namespace: string;
};

const RunDetailsErrorLog: FC<RunDetailErrorLogProps> = ({ logDetails, namespace }) => {
  const { t } = useTranslation();
  if (!logDetails) {
    return null;
  }

  return (
    <DescriptionList>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('shipwright-plugin~Message')}</DescriptionListTerm>
        <DescriptionListDescription>{logDetails.title}</DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('shipwright-plugin~Log snippet')}</DescriptionListTerm>
        <DescriptionListDescription>
          <LogSnippetBlock logDetails={logDetails} namespace={namespace}>
            {(logSnippet: string) => <pre className="co-pre">{logSnippet}</pre>}
          </LogSnippetBlock>
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};

export default RunDetailsErrorLog;
