import { createContext, useState, useEffect } from 'react';
import { fetchBindableServices } from './fetch-bindable-services-utils';
import type { BindableServiceGVK } from './types';

export type ServiceBindingContextType = {
  bindableServices: BindableServiceGVK[];
  loaded: boolean;
};

export const ServiceBindingContext = createContext<ServiceBindingContextType>({
  bindableServices: [],
  loaded: false,
});

export const ServiceBindingContextProvider = ServiceBindingContext.Provider;

export const useValuesServiceBindingContext = (): ServiceBindingContextType => {
  const [bindableServices, setBindableServices] = useState([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
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
