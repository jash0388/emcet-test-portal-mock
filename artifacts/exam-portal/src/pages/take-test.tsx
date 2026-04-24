import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Flag,
  User,
  ShieldAlert,
  ArrowLeft,
  PlayCircle,
  Sparkles,
  ListChecks,
  FileText,
} from "lucide-react";
import { useExam, useExamQuestions, useSubmitExam } from "@/hooks/useExamData";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface StudentInfo {
  studentName: string;
  studentPhone: string;
  fatherName: string;
  fatherPhone: string;
  college: string;
  timestamp: string;
}

type TestPhase = "instructions" | "in-progress";

function getOrCreateStudentId(): string {
  let id = localStorage.getItem("studentSessionId");
  if (!id) {
    id =
      "stud-" +
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2, 10);
    localStorage.setItem("studentSessionId", id);
  }
  return id;
}

export default function TakeTest() {
  const { examId } = useParams<{ examId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: exam, isLoading: examLoading } = useExam(examId);
  const { data: questions, isLoading: questionsLoading } = useExamQuestions(examId);
  const submitExam = useSubmitExam();

  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [phase, setPhase] = useState<TestPhase>("instructions");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [violationCount, setViolationCount] = useState(0);
  const [breachOverlay, setBreachOverlay] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number>(() => Date.now());

  const violationRef = useRef(0);
  const breachOverlayRef = useRef(false);
  const submittedRef = useRef(false);
  const answersRef = useRef<Record<string, string>>({});
  answersRef.current = answers;

  // Load student info
  useEffect(() => {
    const raw = localStorage.getItem("studentInfo");
    if (!raw) {
      setLocation("/");
      return;
    }
    try {
      setStudentInfo(JSON.parse(raw));
    } catch {
      setLocation("/");
    }
  }, [setLocation]);

  // Submit handler
  const handleSubmit = useCallback(
    (forced = false) => {
      if (!exam || !questions || !studentInfo) return;
      if (submittedRef.current) return;
      submittedRef.current = true;

      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      const totalMarks = questions.reduce((s, q) => s + q.marks, 0);
      let score = 0;
      const currentAnswers = answersRef.current;

      for (const q of questions) {
        if (q.question_type === "mcq" && q.correct_answer) {
          const given = currentAnswers[q.id];
          if (given && given.trim() === q.correct_answer.trim()) {
            score += q.marks;
          }
        }
      }

      const questionSnapshots = questions.map((q) => ({
        id: q.id,
        exam_id: q.exam_id,
        question: q.question,
        question_type: q.question_type,
        options: q.options,
        correct_answer: q.correct_answer,
        marks: q.marks,
        sort_order: q.sort_order,
        explanation: q.explanation ?? null,
        created_at: q.created_at,
      }));

      submitExam.mutate(
        {
          user_id: getOrCreateStudentId(),
          exam_id: exam.id,
          score,
          total_marks: totalMarks,
          violations: violationRef.current,
          time_used_seconds: timeTaken,
          status: forced ? "terminated" : "completed",
          student_name: studentInfo.studentName,
          roll_number: studentInfo.studentPhone,
          student_answers: currentAnswers,
          question_snapshots: questionSnapshots,
        },
        {
          onSuccess: (sub) => {
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(() => {});
            }
            setLocation(`/result/${sub.id}`);
          },
          onError: (err: any) => {
            console.error("Submit error:", err);
            submittedRef.current = false;
            toast({
              variant: "destructive",
              title: "Submission Failed",
              description: err?.message || "Could not submit. Please try again.",
            });
          },
        }
      );
    },
    [exam, questions, studentInfo, startTime, submitExam, setLocation, toast]
  );

  const handleSubmitRef = useRef(handleSubmit);
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  const examMaxViolations = exam?.max_violations ?? 3;
  const examMaxViolationsRef = useRef(examMaxViolations);
  useEffect(() => {
    examMaxViolationsRef.current = examMaxViolations;
  }, [examMaxViolations]);

  // Start timer once entering in-progress
  useEffect(() => {
    if (exam && phase === "in-progress" && timeLeft === null) {
      setTimeLeft(exam.duration_minutes * 60);
      setStartTime(Date.now());
    }
  }, [exam, phase, timeLeft]);

  // Tick timer
  useEffect(() => {
    if (phase !== "in-progress" || timeLeft === null) return;
    if (timeLeft <= 0) {
      handleSubmit(false);
      return;
    }
    const t = setTimeout(() => setTimeLeft((p) => (p !== null ? p - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, phase, handleSubmit]);

  // Proctoring: tab/visibility/fullscreen
  useEffect(() => {
    if (phase !== "in-progress" || !exam) return;

    const handleBreach = () => {
      if (breachOverlayRef.current) return;
      const newCount = violationRef.current + 1;
      violationRef.current = newCount;
      setViolationCount(newCount);
      breachOverlayRef.current = true;
      setBreachOverlay(true);

      if (newCount >= examMaxViolationsRef.current) {
        handleSubmitRef.current(true);
        return;
      }
      setTimeout(() => {
        breachOverlayRef.current = false;
        setBreachOverlay(false);
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      }, 3000);
    };

    const onFSChange = () => {
      if (!document.fullscreenElement) handleBreach();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") handleBreach();
    };
    const onBlur = () => handleBreach();

    document.addEventListener("fullscreenchange", onFSChange);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("fullscreenchange", onFSChange);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
    };
  }, [phase, exam]);

  const handleStartTest = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // proceed even if FS request fails
    }
    setPhase("in-progress");
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const answeredCount = useMemo(
    () => Object.values(answers).filter((v) => v && v.trim() !== "").length,
    [answers]
  );

  if (!studentInfo) return null;

  if (examLoading || questionsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">
            Loading test
          </p>
        </div>
      </div>
    );
  }

  if (!exam || !questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500" />
        <h2 className="text-2xl font-black">Test not available</h2>
        <p className="text-muted-foreground max-w-sm">
          This test could not be loaded or has no questions yet.
        </p>
        <Button onClick={() => setLocation("/tests")} className="rounded-2xl h-12 px-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Tests
        </Button>
      </div>
    );
  }

  // ───── Instructions / Pre-start screen ─────
  if (phase === "instructions") {
    const totalMarks = questions.reduce((s, q) => s + q.marks, 0);
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[140px]" />

        <header className="w-full glass-card border-b sticky top-0 z-50 backdrop-blur-xl bg-white/70">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setLocation("/tests")}
              className="rounded-xl hover:bg-surface-sunken"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="font-bold">All Tests</span>
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 premium-gradient rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hidden sm:block">
                Proctored Assessment
              </span>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-6 py-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-bold text-primary uppercase tracking-widest">
                  Ready to Begin
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-3">
                {exam.title}
              </h1>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                {exam.description ||
                  "Read the instructions carefully before starting your test."}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  icon: <Clock className="w-5 h-5" />,
                  label: "Duration",
                  value: `${exam.duration_minutes}m`,
                },
                {
                  icon: <ListChecks className="w-5 h-5" />,
                  label: "Questions",
                  value: questions.length.toString(),
                },
                {
                  icon: <FileText className="w-5 h-5" />,
                  label: "Total Marks",
                  value: totalMarks.toString(),
                },
                {
                  icon: <ShieldAlert className="w-5 h-5" />,
                  label: "Max Breaches",
                  value: exam.max_violations.toString(),
                  danger: true,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white border border-border/60 rounded-2xl p-4 text-center shadow-sm"
                >
                  <div
                    className={`w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center ${
                      s.danger
                        ? "bg-rose-500/10 text-rose-600"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {s.icon}
                  </div>
                  <div className="text-2xl font-black mb-0.5">{s.value}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Candidate */}
            <Card className="border border-border/60 bg-white p-6 rounded-3xl shadow-sm">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <User className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                    Candidate
                  </p>
                  <p className="text-lg font-black">{studentInfo.studentName}</p>
                  <p className="text-xs text-muted-foreground">{studentInfo.college}</p>
                </div>
              </div>
            </Card>

            {/* Rules */}
            <Card className="border border-amber-200 bg-amber-50/50 p-6 rounded-3xl">
              <div className="flex items-start space-x-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <h3 className="font-black text-base">Important Guidelines</h3>
              </div>
              <ul className="space-y-2.5 text-sm text-foreground/80 pl-8">
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span>The test will open in fullscreen — do not exit until submission.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span>
                    Switching tabs or minimising will be logged as a violation. Exceeding{" "}
                    {exam.max_violations} violations will auto-submit your test.
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span>The timer cannot be paused once started.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span>Your answers are auto-evaluated immediately upon submission.</span>
                </li>
              </ul>
            </Card>

            <Button
              onClick={handleStartTest}
              className="w-full h-16 rounded-2xl premium-gradient text-lg font-bold shadow-2xl shadow-primary/20 hover:shadow-primary/30"
            >
              <PlayCircle className="w-5 h-5 mr-2" />
              I Understand — Start Test
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

  // ───── In-progress test ─────
  const currentQuestion = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col cursor-default select-none overflow-hidden">
      {/* Breach overlay */}
      <AnimatePresence>
        {breachOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-rose-600/95 flex items-center justify-center p-6"
          >
            <div className="text-center text-white max-w-md">
              <ShieldAlert className="w-20 h-20 mx-auto mb-6 animate-pulse" />
              <h2 className="text-4xl font-black tracking-tighter mb-3">
                Security Breach Detected
              </h2>
              <p className="text-rose-100 text-lg leading-relaxed mb-4">
                Tab switching or fullscreen exit is not permitted during the test.
              </p>
              <div className="inline-block px-5 py-2 rounded-full bg-white/15 backdrop-blur-sm">
                <span className="font-black text-sm uppercase tracking-widest">
                  Violation {violationCount} of {examMaxViolations}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <header className="border-b border-border/60 bg-white/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-9 h-9 premium-gradient rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-black leading-tight truncate max-w-[200px] md:max-w-md">
                {exam.title}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                {studentInfo.studentName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Badge
              variant="secondary"
              className="rounded-lg px-2.5 py-1 text-[10px] font-black tracking-widest uppercase bg-rose-500/10 text-rose-600 hover:bg-rose-500/15"
            >
              <ShieldAlert className="w-3 h-3 mr-1" />
              {violationCount} / {examMaxViolations}
            </Badge>
            <div
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-mono font-black ${
                timeLeft !== null && timeLeft < 60
                  ? "bg-rose-500/10 text-rose-600"
                  : "bg-primary/10 text-primary"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{timeLeft !== null ? formatTime(timeLeft) : "--:--"}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 grid lg:grid-cols-12 gap-6">
        {/* Question pane */}
        <main className="lg:col-span-8">
          <Card className="border border-border/60 bg-white rounded-3xl shadow-sm p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <Badge className="bg-primary/10 text-primary border-none rounded-lg px-2.5 py-1 text-[10px] font-black tracking-widest uppercase hover:bg-primary/15">
                Question {currentIndex + 1} of {questions.length}
              </Badge>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {currentQuestion.marks} {currentQuestion.marks === 1 ? "Mark" : "Marks"}
              </div>
            </div>

            <h2 className="text-xl md:text-2xl font-bold leading-relaxed mb-8 text-foreground whitespace-pre-wrap">
              {currentQuestion.question}
            </h2>

            {currentQuestion.question_type === "mcq" &&
              currentQuestion.options &&
              currentQuestion.options.length > 0 && (
                <RadioGroup
                  value={answers[currentQuestion.id] || ""}
                  onValueChange={(v) => handleAnswerChange(currentQuestion.id, v)}
                  className="space-y-3"
                >
                  {currentQuestion.options.map((opt, idx) => {
                    const id = `${currentQuestion.id}-opt-${idx}`;
                    const selected = answers[currentQuestion.id] === opt;
                    return (
                      <Label
                        key={id}
                        htmlFor={id}
                        className={`flex items-start space-x-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-border/60 hover:border-primary/40 hover:bg-primary/[0.02]"
                        }`}
                      >
                        <RadioGroupItem value={opt} id={id} className="mt-1" />
                        <span className="flex-1 text-base font-medium leading-relaxed">
                          <span className="text-muted-foreground font-black mr-2">
                            {String.fromCharCode(65 + idx)}.
                          </span>
                          {opt}
                        </span>
                      </Label>
                    );
                  })}
                </RadioGroup>
              )}

            {(currentQuestion.question_type === "paragraph" ||
              currentQuestion.question_type === "code") && (
              <Textarea
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                placeholder="Type your answer here..."
                className={`min-h-[240px] text-base bg-surface-sunken border-border/60 rounded-2xl ${
                  currentQuestion.question_type === "code" ? "font-mono" : ""
                }`}
              />
            )}

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/60">
              <Button
                variant="outline"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="rounded-2xl h-12 px-6"
              >
                <ChevronLeft className="w-4 h-4 mr-2" /> Previous
              </Button>

              {!isLast ? (
                <Button
                  onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                  className="rounded-2xl h-12 px-6 premium-gradient text-white font-bold"
                >
                  Next <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => handleSubmit(false)}
                  disabled={submitExam.isPending}
                  className="rounded-2xl h-12 px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                >
                  <Flag className="w-4 h-4 mr-2" />
                  {submitExam.isPending ? "Submitting..." : "Submit Test"}
                </Button>
              )}
            </div>
          </Card>
        </main>

        {/* Side: navigator */}
        <aside className="lg:col-span-4 space-y-4">
          <Card className="border border-border/60 bg-white rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-sm uppercase tracking-widest">Progress</h3>
              <span className="text-xs text-muted-foreground font-bold">
                {answeredCount} / {questions.length}
              </span>
            </div>
            <div className="w-full h-2 bg-surface-sunken rounded-full overflow-hidden mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(answeredCount / questions.length) * 100}%` }}
                className="h-full premium-gradient"
              />
            </div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
              {totalMarks} total marks
            </p>
          </Card>

          <Card className="border border-border/60 bg-white rounded-3xl p-6 shadow-sm">
            <h3 className="font-black text-sm uppercase tracking-widest mb-4">
              Question Navigator
            </h3>
            <div className="grid grid-cols-6 md:grid-cols-5 gap-2">
              {questions.map((q, i) => {
                const isAnswered =
                  answers[q.id] !== undefined && answers[q.id].trim() !== "";
                const isCurrent = i === currentIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(i)}
                    className={`aspect-square rounded-xl text-xs font-black transition-all flex items-center justify-center ${
                      isCurrent
                        ? "premium-gradient text-white shadow-lg shadow-primary/30 scale-105"
                        : isAnswered
                        ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 hover:bg-emerald-500/15"
                        : "bg-surface-sunken text-muted-foreground border border-border hover:border-primary/40"
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-border/60">
              <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <span className="w-3 h-3 rounded bg-emerald-500/30" />
                Done
              </div>
              <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <span className="w-3 h-3 rounded bg-surface-sunken border border-border" />
                Pending
              </div>
            </div>
          </Card>

          <Button
            variant="outline"
            onClick={() => handleSubmit(false)}
            disabled={submitExam.isPending}
            className="w-full h-12 rounded-2xl border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 font-bold"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {submitExam.isPending ? "Submitting..." : "Submit Test Now"}
          </Button>
        </aside>
      </div>
    </div>
  );
}
