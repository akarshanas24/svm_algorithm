import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronLeft, BookOpen, Calculator, Target, Zap } from "lucide-react";

interface MathStep {
  id: string;
  title: string;
  concept: string;
  formula: string;
  explanation: string;
  whyUseful: string;
  visualNote: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
}

const mathematicalSteps: MathStep[] = [
  {
    id: "hyperplane",
    title: "Hyperplane Equation",
    concept: "Linear Decision Boundary",
    formula: "w₁x₁ + w₂x₂ + b = 0",
    explanation: "A hyperplane in 2D is a line that separates our feature space. The weight vector w = [w₁, w₂] determines the orientation, while bias b controls position.",
    whyUseful: "This linear equation creates our decision boundary. Points on one side belong to class +1, points on the other side belong to class -1.",
    visualNote: "The hyperplane appears as the blue line in our visualization",
    difficulty: "basic"
  },
  {
    id: "margin",
    title: "Margin Width Calculation",
    concept: "Maximum Margin Principle",
    formula: "Margin = 2/||w|| = 2/√(w₁² + w₂²)",
    explanation: "The margin is the distance between the hyperplane and the closest data points (support vectors). SVM maximizes this margin for better generalization.",
    whyUseful: "Maximizing margin reduces overfitting and improves model performance on unseen data. It's the core principle that makes SVM effective.",
    visualNote: "Green dashed lines show the margin boundaries",
    difficulty: "intermediate"
  },
  {
    id: "distance",
    title: "Point-to-Hyperplane Distance",
    concept: "Geometric Distance Formula",
    formula: "d = |w₁x₁ + w₂x₂ + b|/||w||",
    explanation: "This formula calculates how far any point (x₁, x₂) is from our hyperplane. The absolute value ensures positive distance.",
    whyUseful: "We use this to identify support vectors (points closest to hyperplane) and to ensure all points are correctly classified with sufficient margin.",
    visualNote: "Distance determines which points become support vectors",
    difficulty: "intermediate"
  },
  {
    id: "optimization",
    title: "SVM Optimization Problem",
    concept: "Constrained Optimization",
    formula: "min ½||w||² subject to yᵢ(wᵀxᵢ + b) ≥ 1",
    explanation: "We minimize ||w||² (maximize margin) while ensuring all points are correctly classified with margin ≥ 1. This is a quadratic programming problem.",
    whyUseful: "This mathematical formulation guarantees we find the optimal hyperplane with maximum margin, balancing accuracy and generalization.",
    visualNote: "The optimization process finds the best separating line",
    difficulty: "advanced"
  },
  {
    id: "lagrangian",
    title: "Lagrangian Formulation",
    concept: "Dual Problem",
    formula: "L = ½||w||² - Σαᵢ[yᵢ(wᵀxᵢ + b) - 1]",
    explanation: "Using Lagrange multipliers αᵢ, we transform the constrained problem into an unconstrained one. Each data point gets a multiplier αᵢ ≥ 0.",
    whyUseful: "The dual formulation is computationally efficient and reveals which points are support vectors (αᵢ > 0). It also enables the kernel trick.",
    visualNote: "Support vectors have αᵢ > 0 and appear highlighted in orange",
    difficulty: "advanced"
  },
  {
    id: "kernel",
    title: "RBF Kernel Transformation",
    concept: "Non-linear Mapping",
    formula: "K(xᵢ, xⱼ) = exp(-γ||xᵢ - xⱼ||²)",
    explanation: "The RBF (Radial Basis Function) kernel maps data to infinite-dimensional space where linear separation becomes possible. γ controls the influence radius.",
    whyUseful: "Enables SVM to handle non-linearly separable data by implicitly working in higher dimensions without computing the actual transformation.",
    visualNote: "RBF kernel creates curved decision boundaries",
    difficulty: "advanced"
  }
];

const MathematicalWalkthrough = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showAllSteps, setShowAllSteps] = useState(false);

  const nextStep = () => {
    if (currentStep < mathematicalSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'basic': return 'bg-green-100 text-green-800 border-green-300';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'basic': return <BookOpen className="w-4 h-4" />;
      case 'intermediate': return <Calculator className="w-4 h-4" />;
      case 'advanced': return <Target className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  if (showAllSteps) {
    return (
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Complete Mathematical Walkthrough</h2>
            <p className="text-xl text-muted-foreground mb-6">
              Every formula explained with purpose and visual connection
            </p>
            <Button 
              onClick={() => setShowAllSteps(false)}
              variant="outline"
              className="mb-8"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Step-by-Step
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {mathematicalSteps.map((step, index) => (
              <Card key={step.id} className="interactive-card">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={getDifficultyColor(step.difficulty)}>
                      {getDifficultyIcon(step.difficulty)}
                      <span className="ml-2 capitalize">{step.difficulty}</span>
                    </Badge>
                    <span className="text-sm text-muted-foreground">Step {index + 1}</span>
                  </div>
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                  <CardDescription className="text-lg font-medium text-optimization">
                    {step.concept}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="formula-block">
                    <div className="text-lg font-mono text-center">{step.formula}</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-primary mb-2">What it means:</h4>
                      <p className="text-sm">{step.explanation}</p>
                    </div>
                    
                    <div className="concept-highlight">
                      <h4 className="font-semibold text-accent-foreground mb-2 flex items-center">
                        <Zap className="w-4 h-4 mr-2" />
                        Why it's crucial:
                      </h4>
                      <p className="text-sm text-accent-foreground">{step.whyUseful}</p>
                    </div>
                    
                    <div className="bg-muted p-3 rounded-lg">
                      <h4 className="font-semibold text-muted-foreground mb-2">Visual Connection:</h4>
                      <p className="text-sm text-muted-foreground">{step.visualNote}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const currentMathStep = mathematicalSteps[currentStep];

  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Mathematical Deep Dive</h2>
          <p className="text-xl text-muted-foreground mb-6">
            Step-by-step breakdown of SVM mathematics with real purpose
          </p>
          <Button 
            onClick={() => setShowAllSteps(true)}
            variant="outline"
            className="mb-8"
          >
            View All Steps
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <Card className="interactive-card animate-pulse-glow">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <Badge className={getDifficultyColor(currentMathStep.difficulty)}>
                {getDifficultyIcon(currentMathStep.difficulty)}
                <span className="ml-2 capitalize">{currentMathStep.difficulty}</span>
              </Badge>
              <span className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {mathematicalSteps.length}
              </span>
            </div>
            <CardTitle className="text-2xl">{currentMathStep.title}</CardTitle>
            <CardDescription className="text-xl font-medium text-optimization">
              {currentMathStep.concept}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="formula-block text-center">
              <div className="text-2xl font-mono mb-2">{currentMathStep.formula}</div>
            </div>
            
            <div className="derivation-step">
              <h3 className="font-semibold text-lg mb-3">Understanding the Formula</h3>
              <p className="text-base leading-relaxed">{currentMathStep.explanation}</p>
            </div>
            
            <div className="concept-highlight">
              <h3 className="font-semibold text-lg mb-3 flex items-center text-accent-foreground">
                <Zap className="w-5 h-5 mr-2" />
                Why This Matters in SVM
              </h3>
              <p className="text-base leading-relaxed text-accent-foreground">{currentMathStep.whyUseful}</p>
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold text-muted-foreground mb-3">Visual Connection</h3>
              <p className="text-base text-muted-foreground">{currentMathStep.visualNote}</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center mt-8">
          <Button 
            onClick={prevStep} 
            disabled={currentStep === 0}
            variant="outline"
            size="lg"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex space-x-2">
            {mathematicalSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? 'bg-primary scale-125' 
                    : 'bg-muted hover:bg-primary/50'
                }`}
              />
            ))}
          </div>
          
          <Button 
            onClick={nextStep} 
            disabled={currentStep === mathematicalSteps.length - 1}
            variant="outline"
            size="lg"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default MathematicalWalkthrough;