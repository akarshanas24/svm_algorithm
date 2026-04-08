import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, Play, RotateCcw, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SVMVisualization from "./SVMVisualization";

export interface DataPoint {
  x: number;
  y: number;
  class: number;
}

const InteractiveDemo = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [svmType, setSvmType] = useState<'linear' | 'rbf'>('linear');
  const [isTraining, setIsTraining] = useState(false);
  const [modelResults, setModelResults] = useState<any>(null);
  const [manualX, setManualX] = useState('');
  const [manualY, setManualY] = useState('');
  const [manualClass, setManualClass] = useState('1');
  const [columns, setColumns] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string | number>[]>([]);
  const [selectedXCol, setSelectedXCol] = useState<string | null>(null);
  const [selectedYCol, setSelectedYCol] = useState<string | null>(null);
  const [classCol, setClassCol] = useState<string>('class');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = (e.target?.result as string).trim();
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length < 2) throw new Error('Not enough rows');

        const header = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const headerLower = header.map(h => h.toLowerCase());
        // detect class column
        const classIdx = headerLower.findIndex(h => h === 'class' || h.includes('label'));
        if (classIdx === -1) throw new Error('Missing Class column');

        const rows: Record<string, string | number>[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const row: Record<string, string | number> = {};
          header.forEach((h, idx) => {
            const num = Number(values[idx]);
            row[h] = Number.isFinite(num) ? num : values[idx];
          });
          rows.push(row);
        }

        // determine numeric feature columns (exclude class)
        const numericCols = header.filter((h, idx) => idx !== classIdx && typeof rows[0][h] === 'number');
        if (numericCols.length < 2) throw new Error('Need at least two numeric feature columns');

        setColumns(header);
        setRawRows(rows);
        setClassCol(header[classIdx]);
        setSelectedXCol(numericCols[0]);
        setSelectedYCol(numericCols[1]);

        toast({ title: 'Data loaded successfully!', description: `Detected ${rows.length} rows, ${numericCols.length} numeric features` });
      } catch (error) {
        toast({
          title: 'Error loading data',
          description: 'CSV must include a header with a Class column (0/1) and at least two numeric features.',
          variant: 'destructive'
        });
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    if (!rawRows.length || !selectedXCol || !selectedYCol || !classCol) return;
    const newData: DataPoint[] = rawRows.map((row) => {
      const x = Number(row[selectedXCol]);
      const y = Number(row[selectedYCol]);
      const cls = Number(row[classCol]);
      if (!Number.isFinite(x) || !Number.isFinite(y) || !(cls === 0 || cls === 1)) return null as any;
      return { x, y, class: cls };
    }).filter(Boolean);
    setData(newData);
  }, [rawRows, selectedXCol, selectedYCol, classCol]);


  const addManualPoint = () => {
    const x = parseFloat(manualX);
    const y = parseFloat(manualY);
    const cls = parseInt(manualClass);

    if (isNaN(x) || isNaN(y)) {
      toast({
        title: "Invalid input",
        description: "Please enter valid numbers for X and Y coordinates",
        variant: "destructive"
      });
      return;
    }

    setData(prev => [...prev, { x, y, class: cls }]);
    setManualX('');
    setManualY('');
    
    toast({
      title: "Point added!",
      description: `Added point (${x}, ${y}) with class ${cls}`,
    });
  };

  const generateSampleData = () => {
    const sampleData: DataPoint[] = [
      // Class 0 points (bottom-left cluster)
      { x: 2, y: 2, class: 0 },
      { x: 3, y: 1, class: 0 },
      { x: 1, y: 3, class: 0 },
      { x: 2.5, y: 2.5, class: 0 },
      { x: 1.5, y: 1.5, class: 0 },
      { x: 3, y: 3, class: 0 },
      
      // Class 1 points (top-right cluster)
      { x: 7, y: 7, class: 1 },
      { x: 8, y: 6, class: 1 },
      { x: 6, y: 8, class: 1 },
      { x: 7.5, y: 7.5, class: 1 },
      { x: 8.5, y: 8.5, class: 1 },
      { x: 6.5, y: 6.5, class: 1 },
    ];
    
    setData(sampleData);
    toast({
      title: "Sample data loaded!",
      description: "Generated linearly separable dataset",
    });
  };

const trainSVM = async () => {
    if (data.length < 4) {
      toast({
        title: "Insufficient data",
        description: "Please add at least 4 data points to train the model",
        variant: "destructive"
      });
      return;
    }

    setIsTraining(true);
    try {
      if (svmType === 'linear') {
        const { trainLinearSVM } = await import("@/utils/svmUtils");
        const results = trainLinearSVM(data);
        // compute predictions for metrics
        const preds = data.map(p => (results.hyperplane.w1 * p.x + results.hyperplane.w2 * p.y + results.hyperplane.b) > 0 ? 1 : 0);
        const metrics = (() => {
          let TP=0,TN=0,FP=0,FN=0; const y = data.map(d=>d.class);
          for (let i=0;i<y.length;i++){ const t=y[i],p=preds[i]; if(t===1&&p===1)TP++; else if(t===0&&p===0)TN++; else if(t===0&&p===1)FP++; else FN++; }
          const accuracy=(TP+TN)/y.length; const precision=TP+FP?TP/(TP+FP):0; const recall=TP+FN?TP/(TP+FN):0; const f1=(precision+recall)?(2*precision*recall)/(precision+recall):0;
          return { accuracy, precision, recall, f1, confusionMatrix:[[TN,FP],[FN,TP]] };
        })();
        setModelResults({ ...results, metricsTrain: metrics, bestParams: { kernel: 'linear' } });
        toast({ title: "SVM trained successfully!", description: `Accuracy: ${(results.accuracy * 100).toFixed(1)}%` });
      } else {
        const { trainRBFSVM } = await import("@/utils/svmUtils");
        const results = await trainRBFSVM(data, { 
          cValues: [100], // Exact match to your Python code
          gammaValues: [10], // Exact match to your Python code  
          gridResolution: 300 // High resolution for smooth curved boundary like your Python meshgrid
        });
        setModelResults({ ...results, kernel: 'rbf' });
        toast({ 
          title: "RBF SVM trained!", 
          description: `${results.supportVectors.length} support vectors, F1: ${(results.metricsCV.f1*100).toFixed(1)}%` 
        });
      }
    } catch (error) {
      toast({ title: "Training failed", description: error instanceof Error ? error.message : "Please check your data", variant: "destructive" });
    } finally {
      setIsTraining(false);
    }
  };

  const clearData = () => {
    setData([]);
    setModelResults(null);
    toast({
      title: "Data cleared",
      description: "All data points and model results have been cleared",
    });
  };

  return (
    <section id="demo" className="py-20 bg-gradient-to-b from-blue-50/30 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Interactive SVM Demo
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload your data or create points manually to see SVM classification in action
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Data Input Panel */}
            <div className="lg:col-span-1">
              <Card className="interactive-card h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Upload className="w-5 h-5 text-primary" />
                    <span>Data Input</span>
                  </CardTitle>
                  <CardDescription>Add data points for classification</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="upload">Upload CSV</TabsTrigger>
                      <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                    </TabsList>
                    
<TabsContent value="upload" className="space-y-4">
                      <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                        <Input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Choose CSV File
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          CSV with header. Include a "Class" column (0/1) and at least two numeric features.
                        </p>
                      </div>

                      {columns.length > 0 && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">X feature</Label>
                            <Select value={selectedXCol ?? undefined} onValueChange={setSelectedXCol}>
                              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {columns.filter(c => c !== classCol).map((c) => (
                                  <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Y feature</Label>
                            <Select value={selectedYCol ?? undefined} onValueChange={setSelectedYCol}>
                              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {columns.filter(c => c !== classCol).map((c) => (
                                  <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                      
                      <Button onClick={generateSampleData} variant="outline" className="w-full">
                        Load Sample Data
                      </Button>
                    </TabsContent>
                    
                    <TabsContent value="manual" className="space-y-4">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label htmlFor="x-coord" className="text-xs">X</Label>
                          <Input
                            id="x-coord"
                            value={manualX}
                            onChange={(e) => setManualX(e.target.value)}
                            placeholder="2.5"
                            type="number"
                            step="0.1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="y-coord" className="text-xs">Y</Label>
                          <Input
                            id="y-coord"
                            value={manualY}
                            onChange={(e) => setManualY(e.target.value)}
                            placeholder="3.0"
                            type="number"
                            step="0.1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="class" className="text-xs">Class</Label>
                          <Select value={manualClass} onValueChange={setManualClass}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">0</SelectItem>
                              <SelectItem value="1">1</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button onClick={addManualPoint} className="w-full">
                        Add Point
                      </Button>
                    </TabsContent>
                  </Tabs>

                  {/* Model Configuration */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <div>
                      <Label className="text-sm font-medium">SVM Type</Label>
                      <Select value={svmType} onValueChange={(value: 'linear' | 'rbf') => setSvmType(value)}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="linear">Linear SVM</SelectItem>
                          <SelectItem value="rbf">RBF Kernel SVM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Data Points:</span>
                        <Badge variant="secondary">{data.length}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Class 0:</span>
                        <Badge className="bg-data-class-1/10 text-data-class-1">
                          {data.filter(p => p.class === 0).length}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Class 1:</span>
                        <Badge className="bg-data-class-2/10 text-data-class-2">
                          {data.filter(p => p.class === 1).length}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button 
                      onClick={trainSVM} 
                      disabled={isTraining || data.length < 4}
                      className="w-full bg-gradient-to-r from-primary to-primary-glow"
                    >
                      {isTraining ? (
                        <>Training...</>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Train SVM
                        </>
                      )}
                    </Button>
                    
                    <Button onClick={clearData} variant="outline" className="w-full">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Clear All
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Visualization Panel */}
            <div className="lg:col-span-2">
              <Card className="interactive-card">
                <CardHeader>
                  <CardTitle>SVM Visualization</CardTitle>
                  <CardDescription>
                    Real-time visualization of your data and SVM decision boundary
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SVMVisualization 
                    data={data}
                    svmType={svmType}
                    modelResults={modelResults}
                    isTraining={isTraining}
                  />
                </CardContent>
              </Card>

{/* Results Panel */}
              {modelResults && (
                <Card className="interactive-card mt-6 animate-scale-in">
                  <CardHeader>
                    <CardTitle className="text-lg">Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {((modelResults.metricsCV?.accuracy ?? modelResults.metricsTrain?.accuracy) * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Accuracy (CV if available)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-accent">
                          {((modelResults.metricsCV?.precision ?? modelResults.metricsTrain?.precision) * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Precision</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-accent">
                          {((modelResults.metricsCV?.recall ?? modelResults.metricsTrain?.recall) * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Recall</div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-margin">
                          {((modelResults.metricsCV?.f1 ?? modelResults.metricsTrain?.f1) * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">F1 Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-accent">
                          {modelResults.supportVectors?.length ?? 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Support Vectors</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Best Params</div>
                        <div className="text-sm">{modelResults.bestParams ? `C=${modelResults.bestParams.C}, gamma=${modelResults.bestParams.gamma}, k=${modelResults.bestParams.kFold}` : 'Linear kernel'}</div>
                      </div>
                    </div>

                    {modelResults.metricsCV?.confusionMatrix && (
                      <div className="mt-6">
                        <div className="text-sm font-medium mb-2">Confusion Matrix (CV)</div>
                        <div className="grid grid-cols-2 gap-2 w-40 text-center">
                          <div className="p-2 border rounded">TN: {modelResults.metricsCV.confusionMatrix[0][0]}</div>
                          <div className="p-2 border rounded">FP: {modelResults.metricsCV.confusionMatrix[0][1]}</div>
                          <div className="p-2 border rounded">FN: {modelResults.metricsCV.confusionMatrix[1][0]}</div>
                          <div className="p-2 border rounded">TP: {modelResults.metricsCV.confusionMatrix[1][1]}</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveDemo;