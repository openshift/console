@topology
Feature: Add in context from the Developer Catalog
              As a user, I want to add things in the context in topology


        Background:
            Given user has installed OpenShift Serverless Operator
              And user is at developer perspective
              And user has created or selected namespace "aut-topology-in-context-add"
              And user has created "knative-demo" workload in "aut-knative-demos" application
              And user is at Topology page


        @smoke
        Scenario: Add to Project in Context options: T-10-TC01
             When user right clicks on empty graph view
              And user hovers on Add to Project
             Then user can see in context options "Samples", "Import from Git", "Container Image", "From Catalog", "Database", "Operator Backed", "Helm Charts", "Event Source", "Channel"


        @regression
        Scenario: Add to Application in Context: T-10-TC02
             When user right clicks on Application Grouping "aut-knative-demos"
              And user hovers on Add to application
             Then user can see in context options "Import from Git", "Container Image", "Event Source", "Channel"


        @regression
        Scenario: Delete application from the Context options: T-10-TC03
             When user right clicks on Application Grouping "aut-knative-demos"
              And user clicks on Delete application
              And user enters the name "aut-knative-demos" in the Delete application modal and clicks on Delete button
             Then user won't be able to see the "aut-knative-demos" Application Groupings
