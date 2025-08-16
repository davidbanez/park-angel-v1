import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
export declare const supabase: SupabaseClient<Database, "public", {
    Tables: {
        advertisement_metrics: {
            Row: {
                advertisement_id: string;
                clicks: number;
                conversions: number;
                created_at: string | null;
                date: string;
                id: string;
                impressions: number;
                total_cost: number;
                updated_at: string | null;
            };
            Insert: {
                advertisement_id: string;
                clicks?: number;
                conversions?: number;
                created_at?: string | null;
                date: string;
                id?: string;
                impressions?: number;
                total_cost?: number;
                updated_at?: string | null;
            };
            Update: {
                advertisement_id?: string;
                clicks?: number;
                conversions?: number;
                created_at?: string | null;
                date?: string;
                id?: string;
                impressions?: number;
                total_cost?: number;
                updated_at?: string | null;
            };
            Relationships: [{
                foreignKeyName: "advertisement_metrics_advertisement_id_fkey";
                columns: ["advertisement_id"];
                isOneToOne: false;
                referencedRelation: "advertisements";
                referencedColumns: ["id"];
            }];
        };
        advertisement_payments: {
            Row: {
                advertisement_id: string;
                amount: number;
                created_at: string | null;
                id: string;
                paid_at: string | null;
                payment_method: string;
                payment_reference: string | null;
                payment_status: string;
                updated_at: string | null;
            };
            Insert: {
                advertisement_id: string;
                amount: number;
                created_at?: string | null;
                id?: string;
                paid_at?: string | null;
                payment_method: string;
                payment_reference?: string | null;
                payment_status?: string;
                updated_at?: string | null;
            };
            Update: {
                advertisement_id?: string;
                amount?: number;
                created_at?: string | null;
                id?: string;
                paid_at?: string | null;
                payment_method?: string;
                payment_reference?: string | null;
                payment_status?: string;
                updated_at?: string | null;
            };
            Relationships: [{
                foreignKeyName: "advertisement_payments_advertisement_id_fkey";
                columns: ["advertisement_id"];
                isOneToOne: false;
                referencedRelation: "advertisements";
                referencedColumns: ["id"];
            }];
        };
        advertisements: {
            Row: {
                budget: number;
                content: import("../types/database").Json;
                created_at: string;
                created_by: string;
                id: string;
                metrics: import("../types/database").Json | null;
                schedule: import("../types/database").Json;
                status: Database["public"]["Enums"]["ad_status"];
                target_location: string;
                target_type: Database["public"]["Enums"]["target_type"];
                title: string;
                updated_at: string;
            };
            Insert: {
                budget: number;
                content: import("../types/database").Json;
                created_at?: string;
                created_by: string;
                id?: string;
                metrics?: import("../types/database").Json | null;
                schedule: import("../types/database").Json;
                status?: Database["public"]["Enums"]["ad_status"];
                target_location: string;
                target_type: Database["public"]["Enums"]["target_type"];
                title: string;
                updated_at?: string;
            };
            Update: {
                budget?: number;
                content?: import("../types/database").Json;
                created_at?: string;
                created_by?: string;
                id?: string;
                metrics?: import("../types/database").Json | null;
                schedule?: import("../types/database").Json;
                status?: Database["public"]["Enums"]["ad_status"];
                target_location?: string;
                target_type?: Database["public"]["Enums"]["target_type"];
                title?: string;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "advertisements_created_by_fkey";
                columns: ["created_by"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        api_applications: {
            Row: {
                app_type: string;
                approved_at: string | null;
                approved_by: string | null;
                callback_urls: string[] | null;
                created_at: string | null;
                description: string | null;
                developer_account_id: string | null;
                id: string;
                name: string;
                status: string | null;
                updated_at: string | null;
                webhook_url: string | null;
            };
            Insert: {
                app_type: string;
                approved_at?: string | null;
                approved_by?: string | null;
                callback_urls?: string[] | null;
                created_at?: string | null;
                description?: string | null;
                developer_account_id?: string | null;
                id?: string;
                name: string;
                status?: string | null;
                updated_at?: string | null;
                webhook_url?: string | null;
            };
            Update: {
                app_type?: string;
                approved_at?: string | null;
                approved_by?: string | null;
                callback_urls?: string[] | null;
                created_at?: string | null;
                description?: string | null;
                developer_account_id?: string | null;
                id?: string;
                name?: string;
                status?: string | null;
                updated_at?: string | null;
                webhook_url?: string | null;
            };
            Relationships: [{
                foreignKeyName: "api_applications_developer_account_id_fkey";
                columns: ["developer_account_id"];
                isOneToOne: false;
                referencedRelation: "developer_accounts";
                referencedColumns: ["id"];
            }];
        };
        api_billing_records: {
            Row: {
                base_amount: number | null;
                billing_period_end: string;
                billing_period_start: string;
                calls_included: number | null;
                calls_overage: number | null;
                calls_used: number | null;
                created_at: string | null;
                id: string;
                invoice_number: string | null;
                overage_amount: number | null;
                paid_at: string | null;
                status: string | null;
                subscription_id: string | null;
                total_amount: number;
                updated_at: string | null;
                usage_amount: number | null;
            };
            Insert: {
                base_amount?: number | null;
                billing_period_end: string;
                billing_period_start: string;
                calls_included?: number | null;
                calls_overage?: number | null;
                calls_used?: number | null;
                created_at?: string | null;
                id?: string;
                invoice_number?: string | null;
                overage_amount?: number | null;
                paid_at?: string | null;
                status?: string | null;
                subscription_id?: string | null;
                total_amount: number;
                updated_at?: string | null;
                usage_amount?: number | null;
            };
            Update: {
                base_amount?: number | null;
                billing_period_end?: string;
                billing_period_start?: string;
                calls_included?: number | null;
                calls_overage?: number | null;
                calls_used?: number | null;
                created_at?: string | null;
                id?: string;
                invoice_number?: string | null;
                overage_amount?: number | null;
                paid_at?: string | null;
                status?: string | null;
                subscription_id?: string | null;
                total_amount?: number;
                updated_at?: string | null;
                usage_amount?: number | null;
            };
            Relationships: [{
                foreignKeyName: "api_billing_records_subscription_id_fkey";
                columns: ["subscription_id"];
                isOneToOne: false;
                referencedRelation: "api_subscriptions";
                referencedColumns: ["id"];
            }];
        };
        api_documentation: {
            Row: {
                content: string;
                created_at: string | null;
                id: string;
                is_published: boolean | null;
                parent_id: string | null;
                section_order: number | null;
                slug: string;
                title: string;
                updated_at: string | null;
            };
            Insert: {
                content: string;
                created_at?: string | null;
                id?: string;
                is_published?: boolean | null;
                parent_id?: string | null;
                section_order?: number | null;
                slug: string;
                title: string;
                updated_at?: string | null;
            };
            Update: {
                content?: string;
                created_at?: string | null;
                id?: string;
                is_published?: boolean | null;
                parent_id?: string | null;
                section_order?: number | null;
                slug?: string;
                title?: string;
                updated_at?: string | null;
            };
            Relationships: [{
                foreignKeyName: "api_documentation_parent_id_fkey";
                columns: ["parent_id"];
                isOneToOne: false;
                referencedRelation: "api_documentation";
                referencedColumns: ["id"];
            }];
        };
        api_keys: {
            Row: {
                created_at: string;
                id: string;
                is_active: boolean;
                key_hash: string;
                last_used_at: string | null;
                name: string;
                permissions: import("../types/database").Json;
                rate_limit: number | null;
                updated_at: string;
                user_id: string;
            };
            Insert: {
                created_at?: string;
                id?: string;
                is_active?: boolean;
                key_hash: string;
                last_used_at?: string | null;
                name: string;
                permissions?: import("../types/database").Json;
                rate_limit?: number | null;
                updated_at?: string;
                user_id: string;
            };
            Update: {
                created_at?: string;
                id?: string;
                is_active?: boolean;
                key_hash?: string;
                last_used_at?: string | null;
                name?: string;
                permissions?: import("../types/database").Json;
                rate_limit?: number | null;
                updated_at?: string;
                user_id?: string;
            };
            Relationships: [{
                foreignKeyName: "api_keys_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        api_pricing_plans: {
            Row: {
                created_at: string | null;
                description: string | null;
                features: import("../types/database").Json | null;
                id: string;
                included_calls_per_month: number | null;
                is_active: boolean | null;
                max_calls_per_day: number | null;
                max_calls_per_hour: number | null;
                max_calls_per_minute: number | null;
                monthly_fee: number | null;
                name: string;
                plan_type: string;
                price_per_call: number | null;
                revenue_share_percentage: number | null;
                updated_at: string | null;
            };
            Insert: {
                created_at?: string | null;
                description?: string | null;
                features?: import("../types/database").Json | null;
                id?: string;
                included_calls_per_month?: number | null;
                is_active?: boolean | null;
                max_calls_per_day?: number | null;
                max_calls_per_hour?: number | null;
                max_calls_per_minute?: number | null;
                monthly_fee?: number | null;
                name: string;
                plan_type: string;
                price_per_call?: number | null;
                revenue_share_percentage?: number | null;
                updated_at?: string | null;
            };
            Update: {
                created_at?: string | null;
                description?: string | null;
                features?: import("../types/database").Json | null;
                id?: string;
                included_calls_per_month?: number | null;
                is_active?: boolean | null;
                max_calls_per_day?: number | null;
                max_calls_per_hour?: number | null;
                max_calls_per_minute?: number | null;
                monthly_fee?: number | null;
                name?: string;
                plan_type?: string;
                price_per_call?: number | null;
                revenue_share_percentage?: number | null;
                updated_at?: string | null;
            };
            Relationships: [];
        };
        api_rate_limits: {
            Row: {
                api_key_id: string | null;
                created_at: string | null;
                id: string;
                request_count: number | null;
                time_window: string;
                updated_at: string | null;
                window_start: string;
            };
            Insert: {
                api_key_id?: string | null;
                created_at?: string | null;
                id?: string;
                request_count?: number | null;
                time_window: string;
                updated_at?: string | null;
                window_start: string;
            };
            Update: {
                api_key_id?: string | null;
                created_at?: string | null;
                id?: string;
                request_count?: number | null;
                time_window?: string;
                updated_at?: string | null;
                window_start?: string;
            };
            Relationships: [{
                foreignKeyName: "api_rate_limits_api_key_id_fkey";
                columns: ["api_key_id"];
                isOneToOne: false;
                referencedRelation: "api_keys";
                referencedColumns: ["id"];
            }];
        };
        api_subscriptions: {
            Row: {
                application_id: string | null;
                calls_used_this_period: number | null;
                created_at: string | null;
                current_period_end: string | null;
                current_period_start: string | null;
                id: string;
                overage_charges: number | null;
                pricing_plan_id: string | null;
                status: string | null;
                updated_at: string | null;
            };
            Insert: {
                application_id?: string | null;
                calls_used_this_period?: number | null;
                created_at?: string | null;
                current_period_end?: string | null;
                current_period_start?: string | null;
                id?: string;
                overage_charges?: number | null;
                pricing_plan_id?: string | null;
                status?: string | null;
                updated_at?: string | null;
            };
            Update: {
                application_id?: string | null;
                calls_used_this_period?: number | null;
                created_at?: string | null;
                current_period_end?: string | null;
                current_period_start?: string | null;
                id?: string;
                overage_charges?: number | null;
                pricing_plan_id?: string | null;
                status?: string | null;
                updated_at?: string | null;
            };
            Relationships: [{
                foreignKeyName: "api_subscriptions_application_id_fkey";
                columns: ["application_id"];
                isOneToOne: false;
                referencedRelation: "api_applications";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "api_subscriptions_pricing_plan_id_fkey";
                columns: ["pricing_plan_id"];
                isOneToOne: false;
                referencedRelation: "api_pricing_plans";
                referencedColumns: ["id"];
            }];
        };
        api_usage: {
            Row: {
                api_key_id: string;
                created_at: string;
                endpoint: string;
                id: string;
                ip_address: unknown | null;
                method: string;
                request_size: number | null;
                response_size: number | null;
                response_time: number | null;
                status_code: number;
                user_agent: string | null;
            };
            Insert: {
                api_key_id: string;
                created_at?: string;
                endpoint: string;
                id?: string;
                ip_address?: unknown | null;
                method: string;
                request_size?: number | null;
                response_size?: number | null;
                response_time?: number | null;
                status_code: number;
                user_agent?: string | null;
            };
            Update: {
                api_key_id?: string;
                created_at?: string;
                endpoint?: string;
                id?: string;
                ip_address?: unknown | null;
                method?: string;
                request_size?: number | null;
                response_size?: number | null;
                response_time?: number | null;
                status_code?: number;
                user_agent?: string | null;
            };
            Relationships: [{
                foreignKeyName: "api_usage_api_key_id_fkey";
                columns: ["api_key_id"];
                isOneToOne: false;
                referencedRelation: "api_keys";
                referencedColumns: ["id"];
            }];
        };
        api_usage_logs: {
            Row: {
                api_key_id: string | null;
                created_at: string | null;
                endpoint: string;
                error_message: string | null;
                id: string;
                ip_address: unknown | null;
                method: string;
                request_size_bytes: number | null;
                response_size_bytes: number | null;
                response_time_ms: number | null;
                status_code: number;
                user_agent: string | null;
            };
            Insert: {
                api_key_id?: string | null;
                created_at?: string | null;
                endpoint: string;
                error_message?: string | null;
                id?: string;
                ip_address?: unknown | null;
                method: string;
                request_size_bytes?: number | null;
                response_size_bytes?: number | null;
                response_time_ms?: number | null;
                status_code: number;
                user_agent?: string | null;
            };
            Update: {
                api_key_id?: string | null;
                created_at?: string | null;
                endpoint?: string;
                error_message?: string | null;
                id?: string;
                ip_address?: unknown | null;
                method?: string;
                request_size_bytes?: number | null;
                response_size_bytes?: number | null;
                response_time_ms?: number | null;
                status_code?: number;
                user_agent?: string | null;
            };
            Relationships: [{
                foreignKeyName: "api_usage_logs_api_key_id_fkey";
                columns: ["api_key_id"];
                isOneToOne: false;
                referencedRelation: "api_keys";
                referencedColumns: ["id"];
            }];
        };
        audit_logs: {
            Row: {
                action: string;
                created_at: string;
                id: string;
                ip_address: unknown | null;
                new_values: import("../types/database").Json | null;
                old_values: import("../types/database").Json | null;
                resource_id: string | null;
                resource_type: string;
                user_agent: string | null;
                user_id: string | null;
            };
            Insert: {
                action: string;
                created_at?: string;
                id?: string;
                ip_address?: unknown | null;
                new_values?: import("../types/database").Json | null;
                old_values?: import("../types/database").Json | null;
                resource_id?: string | null;
                resource_type: string;
                user_agent?: string | null;
                user_id?: string | null;
            };
            Update: {
                action?: string;
                created_at?: string;
                id?: string;
                ip_address?: unknown | null;
                new_values?: import("../types/database").Json | null;
                old_values?: import("../types/database").Json | null;
                resource_id?: string | null;
                resource_type?: string;
                user_agent?: string | null;
                user_id?: string | null;
            };
            Relationships: [{
                foreignKeyName: "audit_logs_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        audit_trail: {
            Row: {
                action: string;
                details: import("../types/database").Json;
                entity_id: string;
                entity_type: string;
                id: string;
                timestamp: string;
                user_id: string | null;
            };
            Insert: {
                action: string;
                details?: import("../types/database").Json;
                entity_id: string;
                entity_type: string;
                id: string;
                timestamp?: string;
                user_id?: string | null;
            };
            Update: {
                action?: string;
                details?: import("../types/database").Json;
                entity_id?: string;
                entity_type?: string;
                id?: string;
                timestamp?: string;
                user_id?: string | null;
            };
            Relationships: [{
                foreignKeyName: "audit_trail_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        bank_accounts: {
            Row: {
                account_name: string;
                account_number: string;
                bank_name: string;
                created_at: string;
                id: string;
                is_default: boolean;
                is_verified: boolean;
                owner_id: string;
                owner_type: string;
                routing_number: string | null;
                swift_code: string | null;
                updated_at: string;
            };
            Insert: {
                account_name: string;
                account_number: string;
                bank_name: string;
                created_at?: string;
                id?: string;
                is_default?: boolean;
                is_verified?: boolean;
                owner_id: string;
                owner_type: string;
                routing_number?: string | null;
                swift_code?: string | null;
                updated_at?: string;
            };
            Update: {
                account_name?: string;
                account_number?: string;
                bank_name?: string;
                created_at?: string;
                id?: string;
                is_default?: boolean;
                is_verified?: boolean;
                owner_id?: string;
                owner_type?: string;
                routing_number?: string | null;
                swift_code?: string | null;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "bank_accounts_owner_id_fkey";
                columns: ["owner_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        bookings: {
            Row: {
                amount: number;
                created_at: string;
                discounts: import("../types/database").Json | null;
                end_time: string;
                id: string;
                payment_status: Database["public"]["Enums"]["payment_status"];
                spot_id: string;
                start_time: string;
                status: Database["public"]["Enums"]["booking_status"];
                total_amount: number;
                updated_at: string;
                user_id: string;
                vat_amount: number;
                vehicle_id: string;
            };
            Insert: {
                amount: number;
                created_at?: string;
                discounts?: import("../types/database").Json | null;
                end_time: string;
                id?: string;
                payment_status?: Database["public"]["Enums"]["payment_status"];
                spot_id: string;
                start_time: string;
                status?: Database["public"]["Enums"]["booking_status"];
                total_amount: number;
                updated_at?: string;
                user_id: string;
                vat_amount?: number;
                vehicle_id: string;
            };
            Update: {
                amount?: number;
                created_at?: string;
                discounts?: import("../types/database").Json | null;
                end_time?: string;
                id?: string;
                payment_status?: Database["public"]["Enums"]["payment_status"];
                spot_id?: string;
                start_time?: string;
                status?: Database["public"]["Enums"]["booking_status"];
                total_amount?: number;
                updated_at?: string;
                user_id?: string;
                vat_amount?: number;
                vehicle_id?: string;
            };
            Relationships: [{
                foreignKeyName: "bookings_spot_id_fkey";
                columns: ["spot_id"];
                isOneToOne: false;
                referencedRelation: "parking_hierarchy_view";
                referencedColumns: ["spot_id"];
            }, {
                foreignKeyName: "bookings_spot_id_fkey";
                columns: ["spot_id"];
                isOneToOne: false;
                referencedRelation: "parking_spots";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "bookings_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "bookings_vehicle_id_fkey";
                columns: ["vehicle_id"];
                isOneToOne: false;
                referencedRelation: "vehicles";
                referencedColumns: ["id"];
            }];
        };
        cash_drawer_operations: {
            Row: {
                amount: number | null;
                created_at: string;
                hardware_status: import("../types/database").Json | null;
                id: string;
                operator_id: string;
                reason: string | null;
                session_id: string;
                type: string;
            };
            Insert: {
                amount?: number | null;
                created_at?: string;
                hardware_status?: import("../types/database").Json | null;
                id?: string;
                operator_id: string;
                reason?: string | null;
                session_id: string;
                type: string;
            };
            Update: {
                amount?: number | null;
                created_at?: string;
                hardware_status?: import("../types/database").Json | null;
                id?: string;
                operator_id?: string;
                reason?: string | null;
                session_id?: string;
                type?: string;
            };
            Relationships: [{
                foreignKeyName: "cash_drawer_operations_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "cash_drawer_operations_session_id_fkey";
                columns: ["session_id"];
                isOneToOne: false;
                referencedRelation: "active_pos_sessions_view";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "cash_drawer_operations_session_id_fkey";
                columns: ["session_id"];
                isOneToOne: false;
                referencedRelation: "pos_sessions";
                referencedColumns: ["id"];
            }];
        };
        commission_calculations: {
            Row: {
                calculated_at: string;
                commission_rule_id: string;
                created_at: string;
                host_share: number;
                id: string;
                park_angel_share: number;
                total_amount: number;
                transaction_id: string;
            };
            Insert: {
                calculated_at?: string;
                commission_rule_id: string;
                created_at?: string;
                host_share: number;
                id?: string;
                park_angel_share: number;
                total_amount: number;
                transaction_id: string;
            };
            Update: {
                calculated_at?: string;
                commission_rule_id?: string;
                created_at?: string;
                host_share?: number;
                id?: string;
                park_angel_share?: number;
                total_amount?: number;
                transaction_id?: string;
            };
            Relationships: [{
                foreignKeyName: "commission_calculations_commission_rule_id_fkey";
                columns: ["commission_rule_id"];
                isOneToOne: false;
                referencedRelation: "commission_rules";
                referencedColumns: ["id"];
            }];
        };
        commission_rules: {
            Row: {
                created_at: string;
                effective_date: string;
                expiry_date: string | null;
                host_percentage: number;
                id: string;
                is_active: boolean;
                park_angel_percentage: number;
                parking_type: Database["public"]["Enums"]["parking_type"];
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                effective_date?: string;
                expiry_date?: string | null;
                host_percentage: number;
                id: string;
                is_active?: boolean;
                park_angel_percentage: number;
                parking_type: Database["public"]["Enums"]["parking_type"];
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                effective_date?: string;
                expiry_date?: string | null;
                host_percentage?: number;
                id?: string;
                is_active?: boolean;
                park_angel_percentage?: number;
                parking_type?: Database["public"]["Enums"]["parking_type"];
                updated_at?: string;
            };
            Relationships: [];
        };
        conversations: {
            Row: {
                created_at: string;
                id: string;
                is_active: boolean;
                metadata: import("../types/database").Json | null;
                participants: string[];
                type: Database["public"]["Enums"]["conversation_type"];
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                id?: string;
                is_active?: boolean;
                metadata?: import("../types/database").Json | null;
                participants: string[];
                type: Database["public"]["Enums"]["conversation_type"];
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                id?: string;
                is_active?: boolean;
                metadata?: import("../types/database").Json | null;
                participants?: string[];
                type?: Database["public"]["Enums"]["conversation_type"];
                updated_at?: string;
            };
            Relationships: [];
        };
        customer_analytics: {
            Row: {
                average_session_duration: number | null;
                customer_id: string;
                customer_since: string;
                favorite_locations: string[] | null;
                id: string;
                last_booking_date: string | null;
                loyalty_score: number;
                operator_id: string;
                total_bookings: number;
                total_spent: number;
                updated_at: string;
            };
            Insert: {
                average_session_duration?: number | null;
                customer_id: string;
                customer_since?: string;
                favorite_locations?: string[] | null;
                id?: string;
                last_booking_date?: string | null;
                loyalty_score?: number;
                operator_id: string;
                total_bookings?: number;
                total_spent?: number;
                updated_at?: string;
            };
            Update: {
                average_session_duration?: number | null;
                customer_id?: string;
                customer_since?: string;
                favorite_locations?: string[] | null;
                id?: string;
                last_booking_date?: string | null;
                loyalty_score?: number;
                operator_id?: string;
                total_bookings?: number;
                total_spent?: number;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "customer_analytics_customer_id_fkey";
                columns: ["customer_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "customer_analytics_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        customer_support_conversations: {
            Row: {
                created_at: string;
                customer_id: string;
                id: string;
                operator_id: string;
                priority: string;
                status: string;
                subject: string;
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                customer_id: string;
                id?: string;
                operator_id: string;
                priority?: string;
                status?: string;
                subject: string;
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                customer_id?: string;
                id?: string;
                operator_id?: string;
                priority?: string;
                status?: string;
                subject?: string;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "customer_support_conversations_customer_id_fkey";
                columns: ["customer_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "customer_support_conversations_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        customer_support_messages: {
            Row: {
                attachments: import("../types/database").Json | null;
                conversation_id: string;
                created_at: string;
                id: string;
                is_internal: boolean;
                message: string;
                sender_id: string;
            };
            Insert: {
                attachments?: import("../types/database").Json | null;
                conversation_id: string;
                created_at?: string;
                id?: string;
                is_internal?: boolean;
                message: string;
                sender_id: string;
            };
            Update: {
                attachments?: import("../types/database").Json | null;
                conversation_id?: string;
                created_at?: string;
                id?: string;
                is_internal?: boolean;
                message?: string;
                sender_id?: string;
            };
            Relationships: [{
                foreignKeyName: "customer_support_messages_conversation_id_fkey";
                columns: ["conversation_id"];
                isOneToOne: false;
                referencedRelation: "customer_support_conversations";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "customer_support_messages_sender_id_fkey";
                columns: ["sender_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        developer_accounts: {
            Row: {
                approved_at: string | null;
                approved_by: string | null;
                company_name: string;
                contact_email: string;
                contact_phone: string | null;
                created_at: string | null;
                description: string | null;
                id: string;
                status: string | null;
                updated_at: string | null;
                user_id: string | null;
                website_url: string | null;
            };
            Insert: {
                approved_at?: string | null;
                approved_by?: string | null;
                company_name: string;
                contact_email: string;
                contact_phone?: string | null;
                created_at?: string | null;
                description?: string | null;
                id?: string;
                status?: string | null;
                updated_at?: string | null;
                user_id?: string | null;
                website_url?: string | null;
            };
            Update: {
                approved_at?: string | null;
                approved_by?: string | null;
                company_name?: string;
                contact_email?: string;
                contact_phone?: string | null;
                created_at?: string | null;
                description?: string | null;
                id?: string;
                status?: string | null;
                updated_at?: string | null;
                user_id?: string | null;
                website_url?: string | null;
            };
            Relationships: [];
        };
        discount_applications: {
            Row: {
                applied_at: string;
                created_at: string;
                discount_type: string;
                documents: import("../types/database").Json;
                id: string;
                rejection_reason: string | null;
                reviewed_at: string | null;
                reviewed_by: string | null;
                status: string;
                updated_at: string;
                user_id: string;
            };
            Insert: {
                applied_at?: string;
                created_at?: string;
                discount_type: string;
                documents: import("../types/database").Json;
                id?: string;
                rejection_reason?: string | null;
                reviewed_at?: string | null;
                reviewed_by?: string | null;
                status?: string;
                updated_at?: string;
                user_id: string;
            };
            Update: {
                applied_at?: string;
                created_at?: string;
                discount_type?: string;
                documents?: import("../types/database").Json;
                id?: string;
                rejection_reason?: string | null;
                reviewed_at?: string | null;
                reviewed_by?: string | null;
                status?: string;
                updated_at?: string;
                user_id?: string;
            };
            Relationships: [];
        };
        discount_rules: {
            Row: {
                approved_at: string | null;
                approved_by: string | null;
                conditions: import("../types/database").Json | null;
                created_at: string;
                created_by: string | null;
                id: string;
                is_active: boolean;
                is_vat_exempt: boolean;
                name: string;
                operator_id: string | null;
                percentage: number;
                type: string;
                updated_at: string;
            };
            Insert: {
                approved_at?: string | null;
                approved_by?: string | null;
                conditions?: import("../types/database").Json | null;
                created_at?: string;
                created_by?: string | null;
                id?: string;
                is_active?: boolean;
                is_vat_exempt?: boolean;
                name: string;
                operator_id?: string | null;
                percentage: number;
                type: string;
                updated_at?: string;
            };
            Update: {
                approved_at?: string | null;
                approved_by?: string | null;
                conditions?: import("../types/database").Json | null;
                created_at?: string;
                created_by?: string | null;
                id?: string;
                is_active?: boolean;
                is_vat_exempt?: boolean;
                name?: string;
                operator_id?: string | null;
                percentage?: number;
                type?: string;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "discount_rules_approved_by_fkey";
                columns: ["approved_by"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "discount_rules_created_by_fkey";
                columns: ["created_by"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "discount_rules_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        discount_verification_documents: {
            Row: {
                created_at: string;
                discount_type: string;
                document_type: string;
                document_url: string;
                expiry_date: string | null;
                id: string;
                notes: string | null;
                status: string;
                updated_at: string;
                user_id: string;
                verified_at: string | null;
                verified_by: string | null;
            };
            Insert: {
                created_at?: string;
                discount_type: string;
                document_type: string;
                document_url: string;
                expiry_date?: string | null;
                id?: string;
                notes?: string | null;
                status?: string;
                updated_at?: string;
                user_id: string;
                verified_at?: string | null;
                verified_by?: string | null;
            };
            Update: {
                created_at?: string;
                discount_type?: string;
                document_type?: string;
                document_url?: string;
                expiry_date?: string | null;
                id?: string;
                notes?: string | null;
                status?: string;
                updated_at?: string;
                user_id?: string;
                verified_at?: string | null;
                verified_by?: string | null;
            };
            Relationships: [{
                foreignKeyName: "discount_verification_documents_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "discount_verification_documents_verified_by_fkey";
                columns: ["verified_by"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        discrepancies: {
            Row: {
                actual_amount: number | null;
                amount: number | null;
                created_at: string;
                description: string;
                difference: number | null;
                expected_amount: number | null;
                id: string;
                resolution: string | null;
                resolved_at: string | null;
                resolved_by: string | null;
                status: string;
                transaction_id: string | null;
                type: Database["public"]["Enums"]["discrepancy_type"];
            };
            Insert: {
                actual_amount?: number | null;
                amount?: number | null;
                created_at?: string;
                description: string;
                difference?: number | null;
                expected_amount?: number | null;
                id: string;
                resolution?: string | null;
                resolved_at?: string | null;
                resolved_by?: string | null;
                status?: string;
                transaction_id?: string | null;
                type: Database["public"]["Enums"]["discrepancy_type"];
            };
            Update: {
                actual_amount?: number | null;
                amount?: number | null;
                created_at?: string;
                description?: string;
                difference?: number | null;
                expected_amount?: number | null;
                id?: string;
                resolution?: string | null;
                resolved_at?: string | null;
                resolved_by?: string | null;
                status?: string;
                transaction_id?: string | null;
                type?: Database["public"]["Enums"]["discrepancy_type"];
            };
            Relationships: [{
                foreignKeyName: "discrepancies_resolved_by_fkey";
                columns: ["resolved_by"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        facility_layouts: {
            Row: {
                created_at: string;
                elements: import("../types/database").Json;
                floors: import("../types/database").Json;
                id: string;
                location_id: string;
                metadata: import("../types/database").Json;
                name: string;
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                elements?: import("../types/database").Json;
                floors?: import("../types/database").Json;
                id?: string;
                location_id: string;
                metadata?: import("../types/database").Json;
                name: string;
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                elements?: import("../types/database").Json;
                floors?: import("../types/database").Json;
                id?: string;
                location_id?: string;
                metadata?: import("../types/database").Json;
                name?: string;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "facility_layouts_location_id_fkey";
                columns: ["location_id"];
                isOneToOne: false;
                referencedRelation: "locations";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "facility_layouts_location_id_fkey";
                columns: ["location_id"];
                isOneToOne: false;
                referencedRelation: "parking_hierarchy_view";
                referencedColumns: ["location_id"];
            }];
        };
        financial_reports: {
            Row: {
                created_at: string;
                data: import("../types/database").Json;
                description: string | null;
                generated_at: string;
                generated_by: string;
                id: string;
                metadata: import("../types/database").Json;
                parameters: import("../types/database").Json;
                title: string;
                type: Database["public"]["Enums"]["financial_report_type"];
            };
            Insert: {
                created_at?: string;
                data?: import("../types/database").Json;
                description?: string | null;
                generated_at?: string;
                generated_by: string;
                id: string;
                metadata?: import("../types/database").Json;
                parameters?: import("../types/database").Json;
                title: string;
                type: Database["public"]["Enums"]["financial_report_type"];
            };
            Update: {
                created_at?: string;
                data?: import("../types/database").Json;
                description?: string | null;
                generated_at?: string;
                generated_by?: string;
                id?: string;
                metadata?: import("../types/database").Json;
                parameters?: import("../types/database").Json;
                title?: string;
                type?: Database["public"]["Enums"]["financial_report_type"];
            };
            Relationships: [{
                foreignKeyName: "financial_reports_generated_by_fkey";
                columns: ["generated_by"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        generated_reports: {
            Row: {
                created_at: string | null;
                created_by: string | null;
                data: import("../types/database").Json;
                description: string | null;
                filters: import("../types/database").Json | null;
                id: string;
                metadata: import("../types/database").Json;
                sorting: import("../types/database").Json | null;
                title: string;
                type: string;
            };
            Insert: {
                created_at?: string | null;
                created_by?: string | null;
                data: import("../types/database").Json;
                description?: string | null;
                filters?: import("../types/database").Json | null;
                id: string;
                metadata?: import("../types/database").Json;
                sorting?: import("../types/database").Json | null;
                title: string;
                type: string;
            };
            Update: {
                created_at?: string | null;
                created_by?: string | null;
                data?: import("../types/database").Json;
                description?: string | null;
                filters?: import("../types/database").Json | null;
                id?: string;
                metadata?: import("../types/database").Json;
                sorting?: import("../types/database").Json | null;
                title?: string;
                type?: string;
            };
            Relationships: [];
        };
        host_payouts: {
            Row: {
                booking_ids: string[];
                created_at: string;
                failure_reason: string | null;
                gross_amount: number;
                host_id: string;
                id: string;
                net_amount: number;
                payout_details: import("../types/database").Json | null;
                payout_method: string;
                platform_fee: number;
                processed_at: string | null;
                status: string;
                updated_at: string;
            };
            Insert: {
                booking_ids: string[];
                created_at?: string;
                failure_reason?: string | null;
                gross_amount: number;
                host_id: string;
                id?: string;
                net_amount: number;
                payout_details?: import("../types/database").Json | null;
                payout_method?: string;
                platform_fee: number;
                processed_at?: string | null;
                status?: string;
                updated_at?: string;
            };
            Update: {
                booking_ids?: string[];
                created_at?: string;
                failure_reason?: string | null;
                gross_amount?: number;
                host_id?: string;
                id?: string;
                net_amount?: number;
                payout_details?: import("../types/database").Json | null;
                payout_method?: string;
                platform_fee?: number;
                processed_at?: string | null;
                status?: string;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "host_payouts_host_id_fkey";
                columns: ["host_id"];
                isOneToOne: false;
                referencedRelation: "host_profiles";
                referencedColumns: ["id"];
            }];
        };
        host_profiles: {
            Row: {
                address: string | null;
                bank_details: import("../types/database").Json | null;
                business_name: string | null;
                contact_phone: string | null;
                created_at: string;
                id: string;
                is_active: boolean;
                profile_photo: string | null;
                rating: number | null;
                total_reviews: number | null;
                updated_at: string;
                user_id: string;
                verification_status: string;
            };
            Insert: {
                address?: string | null;
                bank_details?: import("../types/database").Json | null;
                business_name?: string | null;
                contact_phone?: string | null;
                created_at?: string;
                id?: string;
                is_active?: boolean;
                profile_photo?: string | null;
                rating?: number | null;
                total_reviews?: number | null;
                updated_at?: string;
                user_id: string;
                verification_status?: string;
            };
            Update: {
                address?: string | null;
                bank_details?: import("../types/database").Json | null;
                business_name?: string | null;
                contact_phone?: string | null;
                created_at?: string;
                id?: string;
                is_active?: boolean;
                profile_photo?: string | null;
                rating?: number | null;
                total_reviews?: number | null;
                updated_at?: string;
                user_id?: string;
                verification_status?: string;
            };
            Relationships: [];
        };
        host_reviews: {
            Row: {
                booking_id: string | null;
                created_at: string;
                host_id: string;
                id: string;
                is_verified: boolean | null;
                photos: string[] | null;
                rating: number;
                review_text: string | null;
                reviewer_id: string;
                updated_at: string;
            };
            Insert: {
                booking_id?: string | null;
                created_at?: string;
                host_id: string;
                id?: string;
                is_verified?: boolean | null;
                photos?: string[] | null;
                rating: number;
                review_text?: string | null;
                reviewer_id: string;
                updated_at?: string;
            };
            Update: {
                booking_id?: string | null;
                created_at?: string;
                host_id?: string;
                id?: string;
                is_verified?: boolean | null;
                photos?: string[] | null;
                rating?: number;
                review_text?: string | null;
                reviewer_id?: string;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "host_reviews_booking_id_fkey";
                columns: ["booking_id"];
                isOneToOne: false;
                referencedRelation: "active_bookings_view";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "host_reviews_booking_id_fkey";
                columns: ["booking_id"];
                isOneToOne: false;
                referencedRelation: "bookings";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "host_reviews_host_id_fkey";
                columns: ["host_id"];
                isOneToOne: false;
                referencedRelation: "host_profiles";
                referencedColumns: ["id"];
            }];
        };
        hosted_listings: {
            Row: {
                access_instructions: string | null;
                address: string;
                amenities: string[] | null;
                availability_schedule: import("../types/database").Json | null;
                coordinates: unknown | null;
                created_at: string;
                description: string | null;
                host_id: string;
                id: string;
                is_active: boolean;
                max_vehicle_size: string | null;
                photos: string[] | null;
                pricing_per_day: number | null;
                pricing_per_hour: number;
                title: string;
                updated_at: string;
                vehicle_types: string[] | null;
            };
            Insert: {
                access_instructions?: string | null;
                address: string;
                amenities?: string[] | null;
                availability_schedule?: import("../types/database").Json | null;
                coordinates?: unknown | null;
                created_at?: string;
                description?: string | null;
                host_id: string;
                id?: string;
                is_active?: boolean;
                max_vehicle_size?: string | null;
                photos?: string[] | null;
                pricing_per_day?: number | null;
                pricing_per_hour: number;
                title: string;
                updated_at?: string;
                vehicle_types?: string[] | null;
            };
            Update: {
                access_instructions?: string | null;
                address?: string;
                amenities?: string[] | null;
                availability_schedule?: import("../types/database").Json | null;
                coordinates?: unknown | null;
                created_at?: string;
                description?: string | null;
                host_id?: string;
                id?: string;
                is_active?: boolean;
                max_vehicle_size?: string | null;
                photos?: string[] | null;
                pricing_per_day?: number | null;
                pricing_per_hour?: number;
                title?: string;
                updated_at?: string;
                vehicle_types?: string[] | null;
            };
            Relationships: [{
                foreignKeyName: "hosted_listings_host_id_fkey";
                columns: ["host_id"];
                isOneToOne: false;
                referencedRelation: "host_profiles";
                referencedColumns: ["id"];
            }];
        };
        locations: {
            Row: {
                address: import("../types/database").Json;
                coordinates: import("../types/database").Json;
                created_at: string;
                id: string;
                name: string;
                operator_id: string;
                pricing_config: import("../types/database").Json | null;
                settings: import("../types/database").Json;
                type: Database["public"]["Enums"]["parking_type"];
                updated_at: string;
            };
            Insert: {
                address: import("../types/database").Json;
                coordinates: import("../types/database").Json;
                created_at?: string;
                id?: string;
                name: string;
                operator_id: string;
                pricing_config?: import("../types/database").Json | null;
                settings?: import("../types/database").Json;
                type: Database["public"]["Enums"]["parking_type"];
                updated_at?: string;
            };
            Update: {
                address?: import("../types/database").Json;
                coordinates?: import("../types/database").Json;
                created_at?: string;
                id?: string;
                name?: string;
                operator_id?: string;
                pricing_config?: import("../types/database").Json | null;
                settings?: import("../types/database").Json;
                type?: Database["public"]["Enums"]["parking_type"];
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "locations_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        message_attachments: {
            Row: {
                created_at: string;
                file_name: string;
                file_size: number;
                file_type: string;
                id: string;
                message_id: string;
                thumbnail_url: string | null;
                url: string;
            };
            Insert: {
                created_at?: string;
                file_name: string;
                file_size: number;
                file_type: string;
                id?: string;
                message_id: string;
                thumbnail_url?: string | null;
                url: string;
            };
            Update: {
                created_at?: string;
                file_name?: string;
                file_size?: number;
                file_type?: string;
                id?: string;
                message_id?: string;
                thumbnail_url?: string | null;
                url?: string;
            };
            Relationships: [{
                foreignKeyName: "message_attachments_message_id_fkey";
                columns: ["message_id"];
                isOneToOne: false;
                referencedRelation: "messages";
                referencedColumns: ["id"];
            }];
        };
        message_threads: {
            Row: {
                conversation_id: string;
                created_at: string;
                id: string;
                parent_message_id: string;
                updated_at: string;
            };
            Insert: {
                conversation_id: string;
                created_at?: string;
                id?: string;
                parent_message_id: string;
                updated_at?: string;
            };
            Update: {
                conversation_id?: string;
                created_at?: string;
                id?: string;
                parent_message_id?: string;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "message_threads_conversation_id_fkey";
                columns: ["conversation_id"];
                isOneToOne: false;
                referencedRelation: "conversations";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "message_threads_parent_message_id_fkey";
                columns: ["parent_message_id"];
                isOneToOne: false;
                referencedRelation: "messages";
                referencedColumns: ["id"];
            }];
        };
        messages: {
            Row: {
                attachments: import("../types/database").Json | null;
                content: string;
                conversation_id: string;
                created_at: string;
                deleted_at: string | null;
                edited_at: string | null;
                id: string;
                is_encrypted: boolean;
                read_at: string | null;
                receiver_id: string;
                sender_id: string;
                status: string | null;
                type: Database["public"]["Enums"]["message_type"];
            };
            Insert: {
                attachments?: import("../types/database").Json | null;
                content: string;
                conversation_id: string;
                created_at?: string;
                deleted_at?: string | null;
                edited_at?: string | null;
                id?: string;
                is_encrypted?: boolean;
                read_at?: string | null;
                receiver_id: string;
                sender_id: string;
                status?: string | null;
                type?: Database["public"]["Enums"]["message_type"];
            };
            Update: {
                attachments?: import("../types/database").Json | null;
                content?: string;
                conversation_id?: string;
                created_at?: string;
                deleted_at?: string | null;
                edited_at?: string | null;
                id?: string;
                is_encrypted?: boolean;
                read_at?: string | null;
                receiver_id?: string;
                sender_id?: string;
                status?: string | null;
                type?: Database["public"]["Enums"]["message_type"];
            };
            Relationships: [{
                foreignKeyName: "messages_conversation_id_fkey";
                columns: ["conversation_id"];
                isOneToOne: false;
                referencedRelation: "conversations";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "messages_receiver_id_fkey";
                columns: ["receiver_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "messages_sender_id_fkey";
                columns: ["sender_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        notifications: {
            Row: {
                created_at: string;
                data: import("../types/database").Json | null;
                id: string;
                is_read: boolean;
                message: string;
                title: string;
                type: string;
                user_id: string;
            };
            Insert: {
                created_at?: string;
                data?: import("../types/database").Json | null;
                id?: string;
                is_read?: boolean;
                message: string;
                title: string;
                type: string;
                user_id: string;
            };
            Update: {
                created_at?: string;
                data?: import("../types/database").Json | null;
                id?: string;
                is_read?: boolean;
                message?: string;
                title?: string;
                type?: string;
                user_id?: string;
            };
            Relationships: [{
                foreignKeyName: "notifications_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        operator_bank_details: {
            Row: {
                account_holder_name: string;
                account_number: string;
                account_type: string;
                bank_name: string;
                branch_address: string | null;
                branch_name: string | null;
                created_at: string;
                id: string;
                is_primary: boolean;
                is_verified: boolean;
                operator_id: string;
                routing_number: string | null;
                swift_code: string | null;
                updated_at: string;
                verification_documents: string[] | null;
            };
            Insert: {
                account_holder_name: string;
                account_number: string;
                account_type?: string;
                bank_name: string;
                branch_address?: string | null;
                branch_name?: string | null;
                created_at?: string;
                id?: string;
                is_primary?: boolean;
                is_verified?: boolean;
                operator_id: string;
                routing_number?: string | null;
                swift_code?: string | null;
                updated_at?: string;
                verification_documents?: string[] | null;
            };
            Update: {
                account_holder_name?: string;
                account_number?: string;
                account_type?: string;
                bank_name?: string;
                branch_address?: string | null;
                branch_name?: string | null;
                created_at?: string;
                id?: string;
                is_primary?: boolean;
                is_verified?: boolean;
                operator_id?: string;
                routing_number?: string | null;
                swift_code?: string | null;
                updated_at?: string;
                verification_documents?: string[] | null;
            };
            Relationships: [{
                foreignKeyName: "operator_bank_details_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        operator_performance_metrics: {
            Row: {
                average_session_duration: number;
                created_at: string;
                customer_satisfaction_score: number | null;
                id: string;
                metric_date: string;
                occupancy_rate: number;
                occupied_spots: number;
                operator_id: string;
                response_time_avg: number | null;
                total_revenue: number;
                total_spots: number;
                transaction_count: number;
                violation_reports: number;
            };
            Insert: {
                average_session_duration?: number;
                created_at?: string;
                customer_satisfaction_score?: number | null;
                id?: string;
                metric_date?: string;
                occupancy_rate?: number;
                occupied_spots?: number;
                operator_id: string;
                response_time_avg?: number | null;
                total_revenue?: number;
                total_spots?: number;
                transaction_count?: number;
                violation_reports?: number;
            };
            Update: {
                average_session_duration?: number;
                created_at?: string;
                customer_satisfaction_score?: number | null;
                id?: string;
                metric_date?: string;
                occupancy_rate?: number;
                occupied_spots?: number;
                operator_id?: string;
                response_time_avg?: number | null;
                total_revenue?: number;
                total_spots?: number;
                transaction_count?: number;
                violation_reports?: number;
            };
            Relationships: [{
                foreignKeyName: "operator_performance_metrics_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        operator_profiles: {
            Row: {
                business_address: import("../types/database").Json;
                business_registration_number: string | null;
                business_type: string | null;
                company_name: string;
                contact_email: string;
                contact_person: string;
                contact_phone: string;
                created_at: string;
                id: string;
                is_verified: boolean;
                license_expiry_date: string | null;
                license_number: string | null;
                operator_id: string;
                tax_identification_number: string | null;
                updated_at: string;
                verification_documents: string[] | null;
                website_url: string | null;
            };
            Insert: {
                business_address: import("../types/database").Json;
                business_registration_number?: string | null;
                business_type?: string | null;
                company_name: string;
                contact_email: string;
                contact_person: string;
                contact_phone: string;
                created_at?: string;
                id?: string;
                is_verified?: boolean;
                license_expiry_date?: string | null;
                license_number?: string | null;
                operator_id: string;
                tax_identification_number?: string | null;
                updated_at?: string;
                verification_documents?: string[] | null;
                website_url?: string | null;
            };
            Update: {
                business_address?: import("../types/database").Json;
                business_registration_number?: string | null;
                business_type?: string | null;
                company_name?: string;
                contact_email?: string;
                contact_person?: string;
                contact_phone?: string;
                created_at?: string;
                id?: string;
                is_verified?: boolean;
                license_expiry_date?: string | null;
                license_number?: string | null;
                operator_id?: string;
                tax_identification_number?: string | null;
                updated_at?: string;
                verification_documents?: string[] | null;
                website_url?: string | null;
            };
            Relationships: [{
                foreignKeyName: "operator_profiles_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: true;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        operator_remittances: {
            Row: {
                bank_detail_id: string;
                created_at: string;
                failure_reason: string | null;
                id: string;
                notes: string | null;
                operator_id: string;
                operator_share: number;
                park_angel_share: number;
                payment_reference: string | null;
                period_end: string;
                period_start: string;
                processed_at: string | null;
                processed_by: string | null;
                status: string;
                total_revenue: number;
                transaction_count: number;
                updated_at: string;
            };
            Insert: {
                bank_detail_id: string;
                created_at?: string;
                failure_reason?: string | null;
                id?: string;
                notes?: string | null;
                operator_id: string;
                operator_share: number;
                park_angel_share: number;
                payment_reference?: string | null;
                period_end: string;
                period_start: string;
                processed_at?: string | null;
                processed_by?: string | null;
                status?: string;
                total_revenue: number;
                transaction_count?: number;
                updated_at?: string;
            };
            Update: {
                bank_detail_id?: string;
                created_at?: string;
                failure_reason?: string | null;
                id?: string;
                notes?: string | null;
                operator_id?: string;
                operator_share?: number;
                park_angel_share?: number;
                payment_reference?: string | null;
                period_end?: string;
                period_start?: string;
                processed_at?: string | null;
                processed_by?: string | null;
                status?: string;
                total_revenue?: number;
                transaction_count?: number;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "operator_remittances_bank_detail_id_fkey";
                columns: ["bank_detail_id"];
                isOneToOne: false;
                referencedRelation: "operator_bank_details";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "operator_remittances_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "operator_remittances_processed_by_fkey";
                columns: ["processed_by"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        operator_report_exports: {
            Row: {
                created_at: string;
                expires_at: string;
                file_name: string;
                file_path: string;
                file_size: number;
                format: string;
                id: string;
                mime_type: string;
                options: import("../types/database").Json;
                report_id: string;
                status: string;
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                expires_at?: string;
                file_name: string;
                file_path: string;
                file_size?: number;
                format: string;
                id?: string;
                mime_type: string;
                options?: import("../types/database").Json;
                report_id: string;
                status?: string;
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                expires_at?: string;
                file_name?: string;
                file_path?: string;
                file_size?: number;
                format?: string;
                id?: string;
                mime_type?: string;
                options?: import("../types/database").Json;
                report_id?: string;
                status?: string;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "operator_report_exports_report_id_fkey";
                columns: ["report_id"];
                isOneToOne: false;
                referencedRelation: "operator_reports";
                referencedColumns: ["id"];
            }];
        };
        operator_reports: {
            Row: {
                created_at: string;
                data: import("../types/database").Json;
                description: string | null;
                generated_at: string;
                generated_by: string;
                id: string;
                metadata: import("../types/database").Json;
                operator_id: string;
                parameters: import("../types/database").Json;
                title: string;
                type: string;
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                data?: import("../types/database").Json;
                description?: string | null;
                generated_at?: string;
                generated_by: string;
                id?: string;
                metadata?: import("../types/database").Json;
                operator_id: string;
                parameters?: import("../types/database").Json;
                title: string;
                type: string;
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                data?: import("../types/database").Json;
                description?: string | null;
                generated_at?: string;
                generated_by?: string;
                id?: string;
                metadata?: import("../types/database").Json;
                operator_id?: string;
                parameters?: import("../types/database").Json;
                title?: string;
                type?: string;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "operator_reports_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        operator_revenue_configs: {
            Row: {
                created_at: string;
                created_by: string;
                effective_date: string;
                id: string;
                is_active: boolean;
                operator_id: string;
                operator_percentage: number;
                park_angel_percentage: number;
                parking_type: Database["public"]["Enums"]["parking_type"];
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                created_by: string;
                effective_date?: string;
                id?: string;
                is_active?: boolean;
                operator_id: string;
                operator_percentage: number;
                park_angel_percentage: number;
                parking_type: Database["public"]["Enums"]["parking_type"];
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                created_by?: string;
                effective_date?: string;
                id?: string;
                is_active?: boolean;
                operator_id?: string;
                operator_percentage?: number;
                park_angel_percentage?: number;
                parking_type?: Database["public"]["Enums"]["parking_type"];
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "operator_revenue_configs_created_by_fkey";
                columns: ["created_by"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "operator_revenue_configs_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        operator_scheduled_reports: {
            Row: {
                created_at: string;
                id: string;
                is_active: boolean;
                last_run_at: string | null;
                next_run_at: string | null;
                operator_id: string;
                parameters: import("../types/database").Json;
                report_type: string;
                schedule: string;
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                id?: string;
                is_active?: boolean;
                last_run_at?: string | null;
                next_run_at?: string | null;
                operator_id: string;
                parameters?: import("../types/database").Json;
                report_type: string;
                schedule: string;
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                id?: string;
                is_active?: boolean;
                last_run_at?: string | null;
                next_run_at?: string | null;
                operator_id?: string;
                parameters?: import("../types/database").Json;
                report_type?: string;
                schedule?: string;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "operator_scheduled_reports_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        parking_spots: {
            Row: {
                amenities: string[] | null;
                coordinates: import("../types/database").Json;
                created_at: string;
                id: string;
                number: string;
                pricing_config: import("../types/database").Json | null;
                status: Database["public"]["Enums"]["spot_status"];
                type: string;
                updated_at: string;
                zone_id: string;
            };
            Insert: {
                amenities?: string[] | null;
                coordinates: import("../types/database").Json;
                created_at?: string;
                id?: string;
                number: string;
                pricing_config?: import("../types/database").Json | null;
                status?: Database["public"]["Enums"]["spot_status"];
                type: string;
                updated_at?: string;
                zone_id: string;
            };
            Update: {
                amenities?: string[] | null;
                coordinates?: import("../types/database").Json;
                created_at?: string;
                id?: string;
                number?: string;
                pricing_config?: import("../types/database").Json | null;
                status?: Database["public"]["Enums"]["spot_status"];
                type?: string;
                updated_at?: string;
                zone_id?: string;
            };
            Relationships: [{
                foreignKeyName: "parking_spots_zone_id_fkey";
                columns: ["zone_id"];
                isOneToOne: false;
                referencedRelation: "parking_hierarchy_view";
                referencedColumns: ["zone_id"];
            }, {
                foreignKeyName: "parking_spots_zone_id_fkey";
                columns: ["zone_id"];
                isOneToOne: false;
                referencedRelation: "zones";
                referencedColumns: ["id"];
            }];
        };
        payment_intents: {
            Row: {
                amount: number;
                booking_id: string;
                client_secret: string | null;
                created_at: string;
                currency: string;
                expires_at: string;
                id: string;
                metadata: import("../types/database").Json;
                provider: Database["public"]["Enums"]["payment_provider"];
                status: Database["public"]["Enums"]["payment_intent_status"];
                user_id: string;
            };
            Insert: {
                amount: number;
                booking_id: string;
                client_secret?: string | null;
                created_at?: string;
                currency?: string;
                expires_at: string;
                id: string;
                metadata?: import("../types/database").Json;
                provider: Database["public"]["Enums"]["payment_provider"];
                status?: Database["public"]["Enums"]["payment_intent_status"];
                user_id: string;
            };
            Update: {
                amount?: number;
                booking_id?: string;
                client_secret?: string | null;
                created_at?: string;
                currency?: string;
                expires_at?: string;
                id?: string;
                metadata?: import("../types/database").Json;
                provider?: Database["public"]["Enums"]["payment_provider"];
                status?: Database["public"]["Enums"]["payment_intent_status"];
                user_id?: string;
            };
            Relationships: [{
                foreignKeyName: "payment_intents_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        payment_methods: {
            Row: {
                created_at: string;
                id: string;
                is_default: boolean;
                metadata: import("../types/database").Json;
                provider: Database["public"]["Enums"]["payment_provider"];
                type: Database["public"]["Enums"]["payment_method_type"];
                updated_at: string;
                user_id: string;
            };
            Insert: {
                created_at?: string;
                id?: string;
                is_default?: boolean;
                metadata?: import("../types/database").Json;
                provider: Database["public"]["Enums"]["payment_provider"];
                type: Database["public"]["Enums"]["payment_method_type"];
                updated_at?: string;
                user_id: string;
            };
            Update: {
                created_at?: string;
                id?: string;
                is_default?: boolean;
                metadata?: import("../types/database").Json;
                provider?: Database["public"]["Enums"]["payment_provider"];
                type?: Database["public"]["Enums"]["payment_method_type"];
                updated_at?: string;
                user_id?: string;
            };
            Relationships: [{
                foreignKeyName: "payment_methods_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        payment_transactions: {
            Row: {
                amount: number;
                booking_id: string;
                created_at: string;
                currency: string;
                failed_at: string | null;
                id: string;
                metadata: import("../types/database").Json;
                payment_method_id: string | null;
                processed_at: string | null;
                provider: Database["public"]["Enums"]["payment_provider"];
                provider_transaction_id: string | null;
                refunded_at: string | null;
                status: Database["public"]["Enums"]["payment_transaction_status"];
                updated_at: string;
                user_id: string;
            };
            Insert: {
                amount: number;
                booking_id: string;
                created_at?: string;
                currency?: string;
                failed_at?: string | null;
                id: string;
                metadata?: import("../types/database").Json;
                payment_method_id?: string | null;
                processed_at?: string | null;
                provider: Database["public"]["Enums"]["payment_provider"];
                provider_transaction_id?: string | null;
                refunded_at?: string | null;
                status?: Database["public"]["Enums"]["payment_transaction_status"];
                updated_at?: string;
                user_id: string;
            };
            Update: {
                amount?: number;
                booking_id?: string;
                created_at?: string;
                currency?: string;
                failed_at?: string | null;
                id?: string;
                metadata?: import("../types/database").Json;
                payment_method_id?: string | null;
                processed_at?: string | null;
                provider?: Database["public"]["Enums"]["payment_provider"];
                provider_transaction_id?: string | null;
                refunded_at?: string | null;
                status?: Database["public"]["Enums"]["payment_transaction_status"];
                updated_at?: string;
                user_id?: string;
            };
            Relationships: [{
                foreignKeyName: "payment_transactions_payment_method_id_fkey";
                columns: ["payment_method_id"];
                isOneToOne: false;
                referencedRelation: "payment_methods";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "payment_transactions_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        payouts: {
            Row: {
                amount: number;
                bank_account_id: string;
                created_at: string;
                currency: string;
                failed_at: string | null;
                id: string;
                metadata: import("../types/database").Json;
                processed_at: string | null;
                recipient_id: string;
                recipient_type: string;
                status: Database["public"]["Enums"]["payout_status"];
                transaction_ids: string[];
            };
            Insert: {
                amount: number;
                bank_account_id: string;
                created_at?: string;
                currency?: string;
                failed_at?: string | null;
                id: string;
                metadata?: import("../types/database").Json;
                processed_at?: string | null;
                recipient_id: string;
                recipient_type: string;
                status?: Database["public"]["Enums"]["payout_status"];
                transaction_ids?: string[];
            };
            Update: {
                amount?: number;
                bank_account_id?: string;
                created_at?: string;
                currency?: string;
                failed_at?: string | null;
                id?: string;
                metadata?: import("../types/database").Json;
                processed_at?: string | null;
                recipient_id?: string;
                recipient_type?: string;
                status?: Database["public"]["Enums"]["payout_status"];
                transaction_ids?: string[];
            };
            Relationships: [{
                foreignKeyName: "payouts_bank_account_id_fkey";
                columns: ["bank_account_id"];
                isOneToOne: false;
                referencedRelation: "bank_accounts";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "payouts_recipient_id_fkey";
                columns: ["recipient_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        performance_metrics: {
            Row: {
                created_at: string;
                feature: string;
                id: string;
                metadata: import("../types/database").Json | null;
                response_time: number;
                user_id: string | null;
            };
            Insert: {
                created_at?: string;
                feature: string;
                id?: string;
                metadata?: import("../types/database").Json | null;
                response_time: number;
                user_id?: string | null;
            };
            Update: {
                created_at?: string;
                feature?: string;
                id?: string;
                metadata?: import("../types/database").Json | null;
                response_time?: number;
                user_id?: string | null;
            };
            Relationships: [{
                foreignKeyName: "performance_metrics_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        pos_cash_remittances: {
            Row: {
                amount: number;
                created_at: string;
                deposit_date: string;
                deposit_method: string;
                id: string;
                notes: string | null;
                operator_id: string;
                reference_number: string | null;
                session_id: string;
                status: string;
                updated_at: string;
                verified_at: string | null;
                verified_by: string | null;
            };
            Insert: {
                amount: number;
                created_at?: string;
                deposit_date: string;
                deposit_method: string;
                id?: string;
                notes?: string | null;
                operator_id: string;
                reference_number?: string | null;
                session_id: string;
                status?: string;
                updated_at?: string;
                verified_at?: string | null;
                verified_by?: string | null;
            };
            Update: {
                amount?: number;
                created_at?: string;
                deposit_date?: string;
                deposit_method?: string;
                id?: string;
                notes?: string | null;
                operator_id?: string;
                reference_number?: string | null;
                session_id?: string;
                status?: string;
                updated_at?: string;
                verified_at?: string | null;
                verified_by?: string | null;
            };
            Relationships: [{
                foreignKeyName: "pos_cash_remittances_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "pos_cash_remittances_session_id_fkey";
                columns: ["session_id"];
                isOneToOne: false;
                referencedRelation: "active_pos_sessions_view";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "pos_cash_remittances_session_id_fkey";
                columns: ["session_id"];
                isOneToOne: false;
                referencedRelation: "pos_sessions";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "pos_cash_remittances_verified_by_fkey";
                columns: ["verified_by"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        pos_hardware_status: {
            Row: {
                biometric: import("../types/database").Json;
                cash_drawer: import("../types/database").Json;
                created_at: string;
                id: string;
                last_updated: string;
                printer: import("../types/database").Json;
                scanner: import("../types/database").Json;
                session_id: string;
            };
            Insert: {
                biometric?: import("../types/database").Json;
                cash_drawer?: import("../types/database").Json;
                created_at?: string;
                id?: string;
                last_updated?: string;
                printer?: import("../types/database").Json;
                scanner?: import("../types/database").Json;
                session_id: string;
            };
            Update: {
                biometric?: import("../types/database").Json;
                cash_drawer?: import("../types/database").Json;
                created_at?: string;
                id?: string;
                last_updated?: string;
                printer?: import("../types/database").Json;
                scanner?: import("../types/database").Json;
                session_id?: string;
            };
            Relationships: [{
                foreignKeyName: "pos_hardware_status_session_id_fkey";
                columns: ["session_id"];
                isOneToOne: false;
                referencedRelation: "active_pos_sessions_view";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "pos_hardware_status_session_id_fkey";
                columns: ["session_id"];
                isOneToOne: false;
                referencedRelation: "pos_sessions";
                referencedColumns: ["id"];
            }];
        };
        pos_receipts: {
            Row: {
                created_at: string;
                id: string;
                last_print_attempt: string | null;
                print_attempts: number | null;
                print_status: string;
                receipt_data: import("../types/database").Json;
                receipt_number: string;
                transaction_id: string;
            };
            Insert: {
                created_at?: string;
                id?: string;
                last_print_attempt?: string | null;
                print_attempts?: number | null;
                print_status?: string;
                receipt_data: import("../types/database").Json;
                receipt_number: string;
                transaction_id: string;
            };
            Update: {
                created_at?: string;
                id?: string;
                last_print_attempt?: string | null;
                print_attempts?: number | null;
                print_status?: string;
                receipt_data?: import("../types/database").Json;
                receipt_number?: string;
                transaction_id?: string;
            };
            Relationships: [{
                foreignKeyName: "pos_receipts_transaction_id_fkey";
                columns: ["transaction_id"];
                isOneToOne: false;
                referencedRelation: "pos_transaction_summary_view";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "pos_receipts_transaction_id_fkey";
                columns: ["transaction_id"];
                isOneToOne: false;
                referencedRelation: "pos_transactions";
                referencedColumns: ["id"];
            }];
        };
        pos_sessions: {
            Row: {
                cash_difference: number | null;
                created_at: string;
                current_cash_amount: number;
                end_cash_amount: number | null;
                end_time: string | null;
                id: string;
                location_id: string;
                notes: string | null;
                operator_id: string;
                previous_cash_amount: number;
                start_time: string;
                status: string;
                updated_at: string;
            };
            Insert: {
                cash_difference?: number | null;
                created_at?: string;
                current_cash_amount: number;
                end_cash_amount?: number | null;
                end_time?: string | null;
                id?: string;
                location_id: string;
                notes?: string | null;
                operator_id: string;
                previous_cash_amount: number;
                start_time?: string;
                status?: string;
                updated_at?: string;
            };
            Update: {
                cash_difference?: number | null;
                created_at?: string;
                current_cash_amount?: number;
                end_cash_amount?: number | null;
                end_time?: string | null;
                id?: string;
                location_id?: string;
                notes?: string | null;
                operator_id?: string;
                previous_cash_amount?: number;
                start_time?: string;
                status?: string;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "pos_sessions_location_id_fkey";
                columns: ["location_id"];
                isOneToOne: false;
                referencedRelation: "locations";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "pos_sessions_location_id_fkey";
                columns: ["location_id"];
                isOneToOne: false;
                referencedRelation: "parking_hierarchy_view";
                referencedColumns: ["location_id"];
            }, {
                foreignKeyName: "pos_sessions_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        pos_shift_reports: {
            Row: {
                cash_over_short: number;
                created_at: string;
                generated_at: string;
                id: string;
                parking_sessions_created: number;
                report_data: import("../types/database").Json;
                session_id: string;
                total_cash_collected: number;
                total_discounts_given: number;
                total_transactions: number;
                total_vat_collected: number;
                violations_reported: number;
            };
            Insert: {
                cash_over_short?: number;
                created_at?: string;
                generated_at?: string;
                id?: string;
                parking_sessions_created?: number;
                report_data?: import("../types/database").Json;
                session_id: string;
                total_cash_collected?: number;
                total_discounts_given?: number;
                total_transactions?: number;
                total_vat_collected?: number;
                violations_reported?: number;
            };
            Update: {
                cash_over_short?: number;
                created_at?: string;
                generated_at?: string;
                id?: string;
                parking_sessions_created?: number;
                report_data?: import("../types/database").Json;
                session_id?: string;
                total_cash_collected?: number;
                total_discounts_given?: number;
                total_transactions?: number;
                total_vat_collected?: number;
                violations_reported?: number;
            };
            Relationships: [{
                foreignKeyName: "pos_shift_reports_session_id_fkey";
                columns: ["session_id"];
                isOneToOne: false;
                referencedRelation: "active_pos_sessions_view";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "pos_shift_reports_session_id_fkey";
                columns: ["session_id"];
                isOneToOne: false;
                referencedRelation: "pos_sessions";
                referencedColumns: ["id"];
            }];
        };
        pos_transactions: {
            Row: {
                amount: number;
                change_amount: number | null;
                created_at: string;
                description: string;
                discount_type: string | null;
                id: string;
                metadata: import("../types/database").Json | null;
                parking_session_id: string | null;
                payment_method: string;
                receipt_number: string;
                session_id: string;
                type: string;
                vat_amount: number | null;
                vehicle_plate_number: string | null;
            };
            Insert: {
                amount: number;
                change_amount?: number | null;
                created_at?: string;
                description: string;
                discount_type?: string | null;
                id?: string;
                metadata?: import("../types/database").Json | null;
                parking_session_id?: string | null;
                payment_method?: string;
                receipt_number: string;
                session_id: string;
                type: string;
                vat_amount?: number | null;
                vehicle_plate_number?: string | null;
            };
            Update: {
                amount?: number;
                change_amount?: number | null;
                created_at?: string;
                description?: string;
                discount_type?: string | null;
                id?: string;
                metadata?: import("../types/database").Json | null;
                parking_session_id?: string | null;
                payment_method?: string;
                receipt_number?: string;
                session_id?: string;
                type?: string;
                vat_amount?: number | null;
                vehicle_plate_number?: string | null;
            };
            Relationships: [{
                foreignKeyName: "pos_transactions_parking_session_id_fkey";
                columns: ["parking_session_id"];
                isOneToOne: false;
                referencedRelation: "active_bookings_view";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "pos_transactions_parking_session_id_fkey";
                columns: ["parking_session_id"];
                isOneToOne: false;
                referencedRelation: "bookings";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "pos_transactions_session_id_fkey";
                columns: ["session_id"];
                isOneToOne: false;
                referencedRelation: "active_pos_sessions_view";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "pos_transactions_session_id_fkey";
                columns: ["session_id"];
                isOneToOne: false;
                referencedRelation: "pos_sessions";
                referencedColumns: ["id"];
            }];
        };
        rating_aggregates: {
            Row: {
                average_score: number;
                created_at: string;
                id: string;
                rated_id: string;
                rated_type: Database["public"]["Enums"]["rated_type"];
                score_distribution: import("../types/database").Json;
                total_ratings: number;
                updated_at: string;
            };
            Insert: {
                average_score?: number;
                created_at?: string;
                id?: string;
                rated_id: string;
                rated_type: Database["public"]["Enums"]["rated_type"];
                score_distribution?: import("../types/database").Json;
                total_ratings?: number;
                updated_at?: string;
            };
            Update: {
                average_score?: number;
                created_at?: string;
                id?: string;
                rated_id?: string;
                rated_type?: Database["public"]["Enums"]["rated_type"];
                score_distribution?: import("../types/database").Json;
                total_ratings?: number;
                updated_at?: string;
            };
            Relationships: [];
        };
        ratings: {
            Row: {
                booking_id: string;
                created_at: string;
                id: string;
                is_verified: boolean | null;
                moderated_at: string | null;
                moderation_reason: string | null;
                photos: string[] | null;
                rated_id: string;
                rated_type: Database["public"]["Enums"]["rated_type"];
                rater_id: string;
                review: string | null;
                score: number;
                status: string | null;
                updated_at: string | null;
                verified_at: string | null;
            };
            Insert: {
                booking_id: string;
                created_at?: string;
                id?: string;
                is_verified?: boolean | null;
                moderated_at?: string | null;
                moderation_reason?: string | null;
                photos?: string[] | null;
                rated_id: string;
                rated_type: Database["public"]["Enums"]["rated_type"];
                rater_id: string;
                review?: string | null;
                score: number;
                status?: string | null;
                updated_at?: string | null;
                verified_at?: string | null;
            };
            Update: {
                booking_id?: string;
                created_at?: string;
                id?: string;
                is_verified?: boolean | null;
                moderated_at?: string | null;
                moderation_reason?: string | null;
                photos?: string[] | null;
                rated_id?: string;
                rated_type?: Database["public"]["Enums"]["rated_type"];
                rater_id?: string;
                review?: string | null;
                score?: number;
                status?: string | null;
                updated_at?: string | null;
                verified_at?: string | null;
            };
            Relationships: [{
                foreignKeyName: "ratings_booking_id_fkey";
                columns: ["booking_id"];
                isOneToOne: false;
                referencedRelation: "active_bookings_view";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "ratings_booking_id_fkey";
                columns: ["booking_id"];
                isOneToOne: false;
                referencedRelation: "bookings";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "ratings_rated_id_fkey";
                columns: ["rated_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "ratings_rater_id_fkey";
                columns: ["rater_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        reconciliation_results: {
            Row: {
                corrected_count: number;
                created_at: string;
                discrepancy_count: number;
                end_date: string;
                id: string;
                passed: boolean;
                rule_id: string;
                rule_name: string;
                start_date: string;
            };
            Insert: {
                corrected_count?: number;
                created_at?: string;
                discrepancy_count?: number;
                end_date: string;
                id: string;
                passed: boolean;
                rule_id: string;
                rule_name: string;
                start_date: string;
            };
            Update: {
                corrected_count?: number;
                created_at?: string;
                discrepancy_count?: number;
                end_date?: string;
                id?: string;
                passed?: boolean;
                rule_id?: string;
                rule_name?: string;
                start_date?: string;
            };
            Relationships: [{
                foreignKeyName: "reconciliation_results_rule_id_fkey";
                columns: ["rule_id"];
                isOneToOne: false;
                referencedRelation: "reconciliation_rules";
                referencedColumns: ["id"];
            }];
        };
        reconciliation_rules: {
            Row: {
                actions: import("../types/database").Json;
                conditions: import("../types/database").Json;
                created_at: string;
                description: string | null;
                id: string;
                is_active: boolean;
                name: string;
                rule_type: Database["public"]["Enums"]["reconciliation_rule_type"];
                updated_at: string;
            };
            Insert: {
                actions?: import("../types/database").Json;
                conditions?: import("../types/database").Json;
                created_at?: string;
                description?: string | null;
                id: string;
                is_active?: boolean;
                name: string;
                rule_type: Database["public"]["Enums"]["reconciliation_rule_type"];
                updated_at?: string;
            };
            Update: {
                actions?: import("../types/database").Json;
                conditions?: import("../types/database").Json;
                created_at?: string;
                description?: string | null;
                id?: string;
                is_active?: boolean;
                name?: string;
                rule_type?: Database["public"]["Enums"]["reconciliation_rule_type"];
                updated_at?: string;
            };
            Relationships: [];
        };
        remittance_runs: {
            Row: {
                amount: number;
                completed_at: string | null;
                created_at: string;
                error_message: string | null;
                failed_at: string | null;
                id: string;
                payout_id: string | null;
                recipient_id: string;
                recipient_type: string;
                run_date: string;
                schedule_id: string;
                status: Database["public"]["Enums"]["remittance_status"];
                transaction_ids: string[];
            };
            Insert: {
                amount: number;
                completed_at?: string | null;
                created_at?: string;
                error_message?: string | null;
                failed_at?: string | null;
                id: string;
                payout_id?: string | null;
                recipient_id: string;
                recipient_type: string;
                run_date?: string;
                schedule_id: string;
                status?: Database["public"]["Enums"]["remittance_status"];
                transaction_ids?: string[];
            };
            Update: {
                amount?: number;
                completed_at?: string | null;
                created_at?: string;
                error_message?: string | null;
                failed_at?: string | null;
                id?: string;
                payout_id?: string | null;
                recipient_id?: string;
                recipient_type?: string;
                run_date?: string;
                schedule_id?: string;
                status?: Database["public"]["Enums"]["remittance_status"];
                transaction_ids?: string[];
            };
            Relationships: [{
                foreignKeyName: "remittance_runs_payout_id_fkey";
                columns: ["payout_id"];
                isOneToOne: false;
                referencedRelation: "payouts";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "remittance_runs_recipient_id_fkey";
                columns: ["recipient_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "remittance_runs_schedule_id_fkey";
                columns: ["schedule_id"];
                isOneToOne: false;
                referencedRelation: "remittance_schedules";
                referencedColumns: ["id"];
            }];
        };
        remittance_schedules: {
            Row: {
                bank_account_id: string;
                created_at: string;
                frequency: Database["public"]["Enums"]["remittance_frequency"];
                id: string;
                is_active: boolean;
                last_run_date: string | null;
                minimum_amount: number;
                next_run_date: string;
                recipient_id: string;
                recipient_type: string;
                updated_at: string;
            };
            Insert: {
                bank_account_id: string;
                created_at?: string;
                frequency: Database["public"]["Enums"]["remittance_frequency"];
                id: string;
                is_active?: boolean;
                last_run_date?: string | null;
                minimum_amount?: number;
                next_run_date: string;
                recipient_id: string;
                recipient_type: string;
                updated_at?: string;
            };
            Update: {
                bank_account_id?: string;
                created_at?: string;
                frequency?: Database["public"]["Enums"]["remittance_frequency"];
                id?: string;
                is_active?: boolean;
                last_run_date?: string | null;
                minimum_amount?: number;
                next_run_date?: string;
                recipient_id?: string;
                recipient_type?: string;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "remittance_schedules_bank_account_id_fkey";
                columns: ["bank_account_id"];
                isOneToOne: false;
                referencedRelation: "bank_accounts";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "remittance_schedules_recipient_id_fkey";
                columns: ["recipient_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        report_exports: {
            Row: {
                download_url: string | null;
                expires_at: string | null;
                exported_at: string | null;
                exported_by: string | null;
                file_name: string;
                file_size: number | null;
                format: string;
                id: string;
                report_id: string;
            };
            Insert: {
                download_url?: string | null;
                expires_at?: string | null;
                exported_at?: string | null;
                exported_by?: string | null;
                file_name: string;
                file_size?: number | null;
                format: string;
                id?: string;
                report_id: string;
            };
            Update: {
                download_url?: string | null;
                expires_at?: string | null;
                exported_at?: string | null;
                exported_by?: string | null;
                file_name?: string;
                file_size?: number | null;
                format?: string;
                id?: string;
                report_id?: string;
            };
            Relationships: [];
        };
        reputation_scores: {
            Row: {
                average_score: number;
                created_at: string;
                id: string;
                reputation_level: string;
                total_ratings: number;
                trust_score: number;
                updated_at: string;
                user_id: string;
                user_type: Database["public"]["Enums"]["user_type"];
                verification_badges: string[] | null;
            };
            Insert: {
                average_score?: number;
                created_at?: string;
                id?: string;
                reputation_level?: string;
                total_ratings?: number;
                trust_score?: number;
                updated_at?: string;
                user_id: string;
                user_type: Database["public"]["Enums"]["user_type"];
                verification_badges?: string[] | null;
            };
            Update: {
                average_score?: number;
                created_at?: string;
                id?: string;
                reputation_level?: string;
                total_ratings?: number;
                trust_score?: number;
                updated_at?: string;
                user_id?: string;
                user_type?: Database["public"]["Enums"]["user_type"];
                verification_badges?: string[] | null;
            };
            Relationships: [{
                foreignKeyName: "reputation_scores_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        revenue_share_configs: {
            Row: {
                created_at: string;
                host_percentage: number | null;
                operator_percentage: number | null;
                park_angel_percentage: number;
                parking_type: Database["public"]["Enums"]["parking_type"];
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                host_percentage?: number | null;
                operator_percentage?: number | null;
                park_angel_percentage: number;
                parking_type: Database["public"]["Enums"]["parking_type"];
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                host_percentage?: number | null;
                operator_percentage?: number | null;
                park_angel_percentage?: number;
                parking_type?: Database["public"]["Enums"]["parking_type"];
                updated_at?: string;
            };
            Relationships: [];
        };
        revenue_shares: {
            Row: {
                booking_id: string;
                calculated_at: string;
                created_at: string;
                gross_amount: number;
                host_id: string | null;
                host_share: number | null;
                id: string;
                net_amount: number;
                operator_id: string;
                operator_share: number;
                park_angel_share: number;
                platform_fee: number;
                share_percentage: number;
                total_amount: number;
                transaction_id: string | null;
            };
            Insert: {
                booking_id: string;
                calculated_at?: string;
                created_at?: string;
                gross_amount: number;
                host_id?: string | null;
                host_share?: number | null;
                id?: string;
                net_amount: number;
                operator_id: string;
                operator_share: number;
                park_angel_share?: number;
                platform_fee: number;
                share_percentage: number;
                total_amount?: number;
                transaction_id?: string | null;
            };
            Update: {
                booking_id?: string;
                calculated_at?: string;
                created_at?: string;
                gross_amount?: number;
                host_id?: string | null;
                host_share?: number | null;
                id?: string;
                net_amount?: number;
                operator_id?: string;
                operator_share?: number;
                park_angel_share?: number;
                platform_fee?: number;
                share_percentage?: number;
                total_amount?: number;
                transaction_id?: string | null;
            };
            Relationships: [{
                foreignKeyName: "revenue_shares_booking_id_fkey";
                columns: ["booking_id"];
                isOneToOne: false;
                referencedRelation: "active_bookings_view";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "revenue_shares_booking_id_fkey";
                columns: ["booking_id"];
                isOneToOne: false;
                referencedRelation: "bookings";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "revenue_shares_host_id_fkey";
                columns: ["host_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "revenue_shares_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        review_moderation_queue: {
            Row: {
                created_at: string;
                id: string;
                moderator_id: string | null;
                moderator_notes: string | null;
                rating_id: string;
                report_details: string | null;
                report_reason: string;
                reported_by: string | null;
                status: string;
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                id?: string;
                moderator_id?: string | null;
                moderator_notes?: string | null;
                rating_id: string;
                report_details?: string | null;
                report_reason: string;
                reported_by?: string | null;
                status?: string;
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                id?: string;
                moderator_id?: string | null;
                moderator_notes?: string | null;
                rating_id?: string;
                report_details?: string | null;
                report_reason?: string;
                reported_by?: string | null;
                status?: string;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "review_moderation_queue_moderator_id_fkey";
                columns: ["moderator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "review_moderation_queue_rating_id_fkey";
                columns: ["rating_id"];
                isOneToOne: false;
                referencedRelation: "ratings";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "review_moderation_queue_reported_by_fkey";
                columns: ["reported_by"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        scheduled_reports: {
            Row: {
                created_at: string | null;
                created_by: string | null;
                id: string;
                is_active: boolean | null;
                last_run: string | null;
                name: string;
                next_run: string;
                parameters: import("../types/database").Json;
                recipients: string[];
                report_type_id: string;
                schedule: import("../types/database").Json;
                updated_at: string | null;
            };
            Insert: {
                created_at?: string | null;
                created_by?: string | null;
                id: string;
                is_active?: boolean | null;
                last_run?: string | null;
                name: string;
                next_run: string;
                parameters?: import("../types/database").Json;
                recipients?: string[];
                report_type_id: string;
                schedule: import("../types/database").Json;
                updated_at?: string | null;
            };
            Update: {
                created_at?: string | null;
                created_by?: string | null;
                id?: string;
                is_active?: boolean | null;
                last_run?: string | null;
                name?: string;
                next_run?: string;
                parameters?: import("../types/database").Json;
                recipients?: string[];
                report_type_id?: string;
                schedule?: import("../types/database").Json;
                updated_at?: string | null;
            };
            Relationships: [];
        };
        sections: {
            Row: {
                created_at: string;
                id: string;
                location_id: string;
                name: string;
                pricing_config: import("../types/database").Json | null;
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                id?: string;
                location_id: string;
                name: string;
                pricing_config?: import("../types/database").Json | null;
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                id?: string;
                location_id?: string;
                name?: string;
                pricing_config?: import("../types/database").Json | null;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "sections_location_id_fkey";
                columns: ["location_id"];
                isOneToOne: false;
                referencedRelation: "locations";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "sections_location_id_fkey";
                columns: ["location_id"];
                isOneToOne: false;
                referencedRelation: "parking_hierarchy_view";
                referencedColumns: ["location_id"];
            }];
        };
        sla_targets: {
            Row: {
                alert_threshold: number;
                created_at: string | null;
                escalation_rules: import("../types/database").Json | null;
                feature: string;
                id: string;
                target_response_time: number;
                updated_at: string | null;
            };
            Insert: {
                alert_threshold: number;
                created_at?: string | null;
                escalation_rules?: import("../types/database").Json | null;
                feature: string;
                id?: string;
                target_response_time: number;
                updated_at?: string | null;
            };
            Update: {
                alert_threshold?: number;
                created_at?: string | null;
                escalation_rules?: import("../types/database").Json | null;
                feature?: string;
                id?: string;
                target_response_time?: number;
                updated_at?: string | null;
            };
            Relationships: [];
        };
        social_proof: {
            Row: {
                created_at: string;
                entity_id: string;
                entity_type: string;
                expires_at: string | null;
                id: string;
                is_active: boolean;
                proof_data: import("../types/database").Json;
                proof_type: string;
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                entity_id: string;
                entity_type: string;
                expires_at?: string | null;
                id?: string;
                is_active?: boolean;
                proof_data?: import("../types/database").Json;
                proof_type: string;
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                entity_id?: string;
                entity_type?: string;
                expires_at?: string | null;
                id?: string;
                is_active?: boolean;
                proof_data?: import("../types/database").Json;
                proof_type?: string;
                updated_at?: string;
            };
            Relationships: [];
        };
        support_messages: {
            Row: {
                created_at: string | null;
                id: string;
                message: string;
                message_type: string | null;
                read_at: string | null;
                sender_id: string;
                sender_type: string;
                ticket_id: string;
            };
            Insert: {
                created_at?: string | null;
                id?: string;
                message: string;
                message_type?: string | null;
                read_at?: string | null;
                sender_id: string;
                sender_type: string;
                ticket_id: string;
            };
            Update: {
                created_at?: string | null;
                id?: string;
                message?: string;
                message_type?: string | null;
                read_at?: string | null;
                sender_id?: string;
                sender_type?: string;
                ticket_id?: string;
            };
            Relationships: [{
                foreignKeyName: "support_messages_ticket_id_fkey";
                columns: ["ticket_id"];
                isOneToOne: false;
                referencedRelation: "support_tickets";
                referencedColumns: ["id"];
            }];
        };
        support_tickets: {
            Row: {
                category: string | null;
                created_at: string | null;
                id: string;
                last_message_at: string | null;
                priority: string | null;
                status: string | null;
                subject: string;
                updated_at: string | null;
                user_id: string;
            };
            Insert: {
                category?: string | null;
                created_at?: string | null;
                id?: string;
                last_message_at?: string | null;
                priority?: string | null;
                status?: string | null;
                subject: string;
                updated_at?: string | null;
                user_id: string;
            };
            Update: {
                category?: string | null;
                created_at?: string | null;
                id?: string;
                last_message_at?: string | null;
                priority?: string | null;
                status?: string | null;
                subject?: string;
                updated_at?: string | null;
                user_id?: string;
            };
            Relationships: [];
        };
        system_config: {
            Row: {
                created_at: string;
                description: string | null;
                id: string;
                is_public: boolean;
                key: string;
                updated_at: string;
                updated_by: string | null;
                value: import("../types/database").Json;
            };
            Insert: {
                created_at?: string;
                description?: string | null;
                id?: string;
                is_public?: boolean;
                key: string;
                updated_at?: string;
                updated_by?: string | null;
                value: import("../types/database").Json;
            };
            Update: {
                created_at?: string;
                description?: string | null;
                id?: string;
                is_public?: boolean;
                key?: string;
                updated_at?: string;
                updated_by?: string | null;
                value?: import("../types/database").Json;
            };
            Relationships: [{
                foreignKeyName: "system_config_updated_by_fkey";
                columns: ["updated_by"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        transaction_logs: {
            Row: {
                amount: number;
                booking_id: string;
                created_at: string;
                currency: string;
                id: string;
                metadata: import("../types/database").Json | null;
                payment_method: string | null;
                payment_reference: string | null;
                processed_at: string | null;
                status: string;
                transaction_type: string;
            };
            Insert: {
                amount: number;
                booking_id: string;
                created_at?: string;
                currency?: string;
                id?: string;
                metadata?: import("../types/database").Json | null;
                payment_method?: string | null;
                payment_reference?: string | null;
                processed_at?: string | null;
                status?: string;
                transaction_type: string;
            };
            Update: {
                amount?: number;
                booking_id?: string;
                created_at?: string;
                currency?: string;
                id?: string;
                metadata?: import("../types/database").Json | null;
                payment_method?: string | null;
                payment_reference?: string | null;
                processed_at?: string | null;
                status?: string;
                transaction_type?: string;
            };
            Relationships: [{
                foreignKeyName: "transaction_logs_booking_id_fkey";
                columns: ["booking_id"];
                isOneToOne: false;
                referencedRelation: "active_bookings_view";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "transaction_logs_booking_id_fkey";
                columns: ["booking_id"];
                isOneToOne: false;
                referencedRelation: "bookings";
                referencedColumns: ["id"];
            }];
        };
        transactions: {
            Row: {
                amount: number;
                booking_id: string | null;
                created_at: string | null;
                discount_amount: number | null;
                id: string;
                payment_method: string;
                payment_reference: string | null;
                payment_status: string | null;
                total_amount: number;
                transaction_type: string | null;
                updated_at: string | null;
                user_id: string;
                vat_amount: number | null;
            };
            Insert: {
                amount: number;
                booking_id?: string | null;
                created_at?: string | null;
                discount_amount?: number | null;
                id?: string;
                payment_method: string;
                payment_reference?: string | null;
                payment_status?: string | null;
                total_amount: number;
                transaction_type?: string | null;
                updated_at?: string | null;
                user_id: string;
                vat_amount?: number | null;
            };
            Update: {
                amount?: number;
                booking_id?: string | null;
                created_at?: string | null;
                discount_amount?: number | null;
                id?: string;
                payment_method?: string;
                payment_reference?: string | null;
                payment_status?: string | null;
                total_amount?: number;
                transaction_type?: string | null;
                updated_at?: string | null;
                user_id?: string;
                vat_amount?: number | null;
            };
            Relationships: [{
                foreignKeyName: "transactions_booking_id_fkey";
                columns: ["booking_id"];
                isOneToOne: false;
                referencedRelation: "active_bookings_view";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "transactions_booking_id_fkey";
                columns: ["booking_id"];
                isOneToOne: false;
                referencedRelation: "bookings";
                referencedColumns: ["id"];
            }];
        };
        user_ai_preferences: {
            Row: {
                accessibility_required: boolean | null;
                avoid_locations: string[] | null;
                covered_parking_preferred: boolean | null;
                created_at: string | null;
                enable_ai_suggestions: boolean | null;
                flexible_timing: boolean | null;
                frequently_visited_locations: string[] | null;
                id: string;
                learning_enabled: boolean | null;
                max_walking_distance: number | null;
                notification_for_suggestions: boolean | null;
                preferred_amenities: string[] | null;
                preferred_booking_lead_time: number | null;
                preferred_parking_types: string[] | null;
                preferred_vehicle_id: string | null;
                price_sensitivity: string | null;
                security_level_preference: string | null;
                updated_at: string | null;
                user_id: string;
            };
            Insert: {
                accessibility_required?: boolean | null;
                avoid_locations?: string[] | null;
                covered_parking_preferred?: boolean | null;
                created_at?: string | null;
                enable_ai_suggestions?: boolean | null;
                flexible_timing?: boolean | null;
                frequently_visited_locations?: string[] | null;
                id?: string;
                learning_enabled?: boolean | null;
                max_walking_distance?: number | null;
                notification_for_suggestions?: boolean | null;
                preferred_amenities?: string[] | null;
                preferred_booking_lead_time?: number | null;
                preferred_parking_types?: string[] | null;
                preferred_vehicle_id?: string | null;
                price_sensitivity?: string | null;
                security_level_preference?: string | null;
                updated_at?: string | null;
                user_id: string;
            };
            Update: {
                accessibility_required?: boolean | null;
                avoid_locations?: string[] | null;
                covered_parking_preferred?: boolean | null;
                created_at?: string | null;
                enable_ai_suggestions?: boolean | null;
                flexible_timing?: boolean | null;
                frequently_visited_locations?: string[] | null;
                id?: string;
                learning_enabled?: boolean | null;
                max_walking_distance?: number | null;
                notification_for_suggestions?: boolean | null;
                preferred_amenities?: string[] | null;
                preferred_booking_lead_time?: number | null;
                preferred_parking_types?: string[] | null;
                preferred_vehicle_id?: string | null;
                price_sensitivity?: string | null;
                security_level_preference?: string | null;
                updated_at?: string | null;
                user_id?: string;
            };
            Relationships: [{
                foreignKeyName: "user_ai_preferences_preferred_vehicle_id_fkey";
                columns: ["preferred_vehicle_id"];
                isOneToOne: false;
                referencedRelation: "user_vehicles";
                referencedColumns: ["id"];
            }];
        };
        user_group_memberships: {
            Row: {
                created_at: string;
                group_id: string;
                id: string;
                user_id: string;
            };
            Insert: {
                created_at?: string;
                group_id: string;
                id?: string;
                user_id: string;
            };
            Update: {
                created_at?: string;
                group_id?: string;
                id?: string;
                user_id?: string;
            };
            Relationships: [{
                foreignKeyName: "user_group_memberships_group_id_fkey";
                columns: ["group_id"];
                isOneToOne: false;
                referencedRelation: "user_groups";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "user_group_memberships_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        user_groups: {
            Row: {
                created_at: string;
                description: string | null;
                id: string;
                name: string;
                operator_id: string | null;
                permissions: import("../types/database").Json;
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                description?: string | null;
                id?: string;
                name: string;
                operator_id?: string | null;
                permissions?: import("../types/database").Json;
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                description?: string | null;
                id?: string;
                name?: string;
                operator_id?: string | null;
                permissions?: import("../types/database").Json;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "user_groups_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        user_notification_preferences: {
            Row: {
                booking_cancellations: boolean | null;
                booking_confirmations: boolean | null;
                booking_modifications: boolean | null;
                created_at: string | null;
                email_notifications: boolean | null;
                feature_updates: boolean | null;
                host_booking_requests: boolean | null;
                host_guest_messages: boolean | null;
                host_payment_notifications: boolean | null;
                id: string;
                newsletter: boolean | null;
                parking_expiration_alerts: boolean | null;
                parking_expiration_minutes: number | null;
                parking_reminder_minutes: number | null;
                parking_reminders: boolean | null;
                payment_confirmations: boolean | null;
                payment_failures: boolean | null;
                promotional_offers: boolean | null;
                push_notifications: boolean | null;
                quiet_hours_enabled: boolean | null;
                quiet_hours_end: string | null;
                quiet_hours_start: string | null;
                refund_notifications: boolean | null;
                security_alerts: boolean | null;
                sms_notifications: boolean | null;
                support_messages: boolean | null;
                support_ticket_updates: boolean | null;
                system_maintenance: boolean | null;
                updated_at: string | null;
                user_id: string;
            };
            Insert: {
                booking_cancellations?: boolean | null;
                booking_confirmations?: boolean | null;
                booking_modifications?: boolean | null;
                created_at?: string | null;
                email_notifications?: boolean | null;
                feature_updates?: boolean | null;
                host_booking_requests?: boolean | null;
                host_guest_messages?: boolean | null;
                host_payment_notifications?: boolean | null;
                id?: string;
                newsletter?: boolean | null;
                parking_expiration_alerts?: boolean | null;
                parking_expiration_minutes?: number | null;
                parking_reminder_minutes?: number | null;
                parking_reminders?: boolean | null;
                payment_confirmations?: boolean | null;
                payment_failures?: boolean | null;
                promotional_offers?: boolean | null;
                push_notifications?: boolean | null;
                quiet_hours_enabled?: boolean | null;
                quiet_hours_end?: string | null;
                quiet_hours_start?: string | null;
                refund_notifications?: boolean | null;
                security_alerts?: boolean | null;
                sms_notifications?: boolean | null;
                support_messages?: boolean | null;
                support_ticket_updates?: boolean | null;
                system_maintenance?: boolean | null;
                updated_at?: string | null;
                user_id: string;
            };
            Update: {
                booking_cancellations?: boolean | null;
                booking_confirmations?: boolean | null;
                booking_modifications?: boolean | null;
                created_at?: string | null;
                email_notifications?: boolean | null;
                feature_updates?: boolean | null;
                host_booking_requests?: boolean | null;
                host_guest_messages?: boolean | null;
                host_payment_notifications?: boolean | null;
                id?: string;
                newsletter?: boolean | null;
                parking_expiration_alerts?: boolean | null;
                parking_expiration_minutes?: number | null;
                parking_reminder_minutes?: number | null;
                parking_reminders?: boolean | null;
                payment_confirmations?: boolean | null;
                payment_failures?: boolean | null;
                promotional_offers?: boolean | null;
                push_notifications?: boolean | null;
                quiet_hours_enabled?: boolean | null;
                quiet_hours_end?: string | null;
                quiet_hours_start?: string | null;
                refund_notifications?: boolean | null;
                security_alerts?: boolean | null;
                sms_notifications?: boolean | null;
                support_messages?: boolean | null;
                support_ticket_updates?: boolean | null;
                system_maintenance?: boolean | null;
                updated_at?: string | null;
                user_id?: string;
            };
            Relationships: [];
        };
        user_profiles: {
            Row: {
                address: string | null;
                avatar_url: string | null;
                created_at: string;
                date_of_birth: string | null;
                discount_eligibility: string[] | null;
                first_name: string;
                id: string;
                last_name: string;
                phone: string | null;
                updated_at: string;
                user_id: string;
            };
            Insert: {
                address?: string | null;
                avatar_url?: string | null;
                created_at?: string;
                date_of_birth?: string | null;
                discount_eligibility?: string[] | null;
                first_name: string;
                id?: string;
                last_name: string;
                phone?: string | null;
                updated_at?: string;
                user_id: string;
            };
            Update: {
                address?: string | null;
                avatar_url?: string | null;
                created_at?: string;
                date_of_birth?: string | null;
                discount_eligibility?: string[] | null;
                first_name?: string;
                id?: string;
                last_name?: string;
                phone?: string | null;
                updated_at?: string;
                user_id?: string;
            };
            Relationships: [{
                foreignKeyName: "user_profiles_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: true;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        user_sessions: {
            Row: {
                access_token_hash: string;
                created_at: string;
                device_id: string | null;
                end_reason: string | null;
                ended_at: string | null;
                expires_at: string;
                id: string;
                ip_address: unknown | null;
                is_active: boolean;
                last_activity: string;
                metadata: import("../types/database").Json | null;
                refresh_token_hash: string | null;
                user_agent: string | null;
                user_id: string;
            };
            Insert: {
                access_token_hash: string;
                created_at?: string;
                device_id?: string | null;
                end_reason?: string | null;
                ended_at?: string | null;
                expires_at: string;
                id: string;
                ip_address?: unknown | null;
                is_active?: boolean;
                last_activity?: string;
                metadata?: import("../types/database").Json | null;
                refresh_token_hash?: string | null;
                user_agent?: string | null;
                user_id: string;
            };
            Update: {
                access_token_hash?: string;
                created_at?: string;
                device_id?: string | null;
                end_reason?: string | null;
                ended_at?: string | null;
                expires_at?: string;
                id?: string;
                ip_address?: unknown | null;
                is_active?: boolean;
                last_activity?: string;
                metadata?: import("../types/database").Json | null;
                refresh_token_hash?: string | null;
                user_agent?: string | null;
                user_id?: string;
            };
            Relationships: [{
                foreignKeyName: "user_sessions_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        user_vehicles: {
            Row: {
                brand: string;
                color: string;
                created_at: string | null;
                id: string;
                is_default: boolean | null;
                model: string;
                plate_number: string;
                type: string;
                updated_at: string | null;
                user_id: string;
                year: number;
            };
            Insert: {
                brand: string;
                color: string;
                created_at?: string | null;
                id?: string;
                is_default?: boolean | null;
                model: string;
                plate_number: string;
                type: string;
                updated_at?: string | null;
                user_id: string;
                year: number;
            };
            Update: {
                brand?: string;
                color?: string;
                created_at?: string | null;
                id?: string;
                is_default?: boolean | null;
                model?: string;
                plate_number?: string;
                type?: string;
                updated_at?: string | null;
                user_id?: string;
                year?: number;
            };
            Relationships: [];
        };
        users: {
            Row: {
                created_at: string;
                email: string;
                id: string;
                operator_id: string | null;
                status: Database["public"]["Enums"]["user_status"];
                updated_at: string;
                user_type: Database["public"]["Enums"]["user_type"];
            };
            Insert: {
                created_at?: string;
                email: string;
                id: string;
                operator_id?: string | null;
                status?: Database["public"]["Enums"]["user_status"];
                updated_at?: string;
                user_type?: Database["public"]["Enums"]["user_type"];
            };
            Update: {
                created_at?: string;
                email?: string;
                id?: string;
                operator_id?: string | null;
                status?: Database["public"]["Enums"]["user_status"];
                updated_at?: string;
                user_type?: Database["public"]["Enums"]["user_type"];
            };
            Relationships: [{
                foreignKeyName: "users_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        vat_config: {
            Row: {
                created_at: string;
                id: string;
                is_active: boolean;
                is_default: boolean;
                name: string;
                operator_id: string | null;
                rate: number;
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                id?: string;
                is_active?: boolean;
                is_default?: boolean;
                name: string;
                operator_id?: string | null;
                rate: number;
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                id?: string;
                is_active?: boolean;
                is_default?: boolean;
                name?: string;
                operator_id?: string | null;
                rate?: number;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "vat_config_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        vehicle_brands: {
            Row: {
                created_at: string;
                id: string;
                is_active: boolean;
                name: string;
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                id?: string;
                is_active?: boolean;
                name: string;
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                id?: string;
                is_active?: boolean;
                name?: string;
                updated_at?: string;
            };
            Relationships: [];
        };
        vehicle_colors: {
            Row: {
                created_at: string;
                hex_code: string | null;
                id: string;
                is_active: boolean;
                name: string;
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                hex_code?: string | null;
                id?: string;
                is_active?: boolean;
                name: string;
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                hex_code?: string | null;
                id?: string;
                is_active?: boolean;
                name?: string;
                updated_at?: string;
            };
            Relationships: [];
        };
        vehicle_models: {
            Row: {
                brand_id: string;
                created_at: string;
                id: string;
                is_active: boolean;
                name: string;
                updated_at: string;
                year: number | null;
            };
            Insert: {
                brand_id: string;
                created_at?: string;
                id?: string;
                is_active?: boolean;
                name: string;
                updated_at?: string;
                year?: number | null;
            };
            Update: {
                brand_id?: string;
                created_at?: string;
                id?: string;
                is_active?: boolean;
                name?: string;
                updated_at?: string;
                year?: number | null;
            };
            Relationships: [{
                foreignKeyName: "vehicle_models_brand_id_fkey";
                columns: ["brand_id"];
                isOneToOne: false;
                referencedRelation: "vehicle_brands";
                referencedColumns: ["id"];
            }];
        };
        vehicle_types: {
            Row: {
                created_at: string;
                description: string | null;
                id: string;
                is_active: boolean;
                name: string;
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                description?: string | null;
                id?: string;
                is_active?: boolean;
                name: string;
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                description?: string | null;
                id?: string;
                is_active?: boolean;
                name?: string;
                updated_at?: string;
            };
            Relationships: [];
        };
        vehicles: {
            Row: {
                brand: string;
                color: string;
                created_at: string;
                id: string;
                is_primary: boolean;
                model: string;
                plate_number: string;
                type: string;
                updated_at: string;
                user_id: string;
                year: number;
            };
            Insert: {
                brand: string;
                color: string;
                created_at?: string;
                id?: string;
                is_primary?: boolean;
                model: string;
                plate_number: string;
                type: string;
                updated_at?: string;
                user_id: string;
                year: number;
            };
            Update: {
                brand?: string;
                color?: string;
                created_at?: string;
                id?: string;
                is_primary?: boolean;
                model?: string;
                plate_number?: string;
                type?: string;
                updated_at?: string;
                user_id?: string;
                year?: number;
            };
            Relationships: [{
                foreignKeyName: "vehicles_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        verification_documents: {
            Row: {
                created_at: string;
                file_name: string;
                file_url: string;
                host_id: string;
                id: string;
                review_notes: string | null;
                reviewed_at: string | null;
                reviewed_by: string | null;
                status: string;
                type: string;
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                file_name: string;
                file_url: string;
                host_id: string;
                id?: string;
                review_notes?: string | null;
                reviewed_at?: string | null;
                reviewed_by?: string | null;
                status?: string;
                type: string;
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                file_name?: string;
                file_url?: string;
                host_id?: string;
                id?: string;
                review_notes?: string | null;
                reviewed_at?: string | null;
                reviewed_by?: string | null;
                status?: string;
                type?: string;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "verification_documents_host_id_fkey";
                columns: ["host_id"];
                isOneToOne: false;
                referencedRelation: "host_profiles";
                referencedColumns: ["id"];
            }];
        };
        violation_reports: {
            Row: {
                assigned_to: string | null;
                created_at: string;
                description: string | null;
                id: string;
                license_plate: string | null;
                location_id: string;
                photos: string[] | null;
                reported_by: string;
                resolution_notes: string | null;
                resolved_at: string | null;
                resolved_by: string | null;
                spot_id: string | null;
                status: string;
                updated_at: string;
                vehicle_plate: string | null;
                violation_type: string;
            };
            Insert: {
                assigned_to?: string | null;
                created_at?: string;
                description?: string | null;
                id?: string;
                license_plate?: string | null;
                location_id: string;
                photos?: string[] | null;
                reported_by: string;
                resolution_notes?: string | null;
                resolved_at?: string | null;
                resolved_by?: string | null;
                spot_id?: string | null;
                status?: string;
                updated_at?: string;
                vehicle_plate?: string | null;
                violation_type: string;
            };
            Update: {
                assigned_to?: string | null;
                created_at?: string;
                description?: string | null;
                id?: string;
                license_plate?: string | null;
                location_id?: string;
                photos?: string[] | null;
                reported_by?: string;
                resolution_notes?: string | null;
                resolved_at?: string | null;
                resolved_by?: string | null;
                spot_id?: string | null;
                status?: string;
                updated_at?: string;
                vehicle_plate?: string | null;
                violation_type?: string;
            };
            Relationships: [{
                foreignKeyName: "violation_reports_assigned_to_fkey";
                columns: ["assigned_to"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "violation_reports_location_id_fkey";
                columns: ["location_id"];
                isOneToOne: false;
                referencedRelation: "locations";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "violation_reports_location_id_fkey";
                columns: ["location_id"];
                isOneToOne: false;
                referencedRelation: "parking_hierarchy_view";
                referencedColumns: ["location_id"];
            }, {
                foreignKeyName: "violation_reports_reporter_id_fkey";
                columns: ["reported_by"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "violation_reports_spot_id_fkey";
                columns: ["spot_id"];
                isOneToOne: false;
                referencedRelation: "parking_hierarchy_view";
                referencedColumns: ["spot_id"];
            }, {
                foreignKeyName: "violation_reports_spot_id_fkey";
                columns: ["spot_id"];
                isOneToOne: false;
                referencedRelation: "parking_spots";
                referencedColumns: ["id"];
            }];
        };
        vip_assignments: {
            Row: {
                assigned_by: string;
                created_at: string;
                id: string;
                is_active: boolean;
                location_id: string | null;
                notes: string | null;
                operator_id: string;
                spot_ids: string[] | null;
                time_limit_minutes: number | null;
                updated_at: string;
                user_id: string;
                valid_from: string;
                valid_until: string | null;
                vip_type: string;
            };
            Insert: {
                assigned_by: string;
                created_at?: string;
                id?: string;
                is_active?: boolean;
                location_id?: string | null;
                notes?: string | null;
                operator_id: string;
                spot_ids?: string[] | null;
                time_limit_minutes?: number | null;
                updated_at?: string;
                user_id: string;
                valid_from?: string;
                valid_until?: string | null;
                vip_type: string;
            };
            Update: {
                assigned_by?: string;
                created_at?: string;
                id?: string;
                is_active?: boolean;
                location_id?: string | null;
                notes?: string | null;
                operator_id?: string;
                spot_ids?: string[] | null;
                time_limit_minutes?: number | null;
                updated_at?: string;
                user_id?: string;
                valid_from?: string;
                valid_until?: string | null;
                vip_type?: string;
            };
            Relationships: [{
                foreignKeyName: "vip_assignments_assigned_by_fkey";
                columns: ["assigned_by"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "vip_assignments_location_id_fkey";
                columns: ["location_id"];
                isOneToOne: false;
                referencedRelation: "locations";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "vip_assignments_location_id_fkey";
                columns: ["location_id"];
                isOneToOne: false;
                referencedRelation: "parking_hierarchy_view";
                referencedColumns: ["location_id"];
            }, {
                foreignKeyName: "vip_assignments_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "vip_assignments_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        zones: {
            Row: {
                created_at: string;
                id: string;
                name: string;
                pricing_config: import("../types/database").Json | null;
                section_id: string;
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                id?: string;
                name: string;
                pricing_config?: import("../types/database").Json | null;
                section_id: string;
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                id?: string;
                name?: string;
                pricing_config?: import("../types/database").Json | null;
                section_id?: string;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "zones_section_id_fkey";
                columns: ["section_id"];
                isOneToOne: false;
                referencedRelation: "parking_hierarchy_view";
                referencedColumns: ["section_id"];
            }, {
                foreignKeyName: "zones_section_id_fkey";
                columns: ["section_id"];
                isOneToOne: false;
                referencedRelation: "sections";
                referencedColumns: ["id"];
            }];
        };
    };
    Views: {
        active_bookings_view: {
            Row: {
                amount: number | null;
                created_at: string | null;
                discounts: import("../types/database").Json | null;
                end_time: string | null;
                first_name: string | null;
                id: string | null;
                last_name: string | null;
                location_name: string | null;
                payment_status: Database["public"]["Enums"]["payment_status"] | null;
                phone: string | null;
                plate_number: string | null;
                section_name: string | null;
                spot_id: string | null;
                spot_number: string | null;
                start_time: string | null;
                status: Database["public"]["Enums"]["booking_status"] | null;
                total_amount: number | null;
                updated_at: string | null;
                user_id: string | null;
                vat_amount: number | null;
                vehicle_id: string | null;
                vehicle_type: string | null;
                zone_name: string | null;
            };
            Relationships: [{
                foreignKeyName: "bookings_spot_id_fkey";
                columns: ["spot_id"];
                isOneToOne: false;
                referencedRelation: "parking_hierarchy_view";
                referencedColumns: ["spot_id"];
            }, {
                foreignKeyName: "bookings_spot_id_fkey";
                columns: ["spot_id"];
                isOneToOne: false;
                referencedRelation: "parking_spots";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "bookings_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "bookings_vehicle_id_fkey";
                columns: ["vehicle_id"];
                isOneToOne: false;
                referencedRelation: "vehicles";
                referencedColumns: ["id"];
            }];
        };
        active_pos_sessions_view: {
            Row: {
                cash_difference: number | null;
                created_at: string | null;
                current_cash_amount: number | null;
                end_cash_amount: number | null;
                end_time: string | null;
                first_name: string | null;
                id: string | null;
                last_name: string | null;
                location_address: import("../types/database").Json | null;
                location_id: string | null;
                location_name: string | null;
                notes: string | null;
                operator_id: string | null;
                phone: string | null;
                previous_cash_amount: number | null;
                start_time: string | null;
                status: string | null;
                total_amount: number | null;
                transaction_count: number | null;
                updated_at: string | null;
            };
            Relationships: [{
                foreignKeyName: "pos_sessions_location_id_fkey";
                columns: ["location_id"];
                isOneToOne: false;
                referencedRelation: "locations";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "pos_sessions_location_id_fkey";
                columns: ["location_id"];
                isOneToOne: false;
                referencedRelation: "parking_hierarchy_view";
                referencedColumns: ["location_id"];
            }, {
                foreignKeyName: "pos_sessions_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        parking_hierarchy_view: {
            Row: {
                effective_pricing: import("../types/database").Json | null;
                location_address: import("../types/database").Json | null;
                location_id: string | null;
                location_name: string | null;
                location_type: Database["public"]["Enums"]["parking_type"] | null;
                operator_id: string | null;
                section_id: string | null;
                section_name: string | null;
                spot_amenities: string[] | null;
                spot_coordinates: import("../types/database").Json | null;
                spot_id: string | null;
                spot_number: string | null;
                spot_status: Database["public"]["Enums"]["spot_status"] | null;
                spot_type: string | null;
                zone_id: string | null;
                zone_name: string | null;
            };
            Relationships: [{
                foreignKeyName: "locations_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        pos_transaction_summary_view: {
            Row: {
                amount: number | null;
                change_amount: number | null;
                created_at: string | null;
                description: string | null;
                discount_type: string | null;
                first_name: string | null;
                id: string | null;
                last_name: string | null;
                location_name: string | null;
                metadata: import("../types/database").Json | null;
                operator_id: string | null;
                parking_session_id: string | null;
                payment_method: string | null;
                print_status: string | null;
                receipt_number: string | null;
                session_id: string | null;
                type: string | null;
                vat_amount: number | null;
                vehicle_plate_number: string | null;
            };
            Relationships: [{
                foreignKeyName: "pos_sessions_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "pos_transactions_parking_session_id_fkey";
                columns: ["parking_session_id"];
                isOneToOne: false;
                referencedRelation: "active_bookings_view";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "pos_transactions_parking_session_id_fkey";
                columns: ["parking_session_id"];
                isOneToOne: false;
                referencedRelation: "bookings";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "pos_transactions_session_id_fkey";
                columns: ["session_id"];
                isOneToOne: false;
                referencedRelation: "active_pos_sessions_view";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "pos_transactions_session_id_fkey";
                columns: ["session_id"];
                isOneToOne: false;
                referencedRelation: "pos_sessions";
                referencedColumns: ["id"];
            }];
        };
        revenue_analytics_view: {
            Row: {
                avg_booking_value: number | null;
                booking_date: string | null;
                gross_revenue: number | null;
                net_revenue: number | null;
                operator_id: string | null;
                parking_type: Database["public"]["Enums"]["parking_type"] | null;
                total_bookings: number | null;
                total_vat: number | null;
            };
            Relationships: [{
                foreignKeyName: "locations_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
    };
    Functions: {
        calculate_next_remittance_date: {
            Args: {
                frequency: Database["public"]["Enums"]["remittance_frequency"];
                last_run_date?: string;
            };
            Returns: string;
        };
        calculate_next_run_time: {
            Args: {
                schedule_expr: string;
                last_run?: string;
            };
            Returns: string;
        };
        calculate_operator_performance: {
            Args: {
                operator_uuid: string;
                metric_date?: string;
            };
            Returns: undefined;
        };
        check_function_exists: {
            Args: {
                function_name: string;
            };
            Returns: boolean;
        };
        check_rls_enabled: {
            Args: {
                table_name: string;
            };
            Returns: boolean;
        };
        check_trigger_exists: {
            Args: {
                trigger_name: string;
                table_name: string;
            };
            Returns: boolean;
        };
        check_vip_parking_eligibility: {
            Args: {
                p_user_id: string;
                p_spot_id: string;
            };
            Returns: boolean;
        };
        cleanup_expired_exports: {
            Args: Record<PropertyKey, never>;
            Returns: undefined;
        };
        cleanup_old_reports: {
            Args: Record<PropertyKey, never>;
            Returns: number;
        };
        create_audit_trail_entry: {
            Args: {
                entity_id_param: string;
                entity_type_param: string;
                action_param: string;
                user_id_param?: string;
                details_param?: import("../types/database").Json;
            };
            Returns: undefined;
        };
        generate_receipt_number: {
            Args: Record<PropertyKey, never>;
            Returns: string;
        };
        get_active_commission_rule: {
            Args: {
                parking_type_param: Database["public"]["Enums"]["parking_type"];
            };
            Returns: {
                created_at: string;
                effective_date: string;
                expiry_date: string | null;
                host_percentage: number;
                id: string;
                is_active: boolean;
                park_angel_percentage: number;
                parking_type: Database["public"]["Enums"]["parking_type"];
                updated_at: string;
            };
        };
        get_effective_pricing: {
            Args: {
                spot_id: string;
            };
            Returns: import("../types/database").Json;
        };
        get_enum_values: {
            Args: {
                enum_name: string;
            };
            Returns: {
                enum_value: string;
            }[];
        };
        get_location_occupancy_rate: {
            Args: {
                location_id: string;
            };
            Returns: number;
        };
        get_pricing_hierarchy: {
            Args: {
                location_id: string;
            };
            Returns: import("../types/database").Json;
        };
        get_storage_buckets: {
            Args: Record<PropertyKey, never>;
            Returns: {
                bucket_name: string;
                bucket_public: boolean;
            }[];
        };
        get_table_indexes: {
            Args: {
                table_name: string;
            };
            Returns: {
                index_name: string;
                column_names: string;
                is_unique: boolean;
                is_primary: boolean;
            }[];
        };
        get_table_list: {
            Args: Record<PropertyKey, never>;
            Returns: {
                table_name: string;
            }[];
        };
        get_table_policies: {
            Args: {
                table_name: string;
            };
            Returns: {
                policy_name: string;
                policy_cmd: string;
                policy_permissive: string;
                policy_roles: string[];
            }[];
        };
        increment_rate_limit: {
            Args: {
                p_api_key_id: string;
                p_time_window: string;
                p_window_start: string;
            };
            Returns: undefined;
        };
        is_admin: {
            Args: Record<PropertyKey, never>;
            Returns: boolean;
        };
        log_audit_event: {
            Args: {
                p_entity_id: string;
                p_entity_type: string;
                p_action: string;
                p_user_id?: string;
                p_details?: import("../types/database").Json;
            };
            Returns: string;
        };
        maintain_database: {
            Args: Record<PropertyKey, never>;
            Returns: string;
        };
        record_performance_metric: {
            Args: {
                p_feature: string;
                p_response_time: number;
                p_error?: boolean;
                p_user_id?: string;
                p_metadata?: import("../types/database").Json;
            };
            Returns: string;
        };
        update_advertisement_metrics: {
            Args: {
                p_advertisement_id: string;
                p_impressions?: number;
                p_clicks?: number;
                p_conversions?: number;
            };
            Returns: undefined;
        };
        update_customer_analytics: {
            Args: {
                p_customer_id: string;
                p_operator_id: string;
                p_booking_amount?: number;
            };
            Returns: undefined;
        };
        update_pricing_with_recalculation: {
            Args: {
                table_name: string;
                record_id: string;
                pricing_config: import("../types/database").Json;
            };
            Returns: undefined;
        };
        validate_database_integrity: {
            Args: Record<PropertyKey, never>;
            Returns: {
                check_name: string;
                status: string;
                details: string;
            }[];
        };
        verify_constraints: {
            Args: Record<PropertyKey, never>;
            Returns: {
                table_name: string;
                constraint_name: string;
                constraint_type: string;
                is_valid: boolean;
            }[];
        };
    };
    Enums: {
        ad_content_type: "image" | "video" | "text" | "banner" | "interstitial";
        ad_status: "pending" | "approved" | "active" | "paused" | "completed";
        ad_target_type: "section" | "zone";
        booking_status: "pending" | "confirmed" | "active" | "completed" | "cancelled";
        conversation_type: "user_host" | "user_operator" | "user_support";
        discrepancy_type: "amount_mismatch" | "missing_revenue_share" | "missing_transaction" | "status_mismatch" | "duplicate_entry";
        financial_report_type: "operator_revenue" | "host_revenue" | "transaction_reconciliation" | "payout_summary" | "revenue_analysis";
        message_type: "text" | "image" | "file";
        parking_type: "hosted" | "street" | "facility";
        payment_intent_status: "requires_payment_method" | "requires_confirmation" | "requires_action" | "processing" | "succeeded" | "cancelled";
        payment_method_type: "credit_card" | "debit_card" | "digital_wallet" | "bank_transfer";
        payment_provider: "stripe" | "paypal" | "gcash" | "paymaya" | "park_angel";
        payment_status: "pending" | "paid" | "refunded";
        payment_transaction_status: "pending" | "processing" | "succeeded" | "failed" | "cancelled" | "refunded" | "partially_refunded";
        payout_status: "pending" | "processing" | "paid" | "failed" | "cancelled";
        rated_type: "spot" | "host" | "operator" | "user";
        reconciliation_rule_type: "amount_validation" | "status_check" | "duplicate_detection" | "completeness_check";
        remittance_frequency: "daily" | "weekly" | "biweekly" | "monthly";
        remittance_status: "pending" | "processing" | "completed" | "failed" | "cancelled";
        spot_status: "available" | "occupied" | "reserved" | "maintenance";
        target_type: "section" | "zone";
        user_status: "active" | "inactive" | "suspended";
        user_type: "client" | "host" | "operator" | "admin" | "pos";
        vip_type: "vvip" | "flex_vvip" | "spot_vip" | "spot_flex_vip";
    };
    CompositeTypes: { [_ in never]: never; };
}>;
export declare const auth: import("@supabase/supabase-js/dist/module/lib/SupabaseAuthClient").SupabaseAuthClient;
export declare const storage: import("@supabase/storage-js").StorageClient;
export declare const realtime: import("@supabase/realtime-js").RealtimeClient;
export declare const db: SupabaseClient<Database, "public", {
    Tables: {
        advertisement_metrics: {
            Row: {
                advertisement_id: string;
                clicks: number;
                conversions: number;
                created_at: string | null;
                date: string;
                id: string;
                impressions: number;
                total_cost: number;
                updated_at: string | null;
            };
            Insert: {
                advertisement_id: string;
                clicks?: number;
                conversions?: number;
                created_at?: string | null;
                date: string;
                id?: string;
                impressions?: number;
                total_cost?: number;
                updated_at?: string | null;
            };
            Update: {
                advertisement_id?: string;
                clicks?: number;
                conversions?: number;
                created_at?: string | null;
                date?: string;
                id?: string;
                impressions?: number;
                total_cost?: number;
                updated_at?: string | null;
            };
            Relationships: [{
                foreignKeyName: "advertisement_metrics_advertisement_id_fkey";
                columns: ["advertisement_id"];
                isOneToOne: false;
                referencedRelation: "advertisements";
                referencedColumns: ["id"];
            }];
        };
        advertisement_payments: {
            Row: {
                advertisement_id: string;
                amount: number;
                created_at: string | null;
                id: string;
                paid_at: string | null;
                payment_method: string;
                payment_reference: string | null;
                payment_status: string;
                updated_at: string | null;
            };
            Insert: {
                advertisement_id: string;
                amount: number;
                created_at?: string | null;
                id?: string;
                paid_at?: string | null;
                payment_method: string;
                payment_reference?: string | null;
                payment_status?: string;
                updated_at?: string | null;
            };
            Update: {
                advertisement_id?: string;
                amount?: number;
                created_at?: string | null;
                id?: string;
                paid_at?: string | null;
                payment_method?: string;
                payment_reference?: string | null;
                payment_status?: string;
                updated_at?: string | null;
            };
            Relationships: [{
                foreignKeyName: "advertisement_payments_advertisement_id_fkey";
                columns: ["advertisement_id"];
                isOneToOne: false;
                referencedRelation: "advertisements";
                referencedColumns: ["id"];
            }];
        };
        advertisements: {
            Row: {
                budget: number;
                content: import("../types/database").Json;
                created_at: string;
                created_by: string;
                id: string;
                metrics: import("../types/database").Json | null;
                schedule: import("../types/database").Json;
                status: Database["public"]["Enums"]["ad_status"];
                target_location: string;
                target_type: Database["public"]["Enums"]["target_type"];
                title: string;
                updated_at: string;
            };
            Insert: {
                budget: number;
                content: import("../types/database").Json;
                created_at?: string;
                created_by: string;
                id?: string;
                metrics?: import("../types/database").Json | null;
                schedule: import("../types/database").Json;
                status?: Database["public"]["Enums"]["ad_status"];
                target_location: string;
                target_type: Database["public"]["Enums"]["target_type"];
                title: string;
                updated_at?: string;
            };
            Update: {
                budget?: number;
                content?: import("../types/database").Json;
                created_at?: string;
                created_by?: string;
                id?: string;
                metrics?: import("../types/database").Json | null;
                schedule?: import("../types/database").Json;
                status?: Database["public"]["Enums"]["ad_status"];
                target_location?: string;
                target_type?: Database["public"]["Enums"]["target_type"];
                title?: string;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "advertisements_created_by_fkey";
                columns: ["created_by"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        api_applications: {
            Row: {
                app_type: string;
                approved_at: string | null;
                approved_by: string | null;
                callback_urls: string[] | null;
                created_at: string | null;
                description: string | null;
                developer_account_id: string | null;
                id: string;
                name: string;
                status: string | null;
                updated_at: string | null;
                webhook_url: string | null;
            };
            Insert: {
                app_type: string;
                approved_at?: string | null;
                approved_by?: string | null;
                callback_urls?: string[] | null;
                created_at?: string | null;
                description?: string | null;
                developer_account_id?: string | null;
                id?: string;
                name: string;
                status?: string | null;
                updated_at?: string | null;
                webhook_url?: string | null;
            };
            Update: {
                app_type?: string;
                approved_at?: string | null;
                approved_by?: string | null;
                callback_urls?: string[] | null;
                created_at?: string | null;
                description?: string | null;
                developer_account_id?: string | null;
                id?: string;
                name?: string;
                status?: string | null;
                updated_at?: string | null;
                webhook_url?: string | null;
            };
            Relationships: [{
                foreignKeyName: "api_applications_developer_account_id_fkey";
                columns: ["developer_account_id"];
                isOneToOne: false;
                referencedRelation: "developer_accounts";
                referencedColumns: ["id"];
            }];
        };
        api_billing_records: {
            Row: {
                base_amount: number | null;
                billing_period_end: string;
                billing_period_start: string;
                calls_included: number | null;
                calls_overage: number | null;
                calls_used: number | null;
                created_at: string | null;
                id: string;
                invoice_number: string | null;
                overage_amount: number | null;
                paid_at: string | null;
                status: string | null;
                subscription_id: string | null;
                total_amount: number;
                updated_at: string | null;
                usage_amount: number | null;
            };
            Insert: {
                base_amount?: number | null;
                billing_period_end: string;
                billing_period_start: string;
                calls_included?: number | null;
                calls_overage?: number | null;
                calls_used?: number | null;
                created_at?: string | null;
                id?: string;
                invoice_number?: string | null;
                overage_amount?: number | null;
                paid_at?: string | null;
                status?: string | null;
                subscription_id?: string | null;
                total_amount: number;
                updated_at?: string | null;
                usage_amount?: number | null;
            };
            Update: {
                base_amount?: number | null;
                billing_period_end?: string;
                billing_period_start?: string;
                calls_included?: number | null;
                calls_overage?: number | null;
                calls_used?: number | null;
                created_at?: string | null;
                id?: string;
                invoice_number?: string | null;
                overage_amount?: number | null;
                paid_at?: string | null;
                status?: string | null;
                subscription_id?: string | null;
                total_amount?: number;
                updated_at?: string | null;
                usage_amount?: number | null;
            };
            Relationships: [{
                foreignKeyName: "api_billing_records_subscription_id_fkey";
                columns: ["subscription_id"];
                isOneToOne: false;
                referencedRelation: "api_subscriptions";
                referencedColumns: ["id"];
            }];
        };
        api_documentation: {
            Row: {
                content: string;
                created_at: string | null;
                id: string;
                is_published: boolean | null;
                parent_id: string | null;
                section_order: number | null;
                slug: string;
                title: string;
                updated_at: string | null;
            };
            Insert: {
                content: string;
                created_at?: string | null;
                id?: string;
                is_published?: boolean | null;
                parent_id?: string | null;
                section_order?: number | null;
                slug: string;
                title: string;
                updated_at?: string | null;
            };
            Update: {
                content?: string;
                created_at?: string | null;
                id?: string;
                is_published?: boolean | null;
                parent_id?: string | null;
                section_order?: number | null;
                slug?: string;
                title?: string;
                updated_at?: string | null;
            };
            Relationships: [{
                foreignKeyName: "api_documentation_parent_id_fkey";
                columns: ["parent_id"];
                isOneToOne: false;
                referencedRelation: "api_documentation";
                referencedColumns: ["id"];
            }];
        };
        api_keys: {
            Row: {
                created_at: string;
                id: string;
                is_active: boolean;
                key_hash: string;
                last_used_at: string | null;
                name: string;
                permissions: import("../types/database").Json;
                rate_limit: number | null;
                updated_at: string;
                user_id: string;
            };
            Insert: {
                created_at?: string;
                id?: string;
                is_active?: boolean;
                key_hash: string;
                last_used_at?: string | null;
                name: string;
                permissions?: import("../types/database").Json;
                rate_limit?: number | null;
                updated_at?: string;
                user_id: string;
            };
            Update: {
                created_at?: string;
                id?: string;
                is_active?: boolean;
                key_hash?: string;
                last_used_at?: string | null;
                name?: string;
                permissions?: import("../types/database").Json;
                rate_limit?: number | null;
                updated_at?: string;
                user_id?: string;
            };
            Relationships: [{
                foreignKeyName: "api_keys_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        api_pricing_plans: {
            Row: {
                created_at: string | null;
                description: string | null;
                features: import("../types/database").Json | null;
                id: string;
                included_calls_per_month: number | null;
                is_active: boolean | null;
                max_calls_per_day: number | null;
                max_calls_per_hour: number | null;
                max_calls_per_minute: number | null;
                monthly_fee: number | null;
                name: string;
                plan_type: string;
                price_per_call: number | null;
                revenue_share_percentage: number | null;
                updated_at: string | null;
            };
            Insert: {
                created_at?: string | null;
                description?: string | null;
                features?: import("../types/database").Json | null;
                id?: string;
                included_calls_per_month?: number | null;
                is_active?: boolean | null;
                max_calls_per_day?: number | null;
                max_calls_per_hour?: number | null;
                max_calls_per_minute?: number | null;
                monthly_fee?: number | null;
                name: string;
                plan_type: string;
                price_per_call?: number | null;
                revenue_share_percentage?: number | null;
                updated_at?: string | null;
            };
            Update: {
                created_at?: string | null;
                description?: string | null;
                features?: import("../types/database").Json | null;
                id?: string;
                included_calls_per_month?: number | null;
                is_active?: boolean | null;
                max_calls_per_day?: number | null;
                max_calls_per_hour?: number | null;
                max_calls_per_minute?: number | null;
                monthly_fee?: number | null;
                name?: string;
                plan_type?: string;
                price_per_call?: number | null;
                revenue_share_percentage?: number | null;
                updated_at?: string | null;
            };
            Relationships: [];
        };
        api_rate_limits: {
            Row: {
                api_key_id: string | null;
                created_at: string | null;
                id: string;
                request_count: number | null;
                time_window: string;
                updated_at: string | null;
                window_start: string;
            };
            Insert: {
                api_key_id?: string | null;
                created_at?: string | null;
                id?: string;
                request_count?: number | null;
                time_window: string;
                updated_at?: string | null;
                window_start: string;
            };
            Update: {
                api_key_id?: string | null;
                created_at?: string | null;
                id?: string;
                request_count?: number | null;
                time_window?: string;
                updated_at?: string | null;
                window_start?: string;
            };
            Relationships: [{
                foreignKeyName: "api_rate_limits_api_key_id_fkey";
                columns: ["api_key_id"];
                isOneToOne: false;
                referencedRelation: "api_keys";
                referencedColumns: ["id"];
            }];
        };
        api_subscriptions: {
            Row: {
                application_id: string | null;
                calls_used_this_period: number | null;
                created_at: string | null;
                current_period_end: string | null;
                current_period_start: string | null;
                id: string;
                overage_charges: number | null;
                pricing_plan_id: string | null;
                status: string | null;
                updated_at: string | null;
            };
            Insert: {
                application_id?: string | null;
                calls_used_this_period?: number | null;
                created_at?: string | null;
                current_period_end?: string | null;
                current_period_start?: string | null;
                id?: string;
                overage_charges?: number | null;
                pricing_plan_id?: string | null;
                status?: string | null;
                updated_at?: string | null;
            };
            Update: {
                application_id?: string | null;
                calls_used_this_period?: number | null;
                created_at?: string | null;
                current_period_end?: string | null;
                current_period_start?: string | null;
                id?: string;
                overage_charges?: number | null;
                pricing_plan_id?: string | null;
                status?: string | null;
                updated_at?: string | null;
            };
            Relationships: [{
                foreignKeyName: "api_subscriptions_application_id_fkey";
                columns: ["application_id"];
                isOneToOne: false;
                referencedRelation: "api_applications";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "api_subscriptions_pricing_plan_id_fkey";
                columns: ["pricing_plan_id"];
                isOneToOne: false;
                referencedRelation: "api_pricing_plans";
                referencedColumns: ["id"];
            }];
        };
        api_usage: {
            Row: {
                api_key_id: string;
                created_at: string;
                endpoint: string;
                id: string;
                ip_address: unknown | null;
                method: string;
                request_size: number | null;
                response_size: number | null;
                response_time: number | null;
                status_code: number;
                user_agent: string | null;
            };
            Insert: {
                api_key_id: string;
                created_at?: string;
                endpoint: string;
                id?: string;
                ip_address?: unknown | null;
                method: string;
                request_size?: number | null;
                response_size?: number | null;
                response_time?: number | null;
                status_code: number;
                user_agent?: string | null;
            };
            Update: {
                api_key_id?: string;
                created_at?: string;
                endpoint?: string;
                id?: string;
                ip_address?: unknown | null;
                method?: string;
                request_size?: number | null;
                response_size?: number | null;
                response_time?: number | null;
                status_code?: number;
                user_agent?: string | null;
            };
            Relationships: [{
                foreignKeyName: "api_usage_api_key_id_fkey";
                columns: ["api_key_id"];
                isOneToOne: false;
                referencedRelation: "api_keys";
                referencedColumns: ["id"];
            }];
        };
        api_usage_logs: {
            Row: {
                api_key_id: string | null;
                created_at: string | null;
                endpoint: string;
                error_message: string | null;
                id: string;
                ip_address: unknown | null;
                method: string;
                request_size_bytes: number | null;
                response_size_bytes: number | null;
                response_time_ms: number | null;
                status_code: number;
                user_agent: string | null;
            };
            Insert: {
                api_key_id?: string | null;
                created_at?: string | null;
                endpoint: string;
                error_message?: string | null;
                id?: string;
                ip_address?: unknown | null;
                method: string;
                request_size_bytes?: number | null;
                response_size_bytes?: number | null;
                response_time_ms?: number | null;
                status_code: number;
                user_agent?: string | null;
            };
            Update: {
                api_key_id?: string | null;
                created_at?: string | null;
                endpoint?: string;
                error_message?: string | null;
                id?: string;
                ip_address?: unknown | null;
                method?: string;
                request_size_bytes?: number | null;
                response_size_bytes?: number | null;
                response_time_ms?: number | null;
                status_code?: number;
                user_agent?: string | null;
            };
            Relationships: [{
                foreignKeyName: "api_usage_logs_api_key_id_fkey";
                columns: ["api_key_id"];
                isOneToOne: false;
                referencedRelation: "api_keys";
                referencedColumns: ["id"];
            }];
        };
        audit_logs: {
            Row: {
                action: string;
                created_at: string;
                id: string;
                ip_address: unknown | null;
                new_values: import("../types/database").Json | null;
                old_values: import("../types/database").Json | null;
                resource_id: string | null;
                resource_type: string;
                user_agent: string | null;
                user_id: string | null;
            };
            Insert: {
                action: string;
                created_at?: string;
                id?: string;
                ip_address?: unknown | null;
                new_values?: import("../types/database").Json | null;
                old_values?: import("../types/database").Json | null;
                resource_id?: string | null;
                resource_type: string;
                user_agent?: string | null;
                user_id?: string | null;
            };
            Update: {
                action?: string;
                created_at?: string;
                id?: string;
                ip_address?: unknown | null;
                new_values?: import("../types/database").Json | null;
                old_values?: import("../types/database").Json | null;
                resource_id?: string | null;
                resource_type?: string;
                user_agent?: string | null;
                user_id?: string | null;
            };
            Relationships: [{
                foreignKeyName: "audit_logs_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        audit_trail: {
            Row: {
                action: string;
                details: import("../types/database").Json;
                entity_id: string;
                entity_type: string;
                id: string;
                timestamp: string;
                user_id: string | null;
            };
            Insert: {
                action: string;
                details?: import("../types/database").Json;
                entity_id: string;
                entity_type: string;
                id: string;
                timestamp?: string;
                user_id?: string | null;
            };
            Update: {
                action?: string;
                details?: import("../types/database").Json;
                entity_id?: string;
                entity_type?: string;
                id?: string;
                timestamp?: string;
                user_id?: string | null;
            };
            Relationships: [{
                foreignKeyName: "audit_trail_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        bank_accounts: {
            Row: {
                account_name: string;
                account_number: string;
                bank_name: string;
                created_at: string;
                id: string;
                is_default: boolean;
                is_verified: boolean;
                owner_id: string;
                owner_type: string;
                routing_number: string | null;
                swift_code: string | null;
                updated_at: string;
            };
            Insert: {
                account_name: string;
                account_number: string;
                bank_name: string;
                created_at?: string;
                id?: string;
                is_default?: boolean;
                is_verified?: boolean;
                owner_id: string;
                owner_type: string;
                routing_number?: string | null;
                swift_code?: string | null;
                updated_at?: string;
            };
            Update: {
                account_name?: string;
                account_number?: string;
                bank_name?: string;
                created_at?: string;
                id?: string;
                is_default?: boolean;
                is_verified?: boolean;
                owner_id?: string;
                owner_type?: string;
                routing_number?: string | null;
                swift_code?: string | null;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "bank_accounts_owner_id_fkey";
                columns: ["owner_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        bookings: {
            Row: {
                amount: number;
                created_at: string;
                discounts: import("../types/database").Json | null;
                end_time: string;
                id: string;
                payment_status: Database["public"]["Enums"]["payment_status"];
                spot_id: string;
                start_time: string;
                status: Database["public"]["Enums"]["booking_status"];
                total_amount: number;
                updated_at: string;
                user_id: string;
                vat_amount: number;
                vehicle_id: string;
            };
            Insert: {
                amount: number;
                created_at?: string;
                discounts?: import("../types/database").Json | null;
                end_time: string;
                id?: string;
                payment_status?: Database["public"]["Enums"]["payment_status"];
                spot_id: string;
                start_time: string;
                status?: Database["public"]["Enums"]["booking_status"];
                total_amount: number;
                updated_at?: string;
                user_id: string;
                vat_amount?: number;
                vehicle_id: string;
            };
            Update: {
                amount?: number;
                created_at?: string;
                discounts?: import("../types/database").Json | null;
                end_time?: string;
                id?: string;
                payment_status?: Database["public"]["Enums"]["payment_status"];
                spot_id?: string;
                start_time?: string;
                status?: Database["public"]["Enums"]["booking_status"];
                total_amount?: number;
                updated_at?: string;
                user_id?: string;
                vat_amount?: number;
                vehicle_id?: string;
            };
            Relationships: [{
                foreignKeyName: "bookings_spot_id_fkey";
                columns: ["spot_id"];
                isOneToOne: false;
                referencedRelation: "parking_hierarchy_view";
                referencedColumns: ["spot_id"];
            }, {
                foreignKeyName: "bookings_spot_id_fkey";
                columns: ["spot_id"];
                isOneToOne: false;
                referencedRelation: "parking_spots";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "bookings_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "bookings_vehicle_id_fkey";
                columns: ["vehicle_id"];
                isOneToOne: false;
                referencedRelation: "vehicles";
                referencedColumns: ["id"];
            }];
        };
        cash_drawer_operations: {
            Row: {
                amount: number | null;
                created_at: string;
                hardware_status: import("../types/database").Json | null;
                id: string;
                operator_id: string;
                reason: string | null;
                session_id: string;
                type: string;
            };
            Insert: {
                amount?: number | null;
                created_at?: string;
                hardware_status?: import("../types/database").Json | null;
                id?: string;
                operator_id: string;
                reason?: string | null;
                session_id: string;
                type: string;
            };
            Update: {
                amount?: number | null;
                created_at?: string;
                hardware_status?: import("../types/database").Json | null;
                id?: string;
                operator_id?: string;
                reason?: string | null;
                session_id?: string;
                type?: string;
            };
            Relationships: [{
                foreignKeyName: "cash_drawer_operations_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "cash_drawer_operations_session_id_fkey";
                columns: ["session_id"];
                isOneToOne: false;
                referencedRelation: "active_pos_sessions_view";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "cash_drawer_operations_session_id_fkey";
                columns: ["session_id"];
                isOneToOne: false;
                referencedRelation: "pos_sessions";
                referencedColumns: ["id"];
            }];
        };
        commission_calculations: {
            Row: {
                calculated_at: string;
                commission_rule_id: string;
                created_at: string;
                host_share: number;
                id: string;
                park_angel_share: number;
                total_amount: number;
                transaction_id: string;
            };
            Insert: {
                calculated_at?: string;
                commission_rule_id: string;
                created_at?: string;
                host_share: number;
                id?: string;
                park_angel_share: number;
                total_amount: number;
                transaction_id: string;
            };
            Update: {
                calculated_at?: string;
                commission_rule_id?: string;
                created_at?: string;
                host_share?: number;
                id?: string;
                park_angel_share?: number;
                total_amount?: number;
                transaction_id?: string;
            };
            Relationships: [{
                foreignKeyName: "commission_calculations_commission_rule_id_fkey";
                columns: ["commission_rule_id"];
                isOneToOne: false;
                referencedRelation: "commission_rules";
                referencedColumns: ["id"];
            }];
        };
        commission_rules: {
            Row: {
                created_at: string;
                effective_date: string;
                expiry_date: string | null;
                host_percentage: number;
                id: string;
                is_active: boolean;
                park_angel_percentage: number;
                parking_type: Database["public"]["Enums"]["parking_type"];
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                effective_date?: string;
                expiry_date?: string | null;
                host_percentage: number;
                id: string;
                is_active?: boolean;
                park_angel_percentage: number;
                parking_type: Database["public"]["Enums"]["parking_type"];
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                effective_date?: string;
                expiry_date?: string | null;
                host_percentage?: number;
                id?: string;
                is_active?: boolean;
                park_angel_percentage?: number;
                parking_type?: Database["public"]["Enums"]["parking_type"];
                updated_at?: string;
            };
            Relationships: [];
        };
        conversations: {
            Row: {
                created_at: string;
                id: string;
                is_active: boolean;
                metadata: import("../types/database").Json | null;
                participants: string[];
                type: Database["public"]["Enums"]["conversation_type"];
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                id?: string;
                is_active?: boolean;
                metadata?: import("../types/database").Json | null;
                participants: string[];
                type: Database["public"]["Enums"]["conversation_type"];
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                id?: string;
                is_active?: boolean;
                metadata?: import("../types/database").Json | null;
                participants?: string[];
                type?: Database["public"]["Enums"]["conversation_type"];
                updated_at?: string;
            };
            Relationships: [];
        };
        customer_analytics: {
            Row: {
                average_session_duration: number | null;
                customer_id: string;
                customer_since: string;
                favorite_locations: string[] | null;
                id: string;
                last_booking_date: string | null;
                loyalty_score: number;
                operator_id: string;
                total_bookings: number;
                total_spent: number;
                updated_at: string;
            };
            Insert: {
                average_session_duration?: number | null;
                customer_id: string;
                customer_since?: string;
                favorite_locations?: string[] | null;
                id?: string;
                last_booking_date?: string | null;
                loyalty_score?: number;
                operator_id: string;
                total_bookings?: number;
                total_spent?: number;
                updated_at?: string;
            };
            Update: {
                average_session_duration?: number | null;
                customer_id?: string;
                customer_since?: string;
                favorite_locations?: string[] | null;
                id?: string;
                last_booking_date?: string | null;
                loyalty_score?: number;
                operator_id?: string;
                total_bookings?: number;
                total_spent?: number;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "customer_analytics_customer_id_fkey";
                columns: ["customer_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "customer_analytics_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        customer_support_conversations: {
            Row: {
                created_at: string;
                customer_id: string;
                id: string;
                operator_id: string;
                priority: string;
                status: string;
                subject: string;
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                customer_id: string;
                id?: string;
                operator_id: string;
                priority?: string;
                status?: string;
                subject: string;
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                customer_id?: string;
                id?: string;
                operator_id?: string;
                priority?: string;
                status?: string;
                subject?: string;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "customer_support_conversations_customer_id_fkey";
                columns: ["customer_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "customer_support_conversations_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        customer_support_messages: {
            Row: {
                attachments: import("../types/database").Json | null;
                conversation_id: string;
                created_at: string;
                id: string;
                is_internal: boolean;
                message: string;
                sender_id: string;
            };
            Insert: {
                attachments?: import("../types/database").Json | null;
                conversation_id: string;
                created_at?: string;
                id?: string;
                is_internal?: boolean;
                message: string;
                sender_id: string;
            };
            Update: {
                attachments?: import("../types/database").Json | null;
                conversation_id?: string;
                created_at?: string;
                id?: string;
                is_internal?: boolean;
                message?: string;
                sender_id?: string;
            };
            Relationships: [{
                foreignKeyName: "customer_support_messages_conversation_id_fkey";
                columns: ["conversation_id"];
                isOneToOne: false;
                referencedRelation: "customer_support_conversations";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "customer_support_messages_sender_id_fkey";
                columns: ["sender_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        developer_accounts: {
            Row: {
                approved_at: string | null;
                approved_by: string | null;
                company_name: string;
                contact_email: string;
                contact_phone: string | null;
                created_at: string | null;
                description: string | null;
                id: string;
                status: string | null;
                updated_at: string | null;
                user_id: string | null;
                website_url: string | null;
            };
            Insert: {
                approved_at?: string | null;
                approved_by?: string | null;
                company_name: string;
                contact_email: string;
                contact_phone?: string | null;
                created_at?: string | null;
                description?: string | null;
                id?: string;
                status?: string | null;
                updated_at?: string | null;
                user_id?: string | null;
                website_url?: string | null;
            };
            Update: {
                approved_at?: string | null;
                approved_by?: string | null;
                company_name?: string;
                contact_email?: string;
                contact_phone?: string | null;
                created_at?: string | null;
                description?: string | null;
                id?: string;
                status?: string | null;
                updated_at?: string | null;
                user_id?: string | null;
                website_url?: string | null;
            };
            Relationships: [];
        };
        discount_applications: {
            Row: {
                applied_at: string;
                created_at: string;
                discount_type: string;
                documents: import("../types/database").Json;
                id: string;
                rejection_reason: string | null;
                reviewed_at: string | null;
                reviewed_by: string | null;
                status: string;
                updated_at: string;
                user_id: string;
            };
            Insert: {
                applied_at?: string;
                created_at?: string;
                discount_type: string;
                documents: import("../types/database").Json;
                id?: string;
                rejection_reason?: string | null;
                reviewed_at?: string | null;
                reviewed_by?: string | null;
                status?: string;
                updated_at?: string;
                user_id: string;
            };
            Update: {
                applied_at?: string;
                created_at?: string;
                discount_type?: string;
                documents?: import("../types/database").Json;
                id?: string;
                rejection_reason?: string | null;
                reviewed_at?: string | null;
                reviewed_by?: string | null;
                status?: string;
                updated_at?: string;
                user_id?: string;
            };
            Relationships: [];
        };
        discount_rules: {
            Row: {
                approved_at: string | null;
                approved_by: string | null;
                conditions: import("../types/database").Json | null;
                created_at: string;
                created_by: string | null;
                id: string;
                is_active: boolean;
                is_vat_exempt: boolean;
                name: string;
                operator_id: string | null;
                percentage: number;
                type: string;
                updated_at: string;
            };
            Insert: {
                approved_at?: string | null;
                approved_by?: string | null;
                conditions?: import("../types/database").Json | null;
                created_at?: string;
                created_by?: string | null;
                id?: string;
                is_active?: boolean;
                is_vat_exempt?: boolean;
                name: string;
                operator_id?: string | null;
                percentage: number;
                type: string;
                updated_at?: string;
            };
            Update: {
                approved_at?: string | null;
                approved_by?: string | null;
                conditions?: import("../types/database").Json | null;
                created_at?: string;
                created_by?: string | null;
                id?: string;
                is_active?: boolean;
                is_vat_exempt?: boolean;
                name?: string;
                operator_id?: string | null;
                percentage?: number;
                type?: string;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "discount_rules_approved_by_fkey";
                columns: ["approved_by"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "discount_rules_created_by_fkey";
                columns: ["created_by"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "discount_rules_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        discount_verification_documents: {
            Row: {
                created_at: string;
                discount_type: string;
                document_type: string;
                document_url: string;
                expiry_date: string | null;
                id: string;
                notes: string | null;
                status: string;
                updated_at: string;
                user_id: string;
                verified_at: string | null;
                verified_by: string | null;
            };
            Insert: {
                created_at?: string;
                discount_type: string;
                document_type: string;
                document_url: string;
                expiry_date?: string | null;
                id?: string;
                notes?: string | null;
                status?: string;
                updated_at?: string;
                user_id: string;
                verified_at?: string | null;
                verified_by?: string | null;
            };
            Update: {
                created_at?: string;
                discount_type?: string;
                document_type?: string;
                document_url?: string;
                expiry_date?: string | null;
                id?: string;
                notes?: string | null;
                status?: string;
                updated_at?: string;
                user_id?: string;
                verified_at?: string | null;
                verified_by?: string | null;
            };
            Relationships: [{
                foreignKeyName: "discount_verification_documents_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "discount_verification_documents_verified_by_fkey";
                columns: ["verified_by"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        discrepancies: {
            Row: {
                actual_amount: number | null;
                amount: number | null;
                created_at: string;
                description: string;
                difference: number | null;
                expected_amount: number | null;
                id: string;
                resolution: string | null;
                resolved_at: string | null;
                resolved_by: string | null;
                status: string;
                transaction_id: string | null;
                type: Database["public"]["Enums"]["discrepancy_type"];
            };
            Insert: {
                actual_amount?: number | null;
                amount?: number | null;
                created_at?: string;
                description: string;
                difference?: number | null;
                expected_amount?: number | null;
                id: string;
                resolution?: string | null;
                resolved_at?: string | null;
                resolved_by?: string | null;
                status?: string;
                transaction_id?: string | null;
                type: Database["public"]["Enums"]["discrepancy_type"];
            };
            Update: {
                actual_amount?: number | null;
                amount?: number | null;
                created_at?: string;
                description?: string;
                difference?: number | null;
                expected_amount?: number | null;
                id?: string;
                resolution?: string | null;
                resolved_at?: string | null;
                resolved_by?: string | null;
                status?: string;
                transaction_id?: string | null;
                type?: Database["public"]["Enums"]["discrepancy_type"];
            };
            Relationships: [{
                foreignKeyName: "discrepancies_resolved_by_fkey";
                columns: ["resolved_by"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        facility_layouts: {
            Row: {
                created_at: string;
                elements: import("../types/database").Json;
                floors: import("../types/database").Json;
                id: string;
                location_id: string;
                metadata: import("../types/database").Json;
                name: string;
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                elements?: import("../types/database").Json;
                floors?: import("../types/database").Json;
                id?: string;
                location_id: string;
                metadata?: import("../types/database").Json;
                name: string;
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                elements?: import("../types/database").Json;
                floors?: import("../types/database").Json;
                id?: string;
                location_id?: string;
                metadata?: import("../types/database").Json;
                name?: string;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "facility_layouts_location_id_fkey";
                columns: ["location_id"];
                isOneToOne: false;
                referencedRelation: "locations";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "facility_layouts_location_id_fkey";
                columns: ["location_id"];
                isOneToOne: false;
                referencedRelation: "parking_hierarchy_view";
                referencedColumns: ["location_id"];
            }];
        };
        financial_reports: {
            Row: {
                created_at: string;
                data: import("../types/database").Json;
                description: string | null;
                generated_at: string;
                generated_by: string;
                id: string;
                metadata: import("../types/database").Json;
                parameters: import("../types/database").Json;
                title: string;
                type: Database["public"]["Enums"]["financial_report_type"];
            };
            Insert: {
                created_at?: string;
                data?: import("../types/database").Json;
                description?: string | null;
                generated_at?: string;
                generated_by: string;
                id: string;
                metadata?: import("../types/database").Json;
                parameters?: import("../types/database").Json;
                title: string;
                type: Database["public"]["Enums"]["financial_report_type"];
            };
            Update: {
                created_at?: string;
                data?: import("../types/database").Json;
                description?: string | null;
                generated_at?: string;
                generated_by?: string;
                id?: string;
                metadata?: import("../types/database").Json;
                parameters?: import("../types/database").Json;
                title?: string;
                type?: Database["public"]["Enums"]["financial_report_type"];
            };
            Relationships: [{
                foreignKeyName: "financial_reports_generated_by_fkey";
                columns: ["generated_by"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        generated_reports: {
            Row: {
                created_at: string | null;
                created_by: string | null;
                data: import("../types/database").Json;
                description: string | null;
                filters: import("../types/database").Json | null;
                id: string;
                metadata: import("../types/database").Json;
                sorting: import("../types/database").Json | null;
                title: string;
                type: string;
            };
            Insert: {
                created_at?: string | null;
                created_by?: string | null;
                data: import("../types/database").Json;
                description?: string | null;
                filters?: import("../types/database").Json | null;
                id: string;
                metadata?: import("../types/database").Json;
                sorting?: import("../types/database").Json | null;
                title: string;
                type: string;
            };
            Update: {
                created_at?: string | null;
                created_by?: string | null;
                data?: import("../types/database").Json;
                description?: string | null;
                filters?: import("../types/database").Json | null;
                id?: string;
                metadata?: import("../types/database").Json;
                sorting?: import("../types/database").Json | null;
                title?: string;
                type?: string;
            };
            Relationships: [];
        };
        host_payouts: {
            Row: {
                booking_ids: string[];
                created_at: string;
                failure_reason: string | null;
                gross_amount: number;
                host_id: string;
                id: string;
                net_amount: number;
                payout_details: import("../types/database").Json | null;
                payout_method: string;
                platform_fee: number;
                processed_at: string | null;
                status: string;
                updated_at: string;
            };
            Insert: {
                booking_ids: string[];
                created_at?: string;
                failure_reason?: string | null;
                gross_amount: number;
                host_id: string;
                id?: string;
                net_amount: number;
                payout_details?: import("../types/database").Json | null;
                payout_method?: string;
                platform_fee: number;
                processed_at?: string | null;
                status?: string;
                updated_at?: string;
            };
            Update: {
                booking_ids?: string[];
                created_at?: string;
                failure_reason?: string | null;
                gross_amount?: number;
                host_id?: string;
                id?: string;
                net_amount?: number;
                payout_details?: import("../types/database").Json | null;
                payout_method?: string;
                platform_fee?: number;
                processed_at?: string | null;
                status?: string;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "host_payouts_host_id_fkey";
                columns: ["host_id"];
                isOneToOne: false;
                referencedRelation: "host_profiles";
                referencedColumns: ["id"];
            }];
        };
        host_profiles: {
            Row: {
                address: string | null;
                bank_details: import("../types/database").Json | null;
                business_name: string | null;
                contact_phone: string | null;
                created_at: string;
                id: string;
                is_active: boolean;
                profile_photo: string | null;
                rating: number | null;
                total_reviews: number | null;
                updated_at: string;
                user_id: string;
                verification_status: string;
            };
            Insert: {
                address?: string | null;
                bank_details?: import("../types/database").Json | null;
                business_name?: string | null;
                contact_phone?: string | null;
                created_at?: string;
                id?: string;
                is_active?: boolean;
                profile_photo?: string | null;
                rating?: number | null;
                total_reviews?: number | null;
                updated_at?: string;
                user_id: string;
                verification_status?: string;
            };
            Update: {
                address?: string | null;
                bank_details?: import("../types/database").Json | null;
                business_name?: string | null;
                contact_phone?: string | null;
                created_at?: string;
                id?: string;
                is_active?: boolean;
                profile_photo?: string | null;
                rating?: number | null;
                total_reviews?: number | null;
                updated_at?: string;
                user_id?: string;
                verification_status?: string;
            };
            Relationships: [];
        };
        host_reviews: {
            Row: {
                booking_id: string | null;
                created_at: string;
                host_id: string;
                id: string;
                is_verified: boolean | null;
                photos: string[] | null;
                rating: number;
                review_text: string | null;
                reviewer_id: string;
                updated_at: string;
            };
            Insert: {
                booking_id?: string | null;
                created_at?: string;
                host_id: string;
                id?: string;
                is_verified?: boolean | null;
                photos?: string[] | null;
                rating: number;
                review_text?: string | null;
                reviewer_id: string;
                updated_at?: string;
            };
            Update: {
                booking_id?: string | null;
                created_at?: string;
                host_id?: string;
                id?: string;
                is_verified?: boolean | null;
                photos?: string[] | null;
                rating?: number;
                review_text?: string | null;
                reviewer_id?: string;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "host_reviews_booking_id_fkey";
                columns: ["booking_id"];
                isOneToOne: false;
                referencedRelation: "active_bookings_view";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "host_reviews_booking_id_fkey";
                columns: ["booking_id"];
                isOneToOne: false;
                referencedRelation: "bookings";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "host_reviews_host_id_fkey";
                columns: ["host_id"];
                isOneToOne: false;
                referencedRelation: "host_profiles";
                referencedColumns: ["id"];
            }];
        };
        hosted_listings: {
            Row: {
                access_instructions: string | null;
                address: string;
                amenities: string[] | null;
                availability_schedule: import("../types/database").Json | null;
                coordinates: unknown | null;
                created_at: string;
                description: string | null;
                host_id: string;
                id: string;
                is_active: boolean;
                max_vehicle_size: string | null;
                photos: string[] | null;
                pricing_per_day: number | null;
                pricing_per_hour: number;
                title: string;
                updated_at: string;
                vehicle_types: string[] | null;
            };
            Insert: {
                access_instructions?: string | null;
                address: string;
                amenities?: string[] | null;
                availability_schedule?: import("../types/database").Json | null;
                coordinates?: unknown | null;
                created_at?: string;
                description?: string | null;
                host_id: string;
                id?: string;
                is_active?: boolean;
                max_vehicle_size?: string | null;
                photos?: string[] | null;
                pricing_per_day?: number | null;
                pricing_per_hour: number;
                title: string;
                updated_at?: string;
                vehicle_types?: string[] | null;
            };
            Update: {
                access_instructions?: string | null;
                address?: string;
                amenities?: string[] | null;
                availability_schedule?: import("../types/database").Json | null;
                coordinates?: unknown | null;
                created_at?: string;
                description?: string | null;
                host_id?: string;
                id?: string;
                is_active?: boolean;
                max_vehicle_size?: string | null;
                photos?: string[] | null;
                pricing_per_day?: number | null;
                pricing_per_hour?: number;
                title?: string;
                updated_at?: string;
                vehicle_types?: string[] | null;
            };
            Relationships: [{
                foreignKeyName: "hosted_listings_host_id_fkey";
                columns: ["host_id"];
                isOneToOne: false;
                referencedRelation: "host_profiles";
                referencedColumns: ["id"];
            }];
        };
        locations: {
            Row: {
                address: import("../types/database").Json;
                coordinates: import("../types/database").Json;
                created_at: string;
                id: string;
                name: string;
                operator_id: string;
                pricing_config: import("../types/database").Json | null;
                settings: import("../types/database").Json;
                type: Database["public"]["Enums"]["parking_type"];
                updated_at: string;
            };
            Insert: {
                address: import("../types/database").Json;
                coordinates: import("../types/database").Json;
                created_at?: string;
                id?: string;
                name: string;
                operator_id: string;
                pricing_config?: import("../types/database").Json | null;
                settings?: import("../types/database").Json;
                type: Database["public"]["Enums"]["parking_type"];
                updated_at?: string;
            };
            Update: {
                address?: import("../types/database").Json;
                coordinates?: import("../types/database").Json;
                created_at?: string;
                id?: string;
                name?: string;
                operator_id?: string;
                pricing_config?: import("../types/database").Json | null;
                settings?: import("../types/database").Json;
                type?: Database["public"]["Enums"]["parking_type"];
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "locations_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        message_attachments: {
            Row: {
                created_at: string;
                file_name: string;
                file_size: number;
                file_type: string;
                id: string;
                message_id: string;
                thumbnail_url: string | null;
                url: string;
            };
            Insert: {
                created_at?: string;
                file_name: string;
                file_size: number;
                file_type: string;
                id?: string;
                message_id: string;
                thumbnail_url?: string | null;
                url: string;
            };
            Update: {
                created_at?: string;
                file_name?: string;
                file_size?: number;
                file_type?: string;
                id?: string;
                message_id?: string;
                thumbnail_url?: string | null;
                url?: string;
            };
            Relationships: [{
                foreignKeyName: "message_attachments_message_id_fkey";
                columns: ["message_id"];
                isOneToOne: false;
                referencedRelation: "messages";
                referencedColumns: ["id"];
            }];
        };
        message_threads: {
            Row: {
                conversation_id: string;
                created_at: string;
                id: string;
                parent_message_id: string;
                updated_at: string;
            };
            Insert: {
                conversation_id: string;
                created_at?: string;
                id?: string;
                parent_message_id: string;
                updated_at?: string;
            };
            Update: {
                conversation_id?: string;
                created_at?: string;
                id?: string;
                parent_message_id?: string;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "message_threads_conversation_id_fkey";
                columns: ["conversation_id"];
                isOneToOne: false;
                referencedRelation: "conversations";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "message_threads_parent_message_id_fkey";
                columns: ["parent_message_id"];
                isOneToOne: false;
                referencedRelation: "messages";
                referencedColumns: ["id"];
            }];
        };
        messages: {
            Row: {
                attachments: import("../types/database").Json | null;
                content: string;
                conversation_id: string;
                created_at: string;
                deleted_at: string | null;
                edited_at: string | null;
                id: string;
                is_encrypted: boolean;
                read_at: string | null;
                receiver_id: string;
                sender_id: string;
                status: string | null;
                type: Database["public"]["Enums"]["message_type"];
            };
            Insert: {
                attachments?: import("../types/database").Json | null;
                content: string;
                conversation_id: string;
                created_at?: string;
                deleted_at?: string | null;
                edited_at?: string | null;
                id?: string;
                is_encrypted?: boolean;
                read_at?: string | null;
                receiver_id: string;
                sender_id: string;
                status?: string | null;
                type?: Database["public"]["Enums"]["message_type"];
            };
            Update: {
                attachments?: import("../types/database").Json | null;
                content?: string;
                conversation_id?: string;
                created_at?: string;
                deleted_at?: string | null;
                edited_at?: string | null;
                id?: string;
                is_encrypted?: boolean;
                read_at?: string | null;
                receiver_id?: string;
                sender_id?: string;
                status?: string | null;
                type?: Database["public"]["Enums"]["message_type"];
            };
            Relationships: [{
                foreignKeyName: "messages_conversation_id_fkey";
                columns: ["conversation_id"];
                isOneToOne: false;
                referencedRelation: "conversations";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "messages_receiver_id_fkey";
                columns: ["receiver_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "messages_sender_id_fkey";
                columns: ["sender_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        notifications: {
            Row: {
                created_at: string;
                data: import("../types/database").Json | null;
                id: string;
                is_read: boolean;
                message: string;
                title: string;
                type: string;
                user_id: string;
            };
            Insert: {
                created_at?: string;
                data?: import("../types/database").Json | null;
                id?: string;
                is_read?: boolean;
                message: string;
                title: string;
                type: string;
                user_id: string;
            };
            Update: {
                created_at?: string;
                data?: import("../types/database").Json | null;
                id?: string;
                is_read?: boolean;
                message?: string;
                title?: string;
                type?: string;
                user_id?: string;
            };
            Relationships: [{
                foreignKeyName: "notifications_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        operator_bank_details: {
            Row: {
                account_holder_name: string;
                account_number: string;
                account_type: string;
                bank_name: string;
                branch_address: string | null;
                branch_name: string | null;
                created_at: string;
                id: string;
                is_primary: boolean;
                is_verified: boolean;
                operator_id: string;
                routing_number: string | null;
                swift_code: string | null;
                updated_at: string;
                verification_documents: string[] | null;
            };
            Insert: {
                account_holder_name: string;
                account_number: string;
                account_type?: string;
                bank_name: string;
                branch_address?: string | null;
                branch_name?: string | null;
                created_at?: string;
                id?: string;
                is_primary?: boolean;
                is_verified?: boolean;
                operator_id: string;
                routing_number?: string | null;
                swift_code?: string | null;
                updated_at?: string;
                verification_documents?: string[] | null;
            };
            Update: {
                account_holder_name?: string;
                account_number?: string;
                account_type?: string;
                bank_name?: string;
                branch_address?: string | null;
                branch_name?: string | null;
                created_at?: string;
                id?: string;
                is_primary?: boolean;
                is_verified?: boolean;
                operator_id?: string;
                routing_number?: string | null;
                swift_code?: string | null;
                updated_at?: string;
                verification_documents?: string[] | null;
            };
            Relationships: [{
                foreignKeyName: "operator_bank_details_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        operator_performance_metrics: {
            Row: {
                average_session_duration: number;
                created_at: string;
                customer_satisfaction_score: number | null;
                id: string;
                metric_date: string;
                occupancy_rate: number;
                occupied_spots: number;
                operator_id: string;
                response_time_avg: number | null;
                total_revenue: number;
                total_spots: number;
                transaction_count: number;
                violation_reports: number;
            };
            Insert: {
                average_session_duration?: number;
                created_at?: string;
                customer_satisfaction_score?: number | null;
                id?: string;
                metric_date?: string;
                occupancy_rate?: number;
                occupied_spots?: number;
                operator_id: string;
                response_time_avg?: number | null;
                total_revenue?: number;
                total_spots?: number;
                transaction_count?: number;
                violation_reports?: number;
            };
            Update: {
                average_session_duration?: number;
                created_at?: string;
                customer_satisfaction_score?: number | null;
                id?: string;
                metric_date?: string;
                occupancy_rate?: number;
                occupied_spots?: number;
                operator_id?: string;
                response_time_avg?: number | null;
                total_revenue?: number;
                total_spots?: number;
                transaction_count?: number;
                violation_reports?: number;
            };
            Relationships: [{
                foreignKeyName: "operator_performance_metrics_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        operator_profiles: {
            Row: {
                business_address: import("../types/database").Json;
                business_registration_number: string | null;
                business_type: string | null;
                company_name: string;
                contact_email: string;
                contact_person: string;
                contact_phone: string;
                created_at: string;
                id: string;
                is_verified: boolean;
                license_expiry_date: string | null;
                license_number: string | null;
                operator_id: string;
                tax_identification_number: string | null;
                updated_at: string;
                verification_documents: string[] | null;
                website_url: string | null;
            };
            Insert: {
                business_address: import("../types/database").Json;
                business_registration_number?: string | null;
                business_type?: string | null;
                company_name: string;
                contact_email: string;
                contact_person: string;
                contact_phone: string;
                created_at?: string;
                id?: string;
                is_verified?: boolean;
                license_expiry_date?: string | null;
                license_number?: string | null;
                operator_id: string;
                tax_identification_number?: string | null;
                updated_at?: string;
                verification_documents?: string[] | null;
                website_url?: string | null;
            };
            Update: {
                business_address?: import("../types/database").Json;
                business_registration_number?: string | null;
                business_type?: string | null;
                company_name?: string;
                contact_email?: string;
                contact_person?: string;
                contact_phone?: string;
                created_at?: string;
                id?: string;
                is_verified?: boolean;
                license_expiry_date?: string | null;
                license_number?: string | null;
                operator_id?: string;
                tax_identification_number?: string | null;
                updated_at?: string;
                verification_documents?: string[] | null;
                website_url?: string | null;
            };
            Relationships: [{
                foreignKeyName: "operator_profiles_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: true;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        operator_remittances: {
            Row: {
                bank_detail_id: string;
                created_at: string;
                failure_reason: string | null;
                id: string;
                notes: string | null;
                operator_id: string;
                operator_share: number;
                park_angel_share: number;
                payment_reference: string | null;
                period_end: string;
                period_start: string;
                processed_at: string | null;
                processed_by: string | null;
                status: string;
                total_revenue: number;
                transaction_count: number;
                updated_at: string;
            };
            Insert: {
                bank_detail_id: string;
                created_at?: string;
                failure_reason?: string | null;
                id?: string;
                notes?: string | null;
                operator_id: string;
                operator_share: number;
                park_angel_share: number;
                payment_reference?: string | null;
                period_end: string;
                period_start: string;
                processed_at?: string | null;
                processed_by?: string | null;
                status?: string;
                total_revenue: number;
                transaction_count?: number;
                updated_at?: string;
            };
            Update: {
                bank_detail_id?: string;
                created_at?: string;
                failure_reason?: string | null;
                id?: string;
                notes?: string | null;
                operator_id?: string;
                operator_share?: number;
                park_angel_share?: number;
                payment_reference?: string | null;
                period_end?: string;
                period_start?: string;
                processed_at?: string | null;
                processed_by?: string | null;
                status?: string;
                total_revenue?: number;
                transaction_count?: number;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "operator_remittances_bank_detail_id_fkey";
                columns: ["bank_detail_id"];
                isOneToOne: false;
                referencedRelation: "operator_bank_details";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "operator_remittances_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "operator_remittances_processed_by_fkey";
                columns: ["processed_by"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        operator_report_exports: {
            Row: {
                created_at: string;
                expires_at: string;
                file_name: string;
                file_path: string;
                file_size: number;
                format: string;
                id: string;
                mime_type: string;
                options: import("../types/database").Json;
                report_id: string;
                status: string;
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                expires_at?: string;
                file_name: string;
                file_path: string;
                file_size?: number;
                format: string;
                id?: string;
                mime_type: string;
                options?: import("../types/database").Json;
                report_id: string;
                status?: string;
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                expires_at?: string;
                file_name?: string;
                file_path?: string;
                file_size?: number;
                format?: string;
                id?: string;
                mime_type?: string;
                options?: import("../types/database").Json;
                report_id?: string;
                status?: string;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "operator_report_exports_report_id_fkey";
                columns: ["report_id"];
                isOneToOne: false;
                referencedRelation: "operator_reports";
                referencedColumns: ["id"];
            }];
        };
        operator_reports: {
            Row: {
                created_at: string;
                data: import("../types/database").Json;
                description: string | null;
                generated_at: string;
                generated_by: string;
                id: string;
                metadata: import("../types/database").Json;
                operator_id: string;
                parameters: import("../types/database").Json;
                title: string;
                type: string;
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                data?: import("../types/database").Json;
                description?: string | null;
                generated_at?: string;
                generated_by: string;
                id?: string;
                metadata?: import("../types/database").Json;
                operator_id: string;
                parameters?: import("../types/database").Json;
                title: string;
                type: string;
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                data?: import("../types/database").Json;
                description?: string | null;
                generated_at?: string;
                generated_by?: string;
                id?: string;
                metadata?: import("../types/database").Json;
                operator_id?: string;
                parameters?: import("../types/database").Json;
                title?: string;
                type?: string;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "operator_reports_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        operator_revenue_configs: {
            Row: {
                created_at: string;
                created_by: string;
                effective_date: string;
                id: string;
                is_active: boolean;
                operator_id: string;
                operator_percentage: number;
                park_angel_percentage: number;
                parking_type: Database["public"]["Enums"]["parking_type"];
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                created_by: string;
                effective_date?: string;
                id?: string;
                is_active?: boolean;
                operator_id: string;
                operator_percentage: number;
                park_angel_percentage: number;
                parking_type: Database["public"]["Enums"]["parking_type"];
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                created_by?: string;
                effective_date?: string;
                id?: string;
                is_active?: boolean;
                operator_id?: string;
                operator_percentage?: number;
                park_angel_percentage?: number;
                parking_type?: Database["public"]["Enums"]["parking_type"];
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "operator_revenue_configs_created_by_fkey";
                columns: ["created_by"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "operator_revenue_configs_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        operator_scheduled_reports: {
            Row: {
                created_at: string;
                id: string;
                is_active: boolean;
                last_run_at: string | null;
                next_run_at: string | null;
                operator_id: string;
                parameters: import("../types/database").Json;
                report_type: string;
                schedule: string;
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                id?: string;
                is_active?: boolean;
                last_run_at?: string | null;
                next_run_at?: string | null;
                operator_id: string;
                parameters?: import("../types/database").Json;
                report_type: string;
                schedule: string;
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                id?: string;
                is_active?: boolean;
                last_run_at?: string | null;
                next_run_at?: string | null;
                operator_id?: string;
                parameters?: import("../types/database").Json;
                report_type?: string;
                schedule?: string;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "operator_scheduled_reports_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        parking_spots: {
            Row: {
                amenities: string[] | null;
                coordinates: import("../types/database").Json;
                created_at: string;
                id: string;
                number: string;
                pricing_config: import("../types/database").Json | null;
                status: Database["public"]["Enums"]["spot_status"];
                type: string;
                updated_at: string;
                zone_id: string;
            };
            Insert: {
                amenities?: string[] | null;
                coordinates: import("../types/database").Json;
                created_at?: string;
                id?: string;
                number: string;
                pricing_config?: import("../types/database").Json | null;
                status?: Database["public"]["Enums"]["spot_status"];
                type: string;
                updated_at?: string;
                zone_id: string;
            };
            Update: {
                amenities?: string[] | null;
                coordinates?: import("../types/database").Json;
                created_at?: string;
                id?: string;
                number?: string;
                pricing_config?: import("../types/database").Json | null;
                status?: Database["public"]["Enums"]["spot_status"];
                type?: string;
                updated_at?: string;
                zone_id?: string;
            };
            Relationships: [{
                foreignKeyName: "parking_spots_zone_id_fkey";
                columns: ["zone_id"];
                isOneToOne: false;
                referencedRelation: "parking_hierarchy_view";
                referencedColumns: ["zone_id"];
            }, {
                foreignKeyName: "parking_spots_zone_id_fkey";
                columns: ["zone_id"];
                isOneToOne: false;
                referencedRelation: "zones";
                referencedColumns: ["id"];
            }];
        };
        payment_intents: {
            Row: {
                amount: number;
                booking_id: string;
                client_secret: string | null;
                created_at: string;
                currency: string;
                expires_at: string;
                id: string;
                metadata: import("../types/database").Json;
                provider: Database["public"]["Enums"]["payment_provider"];
                status: Database["public"]["Enums"]["payment_intent_status"];
                user_id: string;
            };
            Insert: {
                amount: number;
                booking_id: string;
                client_secret?: string | null;
                created_at?: string;
                currency?: string;
                expires_at: string;
                id: string;
                metadata?: import("../types/database").Json;
                provider: Database["public"]["Enums"]["payment_provider"];
                status?: Database["public"]["Enums"]["payment_intent_status"];
                user_id: string;
            };
            Update: {
                amount?: number;
                booking_id?: string;
                client_secret?: string | null;
                created_at?: string;
                currency?: string;
                expires_at?: string;
                id?: string;
                metadata?: import("../types/database").Json;
                provider?: Database["public"]["Enums"]["payment_provider"];
                status?: Database["public"]["Enums"]["payment_intent_status"];
                user_id?: string;
            };
            Relationships: [{
                foreignKeyName: "payment_intents_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        payment_methods: {
            Row: {
                created_at: string;
                id: string;
                is_default: boolean;
                metadata: import("../types/database").Json;
                provider: Database["public"]["Enums"]["payment_provider"];
                type: Database["public"]["Enums"]["payment_method_type"];
                updated_at: string;
                user_id: string;
            };
            Insert: {
                created_at?: string;
                id?: string;
                is_default?: boolean;
                metadata?: import("../types/database").Json;
                provider: Database["public"]["Enums"]["payment_provider"];
                type: Database["public"]["Enums"]["payment_method_type"];
                updated_at?: string;
                user_id: string;
            };
            Update: {
                created_at?: string;
                id?: string;
                is_default?: boolean;
                metadata?: import("../types/database").Json;
                provider?: Database["public"]["Enums"]["payment_provider"];
                type?: Database["public"]["Enums"]["payment_method_type"];
                updated_at?: string;
                user_id?: string;
            };
            Relationships: [{
                foreignKeyName: "payment_methods_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        payment_transactions: {
            Row: {
                amount: number;
                booking_id: string;
                created_at: string;
                currency: string;
                failed_at: string | null;
                id: string;
                metadata: import("../types/database").Json;
                payment_method_id: string | null;
                processed_at: string | null;
                provider: Database["public"]["Enums"]["payment_provider"];
                provider_transaction_id: string | null;
                refunded_at: string | null;
                status: Database["public"]["Enums"]["payment_transaction_status"];
                updated_at: string;
                user_id: string;
            };
            Insert: {
                amount: number;
                booking_id: string;
                created_at?: string;
                currency?: string;
                failed_at?: string | null;
                id: string;
                metadata?: import("../types/database").Json;
                payment_method_id?: string | null;
                processed_at?: string | null;
                provider: Database["public"]["Enums"]["payment_provider"];
                provider_transaction_id?: string | null;
                refunded_at?: string | null;
                status?: Database["public"]["Enums"]["payment_transaction_status"];
                updated_at?: string;
                user_id: string;
            };
            Update: {
                amount?: number;
                booking_id?: string;
                created_at?: string;
                currency?: string;
                failed_at?: string | null;
                id?: string;
                metadata?: import("../types/database").Json;
                payment_method_id?: string | null;
                processed_at?: string | null;
                provider?: Database["public"]["Enums"]["payment_provider"];
                provider_transaction_id?: string | null;
                refunded_at?: string | null;
                status?: Database["public"]["Enums"]["payment_transaction_status"];
                updated_at?: string;
                user_id?: string;
            };
            Relationships: [{
                foreignKeyName: "payment_transactions_payment_method_id_fkey";
                columns: ["payment_method_id"];
                isOneToOne: false;
                referencedRelation: "payment_methods";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "payment_transactions_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        payouts: {
            Row: {
                amount: number;
                bank_account_id: string;
                created_at: string;
                currency: string;
                failed_at: string | null;
                id: string;
                metadata: import("../types/database").Json;
                processed_at: string | null;
                recipient_id: string;
                recipient_type: string;
                status: Database["public"]["Enums"]["payout_status"];
                transaction_ids: string[];
            };
            Insert: {
                amount: number;
                bank_account_id: string;
                created_at?: string;
                currency?: string;
                failed_at?: string | null;
                id: string;
                metadata?: import("../types/database").Json;
                processed_at?: string | null;
                recipient_id: string;
                recipient_type: string;
                status?: Database["public"]["Enums"]["payout_status"];
                transaction_ids?: string[];
            };
            Update: {
                amount?: number;
                bank_account_id?: string;
                created_at?: string;
                currency?: string;
                failed_at?: string | null;
                id?: string;
                metadata?: import("../types/database").Json;
                processed_at?: string | null;
                recipient_id?: string;
                recipient_type?: string;
                status?: Database["public"]["Enums"]["payout_status"];
                transaction_ids?: string[];
            };
            Relationships: [{
                foreignKeyName: "payouts_bank_account_id_fkey";
                columns: ["bank_account_id"];
                isOneToOne: false;
                referencedRelation: "bank_accounts";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "payouts_recipient_id_fkey";
                columns: ["recipient_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        performance_metrics: {
            Row: {
                created_at: string;
                feature: string;
                id: string;
                metadata: import("../types/database").Json | null;
                response_time: number;
                user_id: string | null;
            };
            Insert: {
                created_at?: string;
                feature: string;
                id?: string;
                metadata?: import("../types/database").Json | null;
                response_time: number;
                user_id?: string | null;
            };
            Update: {
                created_at?: string;
                feature?: string;
                id?: string;
                metadata?: import("../types/database").Json | null;
                response_time?: number;
                user_id?: string | null;
            };
            Relationships: [{
                foreignKeyName: "performance_metrics_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        pos_cash_remittances: {
            Row: {
                amount: number;
                created_at: string;
                deposit_date: string;
                deposit_method: string;
                id: string;
                notes: string | null;
                operator_id: string;
                reference_number: string | null;
                session_id: string;
                status: string;
                updated_at: string;
                verified_at: string | null;
                verified_by: string | null;
            };
            Insert: {
                amount: number;
                created_at?: string;
                deposit_date: string;
                deposit_method: string;
                id?: string;
                notes?: string | null;
                operator_id: string;
                reference_number?: string | null;
                session_id: string;
                status?: string;
                updated_at?: string;
                verified_at?: string | null;
                verified_by?: string | null;
            };
            Update: {
                amount?: number;
                created_at?: string;
                deposit_date?: string;
                deposit_method?: string;
                id?: string;
                notes?: string | null;
                operator_id?: string;
                reference_number?: string | null;
                session_id?: string;
                status?: string;
                updated_at?: string;
                verified_at?: string | null;
                verified_by?: string | null;
            };
            Relationships: [{
                foreignKeyName: "pos_cash_remittances_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "pos_cash_remittances_session_id_fkey";
                columns: ["session_id"];
                isOneToOne: false;
                referencedRelation: "active_pos_sessions_view";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "pos_cash_remittances_session_id_fkey";
                columns: ["session_id"];
                isOneToOne: false;
                referencedRelation: "pos_sessions";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "pos_cash_remittances_verified_by_fkey";
                columns: ["verified_by"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        pos_hardware_status: {
            Row: {
                biometric: import("../types/database").Json;
                cash_drawer: import("../types/database").Json;
                created_at: string;
                id: string;
                last_updated: string;
                printer: import("../types/database").Json;
                scanner: import("../types/database").Json;
                session_id: string;
            };
            Insert: {
                biometric?: import("../types/database").Json;
                cash_drawer?: import("../types/database").Json;
                created_at?: string;
                id?: string;
                last_updated?: string;
                printer?: import("../types/database").Json;
                scanner?: import("../types/database").Json;
                session_id: string;
            };
            Update: {
                biometric?: import("../types/database").Json;
                cash_drawer?: import("../types/database").Json;
                created_at?: string;
                id?: string;
                last_updated?: string;
                printer?: import("../types/database").Json;
                scanner?: import("../types/database").Json;
                session_id?: string;
            };
            Relationships: [{
                foreignKeyName: "pos_hardware_status_session_id_fkey";
                columns: ["session_id"];
                isOneToOne: false;
                referencedRelation: "active_pos_sessions_view";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "pos_hardware_status_session_id_fkey";
                columns: ["session_id"];
                isOneToOne: false;
                referencedRelation: "pos_sessions";
                referencedColumns: ["id"];
            }];
        };
        pos_receipts: {
            Row: {
                created_at: string;
                id: string;
                last_print_attempt: string | null;
                print_attempts: number | null;
                print_status: string;
                receipt_data: import("../types/database").Json;
                receipt_number: string;
                transaction_id: string;
            };
            Insert: {
                created_at?: string;
                id?: string;
                last_print_attempt?: string | null;
                print_attempts?: number | null;
                print_status?: string;
                receipt_data: import("../types/database").Json;
                receipt_number: string;
                transaction_id: string;
            };
            Update: {
                created_at?: string;
                id?: string;
                last_print_attempt?: string | null;
                print_attempts?: number | null;
                print_status?: string;
                receipt_data?: import("../types/database").Json;
                receipt_number?: string;
                transaction_id?: string;
            };
            Relationships: [{
                foreignKeyName: "pos_receipts_transaction_id_fkey";
                columns: ["transaction_id"];
                isOneToOne: false;
                referencedRelation: "pos_transaction_summary_view";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "pos_receipts_transaction_id_fkey";
                columns: ["transaction_id"];
                isOneToOne: false;
                referencedRelation: "pos_transactions";
                referencedColumns: ["id"];
            }];
        };
        pos_sessions: {
            Row: {
                cash_difference: number | null;
                created_at: string;
                current_cash_amount: number;
                end_cash_amount: number | null;
                end_time: string | null;
                id: string;
                location_id: string;
                notes: string | null;
                operator_id: string;
                previous_cash_amount: number;
                start_time: string;
                status: string;
                updated_at: string;
            };
            Insert: {
                cash_difference?: number | null;
                created_at?: string;
                current_cash_amount: number;
                end_cash_amount?: number | null;
                end_time?: string | null;
                id?: string;
                location_id: string;
                notes?: string | null;
                operator_id: string;
                previous_cash_amount: number;
                start_time?: string;
                status?: string;
                updated_at?: string;
            };
            Update: {
                cash_difference?: number | null;
                created_at?: string;
                current_cash_amount?: number;
                end_cash_amount?: number | null;
                end_time?: string | null;
                id?: string;
                location_id?: string;
                notes?: string | null;
                operator_id?: string;
                previous_cash_amount?: number;
                start_time?: string;
                status?: string;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "pos_sessions_location_id_fkey";
                columns: ["location_id"];
                isOneToOne: false;
                referencedRelation: "locations";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "pos_sessions_location_id_fkey";
                columns: ["location_id"];
                isOneToOne: false;
                referencedRelation: "parking_hierarchy_view";
                referencedColumns: ["location_id"];
            }, {
                foreignKeyName: "pos_sessions_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        pos_shift_reports: {
            Row: {
                cash_over_short: number;
                created_at: string;
                generated_at: string;
                id: string;
                parking_sessions_created: number;
                report_data: import("../types/database").Json;
                session_id: string;
                total_cash_collected: number;
                total_discounts_given: number;
                total_transactions: number;
                total_vat_collected: number;
                violations_reported: number;
            };
            Insert: {
                cash_over_short?: number;
                created_at?: string;
                generated_at?: string;
                id?: string;
                parking_sessions_created?: number;
                report_data?: import("../types/database").Json;
                session_id: string;
                total_cash_collected?: number;
                total_discounts_given?: number;
                total_transactions?: number;
                total_vat_collected?: number;
                violations_reported?: number;
            };
            Update: {
                cash_over_short?: number;
                created_at?: string;
                generated_at?: string;
                id?: string;
                parking_sessions_created?: number;
                report_data?: import("../types/database").Json;
                session_id?: string;
                total_cash_collected?: number;
                total_discounts_given?: number;
                total_transactions?: number;
                total_vat_collected?: number;
                violations_reported?: number;
            };
            Relationships: [{
                foreignKeyName: "pos_shift_reports_session_id_fkey";
                columns: ["session_id"];
                isOneToOne: false;
                referencedRelation: "active_pos_sessions_view";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "pos_shift_reports_session_id_fkey";
                columns: ["session_id"];
                isOneToOne: false;
                referencedRelation: "pos_sessions";
                referencedColumns: ["id"];
            }];
        };
        pos_transactions: {
            Row: {
                amount: number;
                change_amount: number | null;
                created_at: string;
                description: string;
                discount_type: string | null;
                id: string;
                metadata: import("../types/database").Json | null;
                parking_session_id: string | null;
                payment_method: string;
                receipt_number: string;
                session_id: string;
                type: string;
                vat_amount: number | null;
                vehicle_plate_number: string | null;
            };
            Insert: {
                amount: number;
                change_amount?: number | null;
                created_at?: string;
                description: string;
                discount_type?: string | null;
                id?: string;
                metadata?: import("../types/database").Json | null;
                parking_session_id?: string | null;
                payment_method?: string;
                receipt_number: string;
                session_id: string;
                type: string;
                vat_amount?: number | null;
                vehicle_plate_number?: string | null;
            };
            Update: {
                amount?: number;
                change_amount?: number | null;
                created_at?: string;
                description?: string;
                discount_type?: string | null;
                id?: string;
                metadata?: import("../types/database").Json | null;
                parking_session_id?: string | null;
                payment_method?: string;
                receipt_number?: string;
                session_id?: string;
                type?: string;
                vat_amount?: number | null;
                vehicle_plate_number?: string | null;
            };
            Relationships: [{
                foreignKeyName: "pos_transactions_parking_session_id_fkey";
                columns: ["parking_session_id"];
                isOneToOne: false;
                referencedRelation: "active_bookings_view";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "pos_transactions_parking_session_id_fkey";
                columns: ["parking_session_id"];
                isOneToOne: false;
                referencedRelation: "bookings";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "pos_transactions_session_id_fkey";
                columns: ["session_id"];
                isOneToOne: false;
                referencedRelation: "active_pos_sessions_view";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "pos_transactions_session_id_fkey";
                columns: ["session_id"];
                isOneToOne: false;
                referencedRelation: "pos_sessions";
                referencedColumns: ["id"];
            }];
        };
        rating_aggregates: {
            Row: {
                average_score: number;
                created_at: string;
                id: string;
                rated_id: string;
                rated_type: Database["public"]["Enums"]["rated_type"];
                score_distribution: import("../types/database").Json;
                total_ratings: number;
                updated_at: string;
            };
            Insert: {
                average_score?: number;
                created_at?: string;
                id?: string;
                rated_id: string;
                rated_type: Database["public"]["Enums"]["rated_type"];
                score_distribution?: import("../types/database").Json;
                total_ratings?: number;
                updated_at?: string;
            };
            Update: {
                average_score?: number;
                created_at?: string;
                id?: string;
                rated_id?: string;
                rated_type?: Database["public"]["Enums"]["rated_type"];
                score_distribution?: import("../types/database").Json;
                total_ratings?: number;
                updated_at?: string;
            };
            Relationships: [];
        };
        ratings: {
            Row: {
                booking_id: string;
                created_at: string;
                id: string;
                is_verified: boolean | null;
                moderated_at: string | null;
                moderation_reason: string | null;
                photos: string[] | null;
                rated_id: string;
                rated_type: Database["public"]["Enums"]["rated_type"];
                rater_id: string;
                review: string | null;
                score: number;
                status: string | null;
                updated_at: string | null;
                verified_at: string | null;
            };
            Insert: {
                booking_id: string;
                created_at?: string;
                id?: string;
                is_verified?: boolean | null;
                moderated_at?: string | null;
                moderation_reason?: string | null;
                photos?: string[] | null;
                rated_id: string;
                rated_type: Database["public"]["Enums"]["rated_type"];
                rater_id: string;
                review?: string | null;
                score: number;
                status?: string | null;
                updated_at?: string | null;
                verified_at?: string | null;
            };
            Update: {
                booking_id?: string;
                created_at?: string;
                id?: string;
                is_verified?: boolean | null;
                moderated_at?: string | null;
                moderation_reason?: string | null;
                photos?: string[] | null;
                rated_id?: string;
                rated_type?: Database["public"]["Enums"]["rated_type"];
                rater_id?: string;
                review?: string | null;
                score?: number;
                status?: string | null;
                updated_at?: string | null;
                verified_at?: string | null;
            };
            Relationships: [{
                foreignKeyName: "ratings_booking_id_fkey";
                columns: ["booking_id"];
                isOneToOne: false;
                referencedRelation: "active_bookings_view";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "ratings_booking_id_fkey";
                columns: ["booking_id"];
                isOneToOne: false;
                referencedRelation: "bookings";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "ratings_rated_id_fkey";
                columns: ["rated_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "ratings_rater_id_fkey";
                columns: ["rater_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        reconciliation_results: {
            Row: {
                corrected_count: number;
                created_at: string;
                discrepancy_count: number;
                end_date: string;
                id: string;
                passed: boolean;
                rule_id: string;
                rule_name: string;
                start_date: string;
            };
            Insert: {
                corrected_count?: number;
                created_at?: string;
                discrepancy_count?: number;
                end_date: string;
                id: string;
                passed: boolean;
                rule_id: string;
                rule_name: string;
                start_date: string;
            };
            Update: {
                corrected_count?: number;
                created_at?: string;
                discrepancy_count?: number;
                end_date?: string;
                id?: string;
                passed?: boolean;
                rule_id?: string;
                rule_name?: string;
                start_date?: string;
            };
            Relationships: [{
                foreignKeyName: "reconciliation_results_rule_id_fkey";
                columns: ["rule_id"];
                isOneToOne: false;
                referencedRelation: "reconciliation_rules";
                referencedColumns: ["id"];
            }];
        };
        reconciliation_rules: {
            Row: {
                actions: import("../types/database").Json;
                conditions: import("../types/database").Json;
                created_at: string;
                description: string | null;
                id: string;
                is_active: boolean;
                name: string;
                rule_type: Database["public"]["Enums"]["reconciliation_rule_type"];
                updated_at: string;
            };
            Insert: {
                actions?: import("../types/database").Json;
                conditions?: import("../types/database").Json;
                created_at?: string;
                description?: string | null;
                id: string;
                is_active?: boolean;
                name: string;
                rule_type: Database["public"]["Enums"]["reconciliation_rule_type"];
                updated_at?: string;
            };
            Update: {
                actions?: import("../types/database").Json;
                conditions?: import("../types/database").Json;
                created_at?: string;
                description?: string | null;
                id?: string;
                is_active?: boolean;
                name?: string;
                rule_type?: Database["public"]["Enums"]["reconciliation_rule_type"];
                updated_at?: string;
            };
            Relationships: [];
        };
        remittance_runs: {
            Row: {
                amount: number;
                completed_at: string | null;
                created_at: string;
                error_message: string | null;
                failed_at: string | null;
                id: string;
                payout_id: string | null;
                recipient_id: string;
                recipient_type: string;
                run_date: string;
                schedule_id: string;
                status: Database["public"]["Enums"]["remittance_status"];
                transaction_ids: string[];
            };
            Insert: {
                amount: number;
                completed_at?: string | null;
                created_at?: string;
                error_message?: string | null;
                failed_at?: string | null;
                id: string;
                payout_id?: string | null;
                recipient_id: string;
                recipient_type: string;
                run_date?: string;
                schedule_id: string;
                status?: Database["public"]["Enums"]["remittance_status"];
                transaction_ids?: string[];
            };
            Update: {
                amount?: number;
                completed_at?: string | null;
                created_at?: string;
                error_message?: string | null;
                failed_at?: string | null;
                id?: string;
                payout_id?: string | null;
                recipient_id?: string;
                recipient_type?: string;
                run_date?: string;
                schedule_id?: string;
                status?: Database["public"]["Enums"]["remittance_status"];
                transaction_ids?: string[];
            };
            Relationships: [{
                foreignKeyName: "remittance_runs_payout_id_fkey";
                columns: ["payout_id"];
                isOneToOne: false;
                referencedRelation: "payouts";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "remittance_runs_recipient_id_fkey";
                columns: ["recipient_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "remittance_runs_schedule_id_fkey";
                columns: ["schedule_id"];
                isOneToOne: false;
                referencedRelation: "remittance_schedules";
                referencedColumns: ["id"];
            }];
        };
        remittance_schedules: {
            Row: {
                bank_account_id: string;
                created_at: string;
                frequency: Database["public"]["Enums"]["remittance_frequency"];
                id: string;
                is_active: boolean;
                last_run_date: string | null;
                minimum_amount: number;
                next_run_date: string;
                recipient_id: string;
                recipient_type: string;
                updated_at: string;
            };
            Insert: {
                bank_account_id: string;
                created_at?: string;
                frequency: Database["public"]["Enums"]["remittance_frequency"];
                id: string;
                is_active?: boolean;
                last_run_date?: string | null;
                minimum_amount?: number;
                next_run_date: string;
                recipient_id: string;
                recipient_type: string;
                updated_at?: string;
            };
            Update: {
                bank_account_id?: string;
                created_at?: string;
                frequency?: Database["public"]["Enums"]["remittance_frequency"];
                id?: string;
                is_active?: boolean;
                last_run_date?: string | null;
                minimum_amount?: number;
                next_run_date?: string;
                recipient_id?: string;
                recipient_type?: string;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "remittance_schedules_bank_account_id_fkey";
                columns: ["bank_account_id"];
                isOneToOne: false;
                referencedRelation: "bank_accounts";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "remittance_schedules_recipient_id_fkey";
                columns: ["recipient_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        report_exports: {
            Row: {
                download_url: string | null;
                expires_at: string | null;
                exported_at: string | null;
                exported_by: string | null;
                file_name: string;
                file_size: number | null;
                format: string;
                id: string;
                report_id: string;
            };
            Insert: {
                download_url?: string | null;
                expires_at?: string | null;
                exported_at?: string | null;
                exported_by?: string | null;
                file_name: string;
                file_size?: number | null;
                format: string;
                id?: string;
                report_id: string;
            };
            Update: {
                download_url?: string | null;
                expires_at?: string | null;
                exported_at?: string | null;
                exported_by?: string | null;
                file_name?: string;
                file_size?: number | null;
                format?: string;
                id?: string;
                report_id?: string;
            };
            Relationships: [];
        };
        reputation_scores: {
            Row: {
                average_score: number;
                created_at: string;
                id: string;
                reputation_level: string;
                total_ratings: number;
                trust_score: number;
                updated_at: string;
                user_id: string;
                user_type: Database["public"]["Enums"]["user_type"];
                verification_badges: string[] | null;
            };
            Insert: {
                average_score?: number;
                created_at?: string;
                id?: string;
                reputation_level?: string;
                total_ratings?: number;
                trust_score?: number;
                updated_at?: string;
                user_id: string;
                user_type: Database["public"]["Enums"]["user_type"];
                verification_badges?: string[] | null;
            };
            Update: {
                average_score?: number;
                created_at?: string;
                id?: string;
                reputation_level?: string;
                total_ratings?: number;
                trust_score?: number;
                updated_at?: string;
                user_id?: string;
                user_type?: Database["public"]["Enums"]["user_type"];
                verification_badges?: string[] | null;
            };
            Relationships: [{
                foreignKeyName: "reputation_scores_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        revenue_share_configs: {
            Row: {
                created_at: string;
                host_percentage: number | null;
                operator_percentage: number | null;
                park_angel_percentage: number;
                parking_type: Database["public"]["Enums"]["parking_type"];
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                host_percentage?: number | null;
                operator_percentage?: number | null;
                park_angel_percentage: number;
                parking_type: Database["public"]["Enums"]["parking_type"];
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                host_percentage?: number | null;
                operator_percentage?: number | null;
                park_angel_percentage?: number;
                parking_type?: Database["public"]["Enums"]["parking_type"];
                updated_at?: string;
            };
            Relationships: [];
        };
        revenue_shares: {
            Row: {
                booking_id: string;
                calculated_at: string;
                created_at: string;
                gross_amount: number;
                host_id: string | null;
                host_share: number | null;
                id: string;
                net_amount: number;
                operator_id: string;
                operator_share: number;
                park_angel_share: number;
                platform_fee: number;
                share_percentage: number;
                total_amount: number;
                transaction_id: string | null;
            };
            Insert: {
                booking_id: string;
                calculated_at?: string;
                created_at?: string;
                gross_amount: number;
                host_id?: string | null;
                host_share?: number | null;
                id?: string;
                net_amount: number;
                operator_id: string;
                operator_share: number;
                park_angel_share?: number;
                platform_fee: number;
                share_percentage: number;
                total_amount?: number;
                transaction_id?: string | null;
            };
            Update: {
                booking_id?: string;
                calculated_at?: string;
                created_at?: string;
                gross_amount?: number;
                host_id?: string | null;
                host_share?: number | null;
                id?: string;
                net_amount?: number;
                operator_id?: string;
                operator_share?: number;
                park_angel_share?: number;
                platform_fee?: number;
                share_percentage?: number;
                total_amount?: number;
                transaction_id?: string | null;
            };
            Relationships: [{
                foreignKeyName: "revenue_shares_booking_id_fkey";
                columns: ["booking_id"];
                isOneToOne: false;
                referencedRelation: "active_bookings_view";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "revenue_shares_booking_id_fkey";
                columns: ["booking_id"];
                isOneToOne: false;
                referencedRelation: "bookings";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "revenue_shares_host_id_fkey";
                columns: ["host_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "revenue_shares_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        review_moderation_queue: {
            Row: {
                created_at: string;
                id: string;
                moderator_id: string | null;
                moderator_notes: string | null;
                rating_id: string;
                report_details: string | null;
                report_reason: string;
                reported_by: string | null;
                status: string;
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                id?: string;
                moderator_id?: string | null;
                moderator_notes?: string | null;
                rating_id: string;
                report_details?: string | null;
                report_reason: string;
                reported_by?: string | null;
                status?: string;
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                id?: string;
                moderator_id?: string | null;
                moderator_notes?: string | null;
                rating_id?: string;
                report_details?: string | null;
                report_reason?: string;
                reported_by?: string | null;
                status?: string;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "review_moderation_queue_moderator_id_fkey";
                columns: ["moderator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "review_moderation_queue_rating_id_fkey";
                columns: ["rating_id"];
                isOneToOne: false;
                referencedRelation: "ratings";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "review_moderation_queue_reported_by_fkey";
                columns: ["reported_by"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        scheduled_reports: {
            Row: {
                created_at: string | null;
                created_by: string | null;
                id: string;
                is_active: boolean | null;
                last_run: string | null;
                name: string;
                next_run: string;
                parameters: import("../types/database").Json;
                recipients: string[];
                report_type_id: string;
                schedule: import("../types/database").Json;
                updated_at: string | null;
            };
            Insert: {
                created_at?: string | null;
                created_by?: string | null;
                id: string;
                is_active?: boolean | null;
                last_run?: string | null;
                name: string;
                next_run: string;
                parameters?: import("../types/database").Json;
                recipients?: string[];
                report_type_id: string;
                schedule: import("../types/database").Json;
                updated_at?: string | null;
            };
            Update: {
                created_at?: string | null;
                created_by?: string | null;
                id?: string;
                is_active?: boolean | null;
                last_run?: string | null;
                name?: string;
                next_run?: string;
                parameters?: import("../types/database").Json;
                recipients?: string[];
                report_type_id?: string;
                schedule?: import("../types/database").Json;
                updated_at?: string | null;
            };
            Relationships: [];
        };
        sections: {
            Row: {
                created_at: string;
                id: string;
                location_id: string;
                name: string;
                pricing_config: import("../types/database").Json | null;
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                id?: string;
                location_id: string;
                name: string;
                pricing_config?: import("../types/database").Json | null;
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                id?: string;
                location_id?: string;
                name?: string;
                pricing_config?: import("../types/database").Json | null;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "sections_location_id_fkey";
                columns: ["location_id"];
                isOneToOne: false;
                referencedRelation: "locations";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "sections_location_id_fkey";
                columns: ["location_id"];
                isOneToOne: false;
                referencedRelation: "parking_hierarchy_view";
                referencedColumns: ["location_id"];
            }];
        };
        sla_targets: {
            Row: {
                alert_threshold: number;
                created_at: string | null;
                escalation_rules: import("../types/database").Json | null;
                feature: string;
                id: string;
                target_response_time: number;
                updated_at: string | null;
            };
            Insert: {
                alert_threshold: number;
                created_at?: string | null;
                escalation_rules?: import("../types/database").Json | null;
                feature: string;
                id?: string;
                target_response_time: number;
                updated_at?: string | null;
            };
            Update: {
                alert_threshold?: number;
                created_at?: string | null;
                escalation_rules?: import("../types/database").Json | null;
                feature?: string;
                id?: string;
                target_response_time?: number;
                updated_at?: string | null;
            };
            Relationships: [];
        };
        social_proof: {
            Row: {
                created_at: string;
                entity_id: string;
                entity_type: string;
                expires_at: string | null;
                id: string;
                is_active: boolean;
                proof_data: import("../types/database").Json;
                proof_type: string;
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                entity_id: string;
                entity_type: string;
                expires_at?: string | null;
                id?: string;
                is_active?: boolean;
                proof_data?: import("../types/database").Json;
                proof_type: string;
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                entity_id?: string;
                entity_type?: string;
                expires_at?: string | null;
                id?: string;
                is_active?: boolean;
                proof_data?: import("../types/database").Json;
                proof_type?: string;
                updated_at?: string;
            };
            Relationships: [];
        };
        support_messages: {
            Row: {
                created_at: string | null;
                id: string;
                message: string;
                message_type: string | null;
                read_at: string | null;
                sender_id: string;
                sender_type: string;
                ticket_id: string;
            };
            Insert: {
                created_at?: string | null;
                id?: string;
                message: string;
                message_type?: string | null;
                read_at?: string | null;
                sender_id: string;
                sender_type: string;
                ticket_id: string;
            };
            Update: {
                created_at?: string | null;
                id?: string;
                message?: string;
                message_type?: string | null;
                read_at?: string | null;
                sender_id?: string;
                sender_type?: string;
                ticket_id?: string;
            };
            Relationships: [{
                foreignKeyName: "support_messages_ticket_id_fkey";
                columns: ["ticket_id"];
                isOneToOne: false;
                referencedRelation: "support_tickets";
                referencedColumns: ["id"];
            }];
        };
        support_tickets: {
            Row: {
                category: string | null;
                created_at: string | null;
                id: string;
                last_message_at: string | null;
                priority: string | null;
                status: string | null;
                subject: string;
                updated_at: string | null;
                user_id: string;
            };
            Insert: {
                category?: string | null;
                created_at?: string | null;
                id?: string;
                last_message_at?: string | null;
                priority?: string | null;
                status?: string | null;
                subject: string;
                updated_at?: string | null;
                user_id: string;
            };
            Update: {
                category?: string | null;
                created_at?: string | null;
                id?: string;
                last_message_at?: string | null;
                priority?: string | null;
                status?: string | null;
                subject?: string;
                updated_at?: string | null;
                user_id?: string;
            };
            Relationships: [];
        };
        system_config: {
            Row: {
                created_at: string;
                description: string | null;
                id: string;
                is_public: boolean;
                key: string;
                updated_at: string;
                updated_by: string | null;
                value: import("../types/database").Json;
            };
            Insert: {
                created_at?: string;
                description?: string | null;
                id?: string;
                is_public?: boolean;
                key: string;
                updated_at?: string;
                updated_by?: string | null;
                value: import("../types/database").Json;
            };
            Update: {
                created_at?: string;
                description?: string | null;
                id?: string;
                is_public?: boolean;
                key?: string;
                updated_at?: string;
                updated_by?: string | null;
                value?: import("../types/database").Json;
            };
            Relationships: [{
                foreignKeyName: "system_config_updated_by_fkey";
                columns: ["updated_by"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        transaction_logs: {
            Row: {
                amount: number;
                booking_id: string;
                created_at: string;
                currency: string;
                id: string;
                metadata: import("../types/database").Json | null;
                payment_method: string | null;
                payment_reference: string | null;
                processed_at: string | null;
                status: string;
                transaction_type: string;
            };
            Insert: {
                amount: number;
                booking_id: string;
                created_at?: string;
                currency?: string;
                id?: string;
                metadata?: import("../types/database").Json | null;
                payment_method?: string | null;
                payment_reference?: string | null;
                processed_at?: string | null;
                status?: string;
                transaction_type: string;
            };
            Update: {
                amount?: number;
                booking_id?: string;
                created_at?: string;
                currency?: string;
                id?: string;
                metadata?: import("../types/database").Json | null;
                payment_method?: string | null;
                payment_reference?: string | null;
                processed_at?: string | null;
                status?: string;
                transaction_type?: string;
            };
            Relationships: [{
                foreignKeyName: "transaction_logs_booking_id_fkey";
                columns: ["booking_id"];
                isOneToOne: false;
                referencedRelation: "active_bookings_view";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "transaction_logs_booking_id_fkey";
                columns: ["booking_id"];
                isOneToOne: false;
                referencedRelation: "bookings";
                referencedColumns: ["id"];
            }];
        };
        transactions: {
            Row: {
                amount: number;
                booking_id: string | null;
                created_at: string | null;
                discount_amount: number | null;
                id: string;
                payment_method: string;
                payment_reference: string | null;
                payment_status: string | null;
                total_amount: number;
                transaction_type: string | null;
                updated_at: string | null;
                user_id: string;
                vat_amount: number | null;
            };
            Insert: {
                amount: number;
                booking_id?: string | null;
                created_at?: string | null;
                discount_amount?: number | null;
                id?: string;
                payment_method: string;
                payment_reference?: string | null;
                payment_status?: string | null;
                total_amount: number;
                transaction_type?: string | null;
                updated_at?: string | null;
                user_id: string;
                vat_amount?: number | null;
            };
            Update: {
                amount?: number;
                booking_id?: string | null;
                created_at?: string | null;
                discount_amount?: number | null;
                id?: string;
                payment_method?: string;
                payment_reference?: string | null;
                payment_status?: string | null;
                total_amount?: number;
                transaction_type?: string | null;
                updated_at?: string | null;
                user_id?: string;
                vat_amount?: number | null;
            };
            Relationships: [{
                foreignKeyName: "transactions_booking_id_fkey";
                columns: ["booking_id"];
                isOneToOne: false;
                referencedRelation: "active_bookings_view";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "transactions_booking_id_fkey";
                columns: ["booking_id"];
                isOneToOne: false;
                referencedRelation: "bookings";
                referencedColumns: ["id"];
            }];
        };
        user_ai_preferences: {
            Row: {
                accessibility_required: boolean | null;
                avoid_locations: string[] | null;
                covered_parking_preferred: boolean | null;
                created_at: string | null;
                enable_ai_suggestions: boolean | null;
                flexible_timing: boolean | null;
                frequently_visited_locations: string[] | null;
                id: string;
                learning_enabled: boolean | null;
                max_walking_distance: number | null;
                notification_for_suggestions: boolean | null;
                preferred_amenities: string[] | null;
                preferred_booking_lead_time: number | null;
                preferred_parking_types: string[] | null;
                preferred_vehicle_id: string | null;
                price_sensitivity: string | null;
                security_level_preference: string | null;
                updated_at: string | null;
                user_id: string;
            };
            Insert: {
                accessibility_required?: boolean | null;
                avoid_locations?: string[] | null;
                covered_parking_preferred?: boolean | null;
                created_at?: string | null;
                enable_ai_suggestions?: boolean | null;
                flexible_timing?: boolean | null;
                frequently_visited_locations?: string[] | null;
                id?: string;
                learning_enabled?: boolean | null;
                max_walking_distance?: number | null;
                notification_for_suggestions?: boolean | null;
                preferred_amenities?: string[] | null;
                preferred_booking_lead_time?: number | null;
                preferred_parking_types?: string[] | null;
                preferred_vehicle_id?: string | null;
                price_sensitivity?: string | null;
                security_level_preference?: string | null;
                updated_at?: string | null;
                user_id: string;
            };
            Update: {
                accessibility_required?: boolean | null;
                avoid_locations?: string[] | null;
                covered_parking_preferred?: boolean | null;
                created_at?: string | null;
                enable_ai_suggestions?: boolean | null;
                flexible_timing?: boolean | null;
                frequently_visited_locations?: string[] | null;
                id?: string;
                learning_enabled?: boolean | null;
                max_walking_distance?: number | null;
                notification_for_suggestions?: boolean | null;
                preferred_amenities?: string[] | null;
                preferred_booking_lead_time?: number | null;
                preferred_parking_types?: string[] | null;
                preferred_vehicle_id?: string | null;
                price_sensitivity?: string | null;
                security_level_preference?: string | null;
                updated_at?: string | null;
                user_id?: string;
            };
            Relationships: [{
                foreignKeyName: "user_ai_preferences_preferred_vehicle_id_fkey";
                columns: ["preferred_vehicle_id"];
                isOneToOne: false;
                referencedRelation: "user_vehicles";
                referencedColumns: ["id"];
            }];
        };
        user_group_memberships: {
            Row: {
                created_at: string;
                group_id: string;
                id: string;
                user_id: string;
            };
            Insert: {
                created_at?: string;
                group_id: string;
                id?: string;
                user_id: string;
            };
            Update: {
                created_at?: string;
                group_id?: string;
                id?: string;
                user_id?: string;
            };
            Relationships: [{
                foreignKeyName: "user_group_memberships_group_id_fkey";
                columns: ["group_id"];
                isOneToOne: false;
                referencedRelation: "user_groups";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "user_group_memberships_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        user_groups: {
            Row: {
                created_at: string;
                description: string | null;
                id: string;
                name: string;
                operator_id: string | null;
                permissions: import("../types/database").Json;
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                description?: string | null;
                id?: string;
                name: string;
                operator_id?: string | null;
                permissions?: import("../types/database").Json;
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                description?: string | null;
                id?: string;
                name?: string;
                operator_id?: string | null;
                permissions?: import("../types/database").Json;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "user_groups_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        user_notification_preferences: {
            Row: {
                booking_cancellations: boolean | null;
                booking_confirmations: boolean | null;
                booking_modifications: boolean | null;
                created_at: string | null;
                email_notifications: boolean | null;
                feature_updates: boolean | null;
                host_booking_requests: boolean | null;
                host_guest_messages: boolean | null;
                host_payment_notifications: boolean | null;
                id: string;
                newsletter: boolean | null;
                parking_expiration_alerts: boolean | null;
                parking_expiration_minutes: number | null;
                parking_reminder_minutes: number | null;
                parking_reminders: boolean | null;
                payment_confirmations: boolean | null;
                payment_failures: boolean | null;
                promotional_offers: boolean | null;
                push_notifications: boolean | null;
                quiet_hours_enabled: boolean | null;
                quiet_hours_end: string | null;
                quiet_hours_start: string | null;
                refund_notifications: boolean | null;
                security_alerts: boolean | null;
                sms_notifications: boolean | null;
                support_messages: boolean | null;
                support_ticket_updates: boolean | null;
                system_maintenance: boolean | null;
                updated_at: string | null;
                user_id: string;
            };
            Insert: {
                booking_cancellations?: boolean | null;
                booking_confirmations?: boolean | null;
                booking_modifications?: boolean | null;
                created_at?: string | null;
                email_notifications?: boolean | null;
                feature_updates?: boolean | null;
                host_booking_requests?: boolean | null;
                host_guest_messages?: boolean | null;
                host_payment_notifications?: boolean | null;
                id?: string;
                newsletter?: boolean | null;
                parking_expiration_alerts?: boolean | null;
                parking_expiration_minutes?: number | null;
                parking_reminder_minutes?: number | null;
                parking_reminders?: boolean | null;
                payment_confirmations?: boolean | null;
                payment_failures?: boolean | null;
                promotional_offers?: boolean | null;
                push_notifications?: boolean | null;
                quiet_hours_enabled?: boolean | null;
                quiet_hours_end?: string | null;
                quiet_hours_start?: string | null;
                refund_notifications?: boolean | null;
                security_alerts?: boolean | null;
                sms_notifications?: boolean | null;
                support_messages?: boolean | null;
                support_ticket_updates?: boolean | null;
                system_maintenance?: boolean | null;
                updated_at?: string | null;
                user_id: string;
            };
            Update: {
                booking_cancellations?: boolean | null;
                booking_confirmations?: boolean | null;
                booking_modifications?: boolean | null;
                created_at?: string | null;
                email_notifications?: boolean | null;
                feature_updates?: boolean | null;
                host_booking_requests?: boolean | null;
                host_guest_messages?: boolean | null;
                host_payment_notifications?: boolean | null;
                id?: string;
                newsletter?: boolean | null;
                parking_expiration_alerts?: boolean | null;
                parking_expiration_minutes?: number | null;
                parking_reminder_minutes?: number | null;
                parking_reminders?: boolean | null;
                payment_confirmations?: boolean | null;
                payment_failures?: boolean | null;
                promotional_offers?: boolean | null;
                push_notifications?: boolean | null;
                quiet_hours_enabled?: boolean | null;
                quiet_hours_end?: string | null;
                quiet_hours_start?: string | null;
                refund_notifications?: boolean | null;
                security_alerts?: boolean | null;
                sms_notifications?: boolean | null;
                support_messages?: boolean | null;
                support_ticket_updates?: boolean | null;
                system_maintenance?: boolean | null;
                updated_at?: string | null;
                user_id?: string;
            };
            Relationships: [];
        };
        user_profiles: {
            Row: {
                address: string | null;
                avatar_url: string | null;
                created_at: string;
                date_of_birth: string | null;
                discount_eligibility: string[] | null;
                first_name: string;
                id: string;
                last_name: string;
                phone: string | null;
                updated_at: string;
                user_id: string;
            };
            Insert: {
                address?: string | null;
                avatar_url?: string | null;
                created_at?: string;
                date_of_birth?: string | null;
                discount_eligibility?: string[] | null;
                first_name: string;
                id?: string;
                last_name: string;
                phone?: string | null;
                updated_at?: string;
                user_id: string;
            };
            Update: {
                address?: string | null;
                avatar_url?: string | null;
                created_at?: string;
                date_of_birth?: string | null;
                discount_eligibility?: string[] | null;
                first_name?: string;
                id?: string;
                last_name?: string;
                phone?: string | null;
                updated_at?: string;
                user_id?: string;
            };
            Relationships: [{
                foreignKeyName: "user_profiles_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: true;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        user_sessions: {
            Row: {
                access_token_hash: string;
                created_at: string;
                device_id: string | null;
                end_reason: string | null;
                ended_at: string | null;
                expires_at: string;
                id: string;
                ip_address: unknown | null;
                is_active: boolean;
                last_activity: string;
                metadata: import("../types/database").Json | null;
                refresh_token_hash: string | null;
                user_agent: string | null;
                user_id: string;
            };
            Insert: {
                access_token_hash: string;
                created_at?: string;
                device_id?: string | null;
                end_reason?: string | null;
                ended_at?: string | null;
                expires_at: string;
                id: string;
                ip_address?: unknown | null;
                is_active?: boolean;
                last_activity?: string;
                metadata?: import("../types/database").Json | null;
                refresh_token_hash?: string | null;
                user_agent?: string | null;
                user_id: string;
            };
            Update: {
                access_token_hash?: string;
                created_at?: string;
                device_id?: string | null;
                end_reason?: string | null;
                ended_at?: string | null;
                expires_at?: string;
                id?: string;
                ip_address?: unknown | null;
                is_active?: boolean;
                last_activity?: string;
                metadata?: import("../types/database").Json | null;
                refresh_token_hash?: string | null;
                user_agent?: string | null;
                user_id?: string;
            };
            Relationships: [{
                foreignKeyName: "user_sessions_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        user_vehicles: {
            Row: {
                brand: string;
                color: string;
                created_at: string | null;
                id: string;
                is_default: boolean | null;
                model: string;
                plate_number: string;
                type: string;
                updated_at: string | null;
                user_id: string;
                year: number;
            };
            Insert: {
                brand: string;
                color: string;
                created_at?: string | null;
                id?: string;
                is_default?: boolean | null;
                model: string;
                plate_number: string;
                type: string;
                updated_at?: string | null;
                user_id: string;
                year: number;
            };
            Update: {
                brand?: string;
                color?: string;
                created_at?: string | null;
                id?: string;
                is_default?: boolean | null;
                model?: string;
                plate_number?: string;
                type?: string;
                updated_at?: string | null;
                user_id?: string;
                year?: number;
            };
            Relationships: [];
        };
        users: {
            Row: {
                created_at: string;
                email: string;
                id: string;
                operator_id: string | null;
                status: Database["public"]["Enums"]["user_status"];
                updated_at: string;
                user_type: Database["public"]["Enums"]["user_type"];
            };
            Insert: {
                created_at?: string;
                email: string;
                id: string;
                operator_id?: string | null;
                status?: Database["public"]["Enums"]["user_status"];
                updated_at?: string;
                user_type?: Database["public"]["Enums"]["user_type"];
            };
            Update: {
                created_at?: string;
                email?: string;
                id?: string;
                operator_id?: string | null;
                status?: Database["public"]["Enums"]["user_status"];
                updated_at?: string;
                user_type?: Database["public"]["Enums"]["user_type"];
            };
            Relationships: [{
                foreignKeyName: "users_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        vat_config: {
            Row: {
                created_at: string;
                id: string;
                is_active: boolean;
                is_default: boolean;
                name: string;
                operator_id: string | null;
                rate: number;
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                id?: string;
                is_active?: boolean;
                is_default?: boolean;
                name: string;
                operator_id?: string | null;
                rate: number;
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                id?: string;
                is_active?: boolean;
                is_default?: boolean;
                name?: string;
                operator_id?: string | null;
                rate?: number;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "vat_config_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        vehicle_brands: {
            Row: {
                created_at: string;
                id: string;
                is_active: boolean;
                name: string;
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                id?: string;
                is_active?: boolean;
                name: string;
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                id?: string;
                is_active?: boolean;
                name?: string;
                updated_at?: string;
            };
            Relationships: [];
        };
        vehicle_colors: {
            Row: {
                created_at: string;
                hex_code: string | null;
                id: string;
                is_active: boolean;
                name: string;
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                hex_code?: string | null;
                id?: string;
                is_active?: boolean;
                name: string;
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                hex_code?: string | null;
                id?: string;
                is_active?: boolean;
                name?: string;
                updated_at?: string;
            };
            Relationships: [];
        };
        vehicle_models: {
            Row: {
                brand_id: string;
                created_at: string;
                id: string;
                is_active: boolean;
                name: string;
                updated_at: string;
                year: number | null;
            };
            Insert: {
                brand_id: string;
                created_at?: string;
                id?: string;
                is_active?: boolean;
                name: string;
                updated_at?: string;
                year?: number | null;
            };
            Update: {
                brand_id?: string;
                created_at?: string;
                id?: string;
                is_active?: boolean;
                name?: string;
                updated_at?: string;
                year?: number | null;
            };
            Relationships: [{
                foreignKeyName: "vehicle_models_brand_id_fkey";
                columns: ["brand_id"];
                isOneToOne: false;
                referencedRelation: "vehicle_brands";
                referencedColumns: ["id"];
            }];
        };
        vehicle_types: {
            Row: {
                created_at: string;
                description: string | null;
                id: string;
                is_active: boolean;
                name: string;
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                description?: string | null;
                id?: string;
                is_active?: boolean;
                name: string;
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                description?: string | null;
                id?: string;
                is_active?: boolean;
                name?: string;
                updated_at?: string;
            };
            Relationships: [];
        };
        vehicles: {
            Row: {
                brand: string;
                color: string;
                created_at: string;
                id: string;
                is_primary: boolean;
                model: string;
                plate_number: string;
                type: string;
                updated_at: string;
                user_id: string;
                year: number;
            };
            Insert: {
                brand: string;
                color: string;
                created_at?: string;
                id?: string;
                is_primary?: boolean;
                model: string;
                plate_number: string;
                type: string;
                updated_at?: string;
                user_id: string;
                year: number;
            };
            Update: {
                brand?: string;
                color?: string;
                created_at?: string;
                id?: string;
                is_primary?: boolean;
                model?: string;
                plate_number?: string;
                type?: string;
                updated_at?: string;
                user_id?: string;
                year?: number;
            };
            Relationships: [{
                foreignKeyName: "vehicles_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        verification_documents: {
            Row: {
                created_at: string;
                file_name: string;
                file_url: string;
                host_id: string;
                id: string;
                review_notes: string | null;
                reviewed_at: string | null;
                reviewed_by: string | null;
                status: string;
                type: string;
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                file_name: string;
                file_url: string;
                host_id: string;
                id?: string;
                review_notes?: string | null;
                reviewed_at?: string | null;
                reviewed_by?: string | null;
                status?: string;
                type: string;
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                file_name?: string;
                file_url?: string;
                host_id?: string;
                id?: string;
                review_notes?: string | null;
                reviewed_at?: string | null;
                reviewed_by?: string | null;
                status?: string;
                type?: string;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "verification_documents_host_id_fkey";
                columns: ["host_id"];
                isOneToOne: false;
                referencedRelation: "host_profiles";
                referencedColumns: ["id"];
            }];
        };
        violation_reports: {
            Row: {
                assigned_to: string | null;
                created_at: string;
                description: string | null;
                id: string;
                license_plate: string | null;
                location_id: string;
                photos: string[] | null;
                reported_by: string;
                resolution_notes: string | null;
                resolved_at: string | null;
                resolved_by: string | null;
                spot_id: string | null;
                status: string;
                updated_at: string;
                vehicle_plate: string | null;
                violation_type: string;
            };
            Insert: {
                assigned_to?: string | null;
                created_at?: string;
                description?: string | null;
                id?: string;
                license_plate?: string | null;
                location_id: string;
                photos?: string[] | null;
                reported_by: string;
                resolution_notes?: string | null;
                resolved_at?: string | null;
                resolved_by?: string | null;
                spot_id?: string | null;
                status?: string;
                updated_at?: string;
                vehicle_plate?: string | null;
                violation_type: string;
            };
            Update: {
                assigned_to?: string | null;
                created_at?: string;
                description?: string | null;
                id?: string;
                license_plate?: string | null;
                location_id?: string;
                photos?: string[] | null;
                reported_by?: string;
                resolution_notes?: string | null;
                resolved_at?: string | null;
                resolved_by?: string | null;
                spot_id?: string | null;
                status?: string;
                updated_at?: string;
                vehicle_plate?: string | null;
                violation_type?: string;
            };
            Relationships: [{
                foreignKeyName: "violation_reports_assigned_to_fkey";
                columns: ["assigned_to"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "violation_reports_location_id_fkey";
                columns: ["location_id"];
                isOneToOne: false;
                referencedRelation: "locations";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "violation_reports_location_id_fkey";
                columns: ["location_id"];
                isOneToOne: false;
                referencedRelation: "parking_hierarchy_view";
                referencedColumns: ["location_id"];
            }, {
                foreignKeyName: "violation_reports_reporter_id_fkey";
                columns: ["reported_by"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "violation_reports_spot_id_fkey";
                columns: ["spot_id"];
                isOneToOne: false;
                referencedRelation: "parking_hierarchy_view";
                referencedColumns: ["spot_id"];
            }, {
                foreignKeyName: "violation_reports_spot_id_fkey";
                columns: ["spot_id"];
                isOneToOne: false;
                referencedRelation: "parking_spots";
                referencedColumns: ["id"];
            }];
        };
        vip_assignments: {
            Row: {
                assigned_by: string;
                created_at: string;
                id: string;
                is_active: boolean;
                location_id: string | null;
                notes: string | null;
                operator_id: string;
                spot_ids: string[] | null;
                time_limit_minutes: number | null;
                updated_at: string;
                user_id: string;
                valid_from: string;
                valid_until: string | null;
                vip_type: string;
            };
            Insert: {
                assigned_by: string;
                created_at?: string;
                id?: string;
                is_active?: boolean;
                location_id?: string | null;
                notes?: string | null;
                operator_id: string;
                spot_ids?: string[] | null;
                time_limit_minutes?: number | null;
                updated_at?: string;
                user_id: string;
                valid_from?: string;
                valid_until?: string | null;
                vip_type: string;
            };
            Update: {
                assigned_by?: string;
                created_at?: string;
                id?: string;
                is_active?: boolean;
                location_id?: string | null;
                notes?: string | null;
                operator_id?: string;
                spot_ids?: string[] | null;
                time_limit_minutes?: number | null;
                updated_at?: string;
                user_id?: string;
                valid_from?: string;
                valid_until?: string | null;
                vip_type?: string;
            };
            Relationships: [{
                foreignKeyName: "vip_assignments_assigned_by_fkey";
                columns: ["assigned_by"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "vip_assignments_location_id_fkey";
                columns: ["location_id"];
                isOneToOne: false;
                referencedRelation: "locations";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "vip_assignments_location_id_fkey";
                columns: ["location_id"];
                isOneToOne: false;
                referencedRelation: "parking_hierarchy_view";
                referencedColumns: ["location_id"];
            }, {
                foreignKeyName: "vip_assignments_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "vip_assignments_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        zones: {
            Row: {
                created_at: string;
                id: string;
                name: string;
                pricing_config: import("../types/database").Json | null;
                section_id: string;
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                id?: string;
                name: string;
                pricing_config?: import("../types/database").Json | null;
                section_id: string;
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                id?: string;
                name?: string;
                pricing_config?: import("../types/database").Json | null;
                section_id?: string;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "zones_section_id_fkey";
                columns: ["section_id"];
                isOneToOne: false;
                referencedRelation: "parking_hierarchy_view";
                referencedColumns: ["section_id"];
            }, {
                foreignKeyName: "zones_section_id_fkey";
                columns: ["section_id"];
                isOneToOne: false;
                referencedRelation: "sections";
                referencedColumns: ["id"];
            }];
        };
    };
    Views: {
        active_bookings_view: {
            Row: {
                amount: number | null;
                created_at: string | null;
                discounts: import("../types/database").Json | null;
                end_time: string | null;
                first_name: string | null;
                id: string | null;
                last_name: string | null;
                location_name: string | null;
                payment_status: Database["public"]["Enums"]["payment_status"] | null;
                phone: string | null;
                plate_number: string | null;
                section_name: string | null;
                spot_id: string | null;
                spot_number: string | null;
                start_time: string | null;
                status: Database["public"]["Enums"]["booking_status"] | null;
                total_amount: number | null;
                updated_at: string | null;
                user_id: string | null;
                vat_amount: number | null;
                vehicle_id: string | null;
                vehicle_type: string | null;
                zone_name: string | null;
            };
            Relationships: [{
                foreignKeyName: "bookings_spot_id_fkey";
                columns: ["spot_id"];
                isOneToOne: false;
                referencedRelation: "parking_hierarchy_view";
                referencedColumns: ["spot_id"];
            }, {
                foreignKeyName: "bookings_spot_id_fkey";
                columns: ["spot_id"];
                isOneToOne: false;
                referencedRelation: "parking_spots";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "bookings_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "bookings_vehicle_id_fkey";
                columns: ["vehicle_id"];
                isOneToOne: false;
                referencedRelation: "vehicles";
                referencedColumns: ["id"];
            }];
        };
        active_pos_sessions_view: {
            Row: {
                cash_difference: number | null;
                created_at: string | null;
                current_cash_amount: number | null;
                end_cash_amount: number | null;
                end_time: string | null;
                first_name: string | null;
                id: string | null;
                last_name: string | null;
                location_address: import("../types/database").Json | null;
                location_id: string | null;
                location_name: string | null;
                notes: string | null;
                operator_id: string | null;
                phone: string | null;
                previous_cash_amount: number | null;
                start_time: string | null;
                status: string | null;
                total_amount: number | null;
                transaction_count: number | null;
                updated_at: string | null;
            };
            Relationships: [{
                foreignKeyName: "pos_sessions_location_id_fkey";
                columns: ["location_id"];
                isOneToOne: false;
                referencedRelation: "locations";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "pos_sessions_location_id_fkey";
                columns: ["location_id"];
                isOneToOne: false;
                referencedRelation: "parking_hierarchy_view";
                referencedColumns: ["location_id"];
            }, {
                foreignKeyName: "pos_sessions_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        parking_hierarchy_view: {
            Row: {
                effective_pricing: import("../types/database").Json | null;
                location_address: import("../types/database").Json | null;
                location_id: string | null;
                location_name: string | null;
                location_type: Database["public"]["Enums"]["parking_type"] | null;
                operator_id: string | null;
                section_id: string | null;
                section_name: string | null;
                spot_amenities: string[] | null;
                spot_coordinates: import("../types/database").Json | null;
                spot_id: string | null;
                spot_number: string | null;
                spot_status: Database["public"]["Enums"]["spot_status"] | null;
                spot_type: string | null;
                zone_id: string | null;
                zone_name: string | null;
            };
            Relationships: [{
                foreignKeyName: "locations_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        pos_transaction_summary_view: {
            Row: {
                amount: number | null;
                change_amount: number | null;
                created_at: string | null;
                description: string | null;
                discount_type: string | null;
                first_name: string | null;
                id: string | null;
                last_name: string | null;
                location_name: string | null;
                metadata: import("../types/database").Json | null;
                operator_id: string | null;
                parking_session_id: string | null;
                payment_method: string | null;
                print_status: string | null;
                receipt_number: string | null;
                session_id: string | null;
                type: string | null;
                vat_amount: number | null;
                vehicle_plate_number: string | null;
            };
            Relationships: [{
                foreignKeyName: "pos_sessions_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "pos_transactions_parking_session_id_fkey";
                columns: ["parking_session_id"];
                isOneToOne: false;
                referencedRelation: "active_bookings_view";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "pos_transactions_parking_session_id_fkey";
                columns: ["parking_session_id"];
                isOneToOne: false;
                referencedRelation: "bookings";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "pos_transactions_session_id_fkey";
                columns: ["session_id"];
                isOneToOne: false;
                referencedRelation: "active_pos_sessions_view";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "pos_transactions_session_id_fkey";
                columns: ["session_id"];
                isOneToOne: false;
                referencedRelation: "pos_sessions";
                referencedColumns: ["id"];
            }];
        };
        revenue_analytics_view: {
            Row: {
                avg_booking_value: number | null;
                booking_date: string | null;
                gross_revenue: number | null;
                net_revenue: number | null;
                operator_id: string | null;
                parking_type: Database["public"]["Enums"]["parking_type"] | null;
                total_bookings: number | null;
                total_vat: number | null;
            };
            Relationships: [{
                foreignKeyName: "locations_operator_id_fkey";
                columns: ["operator_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
    };
    Functions: {
        calculate_next_remittance_date: {
            Args: {
                frequency: Database["public"]["Enums"]["remittance_frequency"];
                last_run_date?: string;
            };
            Returns: string;
        };
        calculate_next_run_time: {
            Args: {
                schedule_expr: string;
                last_run?: string;
            };
            Returns: string;
        };
        calculate_operator_performance: {
            Args: {
                operator_uuid: string;
                metric_date?: string;
            };
            Returns: undefined;
        };
        check_function_exists: {
            Args: {
                function_name: string;
            };
            Returns: boolean;
        };
        check_rls_enabled: {
            Args: {
                table_name: string;
            };
            Returns: boolean;
        };
        check_trigger_exists: {
            Args: {
                trigger_name: string;
                table_name: string;
            };
            Returns: boolean;
        };
        check_vip_parking_eligibility: {
            Args: {
                p_user_id: string;
                p_spot_id: string;
            };
            Returns: boolean;
        };
        cleanup_expired_exports: {
            Args: Record<PropertyKey, never>;
            Returns: undefined;
        };
        cleanup_old_reports: {
            Args: Record<PropertyKey, never>;
            Returns: number;
        };
        create_audit_trail_entry: {
            Args: {
                entity_id_param: string;
                entity_type_param: string;
                action_param: string;
                user_id_param?: string;
                details_param?: import("../types/database").Json;
            };
            Returns: undefined;
        };
        generate_receipt_number: {
            Args: Record<PropertyKey, never>;
            Returns: string;
        };
        get_active_commission_rule: {
            Args: {
                parking_type_param: Database["public"]["Enums"]["parking_type"];
            };
            Returns: {
                created_at: string;
                effective_date: string;
                expiry_date: string | null;
                host_percentage: number;
                id: string;
                is_active: boolean;
                park_angel_percentage: number;
                parking_type: Database["public"]["Enums"]["parking_type"];
                updated_at: string;
            };
        };
        get_effective_pricing: {
            Args: {
                spot_id: string;
            };
            Returns: import("../types/database").Json;
        };
        get_enum_values: {
            Args: {
                enum_name: string;
            };
            Returns: {
                enum_value: string;
            }[];
        };
        get_location_occupancy_rate: {
            Args: {
                location_id: string;
            };
            Returns: number;
        };
        get_pricing_hierarchy: {
            Args: {
                location_id: string;
            };
            Returns: import("../types/database").Json;
        };
        get_storage_buckets: {
            Args: Record<PropertyKey, never>;
            Returns: {
                bucket_name: string;
                bucket_public: boolean;
            }[];
        };
        get_table_indexes: {
            Args: {
                table_name: string;
            };
            Returns: {
                index_name: string;
                column_names: string;
                is_unique: boolean;
                is_primary: boolean;
            }[];
        };
        get_table_list: {
            Args: Record<PropertyKey, never>;
            Returns: {
                table_name: string;
            }[];
        };
        get_table_policies: {
            Args: {
                table_name: string;
            };
            Returns: {
                policy_name: string;
                policy_cmd: string;
                policy_permissive: string;
                policy_roles: string[];
            }[];
        };
        increment_rate_limit: {
            Args: {
                p_api_key_id: string;
                p_time_window: string;
                p_window_start: string;
            };
            Returns: undefined;
        };
        is_admin: {
            Args: Record<PropertyKey, never>;
            Returns: boolean;
        };
        log_audit_event: {
            Args: {
                p_entity_id: string;
                p_entity_type: string;
                p_action: string;
                p_user_id?: string;
                p_details?: import("../types/database").Json;
            };
            Returns: string;
        };
        maintain_database: {
            Args: Record<PropertyKey, never>;
            Returns: string;
        };
        record_performance_metric: {
            Args: {
                p_feature: string;
                p_response_time: number;
                p_error?: boolean;
                p_user_id?: string;
                p_metadata?: import("../types/database").Json;
            };
            Returns: string;
        };
        update_advertisement_metrics: {
            Args: {
                p_advertisement_id: string;
                p_impressions?: number;
                p_clicks?: number;
                p_conversions?: number;
            };
            Returns: undefined;
        };
        update_customer_analytics: {
            Args: {
                p_customer_id: string;
                p_operator_id: string;
                p_booking_amount?: number;
            };
            Returns: undefined;
        };
        update_pricing_with_recalculation: {
            Args: {
                table_name: string;
                record_id: string;
                pricing_config: import("../types/database").Json;
            };
            Returns: undefined;
        };
        validate_database_integrity: {
            Args: Record<PropertyKey, never>;
            Returns: {
                check_name: string;
                status: string;
                details: string;
            }[];
        };
        verify_constraints: {
            Args: Record<PropertyKey, never>;
            Returns: {
                table_name: string;
                constraint_name: string;
                constraint_type: string;
                is_valid: boolean;
            }[];
        };
    };
    Enums: {
        ad_content_type: "image" | "video" | "text" | "banner" | "interstitial";
        ad_status: "pending" | "approved" | "active" | "paused" | "completed";
        ad_target_type: "section" | "zone";
        booking_status: "pending" | "confirmed" | "active" | "completed" | "cancelled";
        conversation_type: "user_host" | "user_operator" | "user_support";
        discrepancy_type: "amount_mismatch" | "missing_revenue_share" | "missing_transaction" | "status_mismatch" | "duplicate_entry";
        financial_report_type: "operator_revenue" | "host_revenue" | "transaction_reconciliation" | "payout_summary" | "revenue_analysis";
        message_type: "text" | "image" | "file";
        parking_type: "hosted" | "street" | "facility";
        payment_intent_status: "requires_payment_method" | "requires_confirmation" | "requires_action" | "processing" | "succeeded" | "cancelled";
        payment_method_type: "credit_card" | "debit_card" | "digital_wallet" | "bank_transfer";
        payment_provider: "stripe" | "paypal" | "gcash" | "paymaya" | "park_angel";
        payment_status: "pending" | "paid" | "refunded";
        payment_transaction_status: "pending" | "processing" | "succeeded" | "failed" | "cancelled" | "refunded" | "partially_refunded";
        payout_status: "pending" | "processing" | "paid" | "failed" | "cancelled";
        rated_type: "spot" | "host" | "operator" | "user";
        reconciliation_rule_type: "amount_validation" | "status_check" | "duplicate_detection" | "completeness_check";
        remittance_frequency: "daily" | "weekly" | "biweekly" | "monthly";
        remittance_status: "pending" | "processing" | "completed" | "failed" | "cancelled";
        spot_status: "available" | "occupied" | "reserved" | "maintenance";
        target_type: "section" | "zone";
        user_status: "active" | "inactive" | "suspended";
        user_type: "client" | "host" | "operator" | "admin" | "pos";
        vip_type: "vvip" | "flex_vvip" | "spot_vip" | "spot_flex_vip";
    };
    CompositeTypes: { [_ in never]: never; };
}>;
export declare const handleSupabaseError: (error: any) => never;
export declare const validateQueryResult: <T>(result: any) => T | null;
export declare const safeAccess: <T>(obj: any, path: string, defaultValue: T) => T;
export declare const isValidDatabaseResult: (value: any) => value is Record<string, any>;
export declare const isAuthenticated: () => Promise<boolean>;
export declare const getCurrentUser: () => Promise<import("@supabase/auth-js").User | null>;
export declare const signOut: () => Promise<void>;
