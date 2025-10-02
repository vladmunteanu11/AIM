/**
 * Componentă pentru upload fișiere cu drag & drop
 */

import React, { useState, useCallback, useRef } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  LinearProgress, 
  Alert, 
  Chip,
  Paper,
  Stack,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';
import { filesService, FileUploadResponse } from '../../services/filesService';

interface FileUploadProps {
  onUploadComplete?: (files: FileUploadResponse[]) => void;
  onError?: (error: string) => void;
  maxFiles?: number;
  maxSize?: number; // în MB
  acceptedTypes?: string[];
  subfolder?: string;
  generateThumbnails?: boolean;
  multiple?: boolean;
  disabled?: boolean;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  result?: FileUploadResponse;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  onError,
  maxFiles = 10,
  maxSize = 50,
  acceptedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'text/plain'
  ],
  subfolder = 'documents',
  generateThumbnails = false,
  multiple = true,
  disabled = false
}) => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validează un fișier
  const validateFile = useCallback((file: File): string | null => {
    // Verifică tipul
    if (!acceptedTypes.includes(file.type)) {
      return `Tipul de fișier '${file.type}' nu este acceptat`;
    }

    // Verifică dimensiunea
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSize) {
      return `Fișierul este prea mare (${sizeMB.toFixed(1)}MB). Maxim permis: ${maxSize}MB`;
    }

    return null;
  }, [acceptedTypes, maxSize]);

  // Formatează dimensiunea fișierului
  const formatFileSize = useCallback((bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }, []);

  // Adaugă fișiere pentru upload
  const addFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Verifică limita de fișiere
    if (uploadingFiles.length + fileArray.length > maxFiles) {
      onError?.(`Prea multe fișiere. Maxim permis: ${maxFiles}`);
      return;
    }

    const newUploadingFiles: UploadingFile[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      newUploadingFiles.push({
        file,
        progress: 0,
        status: error ? 'error' : 'pending',
        error: error || undefined
      });
    });

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    // Începe upload-ul pentru fișierele valide
    newUploadingFiles.forEach((uploadingFile, index) => {
      if (uploadingFile.status === 'pending') {
        uploadFile(uploadingFiles.length + index, uploadingFile);
      }
    });
  }, [uploadingFiles, maxFiles, validateFile, onError]);

  // Upload un fișier
  const uploadFile = async (index: number, uploadingFile: UploadingFile) => {
    setUploadingFiles(prev => 
      prev.map((f, i) => 
        i === index ? { ...f, status: 'uploading', progress: 0 } : f
      )
    );

    try {
      // Simulăm progresul (în realitate, axios nu oferă progress pentru upload)
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev => 
          prev.map((f, i) => 
            i === index ? { ...f, progress: Math.min(f.progress + 10, 90) } : f
          )
        );
      }, 200);

      const result = await filesService.uploadFile(uploadingFile.file, {
        subfolder,
        generate_thumbnail: generateThumbnails
      });

      clearInterval(progressInterval);

      setUploadingFiles(prev => 
        prev.map((f, i) => 
          i === index ? { 
            ...f, 
            status: 'completed', 
            progress: 100, 
            result 
          } : f
        )
      );

      // Notifică completarea
      const completedFiles = uploadingFiles
        .filter(f => f.status === 'completed')
        .map(f => f.result!)
        .filter(Boolean);
      
      if (result) {
        completedFiles.push(result);
        onUploadComplete?.(completedFiles);
      }

    } catch (error) {
      setUploadingFiles(prev => 
        prev.map((f, i) => 
          i === index ? { 
            ...f, 
            status: 'error', 
            progress: 0,
            error: error instanceof Error ? error.message : 'Eroare necunoscută'
          } : f
        )
      );
      onError?.(`Eroare la upload pentru ${uploadingFile.file.name}: ${error}`);
    }
  };

  // Șterge un fișier din listă
  const removeFile = useCallback((index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Handlers pentru drag & drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      addFiles(files);
    }
  }, [disabled, addFiles]);

  // Handler pentru input file
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      addFiles(files);
    }
    // Reset input pentru a permite selectarea aceluiași fișier
    e.target.value = '';
  }, [addFiles]);

  // Deschide dialog de selectare fișiere
  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Calculează statistici
  const stats = {
    total: uploadingFiles.length,
    completed: uploadingFiles.filter(f => f.status === 'completed').length,
    uploading: uploadingFiles.filter(f => f.status === 'uploading').length,
    error: uploadingFiles.filter(f => f.status === 'error').length
  };

  return (
    <Box>
      {/* Zona de drag & drop */}
      <Paper
        elevation={isDragOver ? 4 : 1}
        sx={{
          p: 3,
          border: isDragOver ? '2px dashed #1976d2' : '2px dashed #ccc',
          borderRadius: 2,
          backgroundColor: isDragOver ? 'action.hover' : 'background.paper',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.2s ease'
        }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={disabled ? undefined : openFileDialog}
      >
        <Stack spacing={2} alignItems="center">
          <CloudUploadIcon 
            sx={{ 
              fontSize: 48, 
              color: isDragOver ? 'primary.main' : 'text.secondary' 
            }} 
          />
          
          <Typography variant="h6" align="center">
            {isDragOver 
              ? 'Eliberează fișierele aici' 
              : 'Drag & drop fișiere sau click pentru a selecta'
            }
          </Typography>
          
          <Typography variant="body2" color="text.secondary" align="center">
            Maxim {maxFiles} fișiere, {maxSize}MB per fișier
          </Typography>
          
          <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
            {acceptedTypes.slice(0, 4).map(type => (
              <Chip 
                key={type} 
                label={type.split('/')[1]?.toUpperCase()} 
                size="small" 
                variant="outlined" 
              />
            ))}
            {acceptedTypes.length > 4 && (
              <Chip 
                label={`+${acceptedTypes.length - 4} mai multe`} 
                size="small" 
                variant="outlined" 
              />
            )}
          </Stack>
          
          <Button
            variant="contained"
            startIcon={<AttachFileIcon />}
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              openFileDialog();
            }}
          >
            Selectează Fișiere
          </Button>
        </Stack>
      </Paper>

      {/* Input file ascuns */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={acceptedTypes.join(',')}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        disabled={disabled}
      />

      {/* Statistici */}
      {stats.total > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Total: {stats.total} | 
            Completate: {stats.completed} | 
            În progres: {stats.uploading} | 
            Erori: {stats.error}
          </Typography>
        </Box>
      )}

      {/* Lista fișierelor */}
      {uploadingFiles.length > 0 && (
        <List sx={{ mt: 2 }}>
          {uploadingFiles.map((uploadingFile, index) => (
            <ListItem key={`${uploadingFile.file.name}-${index}`} divider>
              <ListItemIcon>
                {uploadingFile.status === 'completed' && <CheckCircleIcon color="success" />}
                {uploadingFile.status === 'error' && <ErrorIcon color="error" />}
                {uploadingFile.status === 'uploading' && <CloudUploadIcon color="primary" />}
                {uploadingFile.status === 'pending' && <FileIcon />}
              </ListItemIcon>
              
              <ListItemText
                primary={uploadingFile.file.name}
                secondary={
                  <Box>
                    <Typography variant="caption" display="block">
                      {formatFileSize(uploadingFile.file.size)}
                    </Typography>
                    {uploadingFile.status === 'uploading' && (
                      <LinearProgress 
                        variant="determinate" 
                        value={uploadingFile.progress}
                        sx={{ mt: 1 }}
                      />
                    )}
                    {uploadingFile.error && (
                      <Alert severity="error" sx={{ mt: 1 }}>
                        {uploadingFile.error}
                      </Alert>
                    )}
                    {uploadingFile.result && (
                      <Typography variant="caption" color="success.main">
                        Upload completat cu succes
                      </Typography>
                    )}
                  </Box>
                }
              />
              
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => removeFile(index)}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default FileUpload;