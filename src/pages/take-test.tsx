import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { motion } from "framer-motion";
import {
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Flag,
  User,
  ArrowLeft,
  PlayCircle,
  Sparkles,
  ListChecks,
  FileText,
  XCircle,
  BookOpen,
  Award,
  Hash,
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
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number>(() => Date.now());

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

  // Track visited questions
  useEffect(() => {
    setVisited((prev) => {
      if (prev.has(currentIndex)) return prev;
      const next = new Set(prev);
      next.add(currentIndex);
      return next;
    });
  }, [currentIndex]);

  // Submit handler
  const handleSubmit = useCallback(() => {
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

    submitExam.mutate(
      {
        user_id: getOrCreateStudentId(),
        exam_id: exam.id,
        score,
        total_marks: totalMarks,
        violations: 0,
        time_used_seconds: timeTaken,
        status: "completed",
        student_name: studentInfo.studentName,
        roll_number: studentInfo.studentPhone,
        student_phone: studentInfo.studentPhone,
        father_name: studentInfo.fatherName,
        father_phone: studentInfo.fatherPhone,
        college: studentInfo.college,
        student_answers: currentAnswers,
      },
      {
        onSuccess: (sub) => {
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
  }, [exam, questions, studentInfo, startTime, submitExam, setLocation, toast]);

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
      handleSubmit();
      return;
    }
    const t = setTimeout(() => setTimeLeft((p) => (p !== null ? p - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, phase, handleSubmit]);

  const handleStartTest = () => {
    setPhase("in-progress");
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleClearAnswer = (questionId: string) => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const answeredCount = useMemo(
    () => Object.values(answers).filter((v) => v && v.trim() !== "").length,
    [answers]
  );

  // Map every "easy" question id -> "A" or "B" (first half = A, second half = B).
  const easyPartByQuestionId = useMemo(() => {
    const map = new Map<string, "A" | "B">();
    if (!questions) return map;
    const easy = questions.filter((q) => q.difficulty === "easy");
    if (easy.length === 0) return map;
    const half = Math.ceil(easy.length / 2);
    easy.forEach((q, i) => {
      map.set(q.id, i < half ? "A" : "B");
    });
    return map;
  }, [questions]);

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 relative overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[140px]" />

        <header className="w-full border-b border-border/50 sticky top-0 z-50 backdrop-blur-xl bg-white/70">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setLocation("/tests")}
              className="rounded-xl hover:bg-blue-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="font-bold">All Tests</span>
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hidden sm:block">
                Mock Examination
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
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200 mb-4">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">
                  Ready to Begin
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-3 bg-gradient-to-br from-slate-900 to-blue-700 bg-clip-text text-transparent">
                {exam.title}
              </h1>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                {exam.description ||
                  "Read the instructions carefully before starting your test."}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  icon: <Clock className="w-5 h-5" />,
                  label: "Duration",
                  value: `${exam.duration_minutes}m`,
                  color: "from-blue-500 to-indigo-500",
                },
                {
                  icon: <ListChecks className="w-5 h-5" />,
                  label: "Questions",
                  value: questions.length.toString(),
                  color: "from-emerald-500 to-teal-500",
                },
                {
                  icon: <Award className="w-5 h-5" />,
                  label: "Total Marks",
                  value: totalMarks.toString(),
                  color: "from-amber-500 to-orange-500",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white border border-border/60 rounded-2xl p-4 text-center shadow-sm"
                >
                  <div
                    className={`w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center bg-gradient-to-br ${s.color} text-white shadow-lg`}
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
            <Card className="border border-blue-200/60 bg-gradient-to-br from-white to-blue-50/40 p-6 rounded-3xl shadow-sm">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <User className="w-7 h-7 text-white" />
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

            {/* Real EMCET / JEE-style instructions */}
            <Card className="border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/50 p-6 rounded-3xl shadow-sm">
              <div className="flex items-start space-x-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-base text-amber-900">
                    General Instructions
                  </h3>
                  <p className="text-xs text-amber-800/70 mt-0.5">
                    Please read carefully before beginning the examination
                  </p>
                </div>
              </div>
              <ol className="space-y-3 text-sm text-foreground/85 list-none">
                {[
                  `Total duration of the examination is ${exam.duration_minutes} minutes.`,
                  `The clock will be set on the server. The countdown timer in the top right corner of the screen will display the remaining time available for you to complete the examination.`,
                  `When the timer reaches zero, the examination will end automatically. You will not be required to end or submit your examination.`,
                  `The Question Palette on the right of the screen shows the status of each question using one of the following symbols:`,
                  `Each question carries marks as indicated. There is no negative marking in this mock test.`,
                  `You can click on the "Clear Selection" button below the options to deselect your chosen answer for any question.`,
                  `You can navigate between questions freely using the Previous and Next buttons or by clicking on the question number in the Question Palette.`,
                  `Click on "Submit Test" when you have completed the examination. Once submitted, you will not be able to make any changes.`,
                ].map((text, i) => (
                  <li key={i} className="flex items-start space-x-3">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{text}</span>
                  </li>
                ))}
              </ol>

              {/* Legend */}
              <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-amber-200/60">
                <div className="flex items-center space-x-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-500 text-white text-xs font-black flex items-center justify-center shadow-sm">
                    1
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Answered
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-7 h-7 rounded-lg bg-amber-400 text-white text-xs font-black flex items-center justify-center shadow-sm">
                    2
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Not Answered
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-300 text-slate-600 text-xs font-black flex items-center justify-center">
                    3
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Not Visited
                  </span>
                </div>
              </div>
            </Card>

            <Button
              onClick={handleStartTest}
              className="w-full h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg font-bold shadow-2xl shadow-blue-500/30"
            >
              <PlayCircle className="w-5 h-5 mr-2" />
              I am ready to begin
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
  const hasAnswer =
    answers[currentQuestion.id] !== undefined && answers[currentQuestion.id].trim() !== "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 text-foreground flex flex-col cursor-default select-none">
      {/* Top bar */}
      <header className="border-b border-border/60 bg-white/90 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
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
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-black text-emerald-700">
                {answeredCount}/{questions.length}
              </span>
            </div>
            <div
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-mono font-black border ${
                timeLeft !== null && timeLeft < 60
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : timeLeft !== null && timeLeft < 300
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-blue-50 text-blue-700 border-blue-200"
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
          <Card className="border border-blue-100 bg-white rounded-3xl shadow-xl shadow-blue-500/[0.04] overflow-hidden">
            {/* Question header strip */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 md:px-8 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-black">
                  {currentIndex + 1}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-blue-100 font-bold">
                    Question
                  </p>
                  <p className="text-white font-black text-sm">
                    {currentIndex + 1} of {questions.length}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {easyPartByQuestionId.get(currentQuestion.id) && (
                  <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-400/25 backdrop-blur-sm border border-emerald-200/40">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                      Easy · Part {easyPartByQuestionId.get(currentQuestion.id)}
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white/15 backdrop-blur-sm">
                  <Award className="w-3.5 h-3.5 text-white" />
                  <span className="text-xs font-black text-white uppercase tracking-widest">
                    {currentQuestion.marks} {currentQuestion.marks === 1 ? "Mark" : "Marks"}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold leading-relaxed mb-8 text-slate-900 whitespace-pre-wrap">
                {currentQuestion.question}
              </h2>

              {currentQuestion.question_type === "mcq" &&
                currentQuestion.options &&
                currentQuestion.options.length > 0 && (
                  <>
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
                                ? "border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md shadow-blue-500/10"
                                : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30"
                            }`}
                          >
                            <RadioGroupItem value={opt} id={id} className="mt-1" />
                            <span className="flex-1 text-base font-medium leading-relaxed text-slate-800">
                              <span
                                className={`font-black mr-2 ${
                                  selected ? "text-blue-600" : "text-slate-400"
                                }`}
                              >
                                {String.fromCharCode(65 + idx)}.
                              </span>
                              {opt}
                            </span>
                          </Label>
                        );
                      })}
                    </RadioGroup>
                    {hasAnswer && (
                      <div className="mt-4 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleClearAnswer(currentQuestion.id)}
                          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl font-bold"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Clear Selection
                        </Button>
                      </div>
                    )}
                  </>
                )}

              {(currentQuestion.question_type === "paragraph" ||
                currentQuestion.question_type === "code") && (
                <>
                  <Textarea
                    value={answers[currentQuestion.id] || ""}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    placeholder="Type your answer here..."
                    className={`min-h-[240px] text-base bg-slate-50 border-slate-200 rounded-2xl focus:border-blue-400 ${
                      currentQuestion.question_type === "code" ? "font-mono" : ""
                    }`}
                  />
                  {hasAnswer && (
                    <div className="mt-3 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleClearAnswer(currentQuestion.id)}
                        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl font-bold"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Clear Answer
                      </Button>
                    </div>
                  )}
                </>
              )}

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  disabled={currentIndex === 0}
                  className="rounded-2xl h-12 px-6 border-slate-300 hover:bg-slate-50"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                </Button>

                {!isLast ? (
                  <Button
                    onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                    className="rounded-2xl h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-blue-500/30"
                  >
                    Save & Next <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSubmit()}
                    disabled={submitExam.isPending}
                    className="rounded-2xl h-12 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/30"
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    {submitExam.isPending ? "Submitting..." : "Submit Test"}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </main>

        {/* Side: navigator */}
        <aside className="lg:col-span-4 space-y-4">
          <Card className="border border-blue-100 bg-white rounded-3xl p-6 shadow-xl shadow-blue-500/[0.04] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-sm uppercase tracking-widest flex items-center space-x-2">
                <Hash className="w-4 h-4 text-blue-600" />
                <span>Progress</span>
              </h3>
              <span className="text-xs text-emerald-700 font-black bg-emerald-50 px-2.5 py-1 rounded-lg">
                {answeredCount} / {questions.length}
              </span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(answeredCount / questions.length) * 100}%` }}
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
              />
            </div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
              {totalMarks} total marks
            </p>
          </Card>

          <Card className="border border-blue-100 bg-white rounded-3xl p-6 shadow-xl shadow-blue-500/[0.04]">
            <h3 className="font-black text-sm uppercase tracking-widest mb-4 flex items-center space-x-2">
              <ListChecks className="w-4 h-4 text-blue-600" />
              <span>Question Palette</span>
            </h3>
            <div className="grid grid-cols-6 md:grid-cols-5 gap-2">
              {questions.map((q, i) => {
                const isAnswered =
                  answers[q.id] !== undefined && answers[q.id].trim() !== "";
                const isCurrent = i === currentIndex;
                const wasVisited = visited.has(i);

                let cls = "";
                if (isCurrent) {
                  cls =
                    "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/40 scale-105 ring-2 ring-blue-300 ring-offset-2";
                } else if (isAnswered) {
                  cls =
                    "bg-emerald-500 text-white border border-emerald-600 hover:bg-emerald-600 shadow-sm";
                } else if (wasVisited) {
                  cls =
                    "bg-amber-400 text-white border border-amber-500 hover:bg-amber-500 shadow-sm";
                } else {
                  cls =
                    "bg-slate-100 text-slate-600 border border-slate-300 hover:border-blue-400 hover:bg-blue-50";
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(i)}
                    className={`aspect-square rounded-xl text-xs font-black transition-all flex items-center justify-center ${cls}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-1 gap-2 mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 shadow-sm" />
                <span>Answered</span>
              </div>
              <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <span className="w-3.5 h-3.5 rounded-md bg-amber-400 shadow-sm" />
                <span>Not Answered</span>
              </div>
              <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <span className="w-3.5 h-3.5 rounded-md bg-slate-100 border border-slate-300" />
                <span>Not Visited</span>
              </div>
            </div>
          </Card>

          <Button
            onClick={() => handleSubmit()}
            disabled={submitExam.isPending}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/30"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {submitExam.isPending ? "Submitting..." : "Submit Test Now"}
          </Button>
        </aside>
      </div>
    </div>
  );
}
