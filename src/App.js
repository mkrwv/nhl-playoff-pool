import React, { useState, useEffect } from 'react';
import players from './players.json';
import './App.css';

const playoffMatchups = {
  TOR: 'OTT', OTT: 'TOR',
  TBL: 'FLA', FLA: 'TBL',
  WSH: 'MTL', MTL: 'WSH',
  CAR: 'NJD', NJD: 'CAR',
  WPG: 'STL', STL: 'WPG',
  DAL: 'COL', COL: 'DAL',
  VGK: 'MIN', MIN: 'VGK',
  LAK: 'EDM', EDM: 'LAK'
};

const isForward = (pos) => ["C", "L", "R"].includes(pos);
const isDefense = (pos) => pos === "D";

function App() {
  const [myTeam, setMyTeam] = useState([]);
  const [opponentPicks, setOpponentPicks] = useState([]);
  const [teamFilter, setTeamFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('All');
  const [sortKey, setSortKey] = useState('points');
  const [searchText, setSearchText] = useState('');
  const [allPicked, setAllPicked] = useState([]);
  const [opponentSearch, setOpponentSearch] = useState('');
  const [warning, setWarning] = useState('');
  const [pendingPick, setPendingPick] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('nhl-draft');
    if (saved) {
      const parsed = JSON.parse(saved);
      setMyTeam(parsed.myTeam || []);
      setOpponentPicks(parsed.opponentPicks || []);
      setAllPicked(parsed.allPicked || []);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('nhl-draft', JSON.stringify({
      myTeam,
      opponentPicks,
      allPicked
    }));
  }, [myTeam, opponentPicks, allPicked]);

  const myTeamOpposingTeams = new Set(
    myTeam.map(name => players.find(p => p.name === name)?.team)
      .map(team => playoffMatchups[team])
      .filter(Boolean)
  );

  const confirmAddToMyTeam = (name) => {
    if (!allPicked.includes(name)) {
      setMyTeam([...myTeam, name]);
      setAllPicked([...allPicked, name]);
      setWarning('');
      setPendingPick(null);
    }
  };

  const addToMyTeam = (name) => {
    const team = players.find(p => p.name === name)?.team;
    if (myTeamOpposingTeams.has(team)) {
      setWarning(`${name} is on a team facing one of your current picks. Are you sure?`);
      setPendingPick(name);
      return;
    }
    confirmAddToMyTeam(name);
  };

  const addToOpponent = (name) => {
    if (!allPicked.includes(name)) {
      setOpponentPicks([...opponentPicks, name]);
      setAllPicked([...allPicked, name]);
    }
  };

  const removeFromMyTeam = (name) => {
    setMyTeam(myTeam.filter(n => n !== name));
    setAllPicked(allPicked.filter(n => n !== name));
  };

  const removeFromOpponent = (name) => {
    setOpponentPicks(opponentPicks.filter(n => n !== name));
    setAllPicked(allPicked.filter(n => n !== name));
  };

  const filteredPlayers = players
    .filter(p => !allPicked.includes(p.name))
    .filter(p =>
      (teamFilter === '' || p.team === teamFilter) &&
      (positionFilter === 'All' ||
        (positionFilter === 'F' && isForward(p.position)) ||
        (positionFilter === 'D' && isDefense(p.position))) &&
      p.name.toLowerCase().includes(searchText.toLowerCase())
    )
    .sort((a, b) => sortKey === 'ppg' ? b.ppg - a.ppg : b.points - a.points);

  const opponentSuggestions = opponentSearch
    ? players.filter(p =>
      p.name.toLowerCase().includes(opponentSearch.toLowerCase()) &&
      !allPicked.includes(p.name)
    ).slice(0, 5)
    : [];

  const myForwards = myTeam.filter(name => isForward(players.find(p => p.name === name)?.position)).length;
  const myDefense = myTeam.filter(name => isDefense(players.find(p => p.name === name)?.position)).length;

  const getPlayerInfo = (name) => players.find(p => p.name === name);

  return (
    <div className="App">
      <h1>NHL Playoff Draft Helper</h1>

      {warning && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          {warning}
          <div style={{ marginTop: '0.5rem' }}>
            <button onClick={() => confirmAddToMyTeam(pendingPick)}>Yes</button>{' '}
            <button onClick={() => { setWarning(''); setPendingPick(null); }}>No</button>
          </div>
        </div>
      )}

      <div className="filters">
        <select onChange={e => setTeamFilter(e.target.value)} value={teamFilter}>
          <option value=''>All Teams</option>
          {[...new Set(players.map(p => p.team))].sort().map(team => (
            <option key={team} value={team}>{team}</option>
          ))}
        </select>

        <select onChange={e => setPositionFilter(e.target.value)} value={positionFilter}>
          <option value="All">All Positions</option>
          <option value="F">Forwards</option>
          <option value="D">Defense</option>
        </select>

        <select onChange={e => setSortKey(e.target.value)} value={sortKey}>
          <option value="points">Sort by Points</option>
          <option value="ppg">Sort by PPG</option>
        </select>

        <input
          type="text"
          placeholder="Search player..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <div className="columns">
        <div className="column main">
          <h2>Available Players</h2>
          <div className="player-list">
            {filteredPlayers.map(p => {
              const isOpposing = myTeamOpposingTeams.has(p.team);
              return (
                <div key={p.name} className={`player${isOpposing ? ' opposing-player' : ''}`}>
                  <div className="player-info">
                    {p.headshot && <img src={p.headshot} alt="headshot" className="team-logo" />} {p.name} ({p.team}, {p.position}) – {p.points} PTS, {p.ppg} PPG
                  </div>
                  <div className="player-buttons">
                    <button onClick={() => addToMyTeam(p.name)}>My Pick</button>
                    <button onClick={() => addToOpponent(p.name)}>Opponent</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="column sidebar">
          <h2>My Team</h2>
          <p>{myForwards} Forwards / {myDefense} Defense</p>
          <ul className="my-team">
            {myTeam.map(name => {
              const p = getPlayerInfo(name);
              return (
                <li key={name}>
                  {p.headshot && <img src={p.headshot} alt="headshot" className="team-logo" />} {p.name} ({p.team}, {p.position})
                  <button onClick={() => removeFromMyTeam(name)}>✕</button>
                </li>
              );
            })}
          </ul>

          <h2>Opponent Picks</h2>
          <div className="opponent-picks">
            <input
              type="text"
              placeholder="Enter opponent's pick..."
              value={opponentSearch}
              onChange={(e) => setOpponentSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addToOpponent(opponentSearch);
                  setOpponentSearch('');
                }
              }}
            />
            {opponentSuggestions.length > 0 && (
              <ul>
                {opponentSuggestions.map(s => (
                  <li key={s.name} onClick={() => {
                    addToOpponent(s.name);
                    setOpponentSearch('');
                  }}>{s.name}</li>
                ))}
              </ul>
            )}
            <ul>
              {opponentPicks.map(name => {
                const p = getPlayerInfo(name);
                return (
                  <li key={name}>
                    {p.headshot && <img src={p.headshot} alt="headshot" className="team-logo" />} {p.name} ({p.team}, {p.position})
                    <button onClick={() => removeFromOpponent(name)}>✕</button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
