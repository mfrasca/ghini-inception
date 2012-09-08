#!/usr/bin/env python

import urllib2, csv

def query_tpl(genus):
    """query tpl for the given genus

    result is a list of dictionaries, where the fields are the ones defined
    by tpl itself.  only the accepted taxa are returned.
    """

    result = []
    f = urllib2.urlopen('http://www.theplantlist.org/tpl/search?q=%s&csv=true' % genus)

    for n, row in enumerate(csv.reader(f)):
        if n == 0:
            header = row
            continue
        item = dict(zip(header, row))
        if item['Taxonomic status in TPL'] != 'Accepted':
            continue
        result.append(dict(zip(header, row)))

    return result

if __name__ == '__main__':
    import sys
    result = []
    for k in sys.argv[1:]:
        result.extend(query_tpl(k))

    print result
