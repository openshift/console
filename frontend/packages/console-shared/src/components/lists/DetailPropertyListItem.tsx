import * as React from 'react';
import { ListItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

import './DetailPropertyList.scss';

type DetailPropertyListItemProps = {
  title?: string;
};

const DetailPropertyListItem: React.FC<DetailPropertyListItemProps> = ({ title, children }) => {
  const { t } = useTranslation();
  if (title === 'Hostname') {
    title = t('SINGLE:MSG_OVERVIEW_MAIN_CARDDETAILS_6');
  } else if (title === 'Internal IP') {
    title = t('SINGLE:MSG_OVERVIEW_MAIN_CARDDETAILS_7');
  }
  return (
    <ListItem>
      {title && <span className="co-detail-property-list__item-title">{title} </span>}
      {children}
    </ListItem>
  );
};
export default DetailPropertyListItem;
