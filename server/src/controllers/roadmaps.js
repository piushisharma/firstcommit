import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

const DEFAULT_STEPS = [
  { position: 1, title: 'Fork the repository', description: 'Click "Fork" on GitHub to create your own copy of the repo.' },
  { position: 2, title: 'Clone your fork', description: 'Run `git clone https://github.com/YOUR_USERNAME/REPO_NAME.git` to download it locally.' },
  { position: 3, title: 'Create a new branch', description: 'Run `git checkout -b fix/your-issue-name`. Never work directly on main.' },
  { position: 4, title: 'Set up the project', description: 'Follow the setup guide to install dependencies and configure environment variables.' },
  { position: 5, title: 'Make your change', description: 'Edit the code. Keep your change small and focused on one thing.' },
  { position: 6, title: 'Test your change', description: 'Run the tests and check your change works manually.' },
  { position: 7, title: 'Commit your change', description: 'Run `git add .` then `git commit -m "fix: describe what you changed"`.' },
  { position: 8, title: 'Push to your fork', description: 'Run `git push origin fix/your-issue-name`.' },
  { position: 9, title: 'Open a Pull Request', description: 'Go to GitHub and click "Compare & pull request". Fill in the PR template.' },
  { position: 10, title: 'Respond to review', description: 'Maintainers may ask for changes. Be patient and make the requested updates.' },
];

export async function createRoadmap(req, res, next) {
  try {
    const sb = getSupabase();
    const { owner, repo, issue_number, title } = req.body;
    const userId = req.user.id;

    const { data: roadmap, error: rmErr } = await sb
      .from('roadmaps')
      .insert({ user_id: userId, owner, repo, issue_number: issue_number || null, title })
      .select()
      .single();

    if (rmErr) throw rmErr;

    const steps = DEFAULT_STEPS.map(s => ({ ...s, roadmap_id: roadmap.id }));
    const { error: stepsErr } = await sb.from('roadmap_steps').insert(steps);
    if (stepsErr) throw stepsErr;

    const { data: fullRoadmap } = await sb
      .from('roadmaps')
      .select('*, roadmap_steps(*)')
      .eq('id', roadmap.id)
      .single();

    res.status(201).json(fullRoadmap);
  } catch (err) {
    next(err);
  }
}

export async function getRoadmap(req, res, next) {
  try {
    const sb = getSupabase();
    const { id } = req.params;
    const userId = req.user.id;

    const { data, error } = await sb
      .from('roadmaps')
      .select('*, roadmap_steps(*)')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Roadmap not found.' } });
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function updateStep(req, res, next) {
  try {
    const sb = getSupabase();
    const { id, stepId } = req.params;
    const { done } = req.body;
    const userId = req.user.id;

    // Verify ownership
    const { data: roadmap } = await sb
      .from('roadmaps')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!roadmap) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Roadmap not found.' } });
    }

    const { data, error } = await sb
      .from('roadmap_steps')
      .update({ done, done_at: done ? new Date().toISOString() : null })
      .eq('id', stepId)
      .eq('roadmap_id', id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Step not found.' } });
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
}
