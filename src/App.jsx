import { useState, useEffect, useRef } from 'react'

const SNAKES = {
  16: 6, 46: 25, 49: 11, 62: 19, 64: 60,
  74: 53, 89: 68, 92: 88, 95: 75, 99: 80
}

const LADDERS = {
  2: 38, 7: 14, 8: 31, 15: 26, 21: 42,
  28: 84, 36: 44, 51: 67, 71: 91, 78: 98
}

const COLORS = ['#C41E3A', '#1E90FF', '#228B22', '#FF8C00']

const DOTS = {
  1: [[1, 1]],
  2: [[0, 2], [2, 0]],
  3: [[0, 2], [1, 1], [2, 0]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]]
}

const LANG = {
  en: {
    title: 'Paramapadham',
    subtitle: 'Snakes & Ladders',
    chooseMode: 'Choose Mode',
    players2: '2 Players',
    players3: '3 Players',
    players4: '4 Players',
    vsComp: 'Vs Computer',
    enterNames: 'Enter Player Names',
    player: 'Player',
    computer: 'Computer',
    start: 'Start Game',
    roll: 'Roll Dice',
    pos: 'Position',
    winner: 'Winner!',
    newGame: 'New Game',
    restart: 'Restart',
    pause: 'Pause',
    resume: 'Resume',
    snakeMsg: 'Snake!',
    ladderMsg: 'Ladder!',
    exact: 'Need exact roll to reach 100!',
    lang: 'தமிழ்',
    paused: 'Game Paused',
    turn: 'Turn',
    legend: '🐍 Snake &nbsp;&nbsp; 🪜 Ladder',
    rollHistory: 'Roll History'
  },
  ta: {
    title: 'படிப்பாதம்',
    subtitle: 'பாம்பும் படிக்கட்டும்',
    chooseMode: 'விளையாட்டு முறை',
    players2: '2 வீரர்கள்',
    players3: '3 வீரர்கள்',
    players4: '4 வீரர்கள்',
    vsComp: 'கணினிக்கு எதிராக',
    enterNames: 'வீரர் பெயர்கள்',
    player: 'வீரர்',
    computer: 'கணினி',
    start: 'தொடங்கு',
    roll: 'பக்கா எறி',
    pos: 'நிலை',
    winner: 'வெற்றி!',
    newGame: 'புதிய விளையாட்டு',
    restart: 'மீண்டும்',
    pause: 'இடைநிறுத்து',
    resume: 'தொடர்',
    snakeMsg: 'பாம்பு!',
    ladderMsg: 'படிக்கட்டு!',
    exact: '100 செல்ல சரியான எண் வேண்டும்!',
    lang: 'English',
    paused: 'விளையாட்டு நிறுத்தப்பட்டது',
    turn: 'முறை',
    legend: '🐍 பாம்பு &nbsp;&nbsp; 🪜 படிக்கட்டு',
    rollHistory: 'பக்கா வரலாறு'
  }
}

function getDisplay(num) {
  const row = Math.floor((num - 1) / 10)
  const col = (num - 1) % 10
  return {
    row: 9 - row,
    col: row % 2 === 0 ? col : 9 - col
  }
}

const boardGrid = (() => {
  const g = Array.from({ length: 10 }, () => Array(10).fill(0))
  for (let n = 1; n <= 100; n++) {
    const d = getDisplay(n)
    g[d.row][d.col] = n
  }
  return g
})()

function Dice({ value, rolling }) {
  const dots = value ? DOTS[value] : []
  return (
    <div className={`dice ${rolling ? 'rolling' : ''}`}>
      <div className="dice-face">
        {rolling
          ? <span style={{ fontSize: '1.8rem', gridArea: '1/1/4/4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎲</span>
          : value
            ? dots.map((d, i) => (
              <div key={i} className={`dot dot-r${d[0]}-c${d[1]}`} />
            ))
            : <span className="dice-q">?</span>
        }
      </div>
    </div>
  )
}

export default function App() {
  const [lang, setLang] = useState('en')
  const [phase, setPhase] = useState('setup')
  const [mode, setMode] = useState(null)
  const [numPlayers, setNumPlayers] = useState(2)
  const [names, setNames] = useState(['', '', '', ''])
  const [players, setPlayers] = useState([])
  const [turn, setTurn] = useState(0)
  const [dice, setDice] = useState(null)
  const [animating, setAnimating] = useState(false)
  const [winner, setWinner] = useState(null)
  const [msg, setMsg] = useState('')
  const [paused, setPaused] = useState(false)
  const [rolling, setRolling] = useState(false)
  const [rollHistory, setRollHistory] = useState([])

  const timers = useRef([])
  const stateRef = useRef({ turn: 0, players: [], animating: false, paused: false, winner: null })
  const gameRef = useRef({})

  const t = LANG[lang]

  useEffect(() => {
    stateRef.current = { turn, players, animating, paused, winner }
  }, [turn, players, animating, paused, winner])

  useEffect(() => {
    return () => timers.current.forEach(clearTimeout)
  }, [])

  const addTimer = (fn, delay) => {
    const id = setTimeout(fn, delay)
    timers.current.push(id)
    return id
  }

  const clearAllTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  const makePlayers = () => {
    const count = mode === 'comp' ? 2 : numPlayers
    return Array.from({ length: count }, (_, i) => ({
      name: mode === 'comp' && i === 1
        ? (names[1] || t.computer)
        : (names[i] || `${t.player} ${i + 1}`),
      position: 0,
      color: COLORS[i],
      isComputer: mode === 'comp' && i === 1
    }))
  }

  gameRef.current = {
    doRoll() {
      const s = stateRef.current
      if (s.animating || s.paused || s.winner !== null) return
      setAnimating(true)
      setRolling(true)
      const result = Math.floor(Math.random() * 6) + 1
      addTimer(() => {
        setDice(result)
        setRolling(false)
        setRollHistory(h => [{
          id: Date.now() + Math.random(),
          player: s.players[s.turn].name,
          color: s.players[s.turn].color,
          value: result
        }, ...h].slice(0, 6))
        addTimer(() => {
          gameRef.current.executeMove(result)
        }, 500)
      }, 400)
    },

    executeMove(diceVal) {
      const s = stateRef.current
      const currentTurn = s.turn
      const newPos = s.players[currentTurn].position + diceVal

      if (newPos > 100) {
        setMsg(t.exact)
        addTimer(() => {
          setMsg('')
          setAnimating(false)
          setTurn(p => (p + 1) % s.players.length)
        }, 1500)
        return
      }

      if (newPos === 100) {
        setPlayers(prev => {
          const u = [...prev]
          u[currentTurn] = { ...u[currentTurn], position: 100 }
          return u
        })
        setWinner(currentTurn)
        setAnimating(false)
        return
      }

      let step = s.players[currentTurn].position
      const target = newPos

      const doStep = () => {
        step++
        setPlayers(prev => {
          const u = [...prev]
          u[currentTurn] = { ...u[currentTurn], position: step }
          return u
        })
        if (step < target) {
          addTimer(doStep, 150)
        } else {
          addTimer(() => gameRef.current.checkLanding(step, currentTurn), 200)
        }
      }
      doStep()
    },

    checkLanding(pos, currentTurn) {
      const s = stateRef.current
      if (LADDERS[pos]) {
        setMsg(t.ladderMsg)
        addTimer(() => {
          setPlayers(prev => {
            const u = [...prev]
            u[currentTurn] = { ...u[currentTurn], position: LADDERS[pos] }
            return u
          })
          setMsg('')
          if (LADDERS[pos] === 100) {
            addTimer(() => {
              setWinner(currentTurn)
              setAnimating(false)
            }, 400)
          } else {
            addTimer(() => {
              setAnimating(false)
              setTurn(p => (p + 1) % s.players.length)
            }, 400)
          }
        }, 800)
      } else if (SNAKES[pos]) {
        setMsg(t.snakeMsg)
        addTimer(() => {
          setPlayers(prev => {
            const u = [...prev]
            u[currentTurn] = { ...u[currentTurn], position: SNAKES[pos] }
            return u
          })
          setMsg('')
          addTimer(() => {
            setAnimating(false)
            setTurn(p => (p + 1) % s.players.length)
          }, 400)
        }, 800)
      } else {
        setAnimating(false)
        setTurn(p => (p + 1) % s.players.length)
      }
    },

    startGame() {
      setPlayers(makePlayers())
      setTurn(0)
      setDice(null)
      setAnimating(false)
      setWinner(null)
      setMsg('')
      setPaused(false)
      setRolling(false)
      setRollHistory([])
      setPhase('playing')
    },

    restart() {
      clearAllTimers()
      setPlayers(makePlayers())
      setTurn(0)
      setDice(null)
      setAnimating(false)
      setWinner(null)
      setMsg('')
      setPaused(false)
      setRolling(false)
      setRollHistory([])
    },

    newGame() {
      clearAllTimers()
      setPhase('setup')
      setPlayers([])
      setTurn(0)
      setDice(null)
      setAnimating(false)
      setWinner(null)
      setMsg('')
      setPaused(false)
      setRolling(false)
      setRollHistory([])
    },

    togglePause() {
      if (stateRef.current.animating) return
      setPaused(p => !p)
    }
  }

  useEffect(() => {
    if (phase !== 'playing' || paused || winner !== null || animating) return
    const p = players[turn]
    if (p && p.isComputer) {
      const id = setTimeout(() => gameRef.current.doRoll(), 1000)
      return () => clearTimeout(id)
    }
  }, [turn, phase, paused, winner, animating, players])

  if (phase === 'setup') {
    return (
      <div className="app">
        <div className="setup">
          <div className="setup-hero" aria-hidden="true">
            <span>🎲</span>
          </div>
          <h1 className="title">{t.title}</h1>
          <p className="subtitle">{t.subtitle}</p>
          <button className="lang-btn" onClick={() => setLang(l => l === 'en' ? 'ta' : 'en')}>
            {t.lang}
          </button>
          <div className="setup-section">
            <h2>{t.chooseMode}</h2>
            <div className="mode-buttons">
              <button className={`mode-btn ${mode === '2p' ? 'active' : ''}`}
                onClick={() => { setMode('2p'); setNumPlayers(2) }}>
                {t.players2}
              </button>
              <button className={`mode-btn ${mode === '3p' ? 'active' : ''}`}
                onClick={() => { setMode('3p'); setNumPlayers(3) }}>
                {t.players3}
              </button>
              <button className={`mode-btn ${mode === '4p' ? 'active' : ''}`}
                onClick={() => { setMode('4p'); setNumPlayers(4) }}>
                {t.players4}
              </button>
              <button className={`mode-btn ${mode === 'comp' ? 'active' : ''}`}
                onClick={() => { setMode('comp'); setNumPlayers(2) }}>
                {t.vsComp}
              </button>
            </div>
          </div>
          {mode && (
            <div className="setup-section">
              <h2>{t.enterNames}</h2>
              <div className="name-inputs">
                {Array.from({ length: mode === 'comp' ? 1 : numPlayers }, (_, i) => (
                  <div key={i} className="name-row">
                    <label style={{ color: COLORS[i] }}>{t.player} {i + 1}</label>
                    <input
                      type="text"
                      placeholder={`${t.player} ${i + 1}`}
                      value={names[i]}
                      onChange={e => {
                        const n = [...names]
                        n[i] = e.target.value
                        setNames(n)
                      }}
                      maxLength={15}
                    />
                  </div>
                ))}
                {mode === 'comp' && (
                  <div className="name-row">
                    <label style={{ color: COLORS[1] }}>{t.computer}</label>
                    <input disabled value={t.computer} />
                  </div>
                )}
              </div>
            </div>
          )}
          {mode && (
            <button className="start-btn" onClick={() => gameRef.current.startGame()}>
              {t.start}
            </button>
          )}
          <p className="setup-note" dangerouslySetInnerHTML={{ __html: t.legend }} />
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="game-header">
        <h1 className="title small">{t.title}</h1>
        <button className="lang-btn small" onClick={() => setLang(l => l === 'en' ? 'ta' : 'en')}>
          {t.lang}
        </button>
      </header>
      <div className="game-layout">
        <div className="board-wrapper">
          <div className="board">
            {boardGrid.map((row, ri) => (
              <div key={ri} className="board-row">
                {row.map((num, ci) => {
                  const isSnake = !!SNAKES[num]
                  const isLadder = !!LADDERS[num]
                  return (
                    <div key={num}
                      className={[
                        'cell',
                        (num % 2 === 0) ? 'alt' : '',
                        isSnake ? 'snake-cell' : '',
                        isLadder ? 'ladder-cell' : ''
                      ].join(' ')}>
                      <span className="cell-num">{num}</span>
                      {isSnake && <span className="cell-icon">🐍</span>}
                      {isLadder && <span className="cell-icon">🪜</span>}
                      <div className="cell-tokens">
                        {players.map((p, i) => p.position === num && p.position > 0 ? (
                          <div key={i}
                            className={`token ${turn === i ? 'active-token' : ''}`}
                            style={{ backgroundColor: p.color }}
                            title={p.name}>
                            {p.name[0]}
                          </div>
                        ) : null)}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
          <div className="board-legend" dangerouslySetInnerHTML={{ __html: t.legend }} />
        </div>
        <div className="side-panel">
          <div className="current-turn">
            <span className="turn-label">{t.turn}:</span>
            <span className="turn-name" style={{ color: players[turn]?.color }}>
              {players[turn]?.name}
            </span>
          </div>
          <Dice value={dice} rolling={rolling} />
          <button className="roll-btn"
            onClick={() => gameRef.current.doRoll()}
            disabled={animating || paused || winner !== null || players[turn]?.isComputer}>
            {t.roll}
          </button>
          <div className="message">{msg || '\u00A0'}</div>
          {rollHistory.length > 0 && (
            <div className="roll-history">
              <div className="roll-history-title">{t.rollHistory}</div>
              <div className="roll-history-list">
                {rollHistory.map((r) => (
                  <div key={r.id} className="roll-row">
                    <span className="roll-player" style={{ color: r.color }}>{r.player}</span>
                    <span className="roll-value">🎲 {r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="player-list">
            {players.map((p, i) => (
              <div key={i} className={`player-card ${turn === i ? 'active-card' : ''}`}>
                <div className="player-dot" style={{ backgroundColor: p.color }} />
                <div className="player-info">
                  <span className="player-name">{p.name}</span>
                  <span className="player-pos">{t.pos}: {p.position}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="controls">
            <button className="ctrl-btn" onClick={() => gameRef.current.togglePause()}
              disabled={winner !== null || animating}>
              {paused ? t.resume : t.pause}
            </button>
            <button className="ctrl-btn" onClick={() => gameRef.current.restart()}>
              {t.restart}
            </button>
            <button className="ctrl-btn" onClick={() => gameRef.current.newGame()}>
              {t.newGame}
            </button>
          </div>
        </div>
      </div>
      {paused && !winner && (
        <div className="overlay" onClick={() => gameRef.current.togglePause()}>
          <div className="overlay-box" onClick={e => e.stopPropagation()}>
            <h2>{t.paused}</h2>
            <button className="start-btn" onClick={() => gameRef.current.togglePause()}>
              {t.resume}
            </button>
          </div>
        </div>
      )}
      {winner !== null && (
        <div className="overlay">
          <div className="overlay-box">
            <h2>{t.winner}</h2>
            <div className="winner-name" style={{ color: players[winner]?.color }}>
              {players[winner]?.name}
            </div>
            <div className="winner-scores">
              {players.map((p, i) => (
                <div key={i} className="winner-score" style={{ backgroundColor: p.color }}>
                  {p.name}: {p.position}
                </div>
              ))}
            </div>
            <div className="overlay-buttons">
              <button className="start-btn" onClick={() => gameRef.current.restart()}>
                {t.restart}
              </button>
              <button className="start-btn" onClick={() => gameRef.current.newGame()}>
                {t.newGame}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
