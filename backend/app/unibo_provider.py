from __future__ import annotations
import hashlib, re
from datetime import datetime
from zoneinfo import ZoneInfo
import httpx
from bs4 import BeautifulSoup
from .models import Lesson

TZ = ZoneInfo("Europe/Rome")
MONTHS = {"gennaio":1,"febbraio":2,"marzo":3,"aprile":4,"maggio":5,"giugno":6,"luglio":7,"agosto":8,"settembre":9,"ottobre":10,"novembre":11,"dicembre":12}
DATE_RE = re.compile(r"(?:lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica),?\s+(\d{1,2})\s+([a-zà]+)\s+(\d{4})", re.I)
TIME_RE = re.compile(r"(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})")

class UniBoProvider:
    def __init__(self, timeout: float = 15): self.timeout = timeout

    async def fetch(self, subject: dict, url: str) -> list[Lesson]:
        headers={"User-Agent":"UniBoTimeManager/0.1 educational personal timetable client"}
        async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True, headers=headers) as client:
            r=await client.get(url); r.raise_for_status()
        return self.parse(r.text, subject, url)

    def parse(self, html: str, subject: dict, url: str) -> list[Lesson]:
        soup=BeautifulSoup(html,"html.parser")
        teacher=subject.get("teacher")
        page_text=soup.get_text("\n", strip=True)
        tm=re.search(r"Docente:\s*([^\n]+)", page_text, re.I)
        if tm: teacher=tm.group(1).strip()

        events=self._parse_rows(soup,subject,url,teacher)
        if not events: events=self._parse_flat_text(page_text,subject,url,teacher)
        if not events: raise ValueError(f"Nessun evento riconosciuto per {subject['name']}: struttura UniBo cambiata o calendario non pubblicato")
        return events

    def _parse_rows(self,soup,subject,url,teacher):
        out=[]
        for tr in soup.find_all("tr"):
            txt=" | ".join(x.get_text(" ",strip=True) for x in tr.find_all(["th","td"]))
            if not DATE_RE.search(txt) or not TIME_RE.search(txt): continue
            ev=self._event_from_text(txt,subject,url,teacher)
            if ev: out.append(ev)
        return out

    def _parse_flat_text(self,text,subject,url,teacher):
        lines=[x.strip() for x in text.splitlines() if x.strip()]
        out=[]
        for i,line in enumerate(lines):
            if not DATE_RE.search(line): continue
            block=" | ".join(lines[i:i+7])
            ev=self._event_from_text(block,subject,url,teacher)
            if ev: out.append(ev)
        unique={e.id:e for e in out}
        return sorted(unique.values(), key=lambda e:e.start)

    def _event_from_text(self,text,subject,url,teacher):
        dm=DATE_RE.search(text); tm=TIME_RE.search(text)
        if not dm or not tm: return None
        day,month_name,year=int(dm.group(1)),dm.group(2).lower(),int(dm.group(3)); month=MONTHS.get(month_name)
        if not month: return None
        sh,sm=map(int,tm.group(1).split(':')); eh,em=map(int,tm.group(2).split(':'))
        start=datetime(year,month,day,sh,sm,tzinfo=TZ); end=datetime(year,month,day,eh,em,tzinfo=TZ)
        after=text[tm.end():].strip(" |")
        bits=[b.strip() for b in after.split("|") if b.strip()]
        room=bits[0] if bits else None
        address=next((b for b in reversed(bits) if "Bologna" in b),None)
        building=next((b for b in bits[1:] if b!=address and not b.lower().startswith("piano")),None)
        raw=f"{subject['code']}|{start.isoformat()}|{room or ''}"
        event_id=hashlib.sha1(raw.encode()).hexdigest()[:16]
        return Lesson(id=event_id,subjectCode=subject['code'],subject=subject['name'].title(),teacher=teacher,start=start.isoformat(),end=end.isoformat(),room=room,building=building,address=address,sourceUrl=url,updatedAt=datetime.now(TZ).isoformat())
