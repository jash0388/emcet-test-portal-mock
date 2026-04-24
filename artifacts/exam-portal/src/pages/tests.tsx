import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAvailableExams } from "@/hooks/useExamData";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Clock,
  ArrowRight,
  BookOpen,
  PlayCircle,
  AlertTriangle,
  LogOut,
  User,
  Sparkles,
  GraduationCap,
} from "lucide-react";

interface StudentInfo {
  studentName: string;
  studentPhone: string;
  fatherName: string;
  fatherPhone: string;
  college: string;
  timestamp: string;
}

export default function Tests() {
  const [, setLocation] = useLocation();
  const { data: exams, isLoading, error } = useAvailableExams();
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);

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

  const handleLogout = () => {
    localStorage.removeItem("studentInfo");
    setLocation("/");
  };

  if (!studentInfo) return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Soft background orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[140px]" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[140px]" />

      {/* Header */}
      <header className="w-full glass-card border-b sticky top-0 z-50 backdrop-blur-xl bg-white/70">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-4"
          >
            <div className="w-12 h-12 premium-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                SPHN <span className="text-primary">EMCET</span>
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                Mock Examination Portal
              </p>
            </div>
          </motion.div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-3 pr-4 border-r border-border">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="text-right">
                <p className="text-sm font-bold leading-tight">{studentInfo.studentName}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold leading-tight mt-0.5">
                  {studentInfo.college}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="rounded-xl hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline font-bold">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-widest">
              Welcome, {studentInfo.studentName.split(" ")[0]}
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-3 text-foreground">
            Available <span className="text-primary">Mock Tests</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Choose a test below to begin your assessment. Each test is timed and proctored —
            ensure you have a stable connection before starting.
          </p>
        </motion.div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 rounded-3xl bg-white/50 border border-border/50 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <Card className="border-rose-200 bg-rose-50/50 p-8 rounded-3xl">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-black text-lg text-rose-900 mb-1">Could not load tests</h3>
                <p className="text-sm text-rose-700/80 mb-4">
                  {(error as Error).message || "Please check your connection and try again."}
                </p>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="border-rose-300 text-rose-700 hover:bg-rose-100 rounded-xl"
                >
                  Retry
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Empty */}
        {!isLoading && !error && exams && exams.length === 0 && (
          <div className="py-24 flex flex-col items-center justify-center bg-white/60 rounded-3xl border-2 border-dashed border-border">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-5">
              <BookOpen className="w-10 h-10 text-primary opacity-60" />
            </div>
            <h3 className="text-xl font-black mb-2">No active tests available</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              There are no published mock tests right now. Please check back later.
            </p>
          </div>
        )}

        {/* Tests Grid */}
        {!isLoading && !error && exams && exams.length > 0 && (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.08 } },
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {exams.map((exam) => (
              <motion.div
                key={exam.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 },
                }}
              >
                <Card className="overflow-hidden border border-border/60 shadow-xl shadow-primary/[0.04] bg-white rounded-3xl hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 group h-full flex flex-col">
                  <div className="h-2 w-full premium-gradient" />
                  <CardContent className="p-6 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <Badge className="bg-primary/10 text-primary border-none rounded-lg px-2.5 py-1 text-[10px] font-black tracking-widest uppercase hover:bg-primary/15">
                        Active
                      </Badge>
                      <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <Clock className="w-3 h-3 mr-1.5 text-primary" />
                        {exam.duration_minutes} min
                      </div>
                    </div>

                    <h3 className="text-xl font-black leading-tight mb-2 text-foreground group-hover:text-primary transition-colors">
                      {exam.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-6 flex-1">
                      {exam.description ||
                        "Comprehensive mock examination designed to evaluate your readiness."}
                    </p>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-bold uppercase tracking-widest">
                          Duration
                        </span>
                        <span className="font-black text-foreground">
                          {exam.duration_minutes} minutes
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-bold uppercase tracking-widest">
                          Max Violations
                        </span>
                        <span className="font-black text-rose-600">{exam.max_violations}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full h-12 rounded-2xl premium-gradient text-white font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                      onClick={() => setLocation(`/take/${exam.id}`)}
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Begin Test
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Footer info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {[
            {
              icon: <GraduationCap className="w-5 h-5" />,
              title: "Real Exam Experience",
              desc: "Mirrors official EMCET environment",
            },
            {
              icon: <Shield className="w-5 h-5" />,
              title: "Secure Proctoring",
              desc: "Fullscreen mode with violation tracking",
            },
            {
              icon: <Sparkles className="w-5 h-5" />,
              title: "Instant Results",
              desc: "Detailed performance report after each test",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white/60 backdrop-blur-sm border border-border/40 rounded-2xl p-5 flex items-start space-x-4"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div>
                <p className="font-bold text-sm mb-0.5">{item.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
