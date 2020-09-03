Feature: Create Application from Docker file
    As a user, I want to create the application, component or service from Add Flow Docker file

Background:
    Given user is at developer perspecitve
    And user has selected namespace "aut-addflow-docker"
    And user is at Add page


@regression
Scenario Outline: Dockerfile details after entering git repo url: A-06-TC01
   Given user is on Import from Docker file page
   When user enters Git Repo url as "<docker_git_url>"
   Then git url gets Validated
   And application name displays as "<app_name>"
   And name displays as "<name>" in Import from Docker file page

Examples:
| docker_git_url                           | app_name           | name           |
| https://github.com/sclorg/dancer-ex.git  | dancer-ex-git-app  | dancer-ex-git  |
| https://github.com/sclorg/cakephp-ex.git | cakephp-ex-git-app | cakephp-ex-git |


@regression, @smoke
Scenario Outline: Create a workload from Docker file with "<resource_type>" as resource type : A-06-TC03, A-06-TC04
   Given user is on Import from Docker file page
   When user enters docker git url as "<docker_git_url>"
   And user selects "<resource_type>" radio button in Resoruce type section
   And user clicks Create button on Add page   
   Then user will be redirected to Topology page
   And user is able to see workload "<name>" in topology page

Examples:
| docker_git_url                          | resource_type     | name          |
| https://github.com/sclorg/nodejs-ex.git | Deployment        | nodejs-ex-git |
| https://github.com/sclorg/nginx-ex.git  | Deployment Config | nginx-ex-git  |


@regression
Scenario: Perform cancel operation on Dockerfile form should will be redirected the user to Add page : A-06-TC02
   Given user is on Import from Docker file page
   When user enters docker git url as "https://github.com/sclorg/nodejs-ex.git"
   And user selects "Deployment" radio button in Resoruce type section
   And user clicks Cancel button on Add page   
   Then user will be redirected to Add page
