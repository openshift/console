export default `
  scalar JSON

  type SelfSubjectAccessReviewStatus {
    allowed: Boolean
  }

  type SelfSubjectAccessReview {
    status: SelfSubjectAccessReviewStatus
  }

  type Query {
    urlFetch(url: String): JSON
    selfSubjectAccessReview(group: String, resource: String, verb: String, namespace: String): SelfSubjectAccessReview
  }
`;
