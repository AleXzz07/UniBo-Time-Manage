"""UniversityDataProvider — fetches raw schedule data from UniBo.

It knows *only* how to talk to UniBo and return raw JSON. It intentionally does
not parse or interpret anything, so swapping the source (e.g. a different portal
or a cached mirror) means changing this file only.

UniBo exposes an official, structured JSON endpoint on every "orario-lezioni"
page: `<page>/@@orario_reale_json?anno=N`. This is far more robust than scraping
fragile HTML selectors, so it is our primary source.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Tuple

import requests

logger = logging.getLogger(__name__)

BASE = "https://corsi.unibo.it"
USER_AGENT = "Mozilla/5.0 (compatible; UniBoPlanner/1.0)"

# Registry of supported courses. Adding a new degree is just a new entry here.
COURSES: Dict[str, Dict[str, Any]] = {
    "ingegneria-meccanica-bologna": {
        "id": "ingegneria-meccanica-bologna",
        "name": "Ingegneria Meccanica",
        "level": "laurea",
        "slug": "IngegneriaMeccanica-Bologna",
        "campus": "Bologna",
        "years": [1, 2, 3],
        "curricula": [],
    },
}


class ProviderError(Exception):
    """Raised when UniBo data cannot be retrieved."""


class UniversityDataProvider:
    def __init__(self, timeout: int = 25):
        self.timeout = timeout

    def get_course(self, course_id: str) -> Dict[str, Any]:
        course = COURSES.get(course_id)
        if not course:
            raise ProviderError(f"Corso non supportato: {course_id}")
        return course

    def page_url(self, course_id: str) -> str:
        course = self.get_course(course_id)
        return f"{BASE}/{course['level']}/{course['slug']}/orario-lezioni"

    def fetch_orario(self, course_id: str, anno: int) -> Tuple[List[Dict[str, Any]], str]:
        """Return (raw_events, source_url). Raises ProviderError on failure."""
        page = self.page_url(course_id)
        source_url = f"{page}/@@orario_reale_json?anno={anno}"
        try:
            resp = requests.get(
                source_url,
                headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
                timeout=self.timeout,
            )
        except requests.RequestException as exc:  # network/timeout
            raise ProviderError(f"Errore di rete verso UniBo: {exc}") from exc

        if resp.status_code != 200:
            raise ProviderError(f"UniBo ha risposto {resp.status_code}")

        try:
            data = resp.json()
        except ValueError as exc:
            raise ProviderError("Risposta UniBo non in formato JSON") from exc

        if not isinstance(data, list):
            raise ProviderError("Struttura dati UniBo inattesa")

        logger.info("UniBo fetch ok: %s eventi da %s", len(data), source_url)
        return data, page
