#!/bin/env python
# -*- coding: utf-8 -*-

from flask import Flask, g, render_template, request, session, flash, redirect, url_for
from btuu.schema import *


# configuration
DATABASE = 'cuchubo'
DEBUG = True
## import os; os.urandom(24)
SECRET_KEY = 'development key'
USERNAME = 'mario'
PASSWORD = 'mario'


app = Flask(__name__)
app.config.from_object(__name__)


from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import or_


## accueil - reception - index page
@app.route('/')
def show_accueil():
    return render_template('index.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        if request.form['username'] != app.config['USERNAME']:
            error = 'Invalid username'
        elif request.form['password'] != app.config['PASSWORD']:
            error = 'Invalid password'
        else:
            session['logged_in'] = True
            flash('You were logged in')
            return redirect(url_for('show_accueil'))
    return render_template('login.html', error=error)


@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    flash('You were logged out')
    return redirect(url_for('show_accueil'))


@app.route('/mapping', methods=['GET', 'POST'])
def the_map():
    return render_template('mapping.html')


@app.route('/accueil', methods=['GET', 'POST'])
def the_garden():
    return render_template('accueil.html')


@app.route('/search', methods=['GET', 'POST'])
def plant_search():
    like = "%" + request.form['name'] + "%"
    taxa = g.session.query(Taxon)
    taxa = taxa.filter(or_(Taxon.vern_name.ilike(like),
                           Taxon.epithet.ilike(like)))
    return render_template('search.html', objects=taxa)


@app.route('/countries', methods=['GET', 'POST'])
def country_search():
    countries = g.session.query(Country)
    countries = countries.filter(Country.name.ilike("%" + request.form['name'] + "%"))
    regions = g.session.query(Division)
    regions = regions.filter(Division.name.ilike("%" + request.form['name'] + "%"))
    return render_template('countries.html', countries=countries, regions=regions)


def create_session():
    engine = create_engine('postgresql://%s:%s@localhost/%s' % (USERNAME, PASSWORD, DATABASE))
    return sessionmaker(bind=engine)()


@app.before_request
def before_request():
    g.session = create_session()


@app.teardown_request
def teardown_request(exception):
    g.session.close()
    pass


## the administrative views!

from flask.ext.admin import Admin, BaseView, expose
from flask.ext.admin.contrib.sqlamodel import ModelView

class AdminIndexView(BaseView):
    @expose('/')
    def index(self):
        return self.render('index.html')

admin = Admin(app, name='ghini')
db = create_session()
admin.add_view(ModelView(Rank, db))
admin.add_view(ModelView(Taxon, db))
admin.add_view(ModelView(Accession, db))
admin.add_view(ModelView(Country, db))
admin.add_view(ModelView(Division, db))
db.close()



if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
