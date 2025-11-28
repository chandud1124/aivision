import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  variant?: "default" | "success" | "warning" | "destructive";
}

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  variant = "default" 
}: StatCardProps) {
  const variantStyles = {
    default: "border-border",
    success: "border-success/30 bg-gradient-to-br from-success/5 to-transparent",
    warning: "border-warning/30 bg-gradient-to-br from-warning/5 to-transparent",
    destructive: "border-destructive/30 bg-gradient-to-br from-destructive/5 to-transparent",
  };

  return (
    <Card className={cn("shadow-md transition-all hover:shadow-lg", variantStyles[variant])}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {trend && (
              <p className={cn(
                "text-xs font-medium",
                trend.positive ? "text-success" : "text-destructive"
              )}>
                {trend.positive ? "↑" : "↓"} {trend.value}
              </p>
            )}
          </div>
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-lg",
            variant === "success" && "bg-success/10",
            variant === "warning" && "bg-warning/10",
            variant === "destructive" && "bg-destructive/10",
            variant === "default" && "bg-primary/10"
          )}>
            <Icon className={cn(
              "h-6 w-6",
              variant === "success" && "text-success",
              variant === "warning" && "text-warning",
              variant === "destructive" && "text-destructive",
              variant === "default" && "text-primary"
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
