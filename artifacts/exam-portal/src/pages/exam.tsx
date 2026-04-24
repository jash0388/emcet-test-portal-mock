import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useExam, useExamQuestions, useSubmitExam, useMySubmissions } from "@/hooks/useExamData";
import { AlertTriangle, Clock, ShieldAlert, CheckCircle2, User, Hash, ChevronRight, ChevronLeft, Flag, Phone, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { QuestionContent } from "@/components/QuestionContent";
import { Shield } from "lucide-react";

type ExamPhase = "pre-form" | "instructions" | "in-progress";

export default function ExamTaking() {
  const { examId } = useParams<{ examId: string }>();
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { data: profile } = useProfile(user?.uid);
  const { toast } = useToast();

  const [phase, setPhase] = useState<ExamPhase>("pre-form");
  const [studentName, setStudentName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [fatherPhone, setFatherPhone] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [nameError, setNameError] = useState("");
  const [rollError, setRollError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [fatherNameError, setFatherNameError] = useState("");
  const [fatherPhoneError, setFatherPhoneError] = useState("");

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [breachOverlay, setBreachOverlay] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [activePart, setActivePart] = useState("A");
  const [violationCount, setViolationCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startTime] = useState(() => Date.now());
  const submitExam = useSubmitExam();

  const violationRef = useRef(0);
  const breachOverlayRef = useRef(false);
  const submittedRef = useRef(false);

  const { data: exam, isLoading: examLoading } = useExam(examId);
  const { data: questions, isLoading: questionsLoading } = useExamQuestions(examId);
  const { data: mySubmissions, isLoading: submissionsLoading } = useMySubmissions(user?.uid);

  // Redirect if already submitted this exam
  useEffect(() => {
    if (!mySubmissions || !examId) return;
    const existing = mySubmissions.find((s) => s.exam_id === examId);
    if (existing) setLocation(`/result/${existing.id}`);
  }, [mySubmissions, examId, setLocation]);

  // Pre-fill from profile and localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("studentInfo");
      if (stored) {
        const data = JSON.parse(stored);
        if (data.studentName) setStudentName(data.studentName);
        if (data.fatherName) setFatherName(data.fatherName);
        if (data.fatherPhone) setFatherPhone(data.fatherPhone);
        if (data.studentPhone) setStudentPhone(data.studentPhone);
      }
    } catch (e) {
      // Ignore parse errors
    }
    
    if (profile) {
      if (!studentName && profile.full_name) setStudentName(profile.full_name);
      else if (!studentName && user?.displayName) setStudentName(user.displayName);
      else if (!studentName && user?.email) setStudentName(user.email.split("@")[0]);
      if (profile.name) setRollNumber(profile.name);
    }
  }, [profile, user]);

  useEffect(() => {
    localStorage.setItem("studentInfo", JSON.stringify({ 
      studentName, 
      rollNumber, 
      fatherName, 
      fatherPhone, 
      studentPhone 
    }));
  }, [studentName, rollNumber, fatherName, fatherPhone, studentPhone]);

  useEffect(() => {
    if (!authLoading && !user) setLocation("/");
  }, [user, authLoading, setLocation]);

  // Start timer once exam loads and we enter in-progress
  useEffect(() => {
    if (exam && phase === "in-progress" && timeLeft === null) {
      setTimeLeft(exam.duration_minutes * 60);
    }
  }, [exam, phase, timeLeft]);

  const answersRef = useRef<Record<string, string>>({});
  answersRef.current = answers;

  const handleSubmitExam = useCallback(
    (forced = false) => {
      if (!user || !exam || !questions) return;
      if (submittedRef.current) return;
      submittedRef.current = true;

      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      let score = 0;
      const totalMarks = questions.reduce((s, q) => s + q.marks, 0);
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
        question: q.question,
        question_type: q.question_type,
        options: q.options,
        correct_answer: q.correct_answer,
        marks: q.marks,
        sort_order: q.sort_order,
        explanation: q.explanation ?? null,
      }));

      submitExam.mutate({
        user_id: user.uid,
        exam_id: exam.id,
        score,
        total_marks: totalMarks,
        violations: violationRef.current,
        time_used_seconds: timeTaken,
        status: forced ? "terminated" : "completed",
        student_name: studentName || user.email || "Unknown",
        roll_number: rollNumber,
        father_name: fatherName,
        father_phone: fatherPhone,
        student_phone: studentPhone,
        student_answers: currentAnswers,
        question_snapshots: questionSnapshots,
      }, {
        onSuccess: (sub) => {
          if (document.fullscreenElement) document.exitFullscreen().catch(console.error);
          setLocation(`/result/${sub.id}`);
        },
        onError: (err) => {
          console.error("Submit error:", err);
          submittedRef.current = false;
          toast({ variant: "destructive", title: "Submit Failed", description: "Could not submit. Please try again." });
        },
      });
    },
    [user, exam, questions, startTime, submitExam, setLocation, toast, studentName, rollNumber, fatherName, fatherPhone, studentPhone]
  );

  // Timer countdown
  useEffect(() => {
    if (phase !== "in-progress" || timeLeft === null) return;
    if (timeLeft <= 0) { handleSubmitExam(false); return; }
    const t = setTimeout(() => setTimeLeft((p) => (p !== null ? p - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, phase, handleSubmitExam]);

  // Keep refs in sync with state
  useEffect(() => { violationRef.current = violationCount; }, [violationCount]);
  useEffect(() => { breachOverlayRef.current = breachOverlay; }, [breachOverlay]);

  useEffect(() => {
    if (currentQuestionIndex < 15) {
      setActivePart("A");
    } else {
      setActivePart("B");
    }
  }, [currentQuestionIndex]);

  const handleSubmitExamRef = useRef(handleSubmitExam);
  useEffect(() => { handleSubmitExamRef.current = handleSubmitExam; }, [handleSubmitExam]);

  const examMaxViolationsRef = useRef(exam?.max_violations ?? 3);
  useEffect(() => { if (exam) examMaxViolationsRef.current = exam.max_violations; }, [exam]);

  // Security monitoring
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
        handleSubmitExamRef.current(true);
        return;
      }

      setTimeout(() => {
        breachOverlayRef.current = false;
        setBreachOverlay(false);
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(console.error);
        }
      }, 3000);
    };

    const onFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) handleBreach();
    };
    const onVisibility = () => { if (document.visibilityState === "hidden") handleBreach(); };
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

  const handleEnterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      setPhase("in-progress");
    } catch (err) {
      console.error(err);
      setPhase("in-progress");
    }
  };

  const handlePreFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;
    if (!studentName.trim()) { setNameError("Full name is required"); valid = false; }
    else setNameError("");
    if (!rollNumber.trim()) { setRollError("Roll number is required"); valid = false; }
    else setRollError("");
    if (!studentPhone.trim()) { setPhoneError("Student phone is required"); valid = false; }
    else setPhoneError("");
    if (!fatherName.trim()) { setFatherNameError("Father's name is required"); valid = false; }
    else setFatherNameError("");
    if (!fatherPhone.trim()) { setFatherPhoneError("Father's phone is required"); valid = false; }
    else setFatherPhoneError("");
    if (valid) setPhase("instructions");
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  if (authLoading || examLoading || questionsLoading || submissionsLoading) return <div className="min-h-screen bg-background" />;
  if (!exam || !questions) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">Exam not found.</div>;

  // ─── Phase 1: Name + Roll Number form ────────────────────────────────────────
  if (phase === "pre-form") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-8"
        >
          <div className="text-center space-y-4">
            <div className="w-20 h-20 premium-gradient rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-primary/20">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter">{exam.title}</h1>
              <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px] mt-1">Identity Verification</p>
            </div>
          </div>

          <Card className="border-none shadow-2xl p-8 bg-white/90 backdrop-blur-xl">
            <form onSubmit={handlePreFormSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Candidate Name</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    className="h-14 pl-12 bg-surface-sunken border-none text-lg font-bold"
                    placeholder="Enter full name"
                    value={studentName}
                    onChange={(e) => { setStudentName(e.target.value); setNameError(""); }}
                  />
                </div>
                {nameError && <p className="text-xs text-rose-500 font-bold">{nameError}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Roll Number</Label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    className="h-14 pl-12 bg-surface-sunken border-none text-lg font-mono font-bold"
                    placeholder="e.g. CS-2024-001"
                    value={rollNumber}
                    onChange={(e) => { setRollNumber(e.target.value); setRollError(""); }}
                  />
                </div>
                {rollError && <p className="text-xs text-rose-500 font-bold">{rollError}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Student Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    className="h-14 pl-12 bg-surface-sunken border-none text-lg font-bold"
                    placeholder="Enter phone number"
                    type="tel"
                    value={studentPhone}
                    onChange={(e) => { setStudentPhone(e.target.value); setPhoneError(""); }}
                  />
                </div>
                {phoneError && <p className="text-xs text-rose-500 font-bold">{phoneError}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Father's Name</Label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    className="h-14 pl-12 bg-surface-sunken border-none text-lg font-bold"
                    placeholder="Enter father's full name"
                    value={fatherName}
                    onChange={(e) => { setFatherName(e.target.value); setFatherNameError(""); }}
                  />
                </div>
                {fatherNameError && <p className="text-xs text-rose-500 font-bold">{fatherNameError}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Father's Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    className="h-14 pl-12 bg-surface-sunken border-none text-lg font-bold"
                    placeholder="Enter father's phone number"
                    type="tel"
                    value={fatherPhone}
                    onChange={(e) => { setFatherPhone(e.target.value); setFatherPhoneError(""); }}
                  />
                </div>
                {fatherPhoneError && <p className="text-xs text-rose-500 font-bold">{fatherPhoneError}</p>}
              </div>

              <div className="p-4 rounded-2xl bg-primary/[0.03] border border-primary/10 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-bold uppercase tracking-widest">Duration</span>
                  <span className="font-black">{exam.duration_minutes}m</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-bold uppercase tracking-widest">Integrity Threshold</span>
                  <span className="font-black text-rose-500">{exam.max_violations} Violations</span>
                </div>
              </div>

              <Button type="submit" className="w-full h-14 rounded-2xl premium-gradient text-lg font-bold shadow-xl shadow-primary/20">
                Continue to Instructions
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ─── Phase 2: Instructions ──────────────────────────────────────────────────
  if (phase === "instructions") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl w-full text-center space-y-10"
        >
          <div className="w-24 h-24 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto animate-pulse">
            <AlertTriangle className="w-12 h-12 text-amber-600" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black tracking-tighter">Security Protocol</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              To ensure assessment integrity, this session will be locked in <span className="text-primary font-bold">Fullscreen Mode</span>. 
              Any attempt to switch windows or exit fullscreen will be logged as a violation.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Candidate", value: studentName },
              { label: "Integrity", value: `0 / ${exam.max_violations}` },
            ].map((item) => (
              <div key={item.label} className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">{item.label}</p>
                <p className="font-black truncate">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <Button size="lg" className="w-full h-16 rounded-2xl premium-gradient text-xl font-bold shadow-2xl" onClick={handleEnterFullscreen}>
              I Understand & Begin
            </Button>
            <button className="text-xs font-bold text-muted-foreground hover:text-primary uppercase tracking-widest transition-colors" onClick={() => setPhase("pre-form")}>
              Edit Candidate Details
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Phase 3: Exam In Progress (CBT Layout) ──────────────────────────────────
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col cursor-default select-none overflow-hidden">
      <AnimatePresence>
        {breachOverlay && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-rose-600 flex flex-col items-center justify-center text-white p-12 text-center backdrop-blur-2xl"
          >
            <ShieldAlert className="w-24 h-24 mb-8 animate-bounce" />
            <h1 className="text-6xl font-black tracking-tighter mb-4">SECURITY ALERT</h1>
            <p className="text-2xl font-bold opacity-90 max-w-2xl leading-tight">
              Window activity detected outside the secure environment. Violation has been recorded.
            </p>
            <div className="mt-12 py-3 px-8 rounded-full bg-white/20 font-black text-xl tracking-widest">
              STATUS: {violationCount} / {exam.max_violations}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="h-20 glass border-b flex items-center justify-between px-8 shrink-0 z-50">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 premium-gradient rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight hidden sm:block">{exam.title}</span>
          </div>
          <div className="h-8 w-px bg-border hidden sm:block" />
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-surface-sunken flex items-center justify-center overflow-hidden">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-black leading-none">{studentName}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{rollNumber}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-8">
          {/* Section Tabs in Header */}
          <div className="hidden lg:flex items-center bg-surface-sunken p-1 rounded-2xl border">
            <Button
              variant={activePart === "A" ? "default" : "ghost"}
              size="sm"
              className={`rounded-xl px-6 font-black tracking-widest uppercase transition-all ${activePart === "A" ? "premium-gradient text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => { setActivePart("A"); setCurrentQuestionIndex(0); }}
            >
              Part A
            </Button>
            <Button
              variant={activePart === "B" ? "default" : "ghost"}
              size="sm"
              className={`rounded-xl px-6 font-black tracking-widest uppercase transition-all ${activePart === "B" ? "premium-gradient text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => { setActivePart("B"); setCurrentQuestionIndex(15); }}
            >
              Part B
            </Button>
          </div>

          <div className="flex items-center space-x-3 bg-white/50 backdrop-blur-sm py-2 px-4 rounded-2xl border shadow-sm">
            <Clock className={`w-5 h-5 ${timeLeft !== null && timeLeft < 300 ? "text-rose-500 animate-pulse" : "text-primary"}`} />
            <span className={`text-2xl font-mono font-black tracking-wider ${timeLeft !== null && timeLeft < 300 ? "text-rose-500" : ""}`}>
              {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
            </span>
          </div>
          <Button 
            className="h-12 px-6 rounded-xl premium-gradient text-white font-black shadow-lg shadow-primary/20" 
            onClick={() => handleSubmitExam(false)} 
            disabled={submitExam.isPending}
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            SUBMIT
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Question Area */}
        <main className="flex-1 overflow-y-auto p-12 bg-surface-sunken/50 relative">
          <div className="max-w-3xl mx-auto space-y-12 pb-24">
            

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest border border-primary/20">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Points: {currentQuestion.marks}
                </span>
              </div>
              
              <div className="text-3xl font-bold leading-tight tracking-tight">
                <QuestionContent content={currentQuestion.question} />
              </div>

              <div className="mt-12">
                {currentQuestion.question_type === "mcq" && currentQuestion.options && (
                  <RadioGroup
                    className="space-y-4"
                    value={answers[currentQuestion.id] || ""}
                    onValueChange={(val) => handleAnswerChange(currentQuestion.id, val)}
                  >
                    {currentQuestion.options.map((opt, i) => (
                      <div
                        key={i}
                        className={`flex items-center space-x-4 p-6 rounded-3xl border-2 transition-all cursor-pointer group
                          ${answers[currentQuestion.id] === opt 
                            ? "bg-primary/5 border-primary shadow-lg shadow-primary/5" 
                            : "bg-white border-transparent hover:border-primary/20 shadow-sm"}`}
                        onClick={() => handleAnswerChange(currentQuestion.id, opt)}
                      >
                        <RadioGroupItem value={opt} id={`opt-${i}`} className="w-6 h-6 border-2" />
                        <Label htmlFor={`opt-${i}`} className="flex-1 text-lg font-medium cursor-pointer leading-relaxed">
                          <QuestionContent content={opt} />
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {(currentQuestion.question_type === "paragraph" || currentQuestion.question_type === "code") && (
                  <Textarea
                    className="min-h-[300px] p-8 bg-white border-none shadow-2xl rounded-[2rem] text-lg font-medium focus-visible:ring-primary/20 resize-none"
                    placeholder={currentQuestion.question_type === "code" ? "Write your technical solution here..." : "Draft your response here..."}
                    value={answers[currentQuestion.id] || ""}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="absolute bottom-12 left-0 w-full px-12 flex justify-between pointer-events-none">
            <Button 
              variant="outline" 
              className="h-14 px-8 rounded-2xl bg-white/80 backdrop-blur-md shadow-xl pointer-events-auto border-none font-bold"
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(i => i - 1)}
            >
              <ChevronLeft className="w-6 h-6 mr-2" /> Previous
            </Button>
            
            <div className="flex space-x-4 pointer-events-auto">
              <Button 
                variant="outline" 
                className="h-14 px-8 rounded-2xl bg-white/80 backdrop-blur-md shadow-xl border-none font-bold text-amber-600"
              >
                <Flag className="w-5 h-5 mr-2" /> Review Later
              </Button>
              <Button 
                className="h-14 px-8 rounded-2xl premium-gradient text-white font-bold shadow-xl"
                onClick={() => {
                  if (currentQuestionIndex < questions.length - 1) {
                    setCurrentQuestionIndex(i => i + 1);
                  } else {
                    toast({ title: "Last Question", description: "You have reached the end of the assessment." });
                  }
                }}
              >
                {currentQuestionIndex === questions.length - 1 ? "Finish" : "Next Question"} <ChevronRight className="w-6 h-6 ml-2" />
              </Button>
            </div>
          </div>
        </main>

        {/* Sidebar Question Palette */}
        <aside className="w-80 border-l glass overflow-y-auto p-8 shrink-0 hidden lg:block">
          <div className="space-y-8">
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">Question Palette</h4>
              <div className="grid grid-cols-4 gap-3">
                {questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-black transition-all
                      ${idx === currentQuestionIndex 
                        ? "premium-gradient text-white shadow-lg shadow-primary/30 scale-110" 
                        : answers[questions[idx].id] 
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
                          : "bg-surface-sunken text-muted-foreground hover:bg-muted"}`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status Legend</h4>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { label: "Completed", bg: "bg-emerald-500" },
                  { label: "Active", bg: "bg-primary" },
                  { label: "Remaining", bg: "bg-surface-sunken" },
                ].map(item => (
                  <div key={item.label} className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${item.bg}`} />
                    <span className="text-xs font-bold text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

