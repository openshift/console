Feature: Add in context from the Developer Catalog
    As a user, I want to add things in the context in topology


    Background:
        Given user is at developer perspective
        And user has installed OpenShift Serverless Operator
        And user has selected namespace "aut-topology-in-context-add"
        And user has created "knative-demo" workload
        And user has created application grouping "aut-knative-demos"
        And user is at topology page
        

    @regression
    Scenario: Add to Project in Context options
        When user right clicks on graph
        And user clicks on Add to Project
        Then user can see in context options Samples, From Git, Container Image, From Dockerfile, From Catalog, Database, Operator Backed, Helm Chart, Event Source, Channel


    @regression
    Scenario: Add to Application in Context
        When user right clicks on Application Grouping "aut-knative-demos"
        And user clicks on Add to Application
        Then user can see in context options From Git, Container Image, From Dockerfile, Event Source, Channel


    @regression
    Scenario: Delete Application from the Context options
        When user right clicks on Application Grouping "aut-knative-demos"
        And user clicks on Delete Application
        Then user won't be able to see the "aut-knative-demos" Application Groupings
