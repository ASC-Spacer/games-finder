var apicalypse = require('apicalypse').default;
//var authentication = require('./authentication.js');

const APIKEY = "756eb246e6c4b0a66a0d76100b35581e";
const LIMITE = 18;
const IGDB_GAMES = "https://api.igdb.com/v4/games";
const IGDB_GAME_VIDEOS = "https://api.igdb.com/v4/game_videos";
const IGDB_GENRES = "https://api.igdb.com/v4/genres";
const IGDB_PLATFORMS = "https://api.igdb.com/v4/platforms";
const IGDB_COMPANIES = "https://api.igdb.com/v4/companies";
const IGDB_WEBSITES = "https://api.igdb.com/v4/websites";
const IGDB_SCREENSHOTS = "https://api.igdb.com/v4/screenshots";
const IGDB_COVERS = "https://api.igdb.com/v4/covers"

let genresCache = {};
let coversCache = {};

// FUNZIONI PER LE PAGINE
async function getBest(client_id, access_token){
    const games = await apicalypse({
        queryMethod: 'body',
        method: 'post',
        headers: {
            'Client-ID': client_id,
            'Authorization': 'Bearer ' + access_token
        }
    })
        .fields('name,genres.name,cover.url')
        .limit(LIMITE)
        .sort('rating', 'desc')
        .where('name != null & genres != null & cover != null & rating_count >= 100 & aggregated_rating_count > 5 & rating != null')
        .request(IGDB_GAMES); // execute the query and return a response object

    prepareTiles(games);        // prepara copertina e generi per ciascuna locandina
    console.log(games.data);
    return games.data;
}

async function getPopular(client_id, access_token){
    const games = await apicalypse({
        queryMethod: 'body',
        method: 'post',
        headers: {
            'Client-ID': client_id,
            'Authorization': 'Bearer ' + access_token
        }
    })
        .fields('name,genres.name,cover.url')
        .limit(LIMITE)
        .sort('total_rating_count', 'desc')    //era pulse_count ma non è più supportato
        .where('name != null & genres != null & cover != null & total_rating_count != null')
        .request(IGDB_GAMES); // execute the query and return a response object

    prepareTiles(games);
    return games.data;
}

async function getHype(client_id, access_token){
    let oggi = DateToUNIX(new Date());

    const games = await apicalypse({
        queryMethod: 'body',
        method: 'post',
        headers: {
            'Client-ID': client_id,
            'Authorization': 'Bearer ' + access_token
        }
    })
        .fields('name,cover.url,genres.name')
        .limit(LIMITE)
        .sort('follows', 'desc')          //hypes
        .sort('release_dates.date', 'asc')
        .where('name != null & genres != null & cover != null & release_dates.date != null & follows != null & release_dates.date > ' + oggi)
        .request(IGDB_GAMES); // execute the query and return a response object

    prepareTiles(games);
    return games.data;
}

async function getFavorites(id, client_id, access_token){
    if (id === undefined) {
        return null;
    }
    const games = await apicalypse({
        queryMethod: 'body',
        method: 'post',
        headers: {
            'Client-ID': client_id,
            'Authorization': 'Bearer ' + access_token
        }
    })
        .fields('name,genres.name,cover.url')
        .where('id = (' + id + ')')
        .request(IGDB_GAMES); // execute the query and return a response object
    console.log(games.data);
    prepareTiles(games); 
    return games.data;
}

async function getSearched(name, client_id, access_token){
    const games = await apicalypse({
        queryMethod: 'body',
        method: 'post',
        headers: {
            'Client-ID': client_id,
            'Authorization': 'Bearer ' + access_token
        }
    })
    .fields('name,genres.name,cover.url')
    .limit(LIMITE)
    .sort('follows', 'desc')        //usava pulse_count
    //.search(name)
    .where('name != null & genres != null & cover != null & follows != null & name ~ *"' + name + '"*')
    .request(IGDB_GAMES); // execute the query and return a response object

    prepareTiles(games);
    return games.data;
}

async function getGame(id, client_id, access_token){
    const game = await apicalypse({
        queryMethod: 'body',
        method: 'post',
        headers: {
            'Client-ID': client_id,
            'Authorization': 'Bearer ' + access_token
        }
    })
        .fields('name,videos.video_id,summary,genres.name,release_dates.date,platforms.name,involved_companies.company.name,websites.url')
        .where('id = ' + id)
        .request(IGDB_GAMES); // execute the query and return a response object

    console.log(game.data[0].genres);

    // campi obbligatori
    for(gex in game.data[0].genres)
        game.data[0].genres[gex] = game.data[0].genres[gex].name;
    game.data[0].genres = game.data[0].genres.join(", ");

    // campi facoltativi
    if(game.data[0].videos != null)
        game.data[0].videos = game.data[0].videos[0].video_id;
    if(game.data[0].platforms != null) {
        for (gex in game.data[0].platforms)
            game.data[0].platforms[gex] = game.data[0].platforms[gex].name;
    }
    if(game.data[0].involved_companies != null) {
        for (gex in game.data[0].involved_companies)
            game.data[0].involved_companies[gex] = game.data[0].involved_companies[gex].company.name;
        game.data[0].involved_companies = game.data[0].involved_companies.join(", ");
    }
    if(game.data[0].release_dates != null)
        game.data[0].release_dates = UNIXToDate(game.data[0].release_dates[game.data[0].release_dates.length-1].date);
    if(game.data[0].websites != null)
        game.data[0].websites = game.data[0].websites[0].url;

    return game.data[0];
}

// FUNZIONI PER LE INFO DEI GIOCHI
async function getVideo(id){
    const video = await apicalypse({
        queryMethod: 'body',
        method: 'post',
        headers: {
            'Client-ID': client_id,
            'Authorization': 'Bearer ' + access_token
        }
    })
        .fields('id,video_id')
        .where('id = '+id)
        .request(IGDB_GAME_VIDEOS); // execute the query and return a response object

    return video.data[0].video_id;
}

async function getGenre(id){
    if(id in genresCache)
        return genresCache[id];
    const genre = await apicalypse({
        queryMethod: 'body',
        method: 'post',
        headers: {
            'Client-ID': client_id,
            'Authorization': 'Bearer ' + access_token
        }
    })
        .fields('id,name')
        .where('id = '+id)
        .request(IGDB_GENRES); // execute the query and return a response object

    genresCache[id] = genre.data[0].name;
    return genre.data[0].name;
}

async function getPlatform(id){
    const platform = await apicalypse({
        queryMethod: 'body',
        method: 'post',
        headers: {
            'Client-ID': client_id,
            'Authorization': 'Bearer ' + access_token
        }
    })
        .fields('id,name')
        .where('id = '+id)
        .request(IGDB_PLATFORMS); // execute the query and return a response object

    return platform.data[0].name;
}

async function getCompanies(id){
    const company = await apicalypse({
        queryMethod: 'body',
        method: 'post',
        headers: {
            'Client-ID': client_id,
            'Authorization': 'Bearer ' + access_token
        }
    })
        .fields('id,name')
        .where('id = '+id)
        .request(IGDB_COMPANIES); // execute the query and return a response object

    return company.data.name;
}

async function getWebsites(id){
    const genre = await apicalypse({
        queryMethod: 'body',
        method: 'post',
        headers: {
            'Client-ID': client_id,
            'Authorization': 'Bearer' + access_token
        }
    })
        .fields('id,url')
        .where('id = '+id)
        .request(IGDB_WEBSITES); // execute the query and return a response object

    return genre.data[0].name;
}

async function getScreenshots(id){
    const screenshot = await apicalypse({
        queryMethod: 'body',
        method: 'post',
        headers: {
            'Client-ID': client_id,
            'Authorization': 'Bearer ' + access_token
        }
    })
        .fields('id,url,width,height')
        .where('id = '+id)
        .request(IGDB_SCREENSHOTS); // execute the query and return a response object

    return screenshot.data[0].url.replace("t_thumb", "t_original");
}

async function getCover(id){
    if(id in coversCache)
        return coversCache[id];
    const cover = await apicalypse({
        queryMethod: 'body',
        method: 'post',
        headers: {
            'Client-ID': client_id,
            'Authorization': 'Bearer ' + access_token
        }
    })
        .fields('id,url,width,height')
        .where('id = '+id)
        .request(IGDB_COVERS); // execute the query and return a response object

    coversCache[id] = cover.data[0].url.replace("t_thumb","t_cover_big");
    return cover.data[0].url.replace("t_thumb","t_cover_big");
}

// FUNZIONI DI UTILITY
async function loadGenresCache(){
    const genres = await apicalypse({
        queryMethod: 'body',
        method: 'post',
        headers: {
            'Client-ID': client_id,
            'Authorization': 'Bearer ' + access_token
        }
    })
        .fields('id,name')
        .limit(50)
        .request(IGDB_GENRES); // execute the query and return a response object

    for(gx in genres.data)
        genresCache[genres.data[gx].id] = genres.data[gx].name;
}

function prepareTiles(games) {
    for(gx in games.data){
        games.data[gx].cover.url = games.data[gx].cover.url.replace("t_thumb","t_cover_big");
        for(gex in games.data[gx].genres)
            games.data[gx].genres[gex] = games.data[gx].genres[gex].name;
        games.data[gx].genres = games.data[gx].genres.join(", ");
    }
}

function UNIXToDate(UNIX_timestamp){
    let temp = new Date(UNIX_timestamp * 1000);
    let year = temp.getFullYear();
    let month = temp.getMonth();
    let day = temp.getDate();
    let date = day + '/' + month + '/' + year;
    return date;
}

function DateToUNIX(date) {
    return Math.round(date.getTime() / 1000);
}

// ESECUZIONE FUNZIONI
//loadGenresCache();

module.exports = {
    getFavorites: getFavorites,
    getBest: getBest,
    getPopular: getPopular,
    getHype: getHype,
    getSearched: getSearched,
    getGame: getGame
}