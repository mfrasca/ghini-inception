#!/usr/bin/env python
from btuu.schema import *
from sqlalchemy import create_engine

engine = create_engine('postgresql://mario:mario@localhost/cuchubo')
from sqlalchemy.orm import sessionmaker
session = sessionmaker(bind=engine)()

Base.metadata.create_all(engine) 

session.add_all([
        Country(name='Colombia', division_type='D'),
        Country(name='Cuba', division_type='D'),
        Country(name='Hispaniola', division_type=''),
        Country(name='Haiti', division_type=''),
        Country(name='Chile', division_type=''),
        Country(name='Argentina', division_type=''),
        Country(name='Brasil', division_type=''),
        Country(name='Uruguay', division_type=''),
        ])

session.commit()
