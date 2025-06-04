import { TuringProgram } from '../src/App.jsx';

describe('TuringProgram', () => {
  test('state transitions and grid updates', () => {
    const transitions = [
      { currentState: 0, currentSymbol: 0, newState: 1, newSymbol: 1, action: 'RIGHT' },
      { currentState: 0, currentSymbol: 1, newState: 0, newSymbol: 0, action: 'DOWN' },
      { currentState: 1, currentSymbol: 0, newState: 1, newSymbol: 0, action: 'LEFT' },
      { currentState: 1, currentSymbol: 1, newState: 0, newSymbol: 0, action: 'UP' },
    ];
    const prog = new TuringProgram(2, 2, 3, 3, 1, 0, 42, transitions);
    prog.heads[0] = { state: 0, x: 1, y: 1 };
    prog.grid.fill(0);

    prog.update(1);

    expect(prog.heads[0].state).toBe(1);
    expect(prog.grid[1 * 3 + 1]).toBe(1);
    expect(prog.heads[0].x).toBe(0);
    expect(prog.heads[0].y).toBe(1);
  });

  test('export and import roundtrip', () => {
    const transitions = [
      { currentState: 0, currentSymbol: 0, newState: 1, newSymbol: 1, action: 'RIGHT' },
      { currentState: 1, currentSymbol: 1, newState: 0, newSymbol: 0, action: 'DOWN' },
    ];
    const prog1 = new TuringProgram(2, 2, 3, 3, 1, 0, 99, transitions);
    prog1.heads[0] = { state: 0, x: 0, y: 2 };
    prog1.grid.fill(0);
    prog1.update(2);

    const exported = prog1.exportToJson();
    const p = exported.parameters;
    const prog2 = new TuringProgram(
      p.numStates,
      p.numSymbols,
      p.width,
      p.height,
      p.numHeads,
      p.headRadius,
      p.seed,
      exported.transitionTable
    );
    prog2.heads[0] = { ...exported.currentHeads[0] };
    prog2.iterations = p.iterations;

    expect(prog2.exportToJson()).toEqual(exported);
  });
});
