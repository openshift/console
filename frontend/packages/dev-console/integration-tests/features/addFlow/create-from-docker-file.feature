@add-flow @dev-console
Feature: Create Application from Docker file
              As a user, I want to create the application, component or service from Add Flow Docker file

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-addflow-docker"
              And user is at Add page


        @regression
        Scenario: Dockerfile details after entering git repo url: A-05-TC01
            Given user is on Import from Git form
             When user enters Git Repo URL as "https://github.com/rohitkrai03/flask-dockerfile-example"
             Then git url "https://github.com/rohitkrai03/flask-dockerfile-example" gets Validated
              And application name displays as "flask-dockerfile-example-app"
              And name field auto populates with value "flask-dockerfile-example" in Import from Git form


        # @smoke
        # Marking this scenario as @manual, because due to git-rate limit issue, below scenarios are failing
        # TODO: Use Cypress HTTP mocking to solve the github rate limiting issue. See - https://docs.cypress.io/guides/guides/network-requests
        @regression @manual
        Scenario Outline: Create a workload from Docker file with "<resource_type>" as resource type: A-05-TC02
            Given user is on Import from Git form
             When user enters Git Repo URL as "https://github.com/rohitkrai03/flask-dockerfile-example"
              And user enters Name as "<name>" in Docker file page
              And user selects "<resource_type>" in Resource type section
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user is able to see workload "<name>" in topology page
              And user will see sidebar in topology page with title "<name>"

        Examples:
                  | resource_type     | name         |
                  | Deployment        | dockerfile   |
                  | Deployment Config | dockerfile-1 |


        @regression
        Scenario: Performing cancel operation on Dockerfile form should redirected the user to Add page: A-05-TC03
            Given user is on Import from Git form
             When user enters Git Repo URL as "https://github.com/rohitkrai03/flask-dockerfile-example"
              And user selects "Deployment" in Resource type section
              And user clicks Cancel button on Add page
             Then user will be redirected to Add page


        @regression @odc-7614
        Scenario: Create workload from Dockerfile and verify the Exposed Port in the Target Port section: A-05-TC04
            Given user is on Import from Git form
             When user enters Git Repo URL as "https://github.com/rohitkrai03/flask-dockerfile-example"
              And user enters Name as "dockerfile-5000" in Docker file page
              And user selects "Deployment" in Resource type section
              And user selects "5000" in Target Port section
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user is able to see workload "dockerfile-5000" in topology page
