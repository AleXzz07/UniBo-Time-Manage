"""UniversityParser — normalises raw UniBo JSON into LessonEvent models.

Kept deliberately tolerant: every field is optional-safe so a change in an
unrelated part of the payload never crashes the parser. It does NOT depend on
fragile HTML selectors — it reads the documented JSON keys and degrades
gracefully when a key is missing.
"""
from __future__ import annotations

import hashlib
import logging
import re
from typing import Any, Dict, List, Optional

from models import LessonEvent

logger = logging.getLogger(__name__)

GROUP_RE = re.compile(r"\(([A-Z]\s*-\s*[A-Z])\)")

# The 5 subject color tokens from the design system, assigned deterministically.
COLOR_TOKENS = [
    "subjectPhysics",
    "subjectCalculus",
    "subjectThermo",
    "subjectMechanics",
    "subjectCAD",
]


def _stable_id(cod_modulo: str, start: str) -> str:
    raw = f"{cod_modulo}|{start}"
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()[:20]


def _extract_group(title: str) -> Optional[str]:
    m = GROUP_RE.search(title or "")
    if not m:
        return None
    return m.group(1).replace(" ", "").upper()


def _clean_subject_name(title: str) -> str:
    """Pick the most specific human module name out of a composite title."""
    if not title:
        return "Lezione"
    # Strip any group markers like "(A-K)".
    parts = [p.strip() for p in title.split("/")]
    parts = [p for p in parts if p and not GROUP_RE.fullmatch(p)]
    # Remove residual "(A-K)" fragments inside a part.
    parts = [GROUP_RE.sub("", p).strip() for p in parts]
    parts = [p for p in parts if p]
    if not parts:
        return title.strip().title()
    # The last segment of a "C.I." composite is the concrete module.
    name = parts[-1]
    name = name.replace(" C.I.", "").strip()
    return name.title()


def _room_fields(raw: Dict[str, Any]) -> Dict[str, Optional[str]]:
    aule = raw.get("aule") or []
    if not aule:
        return {"aula": None, "edificio": None, "indirizzo": None, "piano": None}
    a = aule[0] or {}
    return {
        "aula": a.get("des_risorsa") or a.get("des_edificio"),
        "edificio": a.get("des_edificio"),
        "indirizzo": a.get("des_indirizzo"),
        "piano": a.get("des_piano"),
    }


class UniversityParser:
    def parse(
        self, raw_events: List[Dict[str, Any]], course_id: str, source_url: str
    ) -> List[LessonEvent]:
        # First pass: collect unique subject keys for deterministic colors.
        keys: List[str] = []
        for raw in raw_events:
            k = str(raw.get("cod_modulo") or raw.get("extCode") or "")
            if k and k not in keys:
                keys.append(k)
        keys.sort()
        color_of = {k: COLOR_TOKENS[i % len(COLOR_TOKENS)] for i, k in enumerate(keys)}

        events: List[LessonEvent] = []
        for raw in raw_events:
            try:
                events.append(self._parse_one(raw, course_id, source_url, color_of))
            except Exception as exc:  # never let one bad row kill the batch
                logger.warning("Riga orario ignorata: %s", exc)
        return events

    def _parse_one(
        self,
        raw: Dict[str, Any],
        course_id: str,
        source_url: str,
        color_of: Dict[str, str],
    ) -> LessonEvent:
        start = str(raw.get("start") or "")
        end = str(raw.get("end") or "")
        if not start or not end:
            raise ValueError("evento senza start/end")

        cod_modulo = str(raw.get("cod_modulo") or raw.get("extCode") or "n/a")
        title = str(raw.get("title") or "Lezione")
        rooms = _room_fields(raw)
        time_str = str(raw.get("time") or "")
        start_time = time_str.split("-")[0].strip() if "-" in time_str else start[11:16]
        end_time = time_str.split("-")[1].strip() if "-" in time_str else end[11:16]

        cfu_val = raw.get("cfu") or raw.get("val_crediti")
        try:
            cfu = float(cfu_val) if cfu_val is not None else None
        except (TypeError, ValueError):
            cfu = None

        return LessonEvent(
            stable_id=_stable_id(cod_modulo, start),
            course_id=course_id,
            cod_modulo=cod_modulo,
            subject_key=cod_modulo,
            subject_name=_clean_subject_name(title),
            docente=(raw.get("docente") or None),
            date=start[:10],
            start=start,
            end=end,
            start_time=start_time,
            end_time=end_time,
            aula=rooms["aula"],
            edificio=rooms["edificio"],
            indirizzo=rooms["indirizzo"],
            piano=rooms["piano"],
            campus="Bologna",
            gruppo=_extract_group(title),
            teledidattica=bool(raw.get("teledidattica")),
            cfu=cfu,
            note=(raw.get("note") or None),
            color_token=color_of.get(cod_modulo, "subjectCAD"),
            source_url=source_url,
        )
