# Balloon Pop

Pop the balloons as they float up from the bottom of the booth, before they
drift away over the top.

## How to play

- Click a balloon to pop it. A new balloon floats up every 0.6 seconds.
- A round lasts 30 seconds. Balloons that float off the top are gone, and score nothing.
- Click again on the game over screen to play another round.

## Scoring

Smaller balloons rise faster and are worth more:

| Size   | Radius | Speed    | Points |
| ------ | ------ | -------- | ------ |
| Small  | 18 px  | 150 px/s | 30     |
| Medium | 26 px  | 110 px/s | 20     |
| Large  | 34 px  | 80 px/s  | 10     |

A missed click costs nothing. Your final score is saved to the carnival's score
board when the timer runs out.

## Files

- `game.ts`: the game logic (`createState`, `spawnBalloon`, `popAt`, `step`) and
  the `balloonPop` entry, the default export the midway finds.
- `game.test.ts`: tests for the game logic.
