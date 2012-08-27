#!/usr/bin/env python

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship, backref

from sqlalchemy.ext.declarative import declarative_base
Base = declarative_base()

from sqlalchemy.dialects.mysql import TEXT

class Taxon(Base):
    __tablename__ = 'taxon'
    pk = Column('id', Integer, primary_key=True)
    family = Column(String(20))
    full_name = Column(String(100))
    genus = Column(String(20))
    epithet = Column(String(20))
    author = Column(String(50))
    is_rank = Column(String(10))
    is_epithet = Column(String(20))
    is_author = Column(String(50))
    is2_rank = Column(String(10))
    is2_epithet = Column(String(20))
    is2_author = Column(String(50))
    cultivar = Column(String(20))
    cult_group = Column(String(20))
    trade_name = Column(String(20))
    vern_name = Column(String(20))
    hyb = Column(String(2))
    literature_fk = Column('literature_id', Integer, ForeignKey('literature.id'))
    publication = Column(TEXT)
    collation = Column(String(50))
    distribution = Column(TEXT)
    altitude = Column(String(20))
    habitat = Column(TEXT)
    type = Column(TEXT)
    autoIndex = Column(String(100))
    changed = Column('Changed', String(40))

class Accession(Base):
    __tablename__ = 'accession'
    pk = Column('id', Integer, primary_key = True)
    fk_taxon = Column('taxon_id', Integer, ForeignKey('taxon.id'))
    accid = Column('access_nr', String(20))
    fk_country = Column('country_id', Integer, ForeignKey('country.id'))
    fk_division = Column('division_id', Integer, ForeignKey('division.id'))
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
    fk_identification = Column('identification_id', Integer, ForeignKey('identification.id'))
    phenology = Column(String(20))
    notes = Column(TEXT)
    label_header = Column(String(100))
    changed = Column('Changed', String(40))

class Country(Base):
    __tablename__ = 'country'
    pk = Column('id', Integer, primary_key=True)
    name = Column(String(30))
    division1 = Column(String(20))
    sequence = Column(String(4))

    ## divisions = relationship("Division", order_by="Division.pk", backref="country")


class Division(Base):
    __tablename__ = 'division'
    pk = Column('id', Integer, primary_key=True)
    fk_country = Column('country_id', Integer, ForeignKey('country.id'))
    type = Column(String(20))
    abbr = Column(String(5))
    name = Column(String(40))
    alternative = Column(String(50))
    capital = Column(String(50))
    sequence = Column(Integer)
    WGS = Column(String(10))
    autoIndex = Column(String(30))

    country = relationship("Country", backref=backref('divisions', order_by=pk))


class Identification(Base):
    __tablename__ = 'identification'
    pk = Column('id', Integer, primary_key=True)
    fk_accession = Column('accession_id', Integer, ForeignKey('accession.id'))
    fk_taxon = Column('taxon_id', Integer, ForeignKey('taxon.id'))
    type = Column(String(5))
    name = Column(String(50))
    date = Column(String(50))
    qualifier = Column(String(10))
    notes = Column(TEXT)

class Literature(Base):
    __tablename__ = 'literature'
    pk = Column('id', Integer, primary_key=True)
    fk_accession = Column('accession_id', Integer, ForeignKey('accession.id'))
    fk_taxon = Column('taxon_id', Integer, ForeignKey('taxon.id'))
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
    fk_taxon = Column('taxon_id', Integer, ForeignKey('taxon.id'))
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

