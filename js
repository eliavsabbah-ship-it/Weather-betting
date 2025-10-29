// Node script (requires pg, csv-parse)
const fs = require('fs');
const { Client } = require('pg');
const parse = require('csv-parse');

async function importGeonames(filePath) {
  const client = new Client();
  await client.connect();
  const stream = fs.createReadStream(filePath);
  // GeoNames allCountries.txt is tab-delimited with defined columns.
  const parser = parse({ delimiter: '\t' });
  stream.pipe(parser);
  for await (const row of parser) {
    // columns: geonameid, name, asciiname, alternatenames, lat, lon, feature class, feature code,
    // country code, cc2, admin1, admin2, admin3, admin4, population, elevation, dem, timezone, modification date
    const [geonameid, name, , , lat, lon, , , countryCode, , admin1, , , , population, , , timezone] = row;
    // insert (you can batch for speed)
    await client.query(
      `INSERT INTO cities (geoname_id,name,admin1,country,lat,lon,population,timezone)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING`,
      [geonameid, name, admin1, countryCode, lat, lon, population || null, timezone || null]
    );
  }
  await client.end();
}
// run with: node import_geonames.js /path/to/allCountries.txt
