@add-flow
Feature: Create Application from git form
   As a user, I want to create the application, component or service from Add options

   Background:
      Given user is at developer perspective
      And user is at Add page


   @addFlow-pageDetails, @regression
   Scenario: Add page displays with message "No workloads found" for newly created project : A-01-TC01
      Given user is at namespace "aut-namespace"
      When user selects Add option from left side navigation menu
      Then user will be redirected to Add page
      And user is able to see message "No workloads found" on Add page


   @addFlow-pageDetails, @smoke
   Scenario: Display of cards in Add Page : A-01-TC02
      Given user is at namespace "aut-namespace-1"
      When user selects Add option from left side navigation menu
      Then user will be redirected to Add page
      And page contains From Git, Container Image, From Dockerfile, YAML, From Catalog, Database, Helm Chart cards


   @addFlow-pageDetails, @regression
   Scenario: Pipeline card display on pipeline operator installation : A-02-TC01
      Given user is at namespace "aut-namespace-2"
      And user has installed OpenShift Pipelines operator
      When user selects Add option from left side navigation menu
      Then user will be redirected to Add page
      And user is able to see Pipeline card on Git form


   @addFlow-pageDetails, @regression
   Scenario: Operator Backed card display on serverless operator installation : A-02-TC01
      Given user has installed OpenShift Serverless Operator
      And user is at developer perspective
      And user is at namespace "aut-namespace-3"
      When user selects Add option from left side navigation menu
      Then user will be redirected to Add page
      And user is able to see "Operator Backed" card on Add page


   @addFlow-pageDetails, @regression
   Scenario: Event Source card display on serverless operator installation : A-03-TC02
      Given user has installed OpenShift Serverless Operator
      And user is at developer perspective
      And user is at namespace "aut-namespace-4"
      When user selects Add option from left side navigation menu
      Then user will be redirected to Add page
      And user is able to see "Event Source" card on Add page
