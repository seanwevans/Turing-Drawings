import React, { memo } from 'react';

const Controls = memo(({
  numStates, setNumStates,
  numSymbols, setNumSymbols,
  numHeads, setNumHeads,
  headRadius, setHeadRadius,
  speed, setSpeed,
  seed, setSeed,
  generateNewSeed,
  isRunning, toggleRunning,
  step, reset,
  exportToJson, showTransitionTable,
  setShowTransitionTable, fileInputRef
}) => {
  return (
    <>
      <div className="mb-4 flex gap-4 flex-wrap justify-center">
        <div className="flex flex-col">
          <label className="mb-1">Number of States:</label>
          <input
            type="number"
            min="2"
            max="128"
            value={numStates}
            onChange={(e) => setNumStates(Number(e.target.value))}
            className="p-2 border rounded"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1">Number of Symbols:</label>
          <input
            type="number"
            min="2"
            max="128"
            value={numSymbols}
            onChange={(e) => setNumSymbols(Number(e.target.value))}
            className="p-2 border rounded"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1">Number of Heads:</label>
          <input
            type="number"
            min="1"
            max="1024"
            value={numHeads}
            onChange={(e) => setNumHeads(Number(e.target.value))}
            className="p-2 border rounded"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1">Head Radius:</label>
          <input
            type="number"
            min="0.01"
            max="1"
            step="0.01"
            value={headRadius}
            onChange={(e) => setHeadRadius(Number(e.target.value))}
            className="p-2 border rounded"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1">Speed (ms per step):</label>
          <input
            type="number"
            min="0"
            max="1000"
            step="10"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="p-2 border rounded"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1">Seed:</label>
          <div className="flex">
            <input
              type="number"
              min="0"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
              className="p-2 border rounded"
            />
            <button
              onClick={generateNewSeed}
              className="ml-2 px-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              title="Generate new random seed"
            >
              🎲
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-4 flex-wrap justify-center">
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reset
        </button>

        <button
          onClick={toggleRunning}
          className={`px-4 py-2 ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded`}
        >
          {isRunning ? 'Stop' : 'Start'}
        </button>

        <button
          onClick={step}
          disabled={isRunning}
          className={`px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Step
        </button>

        <button
          onClick={exportToJson}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Export JSON
        </button>

        <button
          onClick={() => fileInputRef.current.click()}
          className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
        >
          Load JSON
        </button>

        <button
          onClick={() => setShowTransitionTable(!showTransitionTable)}
          className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
        >
          {showTransitionTable ? 'Hide Transition Table' : 'Show Transition Table'}
        </button>
      </div>
    </>
  );
});

export default Controls;
