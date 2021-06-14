import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { LoadingInline } from '@console/internal/components/utils';
import { EditButton } from '../edit-button';

const VMDetailsItem: React.FC<VMDetailsItemProps> = ({
  title,
  canEdit = false,
  editButtonId,
  onEditClick,
  idValue,
  isLoading = false,
  isNotAvail = false,
  isNotAvailMessage,
  valueClassName,
  arePendingChanges,
  children,
}) => {
  const { t } = useTranslation();
  let body;

  if (isNotAvail) {
    body = (
      <span className="text-secondary">
        {isNotAvailMessage || t('kubevirt-plugin~Not available')}
      </span>
    );
  } else if (isLoading) {
    body = <LoadingInline />;
  } else {
    body = children;
  }

  return (
    <>
      <dt>
        <span>
          {title} <EditButton id={editButtonId} canEdit={canEdit} onClick={onEditClick} />
          {arePendingChanges && (
            <Button
              className="co-modal-btn-link--inline"
              variant="link"
              isInline
              onClick={onEditClick}
            >
              {t('kubevirt-plugin~View Pending Changes')}
            </Button>
          )}
        </span>
      </dt>
      <dd id={idValue} className={valueClassName}>
        <span data-test-id={`details-${title}`}>{body}</span>
      </dd>
    </>
  );
};

type VMDetailsItemProps = {
  title: string;
  canEdit?: boolean;
  editButtonId?: string;
  onEditClick?: () => void;
  idValue?: string;
  isLoading?: boolean;
  isNotAvail?: boolean;
  isNotAvailMessage?: string;
  valueClassName?: string;
  arePendingChanges?: boolean;
  children: React.ReactNode;
};

export { VMDetailsItem as default };
