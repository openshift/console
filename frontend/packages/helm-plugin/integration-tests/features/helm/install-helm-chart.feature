@helm
Feature: Install the Helm Release
              As a user, I want to install the helm release


        Background:
            Given user has created or selected namespace "aut-helm"



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

        # This test is broken because the code to submit the modal in form doesn't work correctly.
        @regression @broken-test
        Scenario: Install Helm Chart from Developer Catalog Page using YAML View: HR-06-TC03
            Given user is at Add page
             When user selects "Helm Chart" card from add page
              And user searches and selects "Quarkus" card from catalog page
              And user clicks on the Create button on side bar
              And user selects YAML view
              # And user selects the Chart Version "0.0.2 (Provided by Red Hat Helm Charts)"
             When user clicks on the Create button
             Then user will be redirected to Topology page
              And Topology page have the helm chart workload "quarkus"


        @regression
        Scenario: Chart versions drop down menu: HR-06-TC05
            Given user is at Add page
             When user selects "Helm Chart" card from add page
              And user searches and selects "Quarkus" card from catalog page
              And user clicks on the Create button on side bar
              And user clicks on the chart versions dropdown menu
             Then user will see the information of all the chart versions


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


        @regression @odc-5713
        Scenario Outline: Namespace-scoped Helm Chart Repositories in the dev catalog: HR-06-TC12
            Given user is at Add page
            # Uncomment below for cluster not having projecthelmchartrepositories CRD
            #   And user has applied namespaced CRD yaml "<crd_yaml>"
              And user has created namespaced helm chart repo with yaml "<cr_yaml>" in namespace "aut-helm"
             When user selects Helm Chart card from Add page
             Then user will see "Ibm Repo" under Chart repositories filter
              And user will not see "Ibm Repo" under Chart repositories filter in a new namespace "test-helm1"

        Examples:
                  | crd_yaml                           | cr_yaml                                         |
                  | test-data/namespaced-helm-crd.yaml | test-data/namespaced-helm-chart-repository.yaml |


        @regression @manual @odc-5713
        Scenario: Creating projecthelmchartrepository by non-admin user: HR-06-TC13
            Given user is at Add page
            # Uncomment below for cluster not having projecthelmchartrepositories CRD
            #   And user has applied namespaced CRD yaml "namespaced-helm-chart-repository.yaml"
              And user has logged in as consoledeveloper
             When user adds projecthelmchartrepository CR with yaml "namespaced-helm-crd"
              And user selects Helm Chart card from Add page
             Then user will see "Ibm Repo" under Chart repositories filter
              And user will not see "Ibm Repo" under Chart repositories filter in a new namespace "test-helm2"
