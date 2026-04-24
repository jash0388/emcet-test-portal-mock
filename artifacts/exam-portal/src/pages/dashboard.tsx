import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useAvailableExams, useMySubmissions, useMyStats } from "@/hooks/useExamData";
import { signOut, auth } from "@/lib/firebase";
import { 
  LogOut, Activity, Target, ShieldAlert, Award, FileText, Clock, 
  PlayCircle, Shield, History, AlertTriangle, CheckCircle2, User,
  ArrowRight, TrendingUp, BookOpen, Layout, Lock, Search, Filter,
  ChevronRight, Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

// --- Desktop Dashboard (Premium) ---
function DesktopDashboard({ user, profile, exams, submissions, stats, submittedExamMap, handleLogout, setLocation }: any) {
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 glass border-b">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 premium-gradient rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight">SPHN <span className="text-primary">PORTAL</span></span>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4 pr-6 border-r border-border">
              <div className="text-right">
                <p className="text-sm font-bold">{profile?.full_name || user.email?.split("@")[0]}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{profile?.name || "Student"}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-surface-sunken border flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-xl hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-12">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-12">
          {/* Hero Section */}
          <motion.div variants={item} className="flex justify-between items-end">
            <div>
              <h2 className="text-4xl font-black tracking-tighter">Academic Overview</h2>
              <p className="text-muted-foreground mt-2 text-lg">Monitor your progress and upcoming assessments.</p>
            </div>
            <div className="flex space-x-3">
              <Button className="rounded-2xl h-12 px-6 premium-gradient shadow-lg">
                <Calendar className="w-4 h-4 mr-2" /> Schedule
              </Button>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: "Assessments", value: stats?.totalAttempts ?? 0, icon: <FileText className="text-blue-600" />, bg: "bg-blue-500/5" },
              { label: "Accuracy", value: stats?.averageScore != null ? `${Math.round(stats.averageScore)}%` : "0%", icon: <Target className="text-emerald-600" />, bg: "bg-emerald-500/5" },
              { label: "Peak Performance", value: stats?.highestScore != null ? `${Math.round(stats.highestScore)}%` : "0%", icon: <Award className="text-amber-600" />, bg: "bg-amber-500/5" },
              { label: "Integrity Score", value: stats?.totalViolations ?? 0, icon: <ShieldAlert className="text-rose-600" />, bg: "bg-rose-500/5", danger: true },
            ].map((stat) => (
              <Card key={stat.label} className="border-none shadow-xl shadow-black/[0.02] bg-white/50 backdrop-blur-sm group hover:scale-[1.02] transition-transform">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className={`p-3 rounded-2xl ${stat.bg}`}>{stat.icon}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Real-time</div>
                  </div>
                  <div className="space-y-1">
                    <div className={`text-3xl font-black ${stat.danger ? "text-rose-600" : "text-foreground"}`}>{stat.value}</div>
                    <div className="text-sm font-bold text-muted-foreground uppercase tracking-tight">{stat.label}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Active Exams */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black flex items-center space-x-2">
                  <PlayCircle className="w-6 h-6 text-primary" />
                  <span>Available Assessments</span>
                </h3>
                <div className="flex items-center space-x-2 text-xs font-bold text-muted-foreground">
                  <Filter className="w-4 h-4" />
                  <span>All Subjects</span>
                </div>
              </div>

              {exams && exams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {exams.map((exam: any) => {
                    const existingSubmissionId = submittedExamMap[exam.id];
                    const alreadyTaken = !!existingSubmissionId;
                    return (
                      <Card key={exam.id} className={`overflow-hidden border-none shadow-2xl transition-all ${alreadyTaken ? "opacity-75 grayscale-[0.5]" : "hover:shadow-primary/10 hover:translate-y-[-4px]"}`}>
                        <div className={`h-1.5 w-full ${alreadyTaken ? "bg-emerald-500" : "premium-gradient"}`} />
                        <CardHeader className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <Badge variant={alreadyTaken ? "secondary" : "default"} className="rounded-lg px-2.5 py-1 text-[10px] font-black tracking-widest uppercase">
                              {alreadyTaken ? "Completed" : "Active Now"}
                            </Badge>
                            <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                              <Clock className="w-3 h-3 mr-1.5 text-primary" />
                              {exam.duration_minutes}m Duration
                            </div>
                          </div>
                          <CardTitle className="text-xl font-black leading-none mb-2">{exam.title}</CardTitle>
                          <CardDescription className="text-sm line-clamp-2 leading-relaxed">
                            {exam.description || "Comprehensive assessment designed to evaluate core competencies."}
                          </CardDescription>
                        </CardHeader>
                        <CardFooter className="p-6 pt-0">
                          {alreadyTaken ? (
                            <Button className="w-full h-12 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 font-bold border border-emerald-500/20" onClick={() => setLocation(`/result/${existingSubmissionId}`)}>
                              <CheckCircle2 className="w-4 h-4 mr-2" /> Performance Report
                            </Button>
                          ) : (
                            <Button className="w-full h-12 rounded-xl premium-gradient text-white font-bold shadow-lg shadow-primary/20" onClick={() => setLocation(`/exam/${exam.id}`)}>
                              Begin Assessment <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center glass rounded-3xl border-dashed border-2">
                  <div className="w-16 h-16 rounded-full bg-surface-sunken flex items-center justify-center mb-4">
                    <BookOpen className="w-8 h-8 text-muted-foreground opacity-30" />
                  </div>
                  <p className="text-muted-foreground font-bold">No active examinations available.</p>
                </div>
              )}
            </div>

            {/* Recent History */}
            <div className="lg:col-span-4 space-y-6">
              <h3 className="text-xl font-black flex items-center space-x-2">
                <History className="w-6 h-6 text-primary" />
                <span>Recent History</span>
              </h3>
              <Card className="border-none shadow-2xl bg-white/90 overflow-hidden">
                <ScrollArea className="h-[600px]">
                  {submissions && submissions.length > 0 ? (
                    <div className="divide-y divide-border/50">
                      {submissions.map((sub: any) => {
                        const pct = sub.total_marks ? Math.round((sub.score / sub.total_marks) * 100) : 0;
                        return (
                          <div key={sub.id} className="p-6 hover:bg-primary/[0.02] transition-colors group cursor-pointer" onClick={() => setLocation(`/result/${sub.id}`)}>
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1 min-w-0 pr-4">
                                <h4 className="font-bold text-sm truncate leading-none mb-2">{sub.exams?.title || "Assessment"}</h4>
                                <div className="flex items-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                  <Calendar className="w-3 h-3 mr-1.5" />
                                  {format(new Date(sub.submitted_at), "MMM dd, yyyy")}
                                </div>
                              </div>
                              <div className={`text-xl font-black ${pct >= 50 ? "text-emerald-500" : "text-rose-500"}`}>
                                {pct}%
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="w-full bg-surface-sunken h-1.5 rounded-full overflow-hidden mr-4">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  className={`h-full ${pct >= 50 ? "bg-emerald-500" : "bg-rose-500"}`}
                                />
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-20 text-center space-y-4">
                      <TrendingUp className="w-12 h-12 text-muted-foreground opacity-10 mx-auto" />
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">No activity recorded yet</p>
                    </div>
                  )}
                </ScrollArea>
              </Card>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

// --- Mobile Dashboard (Premium) ---
function MobileDashboard({ user, profile, exams, submissions, stats, submittedExamMap, handleLogout, setLocation }: any) {
  const availableExams = exams?.filter((e: any) => !submittedExamMap[e.id]) ?? [];
  const completedExams = exams?.filter((e: any) => !!submittedExamMap[e.id]) ?? [];

  return (
    <div className="min-h-screen bg-background pb-28 relative">
      <header className="px-6 h-20 flex items-center justify-between sticky top-0 z-50 glass border-b">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 premium-gradient rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-black tracking-tight">SPHN</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-surface-sunken border flex items-center justify-center overflow-hidden">
          <User className="w-5 h-5 text-muted-foreground" />
        </div>
      </header>

      <main className="px-6 py-8 space-y-10">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Academic Profile</p>
          <h1 className="text-3xl font-black tracking-tighter">Welcome, {profile?.full_name?.split(" ")[0] || user.email?.split("@")[0]}</h1>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Attempts", value: stats?.totalAttempts ?? 0 },
            { label: "Avg %", value: stats?.averageScore != null ? `${Math.round(stats.averageScore)}` : "0" },
            { label: "Best", value: stats?.highestScore != null ? `${Math.round(stats.highestScore)}` : "0" },
          ].map((s) => (
            <div key={s.label} className="bg-white/50 backdrop-blur-sm border-none shadow-xl p-4 rounded-3xl text-center">
              <div className="text-xl font-black text-primary">{s.value}</div>
              <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Exams */}
        <section className="space-y-6">
          <h3 className="text-lg font-black flex items-center space-x-2">
            <PlayCircle className="w-5 h-5 text-primary" />
            <span>Available Tests</span>
          </h3>
          {availableExams.length > 0 ? (
            <div className="space-y-4">
              {availableExams.map((exam: any) => (
                <Card key={exam.id} className="border-none shadow-2xl p-6 rounded-[2rem] bg-white/90" onClick={() => setLocation(`/exam/${exam.id}`)}>
                  <div className="flex justify-between items-center mb-4">
                    <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black tracking-widest uppercase">Core</Badge>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center">
                      <Clock className="w-3 h-3 mr-1" /> {exam.duration_minutes}m
                    </div>
                  </div>
                  <h4 className="text-lg font-black leading-tight mb-2">{exam.title}</h4>
                  <p className="text-xs text-muted-foreground mb-6 line-clamp-2">{exam.description || "Standard technical assessment."}</p>
                  <Button className="w-full h-12 rounded-2xl premium-gradient text-white font-bold shadow-lg shadow-primary/20">
                    Start Securely <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-12 glass rounded-3xl text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No active tests</p>
            </div>
          )}
        </section>

        {/* History */}
        {completedExams.length > 0 && (
          <section className="space-y-6">
            <h3 className="text-lg font-black flex items-center space-x-2">
              <History className="w-5 h-5 text-primary" />
              <span>History</span>
            </h3>
            <div className="space-y-3">
              {completedExams.map((exam: any) => {
                const subId = submittedExamMap[exam.id];
                return (
                  <div key={exam.id} onClick={() => setLocation(`/result/${subId}`)} className="flex items-center justify-between p-4 bg-white/50 rounded-2xl shadow-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="text-sm font-bold truncate max-w-[150px]">{exam.title}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 w-full px-6 pb-8 pt-4 bg-gradient-to-t from-background via-background to-transparent z-40">
        <div className="flex justify-around items-center glass p-2 rounded-3xl shadow-2xl border-white/40">
          {[
            { icon: <Layout className="w-5 h-5" />, active: true, label: "Home" },
            { icon: <Activity className="w-5 h-5" />, label: "Stats", onClick: () => setLocation("/metrics") },
            { icon: <LogOut className="w-5 h-5" />, label: "Exit", onClick: handleLogout },
          ].map((nav) => (
            <button 
              key={nav.label} 
              onClick={nav.onClick}
              className={`flex flex-col items-center p-3 rounded-2xl transition-all ${nav.active ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
            >
              {nav.icon}
              <span className="text-[8px] font-black uppercase mt-1 tracking-widest">{nav.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default function Dashboard() {
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { data: profile } = useProfile(user?.uid);
  const { data: exams } = useAvailableExams();
  const { data: submissions } = useMySubmissions(user?.uid);
  const { data: stats } = useMyStats(user?.uid);

  const submittedExamMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of submissions ?? []) {
      map[s.exam_id] = s.id;
    }
    return map;
  }, [submissions]);

  useEffect(() => {
    if (!authLoading && !user) setLocation("/");
  }, [user, authLoading, setLocation]);

  const handleLogout = async () => {
    await signOut(auth);
    setLocation("/");
  };

  if (authLoading || !user) return null;

  const props = { user, profile, exams, submissions, stats, submittedExamMap, handleLogout, setLocation };

  return isMobile ? <MobileDashboard {...props} /> : <DesktopDashboard {...props} />;
}
