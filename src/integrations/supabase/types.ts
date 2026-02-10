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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      diary_entries: {
        Row: {
          achievements: string | null
          created_at: string
          energy: number | null
          entry_date: string
          entry_type: string
          id: string
          intent: string | null
          lessons: string | null
          next_step: string | null
          text: string | null
          user_id: string
        }
        Insert: {
          achievements?: string | null
          created_at?: string
          energy?: number | null
          entry_date: string
          entry_type?: string
          id?: string
          intent?: string | null
          lessons?: string | null
          next_step?: string | null
          text?: string | null
          user_id: string
        }
        Update: {
          achievements?: string | null
          created_at?: string
          energy?: number | null
          entry_date?: string
          entry_type?: string
          id?: string
          intent?: string | null
          lessons?: string | null
          next_step?: string | null
          text?: string | null
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          amount: string | null
          created_at: string
          has_amount: boolean
          id: string
          progress: number
          title: string
          user_id: string
        }
        Insert: {
          amount?: string | null
          created_at?: string
          has_amount?: boolean
          id?: string
          progress?: number
          title: string
          user_id: string
        }
        Update: {
          amount?: string | null
          created_at?: string
          has_amount?: boolean
          id?: string
          progress?: number
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      point_b_results: {
        Row: {
          achieved: string
          analysis: string
          id: string
          not_achieved: string
          user_id: string
        }
        Insert: {
          achieved?: string
          analysis?: string
          id?: string
          not_achieved?: string
          user_id: string
        }
        Update: {
          achieved?: string
          analysis?: string
          id?: string
          not_achieved?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_blocked: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_blocked?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_blocked?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      progress_metrics: {
        Row: {
          current_value: number
          id: string
          label: string
          metric_key: string
          previous_value: number
          user_id: string
        }
        Insert: {
          current_value?: number
          id?: string
          label: string
          metric_key: string
          previous_value?: number
          user_id: string
        }
        Update: {
          current_value?: number
          id?: string
          label?: string
          metric_key?: string
          previous_value?: number
          user_id?: string
        }
        Relationships: []
      }
      protocols: {
        Row: {
          color: string
          created_at: string
          description: string
          file_name: string
          file_url: string | null
          icon: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string
          file_name?: string
          file_url?: string | null
          icon?: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string
          file_name?: string
          file_url?: string | null
          icon?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      roadmap_steps: {
        Row: {
          deadline: string | null
          done: boolean
          id: string
          roadmap_id: string
          sort_order: number
          text: string
        }
        Insert: {
          deadline?: string | null
          done?: boolean
          id?: string
          roadmap_id: string
          sort_order?: number
          text: string
        }
        Update: {
          deadline?: string | null
          done?: boolean
          id?: string
          roadmap_id?: string
          sort_order?: number
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_steps_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmaps: {
        Row: {
          created_at: string
          description: string
          id: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          status?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      route_info: {
        Row: {
          id: string
          resources: string[] | null
          sessions_done: number
          sessions_total: number
          time_weeks: number
          user_id: string
        }
        Insert: {
          id?: string
          resources?: string[] | null
          sessions_done?: number
          sessions_total?: number
          time_weeks?: number
          user_id: string
        }
        Update: {
          id?: string
          resources?: string[] | null
          sessions_done?: number
          sessions_total?: number
          time_weeks?: number
          user_id?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          created_at: string
          files: string[] | null
          gradient: string
          id: string
          session_date: string
          session_number: number
          session_time: string
          steps: string[] | null
          summary: string
          user_id: string
        }
        Insert: {
          created_at?: string
          files?: string[] | null
          gradient?: string
          id?: string
          session_date: string
          session_number: number
          session_time: string
          steps?: string[] | null
          summary?: string
          user_id: string
        }
        Update: {
          created_at?: string
          files?: string[] | null
          gradient?: string
          id?: string
          session_date?: string
          session_number?: number
          session_time?: string
          steps?: string[] | null
          summary?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      volcanoes: {
        Row: {
          comment: string
          id: string
          name: string
          user_id: string
          value: number
        }
        Insert: {
          comment?: string
          id?: string
          name: string
          user_id: string
          value?: number
        }
        Update: {
          comment?: string
          id?: string
          name?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "user"
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
    Enums: {
      app_role: ["super_admin", "user"],
    },
  },
} as const
