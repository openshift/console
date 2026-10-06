import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import type { ConsoleDataViewProps } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { RevisionModel } from '../../models';
import type { RevisionKind } from '../../types';
import { useRevisionColumns } from './RevisionHeader';
import { getRevisionDataViewRows } from './RevisionRow';

type RevisionListProps = Omit<
  ConsoleDataViewProps<RevisionKind>,
  'id' | 'columns' | 'getDataViewRows'
>;

export const RevisionList: FC<RevisionListProps> = (props) => {
  const { t } = useTranslation('knative-plugin');
  const { columns } = useRevisionColumns();
  return (
    <ConsoleDataView<RevisionKind>
      {...props}
      id={RevisionModel}
      label={t('Revisions')}
      data={props.data}
      loaded={props.loaded}
      columns={columns}
      getDataViewRows={getRevisionDataViewRows}
    />
  );
};
