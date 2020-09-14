Feature: Create Application from git form
    As a user, I want to create the application, component or service from Add options

Background:
   Given user is at developer perspecitve
   And user is at Add page


@regression
Scenario: Add page displays with message "No workloads found" for newly created project : A-01-TC01
   Given user is at the new project namespace "aut-new-project-namespace-1"
   When user selects Add option from left side navigation menu
   Then user will be redirected to Add page
   And user is able to see message "No workloads found" on Add page


@regression, @smoke
Scenario: Display of cards in Add Page : A-01-TC02
   Given user is at the new project namespace "aut-new-project-namespace-2"
   When user selects Add option from left side navigation menu
   Then user will be redirected to Add page
   And page contains From Git, Container Image, From Dockerfile, YAML, From Catalog, Database, Helm Chart cards


@regression
Scenario: Pipeline card display on pipeline operator installation : A-02-TC01
   Given user has installed OpenShift Pipelines operator
   When user selects Add option from left side navigation menu
   Then user will be redirected to Add page
   And user is able to see Pipeline card on Git form


@regression
Scenario: Operator Backed card display on serverless operator installation : A-02-TC01
   Given user has installed Openshift Serverless operator
   And user is at developer perspecitve
   And user is at the new project namespace "aut-new-project-namespace-3" 
   When user selects Add option from left side navigation menu
   Then user will be redirected to Add page
   And user is able to see "Operator Backed" card on Add page


@regression, @smoke
Scenario: Event Source card display on serverless operator installation : A-03-TC02
   Given user has installed Openshift Serverless operator
   And user is at developer perspecitve
   And user is at the new project namespace "aut-new-project-namespace-4" 
   When user selects Add option from left side navigation menu
   Then user will be redirected to Add page
   And user is able to see "Event Source" card on Add page
