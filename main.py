#!/bin/env python

from flask import Flask
from flask.ext.admin import Admin
from flask.ext.admin import Admin, BaseView, expose

CSRF_ENABLED = False

app = Flask(__name__)
app.config.from_object(__name__)


# Add administrative views here

class MyView(BaseView):
    @expose('/')
    def index(self):
        return self.render('index.html')

from flask.ext.admin.contrib.sqlamodel import ModelView

from btuu.schema import *

from sqlalchemy import create_engine
engine = create_engine('postgresql://mario:mario@localhost/cuchubo')
from sqlalchemy.orm import sessionmaker
session = sessionmaker(bind=engine)()

# Flask and Flask-SQLAlchemy initialization here

admin = Admin(app, name='ghini')
admin.add_view(ModelView(Taxon, session))
admin.add_view(ModelView(Accession, session))
admin.add_view(ModelView(Country, session))
admin.add_view(ModelView(Division, session))


if __name__ == '__main__':
    app.run(debug=True)
