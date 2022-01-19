import * as React from 'react';
import { fetchBindableServices } from './fetch-bindable-services-utils';
import { BindableServiceGVK } from './types';

export type ServiceBindingContextType = {
  bindableServices: BindableServiceGVK[];
  loaded: boolean;
};

export const ServiceBindingContext = React.createContext<ServiceBindingContextType>({
  bindableServices: [],
  loaded: false,
});

export const ServiceBindingContextProvider = ServiceBindingContext.Provider;

export const useValuesServiceBindingContext = (): ServiceBindingContextType => {
  const [bindableServices, setBindableServices] = React.useState([]);
  const [loaded, setLoaded] = React.useState(false);
  React.useEffect(() => {
    fetchBindableServices()
      .then((resp) => {
        setBindableServices(resp);
        setLoaded(true);
      })
      .catch(() => {
        setBindableServices([]);
        setLoaded(true);
      });
  }, []);

  return { bindableServices, loaded };
};
