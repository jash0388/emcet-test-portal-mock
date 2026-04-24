import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CheckCircle2, Info, User } from "lucide-react";
import { QuestionContent } from "@/components/QuestionContent";

interface ReviewCardProps {
  index: number;
  question: string;
  marks: number;
  studentAnswer: string | undefined;
  correctAnswer: string | null;
  isCorrect: boolean;
  explanation?: string | null;
}

const ReviewCardInner: React.FC<ReviewCardProps> = ({
  index,
  question,
  marks,
  studentAnswer,
  correctAnswer,
  isCorrect,
  explanation,
}) => {
  return (
    <Card className="border-none shadow-2xl bg-white/90 overflow-hidden group">
      <div
        className={`h-1.5 w-full ${
          studentAnswer ? (isCorrect ? "bg-emerald-500" : "bg-rose-500") : "bg-muted"
        }`}
      />
      <CardHeader className="p-8 pb-4">
        <div className="flex justify-between items-start mb-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-1 rounded-lg border border-primary/10">
            Question {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-xs font-bold text-muted-foreground">{marks} Points</span>
        </div>
        <div className="text-xl font-bold leading-relaxed">
          <QuestionContent content={question} />
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-4 space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div
            className={`p-4 rounded-2xl border ${
              studentAnswer
                ? isCorrect
                  ? "bg-emerald-500/[0.03] border-emerald-500/10"
                  : "bg-rose-500/[0.03] border-rose-500/10"
                : "bg-muted/10 border-border"
            }`}
          >
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 flex items-center">
              <User className="w-3 h-3 mr-1.5" /> Your Submission
            </p>
            <div
              className={`font-bold ${
                studentAnswer
                  ? isCorrect
                    ? "text-emerald-700"
                    : "text-rose-700"
                  : "text-muted-foreground"
              }`}
            >
              {studentAnswer ? <QuestionContent content={studentAnswer} /> : "No Response"}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-primary/[0.03] border border-primary/10">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary mb-2 flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-1.5" /> Ideal Outcome
            </p>
            <div className="font-bold text-primary">
              <QuestionContent content={correctAnswer || ""} />
            </div>
          </div>
        </div>

        {explanation && (
          <div className="p-4 rounded-2xl bg-surface-sunken/50 border-dashed border flex items-start space-x-3">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                Analytical Insight
              </p>
              <div className="text-sm text-muted-foreground leading-relaxed italic">
                <QuestionContent content={explanation} />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const ReviewCard = React.memo(ReviewCardInner);
