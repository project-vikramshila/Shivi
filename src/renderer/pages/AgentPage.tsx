import React, { useEffect, useState } from 'react';

type AgentGoal = {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  targetApps: string[];
  priority: number;
  status: string;
};

type AgentWorkflow = {
  id: string;
  title: string;
  status: string;
  currentStepIndex: number;
  steps: Array<{ id: string; name: string; status: string; description: string }>;
};

const DEFAULT_APPS = ['browser', 'calendar', 'whatsapp', 'instagram'];

const AgentPage = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedApps, setSelectedApps] = useState<string[]>(['browser']);
  const [goals, setGoals] = useState<AgentGoal[]>([]);
  const [workflows, setWorkflows] = useState<AgentWorkflow[]>([]);
  const [status, setStatus] = useState<string>('Ready to plan autonomous goals.');
  const [running, setRunning] = useState(false);

  useEffect(() => {
    refreshStatus();
  }, []);

  const refreshStatus = async () => {
    try {
      if (!(window as any).shiviApi?.agent) {
        console.warn('Shivi API agent not available');
        return;
      }
      const goalResponse = await (window as any).shiviApi.agent.listGoals();
      const workflowResponse = await (window as any).shiviApi.agent.listActiveWorkflows();
      setGoals(goalResponse || []);
      setWorkflows(workflowResponse || []);
    } catch (error) {
      console.error('Failed to refresh agent status:', error);
    }
  };

  const toggleApp = (app: string) => {
    setSelectedApps((previous) =>
      previous.includes(app) ? previous.filter((item) => item !== app) : [...previous, app]
    );
  };

  const createAndRunGoal = async () => {
    if (!title.trim() || !description.trim()) return;
    setRunning(true);
    setStatus('Creating autonomous goal…');

    try {
      if (!(window as any).shiviApi?.agent) {
        console.warn('Shivi API agent not available');
        setStatus('Agent API not available. Please restart the application.');
        return;
      }
      const goal = await (window as any).shiviApi.agent.createGoal({
        title,
        description,
        targetApps: selectedApps,
        priority: 3,
      });

      setStatus('Executing agent workflow with intelligent planning…');
      const result = await (window as any).shiviApi.agent.executeGoal(goal.id);
      setStatus(result.success ? 'Workflow completed successfully 💖' : `Workflow failed: ${result.error}`);
      await refreshStatus();
    } catch (error) {
      console.error('Agent execution failed:', error);
      setStatus('Agent execution encountered an error.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className="glass-card rounded-[32px] p-8 mb-6">
      <div className="flex flex-col gap-3 mb-8">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-shivi-pink-200">Autonomous Agent</p>
          <h1 className="text-3xl font-semibold text-white">Shivi Agent Command Center</h1>
        </div>
        <p className="text-sm text-white/70 max-w-3xl">
          Create goal-driven workflows, ask Shivi to plan across apps, and monitor active autonomous execution in real time.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6 mb-8">
        <div className="rounded-3xl border border-white/10 bg-[#111827]/80 p-6 space-y-6">
          <div>
            <label className="text-sm font-semibold text-white">Agent Goal</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Goal title, e.g. Kal ki meeting prepare karo"
              className="mt-3 w-full rounded-3xl border border-white/10 bg-shivi-dark-900 p-4 text-sm text-white outline-none focus:border-pink-500"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-white">Goal Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what Shivi should plan, execute, and follow up on."
              className="mt-3 w-full min-h-[140px] rounded-3xl border border-white/10 bg-shivi-dark-900 p-4 text-sm text-white outline-none focus:border-pink-500"
            />
          </div>

          <div className="rounded-3xl border border-white/10 bg-shivi-dark-900 p-4">
            <p className="text-sm text-white/70 mb-3">Target Apps</p>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_APPS.map((app) => (
                <button
                  key={app}
                  onClick={() => toggleApp(app)}
                  className={`rounded-full px-4 py-2 text-sm transition ${selectedApps.includes(app) ? 'bg-shivi-pink-500 text-white' : 'bg-white/10 text-white/80 hover:bg-white/15'}`}
                >
                  {app}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={createAndRunGoal}
            disabled={running || !title.trim() || !description.trim()}
            className="rounded-3xl bg-shivi-pink-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-400 disabled:opacity-50"
          >
            {running ? 'Shivi is thinking…' : 'Launch Autonomous Goal'}
          </button>

          <div className="rounded-3xl border border-white/10 bg-[#0f172a]/80 p-4">
            <p className="text-sm text-shivi-pink-200 font-semibold mb-2">Agent Status</p>
            <p className="text-sm text-white/70">{status}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-[#111827]/80 p-6">
            <h2 className="text-base font-semibold text-white mb-4">Active Workflows</h2>
            {workflows.length === 0 ? (
              <p className="text-sm text-white/60">No workflows running right now.</p>
            ) : (
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <div key={workflow.id} className="rounded-3xl bg-shivi-dark-900 p-4 border border-white/5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{workflow.title}</p>
                      <span className="text-xs uppercase tracking-[0.2em] text-shivi-pink-200">{workflow.status}</span>
                    </div>
                    <p className="text-xs text-white/50 mt-2">Step {workflow.currentStepIndex + 1} of {workflow.steps.length}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#111827]/80 p-6">
            <h2 className="text-base font-semibold text-white mb-4">Recent Goals</h2>
            {goals.length === 0 ? (
              <p className="text-sm text-white/60">No goals created yet.</p>
            ) : (
              <div className="space-y-3">
                {goals.slice(-5).reverse().map((goal) => (
                  <div key={goal.id} className="rounded-2xl bg-shivi-dark-900 p-3 border border-white/5">
                    <p className="text-sm text-white/90 font-semibold">{goal.title}</p>
                    <p className="text-xs text-white/50 mt-1">Status: {goal.status} · Priority: {goal.priority}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AgentPage;
