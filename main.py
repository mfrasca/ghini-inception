#!/bin/env python

from flask import Flask

CSRF_ENABLED = False

app = Flask(__name__)
app.config.from_object(__name__)


from sqlalchemy import create_engine
engine = create_engine('postgresql://mario:mario@localhost/cuchubo')
from sqlalchemy.orm import sessionmaker
session = sessionmaker(bind=engine)()


from flask.ext.admin import Admin
from flask.ext.admin.contrib.sqlamodel import ModelView
admin = Admin(app, name='ghini')
from btuu.schema import *
admin.add_view(ModelView(Rank, session))
admin.add_view(ModelView(Taxon, session))
admin.add_view(ModelView(Accession, session))
admin.add_view(ModelView(Country, session))
admin.add_view(ModelView(Division, session))


if __name__ == '__main__':
    app.run(debug=True)
