import * as React from 'react';

import { ListViewAdditionalInfo } from './list-view-additional-info';
import { ListViewBody } from './list-view-body';
import { ListViewDescription } from './list-view-description';
import { ListViewDescriptionHeading } from './list-view-description-heading';
import { ListViewMainInfo } from './list-view-main-info';

export const ListViewRow: React.FC<ListViewRowProps> = ({ additionalInfo, heading }) => (
  <ListViewMainInfo key="main_info">
    <ListViewBody>
      {heading && (
        <ListViewDescription>
          {heading && <ListViewDescriptionHeading>{heading}</ListViewDescriptionHeading>}
        </ListViewDescription>
      )}
      {additionalInfo && <ListViewAdditionalInfo>{additionalInfo}</ListViewAdditionalInfo>}
    </ListViewBody>
  </ListViewMainInfo>
);

type ListViewRowProps = {
  additionalInfo?: React.ReactNode[];
  heading?: React.ReactNode;
};
