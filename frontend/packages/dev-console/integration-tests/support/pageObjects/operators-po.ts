export const operatorsPO = {
  nav: {
    operatorHub: 'a[href="/operatorhub"]',
    installOperators: 'a[href$="/operators.coreos.com~v1alpha1~ClusterServiceVersion"]',
    link: 'li.pf-c-nav__item.pf-m-expandable',
    menuItems: '#page-sidebar ul li',
  },
  operatorHub: {
    search: 'input[placeholder="Filter by keyword..."]',
    numOfItems: 'div.co-catalog-page__num-items',
  },
  subscription: {
    logo: 'h1.co-clusterserviceversion-logo__name__clusterserviceversion',
  },
  installOperators: {
    title: 'h1.co-m-pane__heading',
    operatorsNameRow: 'div[aria-label="Installed Operators"] td:nth-child(1) h1',
    search: 'input[data-test-id="item-filter"]',
    noOperatorFoundMessage: 'div.cos-status-box__title',
  },
  sidePane: {
    install: '[data-test-id="operator-install-btn"]',
    uninstall: '[data-test-id="operator-uninstall-btn"]',
  },
  alertDialog: '[role="dialog"]',
  uninstallPopup: {
    uninstall: '#confirm-action',
  },
};
