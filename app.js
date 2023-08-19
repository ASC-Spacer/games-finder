
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var igdb = require('./igdb');
var authentication = require('./authentication.js');
const axios = require('axios');
const https = require('https');

// roba per client OAuth

const config = {
    client: {
      id: '123',
      secret: 'abc'
    },
    auth: {
      tokenHost: 'https://localhost:443'
    }
  };
  
const { ClientCredentials, ResourceOwnerPassword, AuthorizationCode } = require('simple-oauth2');



var twitch_client_id;
var twitch_access_token;
var OAuth_cliend_id;
var OAuthClientSecret;

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


async function main() {
/* 
 * ROUTING web pages 
*/

/* 
 * retrieve twitch_client_id and twitch_access_token from twitch
*/

    const risultato = await authentication.auth_to_twitch();

    //console.log("client id: " + risultato.twitch_client_id);
    //console.log("access token: " + risultato.twitch_access_token)
    twitch_client_id = risultato.client_id;
    twitch_access_token = risultato.access_token;


// Chiamata alla funzione che utilizza la funzione asincrona
//console.log("client id da var globale: " + twitch_client_id);
//console.log("access token da var globale: " + twitch_access_token);

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

// da mettere in pausa, vorrei evitare questo passaggio
app.get('/register', async function(req, res, next) {
    try {
        // Creazione di un'istanza Axios con l'agente HTTPS personalizzato
        const agent = new https.Agent({
            rejectUnauthorized: false, // Consente certificati autofirmati
        });

        // Effettua la chiamata al server su localhost:443
        const response = await axios.get('https://localhost:443/client/register', { httpsAgent: agent });
        //console.log('Risposta dal server:', response.data);
        res.send(response.data);

        //qui devo intercettare la pressione del pulsante 


        //response.data.client_id=OAuth_cliend_id;
        //response.data.client_secret=OAuthClientSecret;
    } catch (error) {
        console.error('Errore durante la chiamata al server:', error);
        res.status(500).send('Errore durante la chiamata al server');
    }
});

/*
* endpoint che gestisce la creazione dell'utente
*/
app.get('/user/register', async function(req, res, next) {
  try {
      // Creazione di un'istanza Axios con l'agente HTTPS personalizzato
      const agent = new https.Agent({
          rejectUnauthorized: false, // Consente certificati autofirmati
      });

      // Effettua la chiamata al server su localhost:443
      const response = await axios.get('https://localhost:443/user/register', { httpsAgent: agent });
      //console.log('Risposta dal server:', response.data);
      res.send(response.data);

      //qui devo intercettare la pressione del pulsante 


      //response.data.client_id=OAuth_cliend_id;
      //response.data.client_secret=OAuthClientSecret;
  } catch (error) {
      console.error('Errore durante la chiamata al server:', error);
      res.status(500).send('Errore durante la chiamata al server');
  }
});

/*
* endpoint che gestisce la creazione dell'utente
*/
app.post('/user/register', async function(req, res, next) {
  try {

    const requestData = req.body;
    console.log(req.body);

    // Creazione di un'istanza Axios con l'agente HTTPS personalizzato
    const agent = new https.Agent({
      rejectUnauthorized: false, // Consente certificati autofirmati
  });

  // Effettua la chiamata al server su localhost:443
  const response = await axios.post('https://localhost:443/user/register', req.body, { httpsAgent: agent });
  //console.log('Risposta dal server:', response.data);
  res.send(response.data);
    
  } catch (error) {
      console.error('Errore durante la chiamata al server:', error);
      res.status(500).send('Errore durante la chiamata al server');
  }
});

// aggiungere client/register post

app.get('/search', async function(req, res, next) {
    res.render('games_ajax', { title: 'Risultati ricerca per: "' + req.query.txtRicerca + '"', apiFunction: '/api/search?txtRicerca='+req.query.txtRicerca });
});

app.get('/game/:id', async function(req, res, next) {
    let game = await igdb.getGame(req.params.id, twitch_client_id, twitch_access_token);
    res.render('game', { game: game });
});

// ROUTING SERVIZI IGDB

app.get('/api/best', async function(req, res, next) {
  let games = await igdb.getBest(twitch_client_id, twitch_access_token);
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(games));
});

app.get('/api/popular', async function(req, res, next) {
    let games = await igdb.getPopular(twitch_client_id, twitch_access_token);
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(games));
});

app.get('/api/hype', async function(req, res, next) {
    let games = await igdb.getHype(twitch_client_id, twitch_access_token);
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(games));
});

app.get('/api/favorites', async function(req, res, next) {
    console.log("id dei giochi preferiti: " + req.query.id);
    let favorites = await igdb.getFavorites(req.query.id, twitch_client_id, twitch_access_token);  // req.query sarebbe l'insieme degli id dei giochi preferiti aggiunti da games_ajax
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(favorites));
});

app.get('/api/search', async function(req, res, next) {
    let output = await igdb.getSearched(req.query.txtRicerca, twitch_client_id, twitch_access_token);
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(output));
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(req, res, next) {
    next(createError(403));
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

}

main();

module.exports = app;