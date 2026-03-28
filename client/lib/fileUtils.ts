/**
 * Utility functions for file handling and formatting
 */

/**
 * Format file size in bytes to human-readable string
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB", "75 KB")
 */
export const formatFileSize = (bytes: number | null | undefined): string => {
  if (!bytes || bytes === 0) return "—";
  
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

/**
 * Fetch file size from a remote URL using HEAD request
 * Falls back to GET request if HEAD is not supported
 * @param url - The file URL to fetch size from
 * @returns File size in bytes, or null if unable to determine
 */
export const fetchRemoteFileSize = async (url: string): Promise<number | null> => {
  try {
    // Try HEAD request first (more efficient)
    const headResponse = await fetch(url, { method: "HEAD" });
    
    if (headResponse.ok) {
      const contentLength = headResponse.headers.get("content-length");
      if (contentLength) {
        return parseInt(contentLength, 10);
      }
    }
    
    // Fallback to GET request if HEAD didn't work
    const getResponse = await fetch(url, { method: "GET" });
    if (getResponse.ok) {
      const contentLength = getResponse.headers.get("content-length");
      if (contentLength) {
        return parseInt(contentLength, 10);
      }
      
      // Last resort: try to get blob size
      const blob = await getResponse.blob();
      return blob.size;
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to fetch file size for ${url}:`, error);
    return null;
  }
};

/**
 * Validate file against constraints
 * @param file - File object to validate
 * @param options - Validation options
 * @returns Object with valid flag and optional error message
 */
export interface FileValidationOptions {
  maxSizeBytes?: number;
  minSizeBytes?: number;
  allowedMimeTypes?: string[];
  forbiddenNamePatterns?: RegExp[];
  existingFiles?: Array<{ name: string; size: number }>;
}

export const validateFile = (
  file: File,
  options: FileValidationOptions = {}
): { valid: boolean; message?: string } => {
  const {
    maxSizeBytes = 10 * 1024 * 1024, // 10MB default
    minSizeBytes = 20 * 1024, // 20KB default
    allowedMimeTypes = [],
    forbiddenNamePatterns = [],
    existingFiles = [],
  } = options;

  // Check file type
  if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      message: `File type not allowed. Accepted types: ${allowedMimeTypes.join(", ")}`,
    };
  }

  // Check file size (max)
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      message: `File is too large. Maximum size: ${formatFileSize(maxSizeBytes)}`,
    };
  }

  // Check file size (min)
  if (file.size < minSizeBytes) {
    return {
      valid: false,
      message: `File is too small. Minimum size: ${formatFileSize(minSizeBytes)}`,
    };
  }

  // Check filename patterns
  for (const pattern of forbiddenNamePatterns) {
    if (pattern.test(file.name)) {
      return {
        valid: false,
        message: `File name "${file.name}" is not specific enough. Please use a descriptive name.`,
      };
    }
  }

  // Check for duplicates
  const isDuplicate = existingFiles.some(
    (f) => f.name === file.name && f.size === file.size
  );
  if (isDuplicate) {
    return {
      valid: false,
      message: `File "${file.name}" has already been uploaded.`,
    };
  }

  return { valid: true };
};

/**
 * Convert file to metadata object without uploading binary
 * @param file - File object
 * @param url - Optional URL where file is stored
 * @returns Metadata object
 */
export interface FileMetadata {
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  url?: string;
}

export const createFileMetadata = (file: File, url?: string): FileMetadata => {
  return {
    name: file.name,
    type: file.type,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    url,
  };
};
