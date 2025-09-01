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
      .eq('uploaded_by', firebaseUserId)
      .single();

    if (dbError || !fileRecord) {
      throw new Error('File not found or you do not have permission to delete this file');
    }

    // Google Drive API credentials (same as upload function)
    const serviceAccount = {
      "type": "service_account",
      "project_id": "solar-virtue-467019-m3",
      "private_key_id": "9ac8f7cadf19aeae2f24e820ff80d52a0af310ee",
      "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDrEubJxBWOzXWk\nSl6SvxJIlKIMQkoFTKkLIYqjG2hkDZVMqPbygnGgoFBtBXXkPAd4Y0cXbGI9yNi5\nN/QiyX/3x/baONQUoh1sX7zwZ55pX4PcfdnAnCwGQ7mrV2sk1QHWfzvBxtRl0nTa\nCHBwZD1VOr6DC2fWDe4o8B1iheogtAx6gC2mktnfDTO75p/1aiSdbrKmKt7Yl7ts\nX1rErYvr6LXAP2qi5gtalWnaEzp86QmclTN1upsSZt7pCoZjU0RHE6nUIPUGd0DT\nq5lJoz+QIol/RRt7hp84Q2yJ4ldrEESmXAG12ajNFqVUbUYQRDX0kI8P9BUir/27\neDccL2uPAgMBAAECggEAAonXNsMomm/eJXKG8YQhSrbA+Z621VAET7Io7ZiS3xwe\n1xxh++Q46hht4rRMfbTz10x3Jl0aW64+DOEtgGyqaZh3fwuRdFGV1yd0TyitsL41\nZ2pvStTef6JrY436AoSCuxHvqSi5y9Z8dYt7lb/qjtX0dbTOhiS4KpABOTpwX0vQ\nV3ZagI96WOaqy24DcidqbRd70gd3o+DTCCZl3R5N+HYDKV7tvDxWpXYfiop3x0Fz\nisI92Bs52AGbdBk5EVRg/a9G5lTnmsFiyp+DdLXUXsTx5+wpOEXCB6vVwtTzaLUw\n1DU55Updv7h/rzujnkOUKxxrgUOOqUbjKIMsG0ylBQKBgQD4Wc2SCPMxRruf6pFy\nYfdNY6urNLpQ426R2fsAHVQnK7BRiYtGlT0DZlm/iKKHb3G0w/Ck5nfPOPOfeD20\nYlz2M40l7UM3mVOWwx5es46Y8VxJqpoWn4kSEM1qvv8P+02ws7EfgvrkRlHBYytx\nzf+HWFYWkNanmt0nPipipddchQKBgQDyUGmM2hOqDK8D4mdYj9hZzzDrefHizeOi\nHH3jPTD94sWtU5Lb5mvngaV4zz+a4VLejiGbkJLwTPhO/j8/1/8yPGCApKF/ebst\nn96N9SZiCR58SdiVEi+5IW7Ct8itPmti7uv1XVoIZIgd9AixUGnIzbfOYNn0hIzm\n1wobMRbeAwKBgFibAaL2mn2cNNirQdVDao4r31Wn7Elru0lCMjEqRZnsFm4g2pYG\nLMyHucGCKCqV8kWCGttadqhyM0lUBv/SkEQuxE8hxXeStqX1W2KCQYADrN+DhJJJ\nvQe7Au7w0eOLz34Zvjn16zmCdSzACwIBcweA1sYaSttlfz2/CjRD4wBZAoGBAMH1\nwfdgHHtyuakHUigexFRnN8ZVj1w36C08VzxNH+kp24e5LQXedKMUMMr6QfSMxlOl\nO5uVZzj4s44vj5tgH0Mr9yciIK+0VjLYFEJXaEjy+bcNOVNiAldTPqCYkgayvyyr\nCK8X8VhkeFxZmZetQW/d03JcLjq+2zZwDQPlEGPXAoGBAO3H4bbM+cWNmBkl95bs\nB7UiyFp6X7AOl18SOMUm4E9Jzd/skWfSuGkxWrN+3ywwj/TlSSKgANHqGh6eww7z\n42lwy+fYuKLhwHlTT0XGNocg/PS2ygI+d62LI8talfSPcNKbpCUgBQabCpBPafgD\nDd63GUKe80lPK8TpM8lF3HgE\n-----END PRIVATE KEY-----\n",
      "client_email": "bmunisfilestorage@solar-virtue-467019-m3.iam.gserviceaccount.com",
      "client_id": "102042730575034996985",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/bmunisfilestorage%40solar-virtue-467019-m3.iam.gserviceaccount.com",
      "universe_domain": "googleapis.com"
    };

    // Get access token (same JWT process as upload)
    const jwtHeader = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const now = Math.floor(Date.now() / 1000);
    const jwtPayload = btoa(JSON.stringify({
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/drive.file",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now
    }));

    const jwtUnsigned = `${jwtHeader}.${jwtPayload}`;
    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      new TextEncoder().encode(serviceAccount.private_key.replace(/\\n/g, '\n')),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      privateKey,
      new TextEncoder().encode(jwtUnsigned)
    );

    const jwt = `${jwtUnsigned}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;

    // Get access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });

    const { access_token } = await tokenResponse.json();

    // Delete file from Google Drive
    const driveResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileRecord.google_drive_id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    if (!driveResponse.ok) {
      const error = await driveResponse.text();
      console.error('Google Drive deletion failed:', error);
      // Continue with database deletion even if Drive deletion fails
    }

    // Delete file record from Supabase (this will cascade delete shares and activities)
    const { error: deleteError } = await supabaseClient
      .from('files')
      .delete()
      .eq('id', fileId);

    if (deleteError) {
      throw new Error(`Failed to delete file record: ${deleteError.message}`);
    }

    console.log('File deleted successfully:', fileRecord.name);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'File deleted successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in google-drive-delete function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});