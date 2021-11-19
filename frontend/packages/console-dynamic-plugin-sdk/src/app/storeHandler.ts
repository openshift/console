import { Store } from 'redux';

let store: Store;

const storeHandler = {
  setStore: (storeData: Store) => {
    store = storeData;
  },
  getStore: (): Store => store,
};

export default storeHandler;
