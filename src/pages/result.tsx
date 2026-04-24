import { useLocation, useParams } from "wouter";
import { useSubmission, useExamQuestions } from "@/hooks/useExamData";
import {
  Shield,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  User,
  Clock,
  Target,
  ArrowRight,
  Sparkles,
  Trophy,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { QuestionContent } from "@/components/QuestionContent";

export default function Result() {
  const { attemptId: submissionId } = useParams<{ attemptId: string }>();
  const [, setLocation] = useLocation();
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const { data: submission, isLoading: subLoading, error } = useSubmission(submissionId);
  const needsLiveQuestions = !!submission && !submission.question_snapshots?.length;
  const { data: liveQuestions, isLoading: qLoading } = useExamQuestions(
    needsLiveQuestions ? submission?.exam_id : undefined
  );

  const questions = submission?.question_snapshots?.length
    ? submission.question_snapshots
    : liveQuestions;

  if (subLoading || (needsLiveQuestions && qLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-black tracking-widest uppercase text-muted-foreground">
          Generating Performance Report
        </p>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center gap-4 p-6">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <div className="text-center">
          <p className="text-xl font-black mb-1">Could not load result</p>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            {error
              ? `Error: ${(error as Error).message}`
              : "The requested assessment data could not be retrieved."}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            setLocation(localStorage.getItem("studentInfo") ? "/tests" : "/dashboard")
          }
          className="rounded-2xl h-12 px-8"
        >
          Back to Tests
        </Button>
      </div>
    );
  }

  const percentage = submission.total_marks
    ? Math.round((submission.score / submission.total_marks) * 100)
    : 0;
  const isPass = percentage >= 50;
  const studentAnswers = submission.student_answers || {};

  const sessionId = submission.id.slice(0, 8).toUpperCase();
  const dateLabel = new Date(submission.submitted_at).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const timeTaken = (() => {
    const m = Math.floor(submission.time_used_seconds / 60);
    const s = submission.time_used_seconds % 60;
    return `${m}m ${s}s`;
  })();

  const correctCount = questions
    ? questions.filter((q) => {
        const ans = studentAnswers[q.id];
        return ans && q.correct_answer && ans.trim() === q.correct_answer.trim();
      }).length
    : 0;

  const examTitle = submission.exams?.title || "Mock Examination";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-foreground pb-24 relative overflow-x-hidden">
      <div className="absolute top-[-15%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[140px]" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/10 rounded-full blur-[140px]" />

      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-border/40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() =>
              setLocation(localStorage.getItem("studentInfo") ? "/tests" : "/dashboard")
            }
            className="rounded-xl hover:bg-blue-50"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            <span className="font-bold">Home</span>
          </Button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hidden sm:block">
              Verification Report
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 mt-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-8"
        >
          {/* Score circle */}
          <div className="flex flex-col items-center text-center">
            <div className="relative w-44 h-44 mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className="fill-none stroke-slate-200"
                  strokeWidth="6"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  className={`fill-none ${
                    isPass ? "stroke-emerald-500" : "stroke-rose-500"
                  }`}
                  strokeWidth="6"
                  strokeDasharray="283"
                  initial={{ strokeDashoffset: 283 }}
                  animate={{ strokeDashoffset: 283 - (283 * percentage) / 100 }}
                  transition={{ duration: 1.4, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={`text-4xl font-black tracking-tight ${
                    isPass ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {percentage}%
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">
                  Score
                </span>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 bg-gradient-to-br from-slate-900 to-blue-700 bg-clip-text text-transparent">
              {examTitle}
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Session ID: {sessionId} &nbsp;|&nbsp; {dateLabel}
            </p>

            <div className="inline-flex items-center space-x-2 mt-4 px-4 py-1.5 rounded-full border bg-white/70 shadow-sm">
              {isPass ? (
                <>
                  <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">
                    Great Effort
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-black text-blue-700 uppercase tracking-widest">
                    Keep Practicing
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 max-w-xl mx-auto w-full">
            {[
              {
                label: "Score",
                value: `${submission.score} / ${submission.total_marks}`,
                icon: <Target className="w-4 h-4" />,
                color: "from-blue-500 to-indigo-500",
              },
              {
                label: "Duration",
                value: timeTaken,
                icon: <Clock className="w-4 h-4" />,
                color: "from-emerald-500 to-teal-500",
              },
              {
                label: "Correct",
                value: questions ? `${correctCount} / ${questions.length}` : "—",
                icon: <CheckCircle2 className="w-4 h-4" />,
                color: "from-amber-500 to-orange-500",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white border border-slate-200 rounded-2xl p-3 md:p-4 text-center shadow-sm"
              >
                <div
                  className={`w-9 h-9 mx-auto mb-2 rounded-xl flex items-center justify-center bg-gradient-to-br ${s.color} text-white shadow-md`}
                >
                  {s.icon}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5">
                  {s.label}
                </div>
                <div className="text-base md:text-lg font-black">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Candidate */}
          <Card className="border border-blue-100 bg-white/90 backdrop-blur-sm rounded-2xl p-4 flex items-center space-x-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Candidate
              </p>
              <p className="font-black truncate">{submission.student_name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {submission.roll_number}
              </p>
            </div>
          </Card>

          {/* Review */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black flex items-center space-x-2">
                <ListChecks className="w-5 h-5 text-blue-600" />
                <span>Review Questions</span>
              </h2>
              <div className="flex items-center space-x-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <div className="flex items-center space-x-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Correct</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Incorrect</span>
                </div>
              </div>
            </div>

            <motion.div 
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {questions && questions.length > 0 ? (
                questions.map((q, idx) => {
                  const studentAnswer = submission.student_answers?.[q.id];
                  const isCorrect = studentAnswer === q.correct_answer;
                  
                  return (
                    <motion.div key={q.id} variants={item}>
                      <Card className="border-none shadow-2xl bg-white/90 overflow-hidden group">
                        <div className={`h-1.5 w-full ${studentAnswer ? (isCorrect ? "bg-emerald-500" : "bg-rose-500") : "bg-muted"}`} />
                        <CardHeader className="p-8 pb-4">
                          <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-1 rounded-lg border border-primary/10">
                              Question {String(idx + 1).padStart(2, '0')}
                            </span>
                            <span className="text-xs font-bold text-muted-foreground">{q.marks} Points</span>
                          </div>
                          <div className="text-xl font-bold leading-relaxed">
                            <QuestionContent content={q.question} />
                          </div>
                        </CardHeader>
                        <CardContent className="p-8 pt-4 space-y-6">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className={`p-4 rounded-2xl border ${studentAnswer ? (isCorrect ? "bg-emerald-500/[0.03] border-emerald-500/10" : "bg-rose-500/[0.03] border-rose-500/10") : "bg-muted/10 border-border"}`}>
                              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 flex items-center">
                                <User className="w-3 h-3 mr-1.5" /> Your Submission
                              </p>
                                <p className={`font-bold ${studentAnswer ? (isCorrect ? "text-emerald-700" : "text-rose-700") : "text-muted-foreground"}`}>
                                  {studentAnswer ? <QuestionContent content={studentAnswer} /> : "No Response"}
                                </p>
                            </div>
                            <div className="p-4 rounded-2xl bg-primary/[0.03] border border-primary/10">
                              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary mb-2 flex items-center">
                                <CheckCircle2 className="w-3 h-3 mr-1.5" /> Ideal Outcome
                              </p>
                                <p className="font-bold text-primary">
                                  <QuestionContent content={q.correct_answer || ""} />
                                </p>
                            </div>
                          </div>

                          {q.explanation && (
                            <div className="p-4 rounded-2xl bg-surface-sunken/50 border-dashed border flex items-start space-x-3">
                              <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                              <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Analytical Insight</p>
                                  <div className="text-sm text-muted-foreground leading-relaxed italic">
                                    <QuestionContent content={q.explanation} />
                                  </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })
              ) : (
                <div className="py-16 bg-white border-dashed border-2 border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-3">
                  <Info className="w-8 h-8 text-muted-foreground opacity-30" />
                  <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">
                    No question data available
                  </p>
                </div>
              )}
            </motion.div>
          </div>

          <div className="flex justify-center pt-6">
            <Button
              onClick={() =>
                setLocation(localStorage.getItem("studentInfo") ? "/tests" : "/dashboard")
              }
              className="h-14 px-10 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-xl shadow-blue-500/30 text-base group"
            >
              Take Another Test
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
