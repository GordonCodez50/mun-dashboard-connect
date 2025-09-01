import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, Share, Trash2, FileText, Shield } from 'lucide-react';
import { FileActivity } from '@/services/fileService';

interface ActivityLogProps {
  activities: FileActivity[];
}

const ActivityLog: React.FC<ActivityLogProps> = ({ activities }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload': return <Upload className="h-4 w-4 text-green-600" />;
      case 'download': return <Download className="h-4 w-4 text-blue-600" />;
      case 'share': return <Share className="h-4 w-4 text-purple-600" />;
      case 'delete': return <Trash2 className="h-4 w-4 text-red-600" />;
      default: return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'upload': return 'bg-green-50 border-green-200';
      case 'download': return 'bg-blue-50 border-blue-200';
      case 'share': return 'bg-purple-50 border-purple-200';
      case 'delete': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatActivityDetails = (details: any) => {
    if (!details) return '';
    
    try {
      if (typeof details === 'string') {
        details = JSON.parse(details);
      }
      
      if (details.file_name) {
        return `File: ${details.file_name}`;
      }
      
      return JSON.stringify(details, null, 2);
    } catch {
      return String(details);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          File Activity Log ({activities.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No activity recorded</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activities.map((activity) => (
              <div 
                key={activity.id} 
                className={`flex items-start gap-3 p-3 border rounded-lg ${getActivityColor(activity.activity_type)}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.activity_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {activity.activity_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(activity.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground font-medium truncate">
                    User: {activity.user_id}
                  </p>
                  {activity.details && (
                    <p className="text-xs text-muted-foreground mt-1 break-words">
                      {formatActivityDetails(activity.details)}
                    </p>
                  )}
                  {activity.ip_address && (
                    <p className="text-xs text-muted-foreground">
                      IP: {String(activity.ip_address)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityLog;