import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Play, Zap, Clock, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const MODELS = [
  { value: 'gpt-4', label: 'GPT-4', cost: 0.03 },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', cost: 0.002 },
  { value: 'claude-3-opus', label: 'Claude 3 Opus', cost: 0.015 },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet', cost: 0.003 },
  { value: 'gemini-pro', label: 'Gemini Pro', cost: 0.00025 },
];

export default function Run() {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<any[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    loadPrompts();
  }, [user]);

  const loadPrompts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrompts(data || []);
    } catch (error) {
      console.error('Error loading prompts:', error);
    }
  };

  const handleRun = async () => {
    if (!selectedPrompt || !user) {
      toast.error('Please select a prompt');
      return;
    }

    setRunning(true);
    setResult(null);

    try {
      const prompt = prompts.find(p => p.id === selectedPrompt);
      if (!prompt) throw new Error('Prompt not found');

      // Simulate API call with random values
      const startTime = Date.now();
      
      // Mock delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
      
      const latency = Date.now() - startTime;
      const tokens = Math.floor(100 + Math.random() * 400);
      const modelCost = MODELS.find(m => m.value === selectedModel)?.cost || 0;
      const cost = (tokens / 1000) * modelCost;

      // Mock response
      const response = `This is a simulated response from ${selectedModel}. In a real implementation, this would call the actual LLM API.`;

      // Save run to database
      const { error } = await supabase
        .from('runs')
        .insert({
          prompt_id: prompt.id,
          model: selectedModel,
          response,
          tokens_used: tokens,
          latency_ms: latency,
          cost_usd: cost,
          status: 'completed',
          user_id: user.id,
        });

      if (error) throw error;

      setResult({
        response,
        latency,
        tokens,
        cost,
      });

      toast.success('Prompt executed successfully');
    } catch (error) {
      console.error('Error running prompt:', error);
      toast.error('Failed to run prompt');
    } finally {
      setRunning(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="h-full overflow-auto">
        <div className="container mx-auto p-8 space-y-8 max-w-5xl">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Run Prompt</h1>
            <p className="text-muted-foreground mt-2">
              Execute prompts across different LLM models
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Configuration */}
            <Card className="shadow-card backdrop-blur-glass border-border/50">
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>Select prompt and model to run</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="prompt">Prompt Template</Label>
                  <Select value={selectedPrompt} onValueChange={setSelectedPrompt}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a prompt" />
                    </SelectTrigger>
                    <SelectContent>
                      {prompts.map((prompt) => (
                        <SelectItem key={prompt.id} value={prompt.id}>
                          {prompt.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODELS.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          <div className="flex items-center justify-between w-full">
                            <span>{model.label}</span>
                            <span className="text-xs text-muted-foreground ml-4">
                              ${model.cost}/1K tokens
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPrompt && (
                  <div className="space-y-2">
                    <Label>Prompt Content</Label>
                    <Textarea
                      value={prompts.find(p => p.id === selectedPrompt)?.content || ''}
                      disabled
                      rows={6}
                      className="resize-none"
                    />
                  </div>
                )}

                <Button 
                  onClick={handleRun} 
                  disabled={!selectedPrompt || running}
                  className="w-full gap-2"
                >
                  {running ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Run Prompt
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <Card className="shadow-card backdrop-blur-glass border-border/50">
              <CardHeader>
                <CardTitle>Results</CardTitle>
                <CardDescription>Execution output and metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {result ? (
                  <div className="space-y-6">
                    {/* Metrics */}
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="flex items-center gap-3 rounded-lg border border-border/50 p-3">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-2xl font-bold">{result.latency}ms</p>
                          <p className="text-xs text-muted-foreground">Latency</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 rounded-lg border border-border/50 p-3">
                        <Zap className="h-5 w-5 text-accent" />
                        <div>
                          <p className="text-2xl font-bold">{result.tokens}</p>
                          <p className="text-xs text-muted-foreground">Tokens</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 rounded-lg border border-border/50 p-3">
                        <DollarSign className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-2xl font-bold">${result.cost.toFixed(4)}</p>
                          <p className="text-xs text-muted-foreground">Cost</p>
                        </div>
                      </div>
                    </div>

                    {/* Response */}
                    <div className="space-y-2">
                      <Label>Response</Label>
                      <div className="rounded-lg border border-border/50 p-4 bg-secondary/20">
                        <p className="text-sm leading-relaxed">{result.response}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Play className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      Select a prompt and click Run to see results
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
