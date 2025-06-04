import React, { memo } from 'react';

const TransitionTable = memo(({ transitionData }) => {
  return (
    <div className="mb-4 w-full max-w-4xl overflow-x-auto">
      <h2 className="text-xl font-bold mb-2">Transition Table</h2>
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="py-2 px-4 border border-gray-300">Current State</th>
            <th className="py-2 px-4 border border-gray-300">Current Symbol</th>
            <th className="py-2 px-4 border border-gray-300">New State</th>
            <th className="py-2 px-4 border border-gray-300">New Symbol</th>
            <th className="py-2 px-4 border border-gray-300">Action</th>
          </tr>
        </thead>
        <tbody>
          {transitionData.map((transition, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
              <td className="py-2 px-4 border border-gray-300 text-center">{transition.state}</td>
              <td className="py-2 px-4 border border-gray-300 text-center">{transition.symbol}</td>
              <td className="py-2 px-4 border border-gray-300 text-center">{transition.newState}</td>
              <td className="py-2 px-4 border border-gray-300 text-center">{transition.newSymbol}</td>
              <td className="py-2 px-4 border border-gray-300 text-center">{transition.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default TransitionTable;
