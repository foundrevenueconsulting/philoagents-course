"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@clerk/nextjs";
import Image from "next/image";
import { Dictionary } from '@/lib/dictionaries';

interface PracticeContentProps {
  dict: Dictionary;
}

interface ImageRecognitionOption {
  id: string;
  text: string;
}

interface ImageRecognitionQuestion {
  id: string;
  image_path: string;
  question: string;
  options: ImageRecognitionOption[];
  category: string;
  difficulty: string;
}

interface SubmissionResult {
  response_id: string;
  is_correct: boolean;
  correct_answer: string;
  explanation: string;
  response_time_ms: number;
  category: string;
  difficulty: string;
}

interface UserStats {
  total_attempts: number;
  correct_answers: number;
  accuracy_percentage: number;
  average_response_time_ms: number;
  category_stats: Record<string, { correct: number; total: number }>;
  difficulty_stats: Record<string, { correct: number; total: number }>;
}

interface RecognitionConfig {
  type: string;
  title: string;
  description: string;
  options: Array<{
    id: string;
    label: string;
    description: string;
  }>;
}

export function PracticeContent({ dict }: PracticeContentProps) {
  const { getToken } = useAuth();
  const [question, setQuestion] = useState<ImageRecognitionQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [config, setConfig] = useState<RecognitionConfig | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = await getToken();
    return fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  };

  const loadNewQuestion = async () => {
    setLoading(true);
    setSubmissionResult(null);
    setSelectedOption("");
    
    try {
      const url = "/image-recognition/random";
      const response = await apiCall(url);
      if (response.ok) {
        const data = await response.json();
        setQuestion(data);
        setStartTime(Date.now());
      } else {
        console.error("Failed to load question");
      }
    } catch (error) {
      console.error("Error loading question:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const response = await apiCall("/image-recognition/stats/me");
      if (response.ok) {
        const data = await response.json();
        setUserStats(data);
      }
    } catch (error) {
      console.error("Error loading user stats:", error);
    }
  };

  const loadConfig = async () => {
    try {
      const response = await fetch("/api/image-recognition/config");
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error("Error loading configuration:", error);
    }
  };

  const submitAnswer = async () => {
    if (!question || !selectedOption) return;

    setLoading(true);
    const responseTime = Date.now() - startTime;

    try {
      const response = await apiCall("/image-recognition/submit", {
        method: "POST",
        body: JSON.stringify({
          item_id: question.id,
          selected_option_id: selectedOption,
          response_time_ms: responseTime,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSubmissionResult(result);
        await loadUserStats();
      } else {
        console.error("Failed to submit answer");
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "hard": return "bg-red-100 text-red-800";
      case "expert": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  useEffect(() => {
    loadConfig();
    loadNewQuestion();
    loadUserStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (showStats && userStats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{config?.title || dict.practice.statistics}</h1>
          <Button onClick={() => setShowStats(false)} variant="outline">
            Back to Practice
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border-l-4" style={{ borderLeftColor: '#B8623F' }}>
            <div className="pb-2">
              <p className="text-gray-600 dark:text-gray-300">{dict.practice.total_attempts}</p>
              <h3 className="text-3xl font-bold">{userStats.total_attempts}</h3>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border-l-4" style={{ borderLeftColor: '#B8623F' }}>
            <div className="pb-2">
              <p className="text-gray-600 dark:text-gray-300">{dict.practice.accuracy}</p>
              <h3 className="text-3xl font-bold text-green-600">
                {userStats.accuracy_percentage.toFixed(1)}%
              </h3>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border-l-4" style={{ borderLeftColor: '#B8623F' }}>
            <div className="pb-2">
              <p className="text-gray-600 dark:text-gray-300">{dict.practice.avg_response_time}</p>
              <h3 className="text-3xl font-bold">
                {(userStats.average_response_time_ms / 1000).toFixed(1)}s
              </h3>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border-l-4" style={{ borderLeftColor: '#B8623F' }}>
            <div className="mb-4">
              <h3 className="text-xl font-semibold">{dict.practice.performance_by_category}</h3>
            </div>
            <div className="space-y-4">
              {Object.entries(userStats.category_stats).map(([category, stats]) => (
                <div key={category}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="capitalize font-medium">{category}</span>
                    <span className="text-sm text-gray-600">
                      {stats.correct}/{stats.total} ({((stats.correct / stats.total) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={(stats.correct / stats.total) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border-l-4" style={{ borderLeftColor: '#B8623F' }}>
            <div className="mb-4">
              <h3 className="text-xl font-semibold">{dict.practice.performance_by_difficulty}</h3>
            </div>
            <div className="space-y-4">
              {Object.entries(userStats.difficulty_stats).map(([difficulty, stats]) => (
                <div key={difficulty}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="capitalize font-medium">{difficulty}</span>
                    <span className="text-sm text-gray-600">
                      {stats.correct}/{stats.total} ({((stats.correct / stats.total) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={(stats.correct / stats.total) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{config?.title || dict.practice.recognition_practice}</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowStats(true)} variant="outline" size="sm">
            📊
            Stats
          </Button>
          <Button onClick={loadNewQuestion} variant="outline" size="sm" disabled={loading}>
            🔄
            New Question
          </Button>
        </div>
      </div>

      {userStats && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {dict.practice.total_accuracy.replace('{total}', userStats.total_attempts.toString()).replace('{accuracy}', userStats.accuracy_percentage.toFixed(1))}
            </div>
            <div className="text-sm text-gray-600">
              {dict.practice.avg_response_time}: {(userStats.average_response_time_ms / 1000).toFixed(1)}s
            </div>
          </div>
        </div>
      )}

      {question ? (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border-l-4 mb-6" style={{ borderLeftColor: '#B8623F' }}>
          <div className="mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold mb-2">{question.question}</h2>
                {question.difficulty && (
                  <Badge className={getDifficultyColor(question.difficulty)}>
                    {question.difficulty}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div>
            <div className="mb-6">
              <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={question.image_path}
                  alt="Practice image"
                  fill
                  className="object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = 
                        '<div class="w-full h-full flex items-center justify-center text-gray-500">Sample Image</div>';
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {question.options.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedOption === option.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="answer"
                    value={option.id}
                    checked={selectedOption === option.id}
                    onChange={(e) => setSelectedOption(e.target.value)}
                    className="mr-3"
                    disabled={!!submissionResult}
                  />
                  <span className="text-lg">{option.text}</span>
                </label>
              ))}
            </div>

            {submissionResult ? (
              <div className={`p-4 rounded-lg mb-4 ${
                submissionResult.is_correct ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
              }`}>
                <div className="flex items-center mb-2">
                  {submissionResult.is_correct ? (
                    <span className="text-green-600 mr-2">✅</span>
                  ) : (
                    <span className="text-red-600 mr-2">❌</span>
                  )}
                  <span className={`font-semibold ${
                    submissionResult.is_correct ? "text-green-800" : "text-red-800"
                  }`}>
                    {submissionResult.is_correct ? dict.practice.correct : dict.practice.incorrect}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{submissionResult.explanation}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Response time: {(submissionResult.response_time_ms / 1000).toFixed(1)}s
                </p>
              </div>
            ) : (
              <Button
                onClick={submitAnswer}
                disabled={!selectedOption || loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Submitting...
                  </>
                ) : (
                  dict.practice.submit_answer
                )}
              </Button>
            )}

            {submissionResult && (
              <Button
                onClick={loadNewQuestion}
                className="w-full mt-3"
                variant="outline"
                disabled={loading}
              >
                Next Question
              </Button>
            )}
          </div>
        </div>
      ) : loading ? (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border-l-4" style={{ borderLeftColor: '#B8623F' }}>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderBottomColor: '#B8623F' }}></div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border-l-4" style={{ borderLeftColor: '#B8623F' }}>
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">{dict.practice.failed_to_load}</p>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}