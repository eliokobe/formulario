// File upload utility using base64 conversion for Airtable
// Converts files to base64 format that Airtable can accept directly
// Sin compresión ni limitaciones de tamaño

export async function uploadFile(file: File): Promise<{ url: string; filename: string }> {
  // Sin limitación de tamaño - Airtable puede manejar archivos grandes
  const base64 = await fileToBase64(file);
  return {
    url: base64,
    filename: file.name,
  };
}

export async function uploadFiles(files: File[]): Promise<Array<{ url: string; filename: string }>> {
  // Procesar todos los archivos sin limitaciones
  const uploadPromises = files.map(file => uploadFile(file));
  return Promise.all(uploadPromises);
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Check if file is valid
      if (!file || !(file instanceof File)) {
        reject(new Error('Archivo no válido'));
        return;
      }

      const reader = new FileReader();
      
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error(`Error al convertir ${file.name} a base64`));
        }
      };
      
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        reject(new Error(`Error al leer ${file.name}. Por favor, intenta con otro archivo.`));
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      reject(new Error(`Error al procesar ${file.name}`));
    }
  });
}