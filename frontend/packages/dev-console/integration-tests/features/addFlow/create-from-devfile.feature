Feature: Create Application from git form
    As a user, I want to deploy an application from git repo with devfile


    Background:
        Given user is at developer perspective
        And user has created namespace starts with "aut-addflow-devfile"


    @smoke
    Scenario: From Devfile card on +Add page
        Given user is at add page
        Then user will see From Devfile card on the page


    @smoke
    Scenario: Deploy new application from git repo with devfile from Add page
        Given user is at add page
        When user clicks on From Devfile card
        And user enters Git Repo url as "https://github.com/maysunfaisal/node-bulletin-board"
        And user enters Name as "node-bulletin-board"
        And user clicks on Create button
        Then user will be redirected to Topology page
        And user is able to see workload "node-bulletin-board" in topology page


    @regression
    Scenario: Deploy new application from git repo with devfile from topology page
        Given user has created workload "nodejs-ex-git" with resource type "Deployment"
        And user is at topology page
        When user right clicks on topology empty grpah
        And user clicks on Add to Project
        And user clicks on From Devfile
        And user enters Git Repo url as "https://github.com/maysunfaisal/node-bulletin-board"
        And user enters Name as "node-bulletin-board"
        And user clicks on Create button
        Then user will be redirected to Topology page
        And user is able to see workload "node-bulletin-board" in topology page
