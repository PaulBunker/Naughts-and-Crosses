import Board from './board'
import RandomPlayer from './randomPlayer'
import playGame from './playGame'
import {
  CROSS,
  NAUGHT,
} from './constants'

const board = new Board()
const player1 = new RandomPlayer()
const player2 = new RandomPlayer()

playGame(board, player1, player2)

