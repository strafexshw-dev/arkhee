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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      beliefs: {
        Row: {
          content: string
          created_at: string
          id: string
          new_belief: string | null
          origin: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          new_belief?: string | null
          origin?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          new_belief?: string | null
          origin?: string | null
          user_id?: string
        }
        Relationships: []
      }
      future_identities: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          created_at: string
          done_on: string
          habit_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done_on?: string
          habit_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          done_on?: string
          habit_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          active: boolean
          created_at: string
          id: string
          title: string
          trait_id: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          title: string
          trait_id?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          title?: string
          trait_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habits_trait_id_fkey"
            columns: ["trait_id"]
            isOneToOne: false
            referencedRelation: "identity_traits"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_traits: {
        Row: {
          created_at: string
          evidence_count: number
          id: string
          identity_id: string | null
          name: string
          progress: number
          user_id: string
        }
        Insert: {
          created_at?: string
          evidence_count?: number
          id?: string
          identity_id?: string | null
          name: string
          progress?: number
          user_id: string
        }
        Update: {
          created_at?: string
          evidence_count?: number
          id?: string
          identity_id?: string | null
          name?: string
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_traits_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: false
            referencedRelation: "future_identities"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string
          id: string
          prompt: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          prompt?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          prompt?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mental_checkins: {
        Row: {
          created_at: string
          day: string
          id: string
          mood: number
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          day?: string
          id?: string
          mood: number
          note?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          mood?: number
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mission_completions: {
        Row: {
          created_at: string
          day: string
          id: string
          mission_id: string
          response: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          day?: string
          id?: string
          mission_id: string
          response?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          mission_id?: string
          response?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_completions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          id: string
          order_index: number
          phase: number
          prompt: string
          title: string
          xp: number
        }
        Insert: {
          id?: string
          order_index?: number
          phase?: number
          prompt: string
          title: string
          xp?: number
        }
        Update: {
          id?: string
          order_index?: number
          phase?: number
          prompt?: string
          title?: string
          xp?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          focus_area: string | null
          id: string
          last_active_date: string | null
          level: number
          onboarding_completed: boolean
          streak: number
          xp: number
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          focus_area?: string | null
          id: string
          last_active_date?: string | null
          level?: number
          onboarding_completed?: boolean
          streak?: number
          xp?: number
        }
        Update: {
          created_at?: string
          display_name?: string | null
          focus_area?: string | null
          id?: string
          last_active_date?: string | null
          level?: number
          onboarding_completed?: boolean
          streak?: number
          xp?: number
        }
        Relationships: []
      }
      thought_patterns: {
        Row: {
          created_at: string
          emotion: string | null
          id: string
          name: string
          new_action: string | null
          new_evidence: string | null
          new_thought: string | null
          old_response: string | null
          old_result: string | null
          thought: string | null
          trigger_text: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          emotion?: string | null
          id?: string
          name: string
          new_action?: string | null
          new_evidence?: string | null
          new_thought?: string | null
          old_response?: string | null
          old_result?: string | null
          thought?: string | null
          trigger_text?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          emotion?: string | null
          id?: string
          name?: string
          new_action?: string | null
          new_evidence?: string | null
          new_thought?: string | null
          old_response?: string | null
          old_result?: string | null
          thought?: string | null
          trigger_text?: string | null
          user_id?: string
        }
        Relationships: []
      }
      xp_events: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
