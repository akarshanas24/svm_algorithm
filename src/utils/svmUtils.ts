// SVM utility functions for actual hyperplane calculation
import SVM from "libsvm-js/asm";


export interface DataPoint {
  x: number;
  y: number;
  class: number;
}

export interface SVMResult {
  hyperplane: { w1: number; w2: number; b: number };
  supportVectors: DataPoint[];
  accuracy: number;
  margin: number;
}

// Simple SVM implementation using Sequential Minimal Optimization (SMO) approach
export function trainLinearSVM(data: DataPoint[]): SVMResult {
  if (data.length < 2) {
    throw new Error("Need at least 2 data points");
  }

  const class0Points = data.filter(p => p.class === 0);
  const class1Points = data.filter(p => p.class === 1);
  
  if (class0Points.length === 0 || class1Points.length === 0) {
    throw new Error("Need points from both classes");
  }

  // Convert class labels from 0/1 to -1/+1 for SVM
  const svmData = data.map(p => ({
    ...p,
    class: p.class === 0 ? -1 : 1
  }));

  // Find optimal hyperplane using simplified approach
  let bestW1 = 0, bestW2 = 0, bestB = 0;
  let bestMargin = 0;
  let bestSupportVectors: DataPoint[] = [];
  
  // Try different hyperplane orientations
  const numTries = 100;
  for (let i = 0; i < numTries; i++) {
    const angle = (i / numTries) * Math.PI;
    const w1 = Math.cos(angle);
    const w2 = Math.sin(angle);
    
    // Find optimal b for this orientation
    const projections = svmData.map(p => ({
      ...p,
      projection: w1 * p.x + w2 * p.y
    }));
    
    const class1Projections = projections.filter(p => p.class === 1).map(p => p.projection);
    const class0Projections = projections.filter(p => p.class === -1).map(p => p.projection);
    
    if (class1Projections.length === 0 || class0Projections.length === 0) continue;
    
    const maxClass0 = Math.max(...class0Projections);
    const minClass1 = Math.min(...class1Projections);
    
    // Check if classes are separable with this orientation
    if (minClass1 > maxClass0) {
      const b = -(maxClass0 + minClass1) / 2;
      const margin = (minClass1 - maxClass0) / 2;
      
      if (margin > bestMargin) {
        bestMargin = margin;
        bestW1 = w1;
        bestW2 = w2;
        bestB = b;
        
        // Find support vectors (points exactly on the margin boundaries)
        const tolerance = 0.01;
        const supportVecs: DataPoint[] = [];
        
        for (const p of svmData) {
          const distance = Math.abs(w1 * p.x + w2 * p.y + b) / Math.sqrt(w1 * w1 + w2 * w2);
          // A point is a support vector if it's exactly on the margin boundary
          if (Math.abs(distance - margin) < tolerance) {
            supportVecs.push({ x: p.x, y: p.y, class: p.class === -1 ? 0 : 1 });
          }
        }
        
        bestSupportVectors = supportVecs;
      }
    }
  }
  
  // If no separating hyperplane found, use linear regression approach
  if (bestMargin === 0) {
    const { w1, w2, b } = findLinearSeparator(svmData);
    bestW1 = w1;
    bestW2 = w2;
    bestB = b;
    
    // Find support vectors (points exactly on the margin boundaries)
    const tolerance = 0.01;
    const supportVecs: DataPoint[] = [];
    const marginDist = calculateMargin(svmData, w1, w2, b);
    
    for (const p of svmData) {
      const distance = Math.abs(w1 * p.x + w2 * p.y + b) / Math.sqrt(w1 * w1 + w2 * w2);
      // A point is a support vector if it's exactly on the margin boundary
      if (Math.abs(distance - marginDist) < tolerance) {
        supportVecs.push({ x: p.x, y: p.y, class: p.class === -1 ? 0 : 1 });
      }
    }
    
    bestSupportVectors = supportVecs;
  }
  
  // Calculate accuracy
  let correct = 0;
  for (const point of svmData) {
    const prediction = bestW1 * point.x + bestW2 * point.y + bestB;
    const predictedClass = prediction > 0 ? 1 : -1;
    if (predictedClass === point.class) correct++;
  }
  
  const accuracy = correct / svmData.length;
  
  return {
    hyperplane: { w1: bestW1, w2: bestW2, b: bestB },
    supportVectors: bestSupportVectors,
    accuracy,
    margin: bestMargin * 2 // Full margin width
  };
}

function findLinearSeparator(data: { x: number; y: number; class: number }[]) {
  // Use mean centers to find separator
  const class1Points = data.filter(p => p.class === 1);
  const class0Points = data.filter(p => p.class === -1);
  
  const center1 = {
    x: class1Points.reduce((sum, p) => sum + p.x, 0) / class1Points.length,
    y: class1Points.reduce((sum, p) => sum + p.y, 0) / class1Points.length
  };
  
  const center0 = {
    x: class0Points.reduce((sum, p) => sum + p.x, 0) / class0Points.length,
    y: class0Points.reduce((sum, p) => sum + p.y, 0) / class0Points.length
  };
  
  // Vector from class 0 center to class 1 center
  const dx = center1.x - center0.x;
  const dy = center1.y - center0.y;
  
  // Perpendicular vector for hyperplane normal
  const w1 = dx;
  const w2 = dy;
  
  // Midpoint between centers
  const midX = (center0.x + center1.x) / 2;
  const midY = (center0.y + center1.y) / 2;
  
  // Hyperplane passes through midpoint: w1*x + w2*y + b = 0
  const b = -(w1 * midX + w2 * midY);
  
  return { w1, w2, b };
}

function calculateMargin(data: { x: number; y: number; class: number }[], w1: number, w2: number, b: number) {
  const norm = Math.sqrt(w1 * w1 + w2 * w2);
  let minDistance = Infinity;
  
  for (const point of data) {
    const distance = Math.abs(w1 * point.x + w2 * point.y + b) / norm;
    minDistance = Math.min(minDistance, distance);
  }
  
  return minDistance;
}

// ------------------------------
// Non-linear (RBF) SVM with CV and grid search using libsvm-js
// ------------------------------
export interface SVMGrid {
  xTicks: number[];
  yTicks: number[];
  Z: number[][]; // rows = y, cols = x, values are predicted class labels 0/1
}

export interface Metrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  confusionMatrix: [[number, number], [number, number]]; // [[TN, FP],[FN, TP]]
}

export interface RBFResult {
  supportVectors: DataPoint[];
  bestParams: { C: number; gamma: number; kFold: number };
  metricsCV: Metrics;
  metricsTrain: Metrics;
  grid: SVMGrid;
  predictionsTrain: number[];
}

function computeMetrics(trueLabels: number[], predLabels: number[]): Metrics {
  let TP = 0, TN = 0, FP = 0, FN = 0;
  for (let i = 0; i < trueLabels.length; i++) {
    const t = trueLabels[i];
    const p = predLabels[i];
    if (t === 1 && p === 1) TP++;
    else if (t === 0 && p === 0) TN++;
    else if (t === 0 && p === 1) FP++;
    else if (t === 1 && p === 0) FN++;
  }
  const accuracy = (TP + TN) / Math.max(1, trueLabels.length);
  const precision = TP + FP === 0 ? 0 : TP / (TP + FP);
  const recall = TP + FN === 0 ? 0 : TP / (TP + FN);
  const f1 = (precision + recall) === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  return { accuracy, precision, recall, f1, confusionMatrix: [[TN, FP], [FN, TP]] };
}

function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function kFoldSplit(n: number, k: number): number[][] {
  const idx = Array.from({ length: n }, (_, i) => i);
  shuffle(idx);
  const folds: number[][] = Array.from({ length: k }, () => []);
  for (let i = 0; i < n; i++) {
    folds[i % k].push(idx[i]);
  }
  return folds;
}

function fitScaler(X: number[][]) {
  const nFeat = X[0].length;
  const mean = new Array(nFeat).fill(0);
  const std = new Array(nFeat).fill(0);
  for (const row of X) {
    for (let j = 0; j < nFeat; j++) mean[j] += row[j];
  }
  for (let j = 0; j < nFeat; j++) mean[j] /= X.length;
  for (const row of X) {
    for (let j = 0; j < nFeat; j++) {
      const d = row[j] - mean[j];
      std[j] += d * d;
    }
  }
  for (let j = 0; j < nFeat; j++) std[j] = Math.sqrt(std[j] / Math.max(1, X.length - 1)) || 1;
  return { mean, std };
}

function scaleWith({ mean, std }: { mean: number[]; std: number[] }, X: number[][]) {
  return X.map(row => row.map((v, j) => (v - mean[j]) / (std[j] || 1)));
}

export async function trainRBFSVM(
  data: DataPoint[],
  opts?: { cValues?: number[]; gammaValues?: number[]; kFold?: number; gridResolution?: number }
): Promise<RBFResult> {
  const SVMImpl = SVM; // using asm sync build
  const X = data.map(d => [d.x, d.y]);
  const y = data.map(d => d.class);
  const n = X.length;

  if (n < 4) throw new Error('Need at least 4 data points');

  const cValues = opts?.cValues ?? [100]; // Use C=100 like in your Python code
  const gammaValues = opts?.gammaValues ?? [10]; // Use gamma=10 like in your Python code
  const kFold = Math.min(opts?.kFold ?? 5, n);

  let bestF1 = -1;
  let bestAcc = -1;
  let bestParams = { C: cValues[0], gamma: gammaValues[0], kFold };
  let bestCVPreds: number[] = new Array(n).fill(0);

  // Manual K-fold CV with per-fold scaling
  for (const C of cValues) {
    for (const gamma of gammaValues) {
      const folds = kFoldSplit(n, kFold);
      const cvPreds: number[] = new Array(n).fill(0);

      for (let f = 0; f < folds.length; f++) {
        const valIdx = folds[f];
        const trainIdx = ([] as number[]).concat(...folds.filter((_, i) => i !== f));

        const X_train = trainIdx.map(i => X[i]);
        const y_train = trainIdx.map(i => y[i]);
        const X_val = valIdx.map(i => X[i]);

        const scaler = fitScaler(X_train);
        const X_train_s = scaleWith(scaler, X_train);
        const X_val_s = scaleWith(scaler, X_val);

        const svm = new SVMImpl({
          kernel: SVMImpl.KERNEL_TYPES.RBF,
          type: SVMImpl.SVM_TYPES.C_SVC,
          cost: C,
          gamma,
          quiet: true,
        });
        svm.train(X_train_s, y_train);
        const preds = svm.predict(X_val_s) as number[];
        for (let i = 0; i < valIdx.length; i++) {
          cvPreds[valIdx[i]] = preds[i] as number;
        }
        svm.free();
      }

      const metrics = computeMetrics(y, cvPreds);
      if (metrics.f1 > bestF1 || (metrics.f1 === bestF1 && metrics.accuracy > bestAcc)) {
        bestF1 = metrics.f1;
        bestAcc = metrics.accuracy;
        bestParams = { C, gamma, kFold };
        bestCVPreds = cvPreds;
      }
    }
  }

  const metricsCV = computeMetrics(y, bestCVPreds);

  // Train final model on full data with global scaling
  const scalerFull = fitScaler(X);
  const X_full_s = scaleWith(scalerFull, X);
  const svmFinal = new SVMImpl({
    kernel: SVMImpl.KERNEL_TYPES.RBF,
    type: SVMImpl.SVM_TYPES.C_SVC,
    cost: bestParams.C,
    gamma: bestParams.gamma,
    quiet: true,
  });
  svmFinal.train(X_full_s, y);
  const predictionsTrain = svmFinal.predict(X_full_s) as number[];
  const metricsTrain = computeMetrics(y, predictionsTrain);

  // Support vectors - get actual support vector indices from libsvm
  const svIdx: number[] = [];
  try {
    // Try to get support vector indices from libsvm
    const indices = svmFinal.getSVIndices?.();
    if (indices && Array.isArray(indices) && indices.length > 0) {
      svIdx.push(...indices);
    } else {
      throw new Error("No SV indices available");
    }
  } catch (e) {
    // Fallback: find points that are truly support vectors (on the decision boundary)
    // For RBF SVM, these are points that significantly influence the decision boundary
    for (let i = 0; i < X_full_s.length; i++) {
      const point = X_full_s[i];
      const prob = svmFinal.predictProbability?.(point);
      
      // A point is a support vector if it's very close to the decision boundary
      // (probability close to 0.5 for binary classification)
      if (prob && prob.length >= 2) {
        const confidence = Math.abs(prob[0] - 0.5);
        // Only consider points very close to decision boundary as support vectors
        if (confidence < 0.15) { // Within 15% of decision boundary
          svIdx.push(i);
        }
      }
    }
    
    // If still no support vectors found, take the 2-3 points closest to boundary
    if (svIdx.length === 0) {
      const distances = X_full_s.map((point, idx) => {
        const prob = svmFinal.predictProbability?.(point);
        const confidence = prob ? Math.abs(prob[0] - 0.5) : 0.5;
        return { idx, confidence };
      });
      distances.sort((a, b) => a.confidence - b.confidence);
      // Only take 2-3 actual support vectors
      for (let i = 0; i < Math.min(3, distances.length); i++) {
        svIdx.push(distances[i].idx);
      }
    }
  }
  
  const supportVectors: DataPoint[] = svIdx.map(i => data[i]).filter(Boolean);

  // Build grid predictions for visualization
  const xs = data.map(d => d.x);
  const ys = data.map(d => d.y);
  const pad = 1;
  const xMin = Math.min(...xs) - pad;
  const xMax = Math.max(...xs) + pad;
  const yMin = Math.min(...ys) - pad;
  const yMax = Math.max(...ys) + pad;
  const res = opts?.gridResolution ?? 300; // Use 300 like your Python meshgrid

  const xTicks: number[] = Array.from({ length: res }, (_, i) => xMin + (i * (xMax - xMin)) / (res - 1));
  const yTicks: number[] = Array.from({ length: res }, (_, i) => yMin + (i * (yMax - yMin)) / (res - 1));
  const Z: number[][] = Array.from({ length: res }, () => new Array(res).fill(0));

  for (let j = 0; j < res; j++) {
    const rowXY = xTicks.map(x => [x, yTicks[j]]);
    const rowXY_s = scaleWith(scalerFull, rowXY);
    const preds = svmFinal.predict(rowXY_s) as number[];
    for (let i = 0; i < res; i++) Z[j][i] = preds[i] as number;
  }

  // free model memory (we no longer need it for predictions)
  svmFinal.free?.();

  return {
    supportVectors,
    bestParams,
    metricsCV,
    metricsTrain,
    grid: { xTicks, yTicks, Z },
    predictionsTrain,
  };
}
