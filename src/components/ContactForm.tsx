"use client";

import { useState } from "react";
import { contact } from "../../actions/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface FormData {
  name: string;
  email: string;
  message: string;
}

interface FormErrors {
  name?: string[];
  email?: string[];
  message?: string[];
}

export default function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrors({});

    try {
      const result = await contact(formData);

      if (result.error) {
        if (result.issues) {
          setErrors(result.issues as FormErrors);
        }
        setSubmitStatus({
          type: "error",
          message: result.error,
        });
      } else {
        setSubmitStatus({
          type: "success",
          message: result.success || "Message sent successfully!",
        });
        setFormData({ name: "", email: "", message: "" });
      }
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-gray-300 text-sm font-medium">
            Name
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Your name"
            className="bg-gray-900/30 border-gray-700 text-white placeholder-gray-500 focus:border-red-500 focus:ring-red-500/20 h-12"
            required
          />
          {errors.name && (
            <p className="text-red-400 text-sm">{errors.name[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-300 text-sm font-medium">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="your@email.com"
            className="bg-gray-900/30 border-gray-700 text-white placeholder-gray-500 focus:border-red-500 focus:ring-red-500/20 h-12"
            required
          />
          {errors.email && (
            <p className="text-red-400 text-sm">{errors.email[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="message" className="text-gray-300 text-sm font-medium">
            Message
          </Label>
          <Textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            placeholder="Tell us about your project..."
            rows={5}
            className="bg-gray-900/30 border-gray-700 text-white placeholder-gray-500 focus:border-red-500 focus:ring-red-500/20 resize-none"
            required
          />
          {errors.message && (
            <p className="text-red-400 text-sm">{errors.message[0]}</p>
          )}
        </div>

        {submitStatus && (
          <div
            className={`p-4 rounded-lg ${
              submitStatus.type === "success"
                ? "bg-green-900/20 border border-green-700/50 text-green-300"
                : "bg-red-900/20 border border-red-700/50 text-red-300"
            }`}
          >
            {submitStatus.message}
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-white border text-black hover:bg-black hover:text-zinc-100 hover:border-zinc-100 font-medium py-3 px-6 rounded-lg transition-all duration-200 h-12"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending...
            </div>
          ) : (
            "Send Message"
          )}
        </Button>
      </form>
    </div>
  );
}
