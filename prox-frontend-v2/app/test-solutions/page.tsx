'use client';

import { problems } from '../../lib/mockData';

export default function TestSolutions() {
  // Get the first problem with solutions
  const testProblem = problems.find(p => p.solutions && p.solutions.length > 0);
  
  if (!testProblem) {
    return <div>No problems found with solutions</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Solution Images Test</h1>
        <p className="text-neutral-600 mb-8">
          Testing problem: <strong>{testProblem.name}</strong>
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {testProblem.solutions.map((solution) => (
            <div key={solution.id} className="bg-white rounded-lg overflow-hidden shadow-sm">
              <div className="h-32 w-full">
                {solution.image ? (
                  <img 
                    src={solution.image} 
                    alt={solution.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Image failed to load:', solution.image);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                    onLoad={() => console.log('Image loaded:', solution.image)}
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
                    <span className="text-neutral-400 text-xs">No Image</span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="text-sm font-medium text-neutral-900 mb-1">
                  {solution.name}
                </h3>
                <p className="text-xs text-neutral-500">
                  Image: {solution.image ? '✅ Has image' : '❌ No image'}
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  Path: {solution.image || 'None'}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 bg-white p-4 rounded-lg">
          <h2 className="font-medium mb-2">Debug Info:</h2>
          <p>Problem ID: {testProblem.id}</p>
          <p>Solutions count: {testProblem.solutions.length}</p>
          <p>Solutions with images: {testProblem.solutions.filter(s => s.image).length}</p>
        </div>
      </div>
    </div>
  );
}