Feature: Create Application from git form
    As a user I want to create the application, component or service from Add options

Background:
    Given user is at dev perspecitve


@regression
Scenario: Add page displays with message "No workloads found" fo newly created project : A-01-TC01
   Given user is at the new project namespace "aut-new-project-namespace"
   When user selects Add option from left side navigation menu
   Then user redirects to Add page
   And message displays as "No workloads found"


@regression, @smoke
Scenario: Display of workloads in Add Page by default : A-01-TC02
   Given user is at Add page
   And user is at the new project namespace "aut-new-project-namespace"
   When user selects Add option from left side navigation menu
   Then user redirects to Add page
   And page contains From Git, Container Image, From Dockerfile, YAML, From Catalog, Database, Helm Chart cards


@regression
Scenario:  Pipeline card display on pipeline operator installation : A-02-TC01
   Given cluster is installed with pipeline operator
   When user selects Add option from left side navigation menu
   Then user redirects to Add page
   And page contains Pipeline card


@regression
Scenario:  Operator Backed card display on serverless operator installation : A-02-TC01
   Given cluster is installed with serverless operator
   And open project namespace "knative-serving"
   When user selects Add option from left side navigation menu
   Then user redirects to Add page
   And page contains Operator Backed card


@regression, @smoke
Scenario: Event Soruces card display on serverless operator installation : A-03-TC02
   Given cluster is installed with serverless operator
   When user selects Add option from left side navigation menu
   Then user redirects to Add page
   And page contains Event Soruces card
