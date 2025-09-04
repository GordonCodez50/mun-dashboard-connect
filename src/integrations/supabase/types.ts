export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      file_activities: {
        Row: {
          activity_type: string
          created_at: string
          details: Json | null
          file_id: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          details?: Json | null
          file_id: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          details?: Json | null
          file_id?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_activities_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      file_shares: {
        Row: {
          access_count: number
          created_at: string
          expires_at: string | null
          file_id: string
          id: string
          last_accessed: string | null
          permission_level: string
          shared_at: string
          shared_by: string
          shared_with: string
        }
        Insert: {
          access_count?: number
          created_at?: string
          expires_at?: string | null
          file_id: string
          id?: string
          last_accessed?: string | null
          permission_level: string
          shared_at?: string
          shared_by: string
          shared_with: string
        }
        Update: {
          access_count?: number
          created_at?: string
          expires_at?: string | null
          file_id?: string
          id?: string
          last_accessed?: string | null
          permission_level?: string
          shared_at?: string
          shared_by?: string
          shared_with?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_shares_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          access_count: number
          created_at: string
          description: string | null
          download_url: string | null
          expires_at: string | null
          folder_path: string | null
          google_drive_id: string
          id: string
          is_public: boolean
          last_accessed: string | null
          mime_type: string
          name: string
          preview_url: string | null
          size_bytes: number
          tags: string[] | null
          updated_at: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          access_count?: number
          created_at?: string
          description?: string | null
          download_url?: string | null
          expires_at?: string | null
          folder_path?: string | null
          google_drive_id: string
          id?: string
          is_public?: boolean
          last_accessed?: string | null
          mime_type: string
          name: string
          preview_url?: string | null
          size_bytes?: number
          tags?: string[] | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          access_count?: number
          created_at?: string
          description?: string | null
          download_url?: string | null
          expires_at?: string | null
          folder_path?: string | null
          google_drive_id?: string
          id?: string
          is_public?: boolean
          last_accessed?: string | null
          mime_type?: string
          name?: string
          preview_url?: string | null
          size_bytes?: number
          tags?: string[] | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          action: string
          browser: string | null
          created_at: string
          device_id: string
          device_info: Json | null
          error_message: string | null
          error_stack: string | null
          id: string
          ip_address: unknown | null
          log_type: string
          notification_data: Json | null
          os_version: string | null
          platform: string
          status: string
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          browser?: string | null
          created_at?: string
          device_id: string
          device_info?: Json | null
          error_message?: string | null
          error_stack?: string | null
          id?: string
          ip_address?: unknown | null
          log_type: string
          notification_data?: Json | null
          os_version?: string | null
          platform: string
          status: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          browser?: string | null
          created_at?: string
          device_id?: string
          device_info?: Json | null
          error_message?: string | null
          error_stack?: string | null
          id?: string
          ip_address?: unknown | null
          log_type?: string
          notification_data?: Json | null
          os_version?: string | null
          platform?: string
          status?: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      participants: {
        Row: {
          attendance: Json | null
          council: string
          created_at: string | null
          day1_marked_at: string | null
          day1_marked_by: string | null
          day1_marked_by_user: string | null
          day2_marked_at: string | null
          day2_marked_by: string | null
          day2_marked_by_user: string | null
          delegations: string | null
          id: string
          is_tour_data: boolean | null
          name: string
          role: string
          updated_at: string | null
        }
        Insert: {
          attendance?: Json | null
          council: string
          created_at?: string | null
          day1_marked_at?: string | null
          day1_marked_by?: string | null
          day1_marked_by_user?: string | null
          day2_marked_at?: string | null
          day2_marked_by?: string | null
          day2_marked_by_user?: string | null
          delegations?: string | null
          id?: string
          is_tour_data?: boolean | null
          name: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          attendance?: Json | null
          council?: string
          created_at?: string | null
          day1_marked_at?: string | null
          day1_marked_by?: string | null
          day1_marked_by_user?: string | null
          day2_marked_at?: string | null
          day2_marked_by?: string | null
          day2_marked_by_user?: string | null
          delegations?: string | null
          id?: string
          is_tour_data?: boolean | null
          name?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          council: string | null
          created_at: string
          email: string | null
          floor_no: string | null
          has_completed_tour: boolean
          id: string
          last_login: string | null
          name: string | null
          role: string
          room_no: string | null
          tutorial_completed_at: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          council?: string | null
          created_at?: string
          email?: string | null
          floor_no?: string | null
          has_completed_tour?: boolean
          id: string
          last_login?: string | null
          name?: string | null
          role?: string
          room_no?: string | null
          tutorial_completed_at?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          council?: string | null
          created_at?: string
          email?: string | null
          floor_no?: string | null
          has_completed_tour?: boolean
          id?: string
          last_login?: string | null
          name?: string | null
          role?: string
          room_no?: string | null
          tutorial_completed_at?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_owned_file_ids: {
        Args: Record<PropertyKey, never>
        Returns: {
          file_id: string
        }[]
      }
      get_user_role_and_council: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_council: string
          user_role: string
        }[]
      }
      get_user_shared_file_ids: {
        Args: Record<PropertyKey, never>
        Returns: {
          file_id: string
        }[]
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      user_can_access_file: {
        Args: { file_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
