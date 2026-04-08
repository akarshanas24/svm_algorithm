import { useEffect, useRef } from "react";
import { DataPoint } from "./InteractiveDemo";

interface SVMVisualizationProps {
  data: DataPoint[];
  svmType: 'linear' | 'rbf';
  modelResults: any;
  isTraining: boolean;
}

const SVMVisualization = ({ data, svmType, modelResults, isTraining }: SVMVisualizationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    // Find data bounds
    let minX = -1, maxX = 10, minY = -1, maxY = 10;
    if (data.length > 0) {
      minX = Math.min(...data.map(p => p.x)) - 1;
      maxX = Math.max(...data.map(p => p.x)) + 1;
      minY = Math.min(...data.map(p => p.y)) - 1;
      maxY = Math.max(...data.map(p => p.y)) + 1;
    }

    const scaleX = plotWidth / (maxX - minX);
    const scaleY = plotHeight / (maxY - minY);

    // Convert data coordinates to canvas coordinates
    const toCanvasX = (x: number) => padding + (x - minX) * scaleX;
    const toCanvasY = (y: number) => padding + (maxY - y) * scaleY;

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);

    // Vertical grid lines
    for (let x = Math.ceil(minX); x <= Math.floor(maxX); x++) {
      const canvasX = toCanvasX(x);
      ctx.beginPath();
      ctx.moveTo(canvasX, padding);
      ctx.lineTo(canvasX, rect.height - padding);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let y = Math.ceil(minY); y <= Math.floor(maxY); y++) {
      const canvasY = toCanvasY(y);
      ctx.beginPath();
      ctx.moveTo(padding, canvasY);
      ctx.lineTo(rect.width - padding, canvasY);
      ctx.stroke();
    }

    ctx.setLineDash([]);

    // Draw axes
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;

    // X-axis
    const zeroY = toCanvasY(0);
    if (zeroY >= padding && zeroY <= rect.height - padding) {
      ctx.beginPath();
      ctx.moveTo(padding, zeroY);
      ctx.lineTo(rect.width - padding, zeroY);
      ctx.stroke();
    }

    // Y-axis
    const zeroX = toCanvasX(0);
    if (zeroX >= padding && zeroX <= rect.width - padding) {
      ctx.beginPath();
      ctx.moveTo(zeroX, padding);
      ctx.lineTo(zeroX, rect.height - padding);
      ctx.stroke();
    }

// Draw decision boundary or hyperplane if model is trained
    if (modelResults && !isTraining) {
      if (svmType === 'linear' && modelResults.hyperplane) {
        const { hyperplane } = modelResults;
        // Draw hyperplane (decision boundary)
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.beginPath();

        const x1 = minX;
        const y1 = -(hyperplane.w1 * x1 + hyperplane.b) / hyperplane.w2;
        const x2 = maxX;
        const y2 = -(hyperplane.w1 * x2 + hyperplane.b) / hyperplane.w2;

        ctx.moveTo(toCanvasX(x1), toCanvasY(y1));
        ctx.lineTo(toCanvasX(x2), toCanvasY(y2));
        ctx.stroke();

        // Draw margin boundaries based on true margin
        const norm = Math.sqrt(hyperplane.w1 * hyperplane.w1 + hyperplane.w2 * hyperplane.w2);
        const halfMargin = (modelResults.margin ?? 0) / 2; // distance in data space
        const deltaB = halfMargin * norm;

        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        // Upper margin (b' = b + deltaB)
        const y1Upper = -(hyperplane.w1 * x1 + (hyperplane.b + deltaB)) / hyperplane.w2;
        const y2Upper = -(hyperplane.w1 * x2 + (hyperplane.b + deltaB)) / hyperplane.w2;
        ctx.beginPath();
        ctx.moveTo(toCanvasX(x1), toCanvasY(y1Upper));
        ctx.lineTo(toCanvasX(x2), toCanvasY(y2Upper));
        ctx.stroke();

        // Lower margin (b' = b - deltaB)
        const y1Lower = -(hyperplane.w1 * x1 + (hyperplane.b - deltaB)) / hyperplane.w2;
        const y2Lower = -(hyperplane.w1 * x2 + (hyperplane.b - deltaB)) / hyperplane.w2;
        ctx.beginPath();
        ctx.moveTo(toCanvasX(x1), toCanvasY(y1Lower));
        ctx.lineTo(toCanvasX(x2), toCanvasY(y2Lower));
        ctx.stroke();

        ctx.setLineDash([]);
      } else if (svmType === 'rbf' && modelResults.grid) {
        // Draw background classification map for non-linear boundary - matching reference image
        const { xTicks, yTicks, Z } = modelResults.grid;
        ctx.save();
        for (let j = 0; j < yTicks.length - 1; j++) {
          for (let i = 0; i < xTicks.length - 1; i++) {
            const xL = toCanvasX(xTicks[i]);
            const xR = toCanvasX(xTicks[i + 1]);
            const yT = toCanvasY(yTicks[j]);
            const yB = toCanvasY(yTicks[j + 1]);
            const cls = Z[j][i];
            // Colors matching Python code: Pink background for class 0 (blue points), Blue background for class 1 (red points)
            ctx.fillStyle = cls === 0 ? 'rgba(248, 180, 180, 0.6)' : 'rgba(147, 197, 253, 0.6)';
            ctx.fillRect(xL, yB, xR - xL, yT - yB);
          }
        }
        ctx.restore();
      }
    }

// Draw data points
    data.forEach((point, index) => {
      const x = toCanvasX(point.x);
      const y = toCanvasY(point.y);
      
      // For RBF SVM, don't show support vectors - just show regular data points
      const showSupportVectors = svmType === 'linear';
      const isSupportVector = showSupportVectors && modelResults?.supportVectors?.some((sv: DataPoint) => 
        Math.abs(sv.x - point.x) < 0.001 && Math.abs(sv.y - point.y) < 0.001
      ) || false;

      ctx.beginPath();
      ctx.arc(x, y, isSupportVector ? 10 : 8, 0, 2 * Math.PI);
      
      // Color based on class - matching Python code: blue for class 0, red for class 1
      if (point.class === 0) {
        ctx.fillStyle = '#3b82f6'; // Blue for class 0
        ctx.strokeStyle = '#1e40af';
      } else {
        ctx.fillStyle = '#ef4444'; // Red for class 1
        ctx.strokeStyle = '#b91c1c';
      }
      
      if (isSupportVector) {
        ctx.strokeStyle = '#f59e0b'; // Orange border for support vectors
        ctx.lineWidth = 4;
        // Add extra glow effect for support vectors
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 8;
      } else {
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0;
      }
      
      ctx.fill();
      ctx.stroke();
      
      // Reset shadow for next points
      if (isSupportVector) {
        ctx.shadowBlur = 0;
      }

      // Add animation for newly added points
      if (index === data.length - 1 && data.length > 0) {
        ctx.save();
        ctx.strokeStyle = point.class === 0 ? '#3b82f6' : '#ef4444';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        
        // Pulse effect
        for (let i = 1; i <= 3; i++) {
          ctx.beginPath();
          ctx.arc(x, y, 6 + i * 4, 0, 2 * Math.PI);
          ctx.globalAlpha = 0.3 / i;
          ctx.stroke();
        }
        ctx.restore();
      }
    });

    // Draw labels
    ctx.fillStyle = '#374151';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';
    
    // X-axis label
    ctx.fillText('X', rect.width - 20, zeroY > padding ? zeroY - 10 : rect.height - 20);
    
    // Y-axis label
    ctx.save();
    ctx.translate(zeroX > padding ? zeroX + 15 : 20, 20);
    ctx.fillText('Y', 0, 0);
    ctx.restore();

    // Training indicator
    if (isTraining) {
      ctx.save();
      ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
      ctx.fillRect(0, 0, rect.width, rect.height);
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Training SVM...', rect.width / 2, rect.height / 2);
      ctx.restore();
    }

    // Empty state
    if (data.length === 0 && !isTraining) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '16px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Add data points to see SVM visualization', rect.width / 2, rect.height / 2);
      
      ctx.font = '12px system-ui';
      ctx.fillText('Blue points = Class 0, Red points = Class 1', rect.width / 2, rect.height / 2 + 25);
    }

  }, [data, modelResults, isTraining]);

  return (
    <div className="chart-container">
      <canvas 
        ref={canvasRef} 
        className="w-full h-96 rounded-lg"
        style={{ width: '100%', height: '384px' }}
      />
      
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-data-class-1"></div>
          <span>Class 0</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-data-class-2"></div>
          <span>Class 1</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full border-2 border-support-vector bg-white"></div>
          <span>Support Vectors</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-0.5 bg-hyperplane"></div>
          <span>Hyperplane</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-0.5 bg-margin border-dashed border border-margin"></div>
          <span>Margin</span>
        </div>
      </div>
    </div>
  );
};

export default SVMVisualization;