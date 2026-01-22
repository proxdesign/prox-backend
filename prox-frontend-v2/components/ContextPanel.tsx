'use client';

interface ContextItem {
  space?: string;
  challenge?: string;
  size?: string;
  style?: string;
  budget?: string;
}

interface ContextPanelProps {
  context: ContextItem;
}

export default function ContextPanel({ context }: ContextPanelProps) {
  const contextItems = [
    { key: 'space', label: 'Space', value: context.space },
    { key: 'challenge', label: 'Challenge', value: context.challenge },
    { key: 'size', label: 'Size', value: context.size },
    { key: 'style', label: 'Style', value: context.style },
    { key: 'budget', label: 'Budget', value: context.budget },
  ];

  const filledCount = contextItems.filter(item => item.value).length;
  const completionPercentage = (filledCount / contextItems.length) * 100;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 h-fit">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Understanding your needs</h3>
        <p className="text-sm text-gray-600">
          I'm gathering information to find the perfect solutions for you.
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {contextItems.map((item) => (
          <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
            <span className="text-sm font-medium text-gray-700">{item.label}</span>
            <div className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              item.value
                ? 'bg-sage-100 text-sage-700 border border-sage-200'
                : 'bg-gray-50 text-gray-400 border border-gray-200'
            }`}>
              {item.value || 'Not specified'}
            </div>
          </div>
        ))}
      </div>

      {/* Progress Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-500">{filledCount}/5 complete</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-sage-500 to-sage-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        
        {filledCount === contextItems.length && (
          <div className="flex items-center gap-2 text-sage-600 text-sm font-medium animate-fadeIn">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Ready to find solutions!
          </div>
        )}
      </div>
    </div>
  );
}