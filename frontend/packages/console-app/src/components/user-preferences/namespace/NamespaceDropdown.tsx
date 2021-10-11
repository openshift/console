import * as React from 'react';
import {
  Button,
  Skeleton,
  EmptyState,
  EmptyStateIcon,
  Title,
  EmptyStateBody,
  SelectOption,
  Select,
  SelectVariant,
  Divider,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { createProjectModal } from '@console/internal/components/modals';
import { useProjectOrNamespaceModel } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ProjectModel } from '@console/internal/models';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { usePreferredNamespace } from './usePreferredNamespace';

const NamespaceDropdown: React.FC = () => {
  // resources and calls to hooks
  const { t } = useTranslation();
  const [model, canCreate] = useProjectOrNamespaceModel() as [K8sKind, boolean];
  const isProject: boolean = model?.kind === ProjectModel.kind;
  const [allNamespaces, allNamespacesLoaded, allNamespacesLoadError] = useK8sWatchResource<
    K8sResourceKind[]
  >({
    kind: model?.kind,
    isList: true,
  });
  const [
    preferredNamespace,
    setPreferredNamespace,
    preferredNamespaceLoaded,
  ] = usePreferredNamespace();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const loaded: boolean = model && preferredNamespaceLoaded && allNamespacesLoaded;

  const lastViewedLabel: string = t('console-app~Last viewed');
  const namespaceSearchLabel = isProject
    ? t('console-app~Search project')
    : t('console-app~Search namespace');

  const noResultsFoundText: string = isProject
    ? t('console-app~No projects found')
    : t('console-app~No namespaces found');

  const selectOptions: JSX.Element[] = React.useMemo(() => {
    if (!allNamespacesLoaded) {
      return [];
    }
    const lastNamespaceOption = <SelectOption key={'lastViewed'} value={lastViewedLabel} />;
    const dividerOption = <Divider component="li" key={'divider'} />;
    const allNamespaceOptions = allNamespaces
      .sort((currNamespace, nextNamespace) => {
        const {
          metadata: { name: currNamespaceName },
        } = currNamespace;
        const {
          metadata: { name: nextNamespaceName },
        } = nextNamespace;
        if (currNamespaceName === nextNamespaceName) {
          return 0;
        }
        return currNamespaceName > nextNamespaceName ? 1 : -1;
      })
      .map(({ metadata: { name } }) => <SelectOption key={name} value={name} />);
    return [lastNamespaceOption, dividerOption, ...allNamespaceOptions];
  }, [allNamespaces, allNamespacesLoaded, lastViewedLabel]);

  const onCreateNamespace = React.useCallback(
    () =>
      createProjectModal({
        blocking: true,
        onSubmit: (newProject) => {
          setPreferredNamespace(newProject.metadata.name);
        },
      }),
    [setPreferredNamespace],
  );
  const createNamespaceButton = canCreate ? (
    <Button
      type="button"
      variant="secondary"
      isInline
      onClick={onCreateNamespace}
      data-test="footer create-namespace-button"
    >
      {isProject ? t('console-app~Create Project') : t('console-app~Create Namespace')}
    </Button>
  ) : null;

  const emptyStateLoadErrorDescription: string = isProject
    ? t('console-app~Projects failed to load. Check your connection and reload the page.')
    : t('console-app~Namespaces failed to load. Check your connection and reload the page.');
  const loadErrorState: JSX.Element = allNamespacesLoadError ? (
    <EmptyState data-test={'dropdown console.preferredNamespace error'}>
      <EmptyStateIcon icon={ExclamationCircleIcon} />
      <Title size="md" headingLevel="h4">
        {t('console-app~Unable to load')}
      </Title>
      <EmptyStateBody>{emptyStateLoadErrorDescription}</EmptyStateBody>
    </EmptyState>
  ) : null;

  // utils and callbacks
  const namespaceFilter = (_, value) => {
    if (!value) {
      return selectOptions;
    }
    const filterRegex = new RegExp(value, 'i');
    return selectOptions.filter((option) => filterRegex.test(option.props.value));
  };
  const getDropdownLabelForValue = (): string => preferredNamespace || lastViewedLabel;
  const getDropdownValueForLabel = (selectedLabel: string): string =>
    selectedLabel === lastViewedLabel ? null : selectedLabel;
  const onToggle = (isOpen: boolean) => setDropdownOpen(isOpen);
  const onSelect = (_, selection) => {
    const selectedValue = getDropdownValueForLabel(selection);
    selectedValue !== preferredNamespace && setPreferredNamespace(selectedValue);
    setDropdownOpen(false);
  };

  return loaded ? (
    <Select
      variant={SelectVariant.typeahead}
      isOpen={dropdownOpen}
      selections={getDropdownLabelForValue()}
      toggleId={'console.preferredNamespace'}
      onToggle={onToggle}
      onSelect={onSelect}
      onFilter={namespaceFilter}
      typeAheadAriaLabel={namespaceSearchLabel}
      placeholderText={namespaceSearchLabel}
      noResultsFoundText={noResultsFoundText}
      footer={createNamespaceButton}
      customContent={loadErrorState}
      data-test={'dropdown console.preferredNamespace'}
      maxHeight={300}
    >
      {selectOptions}
    </Select>
  ) : (
    <Skeleton
      height="30px"
      width="100%"
      data-test={'dropdown skeleton console.preferredNamespace'}
    />
  );
};

export default NamespaceDropdown;
