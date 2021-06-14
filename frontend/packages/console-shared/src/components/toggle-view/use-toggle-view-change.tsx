import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { ToggleValue } from './types';

const useToggleViewhChange = () => {
  const { t } = useTranslation();
  const [toggleValue, setToggleValue] = React.useState<ToggleValue>(ToggleValue.LEFT_OPTION);
  const [toggleView, setToggleView] = React.useState<boolean>(true);
  const changeToggleValue = (newValue: ToggleValue): void => {
    setToggleValue(newValue);
  };
  const onChangeToggleValue = (newValue: ToggleValue) => {
    switch (newValue) {
      case ToggleValue.LEFT_OPTION:
        changeToggleValue(ToggleValue.LEFT_OPTION);
        setToggleView(true);
        break;
      case ToggleValue.RIGHT_OPTION:
        changeToggleValue(ToggleValue.RIGHT_OPTION);
        setToggleView(false);
        break;
      default:
        throw new Error(t('console-shared~Invalid value {{value}}', { value: newValue }));
    }
  };
  return { toggleValue, toggleView, onChangeToggleValue };
};

export default useToggleViewhChange;
