const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { response } = require('./app');
const GRANT_TYPE = "client_credentials";
const file_name = "IGDB_credentials.json"; // Replace with the actual file path
const file_path = path.join(__dirname, file_name);
const encoding = 'utf8'; // Specify the file encoding (e.g., utf8)

let access_token;
let client_id;
let credentials;

async function auth_to_twitch() {
  let json_data;
  // lettura del file con le credenziali     
  try {
    const fileContent = fs.readFileSync(file_path, encoding);
    console.log('File content:', fileContent);
    json_data = JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading the file:', error);
  }
   
  try {
    // Set the URL for the HTTP request
    const url = 'https://id.twitch.tv/oauth2/token'; // Replace with the actual API endpoint

    const data = {
        client_id: json_data.client_id,
        client_secret: json_data.client_secret,
        grant_type: GRANT_TYPE
      }

    // Make the HTTP POST request
    const response = await axios.post(url, data);

    // Handle the response data
    console.log('Response data:', response.data);

    // mi salvo i dati dal json di risposta che mi servono per dopo
    access_token = response.data.access_token;
    client_id = json_data.client_id;

    credentials = { client_id: json_data.client_id, access_token: response.data.access_token };

    /*
    credentials = new Object();
    credentials.client_id = json_data.client_id;
    credentials.access_token = response.data.access_token;
    */

  } catch (error) {
    // Handle any errors that occurred during the HTTP request
    console.error('Error:', error.message);
  }
  return credentials;
}

module.exports = {
  auth_to_twitch: auth_to_twitch,
  access_token: access_token,
  client_id: client_id
}



//exports.client_id = client_id;
//exports.access_token = access_token;
//exports.getClientID = getClientID;
//exports.getAccessToken = getAccessToken;
//exports.do_auth_to_twitch = do_auth_to_twitch;