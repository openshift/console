import type { FC, ReactNode, MouseEvent } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTermHelpText,
  DescriptionListTermHelpTextButton,
  Popover,
  Split,
  SplitItem,
} from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { InlineEditButton } from '@console/shared/src/components/edit-button/InlineEditButton';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import type { K8sResourceKind } from '../../module/k8s';
import { getPropertyDescription, referenceFor } from '../../module/k8s';
import { LinkifyExternal } from './link';

const PropertyPath: FC<{ kind: string; path: string | string[] }> = ({ kind, path }) => {
  const pathArray: string[] = _.toPath(path);
  return (
    <Breadcrumb>
      <BreadcrumbItem>{kind}</BreadcrumbItem>
      {pathArray.map((property, i) => {
        const isLast = i === pathArray.length - 1;
        return (
          // eslint-disable-next-line react/no-array-index-key
          <BreadcrumbItem key={i} isActive={isLast}>
            {property}
          </BreadcrumbItem>
        );
      })}
    </Breadcrumb>
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
  const { t } = useTranslation('public');
  const [model] = useK8sModel(obj ? referenceFor(obj) : '');
  const hide = hideEmpty && _.isEmpty(_.get(obj, path));
  const popoverContent: string | null =
    description ?? (model ? getPropertyDescription(model, path) : null);
  const value: ReactNode = children || _.get(obj, path, defaultValue);
  const editable = onEdit && canEdit;
  const editButtonTestId = label
    ? `${label}-details-item__edit-button`
    : 'details-item__edit-button';
  return hide ? null : (
    <DescriptionListGroup>
      <DescriptionListTermHelpText
        data-test={`details-item-label__${label}`}
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
              <InlineEditButton testId={editButtonTestId} onClick={onEdit}>
                {t('Edit')}
              </InlineEditButton>
            </SplitItem>
          )}
        </Split>
      </DescriptionListTermHelpText>
      <DescriptionListDescription
        className={css(valueClassName, {
          'co-editable-label-group': editable && editAsGroup,
        })}
        data-test-selector={`details-item-value__${label}`}
        data-test={`details-item-value__${label}`}
      >
        {editable && !editAsGroup ? (
          <InlineEditButton testId={editButtonTestId} onClick={onEdit}>
            {value}
          </InlineEditButton>
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

DetailsItem.displayName = 'DetailsItem';
PropertyPath.displayName = 'PropertyPath';
