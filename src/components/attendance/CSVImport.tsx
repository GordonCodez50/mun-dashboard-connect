
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ParticipantWithAttendance } from '@/types/attendance';
import { toast } from 'sonner';
import { Upload, AlertCircle, Check, FileCheck, Download } from 'lucide-react';

interface CSVImportProps {
  onImport: (participants: Omit<ParticipantWithAttendance, 'id'>[]) => void;
  councilRestriction?: string; // For chair users
}

export const CSVImport: React.FC<CSVImportProps> = ({ onImport, councilRestriction }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{rows: number, valid: boolean}>({ rows: 0, valid: false });
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndPreviewFile(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'text/csv') {
      validateAndPreviewFile(droppedFile);
    } else {
      setParseError('Please upload a CSV file');
    }
  };

  const validateAndPreviewFile = (file: File) => {
    setFile(file);
    setParseError(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        // Check required headers
        const requiredHeaders = ['name', 'role', 'council'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          setParseError(`Missing required headers: ${missingHeaders.join(', ')}`);
          setPreview({ rows: 0, valid: false });
          return;
        }
        
        // If chair is restricted to a council, make sure all entries match
        if (councilRestriction) {
          const councilIndex = headers.indexOf('council');
          if (councilIndex === -1) {
            setParseError(`CSV must include a 'council' column`);
            setPreview({ rows: 0, valid: false });
            return;
          }
        }
        
        // Count valid rows (non-empty)
        const validRows = lines.filter(line => line.trim().length > 0).length - 1; // -1 for header
        
        setPreview({
          rows: validRows,
          valid: validRows > 0
        });
      } catch (err) {
        console.error('Error parsing CSV:', err);
        setParseError('Invalid CSV format');
        setPreview({ rows: 0, valid: false });
      }
    };
    
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }
    
    setIsProcessing(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim().length > 0);
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const nameIndex = headers.indexOf('name');
        const roleIndex = headers.indexOf('role');
        const councilIndex = headers.indexOf('council');
        
        // Parse rows into participants
        const participants: Omit<ParticipantWithAttendance, 'id'>[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          
          if (values.length < Math.max(nameIndex, roleIndex, councilIndex) + 1) {
            continue; // Skip invalid rows
          }
          
          // For chair users, enforce council restriction
          let council = councilIndex >= 0 ? values[councilIndex] : '';
          if (councilRestriction) {
            council = councilRestriction;
          }
          
          // Validate role
          let role = roleIndex >= 0 ? values[roleIndex].toLowerCase() : 'delegate';
          if (!['delegate', 'chair', 'observer', 'staff', 'guest'].includes(role)) {
            role = 'delegate'; // Default to delegate for invalid roles
          }
          
          participants.push({
            name: values[nameIndex],
            role: role as any,
            council: council,
            attendance: {
              day1: 'not-marked',
              day2: 'not-marked'
            }
          });
        }
        
        if (participants.length === 0) {
          toast.error('No valid participants found in CSV');
          setIsProcessing(false);
          return;
        }
        
        // Call the import callback
        onImport(participants);
        
        // Reset state
        setFile(null);
        setPreview({ rows: 0, valid: false });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        toast.success(`Successfully imported ${participants.length} participants`);
      } catch (err) {
        console.error('Error processing CSV:', err);
        toast.error('Failed to process CSV file');
      } finally {
        setIsProcessing(false);
      }
    };
    
    reader.readAsText(file);
  };

  // New function to download CSV template
  const downloadTemplate = () => {
    // Create CSV content with headers
    const headers = ['name', 'council', 'role'];
    const csvContent = headers.join(',') + '\n';
    
    // Create sample row if needed
    // const sampleRow = ['John Doe', councilRestriction || 'UNSC', 'delegate'];
    // csvContent += sampleRow.join(',') + '\n';
    
    // Create a blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'participants_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Template downloaded successfully');
  };

  return (
    <Card className="w-full animate-fade-in">
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Upload size={18} className="text-primary" />
          Import Participants
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-muted-foreground">
            Upload a CSV file with participant details
          </p>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={downloadTemplate}
          >
            <Download size={14} />
            Download Template
          </Button>
        </div>
        
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/20'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
          />
          
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <div className="p-2 rounded-full bg-primary/10">
                <FileCheck size={24} className="text-primary" />
              </div>
              <div className="text-sm font-medium">{file.name}</div>
              <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</div>
              
              {preview.valid ? (
                <div className="mt-2 inline-flex items-center gap-1 text-sm text-green-600 bg-green-50 py-1 px-2 rounded">
                  <Check size={14} />
                  {preview.rows} participants ready to import
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <div className="mb-4 flex justify-center">
                <div className="p-3 rounded-full bg-primary/10">
                  <Upload size={24} className="text-primary" />
                </div>
              </div>
              <p className="text-sm mb-2">Drag and drop a CSV file here, or</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Files
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                Required columns: name, council, role
              </p>
            </>
          )}
        </div>
        
        {parseError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{parseError}</AlertDescription>
          </Alert>
        )}

        {councilRestriction && (
          <Alert className="mt-4 bg-amber-50 text-amber-800 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle>Council Restriction</AlertTitle>
            <AlertDescription>
              You can only import participants for {councilRestriction}. All imported participants will be assigned to this council.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter>
        <Button
          onClick={handleImport}
          disabled={!file || !preview.valid || isProcessing}
          className="ml-auto"
        >
          {isProcessing ? 'Importing...' : 'Import Participants'}
        </Button>
      </CardFooter>
    </Card>
  );
};

