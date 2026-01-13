import type { FC, ReactNode, MouseEvent } from 'react';
import * as _ from 'lodash';
import { css } from '@patternfly/react-styles';
import { PencilAltIcon } from '@patternfly/react-icons/dist/esm/icons/pencil-alt-icon';
import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTermHelpText,
  DescriptionListTermHelpTextButton,
  Popover,
  Split,
  SplitItem,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

import { getPropertyDescription, K8sResourceKind, referenceFor } from '../../module/k8s';
import { LinkifyExternal } from './link';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';

export const PropertyPath: FC<{ kind: string; path: string | string[] }> = ({ kind, path }) => {
  const pathArray: string[] = _.toPath(path);
  return (
    <Breadcrumb>
      <BreadcrumbItem>{kind}</BreadcrumbItem>
      {pathArray.map((property, i) => {
        const isLast = i === pathArray.length - 1;
        return (
          <BreadcrumbItem key={i} isActive={isLast}>
            {property}
          </BreadcrumbItem>
        );
      })}
    </Breadcrumb>
  );
};

const EditButton: React.FCC<EditButtonProps> = (props) => {
  return (
    <Button
      icon={<PencilAltIcon />}
      iconPosition="end"
      type="button"
      variant="link"
      isInline
      onClick={props.onClick}
      data-test={
        props.testId ? `${props.testId}-details-item__edit-button` : 'details-item__edit-button'
      }
    >
      {props.children}
    </Button>
  );
};

/**
 * A wrapper around PatternFly's `DescriptionListGroup`. This component
 * must be used inside a `DescriptionList`!
 */
export const DetailsItem: FC<DetailsItemProps> = ({
  children,
  defaultValue = '-',
  description,
  editAsGroup,
  hideEmpty,
  label,
  labelClassName,
  obj,
  onEdit,
  canEdit = true,
  path,
  valueClassName,
}) => {
  const { t } = useTranslation();
  const [model] = useK8sModel(obj ? referenceFor(obj) : '');
  const hide = hideEmpty && _.isEmpty(_.get(obj, path));
  const popoverContent: string = description ?? getPropertyDescription(model, path);
  const value: ReactNode = children || _.get(obj, path, defaultValue);
  const editable = onEdit && canEdit;
  return hide ? null : (
    <DescriptionListGroup>
      <DescriptionListTermHelpText
        data-test-selector={`details-item-label__${label}`}
        className={labelClassName}
      >
        <Split className="pf-v6-u-w-100">
          <SplitItem isFilled>
            {popoverContent || path ? (
              <Popover
                headerContent={label}
                {...(popoverContent && {
                  bodyContent: (
                    <LinkifyExternal>
                      <div className="co-pre-line">{popoverContent}</div>
                    </LinkifyExternal>
                  ),
                })}
                {...(path && { footerContent: <PropertyPath kind={model?.kind} path={path} /> })}
                maxWidth="30rem"
              >
                <DescriptionListTermHelpTextButton data-test={label}>
                  {label}
                </DescriptionListTermHelpTextButton>
              </Popover>
            ) : (
              label
            )}
          </SplitItem>

          {editable && editAsGroup && (
            <SplitItem>
              <EditButton testId={label} onClick={onEdit}>
                {t('public~Edit')}
              </EditButton>
            </SplitItem>
          )}
        </Split>
      </DescriptionListTermHelpText>
      <DescriptionListDescription
        className={css(valueClassName, {
          'co-editable-label-group': editable && editAsGroup,
        })}
        data-test-selector={`details-item-value__${label}`}
      >
        {editable && !editAsGroup ? (
          <EditButton testId={label} onClick={onEdit}>
            {value}
          </EditButton>
        ) : (
          value
        )}
      </DescriptionListDescription>
    </DescriptionListGroup>
  );
};

export type DetailsItemProps = {
  canEdit?: boolean;
  children?: ReactNode;
  defaultValue?: ReactNode;
  description?: string;
  editAsGroup?: boolean;
  hideEmpty?: boolean;
  label: string;
  labelClassName?: string;
  obj?: K8sResourceKind;
  onEdit?: (e: MouseEvent<HTMLButtonElement>) => void;
  path?: string | string[];
  valueClassName?: string;
};

type EditButtonProps = {
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  testId?: string;
  children?: ReactNode;
};

DetailsItem.displayName = 'DetailsItem';
PropertyPath.displayName = 'PropertyPath';
EditButton.displayName = 'EditButton';
