from app.unibo_provider import UniBoProvider

def test_parse_flat_text():
    html='''<html><body><h1>Orario</h1><p>Docente: Mario Rossi</p><div>lunedì, 14 settembre 2026</div><div>09:00 - 11:00</div><div>RANZANI B</div><div>Piano Terra</div><div>Edificio via Ranzani</div><div>Via Camillo Ranzani, 14 - Bologna</div></body></html>'''
    subject={'code':'29228','name':'GEOMETRIA E ALGEBRA T','teacher':None}
    rows=UniBoProvider().parse(html,subject,'https://example.test')
    assert len(rows)==1
    assert rows[0].room=='RANZANI B'
    assert rows[0].start.startswith('2026-09-14T09:00')
