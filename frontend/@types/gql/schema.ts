export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type Query = {
  fetchURL?: Maybe<Scalars['String']>;
  selfSubjectAccessReview?: Maybe<SelfSubjectAccessReview>;
};


export type QueryfetchURLArgs = {
  url: Scalars['String'];
};


export type QueryselfSubjectAccessReviewArgs = {
  group?: Maybe<Scalars['String']>;
  resource?: Maybe<Scalars['String']>;
  verb?: Maybe<Scalars['String']>;
  namespace?: Maybe<Scalars['String']>;
};

export type SelfSubjectAccessReview = {
  status: SelfSubjectAccessReviewStatus;
};

export type SelfSubjectAccessReviewStatus = {
  allowed: Scalars['Boolean'];
};

export type Subscription = {
  fetchURL?: Maybe<Scalars['String']>;
};


export type SubscriptionfetchURLArgs = {
  url: Scalars['String'];
};

export type SSARQueryVariables = Exact<{
  resource?: Maybe<Scalars['String']>;
  verb?: Maybe<Scalars['String']>;
  group?: Maybe<Scalars['String']>;
  namespace?: Maybe<Scalars['String']>;
}>;


export type SSARQueryType = { selfSubjectAccessReview?: Maybe<{ status: Pick<SelfSubjectAccessReviewStatus, 'allowed'> }> };

export type URLQueryVariables = Exact<{
  url: Scalars['String'];
}>;


export type URLQueryType = Pick<Query, 'fetchURL'>;
