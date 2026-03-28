import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, X } from "lucide-react";
import { CommentBubble } from "@/hooks/useAuditorVerification";
import { formatDistanceToNow } from "date-fns";

interface AuditorCommentSectionProps {
  sectionLabel: string;
  comments: CommentBubble[];
  onAddComment: (text: string) => void;
  onRemoveComment: (commentId: string) => void;
}

export function AuditorCommentSection({
  sectionLabel,
  comments,
  onAddComment,
  onRemoveComment,
}: AuditorCommentSectionProps) {
  const [commentText, setCommentText] = useState("");

  const handleSend = () => {
    if (commentText.trim()) {
      onAddComment(commentText);
      setCommentText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSend();
    }
  };

  return (
    <div className="space-y-3">
      {/* Comments Bubble List */}
      {comments.length > 0 && (
        <div className="space-y-2">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200 relative group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 break-words">{comment.text}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(comment.timestamp), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <button
                  onClick={() => onRemoveComment(comment.id)}
                  className="p-1 hover:bg-blue-200 rounded transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                  title="Remove comment"
                >
                  <X className="h-4 w-4 text-blue-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment Input */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-700">{sectionLabel}</label>
        <div className="flex gap-2">
          <Textarea
            placeholder="Add your auditor comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-xs resize-none"
            rows={2}
          />
          <Button
            onClick={handleSend}
            disabled={!commentText.trim()}
            size="sm"
            className="flex-shrink-0 gap-1 bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
