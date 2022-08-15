const axios = require('axios');
const HttpError = require('../models/http-error');

const API_KEY = process.env.GOOGLE_API_KEY;

 async function getCoordsForAddress(address) {
    // return {
    //     lat: 40.7484445,
    //     lng: -73.9878531,
    //   }
    const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`);
    console.log(response);
    const data = response.data;

    if (!data || data.status === 'ZERO_RESULTS') {
        console.log('No Results')
        const error = new HttpError('Could not get Co-Ords for this place', 422);
        throw error
    }

    const coordinates = data.results[0].geometry.location;

    return coordinates;
 }

 module.exports = getCoordsForAddress;