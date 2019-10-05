var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var igdb = require('./igdb');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ROUTING PAGINE

app.get('/', async function(req, res, next) {
  res.render('games_ajax', { title: 'I migliori', apiFunction: '/api/best' });
});

app.get('/popular', async function(req, res, next) {
    res.render('games_ajax', { title: 'I più popolari', apiFunction: '/api/popular' });
});

app.get('/hype', async function(req, res, next) {
    res.render('games_ajax', { title: 'I più attesi', apiFunction: '/api/hype' });
});

app.get('/favorites', async function(req, res, next) {
    res.render('games_ajax', { title: 'I tuoi giochi preferiti', apiFunction: '/api/favorites' });
});

app.get('/search', async function(req, res, next) {
    res.render('games_ajax', { title: 'Risultati ricerca per: "' + req.query.txtRicerca + '"', apiFunction: '/api/search?txtRicerca='+req.query.txtRicerca });
});

app.get('/game/:id', async function(req, res, next) {
    let game = await igdb.getGame(req.params.id);
    res.render('game', { game: game });
});

// ROUTING SERVIZI IGDB

app.get('/api/best', async function(req, res, next) {
  let games = await igdb.getBest();
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(games));
});

app.get('/api/popular', async function(req, res, next) {
    let games = await igdb.getPopular();
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(games));
});

app.get('/api/hype', async function(req, res, next) {
    let games = await igdb.getHype();
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(games));
});

app.get('/api/favorites', async function(req, res, next) {
    let favorites = await igdb.getFavorites(req.query.id);  // la query sarebbe l'insieme degli id dei giochi preferiti aggiunti da games_ajax
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(favorites));
});

app.get('/api/search', async function(req, res, next) {
    let output = await igdb.getSearched(req.query.txtRicerca);
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(output));
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;