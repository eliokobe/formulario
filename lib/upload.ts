// File upload utility using base64 conversion for Airtable
// Converts files to base64 format that Airtable can accept directly
// Compresses images to reduce payload size
// Optimized for mobile devices (especially Android)

const MOBILE_REGEX = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

const isMobileDevice = () => {
  return typeof navigator !== 'undefined' && typeof navigator.userAgent === 'string'
    ? MOBILE_REGEX.test(navigator.userAgent)
    : false;
};

export async function uploadFile(file: File): Promise<{ url: string; filename: string }> {
  // For mobile devices, reduce max size significantly
  const isMobile = isMobileDevice();
  const maxSize = isMobile ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB mobile, 10MB desktop
  
  if (file.size > maxSize) {
    throw new Error(`El archivo es demasiado grande. Máximo ${isMobile ? '5' : '10'}MB`);
  }

  if (file.type === 'application/pdf') {
    const base64 = await fileToBase64(file);
    return {
      url: base64,
      filename: file.name,
    };
  }

  return compressImage(file);
}

export async function uploadFiles(files: File[]): Promise<Array<{ url: string; filename: string }>> {
  // Process files sequentially on mobile to avoid memory issues
  const isMobile = isMobileDevice();
  
  if (isMobile) {
    const results = [];
    for (const file of files) {
      try {
        const result = await uploadFile(file);
        results.push(result);
        // Small delay between files on mobile
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        throw error;
      }
    }
    return results;
  } else {
    // Desktop can handle parallel processing
    const uploadPromises = files.map(file => uploadFile(file));
    return Promise.all(uploadPromises);
  }
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
      
      // Add timeout for mobile devices (30 seconds)
      const timeout = setTimeout(() => {
        reader.abort();
        reject(new Error(`Tiempo de espera agotado al leer ${file.name}. Intenta con un archivo más pequeño.`));
      }, 30000);
      
      reader.onload = () => {
        clearTimeout(timeout);
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error(`Error al convertir ${file.name} a base64`));
        }
      };
      
      reader.onerror = (error) => {
        clearTimeout(timeout);
        console.error('FileReader error:', error);
        reject(new Error(`Error al leer ${file.name}. Por favor, intenta con otro archivo.`));
      };
      
      reader.onabort = () => {
        clearTimeout(timeout);
        reject(new Error(`Lectura de ${file.name} cancelada`));
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      reject(new Error(`Error al procesar ${file.name}`));
    }
  });
}

async function compressImage(file: File): Promise<{ url: string; filename: string }> {
  return new Promise((resolve, reject) => {
    try {
      // Check if file is valid
      if (!file || !(file instanceof File)) {
        reject(new Error('Archivo de imagen no válido'));
        return;
      }

      // Validate image type
      if (!file.type.startsWith('image/')) {
        reject(new Error(`${file.name} no es una imagen válida`));
        return;
      }

      // Detect mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { 
        alpha: false, // Better performance on mobile
        willReadFrequently: false 
      });
      
      if (!ctx) {
        reject(new Error('No se pudo crear el contexto de canvas'));
        return;
      }

      const img = new Image();
      
      // Add timeout for mobile (30 seconds)
      const timeout = setTimeout(() => {
        reject(new Error(`Tiempo de espera agotado procesando ${file.name}. Intenta con una imagen más pequeña.`));
      }, 30000);

      img.onload = () => {
        try {
          clearTimeout(timeout);
          
          // Reduce max size for mobile devices
          const maxSize = isMobile ? 600 : 800;
          let { width, height } = img;

          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height >= width && height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }

          canvas.width = width;
          canvas.height = height;
          
          // Use white background for better compression
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Lower quality on mobile for smaller file size
          const quality = isMobile ? 0.6 : 0.7;
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          
          // Clean up
          canvas.width = 0;
          canvas.height = 0;

          resolve({
            url: compressedBase64,
            filename: file.name.replace(/\.[^/.]+$/, '.jpg'),
          });
        } catch (error) {
          clearTimeout(timeout);
          console.error('Compression error:', error);
          reject(new Error(`Error al comprimir la imagen ${file.name}`));
        }
      };

      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error(`Error al cargar la imagen ${file.name}. Verifica que sea un archivo válido.`));
      };

      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          clearTimeout(timeout);
          reject(new Error(`Error al leer ${file.name}`));
        }
      };
      
      reader.onerror = () => {
        clearTimeout(timeout);
        reject(new Error(`Error al leer ${file.name}. Por favor, intenta con otro archivo.`));
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('compressImage error:', error);
      reject(new Error(`Error al procesar la imagen ${file.name}`));
    }
  });
}