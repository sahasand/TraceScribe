import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText, Zap, Shield, ArrowRight, Sparkles, ChevronRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">TraceScribe</span>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild size="sm" className="gap-2">
              <Link href="/sign-up">
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="py-24 px-4 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-grid opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

          <div className="container mx-auto text-center max-w-4xl relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 animate-fade-in">
              <Sparkles className="h-4 w-4" />
              AI-Powered Document Generation
            </div>

            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 animate-fade-in-up">
              Clinical Trial Documents,{" "}
              <span className="gradient-text">Generated in Minutes</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              Upload your protocol and let AI generate compliant ICF, DMP, and SAP
              documents. Save weeks of manual work while maintaining regulatory quality.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <Button asChild size="lg" className="gap-2 shadow-glow h-12 px-8">
                <Link href="/sign-up">
                  Start Free Trial <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-8">
                <Link href="/dashboard">
                  View Demo
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">
                Why Choose TraceScribe?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Built for clinical research teams who demand speed without sacrificing compliance.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto stagger-children">
              <FeatureCard
                icon={<Zap className="h-6 w-6" />}
                title="AI-Powered Generation"
                description="Gemini AI extracts protocol data and generates documents in minutes, not weeks."
                gradient="from-amber-500 to-orange-500"
              />
              <FeatureCard
                icon={<Shield className="h-6 w-6" />}
                title="21 CFR Part 11 Compliant"
                description="Full audit trails and electronic signatures meet FDA regulatory requirements."
                gradient="from-emerald-500 to-teal-500"
              />
              <FeatureCard
                icon={<FileText className="h-6 w-6" />}
                title="Multiple Document Types"
                description="Generate ICF, DMP, and SAP documents from a single protocol upload."
                gradient="from-violet-500 to-purple-500"
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto p-8 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Streamline Your Clinical Trials?
              </h2>
              <p className="text-muted-foreground mb-8">
                Join clinical research teams saving hundreds of hours on document preparation.
              </p>
              <Button asChild size="lg" className="gap-2">
                <Link href="/sign-up">
                  Start Your Free Trial <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} TraceScribe. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="group bg-card rounded-xl p-6 shadow-card border transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1">
      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
