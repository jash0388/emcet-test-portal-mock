import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Clock, Shield, Users } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SPHN EMCET MOCK TEST</h1>
                <p className="text-sm text-gray-600">EMCET Entrance Examination</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>Duration: 3 Hours</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>Questions: 180</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Instructions */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <span>Important Instructions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold text-gray-900">Exam Rules:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2">
                    <li>Ensure stable internet connection</li>
                    <li>Do not refresh or close the browser</li>
                    <li>Complete all sections within time limit</li>
                    <li>One attempt per student</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Technical Requirements:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2">
                    <li>Modern web browser (Chrome/Firefox)</li>
                    <li>Stable internet connection</li>
                    <li>Desktop/Laptop recommended</li>
                    <li>Disable browser extensions</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Registration Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  <CardTitle className="text-xl">Student Registration</CardTitle>
                  <CardDescription className="text-blue-100">
                    Please provide accurate information to proceed with the examination
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="studentName" className="text-sm font-medium">
                          Student Name *
                        </Label>
                        <Input
                          id="studentName"
                          type="text"
                          placeholder="Enter your full name"
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                          className="h-10"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="studentPhone" className="text-sm font-medium">
                          Student Phone Number *
                        </Label>
                        <Input
                          id="studentPhone"
                          type="tel"
                          placeholder="Enter 10-digit mobile number"
                          value={studentPhone}
                          onChange={(e) => setStudentPhone(e.target.value)}
                          className="h-10"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fatherName" className="text-sm font-medium">
                          Father's Name *
                        </Label>
                        <Input
                          id="fatherName"
                          type="text"
                          placeholder="Enter father's full name"
                          value={fatherName}
                          onChange={(e) => setFatherName(e.target.value)}
                          className="h-10"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fatherPhone" className="text-sm font-medium">
                          Father's Phone Number *
                        </Label>
                        <Input
                          id="fatherPhone"
                          type="tel"
                          placeholder="Enter father's mobile number"
                          value={fatherPhone}
                          onChange={(e) => setFatherPhone(e.target.value)}
                          className="h-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="college" className="text-sm font-medium">
                        College/Institute Name *
                      </Label>
                      <Input
                        id="college"
                        type="text"
                        placeholder="Enter your college or institute name"
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        className="h-10"
                        required
                      />
                    </div>

                    <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                      <Checkbox
                        id="terms"
                        checked={agreeToTerms}
                        onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                        className="mt-1"
                      />
                      <div className="text-sm">
                        <Label htmlFor="terms" className="font-medium cursor-pointer">
                          I agree to the terms and conditions *
                        </Label>
                        <p className="text-gray-600 mt-1">
                          I understand that this is a mock test and my performance will be recorded.
                          I agree not to use unfair means during the examination.
                        </p>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold text-lg"
                      disabled={isLoading || !agreeToTerms}
                    >
                      {isLoading ? "Processing..." : "Start Mock Test"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
