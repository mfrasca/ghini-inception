#!/usr/bin/env python
from sqlalchemy import create_engine

import settings
settings_dict = dict((i, getattr(settings, i)) for i in dir(settings) if i[0]!='_')

engine = create_engine('postgresql://%(USERNAME)s:%(PASSWORD)s@%(DBHOST)s/%(DATABASE)s' % settings_dict)
from sqlalchemy.orm import sessionmaker
session = sessionmaker(bind=engine)()
from btuu.schema import *

if False:
    Base.metadata.create_all(engine)
    session.commit()
    1/0

session.execute("drop table rank cascade")
session.execute("drop table taxon cascade")
session.execute("drop table accession cascade")
#session.execute("drop table country cascade")
#session.execute("drop table division cascade")
session.commit()

Base.metadata.create_all(engine)
session.commit()

if False:
    session.execute("delete from country")
    session.execute("delete from division")
    session.commit()

    countries = [i.split("\t") for i in file("resources/countries.txt").read().split("\n") if i]
    for item in countries:
        session.add(Country(pk_iso=item[0], 
                            name=item[1]))

    divisions = [i.split("\t") for i in file("resources/regions.txt").read().split("\n") if i]
    for item in divisions:
        country_id, abbreviation = item[0].split("-")
        session.add(Division(pk_iso=item[0], 
                             fk_country=country_id,
                             name=item[1], 
                             abbr=abbreviation))
    session.commit()

from xml.dom.minidom import parse, parseString
#dom = parse("resources/genera-minimal.xml")
dom = parse("resources/genera.xml")
root = dom.childNodes[0]
bt_database = [i for i in root.childNodes if i.nodeName == u'BTDatabase'][0]

ranks = [i for i in bt_database.childNodes if i.nodeName == u'm_rank']
for i in ranks:
    items = dict(i.attributes.items())
    print items
    session.add(Rank(pk=items['OID'], name=items['m_code']))
session.commit()

taxa_groups = [i for i in bt_database.childNodes if i.nodeName == u'm_taxon']
for tg in taxa_groups:
    for taxon in [i for i in tg.childNodes if i.nodeName == u'BTTaxon']:
        items = dict(taxon.attributes.items())
        for elem in taxon.childNodes:
            if elem.nodeType == elem.TEXT_NODE:
                continue
            items[elem.nodeName] = dict(elem.attributes.items())
        print items
        session.add(Taxon(pk=items['OID'],
                          fk_rank=items['m_rank']['OID'],
                          epithet=items['m_epithet'],
                          fk_parent=items.get('m_parent', {}).get('OID'),
                          fk_author=items.get('m_author', {}).get('OID')))

session.commit()
