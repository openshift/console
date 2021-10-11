import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { LoadingInline } from '@console/internal/components/utils';
import VMEditWithPencil from './VMEditWithPencil';

const VMDetailsItem: React.FC<VMDetailsItemProps> = ({
  title,
  canEdit = false,
  dataTest,
  editButtonId,
  editClassName,
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
        <span className={editClassName} data-test={dataTest}>
          {title}
          <VMEditWithPencil ButtonID={editButtonId} isEdit={canEdit} onEditClick={onEditClick} />
          {arePendingChanges && (
            <Button
              className="kv-vm-resource--link-pending-changes"
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
  dataTest?: string;
  editButtonId?: string;
  editClassName?: string;
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
