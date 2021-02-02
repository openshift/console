@add-flow
Feature: Create Application from git form
    As a user, I want to deploy an application from git repo with devfile


    Background:
        Given user is at developer perspective
        And user has created or selected namespace "aut-addflow-devfile"



    @regression
    Scenario: Deploy new application from git repo with devfile from topology page
        Given user has created workload "nodejs-ex-git" with resource type "Deployment"
        And user is at the Topology page
        When user right clicks on topology empty graph
        And user selects "From Devfile" option from Add to Project context menu 
        And user enters Git Repo url as "https://github.com/maysunfaisal/node-bulletin-board"
        And user enters Name as "node-bulletin-board"
        And user clicks Create button on Add page
        Then user will be redirected to Topology page
        And user is able to see workload "node-bulletin-board" in topology page


    @smoke
    Scenario: Deploy new application from git repo with devfile from Add page
        Given user is at Add page
        And user is at Import from Devfile page
        When user enters Git Repo url as "https://github.com/maysunfaisal/node-bulletin-board"
        And user enters Name as "node-bulletin-board"
        And user clicks Create button on Add page
        Then user will be redirected to Topology page
        And user is able to see workload "node-bulletin-board" in topology page
