'use server';

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { requireCallerSession, requireRole } from '@/lib/auth-session';

function requireSupabase() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('DATABASE_NOT_CONFIGURED');
  return supabase;
}

export async function getProjectsAction() {
  try {
    const session = await requireCallerSession();
    const supabase = requireSupabase();

    let query = supabase.from('projects').select(`
      *,
      deals (
        deal_name,
        package_type,
        owner_caller_id,
        stage
      )
    `);

    // Gating projects depending on role
    if (session.role === 'Developer') {
      query = query.eq('assigned_developer_id', session.name);
    } else if (session.role === 'Caller' || session.role === 'Closer') {
      // Fetch only projects where the caller is the owner of the deal
      // Supabase inner join filtering can be done using join filtering or fetching deals first.
      // Let's get the deal IDs owned by the caller first, or query deals filter.
      const { data: callerDeals } = await supabase
        .from('deals')
        .select('id')
        .eq('owner_caller_id', session.name);
      
      const dealIds = (callerDeals || []).map((d: any) => d.id);
      if (dealIds.length === 0) {
        return { success: true, projects: [] };
      }
      query = query.in('deal_id', dealIds);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(error.message);

    return { success: true, projects: data || [] };
  } catch (error: any) {
    console.error('[getProjectsAction]', error.message);
    return { success: false, error: error.message };
  }
}

export async function assignDeveloperAction(projectId: number, developerId: string) {
  try {
    const session = await requireRole(['Admin', 'Manager', 'Supervisor']);
    const supabase = requireSupabase();

    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('assigned_developer_id')
      .eq('id', projectId)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    const { data, error } = await supabase
      .from('projects')
      .update({
        assigned_developer_id: developerId,
        current_stage: 'Development Started' // Move stage to development started on assignment
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Audit Log
    await supabase.from('audit_logs').insert({
      caller_name: session.name,
      action_type: 'ASSIGN_DEVELOPER',
      details: `Project ID ${projectId} assigned to developer ${developerId} by ${session.name}. (Old Dev: ${project?.assigned_developer_id || 'none'})`,
      lead_id: null
    });

    return { success: true, project: data };
  } catch (error: any) {
    console.error('[assignDeveloperAction]', error.message);
    return { success: false, error: error.message };
  }
}

export async function updateProjectChecklistAction(projectId: number, checklist: Record<string, boolean>) {
  try {
    const session = await requireCallerSession(); // Developer, Admin, Manager, Caller can update checklist
    const supabase = requireSupabase();

    // Verify role is appropriate
    const allowedRoles = ['Admin', 'Manager', 'Supervisor', 'Developer', 'Caller', 'Closer'];
    if (!allowedRoles.includes(session.role)) {
      throw new Error('UNAUTHORIZED_ROLE');
    }

    const { data: existingProject, error: fetchError } = await supabase
      .from('projects')
      .select('client_content_status')
      .eq('id', projectId)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    const oldChecklist = existingProject?.client_content_status || {};

    const { data, error } = await supabase
      .from('projects')
      .update({
        client_content_status: checklist
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Log in audits
    await supabase.from('audit_logs').insert({
      caller_name: session.name,
      action_type: 'UPDATE_PROJECT_CHECKLIST',
      details: `Project ID ${projectId} content checklist updated by ${session.name}.`,
      lead_id: null
    });

    return { success: true, project: data };
  } catch (error: any) {
    console.error('[updateProjectChecklistAction]', error.message);
    return { success: false, error: error.message };
  }
}

export async function updateProjectStageAction(projectId: number, stage: string, previewUrl?: string) {
  try {
    const session = await requireCallerSession();
    const supabase = requireSupabase();

    // Only Admin, Manager, Supervisor, and the Assigned Developer can change project stages
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('assigned_developer_id, current_stage')
      .eq('id', projectId)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    const isAssignedDev = session.role === 'Developer' && project?.assigned_developer_id === session.name;
    const isManagement = ['Admin', 'Manager', 'Supervisor'].includes(session.role);

    if (!isAssignedDev && !isManagement) {
      throw new Error('UNAUTHORIZED_PROJECT_STAGE_UPDATE');
    }

    const updatePayload: any = { current_stage: stage };
    if (previewUrl !== undefined) {
      updatePayload.preview_url = previewUrl;
    }

    if (stage === 'Delivered') {
      updatePayload.delivered_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('projects')
      .update(updatePayload)
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Audit log
    await supabase.from('audit_logs').insert({
      caller_name: session.name,
      action_type: 'UPDATE_PROJECT_STAGE',
      details: `Project ID ${projectId} stage updated to "${stage}" by ${session.name}.${previewUrl ? ` Preview URL: ${previewUrl}` : ''} (Old Stage: ${project?.current_stage || 'unknown'})`,
      lead_id: null
    });

    return { success: true, project: data };
  } catch (error: any) {
    console.error('[updateProjectStageAction]', error.message);
    return { success: false, error: error.message };
  }
}
