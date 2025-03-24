
import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { toast } from "sonner";
import { useAuth } from '@/context/AuthContext';
import { 
  FileText, 
  FilePlus, 
  FileCheck, 
  Clock, 
  Download, 
  Trash2, 
  CheckCircle,
  XCircle,
  MessageSquare
} from 'lucide-react';

type DocumentStatus = 'pending' | 'approved' | 'rejected';

type Document = {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  council: string;
  uploadedAt: Date;
  status: DocumentStatus;
  comments?: string;
};

const fileIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="text-red-500" />,
  docx: <FileText className="text-blue-500" />,
  jpg: <FileText className="text-green-500" />,
  png: <FileText className="text-green-500" />
};

const Documents = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      name: 'Resolution_Draft_1.pdf',
      type: 'pdf',
      size: '1.2 MB',
      uploadedBy: 'John Smith',
      council: 'Security Council',
      uploadedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      status: 'approved'
    },
    {
      id: '2',
      name: 'Working_Paper_Climate.docx',
      type: 'docx',
      size: '856 KB',
      uploadedBy: 'Emma Johnson',
      council: 'Environmental Committee',
      uploadedAt: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
      status: 'pending'
    },
    {
      id: '3',
      name: 'Presentation_Slides.pdf',
      type: 'pdf',
      size: '3.4 MB',
      uploadedBy: 'Michael Brown',
      council: 'Economic and Social Council',
      uploadedAt: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
      status: 'rejected',
      comments: 'Please reformat according to guidelines and resubmit.'
    }
  ]);
  
  const [dragActive, setDragActive] = useState(false);
  const [comment, setComment] = useState('');
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  
  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };
  
  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };
  
  // Process files
  const handleFiles = (files: FileList) => {
    // Simulate file upload
    toast.loading('Uploading files...');
    
    setTimeout(() => {
      const newDocuments: Document[] = Array.from(files).map((file, index) => {
        const fileExt = file.name.split('.').pop() || '';
        
        return {
          id: Date.now().toString() + index,
          name: file.name,
          type: fileExt,
          size: formatFileSize(file.size),
          uploadedBy: user?.name || 'Unknown User',
          council: user?.council || 'Unknown Council',
          uploadedAt: new Date(),
          status: 'pending'
        };
      });
      
      setDocuments(prev => [...newDocuments, ...prev]);
      toast.dismiss();
      toast.success(`Successfully uploaded ${files.length} file(s)`);
    }, 1500);
  };
  
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  // Handle document approval (admin only)
  const handleApprove = (id: string) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === id ? { ...doc, status: 'approved', comments: comment || undefined } : doc
      )
    );
    setComment('');
    setActiveDocumentId(null);
    toast.success('Document approved');
  };
  
  // Handle document rejection (admin only)
  const handleReject = (id: string) => {
    if (!comment) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === id ? { ...doc, status: 'rejected', comments: comment } : doc
      )
    );
    setComment('');
    setActiveDocumentId(null);
    toast.success('Document rejected with comments');
  };
  
  // Handle document deletion
  const handleDelete = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    toast.success('Document deleted');
  };
  
  // Filter documents based on user role
  const filteredDocuments = user?.role === 'chair'
    ? documents.filter(doc => doc.uploadedBy === user.name || doc.council === user.council)
    : documents;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 animate-fade-in">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-primary">Documents</h1>
            <p className="text-gray-600 mt-1">
              Upload and manage conference documents
            </p>
          </header>
          
          {/* Upload Area */}
          <div 
            className={`mb-8 p-6 bg-white rounded-lg border-2 border-dashed ${
              dragActive ? 'border-accent bg-accent/5' : 'border-gray-300'
            } transition-colors text-center`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <FilePlus className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-600">
              Drag and drop your files here, or 
              <label className="mx-1 text-accent hover:text-accent/80 cursor-pointer">
                browse
                <input 
                  type="file" 
                  className="hidden" 
                  multiple 
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.jpg,.png"
                />
              </label>
              to upload
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: PDF, DOCX, JPG, PNG (Max 10MB)
            </p>
          </div>
          
          {/* Documents Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-medium text-primary">Document Library</h2>
              <div className="text-sm text-gray-600">
                {filteredDocuments.length} document(s)
              </div>
            </div>
            
            {filteredDocuments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Document
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Council
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Uploaded By
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDocuments.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center">
                              {fileIcons[doc.type] || <FileText className="text-gray-500" />}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-primary">{doc.name}</div>
                              <div className="text-xs text-gray-500">{doc.size}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {doc.council}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {doc.uploadedBy}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {doc.uploadedAt.toLocaleDateString()} 
                            {' '}
                            {doc.uploadedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                            doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                          </span>
                          {doc.comments && (
                            <div className="mt-1 text-xs text-gray-500 max-w-xs truncate">
                              {doc.comments}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              className="text-accent hover:text-accent/80 transition-colors"
                              onClick={() => toast.success('Document downloaded')}
                            >
                              <Download className="h-5 w-5" />
                            </button>
                            
                            {user?.role === 'admin' && doc.status === 'pending' && (
                              <>
                                {activeDocumentId === doc.id ? (
                                  <>
                                    <button
                                      className="text-green-600 hover:text-green-700 transition-colors"
                                      onClick={() => handleApprove(doc.id)}
                                    >
                                      <CheckCircle className="h-5 w-5" />
                                    </button>
                                    <button
                                      className="text-red-600 hover:text-red-700 transition-colors"
                                      onClick={() => handleReject(doc.id)}
                                    >
                                      <XCircle className="h-5 w-5" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    className="text-blue-600 hover:text-blue-700 transition-colors"
                                    onClick={() => setActiveDocumentId(doc.id)}
                                  >
                                    <FileCheck className="h-5 w-5" />
                                  </button>
                                )}
                              </>
                            )}
                            
                            <button
                              className="text-red-500 hover:text-red-600 transition-colors"
                              onClick={() => handleDelete(doc.id)}
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                          
                          {/* Review form */}
                          {activeDocumentId === doc.id && (
                            <div className="mt-2">
                              <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Add comment (required for rejection)"
                                className="w-full text-xs p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-accent focus:border-accent"
                                rows={2}
                              />
                              <div className="mt-1 flex justify-end space-x-2">
                                <button
                                  className="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 button-transition"
                                  onClick={() => {
                                    setActiveDocumentId(null);
                                    setComment('');
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center p-8">
                <p className="text-gray-500">No documents found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documents;
