import { Wrench, Sparkles } from "lucide-react";

export default function CustomWorkPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-6">
        <Wrench className="h-10 w-10 text-primary" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Custom Work</h1>
      <p className="text-muted-foreground max-w-md mb-6">
        Request custom document generation, specialized analyses,
        or bespoke regulatory submissions tailored to your needs.
      </p>
      <div className="flex items-center gap-2 text-sm text-accent font-medium">
        <Sparkles className="h-4 w-4" />
        Coming Soon
      </div>
    </div>
  );
}
