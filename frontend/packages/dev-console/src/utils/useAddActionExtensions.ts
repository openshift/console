import {
  ResolvedExtension,
  useResolvedExtensions,
  AddAction,
  isAddAction,
} from '@console/dynamic-plugin-sdk';

interface AddPage {
  disabledActions?: string[];
}

export const getDisabledAddActions = (): string[] | undefined => {
  if (window.SERVER_FLAGS.addPage) {
    const addPage: AddPage = JSON.parse(window.SERVER_FLAGS.addPage);
    const { disabledActions } = addPage;
    return disabledActions;
  }
  return undefined;
};

export const useAddActionExtensions = (): [ResolvedExtension<AddAction>[], boolean, boolean] => {
  const [allAddActionExtensions, resolved] = useResolvedExtensions<AddAction>(isAddAction);
  const disabledActions = getDisabledAddActions();
  const allAddActionsDisabled = disabledActions?.length === allAddActionExtensions?.length;

  if (allAddActionExtensions && disabledActions && disabledActions.length > 0) {
    const filteredAddActionExtensions = allAddActionExtensions.filter(
      (addActionExtension) => !disabledActions.includes(addActionExtension.properties.id),
    );
    return [filteredAddActionExtensions, resolved, allAddActionsDisabled];
  }

  return [allAddActionExtensions, resolved, allAddActionsDisabled];
};
