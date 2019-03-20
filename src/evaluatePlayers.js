import plt from 'matplotnode'
import Board from './board'
import RandomPlayer from './randomPlayer'
import TQPlayer from './tabularQPlayer'
import RandMinMaxPlayer from './randMinMaxPlayer'
import MinMaxPlayer from './minMaxPlayer'
import NNQPlayer from './NNQPlayer'
import playGame from './playGame'
import {
  GAME_RESULT,
} from './constants'



const evaluatePlayers = (player1, player2, numBattles, gamesPerBattle) => {
  const p1Wins = []
  const p2Wins = []
  const draws = []
  const count = []

  for (let i = 0; i < numBattles; i++) {
    const [p1win, p2win, draw] = battle(player1, player2, gamesPerBattle)
    p1Wins.push(p1win*100.0/gamesPerBattle)
    p2Wins.push(p2win*100.0/gamesPerBattle)
    draws.push(draw*100.0/gamesPerBattle)
    count.push((i)*gamesPerBattle)

    p1Wins.push(p1win*100.0/gamesPerBattle)
    p2Wins.push(p2win*100.0/gamesPerBattle)
    draws.push(draw*100.0/gamesPerBattle)
    count.push((i+1)*gamesPerBattle)

  }
  plt.ylabel('Game outcomes in %')
  plt.xlabel('Game number')

  plt.ylim(-10, 110)
  plt.plot(count, draws, 'r-', 'label=Draw')
  plt.plot(count, p1Wins, 'g-', 'label=Player 1 wins')
  plt.plot(count, p2Wins, 'b-', 'label=Player 2 wins')
  plt.legend('loc=best', 'shadow=True', 'fancybox=True', 'framealpha = 0.7')
  plt.show()
}

const battle = (player1, player2, numGames=100) => {
  const board = new Board()
  let drawCount = 0
  let crossCount = 0
  let naughtCount = 0

  for (let game = 0; game < numGames; game++) {
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

  return [crossCount, naughtCount, drawCount]
}

const player1 = new NNQPlayer()
const player2 = new RandomPlayer()
evaluatePlayers(player1, player2, 10, 20)
