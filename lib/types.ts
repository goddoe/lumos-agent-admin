export interface Answer {
  _id: string;
  qid: string;
  request: {
    messages: Array<{
      role: string;
      content: string;
    }>;
    context: {
      additional_info?: any[];
      company_name?: string;
      program?: string[];
    };
    program?: string | null;
  };
  versions: Version[];
  created_at: {
    $date: string;
  } | Date;
  updated_at?: {
    $date: string;
  } | Date;
}

export interface Version {
  version_id: string;
  result: {
    workflow_name?: string;
    question?: string;
    question_type?: string;
    question_category?: string;
    program?: string;
    answer: {
      content: string;
      evidences?: any[];
      forms?: any[];
      additional_actions?: any[];
      confidence?: number;
      evidence_summary?: any;
    };
    metadata?: any;
    thoughts?: any[];
    todos?: any[];
  };
  generated_from: 'ai' | 'human';
  created_at: {
    $date: string;
  } | Date;
  created_by: string | null;
  processing_time: number | null;
  confidence: number | null;
  is_deleted: boolean;
}

export interface AutomationRate {
  period: string;
  total_questions: number;
  automated_questions: number;
  automation_rate: number;
  ai_answers_count: number;
  human_answers_count: number;
  timestamp: Date;
}

export interface ThresholdAutomationRate {
  threshold: number;
  automated_questions: number;
  automation_rate: number;
}

export interface DashboardStats {
  total_questions: number;
  automated_questions: number;
  overall_automation_rate: number;
  ai_answers_count: number;
  human_answers_count: number;
  threshold_comparison: ThresholdAutomationRate[];
  hourly_rates: AutomationRate[];
  daily_rates: AutomationRate[];
  weekly_rates: AutomationRate[];
  monthly_rates: AutomationRate[];
}