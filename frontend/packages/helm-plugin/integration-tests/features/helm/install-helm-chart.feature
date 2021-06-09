@helm
Feature: Install the Helm Release
              As a user, I want to install the helm release

        Background:
            Given user has created or selected namespace "aut-helm-chart"


        @smoke
        Scenario: The Helm Chart option on the +Add Page: HR-06-TC01
            Given user is at Add page
             Then user can see "Helm Chart" card on the Add page


        @smoke @manual
        Scenario: Developer Catalog Page when Helm Charts checkbox is selected: HR-06-TC02
            Given user is at Add page
              And user has added multiple helm charts repositories
             When user selects "Helm Chart" card from add page
             Then user will get redirected to Helm Charts page
              And user will see the list of Chart Repositories
              And user will see the cards of Helm Charts
              And user will see Filter by Keyword field
              And user will see A-Z, Z-A sort by dropdown


        @regression
        Scenario: Install Helm Chart from Developer Catalog Page using YAML View: HR-06-TC03
            Given user is at Add page
             When user selects "Helm Chart" card from add page
              And user searches and selects "Nodejs Ex K v0.2.1" card from catalog page
              And user clicks on the Install Helm Chart button on side bar
              And user selects YAML view
              And user selects the Chart Version "0.2.1 / App Version 1.16.0 (Provided by Red Hat Helm Charts)"
             When user selects "Proceed" button from Change Chart version confirmation dialog
              And user clicks on the Install button
             Then user will be redirected to Topology page
              And Topology page have the helm chart workload "nodejs-ex-k"


        @smoke
        Scenario: Install Helm Chart from +Add Page using Form View: HR-06-TC04
            Given user is at Add page
             When user selects "Helm Chart" card from add page
              And user searches and selects "Nodejs v0.0.1" card from catalog page
              And user clicks on the Install Helm Chart button on side bar
              And user enters Release Name as "nodejs-example-1"
              And user clicks on the Install button
             Then user will be redirected to Topology page
              And Topology page have the helm chart workload "nodejs-example-1"


        @regression
        Scenario: Chart versions drop down menu: HR-06-TC05
            Given user is at Add page
             When user selects "Helm Chart" card from add page
              And user searches and selects "Quarkus v0.0.3" card from catalog page
              And user clicks on the Install Helm Chart button on side bar
              And user clicks on the chart versions dropdown menu
             Then user will see the information of all the chart versions


        @regression @manual
        Scenario: README should be updated when chart version is updated: HR-06-TC07
            Given user is at Install Helm Chart page
             Then user will see the chart version dropdown
             When user selects YAML view
             When user selects the Chart Version "0.2.0 / App Version 1.16.0 (Provided by Red Hat Helm Charts)"
             When user selects "Proceed" button from Change Chart version confirmation dialog
             Then user will see that the README is also updated with new chart version "0.2.0 / App Version 1.16.0 (Provided by Red Hat Helm Charts)"


        @regression @to-do
        Scenario: Certification filter in Helm Catalog Page: HR-06-TC08
            Given user is at Add page
              And user has added multiple helm charts repositories with providerType annotations in index.yaml
             When user selects "Helm Chart" card from Add page
             Then user will see Sources the helm chart is coming
              And user will see Partner, Community and Redhat option in Sources section

            # Add a new helm chart repo that contains providerType annotations in index.yaml:
            # Need to update the example repo when default is available with appropriate annotation
            # apiVersion: helm.openshift.io/v1beta1
            # kind: HelmChartRepository
            # metadata:
            # name: redhat-certified
            # spec:
            # connectionConfig:
            #     url: >-
            #     https://raw.githubusercontent.com/rohitkrai03/redhat-helm-charts/certification
            # name: Red Hat Certification Charts


        @regression @to-do
        Scenario: Applying Redhat Certification filter in Helm Catalog Page: HR-06-TC09
            Given user is at Add page
              And user has added multiple helm charts repositories with providerType annotations in index.yaml
             When user selects "Helm Chart" card from Add page
              And user clicks on Partner Source filter
             Then user will see Certified helm repositories present in the Helm Catalog Page

            # Add a new helm chart repo that contains providerType annotations in index.yaml:
            # Need to update the example repo when default is available with appropriate annotation
            # apiVersion: helm.openshift.io/v1beta1
            # kind: HelmChartRepository
            # metadata:
            # name: redhat-certified
            # spec:
            # connectionConfig:
            #     url: >-
            #     https://raw.githubusercontent.com/rohitkrai03/redhat-helm-charts/certification
            # name: Red Hat Certification Charts


        @regression @manual
        Scenario: Certified badge in Helm Catalog Page: HR-06-TC10
            Given user is at Add page
              And user has added multiple helm charts repositories with providerType annotations in index.yaml
              And user has disabled the default Red Hat helm chart repo
              # Scenario can be found in /helm-plugin/integration-tests/features/helm/helm-feature-flag.feature
             When user selects "Helm Chart" card from Add page
             Then user will see Blue certified badge associated with charts that are from certified partners


        @regression @manual
        Scenario: Certified badge in Helm install side panel: HR-06-TC11
            Given user is at Add page
              And user has added multiple helm charts repositories with providerType annotations in index.yaml
              And user has disabled the default Red Hat helm chart repo
             When user selects "Helm Chart" card from Add page
              And user clicks on helm chart with blue tick
             Then user will see Blue certified badge associated with heading of the helm chart
