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

    const { fileId, firebaseUserId } = await req.json();

    if (!fileId || !firebaseUserId) {
      throw new Error('File ID and Firebase user ID are required');
    }

    // Get file metadata from Supabase
    const { data: fileRecord, error: dbError } = await supabaseClient
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (dbError || !fileRecord) {
      throw new Error('File not found or access denied');
    }

    // Check if user has access to this file
    const { data: shareRecord } = await supabaseClient
      .from('file_shares')
      .select('*')
      .eq('file_id', fileId)
      .or(`shared_with.eq.${firebaseUserId},shared_with.eq.${req.headers.get('user-email')}`)
      .single();

    const hasAccess = fileRecord.uploaded_by === firebaseUserId || 
                     fileRecord.is_public || 
                     shareRecord;

    if (!hasAccess) {
      throw new Error('Access denied');
    }

    // Log the download activity
    await supabaseClient
      .from('file_activities')
      .insert({
        file_id: fileId,
        user_id: firebaseUserId,
        activity_type: 'download',
        details: { file_name: fileRecord.name },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      });

    // Update access count and last accessed time
    await supabaseClient
      .from('files')
      .update({ 
        access_count: fileRecord.access_count + 1,
        last_accessed: new Date().toISOString()
      })
      .eq('id', fileId);

    // Update share access count if applicable
    if (shareRecord) {
      await supabaseClient
        .from('file_shares')
        .update({ 
          access_count: shareRecord.access_count + 1,
          last_accessed: new Date().toISOString()
        })
        .eq('id', shareRecord.id);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      downloadUrl: fileRecord.download_url,
      previewUrl: fileRecord.preview_url,
      fileName: fileRecord.name,
      mimeType: fileRecord.mime_type,
      sizeBytes: fileRecord.size_bytes
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in google-drive-download function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});