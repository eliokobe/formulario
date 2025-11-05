// Generic interface for Airtable responses
interface AirtableResponse {
  records: any[];
}

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_REPARACIONES = process.env.AIRTABLE_TABLE_REPARACIONES;
const AIRTABLE_TABLE_FORMULARIO = process.env.AIRTABLE_TABLE_FORMULARIO;
const AIRTABLE_TABLE_BOOKINGS = process.env.AIRTABLE_TABLE_NAME;
const AIRTABLE_TABLE_CLIENTES = process.env.AIRTABLE_TABLE_CLIENTES;

// Ensure table names with spaces/accents are URL-safe
const getBaseUrl = (tableName: string) => `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`;

async function makeRequest(url: string, options: RequestInit = {}) {
  const headers = {
    'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  let retries = 3;
  while (retries > 0) {
    try {
      const response = await fetch(url, { ...options, headers });
      
      if (response.status === 429) {
        // Rate limiting - wait and retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries--;
        continue;
      }
      
      if (!response.ok) {
        let details = '';
        try {
          const text = await response.text();
          details = text.length < 500 ? ` - ${text}` : '';
        } catch {}
        throw new Error(`Airtable API error: ${response.status} ${response.statusText}${details}`);
      }
      
      return response;
    } catch (error) {
      if (retries === 1) throw error;
      retries--;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

// Generic helpers specific to tables that remain in use

// Generic functions for any table
export async function createRecord(tableName: string, fields: Record<string, any>): Promise<{ id: string }> {
  // Filter out undefined values to avoid sending them to Airtable
  const cleanedFields = Object.entries(fields).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, any>);

  const payload = { fields: cleanedFields };

  try {
    const response = await makeRequest(getBaseUrl(tableName), {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!response) {
      throw new Error('No response received from Airtable');
    }
    
    const data: any = await response.json();
    
    if (!data.id) {
      throw new Error('No ID returned from Airtable');
    }
    
    return { id: data.id };
  } catch (error) {
    console.error(`Error creating record in ${tableName}:`, error);
    throw new Error(`Failed to create record in ${tableName}`);
  }
}

export async function listRecords(tableName: string, params?: Record<string, string>): Promise<any[]> {
  let url = getBaseUrl(tableName);
  
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  try {
    const response = await makeRequest(url);
    if (!response) {
      throw new Error('No response received from Airtable');
    }
    const data: AirtableResponse = await response.json();
    return data.records;
  } catch (error) {
    console.error(`Error listing records from ${tableName}:`, error);
    throw new Error(`Failed to list records from ${tableName}`);
  }
}

export async function getRecordById(tableName: string, recordId: string): Promise<any> {
  const url = `${getBaseUrl(tableName)}/${recordId}`;

  try {
    const response = await makeRequest(url);
    if (!response) {
      throw new Error('No response received from Airtable');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error getting record ${recordId} from ${tableName}:`, error);
    throw new Error(`Failed to get record from ${tableName}`);
  }
}

export async function updateRecord(tableName: string, id: string, fields: Record<string, any>): Promise<{ id: string }> {
  console.log('🔧 updateRecord called with:');
  console.log('  tableName:', tableName);
  console.log('  recordId:', id);
  console.log('  fields keys:', Object.keys(fields));
  
  // Filter out undefined values and keep null values (to clear fields in Airtable)
  const cleanedFields = Object.entries(fields).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, any>);
  
  console.log('  cleaned fields keys:', Object.keys(cleanedFields));

  const payload = { fields: cleanedFields };
  console.log('📤 Payload size:', JSON.stringify(payload).length, 'characters');

  try {
    const url = `${getBaseUrl(tableName)}/${id}`;
    console.log('📤 Request URL:', url);
    console.log('📤 Making PATCH request to Airtable...');
    
    const response = await makeRequest(url, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    if (!response) {
      console.error('❌ No response received from Airtable');
      throw new Error('No response received from Airtable');
    }
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data: any = await response.json();
    console.log('📥 Response data keys:', Object.keys(data));
    
    if (!data.id) {
      console.error('❌ No ID in response data:', data);
      throw new Error('No ID returned from Airtable update');
    }
    
    console.log('✅ updateRecord successful, returned ID:', data.id);
    return { id: data.id };
  } catch (error: any) {
    console.error(`❌ updateRecord error in ${tableName}:`, error.name, error.message);
    console.error('❌ Full error:', JSON.stringify(error, null, 2));
    throw new Error(`Failed to update record in ${tableName}: ${error.message}`);
  }
}

// Booking helpers
export async function findByDateTime(dateTime: string): Promise<any | null> {
  if (!AIRTABLE_TABLE_BOOKINGS) {
    throw new Error('AIRTABLE_TABLE_NAME is not configured');
  }

  const records = await listRecords(AIRTABLE_TABLE_BOOKINGS, {
    filterByFormula: `{date_time} = '${dateTime}'`,
    maxRecords: '1',
  });

  return records.length > 0 ? records[0] : null;
}

export async function createBooking(fields: { name: string; email: string; date_time: string }): Promise<{ id: string }> {
  if (!AIRTABLE_TABLE_BOOKINGS) {
    throw new Error('AIRTABLE_TABLE_NAME is not configured');
  }

  const payload = {
    Name: fields.name,
    Email: fields.email,
    date_time: fields.date_time,
  };

  return createRecord(AIRTABLE_TABLE_BOOKINGS, payload);
}

// Specific function for creating repairs
export async function createRepair(repairData: any): Promise<{ id: string }> {
  return createRecord(AIRTABLE_TABLE_REPARACIONES!, repairData);
}

export async function findRepairByExpediente(expediente: string): Promise<any[]> {
  return listRecords(AIRTABLE_TABLE_REPARACIONES!, {
    filterByFormula: `{Expediente} = '${expediente}'`,
    maxRecords: '1',
  });
}

export async function getRepairById(recordId: string): Promise<any> {
  return getRecordById(AIRTABLE_TABLE_REPARACIONES!, recordId);
}

export async function updateRepairRecord(recordId: string, data: any): Promise<{ id: string }> {
  return updateRecord(AIRTABLE_TABLE_REPARACIONES!, recordId, data);
}

// Specific functions for Formulario table
export async function findFormularioByExpediente(expediente: string): Promise<any[]> {
  return listRecords(AIRTABLE_TABLE_FORMULARIO!, {
    filterByFormula: `{Expediente} = '${expediente}'`,
    maxRecords: '1',
  });
}

export async function getFormularioById(recordId: string): Promise<any> {
  return getRecordById(AIRTABLE_TABLE_FORMULARIO!, recordId);
}

export async function updateFormulario(recordId: string, data: any): Promise<{ id: string }> {
  console.log('🔧 updateFormulario called with recordId:', recordId);
  console.log('🔧 updateFormulario table:', AIRTABLE_TABLE_FORMULARIO);
  console.log('🔧 updateFormulario data keys:', Object.keys(data));
  
  try {
    const result = await updateRecord(AIRTABLE_TABLE_FORMULARIO!, recordId, data);
    console.log('✅ updateFormulario successful:', result.id);
    return result;
  } catch (error: any) {
    console.error('❌ updateFormulario failed:', error.message);
    console.error('❌ updateFormulario error details:', JSON.stringify(error, null, 2));
    throw error;
  }
}

export async function createFormulario(data: any): Promise<{ id: string }> {
  return createRecord(AIRTABLE_TABLE_FORMULARIO!, data);
}

// Clients table helpers
export async function createClient(fields: Record<string, any>): Promise<{ id: string }> {
  if (!AIRTABLE_TABLE_CLIENTES) {
    throw new Error('AIRTABLE_TABLE_CLIENTES is not configured');
  }

  return createRecord(AIRTABLE_TABLE_CLIENTES, fields);
}

// File upload utilities for base64 conversion
export function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
}

// Convert base64 to Airtable attachment format
export function createAirtableAttachment(base64: string, filename: string) {
  return {
    url: base64,
    filename: filename,
  };
}

// Helper function to process multiple files for Airtable
export async function processFilesForAirtable(files: FileList | File[]): Promise<any[]> {
  const attachments = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i] instanceof File ? files[i] : (files as FileList)[i];
    try {
      const base64 = await convertFileToBase64(file);
      attachments.push(createAirtableAttachment(base64, file.name));
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      throw new Error(`Failed to process file: ${file.name}`);
    }
  }
  
  return attachments;
}

// Upload image to Airtable using the correct content endpoint
export async function uploadImageToAirtable(recordId: string, fieldName: string, imageData: any): Promise<void> {
  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
    throw new Error('Airtable configuration missing');
  }

  // Extract base64 data from the image object
  let dataUrl: string | undefined;
  let filename: string | undefined;

  if (typeof imageData === 'string' && imageData.startsWith('data:')) {
    dataUrl = imageData;
  } else if (imageData && typeof imageData === 'object' && typeof imageData.url === 'string') {
    dataUrl = imageData.url;
    filename = imageData.filename;
  }

  if (!dataUrl) {
    throw new Error('Invalid image data format');
  }

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid data URL format');
  }

  const contentType = match[1];
  const base64Data = match[2];
  const resolvedFilename = filename || `attachment.${contentType.split('/')[1] || 'bin'}`;

  const uploadUrl = `https://content.airtable.com/v0/${AIRTABLE_BASE_ID}/${recordId}/${encodeURIComponent(fieldName)}/uploadAttachment`;
  
  const payload = JSON.stringify({
    contentType,
    file: base64Data,
    filename: resolvedFilename,
  });

  console.log(`📤 Uploading to: ${uploadUrl}`);
  console.log(`📤 Payload size: ${payload.length} characters`);
  
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: payload,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Upload failed: ${response.status} ${response.statusText}`);
    console.error(`❌ Error details: ${errorText}`);
    throw new Error(`Failed to upload image: ${response.status} ${response.statusText}`);
  }

  console.log(`✅ Successfully uploaded ${filename} to ${fieldName}`);
}