import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3, TrendingUp, Clock, DollarSign } from 'lucide-react';

export default function Analytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalRuns: 0,
    totalCost: 0,
    avgLatency: 0,
    successRate: 0,
    modelBreakdown: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [user]);

  const loadAnalytics = async () => {
    if (!user) return;

    try {
      const { data: runs, error } = await supabase
        .from('runs')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (!runs || runs.length === 0) {
        setLoading(false);
        return;
      }

      // Calculate stats
      const totalCost = runs.reduce((sum, run) => sum + (run.cost_usd || 0), 0);
      const avgLatency = runs.reduce((sum, run) => sum + (run.latency_ms || 0), 0) / runs.length;
      const successRate = (runs.filter(r => r.status === 'completed').length / runs.length) * 100;

      // Model breakdown
      const modelCounts = runs.reduce((acc, run) => {
        acc[run.model] = (acc[run.model] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const modelBreakdown = Object.entries(modelCounts).map(([model, count]) => ({
        model,
        count,
        percentage: (count / runs.length) * 100,
      }));

      setStats({
        totalRuns: runs.length,
        totalCost,
        avgLatency: Math.round(avgLatency),
        successRate: Math.round(successRate),
        modelBreakdown,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="h-full overflow-auto">
        <div className="container mx-auto p-8 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Track performance and costs across all your prompts
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : stats.totalRuns > 0 ? (
            <>
              {/* Key Metrics */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-card backdrop-blur-glass border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.totalRuns}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Prompt executions
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-card backdrop-blur-glass border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">${stats.totalCost.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      API costs
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-card backdrop-blur-glass border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.avgLatency}ms</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Response time
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-card backdrop-blur-glass border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.successRate}%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Successful runs
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Model Breakdown */}
              <Card className="shadow-card backdrop-blur-glass border-border/50">
                <CardHeader>
                  <CardTitle>Model Usage</CardTitle>
                  <CardDescription>Breakdown by LLM model</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.modelBreakdown.map((item) => (
                      <div key={item.model} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{item.model}</span>
                          <span className="text-muted-foreground">
                            {item.count} runs ({item.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full gradient-primary transition-all duration-500"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="shadow-card backdrop-blur-glass border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No analytics yet</h3>
                <p className="text-muted-foreground">
                  Run some prompts to see analytics and insights
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
