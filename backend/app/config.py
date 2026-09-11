SUBJECTS = [
    {"code":"28622","name":"ANALISI MATEMATICA T-A","teacher":"Francesco Uguzzoni","page_id":"514009"},
    {"code":"28626","name":"FISICA GENERALE T-A","teacher":"Laura Fabbri","page_id":"514029"},
    {"code":"29225","name":"FONDAMENTI DI CHIMICA T","teacher":"Michelina Soccio","page_id":"514010"},
    {"code":"29228","name":"GEOMETRIA E ALGEBRA T","teacher":"Marta Morigi","page_id":"514012"},
]

def timetable_url(page_id: str) -> str:
    return f"https://www.unibo.it/it/studiare/insegnamenti-competenze-trasversali-moocs/insegnamenti/insegnamento/2026/{page_id}/orariolezioni"
