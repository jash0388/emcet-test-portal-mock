import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Download, KeyRound, ShieldCheck } from "lucide-react";

const ADMIN_CODE = "459137";

interface AdminDownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function AdminDownloadDialog({ open, onOpenChange }: AdminDownloadDialogProps) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
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
      const examTitleMap: Record<string, string> = {};
      if (examIds.length > 0) {
        const { data: exams } = await supabase
          .from("exams")
          .select("id, title")
          .in("id", examIds);
        (exams || []).forEach((e: any) => {
          examTitleMap[e.id] = e.title;
        });
      }

      const rows = submissions.map((s: any) => {
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
      downloadCsv(`Exam_Results_${today}.csv`, csv);

      toast({
        title: "Download Ready",
        description: `Exported ${rows.length} submission${rows.length === 1 ? "" : "s"}.`,
      });
      setCode("");
      onOpenChange(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: err?.message || "Could not fetch submissions.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-3">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <DialogTitle>Download All Results</DialogTitle>
          <DialogDescription>
            Enter the 6-digit access code to download every student's results as a spreadsheet.
          </DialogDescription>
        </DialogHeader>
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
                if (e.key === "Enter" && code.length === 6) handleDownload();
              }}
              className="h-14 text-2xl tracking-[0.5em] text-center font-mono font-bold"
              autoFocus
            />
          </div>
          <Button
            onClick={handleDownload}
            disabled={isLoading || code.length !== 6}
            className="w-full h-12 premium-gradient text-white font-bold text-base shadow-lg shadow-primary/20"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Preparing Download...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Download CSV</span>
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
