import { useLocation, useParams } from "wouter";
import { useSubmission, useExamQuestions } from "@/hooks/useExamData";
import { 
  Shield, ChevronLeft, Award, ShieldAlert, CheckCircle2, 
  XCircle, AlertCircle, HelpCircle, Check, Info, User,
  Clock, Target, Zap, Share2, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function Result() {
  const { attemptId: submissionId } = useParams<{ attemptId: string }>();
  const [, setLocation] = useLocation();

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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-black tracking-widest uppercase text-muted-foreground">Generating Performance Report</p>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <div className="text-center">
          <p className="text-xl font-black mb-1">Report Generation Failed</p>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            {error ? `Error: ${(error as Error).message}` : "The requested assessment data could not be retrieved."}
          </p>
        </div>
        <Button variant="outline" onClick={() => setLocation("/dashboard")} className="rounded-2xl h-12 px-8">Back to Dashboard</Button>
      </div>
    );
  }

  const percentage = submission.total_marks ? Math.round((submission.score / submission.total_marks) * 100) : 0;
  const isPass = percentage >= 50;
  const isTerminated = submission.status === "terminated";

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  const timeTaken = (() => {
    const m = Math.floor(submission.time_used_seconds / 60);
    const s = submission.time_used_seconds % 60;
    return `${m}m ${s}s`;
  })();

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 relative overflow-x-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/[0.02] -z-10" />

      <header className="sticky top-0 z-50 glass border-b">
        <div className="max-w-4xl mx-auto px-8 h-20 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setLocation("/dashboard")} className="rounded-xl hover:bg-surface-sunken">
            <ChevronLeft className="w-5 h-5 mr-2" />
            <span className="font-bold">Dashboard</span>
          </Button>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hidden sm:block">Verified Assessment Record</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 mt-12">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-12">
          
          {/* Header Stats Section */}
          <motion.div variants={item} className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-6">
              <div>
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-black uppercase tracking-widest mb-4">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Assessment Complete</span>
                </div>
                <h1 className="text-5xl font-black tracking-tighter leading-none mb-4">{submission.exams?.title || "Technical Assessment"}</h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Candidate: <span className="text-foreground font-black">{submission.student_name}</span> · ID: {submission.roll_number}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Final Score", value: `${submission.score}/${submission.total_marks}`, icon: <Target className="w-4 h-4 text-primary" /> },
                  { label: "Accuracy", value: `${percentage}%`, icon: <Zap className="w-4 h-4 text-amber-500" /> },
                  { label: "Time Used", value: timeTaken, icon: <Clock className="w-4 h-4 text-blue-500" /> },
                  { label: "Integrity", value: `${submission.violations} Violations`, icon: <ShieldAlert className="w-4 h-4 text-rose-500" />, danger: submission.violations > 0 },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/50 backdrop-blur-sm border p-4 rounded-2xl">
                    <div className="flex items-center space-x-2 text-muted-foreground mb-1">
                      {stat.icon}
                      <span className="text-[9px] font-black uppercase tracking-widest">{stat.label}</span>
                    </div>
                    <div className={`text-lg font-black ${stat.danger ? "text-rose-600" : ""}`}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 flex justify-center">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" className="fill-none stroke-surface-sunken stroke-[8]" />
                  <motion.circle 
                    cx="50" cy="50" r="45" 
                    className={`fill-none stroke-[8] ${isPass ? "stroke-primary" : "stroke-rose-500"}`}
                    strokeDasharray="283"
                    initial={{ strokeDashoffset: 283 }}
                    animate={{ strokeDashoffset: 283 - (283 * percentage) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black tracking-tighter">{percentage}%</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">Global Score</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action Row */}
          <motion.div variants={item} className="flex flex-wrap gap-4">
            <Button className="h-12 px-6 rounded-xl premium-gradient text-white font-bold shadow-lg shadow-primary/20">
              <Download className="w-4 h-4 mr-2" /> Download Official Certificate
            </Button>
            <Button variant="outline" className="h-12 px-6 rounded-xl border-none bg-white/50 backdrop-blur-sm font-bold shadow-sm">
              <Share2 className="w-4 h-4 mr-2" /> Share Result
            </Button>
          </motion.div>

          <hr className="border-border/50" />

          {/* Detailed Question Review */}
          <motion.div variants={item} className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black flex items-center space-x-3">
                <HelpCircle className="w-7 h-7 text-primary" />
                <span>Question Review</span>
              </h2>
              <div className="flex items-center space-x-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <div className="flex items-center space-x-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span>Correct</span></div>
                <div className="flex items-center space-x-1.5"><div className="w-2 h-2 rounded-full bg-rose-500" /><span>Incorrect</span></div>
              </div>
            </div>

            <div className="space-y-6">
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
                          <CardTitle className="text-xl font-bold leading-relaxed">{q.question}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-4 space-y-6">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className={`p-4 rounded-2xl border ${studentAnswer ? (isCorrect ? "bg-emerald-500/[0.03] border-emerald-500/10" : "bg-rose-500/[0.03] border-rose-500/10") : "bg-muted/10 border-border"}`}>
                              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 flex items-center">
                                <User className="w-3 h-3 mr-1.5" /> Your Submission
                              </p>
                              <p className={`font-bold ${studentAnswer ? (isCorrect ? "text-emerald-700" : "text-rose-700") : "text-muted-foreground"}`}>
                                {studentAnswer || "No Response"}
                              </p>
                            </div>
                            <div className="p-4 rounded-2xl bg-primary/[0.03] border border-primary/10">
                              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary mb-2 flex items-center">
                                <CheckCircle2 className="w-3 h-3 mr-1.5" /> Ideal Outcome
                              </p>
                              <p className="font-bold text-primary">
                                {q.correct_answer}
                              </p>
                            </div>
                          </div>

                          {q.explanation && (
                            <div className="p-4 rounded-2xl bg-surface-sunken/50 border-dashed border flex items-start space-x-3">
                              <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Analytical Insight</p>
                                <p className="text-sm text-muted-foreground leading-relaxed italic">{q.explanation}</p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })
              ) : (
                <div className="py-20 glass rounded-3xl border-dashed border-2 flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-surface-sunken flex items-center justify-center">
                    <Info className="w-8 h-8 text-muted-foreground opacity-20" />
                  </div>
                  <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">No granular question data found</p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div variants={item} className="flex justify-center pt-8">
            <Button 
              onClick={() => setLocation("/dashboard")} 
              className="h-16 px-12 rounded-2xl premium-gradient text-white font-black shadow-2xl shadow-primary/20 text-lg group"
            >
              Conclude Review <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>

        </motion.div>
      </main>
    </div>
  );
}

