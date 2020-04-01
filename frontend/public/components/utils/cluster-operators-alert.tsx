import * as React from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '@patternfly/react-core';

export const NotUpgradeableAlert: React.SFC<NotUpgradeableAlertProps> = (props) => {
  const { closeModal, linkText, linkPath, linkSearch } = props;

  return (
    <div className="co-m-pane__body co-m-pane__body--section-heading">
      <Alert isInline className="co-alert" variant="info" title="Restore your cluster operators">
        <div>
          To upgrade to the next release, restore your affected operator(s). You can still upgrade
          to patch releases.{' '}
          <Link
            to={{
              pathname: linkPath,
              search: linkSearch,
            }}
            onClick={closeModal}
          >
            {linkText}
          </Link>
        </div>
      </Alert>
    </div>
  );
};

type NotUpgradeableAlertProps = {
  closeModal?: () => void;
  linkPath: string;
  linkSearch?: string;
  linkText: string;
};
