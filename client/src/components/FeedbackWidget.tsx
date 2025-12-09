/**
 * Feedback Widget - Floating feedback button with modal form
 * Allows users to submit feedback directly from any page
 */

import { useState } from "react";
import { MessageSquare, X, Send, Star } from "lucide-react";
import { trpc } from "../lib/trpc";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useToast } from "../hooks/use-toast";

type FeedbackCategory = "Bug" | "Feature Request" | "General" | "Complaint" | "Praise" | "Other";

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>("General");
  const [rating, setRating] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  const { toast } = useToast();
  const submitFeedback = trpc.feedback.submit.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (title.length < 3) {
      toast({
        title: "Title too short",
        description: "Please provide a title with at least 3 characters",
        variant: "destructive",
      });
      return;
    }

    if (message.length < 10) {
      toast({
        title: "Message too short",
        description: "Please provide more details (at least 10 characters)",
        variant: "destructive",
      });
      return;
    }

    try {
      // Collect metadata
      const metadata = JSON.stringify({
        page: window.location.pathname,
        url: window.location.href,
        userAgent: navigator.userAgent,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        timestamp: new Date().toISOString(),
      });

      await submitFeedback.mutateAsync({
        category,
        rating: rating || undefined,
        title,
        message,
        metadata,
      });

      toast({
        title: "Feedback submitted!",
        description: "Thank you for helping us improve. We'll review your feedback shortly.",
      });

      // Reset form
      setCategory("General");
      setRating(null);
      setTitle("");
      setMessage("");
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error submitting feedback",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const renderStarRating = () => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(null)}
            className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded"
          >
            <Star
              className={`w-6 h-6 ${
                star <= (hoveredStar ?? rating ?? 0)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
        {rating && (
          <span className="ml-2 text-sm text-muted-foreground">
            {rating} star{rating !== 1 && "s"}
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Floating Feedback Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="Send Feedback"
      >
        <MessageSquare className="w-5 h-5" />
        <span className="font-medium hidden sm:inline">Feedback</span>
      </button>

      {/* Feedback Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Send Us Feedback</DialogTitle>
            <DialogDescription>
              We'd love to hear your thoughts, suggestions, or issues. Your feedback helps us improve!
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Category Selection */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(val) => setCategory(val as FeedbackCategory)}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General Feedback</SelectItem>
                  <SelectItem value="Bug">🐛 Bug Report</SelectItem>
                  <SelectItem value="Feature Request">💡 Feature Request</SelectItem>
                  <SelectItem value="Praise">❤️ Praise</SelectItem>
                  <SelectItem value="Complaint">😕 Complaint</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rating (Optional) */}
            <div className="space-y-2">
              <Label>Rate Your Experience (Optional)</Label>
              {renderStarRating()}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Brief summary of your feedback"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={255}
                required
              />
              <p className="text-xs text-muted-foreground">
                {title.length}/255 characters
              </p>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">
                Details <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="message"
                placeholder="Tell us more about your feedback..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[120px]"
                maxLength={5000}
                required
              />
              <p className="text-xs text-muted-foreground">
                {message.length}/5000 characters (min 10)
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={submitFeedback.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitFeedback.isPending}>
                {submitFeedback.isPending ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Feedback
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
