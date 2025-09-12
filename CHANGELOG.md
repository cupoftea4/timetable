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
