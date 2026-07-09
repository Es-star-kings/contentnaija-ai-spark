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
      brands: {
        Row: {
          brand_color: string | null
          business_name: string | null
          created_at: string
          id: string
          industry: string | null
          name: string
          target_audience: string | null
          tone: string | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          brand_color?: string | null
          business_name?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          name: string
          target_audience?: string | null
          tone?: string | null
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          brand_color?: string | null
          business_name?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          name?: string
          target_audience?: string | null
          tone?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brands_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_waitlist: {
        Row: {
          created_at: string
          email: string
          feature_name: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          feature_name: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          feature_name?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      generated_content: {
        Row: {
          brand_id: string | null
          created_at: string
          favorited: boolean
          generator_type: string
          id: string
          inputs: Json
          output: Json
          scheduled_for: string | null
          status: string
          user_id: string
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          favorited?: boolean
          generator_type: string
          id?: string
          inputs?: Json
          output?: Json
          scheduled_for?: string | null
          status?: string
          user_id: string
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          favorited?: boolean
          generator_type?: string
          id?: string
          inputs?: Json
          output?: Json
          scheduled_for?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_content_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_history: {
        Row: {
          amount_kobo: number
          billing_cycle: string | null
          channel: string | null
          created_at: string
          currency: string
          id: string
          paystack_reference: string | null
          raw: Json | null
          status: string
          tier: Database["public"]["Enums"]["plan_tier"] | null
          user_id: string
        }
        Insert: {
          amount_kobo: number
          billing_cycle?: string | null
          channel?: string | null
          created_at?: string
          currency?: string
          id?: string
          paystack_reference?: string | null
          raw?: Json | null
          status: string
          tier?: Database["public"]["Enums"]["plan_tier"] | null
          user_id: string
        }
        Update: {
          amount_kobo?: number
          billing_cycle?: string | null
          channel?: string | null
          created_at?: string
          currency?: string
          id?: string
          paystack_reference?: string | null
          raw?: Json | null
          status?: string
          tier?: Database["public"]["Enums"]["plan_tier"] | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_brand_id: string | null
          active_workspace_id: string | null
          brand_color: string | null
          business_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          industry: string | null
          language: string | null
          onboarding_complete: boolean
          preferred_platform: string | null
          target_audience: string | null
          tone: string | null
          updated_at: string
        }
        Insert: {
          active_brand_id?: string | null
          active_workspace_id?: string | null
          brand_color?: string | null
          business_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          industry?: string | null
          language?: string | null
          onboarding_complete?: boolean
          preferred_platform?: string | null
          target_audience?: string | null
          tone?: string | null
          updated_at?: string
        }
        Update: {
          active_brand_id?: string | null
          active_workspace_id?: string | null
          brand_color?: string | null
          business_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          industry?: string | null
          language?: string | null
          onboarding_complete?: boolean
          preferred_platform?: string | null
          target_audience?: string | null
          tone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_brand_id_fkey"
            columns: ["active_brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_active_workspace_id_fkey"
            columns: ["active_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      share_links: {
        Row: {
          content_id: string
          created_at: string
          expires_at: string | null
          id: string
          token: string
          user_id: string
          view_count: number
        }
        Insert: {
          content_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          token: string
          user_id: string
          view_count?: number
        }
        Update: {
          content_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          token?: string
          user_id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "share_links_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "generated_content"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          features: Json
          monthly_generation_quota: number
          monthly_price_kobo: number
          name: string
          tier: Database["public"]["Enums"]["plan_tier"]
          yearly_price_kobo: number
        }
        Insert: {
          created_at?: string
          features?: Json
          monthly_generation_quota: number
          monthly_price_kobo?: number
          name: string
          tier: Database["public"]["Enums"]["plan_tier"]
          yearly_price_kobo?: number
        }
        Update: {
          created_at?: string
          features?: Json
          monthly_generation_quota?: number
          monthly_price_kobo?: number
          name?: string
          tier?: Database["public"]["Enums"]["plan_tier"]
          yearly_price_kobo?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          granted_by_admin: boolean
          id: string
          paystack_customer_code: string | null
          paystack_email_token: string | null
          paystack_subscription_code: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          tier: Database["public"]["Enums"]["plan_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle?: string
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          granted_by_admin?: boolean
          id?: string
          paystack_customer_code?: string | null
          paystack_email_token?: string | null
          paystack_subscription_code?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          tier?: Database["public"]["Enums"]["plan_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle?: string
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          granted_by_admin?: boolean
          id?: string
          paystack_customer_code?: string | null
          paystack_email_token?: string | null
          paystack_subscription_code?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          tier?: Database["public"]["Enums"]["plan_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      usage_credits: {
        Row: {
          created_at: string
          generations_used: number
          id: string
          period_month: string
          tier: Database["public"]["Enums"]["plan_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          generations_used?: number
          id?: string
          period_month: string
          tier: Database["public"]["Enums"]["plan_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          generations_used?: number
          id?: string
          period_month?: string
          tier?: Database["public"]["Enums"]["plan_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workspace_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["workspace_role"]
          token: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["workspace_role"]
          token: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          token?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_workspace_invitation: { Args: { _token: string }; Returns: string }
      consume_generation_credit: {
        Args: { _user_id: string }
        Returns: {
          quota: number
          tier: Database["public"]["Enums"]["plan_tier"]
          used: number
        }[]
      }
      create_workspace_with_owner: {
        Args: { _name: string }
        Returns: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "workspaces"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_period_month: { Args: never; Returns: string }
      get_active_tier: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["plan_tier"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      workspace_role_of: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: Database["public"]["Enums"]["workspace_role"]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      plan_tier: "free" | "pro" | "agency"
      subscription_status:
        | "active"
        | "cancelled"
        | "past_due"
        | "trialing"
        | "expired"
      workspace_role: "owner" | "admin" | "member"
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
      app_role: ["admin", "user"],
      plan_tier: ["free", "pro", "agency"],
      subscription_status: [
        "active",
        "cancelled",
        "past_due",
        "trialing",
        "expired",
      ],
      workspace_role: ["owner", "admin", "member"],
    },
  },
} as const
