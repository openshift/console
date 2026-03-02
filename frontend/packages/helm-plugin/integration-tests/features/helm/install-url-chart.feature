@helm
Feature: Install Helm Chart from URL
              As a user, I want to install a Helm chart from an OCI or HTTP URL


        Background:
            Given user has created or selected namespace "aut-helm-url"


        @smoke
        Scenario: Navigate to URL chart install page from Helm tab: HR-URL-TC01
            Given user is at the Helm page
             When user clicks on Create menu and selects "Install a Helm Chart from a URL"
             Then user is redirected to the URL chart install page


        @smoke
        Scenario: Validate required fields on URL chart form: HR-URL-TC02
            Given user is at the URL chart install page
             When user clicks on the Next button without filling any fields
             Then user will see validation errors for Chart URL, Release name, and Chart version


        @regression
        Scenario: Validate invalid chart URL format: HR-URL-TC03
            Given user is at the URL chart install page
             When user enters "not-a-valid-url" as Chart URL
              And user enters Release Name as "test-release"
              And user enters Chart Version as "1.0.0"
              And user clicks on the Next button
             Then user will see a validation error for invalid Chart URL format


        @smoke
        Scenario: Install Helm Chart from HTTP URL: HR-URL-TC04
            Given user is at the URL chart install page
             When user enters "https://redhat-developer.github.io/redhat-helm-charts/charts/dotnet-0.0.1.tgz" as Chart URL
              And user enters Release Name as "dotnet-url-test"
              And user enters Chart Version as "0.0.1"
              And user clicks on the Next button
              And user clicks on the Install button
             Then user will be redirected to Topology page


        @smoke
        Scenario: Install Helm Chart from OCI registry: HR-URL-TC05
            Given user is at the URL chart install page
             When user enters "oci://ghcr.io/stefanprodan/charts/podinfo" as Chart URL
              And user enters Release Name as "podinfo-oci-test"
              And user enters Chart Version as "6.7.1"
              And user clicks on the Next button
              And user clicks on the Install button
             Then user will be redirected to Topology page


        @regression
        Scenario: Upgrade a URL-installed Helm release: HR-URL-TC06
            Given user is on the Helm page with helm release "dotnet-url-test"
             When user clicks on the Kebab menu
              And user clicks on the "Upgrade" action
              And user clicks on the Install button
             Then user will be redirected to Topology page
