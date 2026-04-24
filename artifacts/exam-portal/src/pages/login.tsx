import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Clock, Shield, Users, ArrowRight, Sparkles } from "lucide-react";

export default function StudentInfoForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [studentName, setStudentName] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [fatherPhone, setFatherPhone] = useState("");
  const [college, setCollege] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !studentPhone || !fatherName || !fatherPhone || !college) {
      toast({ variant: "destructive", title: "Required Fields", description: "Please fill all required fields." });
      return;
    }
    if (!agreeToTerms) {
      toast({ variant: "destructive", title: "Terms Required", description: "Please agree to the terms and conditions." });
      return;
    }
    setIsLoading(true);
    try {
      const studentData = {
        studentName,
        studentPhone,
        fatherName,
        fatherPhone,
        college,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem("studentInfo", JSON.stringify(studentData));
      toast({ title: "Registration Complete", description: "Welcome to SPHN EMCET Mock Test!" });
      setLocation("/exam");
    } catch (err: any) {
      toast({ variant: "destructive", description: "Failed to save information." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />

      {/* Header */}
      <header className="w-full glass-card border-b sticky top-0 z-50">
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
              <h1 className="text-xl font-bold tracking-tight">SPHN <span className="text-primary">EMCET</span></h1>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Mock Examination Portal</p>
            </div>
          </motion.div>
          
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-12 gap-12 relative z-10">
        {/* Left Content - Hero Text & Rules */}
        <div className="lg:col-span-5 space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
              <Sparkles className="w-3 h-3" />
              <span>State-of-the-Art Exam Experience</span>
            </div>
            <h2 className="text-5xl font-black tracking-tighter leading-[0.9]">
              Shape Your <br />
              <span className="text-gradient">Future</span> Today.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Experience the most advanced mock testing platform designed to mirror the real EMCET environment with real-time analytics.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass border-white/40 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                  </div>
                  <span>Critical Guidelines</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  "Ensure a high-speed stable internet connection.",
                  "Fullscreen mode is mandatory for security.",
                  "Auto-save is enabled every 30 seconds.",
                  "Window switching will log a security violation."
                ].map((rule, i) => (
                  <div key={i} className="flex items-start space-x-3 text-sm">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-muted-foreground">{rule}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Content - Registration Form */}
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 20 }}
          >
            <Card className="shadow-2xl border-none overflow-hidden bg-white/90 backdrop-blur-xl">
              <div className="h-2 premium-gradient w-full" />
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-2xl">Candidate Details</CardTitle>
                <CardDescription>
                  Enter your credentials to authenticate and begin the assessment session.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-4">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="studentName" className="text-sm font-bold tracking-tight uppercase text-muted-foreground">
                        Full Name
                      </Label>
                      <Input
                        id="studentName"
                        placeholder="John Doe"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="h-14 bg-surface-sunken border-none text-lg focus-visible:ring-primary/20"
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="studentPhone" className="text-sm font-bold tracking-tight uppercase text-muted-foreground">
                        Phone Number
                      </Label>
                      <Input
                        id="studentPhone"
                        type="tel"
                        placeholder="+91 XXXXX XXXXX"
                        value={studentPhone}
                        onChange={(e) => setStudentPhone(e.target.value)}
                        className="h-14 bg-surface-sunken border-none text-lg focus-visible:ring-primary/20"
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="fatherName" className="text-sm font-bold tracking-tight uppercase text-muted-foreground">
                        Father's Name
                      </Label>
                      <Input
                        id="fatherName"
                        placeholder="Richard Doe"
                        value={fatherName}
                        onChange={(e) => setFatherName(e.target.value)}
                        className="h-14 bg-surface-sunken border-none text-lg focus-visible:ring-primary/20"
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="fatherPhone" className="text-sm font-bold tracking-tight uppercase text-muted-foreground">
                        Parent Contact
                      </Label>
                      <Input
                        id="fatherPhone"
                        type="tel"
                        placeholder="+91 XXXXX XXXXX"
                        value={fatherPhone}
                        onChange={(e) => setFatherPhone(e.target.value)}
                        className="h-14 bg-surface-sunken border-none text-lg focus-visible:ring-primary/20"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="college" className="text-sm font-bold tracking-tight uppercase text-muted-foreground">
                      Educational Institute
                    </Label>
                    <Input
                      id="college"
                      placeholder="University or College Name"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="h-14 bg-surface-sunken border-none text-lg focus-visible:ring-primary/20"
                      required
                    />
                  </div>

                  <div className="p-6 rounded-2xl bg-primary/[0.03] border border-primary/10 flex items-start space-x-4">
                    <Checkbox
                      id="terms"
                      checked={agreeToTerms}
                      onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                      className="mt-1 w-5 h-5"
                    />
                    <div className="space-y-1">
                      <Label htmlFor="terms" className="text-sm font-bold cursor-pointer">
                        Integrity Commitment
                      </Label>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        I pledge to maintain academic integrity and acknowledge that my activity will be monitored for quality assurance.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-16 premium-gradient hover:shadow-primary/30 transition-all duration-300 shadow-xl text-lg font-bold"
                    disabled={isLoading || !agreeToTerms}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Initializing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>Authenticate & Begin</span>
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <footer className="w-full py-8 px-6 border-t glass mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground gap-4">
          <p>© 2026 SPHN Educational Initiatives. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-primary transition-colors">Privacy Protocol</a>
            <a href="#" className="hover:text-primary transition-colors">Technical Support</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Engagement</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

