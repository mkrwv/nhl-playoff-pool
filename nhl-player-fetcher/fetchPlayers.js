const axios = require("axios");
const fs = require("fs");

// 2025 Playoff Teams (abbreviations)
const playoffTeams = [
  "TOR", "OTT", "TBL", "FLA",
  "WSH", "MTL", "CAR", "NJD",
  "WPG", "STL", "DAL", "COL",
  "VGK", "MIN", "LAK", "EDM"
];

// Map of abbreviations to team names (for logging)
const teamNames = {
  TOR: "Toronto Maple Leafs",
  OTT: "Ottawa Senators",
  TBL: "Tampa Bay Lightning",
  FLA: "Florida Panthers",
  WSH: "Washington Capitals",
  MTL: "Montreal Canadiens",
  CAR: "Carolina Hurricanes",
  NJD: "New Jersey Devils",
  WPG: "Winnipeg Jets",
  STL: "St. Louis Blues",
  DAL: "Dallas Stars",
  COL: "Colorado Avalanche",
  VGK: "Vegas Golden Knights",
  MIN: "Minnesota Wild",
  LAK: "Los Angeles Kings",
  EDM: "Edmonton Oilers"
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getTeamRoster = async (abbrev) => {
  const url = `https://api-web.nhle.com/v1/roster/${abbrev}/current`;
  const res = await axios.get(url);
  const roster = res.data.forwards.concat(res.data.defensemen); // skip goalies
  return roster;
};

const getPlayerStats = async (playerId) => {
    const url = `https://api-web.nhle.com/v1/player/${playerId}/landing`;
  
    try {
      const res = await axios.get(url);
      const player = res.data;
  
      const firstName = player.firstName?.default || player.firstName || "Unknown";
      const lastName = player.lastName?.default || player.lastName || "Unknown";
      const team = player.currentTeamAbbrev || player.currentTeam?.abbrev || "N/A";
      const position = player.position || "N/A";
  
      const seasonStats = player.featuredStats?.regularSeason?.subSeason;
      const careerStats = player.featuredStats?.regularSeason?.career;
  
      const stats = seasonStats?.gamesPlayed ? seasonStats : careerStats;
  
      if (!stats || !stats.gamesPlayed || !stats.points) {
        throw new Error(`${firstName} ${lastName} — no usable stats`);
      }
  
      return {
        name: `${firstName} ${lastName}`,
        team,
        position,
        points: stats.points,
        gamesPlayed: stats.gamesPlayed,
        ppg: parseFloat((stats.points / stats.gamesPlayed).toFixed(2))
      };
  
    } catch (err) {
      throw new Error(`Skipping player ${playerId}: ${err.message}`);
    }
  };
  
const run = async () => {
  const allPlayers = [];

  for (const team of playoffTeams) {
    try {
      console.log(`\n📋 Fetching roster for ${teamNames[team]}...`);
      const roster = await getTeamRoster(team);

      for (const player of roster) {
        try {
          console.log(`→ ${player.firstName.default} ${player.lastName.default} (ID ${player.id})`);
          const stats = await getPlayerStats(player.id);
          allPlayers.push(stats);
          await sleep(250);
        } catch (err) {
          console.warn(`⚠️ ${err.message}`);
        }
      }

      await sleep(500);
    } catch (err) {
      console.error(`❌ Failed to fetch roster for ${team}:`, err.message);
    }
  }

  fs.writeFileSync("players.json", JSON.stringify(allPlayers, null, 2));
  console.log(`\n✅ Done! Saved ${allPlayers.length} players to players.json`);
};

run();
