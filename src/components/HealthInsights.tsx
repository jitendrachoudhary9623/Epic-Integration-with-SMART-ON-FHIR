'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Brain, AlertTriangle, CheckCircle, Info, TrendingUp, Heart, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Insight {
  id: string;
  type: 'warning' | 'success' | 'info' | 'suggestion';
  category: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface HealthInsightsProps {
  vitals: any[];
  medications: any[];
  labReports: any[];
  encounters: any[];
}

const HealthInsights: React.FC<HealthInsightsProps> = ({ vitals, medications, labReports, encounters }) => {
  const insights = useMemo<Insight[]>(() => {
    const generatedInsights: Insight[] = [];

    // Analyze vitals for concerning trends
    if (vitals && vitals.length > 0) {
      vitals.forEach((vital) => {
        // Blood pressure analysis
        if (vital.code?.coding?.[0]?.display?.toLowerCase().includes('blood pressure')) {
          const systolic = vital.component?.find((c: any) =>
            c.code?.coding?.[0]?.display?.toLowerCase().includes('systolic')
          );
          const systolicValue = systolic?.valueQuantity?.value;

          if (systolicValue && systolicValue > 140) {
            generatedInsights.push({
              id: `bp-high-${vital.id}`,
              type: 'warning',
              category: 'Vitals',
              title: 'Elevated Blood Pressure Detected',
              description: `Your systolic blood pressure (${systolicValue} mmHg) is above the normal range. Consider discussing this with your healthcare provider.`,
              priority: 'high',
            });
          } else if (systolicValue && systolicValue >= 120 && systolicValue <= 140) {
            generatedInsights.push({
              id: `bp-watch-${vital.id}`,
              type: 'info',
              category: 'Vitals',
              title: 'Monitor Blood Pressure',
              description: `Your blood pressure is in the elevated range. Regular monitoring and lifestyle changes may help.`,
              priority: 'medium',
            });
          }
        }

        // Heart rate analysis
        if (vital.code?.coding?.[0]?.display?.toLowerCase().includes('heart rate')) {
          const heartRate = vital.valueQuantity?.value;
          if (heartRate && (heartRate > 100 || heartRate < 60)) {
            generatedInsights.push({
              id: `hr-${vital.id}`,
              type: 'info',
              category: 'Vitals',
              title: heartRate > 100 ? 'Elevated Heart Rate' : 'Low Heart Rate',
              description: `Your heart rate (${heartRate} bpm) is ${heartRate > 100 ? 'higher' : 'lower'} than typical resting range (60-100 bpm).`,
              priority: 'medium',
            });
          }
        }
      });
    }

    // Medication adherence insights
    if (medications && medications.length > 0) {
      const activeMeds = medications.filter((med: any) => med.status === 'active');
      if (activeMeds.length > 0) {
        generatedInsights.push({
          id: 'med-adherence',
          type: 'info',
          category: 'Medications',
          title: 'Active Medications',
          description: `You have ${activeMeds.length} active medication${activeMeds.length > 1 ? 's' : ''}. Remember to take them as prescribed for best results.`,
          priority: 'medium',
        });
      }

      // Check for multiple medications
      if (medications.length >= 5) {
        generatedInsights.push({
          id: 'med-polypharmacy',
          type: 'suggestion',
          category: 'Medications',
          title: 'Medication Review Recommended',
          description: 'You\'re taking multiple medications. Consider scheduling a medication review with your doctor to optimize your treatment plan.',
          priority: 'medium',
        });
      }
    }

    // Recent encounters insight
    if (encounters && encounters.length > 0) {
      const recentEncounter = encounters[0];
      if (recentEncounter) {
        generatedInsights.push({
          id: 'recent-visit',
          type: 'success',
          category: 'Care',
          title: 'Recent Healthcare Visit',
          description: `Your last visit was for ${recentEncounter.type?.[0]?.text || 'care'}. Make sure to follow up on any recommendations.`,
          priority: 'low',
        });
      }
    }

    // General wellness suggestions
    if (vitals && vitals.length > 2) {
      generatedInsights.push({
        id: 'wellness-trend',
        type: 'success',
        category: 'Wellness',
        title: 'Great Health Monitoring!',
        description: 'You\'re actively tracking your health metrics. Keep up the good work for better health outcomes.',
        priority: 'low',
      });
    }

    // Hydration reminder
    generatedInsights.push({
      id: 'hydration',
      type: 'suggestion',
      category: 'Wellness',
      title: 'Stay Hydrated',
      description: 'Aim for 8 glasses of water daily to support your overall health and medication effectiveness.',
      priority: 'low',
    });

    // Exercise suggestion
    generatedInsights.push({
      id: 'exercise',
      type: 'suggestion',
      category: 'Wellness',
      title: 'Regular Physical Activity',
      description: '150 minutes of moderate activity per week can improve cardiovascular health and mood.',
      priority: 'low',
    });

    return generatedInsights.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [vitals, medications, labReports, encounters]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'suggestion':
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getAlertVariant = (type: string): "default" | "destructive" => {
    return type === 'warning' ? 'destructive' : 'default';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Group insights by category
  const groupedInsights = useMemo(() => {
    const groups: Record<string, Insight[]> = {};
    insights.forEach((insight) => {
      if (!groups[insight.category]) {
        groups[insight.category] = [];
      }
      groups[insight.category].push(insight);
    });
    return groups;
  }, [insights]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Vitals':
        return <Activity className="h-4 w-4" />;
      case 'Medications':
        return <AlertTriangle className="h-4 w-4" />;
      case 'Care':
        return <Heart className="h-4 w-4" />;
      case 'Wellness':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Vitals':
        return 'text-red-500 dark:text-red-400';
      case 'Medications':
        return 'text-blue-500 dark:text-blue-400';
      case 'Care':
        return 'text-green-500 dark:text-green-400';
      case 'Wellness':
        return 'text-purple-500 dark:text-purple-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            AI Health Insights
          </div>
          <Badge variant="secondary">
            <Activity className="h-3 w-3 mr-1" />
            {insights.length} Insights
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
            <Heart className="h-12 w-12 mb-4 text-gray-300 dark:text-gray-600" />
            <p>No health insights available yet.</p>
            <p className="text-sm">Keep tracking your health data for personalized recommendations.</p>
          </div>
        ) : (
          <Accordion type="multiple" defaultValue={[]} className="w-full">
            {Object.entries(groupedInsights).map(([category, categoryInsights]) => (
              <AccordionItem key={category} value={category}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={getCategoryColor(category)}>
                      {getCategoryIcon(category)}
                    </div>
                    <span className="font-semibold">{category}</span>
                    <Badge variant="outline" className="ml-auto mr-2">
                      {categoryInsights.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    <AnimatePresence>
                      {categoryInsights.map((insight, index) => (
                        <motion.div
                          key={insight.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Alert variant={getAlertVariant(insight.type)} className="relative overflow-hidden">
                            <div className="flex items-start gap-3">
                              {getIcon(insight.type)}
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <AlertTitle className="mb-0 text-sm">{insight.title}</AlertTitle>
                                  <Badge className={`text-xs ${getPriorityColor(insight.priority)}`}>
                                    {insight.priority}
                                  </Badge>
                                </div>
                                <AlertDescription className="text-sm">{insight.description}</AlertDescription>
                              </div>
                            </div>
                          </Alert>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

export default HealthInsights;
