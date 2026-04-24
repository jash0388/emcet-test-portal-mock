import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useMyStats, useMySubmissions } from "@/hooks/useExamData";
import { signOut, auth } from "@/lib/firebase";
import { motion } from "framer-motion";
import { 
  User, Mail, Fingerprint, LogOut, ChevronLeft, 
  Target, TrendingUp, Layout, Activity, Award, ShieldAlert,
  Calendar, Clock, ArrowRight, BarChart3, Settings, Shield,
  ExternalLink, CreditCard, Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/useIsMobile";
import { format } from "date-fns";

export default function Profile() {
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.uid);
  const { data: stats } = useMyStats(user?.uid);
  const { data: submissions } = useMySubmissions(user?.uid);

  if (!user) return null;

  const handleLogout = async () => {
    await signOut(auth);
    setLocation("/");
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background pb-32 relative overflow-x-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/[0.03] rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/[0.02] rounded-full blur-[120px] -z-10 -translate-x-1/2 translate-y-1/2" />

      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 glass border-b">
        <div className="max-w-5xl mx-auto px-8 h-20 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setLocation("/dashboard")} className="rounded-xl">
            <ChevronLeft className="w-5 h-5 mr-2" />
            <span className="font-bold">Home</span>
          </Button>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <User className="w-5 h-5 text-primary" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Candidate Identity</span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-8 py-12">
        <motion.div variants={container} initial="hidden" animate="show" className="grid lg:grid-cols-12 gap-12">
          
          {/* Left Column: Profile Card */}
          <div className="lg:col-span-4 space-y-8">
            <motion.div variants={item}>
              <Card className="border-none shadow-2xl bg-white/90 overflow-hidden text-center p-8">
                <div className="relative inline-block mb-6">
                  <div className="w-32 h-32 rounded-full premium-gradient p-1 shadow-2xl shadow-primary/20">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-12 h-12 text-primary opacity-40" />
                      )}
                    </div>
                  </div>
                  <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
                
                <h2 className="text-2xl font-black tracking-tighter leading-none mb-2">
                  {profile?.full_name || user.displayName || "Scholar Candidate"}
                </h2>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-6">
                  {profile?.name || "UNREGISTERED ID"}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 rounded-2xl bg-surface-sunken/50 text-left border">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-xs font-bold truncate flex-1">{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-2xl bg-surface-sunken/50 text-left border">
                    <Fingerprint className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Secure Vault ID Verified</span>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t space-y-3">
                  <Button variant="outline" className="w-full h-12 rounded-xl border-none bg-surface-sunken hover:bg-muted font-bold">
                    <Settings className="w-4 h-4 mr-2" /> Security Settings
                  </Button>
                  <Button 
                    className="w-full h-12 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 font-bold border border-rose-500/20"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Terminate Session
                  </Button>
                </div>
              </Card>
            </motion.div>

            <motion.div variants={item} className="space-y-4">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Quick Actions</h4>
               <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: <CreditCard className="w-4 h-4" />, label: "Billing" },
                    { icon: <Bell className="w-4 h-4" />, label: "Alerts" },
                  ].map(action => (
                    <button key={action.label} className="bg-white border rounded-2xl p-4 flex flex-col items-center justify-center space-y-2 hover:bg-primary/5 hover:border-primary/20 transition-all shadow-sm">
                      <div className="p-2 rounded-xl bg-surface-sunken text-muted-foreground">{action.icon}</div>
                      <span className="text-[10px] font-black uppercase tracking-widest">{action.label}</span>
                    </button>
                  ))}
               </div>
            </motion.div>
          </div>

          {/* Right Column: Analytics & Stats */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Journey Stats Card */}
            <motion.div variants={item}>
              <div className="relative group">
                <div className="absolute inset-0 premium-gradient opacity-[0.03] blur-3xl rounded-[3rem] group-hover:opacity-[0.05] transition-opacity" />
                <Card className="border-none shadow-2xl bg-white/90 overflow-hidden relative">
                  <CardHeader className="p-10 pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">Performance Quotient</p>
                        <CardTitle className="text-4xl font-black tracking-tighter">Academic Journey</CardTitle>
                      </div>
                      <div className="p-4 rounded-2xl bg-primary/10 text-primary">
                        <Activity className="w-8 h-8" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-10 pt-4">
                    <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                      You are currently associated with <span className="text-foreground font-black">{profile?.college || "Global Academic Hub"}</span> as a <span className="text-foreground font-black">{profile?.role || "Verified Candidate"}</span>.
                    </p>
                    
                    <div className="grid md:grid-cols-3 gap-8">
                      {[
                        { label: "Assessments", value: stats?.totalAttempts || 0, sub: "Completed" },
                        { label: "Avg. Accuracy", value: stats?.averageScore != null ? `${Math.round(stats.averageScore)}%` : "0%", sub: "Proficiency" },
                        { label: "Peak Grade", value: stats?.highestScore != null ? `${Math.round(stats.highestScore)}%` : "0%", sub: "Record" },
                      ].map((s) => (
                        <div key={s.label} className="space-y-1">
                          <div className="text-3xl font-black tracking-tighter">{s.value}</div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none">{s.label}</div>
                          <div className="text-[9px] font-bold text-primary/60 uppercase tracking-[0.15em]">{s.sub}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-10 space-y-3">
                      <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                        <span>Curriculum Progress</span>
                        <span className="text-primary">{Math.min(100, (stats?.totalAttempts || 0) * 10)}%</span>
                      </div>
                      <div className="h-3 w-full bg-surface-sunken rounded-full overflow-hidden p-0.5 border">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (stats?.totalAttempts || 0) * 10)}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full rounded-full premium-gradient shadow-lg"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            {/* Recent History Preview */}
            <motion.div variants={item} className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black flex items-center space-x-3">
                  <History className="w-7 h-7 text-primary" />
                  <span>Recent Activity</span>
                </h3>
                <Button variant="link" onClick={() => setLocation("/metrics")} className="text-primary font-black uppercase tracking-widest text-xs">
                  Full Ledger <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              <div className="grid gap-4">
                {submissions && submissions.length > 0 ? (
                  submissions.slice(0, 3).map((sub) => {
                    const pct = sub.total_marks ? Math.round((sub.score / sub.total_marks) * 100) : 0;
                    return (
                      <motion.div 
                        key={sub.id} 
                        whileHover={{ x: 8 }}
                        onClick={() => setLocation(`/result/${sub.id}`)}
                        className="bg-white border rounded-[2rem] p-6 flex items-center justify-between cursor-pointer shadow-sm hover:shadow-xl hover:border-primary/20 transition-all group"
                      >
                        <div className="flex items-center space-x-6">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${pct >= 50 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>
                            <Award className="w-6 h-6" />
                          </div>
                          <div>
                            <h5 className="text-lg font-black leading-none mb-2">{sub.exams?.title || "Assessment"}</h5>
                            <div className="flex items-center space-x-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                              <span className="flex items-center space-x-1.5"><Calendar className="w-3 h-3" /><span>{format(new Date(sub.submitted_at), "MMM d, yyyy")}</span></span>
                              <span className="text-primary font-black">{pct}% Grade</span>
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-6 h-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="py-12 glass rounded-3xl border-dashed border-2 flex flex-col items-center justify-center space-y-3">
                    <BarChart3 className="w-10 h-10 text-muted-foreground opacity-10" />
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">No sessions recorded</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Verification Badge */}
            <motion.div variants={item}>
              <div className="bg-emerald-500/[0.03] border border-emerald-500/10 rounded-[2rem] p-8 flex items-center space-x-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Shield className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-black leading-none mb-2 text-emerald-700">Digital Identity Verified</h4>
                  <p className="text-sm text-emerald-600/80 leading-relaxed font-medium">
                    Your profile is securely linked to the SPHN Global Assessment Network. All test data is cryptographically signed and immutable.
                  </p>
                </div>
                <ExternalLink className="w-6 h-6 text-emerald-500/40" />
              </div>
            </motion.div>

          </div>
        </motion.div>
      </main>

      {/* Mobile Nav */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 w-full px-6 pb-8 pt-4 bg-gradient-to-t from-background via-background to-transparent z-40">
          <div className="flex justify-around items-center glass p-2 rounded-3xl shadow-2xl border-white/40">
            {[
              { icon: <Layout className="w-5 h-5" />, label: "Home", onClick: () => setLocation("/dashboard") },
              { icon: <Activity className="w-5 h-5" />, label: "Stats", onClick: () => setLocation("/metrics") },
              { icon: <User className="w-5 h-5" />, label: "Profile", active: true, onClick: () => {} },
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

