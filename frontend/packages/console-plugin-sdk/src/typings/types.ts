export type LazyLoader<T extends {}> = () => Promise<React.ComponentType<Partial<T>>>;
