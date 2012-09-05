#!/usr/bin/env python

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship, backref

from sqlalchemy.ext.declarative import declarative_base
Base = declarative_base()

from sqlalchemy.dialects.mysql import TEXT


class Rank(Base):
    __tablename__ = 'rank'
    id = Column('id', Integer, primary_key=True)
    pk = Column(String(12), unique=True)
    name = Column(String(30))

    def __repr__(self):
        return self.name


class Author(Base):
    __tablename__ = 'author'
    pk = Column('id', Integer, primary_key=True)
    name = Column(String(90))

    def __repr__(self):
        return self.name


class Taxon(Base):
    __tablename__ = 'taxon'
    id = Column('id', Integer, primary_key=True)
    pk = Column(String(12), unique=True)
    fk_author = Column(Integer, ForeignKey('author.id'))
    fk_rank = Column(String(12), ForeignKey('rank.pk'))
    epithet = Column(String(36))
    fk_parent = Column(String(12), ForeignKey('taxon.pk'))

    parent = relationship("Taxon", remote_side=[pk], backref=backref("children", order_by=pk))
    author = relationship("Author", backref=backref('taxa', order_by=pk))
    rank = relationship("Rank", backref=backref('taxa', order_by=pk))

    def __repr__(self):
        return "<%s:%s>" % (self.rank.name, self.epithet)

    trade_name = Column(String(20))
    vern_name = Column(String(20))
    hyb = Column(String(2))
    #literature_fk = Column('literature_id', Integer, ForeignKey('literature.id'))
    publication = Column(TEXT)
    collation = Column(String(50))
    distribution = Column(TEXT)
    altitude = Column(String(20))
    habitat = Column(TEXT)
    type = Column(TEXT)
    changed = Column('Changed', String(40))


class Accession(Base):
    __tablename__ = 'accession'
    pk = Column('id', Integer, primary_key=True)
    fk_taxon = Column('taxon_id', String(12), ForeignKey('taxon.pk'))
    accid = Column('access_nr', String(20))
    fk_country = Column('country_id', String(2), ForeignKey('country.iso'))
    fk_division = Column('division_id', String(7), ForeignKey('division.iso'))
    locality = Column(TEXT)
    altitude = Column(String(10))
    altitudeMax = Column(String(10))
    latitude = Column(String(10))
    longitude = Column(String(10))
    habitat = Column(TEXT)
    description = Column(TEXT)
    coll_prim = Column(String(20))
    coll_nbr = Column(String(20))
    coll_date = Column(String(25))
    coll_add = Column(String(100))
    #fk_identification = Column('identification_id', Integer, ForeignKey('identification.id'))
    phenology = Column(String(20))
    notes = Column(TEXT)
    label_header = Column(String(100))
    changed = Column('Changed', String(40))


class Country(Base):
    __tablename__ = 'country'
    pk_iso = Column('iso', String(2), primary_key=True)
    name = Column(String(48))

    def __repr__(self):
        return self.name


class Division(Base):
    __tablename__ = 'division'
    pk_iso = Column('iso', String(7), primary_key=True)
    fk_country = Column('country_id', String(2), ForeignKey('country.iso'))
    abbr = Column(String(4))
    name = Column(String(64))

    country = relationship("Country", backref=backref('divisions', order_by=pk_iso))

    def __repr__(self):
        return self.name


class Literature(Base):
    __tablename__ = 'literature'
    pk = Column('id', Integer, primary_key=True)
    fk_accession = Column('accession_id', Integer, ForeignKey('accession.id'))
    fk_taxon = Column('taxon_id', String(12), ForeignKey('taxon.pk'))
    type = Column(String(5))
    name = Column(String(50))
    date = Column(String(50))
    qualifier = Column(String(10))
    notes = Column(TEXT)


class Location(Base):
    __tablename__ = 'location'
    pk = Column('id', Integer, primary_key=True)
    fk_accession = Column('accession_id', Integer, ForeignKey('accession.id'))
    garden_location = Column(String(50))
    sequence = Column(String(20))
    number_specimen = Column(String(50))
    label = Column(String(50))
    status = Column(String(20))
    remarks = Column(TEXT)
    changed = Column('Changed', String(40))


class Objects(Base):
    __tablename__ = 'objects'
    pk = Column('id', Integer, primary_key=True)
    fk_taxon = Column('taxon_id', String(12), ForeignKey('taxon.pk'))
    type = Column(String(20))
    use = Column(String(10))
    owner = Column(String(20))
    origin = Column(TEXT)
    note = Column(TEXT)
    prov = Column(String(10))
    verification = Column(String(20))
    verifier = Column(String(50))
    graphics = Column(String(50))
    url = Column(String(100))
    file = Column(String(35))

