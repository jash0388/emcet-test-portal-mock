import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useMySubmissions, useMyStats } from "@/hooks/useExamData";
import { motion } from "framer-motion";
import { 
  ChevronLeft, History, Award, Clock, ArrowRight, 
  Calendar, CheckCircle2, ShieldAlert, FileText, User, Layout, Activity,
  TrendingUp, BarChart3, Search, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/useIsMobile";

export default function Metrics() {
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.uid);
  const { data: submissions, isLoading } = useMySubmissions(user?.uid);
  const { data: stats } = useMyStats(user?.uid);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 glass border-b">
        <div className="max-w-5xl mx-auto px-8 h-20 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setLocation("/dashboard")} className="rounded-xl">
            <ChevronLeft className="w-5 h-5 mr-2" />
            <span className="font-bold">Back</span>
          </Button>
          <div className="flex items-center space-x-3">
            <Activity className="w-5 h-5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Performance Analytics</span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-8 py-12">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-12">
          {/* Hero Header */}
          <motion.div variants={item} className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-black tracking-tighter">Academic Records</h1>
              <p className="text-muted-foreground mt-2 text-lg">A comprehensive history of your secure assessments.</p>
            </div>
            {!isMobile && (
              <div className="flex space-x-3">
                <Button variant="outline" className="rounded-2xl h-12 px-6 bg-white/50 border-none shadow-sm font-bold">
                  <Filter className="w-4 h-4 mr-2" /> Filter
                </Button>
                <Button variant="outline" className="rounded-2xl h-12 px-6 bg-white/50 border-none shadow-sm font-bold">
                  <Search className="w-4 h-4 mr-2" /> Search
                </Button>
              </div>
            )}
          </motion.div>

          {/* Stats Summary */}
          <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: "Completed Tests", value: stats?.totalAttempts ?? 0, icon: <FileText className="text-blue-600" />, bg: "bg-blue-500/5" },
              { label: "Average Accuracy", value: stats?.averageScore != null ? `${Math.round(stats.averageScore)}%` : "0%", icon: <TrendingUp className="text-emerald-600" />, bg: "bg-emerald-500/5" },
              { label: "Global Ranking", value: "Top 5%", icon: <Award className="text-amber-600" />, bg: "bg-amber-500/5" },
            ].map((s) => (
              <div key={s.label} className="bg-white/50 backdrop-blur-sm border p-6 rounded-3xl flex items-center space-x-4">
                <div className={`p-4 rounded-2xl ${s.bg}`}>{s.icon}</div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{s.label}</p>
                  <p className="text-2xl font-black">{s.value}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* History List */}
          <motion.div variants={item} className="space-y-6">
            <h3 className="text-xl font-black flex items-center space-x-3">
              <History className="w-6 h-6 text-primary" />
              <span>Session History</span>
            </h3>

            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Retrieving Secure Logs</p>
              </div>
            ) : submissions && submissions.length > 0 ? (
              <div className="grid gap-4">
                {submissions.map((sub) => {
                  const pct = sub.total_marks ? Math.round((sub.score / sub.total_marks) * 100) : 0;
                  const isTerminated = sub.status === "terminated";
                  
                  return (
                    <motion.div 
                      key={sub.id} 
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setLocation(`/result/${sub.id}`)}
                    >
                      <Card className="border-none shadow-2xl bg-white/90 group cursor-pointer overflow-hidden transition-all">
                        <div className={`h-full w-1.5 absolute left-0 top-0 ${isTerminated ? "bg-rose-500" : pct >= 50 ? "bg-emerald-500" : "bg-amber-500"}`} />
                        <CardContent className="p-8 flex items-center justify-between">
                          <div className="flex items-center space-x-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isTerminated ? "bg-rose-500/10 text-rose-600" : pct >= 50 ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                               {isTerminated ? <ShieldAlert className="w-7 h-7" /> : <Award className="w-7 h-7" />}
                            </div>
                            
                            <div>
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-xl font-black leading-tight">{sub.exams?.title ?? "Technical Exam"}</h3>
                                {isTerminated && <Badge variant="destructive" className="rounded-lg text-[9px] uppercase font-black px-2 py-0.5">Terminated</Badge>}
                              </div>
                              
                              <div className="flex items-center space-x-6 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                                <span className="flex items-center space-x-2"><Calendar className="w-3.5 h-3.5" /><span>{format(new Date(sub.submitted_at), "MMM dd, yyyy")}</span></span>
                                <span className="flex items-center space-x-2"><Clock className="w-3.5 h-3.5" /><span>{Math.round(sub.time_used_seconds / 60)}m Used</span></span>
                                <span className="flex items-center space-x-2"><ShieldAlert className={`w-3.5 h-3.5 ${sub.violations > 0 ? "text-rose-500" : ""}`} /><span>{sub.violations} Violations</span></span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-8">
                            <div className="text-right">
                              <p className={`text-3xl font-black ${isTerminated ? "text-rose-500" : pct >= 50 ? "text-emerald-500" : "text-amber-500"}`}>
                                {isTerminated ? "FAIL" : `${pct}%`}
                              </p>
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Final Grade</p>
                            </div>
                            <ArrowRight className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-2" />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="py-24 glass rounded-3xl border-dashed border-2 flex flex-col items-center justify-center space-y-6">
                <FileText className="w-16 h-16 text-muted-foreground opacity-10" />
                <div className="text-center">
                  <p className="text-xl font-black">No Records Available</p>
                  <p className="text-muted-foreground text-sm mt-1">Begin your assessment journey to see analytics here.</p>
                </div>
                <Button onClick={() => setLocation("/dashboard")} className="rounded-2xl h-14 px-8 premium-gradient text-white font-black shadow-lg">
                  Start First Exam
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      </main>

      {isMobile && (
        <nav className="fixed bottom-0 left-0 w-full px-6 pb-8 pt-4 bg-gradient-to-t from-background via-background to-transparent z-40">
          <div className="flex justify-around items-center glass p-2 rounded-3xl shadow-2xl border-white/40">
            {[
              { icon: <Layout className="w-5 h-5" />, label: "Home", onClick: () => setLocation("/dashboard") },
              { icon: <Activity className="w-5 h-5" />, label: "Stats", active: true, onClick: () => {} },
              { icon: <User className="w-5 h-5" />, label: "Profile", onClick: () => setLocation("/profile") },
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
      )}
    </div>
  );
}

