import flags from './reducers/flags';

export type RootState = {
  FLAGS: ReturnType<typeof flags>;
  plugins?: {
    [namespace: string]: any;
  };
};
