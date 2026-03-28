import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAssessmentEngine } from "@/hooks/useAssessmentEngine";
import { Focus, AlertCircle } from "lucide-react";

interface SprintPromptModalProps {
  isOpen: boolean;
  functionName: string;
  categoryName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SprintPromptModal({
  isOpen,
  functionName,
  categoryName,
  onConfirm,
  onCancel,
}: SprintPromptModalProps) {
  const { getQuestionsByFunctionAndCategory } = useAssessmentEngine();

  const questions = getQuestionsByFunctionAndCategory(functionName, categoryName);
  const questionCount = questions.length;

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <Focus className="h-5 w-5 text-blue-600" />
            <AlertDialogTitle>Enter Focus Mode</AlertDialogTitle>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <p className="font-medium text-foreground">
              {functionName} → {categoryName}
            </p>
            <p className="text-sm text-muted-foreground">
              You are about to answer <span className="font-semibold">{questionCount}</span>{" "}
              assessment question{questionCount !== 1 ? "s" : ""} in this category.
            </p>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-700">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              In focus mode, you'll answer questions one at a time. Your progress is automatically
              saved. You can exit anytime and come back later.
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Start Assessment
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
