@deployment @dev-console
Feature: Deployment form view
              As a user, I need the ability to create deployment in dev perspective through form view.


        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-deployment"


        @smoke
        Scenario Outline: Create deployment using form view: D-01-TC01
            Given user is at Deployments page
             When user clicks on Create Deployment
              And user enters name of deployment as "<deployment_name>"
              And user selects Strategy type as "<strategy_type>"
              And user enters image as "<image>"
              And user clicks on Create button
             Then user sees "<deployment_name>" deployment created

        Examples:
                  | deployment_name | strategy_type  | image                                                                   |
                  | test-depoyment1 | Rolling Update | image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest |
                  | test-depoyment2 | Recreate       | image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest |

       @smoke
        Scenario Outline: Create deployment using ImageStream in form view: D-01-TC02
            Given user is at Deployments page
             When user clicks on Create Deployment
              And user selects Strategy type as "<strategy_type>"
              And user selects ImageStream with id "<imagestream_id>"
              And user clicks on Create button
             Then user sees "<deployment_name>" deployment created

        Examples:
                  | deployment_name | strategy_type  | imagestream_id |
                  | cli             | Rolling Update | #cli-link      |
                  | dotnet          | Recreate       | #dotnet-link   |
