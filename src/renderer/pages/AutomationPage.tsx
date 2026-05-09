import React, { useState, useEffect } from 'react';
import AutomationControls from '../components/automation/AutomationControls';

const AutomationPage = () => {
  const [request, setRequest] = useState('');
  const [plan, setPlan] = useState<any>(null);
  const [taskResult, setTaskResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      if (!(window as any).shiviApi?.automation) {
        console.warn('Shivi API automation not available');
        return;
      }
      const response = await (window as any).shiviApi.automation.getTaskHistory();
      if (response?.success) {
        setHistory(response.history || []);
      }
    } catch (error) {
      console.error('Failed to load automation history:', error);
    }
  };

  const planTask = async () => {
    if (!request.trim()) {
      return;
    }

    setLoadingPlan(true);
    setTaskResult(null);

    try {
      if (!(window as any).shiviApi?.automation) {
        console.warn('Shivi API automation not available');
        return;
      }
      const response = await (window as any).shiviApi.automation.planTask(request);
      if (response?.success) {
        setPlan(response.plan);
      } else {
        setPlan(null);
      }
    } catch (error) {
      console.error('Failed to plan task:', error);
      setPlan(null);
    } finally {
      setLoadingPlan(false);
    }
  };

  const executePlannedTask = async () => {
    if (!plan) {
      return;
    }

    setExecuting(true);
    setTaskResult(null);

    try {
      if (!(window as any).shiviApi?.automation) {
        console.warn('Shivi API automation not available');
        return;
      }
      const execution = await (window as any).shiviApi.automation.executeTask({
        id: plan.taskId,
        description: plan.description,
        steps: plan.steps,
        maxRetries: 3,
        timeout: 60000,
        requiredPermission: plan.requiredPermission || 'assist',
        createdAt: Date.now(),
        status: 'pending',
      });

      if (execution?.success) {
        setTaskResult(execution.result);
      } else {
        setTaskResult({ error: execution?.error || 'Execution failed' });
      }

      await loadHistory();
    } catch (error) {
      console.error('Failed to execute task:', error);
      setTaskResult({ error: String(error) });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <section className="glass-card rounded-[32px] p-8 mb-6">
      <div className="flex flex-col gap-3 mb-8">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-shivi-pink-200">Automation</p>
          <h1 className="text-3xl font-semibold text-white">Desktop Automation Hub</h1>
        </div>
        <p className="text-sm text-white/70 max-w-3xl">
          Control Shivi's UI automation engine from here. Plan tasks in plain Hindi/English, inspect the workflow steps, and execute with secure permission gating.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6 mb-8">
        <div className="rounded-3xl border border-white/10 bg-[#111827]/80 p-6 space-y-6">
          <div>
            <label className="text-sm font-semibold text-white">Automation Request</label>
            <textarea
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              placeholder="Example: Rahul ka WhatsApp message check karo"
              className="mt-3 w-full min-h-[140px] rounded-3xl border border-white/10 bg-shivi-dark-900 p-4 text-sm text-white outline-none focus:border-pink-500"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={planTask}
              disabled={loadingPlan || !request.trim()}
              className="rounded-3xl bg-shivi-pink-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-pink-400 disabled:opacity-50"
            >
              {loadingPlan ? 'Planning…' : 'Plan Task'}
            </button>
            <button
              onClick={executePlannedTask}
              disabled={executing || !plan}
              className="rounded-3xl bg-shivi-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
            >
              {executing ? 'Executing…' : 'Execute Planned Task'}
            </button>
          </div>

          {plan && (
            <div className="rounded-3xl border border-white/10 bg-[#0f172a]/80 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-shivi-pink-200 mb-3">Planned Workflow</p>
              <p className="text-sm text-white/80 mb-4">{plan.explanation}</p>
              <div className="space-y-3">
                {plan.steps.map((step: any, index: number) => (
                  <div key={index} className="rounded-2xl bg-shivi-dark-900 p-3 border border-white/5">
                    <p className="text-sm text-white/90 font-semibold">{index + 1}. {step.type.toUpperCase()} - {step.subtype}</p>
                    <p className="text-xs text-white/50">{step.metadata?.operationName || step.description || 'Automated interaction step'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {taskResult && (
            <div className="rounded-3xl border border-white/10 bg-[#111827]/80 p-4">
              <h2 className="text-sm font-semibold text-white mb-3">Execution Result</h2>
              {taskResult.success ? (
                <div className="text-sm text-green-300">Task completed successfully in {taskResult.executionTime}ms.</div>
              ) : (
                <div className="text-sm text-red-300">{taskResult.error || 'Task failed.'}</div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <AutomationControls />

          <div className="rounded-3xl border border-white/10 bg-[#111827]/80 p-6">
            <h2 className="text-base font-semibold text-white mb-4">Recent Automation History</h2>
            <div className="space-y-3">
              {history.length === 0 ? (
                <p className="text-sm text-white/60">No automation runs yet.</p>
              ) : (
                history.slice(0, 5).map((entry, index) => (
                  <div key={index} className="rounded-2xl bg-shivi-dark-900 p-3 border border-white/5">
                    <p className="text-sm text-white/90 font-medium">{entry.taskId}</p>
                    <p className="text-xs text-white/50">Status: {entry.success ? 'Completed' : 'Failed'} · Steps: {entry.completedSteps}/{entry.totalSteps}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AutomationPage;
