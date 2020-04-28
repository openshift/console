export default {
  Query: {
    urlFetch: (root, { url }, { dataSources }) => dataSources.k8sDS.fetchJSON(url),
    selfSubjectAccessReview: (root, { group, resource, verb, namespace }, { dataSources }) => {
      const data = {
        spec: {
          resourceAttributes: {
            group,
            resource,
            verb,
            namespace,
          },
        },
      };
      return dataSources.k8sDS.createResource(
        { apiVersion: 'v1', apiGroup: 'authorization.k8s.io', plural: 'selfsubjectaccessreviews' },
        data,
      );
    },
  },
};
