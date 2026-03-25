import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { TableProps } from '@console/internal/components/factory';
import { Table } from '@console/internal/components/factory';
import ChannelHeaders from './ChannelHeaders';
import ChannelRow from './ChannelRow';

const ChannelList: FC<TableProps> = (props) => {
  const { t } = useTranslation();
  return (
    <Table
      {...props}
      aria-label={t('knative-plugin~Channels')}
      Header={ChannelHeaders(t)}
      Row={ChannelRow}
      virtualize
    />
  );
};
export default ChannelList;
