import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Play, TrendingUp, Clock, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPrompts: 0,
    totalRuns: 0,
    recentRuns: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user) return;

    try {
      const [promptsResult, runsResult] = await Promise.all([
        supabase.from('prompts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('runs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      ]);

      setStats({
        totalPrompts: promptsResult.count || 0,
        totalRuns: runsResult.data?.length || 0,
        recentRuns: runsResult.data || [],
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="h-full overflow-auto">
        <div className="container mx-auto p-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground mt-2">
                Track, test, and optimize your LLM prompts
              </p>
            </div>
            <Link to="/prompts">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Prompt
              </Button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-card backdrop-blur-glass border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Prompts</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{loading ? '-' : stats.totalPrompts}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active prompt templates
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card backdrop-blur-glass border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
                <Play className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{loading ? '-' : stats.totalRuns}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Prompt executions
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card backdrop-blur-glass border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {loading ? '-' : stats.recentRuns.length > 0 
                    ? `${Math.round(stats.recentRuns.reduce((acc, run) => acc + (run.latency_ms || 0), 0) / stats.recentRuns.length)}ms`
                    : '-'
                  }
                </div>
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
                <div className="text-3xl font-bold">
                  {loading ? '-' : stats.recentRuns.length > 0
                    ? `${Math.round((stats.recentRuns.filter(r => r.status === 'completed').length / stats.recentRuns.length) * 100)}%`
                    : '-'
                  }
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Successful runs
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="shadow-card backdrop-blur-glass border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Runs</CardTitle>
                  <CardDescription>Latest prompt executions</CardDescription>
                </div>
                <Link to="/analytics">
                  <Button variant="ghost" size="sm" className="gap-2">
                    View All
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : stats.recentRuns.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentRuns.map((run) => (
                    <div
                      key={run.id}
                      className="flex items-center justify-between rounded-lg border border-border/50 p-4"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{run.model}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(run.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{run.latency_ms}ms</p>
                          <p className="text-xs text-muted-foreground">{run.tokens_used} tokens</p>
                        </div>
                        <div className={`rounded-full px-2 py-1 text-xs font-medium ${
                          run.status === 'completed' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                        }`}>
                          {run.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Play className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No runs yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create a prompt and run it to see activity here
                  </p>
                  <Link to="/prompts" className="mt-4">
                    <Button variant="outline">Get Started</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
