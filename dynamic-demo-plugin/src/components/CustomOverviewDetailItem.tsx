import * as React from 'react';
import { useTranslation } from "react-i18next";

export const isLoading = () =>  false;
export const getError = () => null;


/* The value of a custom component to the Details dashboard-card on the Overview page.
*  This component will be rendered as a child in the OverviewDetailItem CONSOLE component*/
const CustomOverviewDetailItem: React.FC<{}> = () => {
    const { t } = useTranslation('plugin__console-demo-plugin');
    return (t('Custom Overview Detail Info'));
}

export default CustomOverviewDetailItem;
