import * as React from 'react';
import { Link } from 'react-router-dom';
import { Popover, Progress, ProgressVariant, ProgressSize } from '@patternfly/react-core';
import { Icon, Button } from 'patternfly-react';

const StatusField: React.FC<StatusFieldProps> = ({ children }) => <div className="kubevirt-status__field">{children}</div>;
type StatusFieldProps = {
  children: React.ReactNode
}

export const StatusDescriptionField: React.FC<StatusDescriptionFieldProps> = ({ title, children }) => (
  <StatusField>
    {title && <div className="kubevirt-status__field-header">{title}</div>}
    <div className="kubevirt-status__field-description">{children}</div>
  </StatusField>
);

type StatusDescriptionFieldProps = {
  title?: string,
  children: React.ReactNode
};

export const StatusLinkField: React.FC<StatusLinkFieldProps> = ({ title, linkTo }) => (
  <StatusField>
    <div className="kubevirt-status__field-link">
      <Link to={linkTo} title={title}>
        {title || linkTo}
      </Link>
    </div>
  </StatusField>
);

type StatusLinkFieldProps = {
  title?: string,
  linkTo: string
};

export const StatusProgressField: React.FC<StatusProgressFieldProps> = ({ title, progress, barType }) => (
  <StatusField>
    <Progress
      className="kubevirt-status__field-progress"
      value={progress}
      title={title}
      variant={barType || ProgressVariant.info}
      size={ProgressSize.sm}
    />
  </StatusField>
);

type StatusProgressFieldProps = {
  title?: string,
  barType?: ProgressVariant.info | ProgressVariant.success | ProgressVariant.danger,
  progress: number
};

export const Status: React.FC<StatusProps> = ({ icon, children, iconType }) => (
  <React.Fragment>
    {icon && <Icon type={iconType || 'pf'} name={icon} className="kubevirt-status__icon" />}
    {children}
  </React.Fragment>
);

type StatusProps = {
  icon?: string,
  iconType?: string,
  children: React.ReactNode
};

export const PopoverStatus: React.FC<PopoverStatusProps> = ({ icon, iconType, header, children }) => (
  <Popover position="right" headerContent={header} bodyContent={children}>
    <span className="kubevirt-status__popover">
      <Status icon={icon} iconType={iconType}>
        <Button className="kubevirt-status__button" bsStyle="link">
          {header}
        </Button>
      </Status>
    </span>
  </Popover>
);

type PopoverStatusProps = {
  icon?: string,
  iconType?: string,
  header: string
  children: React.ReactNode
};
