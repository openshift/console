import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableProps } from '@console/internal/components/factory';
import ChannelHeaders from './ChannelHeaders';
import ChannelRow from './ChannelRow';

const ChannelList: React.FC<TableProps> = (props) => {
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
