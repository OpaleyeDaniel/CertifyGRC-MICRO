// import { useState } from "react";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";
// import { Button } from "@/components/ui/button";
// import { RotateCcw } from "lucide-react";
// import { useResetAssessmentLifecycle } from "@/hooks/useResetAssessmentLifecycle";

// interface ResetAssessmentDialogProps {
//   /**
//    * Trigger button variant (optional)
//    */
//   variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  
//   /**
//    * Show trigger button or just expose dialog state
//    */
//   showTrigger?: boolean;
  
//   /**
//    * Custom trigger text
//    */
//   triggerText?: string;
  
//   /**
//    * Callback when reset is successful
//    */
//   onResetSuccess?: () => void;
// }

// /**
//  * ResetAssessmentDialog Component
//  * 
//  * Provides a confirmation dialog and button to reset the entire assessment lifecycle.
//  * Clears:
//  * - All assessment answers and evidence
//  * - All remediation records and status
//  * - All risk assessments
//  * - All auditor reviews, comments, and approvals
//  * 
//  * After confirmation, user is redirected to the assessment start page.
//  * 
//  * Usage:
//  * <ResetAssessmentDialog showTrigger={true} />
//  * 
//  * Or control dialog state manually:
//  * const [open, setOpen] = useState(false);
//  * return (
//  *   <>
//  *     <Button onClick={() => setOpen(true)}>Reset</Button>
//  *     <ResetAssessmentDialog open={open} onOpenChange={setOpen} />
//  *   </>
//  * );
//  */
// export function ResetAssessmentDialog({
//   variant = "destructive",
//   showTrigger = true,
//   triggerText = "Reset to Baseline",
//   onResetSuccess,
// }: ResetAssessmentDialogProps) {
//   const [open, setOpen] = useState(false);
//   const [isResetting, setIsResetting] = useState(false);
//   const { resetAssessmentLifecycle } = useResetAssessmentLifecycle();

//   const handleConfirmReset = async () => {
//     setIsResetting(true);
//     try {
//       // Execute reset with empty callbacks (hooks will handle their own state via effects)
//       const success = await resetAssessmentLifecycle({
//         onResetAssessmentEngine: () => {}, // State will be reset via useEffect in hooks
//         onResetAuditorVerification: () => {},
//       });

//       if (success) {
//         setOpen(false);
//         onResetSuccess?.();
//       }
//     } finally {
//       setIsResetting(false);
//     }
//   };

//   return (
//     <>
//       {showTrigger && (
//         <Button
//           variant={variant}
//           size="sm"
//           onClick={() => setOpen(true)}
//           className="gap-2"
//         >
//           <RotateCcw className="h-4 w-4" />
//           {triggerText}
//         </Button>
//       )}

//       <AlertDialog open={open} onOpenChange={setOpen}>
//         <AlertDialogContent className="max-w-md">
//           <AlertDialogHeader>
//             <AlertDialogTitle className="text-lg font-semibold">
//               Reset Assessment to Baseline?
//             </AlertDialogTitle>
//             <AlertDialogDescription className="space-y-3 text-sm mt-3">
//               <p>
//                 This action will permanently clear all data from your current assessment, including:
//               </p>
//               <ul className="list-disc list-inside space-y-1 ml-1 text-muted-foreground">
//                 <li>
//                   <strong>Evidence:</strong> All uploaded files and metadata will be removed
//                 </li>
//                 <li>
//                   <strong>Remediation:</strong> Gap remediation records and status will be cleared
//                 </li>
//                 <li>
//                   <strong>Risk Assessments:</strong> All risk records and timestamps will be removed
//                 </li>
//                 <li>
//                   <strong>Comments & Review:</strong> Auditor feedback, approval statuses, and timestamps will be wiped
//                 </li>
//               </ul>
//               <p className="pt-2 font-semibold text-destructive">
//                 This action cannot be undone. You will be able to start a fresh assessment afterward.
//               </p>
//             </AlertDialogDescription>
//           </AlertDialogHeader>

//           <AlertDialogFooter>
//             <AlertDialogCancel disabled={isResetting}>
//               Cancel
//             </AlertDialogCancel>
//             <AlertDialogAction
//               onClick={handleConfirmReset}
//               disabled={isResetting}
//               className="bg-destructive hover:bg-destructive/90"
//             >
//               {isResetting ? "Resetting..." : "Reset All Data"}
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </>
//   );
// }

// export default ResetAssessmentDialog;
