@e2e @mobile @search @filters
# Feature code: 5
Feature: Mobile search and advanced filters
    Mobile filtering should help the tester find tasks across the current group or across all tasks when search is open.

    Background:
        Given the tester is signed in to the mobile app
        And the task set contains multiple labels, priorities, and completed items

    # Scenario code: 5.1
    Scenario: Search across tasks from the overview top bar
        When the tester opens the overview search control
        And the tester searches for a known task keyword
        Then matching results should appear without leaving the overview workspace
        And closing search should clear the search state

    # Scenario code: 5.2
    Scenario: Filter the active group with advanced mode enabled
        Given the tester has enabled Advanced Mode from the drawer
        When the tester selects one or more labels in the overview filter controls
        And the tester applies a priority sort
        Then only matching tasks should remain visible in the current group
        And the ordering should reflect the selected priority sort direction

    # Scenario code: 5.3
    Scenario: Hide completed tasks from the overview list
        Given the tester has visible completed tasks in the current group
        When the tester enables Hide Completed Tasks from the drawer
        Then completed tasks should be removed from the active overview list
        And disabling the preference should reveal them again