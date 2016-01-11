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


import re
accession_plant_splitter = re.compile(r'^(.*)\.([0-9]+)$')


if __name__ == '__main__':
    cursor = connect('/home/mario/.bauble/cuchubo.db')

    f = open(sys.argv[1])

    for line in f.readlines():
        name, zoom, lat, lng, _ = [f(x) for (x, f) in zip((line.strip() + ",").split(',', 5), [str, int, float, float, str])]

        if name.count('.') == 1:
            name = name + ".1"

        accession, plant = accession_plant_splitter.match(name).groups()

        cursor.execute("SELECT id FROM accession WHERE code='%s'" % accession)
        try:
            (accession_id, ) = cursor.fetchone()
        except TypeError:
            print accession
            continue
        d = {
            'accession_id': accession_id,
            'plant': plant,
            'zoom': zoom,
            'lat': lat,
            'lng': lng,
            }

        cursor.execute("""\
UPDATE plant SET zoom=%(zoom)s, position_lon=%(lng)s, position_lat=%(lat)s
WHERE code='%(plant)s'
  AND accession_id='%(accession_id)s'
""" % d)

    cursor.connection.commit()
