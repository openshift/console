@customize-telemetry @odc-7498
Feature: Customization of telemetry analytics
                As admin you can customize user telemetry analytics.

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-telemetry"

        @smoke
        Scenario: When navigates to cluster configuration page: TE-01-TC01
            Given user is at Consoles page
             When user navigates to Cluster configuration page
              And user clicks on Telemetry tab
              And user clicks on Analytics dropdown
             Then user should see Opt-in, Opt-out, Enforce and Disabled options


        @smoke
        Scenario: When user select a option for telemetry analytics in cluster configuration page: TE-01-TC02
            Given user is at Telemetry Configuration page
             When user clicks on Analytics dropdown
              And user selects "Enforce" option in dropdown menu
             Then user should see a success alert

        @regression @manual
        Scenario: When user select Opt-in for telemetry analytics in cluster configuration page: TE-01-TC03
            Given user is at Telemetry Configuration page
             When user clicks on Analytics dropdown
              And user selects "Opt-in" option in dropdown menu
              And user is at cluster YAML of "operator.openshift.io/v1" console
             Then user should see "telemetry.console.openshift.io/STATE: OPT-IN" got added in "metadata.annotations"

        @regression @manual
        Scenario: When user select Opt-out for telemetry analytics in cluster configuration page: TE-01-TC04
            Given user is at Telemetry Configuration page
             When user clicks on Analytics dropdown
              And user selects "Opt-out" option in dropdown menu
              And user is at cluster YAML of "operator.openshift.io/v1" console
             Then user should see "telemetry.console.openshift.io/STATE: OPT-OUT" got added in "metadata.annotations"

        @regression @manual
        Scenario: When user select Enforce for telemetry analytics in cluster configuration page: TE-01-TC05
            Given user is at Telemetry Configuration page
             When user clicks on Analytics dropdown
              And user selects "Enforce" option in dropdown menu
              And user is at cluster YAML of "operator.openshift.io/v1" console
             Then user should see "telemetry.console.openshift.io/STATE: ENFORCE" got added in "metadata.annotations"

        @regression @manual
        Scenario: When user select Disabled for telemetry analytics in cluster configuration page: TE-01-TC06
            Given user is at Telemetry Configuration page
             When user clicks on Analytics dropdown
              And user selects "Disabled" option in dropdown menu
              And user is at cluster YAML of "operator.openshift.io/v1" console
             Then user should see "telemetry.console.openshift.io/STATE: DISABLED" got added in "metadata.annotations"



