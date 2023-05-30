@customize-web-terminal @odc-7283
Feature: Customization of web terminal options
                As admin you can change the default timeout and image of Web Terminal.

        Background:
            Given user has installed Web Terminal operator
              And user is at developer perspective
              And user has created or selected namespace "aut-web-terminal"

        @smoke
        Scenario: When navigates to cluster configuration page: WT-02-TC01
            Given user is at Consoles page
             When user navigates to Cluster configuration page
              And user clicks on Web Terminal tab
             Then user should see Web Terminal Configuration page


        @smoke
        Scenario: When user changes web terminal settings: WT-02-TC02
            Given user is at Web Terminal Configuration page
             When user increase the timeout value and set unit as "Minutes"
              And user enters image value as "registry.redhat.io/web-terminal/web-terminal-tooling-rhel8@sha256:9ff1f660fccd3a2f0515ba997d48ad87d2ba47c40b67062c74580bbea9446805" 
              And user checks checkboxes to save data even after operator restarts or update
              And user clicks on Save button to save web terminal settings
             Then user should see a success alert

        
        @smoke
        Scenario: When user changes web terminal default image and timeout: WT-02-TC03
            Given user is at Web Terminal Configuration page
             When user increase the timeout value and set unit as "Hours"
              And user enters image value as "registry.redhat.io/web-terminal/web-terminal-tooling-rhel8@sha256:9ff1f660fccd3a2f0515ba997d48ad87d2ba47c40b67062c74580bbea9446806" 
              And user checks checkboxes to save data even after operator restarts or update
              And user clicks on Save button to save web terminal settings
              And user switches to Developer tab
              And user clicks on Web Terminal tab
             Then user should see new image value as "registry.redhat.io/web-terminal/web-terminal-tooling-rhel8@sha256:9ff1f660fccd3a2f0515ba997d48ad87d2ba47c40b67062c74580bbea9446806"
              And user should see new timeout unit as "Hours"
              And user should see timeout checkbox to save data even after operator restarts or update is checked             
              And user should see image checkbox to save data even after operator restarts or update is checked

        @regression
        Scenario: When user selects not to save data after operator restarts or update: WT-02-TC04
            Given user is at Web Terminal Configuration page
             When user increase the timeout value and set unit as "Hours"
              And user enters image value as "registry.redhat.io/web-terminal/web-terminal-tooling-rhel8@sha256:9ff1f660fccd3a2f0515ba997d48ad87d2ba47c40b67062c74580bbea9446806" 
              And user unchecks checkboxes to save data even after operator restarts or update
              And user clicks on Save button to save web terminal settings
             Then user should see a success alert

        @regression
        Scenario: When user selects not to save data after operator restarts or update: WT-02-TC05
            Given user is at Web Terminal Configuration page
             When user increase the timeout value and set unit as "Hours"
              And user enters image value as "registry.redhat.io/web-terminal/web-terminal-tooling-rhel8@sha256:9ff1f660fccd3a2f0515ba997d48ad87d2ba47c40b67062c74580bbea9446806" 
              And user unchecks checkboxes to save data even after operator restarts or update
              And user clicks on Save button to save web terminal settings
              And user switches to Developer tab
              And user clicks on Web Terminal tab
             Then user should see timeout checkbox to save data even after operator restarts or update is unchecked             
              And user should see image checkbox to save data even after operator restarts or update is unchecked


        @regression @manual
        Scenario: When web terminal timeout value is changed: WT-02-TC06
            Given user has updated timeout value in Web Terminal Congiguration page
              And user decided to save timeout value even after operator restarts or update
              And user is at namespace "openshift-operators"
             When user searches "DevWorkspaceTemplates" in Search page
              And user selects "web-terminal-exec" resource
              And user switches to the YAML tab
             Then user should see new timeout value in "WEB_TERMINAL_IDLE_TIMEOUT" evnironment variable
              And user should see "web-terminal.redhat.com/unmanaged-state: 'true'" got added in "metadata.annotations"

        
        @regression @manual
        Scenario: When web terminal image value is changed: WT-02-TC07
            Given user has updated image value in Web Terminal Congiguration page
              And user decided to save image value even after operator restarts or update
              And user is at namespace "openshift-operators"
             When user searches "DevWorkspaceTemplates" in Search page
              And user selects "web-terminal-tooling" resource
              And user switches to the YAML tab
             Then user should see new image value in 'spec.components' for resource name "web-terminal-tooling" in "container.image" value
              And user should see "web-terminal.redhat.com/unmanaged-state: 'true'" got added in "metadata.annotations"


