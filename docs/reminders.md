# Task reminders

An optional, per-task local notification. Reminders never nudge on their own:
nothing is scheduled unless the user chooses a time for a task.

## Experience

- The task composer shows a quiet **Remind me** chip beside the date chip, in
  both create and edit mode. Priority and Goal remain separate optional chips.
- The chip opens a full-sheet step, like Date: a native date-and-time wheel
  starting at 9:00 AM on the task's day (or the next quarter hour after an hour
  for today and undated tasks), a **No reminder** action, and **Done**. Choices
  are staged until Done; Back keeps the previous reminder.
- Done checks the time is in the future, then asks for notification permission
  the first time. If notifications are off, an alert offers **Open Settings**
  and the reminder is not set.
- Task rows show an upcoming reminder as a small bell and time (`Today, 9:00 AM`)
  under the title, using secondary text colour. It disappears when the task is
  completed or the reminder has fired.
- Notifications read **Reminder** with the task text. They also appear as a
  banner while the app is open.

## How it works

- Reminders are stored on the device per workspace (guest or account) under
  `@offtasks/reminders:v1:<owner>` and are not synced. They do not change the
  Supabase schema, task records, or the shared `offtasks.com` migrations.
- [RemindersProvider](../src/providers/RemindersProvider.tsx) sits inside
  `TasksProvider`. After tasks load it drops reminders whose task was completed
  or deleted, or whose time has passed, and refreshes the text of renamed tasks.
  A reminder saved in the last minute is kept while its new task syncs.
- Any change replaces the full pending set through the native
  `OfftasksReminders` module
  ([OfftasksReminders.m](../ios/OfftasksMobile/OfftasksReminders.m)), using
  `UNCalendarNotificationTrigger`. iOS allows 64 pending local notifications, so
  the 60 soonest are scheduled.
- Switching account or signing out remounts the provider, which replaces the
  pending set with that workspace's reminders.
- `taskRepository.create` now returns the new task id so a reminder can attach to
  a task created in the same save.

## Platform and limits

- iOS only. Android has no native module, so the chip is hidden there; this
  matches the iOS-only home-screen widget bridge.
- Reminders are not copied when a guest workspace is imported into an account.
- Tapping a notification opens the app but not the task yet.
- Reminders do not follow tasks to another device.

## Verification

`__tests__/reminders.test.ts`, `reminder-scheduler.test.ts` and
`reminders-ui.test.tsx` cover pruning, scheduling limits and serialization,
persistence, permission handling, the composer step and the row indicator.
