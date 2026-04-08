import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, Target, TrendingUp, Zap } from "lucide-react";

interface OptimizationStep {
  iteration: number;
  hyperplane: { w1: number; w2: number; b: number };
  margin: number;
  objective: number;
  convergence: number;
}

const OptimizationVisualization = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [optimizationSteps, setOptimizationSteps] = useState<OptimizationStep[]>([]);
  const [convergenceHistory, setConvergenceHistory] = useState<number[]>([]);

  // Sample data points for optimization - clearly separable classes
  const sampleData = [
    { x: 2, y: 2, class: 1 },
    { x: 3, y: 3, class: 1 },
    { x: 1, y: 3, class: 1 },
    { x: 7, y: 7, class: -1 },
    { x: 8, y: 6, class: -1 },
    { x: 6, y: 8, class: -1 },
  ];

  // Generate optimization trajectory
  const generateOptimizationSteps = () => {
    const steps: OptimizationStep[] = [];
    const maxIterations = 50;
    
    for (let i = 0; i <= maxIterations; i++) {
      const progress = i / maxIterations;
      
      // Simulate convergence to optimal hyperplane that actually separates the classes
      // Final optimal hyperplane should be around: w1=1, w2=1, b=-9 (separates (2,2) from (7,7))
      const finalW1 = 1;
      const finalW2 = 1;
      const finalB = -9;
      
      // Start from random position and converge to optimal
      const w1 = finalW1 + 2 * Math.sin(progress * Math.PI * 2) * (1 - progress);
      const w2 = finalW2 + 1.5 * Math.cos(progress * Math.PI * 3) * (1 - progress);
      const b = finalB + 3 * Math.sin(progress * Math.PI * 4) * (1 - progress);
      
      const norm = Math.sqrt(w1 * w1 + w2 * w2);
      const margin = 2 / norm;
      
      // Objective function (simplified)
      const objective = 0.5 * norm * norm + Math.random() * 0.1 * (1 - progress);
      
      // Convergence metric
      const convergence = Math.max(0, 1 - progress + Math.random() * 0.1 * (1 - progress));
      
      steps.push({
        iteration: i,
        hyperplane: { w1, w2, b },
        margin,
        objective,
        convergence
      });
    }
    
    return steps;
  };

  const startOptimization = () => {
    const steps = generateOptimizationSteps();
    setOptimizationSteps(steps);
    setConvergenceHistory([]);
    setCurrentIteration(0);
    setIsOptimizing(true);
  };

  const resetOptimization = () => {
    setIsOptimizing(false);
    setCurrentIteration(0);
    setOptimizationSteps([]);
    setConvergenceHistory([]);
  };

  useEffect(() => {
    if (isOptimizing && currentIteration < optimizationSteps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentIteration(prev => prev + 1);
        setConvergenceHistory(prev => [...prev, optimizationSteps[currentIteration].convergence]);
      }, 100);
      return () => clearTimeout(timer);
    } else if (currentIteration >= optimizationSteps.length - 1) {
      setIsOptimizing(false);
    }
  }, [isOptimizing, currentIteration, optimizationSteps]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Set up coordinate system
    const padding = 40;
    const plotWidth = rect.width - 2 * padding;
    const plotHeight = rect.height - 2 * padding;

    const minX = 0, maxX = 10, minY = 0, maxY = 10;
    const scaleX = plotWidth / (maxX - minX);
    const scaleY = plotHeight / (maxY - minY);

    const toCanvasX = (x: number) => padding + (x - minX) * scaleX;
    const toCanvasY = (y: number) => padding + (maxY - y) * scaleY;

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);

    for (let x = minX; x <= maxX; x++) {
      const canvasX = toCanvasX(x);
      ctx.beginPath();
      ctx.moveTo(canvasX, padding);
      ctx.lineTo(canvasX, rect.height - padding);
      ctx.stroke();
    }

    for (let y = minY; y <= maxY; y++) {
      const canvasY = toCanvasY(y);
      ctx.beginPath();
      ctx.moveTo(padding, canvasY);
      ctx.lineTo(rect.width - padding, canvasY);
      ctx.stroke();
    }

    ctx.setLineDash([]);

    // Draw data points
    sampleData.forEach(point => {
      const x = toCanvasX(point.x);
      const y = toCanvasY(point.y);
      
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      
      if (point.class === 1) {
        ctx.fillStyle = 'hsl(210 85% 60%)';
        ctx.strokeStyle = 'hsl(210 85% 45%)';
      } else {
        ctx.fillStyle = 'hsl(0 80% 60%)';
        ctx.strokeStyle = 'hsl(0 80% 45%)';
      }
      
      ctx.lineWidth = 3;
      ctx.fill();
      ctx.stroke();
    });

    // Draw optimization trajectory if available
    if (optimizationSteps.length > 0) {
      // Draw previous hyperplanes as fading trails
      for (let i = Math.max(0, currentIteration - 10); i < currentIteration; i++) {
        const step = optimizationSteps[i];
        const alpha = (i - Math.max(0, currentIteration - 10)) / 10;
        
        ctx.strokeStyle = `hsl(280 70% 55% / ${alpha * 0.3})`;
        ctx.lineWidth = 2;
        
        const x1 = minX;
        const y1 = -(step.hyperplane.w1 * x1 + step.hyperplane.b) / step.hyperplane.w2;
        const x2 = maxX;
        const y2 = -(step.hyperplane.w1 * x2 + step.hyperplane.b) / step.hyperplane.w2;
        
        if (y1 >= minY && y1 <= maxY && y2 >= minY && y2 <= maxY) {
          ctx.beginPath();
          ctx.moveTo(toCanvasX(x1), toCanvasY(y1));
          ctx.lineTo(toCanvasX(x2), toCanvasY(y2));
          ctx.stroke();
        }
      }

      // Draw current hyperplane
      if (currentIteration < optimizationSteps.length) {
        const currentStep = optimizationSteps[currentIteration];
        
        ctx.strokeStyle = 'hsl(210 85% 50%)';
        ctx.lineWidth = 4;
        ctx.shadowColor = 'hsl(210 100% 70%)';
        ctx.shadowBlur = 10;
        
        const x1 = minX;
        const y1 = -(currentStep.hyperplane.w1 * x1 + currentStep.hyperplane.b) / currentStep.hyperplane.w2;
        const x2 = maxX;
        const y2 = -(currentStep.hyperplane.w1 * x2 + currentStep.hyperplane.b) / currentStep.hyperplane.w2;
        
        if (y1 >= minY && y1 <= maxY && y2 >= minY && y2 <= maxY) {
          ctx.beginPath();
          ctx.moveTo(toCanvasX(x1), toCanvasY(y1));
          ctx.lineTo(toCanvasX(x2), toCanvasY(y2));
          ctx.stroke();
        }
        
        ctx.shadowBlur = 0;

        // Draw margin boundaries
        ctx.strokeStyle = 'hsl(160 70% 45%)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        const marginOffset = currentStep.margin / 2;
        const norm = Math.sqrt(currentStep.hyperplane.w1 ** 2 + currentStep.hyperplane.w2 ** 2);
        const normalX = currentStep.hyperplane.w1 / norm;
        const normalY = currentStep.hyperplane.w2 / norm;
        
        // Upper margin
        const bUpper = currentStep.hyperplane.b + marginOffset * norm;
        const y1Upper = -(currentStep.hyperplane.w1 * x1 + bUpper) / currentStep.hyperplane.w2;
        const y2Upper = -(currentStep.hyperplane.w1 * x2 + bUpper) / currentStep.hyperplane.w2;
        
        if (y1Upper >= minY && y1Upper <= maxY && y2Upper >= minY && y2Upper <= maxY) {
          ctx.beginPath();
          ctx.moveTo(toCanvasX(x1), toCanvasY(y1Upper));
          ctx.lineTo(toCanvasX(x2), toCanvasY(y2Upper));
          ctx.stroke();
        }
        
        // Lower margin
        const bLower = currentStep.hyperplane.b - marginOffset * norm;
        const y1Lower = -(currentStep.hyperplane.w1 * x1 + bLower) / currentStep.hyperplane.w2;
        const y2Lower = -(currentStep.hyperplane.w1 * x2 + bLower) / currentStep.hyperplane.w2;
        
        if (y1Lower >= minY && y1Lower <= maxY && y2Lower >= minY && y2Lower <= maxY) {
          ctx.beginPath();
          ctx.moveTo(toCanvasX(x1), toCanvasY(y1Lower));
          ctx.lineTo(toCanvasX(x2), toCanvasY(y2Lower));
          ctx.stroke();
        }
        
        ctx.setLineDash([]);
      }
    }

    // Draw iteration info
    if (optimizationSteps.length > 0 && currentIteration < optimizationSteps.length) {
      const currentStep = optimizationSteps[currentIteration];
      
      ctx.fillStyle = 'hsl(45 20% 15%)';
      ctx.font = 'bold 14px system-ui';
      ctx.fillText(`Iteration: ${currentStep.iteration}`, 20, 30);
      ctx.fillText(`Margin: ${currentStep.margin.toFixed(3)}`, 20, 50);
      ctx.fillText(`Objective: ${currentStep.objective.toFixed(3)}`, 20, 70);
    }

  }, [currentIteration, optimizationSteps]);

  const getCurrentStep = () => {
    if (optimizationSteps.length === 0 || currentIteration >= optimizationSteps.length) {
      return null;
    }
    return optimizationSteps[currentIteration];
  };

  const currentStep = getCurrentStep();

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">SVM Optimization in Action</h2>
          <p className="text-xl text-muted-foreground">
            Watch how SVM finds the optimal hyperplane with maximum margin
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Visualization */}
          <Card className="interactive-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-6 h-6 mr-2 text-optimization" />
                Optimization Process
              </CardTitle>
              <CardDescription>
                Real-time visualization of hyperplane convergence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="chart-container">
                <canvas 
                  ref={canvasRef} 
                  className="w-full h-80 rounded-lg"
                  style={{ width: '100%', height: '320px' }}
                />
              </div>
              
              <div className="flex justify-center space-x-4 mt-6">
                <Button 
                  onClick={isOptimizing ? () => setIsOptimizing(false) : startOptimization}
                  variant={isOptimizing ? "secondary" : "default"}
                  size="lg"
                  className="animate-pulse-glow"
                >
                  {isOptimizing ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Optimization
                    </>
                  )}
                </Button>
                
                <Button onClick={resetOptimization} variant="outline" size="lg">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Metrics and Status */}
          <div className="space-y-6">
            {/* Current Status */}
            <Card className="interactive-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-6 h-6 mr-2 text-mathematical" />
                  Optimization Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentStep ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="text-sm font-medium text-muted-foreground">Iteration</div>
                        <div className="text-2xl font-bold text-optimization">{currentStep.iteration}</div>
                      </div>
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="text-sm font-medium text-muted-foreground">Margin Width</div>
                        <div className="text-2xl font-bold text-margin">{currentStep.margin.toFixed(3)}</div>
                      </div>
                    </div>
                    
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Hyperplane Equation</div>
                      <div className="formula-block text-center">
                        {currentStep.hyperplane.w1.toFixed(3)}x₁ + {currentStep.hyperplane.w2.toFixed(3)}x₂ + {currentStep.hyperplane.b.toFixed(3)} = 0
                      </div>
                    </div>

                    <div className="bg-muted p-3 rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground">Objective Function</div>
                      <div className="text-xl font-mono">{currentStep.objective.toFixed(4)}</div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Convergence Progress</div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-optimization h-2 rounded-full transition-all duration-300"
                          style={{ width: `${100 - currentStep.convergence * 100}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(100 - currentStep.convergence * 100).toFixed(1)}% converged
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Zap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Click "Start Optimization" to begin</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Key Insights */}
            <Card className="interactive-card">
              <CardHeader>
                <CardTitle>Optimization Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="concept-highlight">
                  <h4 className="font-semibold mb-2">Maximum Margin Principle</h4>
                  <p className="text-sm">SVM finds the hyperplane that maximizes the distance to the nearest data points, ensuring better generalization.</p>
                </div>
                
                <div className="derivation-step">
                  <h4 className="font-semibold mb-2">Quadratic Programming</h4>
                  <p className="text-sm">The optimization problem is convex, guaranteeing a global minimum and unique solution.</p>
                </div>
                
                <div className="bg-muted p-3 rounded-lg">
                  <h4 className="font-semibold mb-2">Support Vectors</h4>
                  <p className="text-sm">Only points closest to the hyperplane (support vectors) determine the final decision boundary.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OptimizationVisualization;