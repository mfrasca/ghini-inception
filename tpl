#!/bin/bash

genera=$(
    grep BTTaxon.OID=.gen resources/genera-minimal.xml |
    cut -d\" -f4)

j=
for i in $genera
do
    code=$(grep BTTaxon.OID=.gen.*$i resources/genera-minimal.xml |
        head -n1 |
        grep -o "[0-9]*")
    k=1
    for tpl in $(
        wget "http://www.theplantlist.org/tpl/search?q=$i%20$j&csv=true" -O- -q |
        grep Accept |
        cut -d, -f7 |
        tail -n +2 |
        sort |
        uniq )
    do
        echo '  <BTTaxon OID="spec'$code'.'$k'" m_epithet='$tpl'><m_parent OID="gen'$code'"/><m_rank OID="RNK_S0"/></BTTaxon>'
        k=$(( $k + 1 ))
    done
done
