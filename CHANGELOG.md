[2.1.1] - 2023-08-11
- Make search bar ignore non-alphanumeric characters (e.g. if `ПЗ22` gets searched, `ПЗ-22` will match even though there's no '-').
- Minor refactor for `VirtualizedDataList`.

[2.1.5] - 2023-08-27
- Removed unnecessary vertical spacing between lessons on mobile view
- Fixed active lesson highlight 

[2.5.0] - 2023-09-08
- Moved to 2023 lpnu.ua version
- Some SEO

[2.6.0] - 2024-01-05
- Moved exams and lecturer timetables to 2023 lpnu.ua version
- Added exams time

[2.6.1] - 2024-02-14
- Fixed missing event title in calendar / .ics file

[2.6.2] - 2024-02-18
- Allow unknown timetables of all types (it now tries to guess the type based on the name)

[2.6.3] - 2024-03-07
- Fixed merged timetable subgroup not saving properly

[2.6.5] - 2024-09-09
- Added support for Saturday lessons
- Improved timetable formatting

[2.6.7] - 2024-12-15
- Improved saved timetable persistence and local caching
- Added clearer group-selection guidance
- Added timetable-specific page titles
- Improved loading states and mobile controls
- Added donation prompts and a thank-you message

[2.6.8] - 2025-09-10
- Improved home-page navigation and loading states
- Added additional PWA icons and updated the application theme color
- Fixed home-page scrolling and semester date calculations

[2025-09-16]
- Added light and dark theme switching

[2025-09-30]
- Improved group loading and added guidance for finding missing groups

[2026-01-25]
- Added full support for part-time timetables
- Added a message for days without lessons
- Fixed timetable URLs and semester start dates

[2026-02-08]
- Fixed selective groups containing multiple dashes

[2026-06-05]
- Normalized LPNU group casing

[2026-09-01]
- Added automatic semester detection
- Fixed search cursor behavior
- Improved timetable, search, saved-menu, and merged-timetable UI

[2.7.0] - 2026-09-03
- Fixed lesson-time spacing
