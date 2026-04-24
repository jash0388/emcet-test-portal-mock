import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Download, KeyRound, ShieldCheck, FileSpreadsheet } from "lucide-react";

const ADMIN_CODE = "459137";

interface AdminDownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ExamOption {
  id: string;
  title: string;
  count: number;
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(rows: Record<string, any>[], headers: { key: string; label: string }[]): string {
  const headerLine = headers.map((h) => csvEscape(h.label)).join(",");
  const lines = rows.map((row) =>
    headers.map((h) => csvEscape(row[h.key])).join(",")
  );
  return [headerLine, ...lines].join("\r\n");
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9-_]+/gi, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "Results";
}

export function AdminDownloadDialog({ open, onOpenChange }: AdminDownloadDialogProps) {
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"code" | "select">("code");
  const [isLoading, setIsLoading] = useState(false);
  const [exams, setExams] = useState<ExamOption[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("__all__");
  const [examTitleMap, setExamTitleMap] = useState<Record<string, string>>({});
  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);
  const { toast } = useToast();

  const reset = () => {
    setCode("");
    setStep("code");
    setExams([]);
    setSelectedExamId("__all__");
    setAllSubmissions([]);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleVerifyCode = async () => {
    if (code.trim() !== ADMIN_CODE) {
      toast({
        variant: "destructive",
        title: "Invalid Code",
        description: "The 6-digit access code is incorrect.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: submissions, error } = await supabase
        .from("exam_submissions")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      if (!submissions || submissions.length === 0) {
        toast({
          variant: "destructive",
          title: "No Results",
          description: "There are no submissions to download yet.",
        });
        setIsLoading(false);
        return;
      }

      const examIds = Array.from(new Set(submissions.map((s: any) => s.exam_id).filter(Boolean)));
      const titleMap: Record<string, string> = {};
      if (examIds.length > 0) {
        const { data: examsData } = await supabase
          .from("exams")
          .select("id, title")
          .in("id", examIds);
        (examsData || []).forEach((e: any) => {
          titleMap[e.id] = e.title;
        });
      }

      const counts: Record<string, number> = {};
      submissions.forEach((s: any) => {
        counts[s.exam_id] = (counts[s.exam_id] || 0) + 1;
      });

      const examOpts: ExamOption[] = examIds.map((id) => ({
        id,
        title: titleMap[id] || "(Unknown Exam)",
        count: counts[id] || 0,
      })).sort((a, b) => a.title.localeCompare(b.title));

      setAllSubmissions(submissions);
      setExamTitleMap(titleMap);
      setExams(examOpts);
      setStep("select");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Could Not Load",
        description: err?.message || "Failed to fetch submissions.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    const filtered =
      selectedExamId === "__all__"
        ? allSubmissions
        : allSubmissions.filter((s: any) => s.exam_id === selectedExamId);

    if (filtered.length === 0) {
      toast({
        variant: "destructive",
        title: "No Results",
        description: "No submissions found for this selection.",
      });
      return;
    }

    const rows = filtered.map((s: any) => {
      const candidate = (s.student_answers && s.student_answers.__candidate__) || {};
      const totalSeconds = s.time_used_seconds || 0;
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const percentage =
        s.total_marks > 0 ? `${Math.round((s.score / s.total_marks) * 100)}%` : "0%";
      return {
        student_name: candidate.student_name || s.student_name || "",
        student_phone: candidate.student_phone || s.student_phone || s.roll_number || "",
        father_name: candidate.father_name || s.father_name || "",
        father_phone: candidate.father_phone || s.father_phone || "",
        college: candidate.college || s.college || "",
        exam_title: examTitleMap[s.exam_id] || "",
        score: s.score ?? 0,
        total_marks: s.total_marks ?? 0,
        percentage,
        violations: s.violations ?? 0,
        time_spent: `${minutes}m ${seconds}s`,
        status: s.status || "",
        submitted_at: s.submitted_at
          ? new Date(s.submitted_at).toLocaleString()
          : "",
      };
    });

    const headers = [
      { key: "student_name", label: "Student Name" },
      { key: "student_phone", label: "Student Number" },
      { key: "father_name", label: "Father's Name" },
      { key: "father_phone", label: "Father's Number" },
      { key: "college", label: "College" },
      { key: "exam_title", label: "Exam Title" },
      { key: "score", label: "Score Obtained" },
      { key: "total_marks", label: "Total Marks" },
      { key: "percentage", label: "Percentage" },
      { key: "violations", label: "Violations" },
      { key: "time_spent", label: "Time Spent" },
      { key: "status", label: "Status" },
      { key: "submitted_at", label: "Submitted At" },
    ];

    const csv = buildCsv(rows, headers);
    const today = new Date().toISOString().slice(0, 10);
    const examLabel =
      selectedExamId === "__all__"
        ? "All_Exams"
        : sanitizeFilename(examTitleMap[selectedExamId] || "Exam");
    downloadCsv(`Exam_Results_${examLabel}_${today}.csv`, csv);

    toast({
      title: "Download Ready",
      description: `Exported ${rows.length} submission${rows.length === 1 ? "" : "s"}.`,
    });
    handleClose(false);
  };

  const totalAll = allSubmissions.length;
  const selectedCount =
    selectedExamId === "__all__"
      ? totalAll
      : allSubmissions.filter((s: any) => s.exam_id === selectedExamId).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-3">
            {step === "code" ? (
              <ShieldCheck className="w-6 h-6 text-white" />
            ) : (
              <FileSpreadsheet className="w-6 h-6 text-white" />
            )}
          </div>
          <DialogTitle>
            {step === "code" ? "Download Results" : "Choose Exam"}
          </DialogTitle>
          <DialogDescription>
            {step === "code"
              ? "Enter the 6-digit access code to view and download results."
              : "Pick an exam to download, or download all results in one file."}
          </DialogDescription>
        </DialogHeader>

        {step === "code" ? (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center space-x-2">
                <KeyRound className="w-3 h-3" />
                <span>Access Code</span>
              </label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="••••••"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && code.length === 6) handleVerifyCode();
                }}
                className="h-14 text-2xl tracking-[0.5em] text-center font-mono font-bold"
                autoFocus
              />
            </div>
            <Button
              onClick={handleVerifyCode}
              disabled={isLoading || code.length !== 6}
              className="w-full h-12 premium-gradient text-white font-bold text-base shadow-lg shadow-primary/20"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Verifying...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>Continue</span>
                </div>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Select Exam
              </label>
              <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                <SelectTrigger className="h-14">
                  <SelectValue placeholder="Choose an exam" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">
                    All Exams ({totalAll} submission{totalAll === 1 ? "" : "s"})
                  </SelectItem>
                  {exams.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.title} ({e.count} submission{e.count === 1 ? "" : "s"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700 font-medium">
              {selectedCount} submission{selectedCount === 1 ? "" : "s"} will be downloaded.
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setStep("code")}
                className="h-12 px-4 font-bold"
              >
                Back
              </Button>
              <Button
                onClick={handleDownload}
                disabled={selectedCount === 0}
                className="flex-1 h-12 premium-gradient text-white font-bold text-base shadow-lg shadow-primary/20"
              >
                <div className="flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Download CSV</span>
                </div>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
