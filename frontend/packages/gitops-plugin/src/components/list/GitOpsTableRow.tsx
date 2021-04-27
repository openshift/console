import * as React from 'react';
import i18n from '@console/internal/i18n';
import * as classNames from 'classnames';
import { GitOpsAppGroupData } from '../utils/gitops-types';
import { RowFunction, TableData, TableRow } from '@console/internal/components/factory';
import { Button } from '@patternfly/react-core';
import { history, ExternalLink } from '@console/internal/components/utils';
import { routeDecoratorIcon } from '@console/dev-console/src/components/import/render-utils';

const tableColumnClasses = [
  classNames('pf-m-width-20'), // Application name
  classNames('pf-m-width-40'), // Git repository
  classNames('pf-m-hidden', 'pf-m-visible-on-md', 'pf-m-width-20'), // Environments
  classNames('pf-m-hidden', 'pf-m-visible-on-lg', 'pf-m-width-20'), // Last deployment
];

const handleClick = (appGroup) => {
  history.push(`/environments/${appGroup.name}?url=${appGroup.repo_url}`);
};

const GitOpsTableRow: RowFunction<GitOpsAppGroupData> = (props) => {
  const { obj: appGroup, index, key, style } = props;
  const t = (tKey) => i18n.t(tKey);
  return (
    <TableRow id={index} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <Button
          onClick={() => handleClick(appGroup)}
          aria-label={appGroup.name}
          variant="link"
          style={{ padding: '0px' }}
        >
          {appGroup.name}
        </Button>
      </TableData>
      <TableData className={classNames(tableColumnClasses[1])}>
        <ExternalLink href={appGroup.repo_url} additionalClassName={'co-break-all'}>
          <span style={{ marginRight: 'var(--pf-global--spacer--xs)' }}>
            {routeDecoratorIcon(appGroup.repo_url, 12, t)}
          </span>
          <span style={{ marginRight: 'var(--pf-global--spacer--xs)' }}>{appGroup.repo_url}</span>
        </ExternalLink>
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <span>{appGroup.environments.join(', ')}</span>
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        {/* this is just a placeholder until backend changes can go in to get this data */}
        <span>-</span>
      </TableData>
    </TableRow>
  );
};

export default GitOpsTableRow;
