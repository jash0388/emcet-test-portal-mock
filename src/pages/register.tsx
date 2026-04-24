import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useCreateProfile } from "@/hooks/useProfile";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, ShieldCheck, Landmark, BookOpen, Fingerprint, Shield, Mail, User, ArrowRight, CheckCircle2, Building, GraduationCap } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  college: z.string().min(2, "Institution is required"),
  department: z.string().min(2, "Department is required"),
  rollNumber: z.string().min(2, "Roll number is required"),
});

export default function Register() {
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const createProfile = useCreateProfile();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { college: "", department: "", rollNumber: "" },
  });

  useEffect(() => {
    if (!authLoading && !user) setLocation("/");
  }, [user, authLoading, setLocation]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!user) return;
    
    createProfile.mutate({
      id: user.uid,
      email: user.email!,
      full_name: user.displayName || user.email?.split("@")[0] || "Student",
      name: values.rollNumber, 
      college: values.college,
      role: values.department, 
      firebase_uid: user.uid,
      is_firebase_user: true,
    } as any, {
      onSuccess: () => {
        toast({ title: "Profile Secured", description: "Identity verification complete." });
        setLocation("/dashboard");
      },
      onError: (err: any) => {
        toast({ 
          variant: "destructive", 
          title: "Setup Failed", 
          description: err.message || "Integrity check failed. Please retry."
        });
      },
    });
  };

  if (authLoading || !user) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-6">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Establishing Secure Connection</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-stretch overflow-hidden">
      {/* Visual Side (Hidden on Mobile) */}
      {!isMobile && (
        <div className="hidden lg:flex lg:w-1/2 relative bg-surface-sunken overflow-hidden items-center justify-center p-20">
          <div className="absolute inset-0 bg-[#0A0A0A]" />
          
          {/* Cinematic Background Elements */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/[0.08] rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/[0.05] rounded-full blur-[100px]" />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 space-y-8 max-w-lg"
          >
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified Enrollment</span>
              </div>
              <h1 className="text-6xl font-black text-white tracking-tighter leading-none">
                Finalize Your <span className="text-primary">Identity.</span>
              </h1>
              <p className="text-lg text-white/40 leading-relaxed font-medium">
                Complete your profile to access premium assessments and verified certification paths.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-8">
              {[
                { icon: <GraduationCap className="w-5 h-5" />, title: "Academic Records", desc: "Verifiable institutional history." },
                { icon: <Shield className="w-5 h-5" />, title: "Integrity Vault", desc: "Secured assessment environment." },
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (i * 0.1) }}
                  className="flex items-start space-x-4 p-6 rounded-3xl bg-white/[0.03] border border-white/10"
                >
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">{item.title}</h4>
                    <p className="text-sm text-white/30 font-medium">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Registration Form Side */}
      <div className={`w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative ${isMobile ? "bg-background" : "bg-white"}`}>
        {isMobile && (
          <div className="absolute top-0 left-0 w-full h-[300px] bg-primary/[0.03] -z-10 blur-[80px]" />
        )}
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-10"
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 rounded-xl premium-gradient p-2">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain invert brightness-0" />
              </div>
              <span className="text-xl font-black tracking-tighter">SPHN PORTAL</span>
            </div>
            <h2 className="text-4xl font-black tracking-tighter leading-none">Complete Enrollment</h2>
            <p className="text-muted-foreground font-medium">Link your academic identity to proceed.</p>
          </div>

          <Card className="border-none shadow-none bg-transparent">
            <CardContent className="p-0">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Authenticated Account Info */}
                  <div className="p-4 rounded-2xl bg-surface-sunken border-dashed border flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Signed In As</p>
                      <p className="text-sm font-bold truncate max-w-[200px]">{user.email}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <FormField control={form.control} name="college" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1">Institution Name</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input 
                              className="h-14 pl-12 rounded-2xl bg-surface-sunken border-none focus-visible:ring-2 focus-visible:ring-primary/20 font-bold placeholder:text-muted-foreground/40" 
                              placeholder="e.g. SPHN Institute" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px] ml-1 font-bold" />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="department" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1">Academic Department</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input 
                              className="h-14 pl-12 rounded-2xl bg-surface-sunken border-none focus-visible:ring-2 focus-visible:ring-primary/20 font-bold placeholder:text-muted-foreground/40" 
                              placeholder="e.g. Computer Science" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px] ml-1 font-bold" />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="rollNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1">Candidate Roll ID</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input 
                              className="h-14 pl-12 rounded-2xl bg-surface-sunken border-none focus-visible:ring-2 focus-visible:ring-primary/20 font-bold font-mono placeholder:text-muted-foreground/40" 
                              placeholder="24N81A6..." 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px] ml-1 font-bold" />
                      </FormItem>
                    )} />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-14 rounded-2xl premium-gradient text-white font-black text-lg shadow-2xl shadow-primary/20 hover:shadow-primary/30 transition-all group"
                    disabled={createProfile.isPending}
                  >
                    {createProfile.isPending ? (
                      <RefreshCw className="animate-spin w-6 h-6" />
                    ) : (
                      <>Secure My Profile <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" /></>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div className="pt-8 text-center">
            <p className="text-xs text-muted-foreground font-medium">
              Information provided must match institutional records.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

