const axios = require("axios");

const TEAM_ABBREV = "TOR"; // Try with Toronto Maple Leafs

const getTeamRoster = async (teamAbbrev) => {
  const url = `https://api-web.nhle.com/v1/roster/${teamAbbrev}/current`;
  const res = await axios.get(url);
  return res.data.forwards.concat(res.data.defensemen); // skip goalies
};

const getPlayerStats = async (playerId) => {
  const url = `https://api-web.nhle.com/v1/player/${playerId}/landing`;
  const res = await axios.get(url);

  console.log(`\n=== Player ID: ${playerId} ===`);
  console.log(JSON.stringify(res.data, null, 2)); // dump full structure
};

const run = async () => {
  const roster = await getTeamRoster(TEAM_ABBREV);

  for (let i = 0; i < Math.min(3, roster.length); i++) {
    const player = roster[i];
    console.log(`\n→ Testing: ${player.firstName.default} ${player.lastName.default} (ID ${player.id})`);
    await getPlayerStats(player.id);
    break; // remove break to test more
  }
};

run();
