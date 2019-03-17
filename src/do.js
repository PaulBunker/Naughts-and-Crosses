import Board from './board'
import RandomPlayer from './randomPlayer'
import TQPlayer from './tabularQPlayer'
import RandMinMaxPlayer from './randMinMaxPlayer'
import MinMaxPlayer from './minMaxPlayer'
import playGame from './playGame'
import {
  GAME_RESULT,
} from './constants'


const NUM_GAMES = 100

let drawCount = 0
let crossCount = 0
let naughtCount = 0

const board = new Board()
const player1 = new TQPlayer()
const player2 = new RandMinMaxPlayer()

for (let game = 0; game < NUM_GAMES; game++) {
  const result = playGame(board, player1, player2)
  switch (result) {
  case GAME_RESULT.CROSS_WIN:
    crossCount++
    break
  case GAME_RESULT.NAUGHT_WIN:
    naughtCount++
    break
  default:
    drawCount ++
    break
  }
}

const result = `
  After ${NUM_GAMES} games. We have:
  Draws: ${drawCount}
  Cross wins: ${crossCount}
  Naught wins: ${naughtCount}
  Which gives us percentages of:
  draws : cross : naught of about ${Number(drawCount/NUM_GAMES*100).toFixed(2)}% : ${Number(crossCount/NUM_GAMES*100).toFixed(2)}% : ${Number(naughtCount/NUM_GAMES*100).toFixed(2)}%
`

console.log('result',result)

