import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { fileId, sharedWith, permissionLevel, expiresAt, firebaseUserId } = await req.json();

    if (!fileId || !sharedWith || !permissionLevel || !firebaseUserId) {
      throw new Error('File ID, shared with, permission level, and Firebase user ID are required');
    }

    // Verify the user owns the file
    const { data: fileRecord, error: fileError } = await supabaseClient
      .from('files')
      .select('*')
      .eq('id', fileId)
      .eq('uploaded_by', firebaseUserId)
      .single();

    if (fileError || !fileRecord) {
      throw new Error('File not found or you do not have permission to share this file');
    }

    // Check if share already exists
    const { data: existingShare } = await supabaseClient
      .from('file_shares')
      .select('*')
      .eq('file_id', fileId)
      .eq('shared_with', sharedWith)
      .single();

    let shareRecord;

    if (existingShare) {
      // Update existing share
      const { data: updatedShare, error: updateError } = await supabaseClient
        .from('file_shares')
        .update({
          permission_level: permissionLevel,
          expires_at: expiresAt,
        })
        .eq('id', existingShare.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update share: ${updateError.message}`);
      }
      shareRecord = updatedShare;
    } else {
      // Create new share
      const { data: newShare, error: shareError } = await supabaseClient
        .from('file_shares')
        .insert({
          file_id: fileId,
          shared_with: sharedWith,
          permission_level: permissionLevel,
          shared_by: firebaseUserId,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (shareError) {
        throw new Error(`Failed to create share: ${shareError.message}`);
      }
      shareRecord = newShare;
    }

    // Log the share activity
    await supabaseClient
      .from('file_activities')
      .insert({
        file_id: fileId,
        user_id: firebaseUserId,
        activity_type: 'share',
        details: { 
          shared_with: sharedWith, 
          permission_level: permissionLevel,
          expires_at: expiresAt
        },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      });

    return new Response(JSON.stringify({ 
      success: true, 
      share: shareRecord,
      message: existingShare ? 'Share updated successfully' : 'File shared successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in google-drive-share function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});