import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { clearAllAppState } from "@/lib/clearAppState";
import {
  ArrowRight,
  BarChart3,
  AlertCircle,
  Archive,
  FileCheck,
  MessageSquare,
  Zap,
  FileText,
  Check,
  Shield,
  Zap as ZapIcon,
  Clock,
  Users,
  TrendingUp,
  RotateCw,
} from "lucide-react";

import { useEffect } from "react";

export default function Index() {
  // Auto-reset on first load if needed (check for reset query param or env flag)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Check if reset is requested via URL parameter
    if (params.has("reset")) {
      clearAllAppState();
      // Reload to clean state
      window.location.href = "/";
    }
  }, []);

  const handleReset = () => {
    if (confirm("Are you sure you want to reset the entire application? This will clear all assessments, remediation data, and evidence. This action cannot be undone.")) {
      // Navigate to reset route to trigger the clear and reload
      window.location.href = "/?reset=true";
    }
  };

  const features = [
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Gap Analysis",
      description: "Assess maturity levels against NIST CSF 2.0 and identify priority gaps",
    },
    {
      icon: <AlertCircle className="h-6 w-6" />,
      title: "Risk Management",
      description: "Identify, analyze, and track cyber risks with heat maps and scoring",
    },
    {
      icon: <Archive className="h-6 w-6" />,
      title: "Evidence Repository",
      description: "Centralized storage for all compliance artifacts and documentation",
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Policy Management",
      description: "Create, version, and approve policies with NIST mapping",
    },
    {
      icon: <FileCheck className="h-6 w-6" />,
      title: "Compliance Reports",
      description: "Auto-generate executive reports with full NIST CSF 2.0 coverage",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Improvement Tracking",
      description: "Manage remediation actions from identification to verification",
    },
  ];

  const benefits = [
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Audit Ready",
      description: "Know your compliance posture in real-time with audit readiness scoring",
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: "Save Time",
      description: "Automated workflows reduce manual compliance tasks by 70%",
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Team Collaboration",
      description: "Role-based access and real-time collaboration across departments",
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Track Progress",
      description: "Visualize maturity progression and improvement velocity",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-bold text-lg">CertifyGRC</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleReset}
              className="text-muted-foreground hover:text-foreground gap-1"
              title="Reset all data and start fresh"
            >
              <RotateCw className="h-4 w-4" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
            <Link to="/dashboard">
              <Button>Sign In</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                  Enterprise GRC Made Simple
                </h1>
                <p className="text-xl text-muted-foreground">
                  Achieve and maintain audit readiness with NIST CSF 2.0. Transform complex compliance
                  requirements into actionable workflows your team can execute.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Schedule Demo
                </Button>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <div className="flex items-center gap-3 text-sm">
                  <Check className="h-5 w-5 text-success" />
                  <span>NIST CSF 2.0 aligned</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Check className="h-5 w-5 text-success" />
                  <span>Real-time audit readiness scoring</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Check className="h-5 w-5 text-success" />
                  <span>154 compliance assessment questions</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Check className="h-5 w-5 text-success" />
                  <span>Enterprise-grade security & collaboration</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-3xl" />
              <div className="relative rounded-2xl border border-border/50 bg-card p-8 shadow-lg">
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Audit Readiness Score</p>
                    <div className="text-5xl font-bold text-primary">73%</div>
                    <div className="text-sm text-success mt-2">↑ 12% improvement this quarter</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-secondary/10 p-4">
                      <p className="text-xs font-medium text-muted-foreground">Risks Identified</p>
                      <p className="text-2xl font-bold">12</p>
                      <p className="text-xs text-destructive mt-1">3 critical</p>
                    </div>
                    <div className="rounded-lg bg-secondary/10 p-4">
                      <p className="text-xs font-medium text-muted-foreground">Gap Items</p>
                      <p className="text-2xl font-bold">8</p>
                      <p className="text-xs text-warning mt-1">2 high priority</p>
                    </div>
                    <div className="rounded-lg bg-secondary/10 p-4">
                      <p className="text-xs font-medium text-muted-foreground">Evidence Items</p>
                      <p className="text-2xl font-bold">47</p>
                      <p className="text-xs text-muted-foreground mt-1">All current</p>
                    </div>
                    <div className="rounded-lg bg-secondary/10 p-4">
                      <p className="text-xs font-medium text-muted-foreground">Active Actions</p>
                      <p className="text-2xl font-bold">14</p>
                      <p className="text-xs text-muted-foreground mt-1">On track</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 md:px-6 bg-secondary/5 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Comprehensive Compliance Platform</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              All the tools you need to achieve, maintain, and demonstrate audit readiness
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="rounded-lg border border-border/50 p-6 hover:border-border transition-colors">
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Why Choose CertifyGRC</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built for modern security and compliance teams
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex gap-6">
                <div className="h-12 w-12 rounded-lg bg-accent/10 text-accent flex items-center justify-center flex-shrink-0 mt-1">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-6 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Audit Ready?</h2>
            <p className="text-lg opacity-90">
              Start your compliance journey today with CertifyGRC
            </p>
          </div>

          <Link to="/dashboard">
            <Button size="lg" variant="secondary" className="gap-2">
              Access Platform <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>

          <p className="text-sm opacity-75">
            No credit card required • Free trial • Full feature access
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/5 py-8 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div>© 2024 CertifyGRC. All rights reserved.</div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
