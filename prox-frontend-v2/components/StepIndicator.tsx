'use client';

interface StepIndicatorProps {
  mode: 'problem' | 'explore' | null;
  currentStep: 1 | 2 | 3 | 4;
  stepLabels?: {
    step2: string;
    step3: string;
  };
  skipRefineStep?: boolean;
  onStepClick?: (step: number) => void;
  onStartOver?: () => void;
  onBack?: () => void;
  canGoBack?: boolean;
}

export default function StepIndicator({ mode, currentStep, stepLabels, skipRefineStep, onStepClick, onStartOver, onBack, canGoBack }: StepIndicatorProps) {
  if (mode === 'explore') {
    return (
      <div className="bg-neutral-100 rounded-lg px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span>🔍</span>
            <span className="font-medium text-neutral-700">Explore Mode</span>
          </div>
          {canGoBack && onBack && (
            <button
              onClick={onBack}
              className="text-sm text-neutral-500 hover:text-neutral-700 flex items-center gap-1"
            >
              ← Back
            </button>
          )}
        </div>
      </div>
    );
  }

  if (mode !== 'problem') return null;

  const steps = skipRefineStep 
    ? [
        { num: 1, label: 'Problem' },
        { num: 2, label: stepLabels?.step2 || 'Product Type' },
        { num: 3, label: 'Products' },  // Skip refine, renumber to 3
      ]
    : [
        { num: 1, label: 'Problem' },
        { num: 2, label: stepLabels?.step2 || 'Product Type' },
        { num: 3, label: stepLabels?.step3 || 'Refine' },
        { num: 4, label: 'Products' },
      ];

  return (
    <div className="bg-neutral-100 rounded-lg px-4 py-2">
      <div className="flex items-center justify-between">
        {/* Steps - Simple text with arrows */}
        <div className="flex items-center gap-1 text-sm">
          {steps.map((step, idx) => {
            // Map displayed step numbers to actual step numbers
            const actualStep = skipRefineStep && step.num === 3 ? 4 : step.num;
            const isCurrentStep = skipRefineStep 
              ? (currentStep === 4 && step.num === 3) || (currentStep === step.num)
              : currentStep === step.num;
            const isCompletedStep = skipRefineStep
              ? (currentStep === 4 && step.num <= 2) || (currentStep > step.num && step.num < 3)
              : currentStep > step.num;
            
            return (
              <div key={step.num} className="flex items-center">
                <button
                  onClick={() => isCompletedStep && onStepClick?.(actualStep)}
                  disabled={!isCompletedStep}
                  className={`px-2 py-1 rounded transition-all ${
                    isCompletedStep
                      ? 'text-neutral-600 hover:text-neutral-800 cursor-pointer hover:underline'
                      : isCurrentStep
                      ? 'text-neutral-900 font-semibold'
                      : 'text-neutral-400'
                  }`}
                >
                  {step.label}
                </button>
                {idx < steps.length - 1 && (
                  <span className="text-neutral-300 mx-1">→</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Back button */}
        {canGoBack && onBack && (
          <button
            onClick={onBack}
            className="text-sm text-neutral-500 hover:text-neutral-700 flex items-center gap-1"
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}