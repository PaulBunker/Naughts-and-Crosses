import {
  GAME_RESULT,
  NAUGHT,
  CROSS,
} from './constants'

export default (board, player1, player2) => {
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

         
  // player1.finalResult(finalResult)
  // player2.finalResult(finalResult)
  return finalResult
}