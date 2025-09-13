import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useToast } from './ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = "https://tioxlvekpelevjawtzst.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpb3hsdmVrcGVsZXZqYXd0enN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MTY1MjMsImV4cCI6MjA2NTQ5MjUyM30.NrpNXmfUrm56zOpJ7Z7x1BXqtXGr4z9oo_Nm6MkmV8c";

type ThunderstormPrediction = {
  riskLevel: 'green' | 'yellow' | 'red';
  probability: number;
  message: string;
};

export const ThunderstormPredictor: React.FC = () => {
  const [prediction, setPrediction] = useState<ThunderstormPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();