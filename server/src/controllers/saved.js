import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function getSavedRepos(req, res, next) {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('saved_repos')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
}

export async function saveRepo(req, res, next) {
  try {
    const sb = getSupabase();
    const { owner, repo, summary_json } = req.body;
    const { data, error } = await sb
      .from('saved_repos')
      .upsert({ user_id: req.user.id, owner, repo, summary_json }, { onConflict: 'user_id,owner,repo' })
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { next(err); }
}

export async function deleteSavedRepo(req, res, next) {
  try {
    const sb = getSupabase();
    const { owner, repo } = req.params;
    await sb.from('saved_repos').delete().eq('user_id', req.user.id).eq('owner', owner).eq('repo', repo);
    res.status(204).end();
  } catch (err) { next(err); }
}

export async function getSavedIssues(req, res, next) {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('saved_issues')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
}

export async function saveIssue(req, res, next) {
  try {
    const sb = getSupabase();
    const { owner, repo, issue_number, title, difficulty } = req.body;
    const { data, error } = await sb
      .from('saved_issues')
      .upsert({ user_id: req.user.id, owner, repo, issue_number, title, difficulty }, { onConflict: 'user_id,owner,repo,issue_number' })
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { next(err); }
}

export async function deleteSavedIssue(req, res, next) {
  try {
    const sb = getSupabase();
    const { id } = req.params;
    await sb.from('saved_issues').delete().eq('user_id', req.user.id).eq('id', id);
    res.status(204).end();
  } catch (err) { next(err); }
}
