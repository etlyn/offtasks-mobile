# Remaining pages — first consistency pass

Applies the approved Etlyn preferences to active Offtasks screens. Calendar,
layered Search, and the floating global task action retain their approved design.
This pass uses the saved preferences; no new Mobbin research is claimed.

## Changes

- Notes: compact header and compose icon, full-width glass search, branded
  All/Pinned filters, quieter cards and empty states, native editor sheet.
- Goals: matching search/header, restrained cards; no empty progress bars or
  0/0 counters. Goal detail eases over the retained list with reversible dismissal.
- Later and goal tasks: nearly full-width shared rows, rounded-square checks,
  subtle dividers, adjacent compact completion counts.
- Task creation/editing: native page sheet, solid green Save, native calendar
  picker, clear four-choice priority selector, goal entry. Opening or hiding
  the picker preserves the date. Cancel protects unsaved text, dates, priority,
  and goal changes.
- Drawer: compact grouped preferences, native switches, consistent icons,
  responsive width. Navigating home preserves existing tab state.
- Statistics: compact metric cards, Open/Completed filters, shared editable
  task rows, cross-state search; removed automatic full-screen celebration.
- Account: compact form and solid brand CTA, email retained when switching
  sign-in/sign-up. Back returns to the existing Dashboard without depending
  on drawer history. Auth, import, sync, and deletion APIs remain unchanged.
- Motion: gentle pressed feedback and tab crossfades; Reduce Motion respected
  in new transitions and native sheet presentation.

## Verification

Simulator: iPhone 17 Pro, iOS 26.5, existing development build with refreshed JS.
Visually checked Calendar preservation, Notes list/editor, Goals list/detail,
Later, task sheet and inline native date picker, drawer, Statistics open/completed
views, Account sign-in, and Account return navigation. No saved user items were
created, edited, or deleted during simulator checks; no auth forms submitted.

Automated coverage includes native sheet configuration, date preservation,
draft confirmation, disabled/layout styles, Statistics filters/search/restore,
Account return navigation, and existing Calendar/Search/storage regressions.

Remaining QA: Android device behavior, physical-device keyboard/gestures,
large Dynamic Type, dark-mode visual review of this pass, and signed-in live
account flows. This is a consistency pass, not a claim that every edge case
or every user journey has been exhaustively validated.
