import {
  GAME_RESULT,
  NAUGHT,
  CROSS,
} from './constants'

export default async(board, player1, player2) => {
  player1.newGame(CROSS)
  player2.newGame(NAUGHT)
  board.reset()

  let finished = false
  let finalResult
  let result

  while(!finished){
    [result, finished] = player1.move(board)
    if(finished){
      if(result === GAME_RESULT.DRAW) {
        finalResult = GAME_RESULT.DRAW
      } else {
        finalResult = GAME_RESULT.CROSS_WIN
      }
    } else {
      [result, finished] = player2.move(board)
      if(finished){
        if(result === GAME_RESULT.DRAW) {
          finalResult = GAME_RESULT.DRAW
        } else {
          finalResult = GAME_RESULT.NAUGHT_WIN
        }
      }
    }
  }

  await player2.finalResult(finalResult)
  await player1.finalResult(finalResult)



  return finalResult
}
