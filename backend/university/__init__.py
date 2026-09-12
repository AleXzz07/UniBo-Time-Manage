"""University data acquisition layer.

The four responsibilities are deliberately kept in separate modules so the
acquisition mechanism can change without touching the rest of the app:

    UniversityDataProvider   -> fetches raw data from UniBo
    UniversityParser         -> normalises raw data into LessonEvent models
    ScheduleRepository       -> persists / reads everything from MongoDB
    UniversityDataService    -> orchestrates fetch, diff, cache and status
"""
