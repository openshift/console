
declare module '*/features.gql' {
  import { DocumentNode } from 'graphql';
  const defaultDocument: DocumentNode;
  export const SSARQuery: DocumentNode;

  export default defaultDocument;
}
    

declare module '*/client.gql' {
  import { DocumentNode } from 'graphql';
  const defaultDocument: DocumentNode;
  export const URLQuery: DocumentNode;

  export default defaultDocument;
}
    