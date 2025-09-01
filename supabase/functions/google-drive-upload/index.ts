import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to generate Google OAuth2 access token
async function getAccessToken(): Promise<string> {
  try {
    // Get service account credentials from environment
    const serviceAccountEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    const privateKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY');
    
    if (!serviceAccountEmail || !privateKey) {
      throw new Error('Google service account credentials not configured');
    }

    // Create JWT header and payload
    const jwtHeader = {
      alg: "RS256",
      typ: "JWT"
    };

    const now = Math.floor(Date.now() / 1000);
    const jwtPayload = {
      iss: serviceAccountEmail,
      scope: "https://www.googleapis.com/auth/drive.file",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now
    };

    // Base64URL encode header and payload
    const encodedHeader = btoa(JSON.stringify(jwtHeader)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const encodedPayload = btoa(JSON.stringify(jwtPayload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;

    // Import the private key
    const pemKey = privateKey.replace(/\\n/g, '\n');
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = pemKey.replace(pemHeader, "").replace(pemFooter, "").replace(/\s/g, "");
    
    // Decode base64 to get raw binary data
    const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
    
    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      binaryKey,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    // Sign the token
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      new TextEncoder().encode(unsignedToken)
    );

    // Base64URL encode signature
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    const jwt = `${unsignedToken}.${encodedSignature}`;

    // Exchange JWT for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Token request failed: ${error}`);
    }

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      throw new Error('No access token received from Google');
    }

    return tokenData.access_token;
  } catch (error) {
    console.error('Error generating access token:', error);
    throw new Error(`Failed to generate access token: ${error.message}`);
  }
}

// Helper function to create multipart body for file upload
function createMultipartBody(metadata: any, fileBuffer: ArrayBuffer, mimeType: string, boundary: string): Uint8Array {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];

  // Add metadata part
  parts.push(encoder.encode(`--${boundary}\r\n`));
  parts.push(encoder.encode('Content-Type: application/json; charset=UTF-8\r\n\r\n'));
  parts.push(encoder.encode(JSON.stringify(metadata)));
  parts.push(encoder.encode('\r\n'));

  // Add file part
  parts.push(encoder.encode(`--${boundary}\r\n`));
  parts.push(encoder.encode(`Content-Type: ${mimeType}\r\n\r\n`));
  parts.push(new Uint8Array(fileBuffer));
  parts.push(encoder.encode(`\r\n--${boundary}--\r\n`));

  // Calculate total length and create combined array
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const part of parts) {
    combined.set(part, offset);
    offset += part.length;
  }

  return combined;
}

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

    // Get the Firebase user from the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string || file.name;
    const description = formData.get('description') as string || '';
    const isPublic = formData.get('isPublic') === 'true';
    const tags = formData.get('tags') ? JSON.parse(formData.get('tags') as string) : [];
    const folderPath = formData.get('folderPath') as string || '/';
    const firebaseUserId = formData.get('firebaseUserId') as string;

    if (!file || !firebaseUserId) {
      throw new Error('File and Firebase user ID are required');
    }

    console.log(`Processing file upload: ${fileName} (${file.size} bytes, ${file.type})`);

    // Get Google Drive folder ID from environment
    const folderId = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID');
    if (!folderId) {
      throw new Error('Google Drive folder ID not configured');
    }

    // Generate OAuth2 access token
    const accessToken = await getAccessToken();
    console.log('Successfully generated access token');

    // Prepare file metadata for Google Drive
    const metadata = {
      name: fileName,
      parents: [folderId],
    };

    // Upload file to Google Drive using proper multipart body
    const fileBuffer = await file.arrayBuffer();
    const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(7);
    
    // Create proper multipart body for binary files
    const multipartBody = createMultipartBody(metadata, fileBuffer, file.type, boundary);

    console.log(`Uploading file to Google Drive: ${fileName}`);
    const driveResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartBody
    });

    const driveFile = await driveResponse.json();
    
    if (!driveResponse.ok) {
      throw new Error(`Google Drive upload failed: ${JSON.stringify(driveFile)}`);
    }

    console.log('File uploaded to Google Drive successfully:', driveFile.id);

    // Set file permissions for public access if needed
    if (isPublic) {
      console.log('Setting public permissions for file:', driveFile.id);
      const permissionResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${driveFile.id}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone'
        })
      });

      if (!permissionResponse.ok) {
        console.warn('Failed to set public permissions:', await permissionResponse.text());
      } else {
        console.log('Public permissions set successfully');
      }
    }

    // Generate download and preview URLs
    const downloadUrl = `https://drive.google.com/uc?id=${driveFile.id}&export=download`;
    const previewUrl = `https://drive.google.com/file/d/${driveFile.id}/view`;

    // Save file metadata to Supabase
    const { data: fileRecord, error: dbError } = await supabaseClient
      .from('files')
      .insert({
        name: fileName,
        google_drive_id: driveFile.id,
        mime_type: file.type,
        size_bytes: file.size,
        download_url: downloadUrl,
        preview_url: previewUrl,
        uploaded_by: firebaseUserId,
        is_public: isPublic,
        description,
        tags,
        folder_path: folderPath
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log('File uploaded successfully:', fileRecord);

    return new Response(JSON.stringify({ 
      success: true, 
      file: fileRecord,
      driveFileId: driveFile.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in google-drive-upload function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});