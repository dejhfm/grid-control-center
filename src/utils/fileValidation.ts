
// File validation utilities for enhanced security
const ALLOWED_MIME_TYPES = ['application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAGIC_NUMBERS = {
  PDF: [0x25, 0x50, 0x44, 0x46], // %PDF
};

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateFile = async (file: File): Promise<FileValidationResult> => {
  const errors: string[] = [];

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push('Datei ist zu groß. Maximale Größe: 10MB');
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    errors.push('Nur PDF-Dateien sind erlaubt');
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith('.pdf')) {
    errors.push('Datei muss eine .pdf-Erweiterung haben');
  }

  // Validate magic number (file signature)
  try {
    const buffer = await file.slice(0, 4).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    const isPDF = MAGIC_NUMBERS.PDF.every((byte, index) => bytes[index] === byte);
    if (!isPDF) {
      errors.push('Datei ist keine gültige PDF-Datei');
    }
  } catch (error) {
    errors.push('Fehler beim Validieren der Datei');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const sanitizeFileName = (fileName: string): string => {
  // Remove path traversal attempts
  const sanitized = fileName
    .replace(/[/\\]/g, '') // Remove slashes
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/[<>:"|?*]/g, '') // Remove forbidden characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .toLowerCase();

  // Ensure filename is not empty and has valid extension
  if (!sanitized || sanitized === '.pdf') {
    return `file_${Date.now()}.pdf`;
  }

  return sanitized;
};
