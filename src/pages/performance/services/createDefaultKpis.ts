
import { supabase } from "@/integrations/supabase/client";

export async function createDefaultKpisIfEmpty(reviewId: string): Promise<boolean> {
  try {
    console.log(`Checking KPIs for review ${reviewId}`);
    
    // Check if there are any KPIs for this review
    const { data: existingKpis, error: checkError } = await supabase
      .from('performance_kpis')
      .select('id, description')
      .eq('review_id', reviewId);
      
    if (checkError) {
      console.error("Error checking existing KPIs:", checkError);
      return false;
    }
    
    // Debug existing KPIs content
    console.log("Existing KPIs found:", existingKpis);
    
    // If KPIs already exist with non-empty descriptions, return true (success)
    if (existingKpis && existingKpis.length > 0) {
      const validKpis = existingKpis.filter(kpi => kpi.description && kpi.description.trim() !== '');
      
      console.log(`KPI validation check: ${validKpis.length} valid out of ${existingKpis.length} total`);
      
      if (validKpis.length > 0) {
        console.log(`Found ${validKpis.length} valid KPIs for review ${reviewId}`);
        return true;
      }
    }
    
    console.log(`No valid KPIs found for review ${reviewId}, attempting to create default KPIs...`);
    
    // First, fetch the review to make sure we have access
    const { data: review, error: reviewError } = await supabase
      .from('performance_reviews')
      .select('*')
      .eq('id', reviewId)
      .single();
      
    if (reviewError) {
      console.error("Error fetching review for KPI creation:", reviewError);
      return false;
    }
    
    // Create default KPIs with meaningful descriptions
    const defaultKpis = [
      {
        review_id: reviewId,
        description: 'Cumplimiento de tareas asignadas',
        deadline: new Date().toISOString().split('T')[0],
        weight: 33,
        completion_percentage: 0,
        supervisor_rating: 0
      },
      {
        review_id: reviewId,
        description: 'Calidad del trabajo realizado',
        deadline: new Date().toISOString().split('T')[0],
        weight: 33,
        completion_percentage: 0,
        supervisor_rating: 0
      },
      {
        review_id: reviewId,
        description: 'Cumplimiento de objetivos del departamento',
        deadline: new Date().toISOString().split('T')[0],
        weight: 34,
        completion_percentage: 0,
        supervisor_rating: 0
      }
    ];
    
    // Call our custom RPC function that bypasses RLS
    const { data: insertResult, error: insertError } = await supabase
      .rpc('create_default_kpis', { 
        review_id_param: reviewId,
        kpis_data: defaultKpis
      });
    
    if (insertError) {
      console.error("Error inserting default KPIs via RPC:", insertError);
      
      // Fallback to direct insert if RPC fails (might still fail due to RLS)
      const { error: directInsertError } = await supabase
        .from('performance_kpis')
        .insert(defaultKpis);
        
      if (directInsertError) {
        console.error("Error with fallback direct insert of default KPIs:", directInsertError);
        return false;
      }
    }
    
    console.log("Successfully created default KPIs for review", reviewId);
    return true;
  } catch (error) {
    console.error("Unexpected error in createDefaultKpisIfEmpty:", error);
    return false;
  }
}
