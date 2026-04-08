import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Lightbulb, Target, Zap, Calculator } from "lucide-react";

const TheorySection = () => {
  const [activeTab, setActiveTab] = useState('what-is-svm');

  const concepts = [
    {
      id: 'what-is-svm',
      title: 'What is SVM?',
      icon: Lightbulb,
      content: (
        <div className="space-y-4">
          <p className="text-lg leading-relaxed">
            Support Vector Machine (SVM) is a powerful supervised learning algorithm that finds the optimal boundary (hyperplane) to separate different classes of data.
          </p>
          <div className="concept-highlight">
            <h4 className="font-semibold mb-2">Key Idea</h4>
            <p>SVM doesn't just find any separating line—it finds the line that maximizes the margin between classes, making it the most robust classifier.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div className="interactive-card p-4 rounded-lg">
              <h5 className="font-semibold text-sm mb-2 text-data-class-1">Linear SVM</h5>
              <p className="text-sm text-muted-foreground">For linearly separable data, finds a straight line (2D) or hyperplane (higher dimensions)</p>
            </div>
            <div className="interactive-card p-4 rounded-lg">
              <h5 className="font-semibold text-sm mb-2 text-accent">Non-linear SVM</h5>
              <p className="text-sm text-muted-foreground">Uses kernel trick to transform data into higher dimensions for complex boundaries</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'why-svm',
      title: 'Why use SVM?',
      icon: Target,
      content: (
        <div className="space-y-4">
          <div className="grid gap-4">
            {[
              { title: 'Maximum Margin', desc: 'Finds the most robust decision boundary', color: 'text-primary' },
              { title: 'Kernel Trick', desc: 'Handles non-linear patterns elegantly', color: 'text-accent' },
              { title: 'Memory Efficient', desc: 'Only stores support vectors, not all training data', color: 'text-margin' },
              { title: 'Versatile', desc: 'Works for classification and regression', color: 'text-support-vector' }
            ].map((benefit, index) => (
              <div key={benefit.title} className="flex items-start space-x-3 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className={`w-2 h-2 rounded-full ${benefit.color.replace('text-', 'bg-')} mt-2 flex-shrink-0`}></div>
                <div>
                  <h5 className={`font-semibold ${benefit.color}`}>{benefit.title}</h5>
                  <p className="text-muted-foreground text-sm">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'types',
      title: 'Linear vs Non-Linear',
      icon: Zap,
      content: (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="interactive-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg text-primary">Linear SVM</CardTitle>
                <CardDescription>For linearly separable data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="math-equation">
                    w·x + b = 0
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Finds a straight hyperplane that separates classes with maximum margin.
                  </p>
                  <Badge variant="outline" className="text-xs">Fast Training</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="interactive-card border-accent/20">
              <CardHeader>
                <CardTitle className="text-lg text-accent">Non-Linear SVM</CardTitle>
                <CardDescription>For complex, non-separable data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="math-equation">
                    K(xi, xj) = φ(xi)·φ(xj)
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Uses kernel functions to map data to higher dimensions where it becomes linearly separable.
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">RBF Kernel</Badge>
                    <Badge variant="outline" className="text-xs">Polynomial</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'math-basics',
      title: 'Mathematical Foundation',
      icon: Calculator,
      content: (
        <div className="space-y-6">
          <div className="concept-highlight">
            <h4 className="font-semibold mb-3">Core Mathematical Concepts</h4>
          </div>
          
          <div className="space-y-4">
            <div className="interactive-card p-4 rounded-lg">
              <h5 className="font-semibold mb-2">1. Hyperplane Equation</h5>
              <div className="math-equation mb-2">
                w₁x₁ + w₂x₂ + ... + wₙxₙ + b = 0
              </div>
              <p className="text-sm text-muted-foreground">Where w is the weight vector and b is the bias term.</p>
            </div>

            <div className="interactive-card p-4 rounded-lg">
              <h5 className="font-semibold mb-2">2. Margin Width</h5>
              <div className="math-equation mb-2">
                Margin = 2/||w||
              </div>
              <p className="text-sm text-muted-foreground">SVM maximizes this margin to find the most robust boundary.</p>
            </div>

            <div className="interactive-card p-4 rounded-lg">
              <h5 className="font-semibold mb-2">3. Support Vectors</h5>
              <p className="text-sm text-muted-foreground mb-2">Data points that lie exactly on the margin boundaries. These are the only points that matter for defining the hyperplane.</p>
              <Badge className="bg-support-vector/10 text-support-vector border-support-vector/20">Critical Points</Badge>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <section id="theory" className="py-20 bg-gradient-to-b from-background to-blue-50/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            SVM Theory
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Build a solid foundation in Support Vector Machine concepts
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Tab navigation */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {concepts.map((concept) => (
              <Button
                key={concept.id}
                variant={activeTab === concept.id ? "default" : "outline"}
                onClick={() => setActiveTab(concept.id)}
                className={`flex items-center space-x-2 transition-all duration-200 ${
                  activeTab === concept.id 
                    ? 'bg-primary hover:bg-primary/90 shadow-lg' 
                    : 'hover:bg-primary/5 hover:border-primary/50'
                }`}
              >
                <concept.icon className="w-4 h-4" />
                <span>{concept.title}</span>
              </Button>
            ))}
          </div>

          {/* Content */}
          <div className="animate-scale-in">
            {concepts.map((concept) => (
              activeTab === concept.id && (
                <Card key={concept.id} className="interactive-card border-primary/10">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3 text-2xl">
                      <concept.icon className="w-7 h-7 text-primary" />
                      <span>{concept.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {concept.content}
                  </CardContent>
                </Card>
              )
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TheorySection;