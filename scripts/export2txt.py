#!/usr/bin/env python

## This file is part of ghini and ghini is part of bauble.
##
## bauble is free software: you can redistribute it and/or modify it under
## the terms of the GNU General Public License as published by the Free
## Software Foundation, either version 3 of the License, or (at your option)
## any later version.
##
## bauble is distributed in the hope that it will be useful, but WITHOUT ANY
## WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
## FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more
## details.
##
## You should have received a copy of the GNU General Public License along
## with bauble.  If not, see <http://www.gnu.org/licenses/>.

import sys


def connect(url):
    '''connect to database url

    return value is a cursor for the connection'''

    import sqlite3
    cn = sqlite3.connect(url)
    return cn.cursor()


if __name__ == '__main__':
    cursor = connect('/home/mario/.bauble/cuchubo.db')

    cursor.execute("""\
SELECT a.code, count(*), vn.name, genus.genus, species.sp, family.family, p.position_lon, p.position_lat, p.zoom
FROM plant AS p, accession AS a, species, genus, family
LEFT JOIN vernacular_name AS vn ON vn.species_id=species.id
WHERE species.genus_id=genus.id 
  AND genus.family_id=family.id 
  AND p.accession_id=a.id 
  AND a.species_id=species.id 
  AND (vn.language is null or vn.language='es')
  AND p.zoom IS NOT NULL
GROUP BY a.code
ORDER BY a.code
""")

    must_redo = []
    for i in cursor.fetchall():
        d = dict(zip(['accession', 'count', 'vern', 'genus', 'species', 'fam', 'lon', 'lat', 'zoom'], i))
        if d['count'] > 1:
            must_redo.append(d['accession'])
            continue
        if d['genus'] == 'Problematicus':
            d['genus'] = "-"
        if d['fam'] == 'Problematica':
            d['fam'] = '-'
        if not d['vern']:
            d['vern'] = "-"
        d['num'] = d['accession'][5:].lstrip('0')

        print (u"%(accession)s,%(zoom)s,%(lat)s,%(lon)s,%(fam)s,%(genus)s,%(species)s,%(vern)s" % d).encode('utf-8')

    for a_code in must_redo:
        cursor.execute("""\
SELECT a.code, p.code, vn.name, genus.genus, species.sp, family.family, p.position_lon, p.position_lat, p.zoom
FROM plant AS p, accession AS a, species, genus, family
LEFT JOIN vernacular_name AS vn ON vn.species_id=species.id
WHERE species.genus_id=genus.id 
  AND genus.family_id=family.id 
  AND p.accession_id=a.id 
  AND a.species_id=species.id 
  AND (vn.language is null or vn.language='es')
  AND a.code='%s'
  AND p.zoom IS NOT NULL
GROUP BY a.code, p.code
""" % (a_code, ))
        for i in cursor.fetchall():
            d = dict(zip(['accession', 'plant', 'vern', 'genus', 'species', 'fam', 'lon', 'lat', 'zoom'], i))
            if d['genus'] == 'Problematicus':
                d['genus'] = "-"
            if d['fam'] == 'Problematica':
                d['fam'] = '-'
            if not d['vern']:
                d['vern'] = "-"

            print (u"%(accession)s.%(plant)s,%(zoom)s,%(lat)s,%(lon)s,%(fam)s,%(genus)s,%(species)s,%(vern)s" % d).encode('utf-8')
